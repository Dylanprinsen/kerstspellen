"""
Haalt voor iedereen in data/ een vrije foto van Wikipedia (Wikimedia Commons),
snijdt die vierkant bij rond het gezicht en zet hem in img/personen/.
Schrijft daarna data/fotos.js (naam -> bestand) en img/personen/BRONNEN.md.

Gebruik: python3 tools/haal_fotos.py            (alleen ontbrekende foto's)
         python3 tools/haal_fotos.py --opnieuw "Naam"   (één foto opnieuw)

Een foto klopt niet? Zet de juiste Wikipedia-pagina of het Commons-bestand in
OVERRIDES en draai het script opnieuw met --opnieuw "Naam".
"""
import io
import json
import pathlib
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.error
import urllib.request

import cv2
import numpy as np
from PIL import Image, ImageOps

MAP = pathlib.Path(__file__).resolve().parent.parent
FOTOMAP = MAP / "img" / "personen"
UA = {"User-Agent": "kerstspellen-fotoscript/1.0 (familiespel)"}
MAAT = 480

# naam -> "en:Pagina", "nl:Pagina" of "File:Bestand.jpg"
OVERRIDES = {
    'Dwayne "The Rock" Johnson': "en:Dwayne Johnson",
    "Nikkie de Jager": "en:NikkieTutorials",
    "Snelle": "nl:Snelle",
    "Kalvijn": "nl:Kalvijn",
    "Famke Louise": "nl:Famke Louise",
    "Bram Krikke": "nl:Bram Krikke",
    "Monica Geuze": "nl:Monica Geuze",
    "Dylan Haegens": "nl:Dylan Haegens",
    "Enzo Knol": "nl:Enzo Knol",
    "Davina Michelle": "nl:Davina Michelle",
    "Joost Klein": "nl:Joost Klein",
    "Yolanthe Cabau": "nl:Yolanthe Cabau",
    # Hoofdfoto op Wikipedia was niet goed bruikbaar (meerdere mensen, gezicht te klein):
    "Matthijs de Ligt": "File:Deligt-juventus-2019 (cropped).jpg",
    "Dorian van Rijsselberghe": "File:Dorian van Rijsselberghe Rio 2016.jpg",
}


def namen():
    """Alle personen uit de data-bestanden (Instagram, medailles, Wie ben ik?-sporters)."""
    gezien = []
    for bestand in ["instagram.js", "medailles.js"]:
        tekst = (MAP / "data" / bestand).read_text()
        for m in re.finditer(r"naam: '((?:[^'\\]|\\.)*)'", tekst):
            gezien.append(m.group(1))
    tekst = (MAP / "data" / "wie-ben-ik.js").read_text()
    blok = tekst.split("sporters:")[1].split("uitbeelden:")[0]
    blok = blok.split("kaarten:")[1]
    gezien += re.findall(r"'((?:[^'\\]|\\.)*)'", blok)
    uniek = []
    for n in gezien:
        if n not in uniek:
            uniek.append(n)
    return uniek


def slug(naam):
    s = unicodedata.normalize("NFKD", naam).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def haal(url):
    """Download met pauze en herhaalpogingen (Wikimedia remt bij te veel verzoeken)."""
    for poging in range(5):
        time.sleep(0.8)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or poging == 4:
                raise
            time.sleep(15 * (poging + 1))


def haal_json(url):
    return json.loads(haal(url))


def pagina_foto(taal, titel):
    """Geeft (url_van_bestand, bestandsnaam, paginalink) van de hoofdfoto, of None."""
    q = urllib.parse.urlencode({
        "action": "query", "titles": titel, "prop": "pageimages|pageprops", "piprop": "thumbnail|name",
        "pithumbsize": 500, "format": "json", "redirects": 1,
    })
    data = haal_json(f"https://{taal}.wikipedia.org/w/api.php?{q}")
    for p in data.get("query", {}).get("pages", {}).values():
        if "disambiguation" in p.get("pageprops", {}):
            return None
        if "thumbnail" in p:
            link = f"https://{taal}.wikipedia.org/wiki/" + urllib.parse.quote(p["title"].replace(" ", "_"))
            return p["thumbnail"]["source"], p.get("pageimage", ""), link
    return None


def commons_foto(bestand):
    q = urllib.parse.urlencode({
        "action": "query", "titles": bestand, "prop": "imageinfo", "iiprop": "url",
        "iiurlwidth": 500, "format": "json",
    })
    data = haal_json(f"https://commons.wikimedia.org/w/api.php?{q}")
    for p in data["query"]["pages"].values():
        info = p["imageinfo"][0]
        return info["thumburl"], bestand.replace("File:", ""), info["descriptionurl"]
    return None


def zoek(naam):
    o = OVERRIDES.get(naam)
    if o and o.startswith("File:"):
        return commons_foto(o)
    pogingen = [o.split(":", 1)] if o else []
    pogingen += [["en", naam], ["nl", naam]]
    for taal, titel in pogingen:
        r = pagina_foto(taal, titel)
        if r:
            return r
    return None


MODEL = MAP / "tools" / ".cache" / "yunet.onnx"
MODEL_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"


def gezichten(img):
    """Gezichten als (x, y, b, h) met OpenCV YuNet."""
    if not MODEL.exists():
        MODEL.parent.mkdir(exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    rgb = np.array(img.convert("RGB"))
    det = cv2.FaceDetectorYN.create(str(MODEL), "", (rgb.shape[1], rgb.shape[0]), 0.75)
    _, res = det.detect(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    return [] if res is None else [tuple(r[:4]) for r in res]


def vierkant(img):
    """Vierkant uitsnijden met het (grootste) gezicht in beeld, of bovenaan het midden."""
    w, h = img.size
    gevonden = gezichten(img)
    if gevonden:
        x, y, fw, fh = max(gevonden, key=lambda g: g[2] * g[3])
        cx, cy = x + fw / 2, y + fh / 2
        zijde = min(w, h, max(fw * 2.6, min(w, h) * 0.45))
    else:
        cx, cy = w / 2, min(h / 2, w / 2 + h * 0.05)
        zijde = min(w, h)
    links = int(max(0, min(w - zijde, cx - zijde / 2)))
    boven = int(max(0, min(h - zijde, cy - zijde * 0.45)))
    return img.crop((links, boven, links + int(zijde), boven + int(zijde))).resize((MAAT, MAAT), Image.LANCZOS)


def main():
    FOTOMAP.mkdir(parents=True, exist_ok=True)
    bronnen_pad = FOTOMAP / "bronnen.json"
    bronnen = json.loads(bronnen_pad.read_text()) if bronnen_pad.exists() else {}
    opnieuw = set(sys.argv[sys.argv.index("--opnieuw") + 1:]) if "--opnieuw" in sys.argv else set()

    for naam in namen():
        pad = FOTOMAP / (slug(naam) + ".jpg")
        if pad.exists() and naam not in opnieuw and naam in bronnen:
            continue
        try:
            r = zoek(naam)
            if not r:
                print("GEEN FOTO:", naam)
                bronnen.pop(naam, None)
                continue
            url, bestand, link = r
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(haal(url)))).convert("RGB")
            vierkant(img).save(pad, "JPEG", quality=82, optimize=True)
            bronnen[naam] = {"bestand": pad.name, "commons": bestand, "pagina": link}
            print("ok:", naam, "<-", bestand)
        except Exception as e:  # netwerk of vreemd plaatje: overslaan, later opnieuw
            print("FOUT:", naam, e)

    bronnen_pad.write_text(json.dumps(bronnen, ensure_ascii=False, indent=1, sort_keys=True))
    fotos = {n: "img/personen/" + b["bestand"] for n, b in sorted(bronnen.items())}
    (MAP / "data" / "fotos.js").write_text(
        "/* Foto's van personen (Wikimedia Commons). Gemaakt door tools/haal_fotos.py, niet met de hand aanpassen. */\n"
        "window.KERST_DATA = window.KERST_DATA || {};\n"
        "KERST_DATA.fotos = " + json.dumps(fotos, ensure_ascii=False, indent=1) + ";\n")
    regels = ["# Bronnen foto's", "", "Alle foto's komen van Wikimedia Commons (vrije licenties, meestal CC BY-SA).",
              "Per persoon het bestand op Commons; daar staan de maker en de licentie.", ""]
    for n, b in sorted(bronnen.items()):
        regels.append(f"- {n}: [{b['commons']}](https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(b['commons'].replace(' ', '_'))})")
    (FOTOMAP / "BRONNEN.md").write_text("\n".join(regels) + "\n")
    print(len(fotos), "foto's")


if __name__ == "__main__":
    main()
