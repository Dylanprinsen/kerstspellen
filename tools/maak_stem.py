"""
Maakt de voice-over voor het uitlegfilmpje en de "Lees voor"-knop bij elk spel.
Gebruikt een natuurlijke Nederlandse stem (Microsoft Edge neural TTS, gratis via edge-tts).

Eenmalig:  pip3 install edge-tts
Gebruik:   python3 tools/maak_stem.py            (alleen nieuwe/gewijzigde teksten)
           EDGE_TTS=/pad/naar/edge-tts python3 tools/maak_stem.py

Het script opent de site, vraagt alle voorleesteksten op (alleVoorleesTeksten() in js/app.js),
maakt per tekst een mp3 in media/stem/ en schrijft data/stem.js (tekst -> bestand).
Teksten zonder opname (bijv. na hernoemen) leest het apparaat zelf voor.
"""
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import tempfile

from playwright.sync_api import sync_playwright

MAP = pathlib.Path(__file__).resolve().parent.parent
STEMMAP = MAP / "media" / "stem"
STEM = "nl-NL-FennaNeural"   # andere opties: nl-NL-ColetteNeural, nl-NL-MaartenNeural
SNELHEID = "-6%"
TOONHOOGTE = "+0Hz"


def teksten():
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        pg = b.new_page()
        pg.goto((MAP / "index.html").as_uri())
        pg.evaluate("localStorage.clear()")
        pg.reload()
        lijst = pg.evaluate("alleVoorleesTeksten()")
        b.close()
    return list(dict.fromkeys(lijst))


def main():
    tts = os.environ.get("EDGE_TTS") or shutil.which("edge-tts")
    if not tts:
        raise SystemExit("edge-tts niet gevonden. Installeer met: pip3 install edge-tts")
    STEMMAP.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for tekst in teksten():
        sleutel = hashlib.sha1(f"{STEM}|{SNELHEID}|{TOONHOOGTE}|{tekst}".encode()).hexdigest()[:12]
        pad = STEMMAP / f"{sleutel}.mp3"
        if not pad.exists():
            with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
                f.write(tekst)
            subprocess.run([tts, "--voice", STEM, f"--rate={SNELHEID}", f"--pitch={TOONHOOGTE}",
                            "--file", f.name, "--write-media", str(pad)], check=True, capture_output=True)
            os.unlink(f.name)
            print("nieuw:", tekst[:70])
        manifest[tekst] = f"media/stem/{pad.name}"
    # Oude opnames opruimen.
    for oud in STEMMAP.glob("*.mp3"):
        if f"media/stem/{oud.name}" not in manifest.values():
            oud.unlink()
    (MAP / "data" / "stem.js").write_text(
        "/* Voice-over (gemaakt door tools/maak_stem.py, niet met de hand aanpassen). Stem: " + STEM + " */\n"
        "window.KERST_DATA = window.KERST_DATA || {};\n"
        "KERST_DATA.stem = " + json.dumps(manifest, ensure_ascii=False, indent=1) + ";\n")
    print(len(manifest), "opnames")


if __name__ == "__main__":
    main()
