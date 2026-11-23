import sys
# Speelt een hele avond door: teams, uitleg, teamkeuze, alle spellen, tussenstand, finale.
# Gebruik: python3 tests/test_spel.py <map-voor-screenshots> [url]
from playwright.sync_api import sync_playwright
import json
import pathlib
URL = sys.argv[2] if len(sys.argv) > 2 else (pathlib.Path(__file__).resolve().parent.parent / "index.html").as_uri()
OUT = sys.argv[1]
fouten = []
KIES = """(goed) => {
  const n = [...document.querySelectorAll('.persoon .naam')].map(e=>e.textContent);
  const it = KERST_DATA.instagram.items;
  const l = it.find(i=>i.naam===n[0]).waarde, r = it.find(i=>i.naam===n[1]).waarde;
  if (r === l) return 'hoger';
  const juist = r > l ? 'hoger' : 'lager';
  return goed ? juist : (juist === 'hoger' ? 'lager' : 'hoger'); }"""
STAND = "JSON.stringify([0,1,2].map(i => Stand.totaal(i)))"


def klik(pg, sel, wacht=250):
    pg.click(sel)
    pg.wait_for_timeout(wacht)


def schiet(pg, naam, heel=False):
    pg.screenshot(path=f"{OUT}/{naam}.png", full_page=heel)


def hoger_lager(pg, team, aantal):
    klik(pg, f"[data-actie=kies][data-team='{team}']")
    klik(pg, "[data-actie=verder]")
    for k in range(aantal):
        if k == 1 and team == 1:
            schiet(pg, "05_hl_vraag")
        pg.click(f"[data-actie={pg.evaluate(KIES, True)}]")
        pg.wait_for_timeout(2900 if k < aantal - 1 or aantal < 7 else 2400)
    if aantal < 7:
        pg.click(f"[data-actie={pg.evaluate(KIES, False)}]")
        pg.wait_for_timeout(3300)


def f1(pg, team, tikken):
    """tikken: per start een lijst (vak, ms na GO) of (vak, 'vals')."""
    klik(pg, f"[data-actie=kies][data-team='{team}']")
    klik(pg, "[data-actie=verder]")
    for s, start in enumerate(tikken):
        for vak, t in start:
            if t == 'vals':
                pg.wait_for_timeout(2000)
                pg.dispatch_event(f'[data-vak="{vak}"]', 'pointerdown')
        pg.wait_for_selector(".race-status.go", timeout=12000)
        for vak, t in sorted([x for x in start if x[1] != 'vals'], key=lambda x: x[1]):
            pg.wait_for_timeout(t)
            pg.dispatch_event(f'[data-vak="{vak}"]', 'pointerdown')
        pg.wait_for_timeout(2400)
        if team == 0 and s == 0:
            schiet(pg, "09_f1_na_start")
        pg.click("#na-race button")
        pg.wait_for_timeout(300)


def wie_ben_ik(pg, team, zones, foto=False):
    klik(pg, f"[data-actie=kies][data-team='{team}']")
    klik(pg, "[data-actie=verder]")
    pg.wait_for_timeout(3300)
    for z in zones:
        pg.dispatch_event(f'[data-zone="{z}"]', 'pointerdown')
        pg.wait_for_timeout(250)
    if foto:
        schiet(pg, "12_wbi_spel")
    pg.wait_for_selector("[data-actie=verder]", timeout=40000)
    pg.wait_for_timeout(300)


with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": 1024, "height": 768}, has_touch=True)
    pg.on("pageerror", lambda e: fouten.append(str(e)))
    pg.on("dialog", lambda d: d.accept())
    pg.goto(URL)
    pg.evaluate("""localStorage.clear();
      localStorage.setItem('kerst.film.geluid', 'false');
      localStorage.setItem('kerst.inst.startlichten', JSON.stringify({starts: 2}));
      localStorage.setItem('kerst.inst.wie-ben-ik', JSON.stringify({duur: 30}));""")
    pg.reload(); pg.wait_for_timeout(600)
    schiet(pg, "01_home")
    schiet(pg, "01_home_heel", heel=True)
    print("foto's kapot:", pg.evaluate("[...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src)"))
    # Filmpje
    klik(pg, ".film-groot-play", 1800); schiet(pg, "02_film_1")
    pg.wait_for_timeout(13500); schiet(pg, "02_film_3")
    pg.wait_for_timeout(5500); schiet(pg, "02_film_4")
    pg.click(".film-balk [data-film=speel]")
    # Start: teams zijn leeg, dus eerst teams invullen
    klik(pg, "[data-actie=verder]")
    leden = [["Oma", "Dylan", "Lotte"], ["Opa", "Papa", "Sem"], ["Mama", "Tante Ans", "Noor"]]
    for i, namen in enumerate(leden):
        for n in namen:
            sel = f"form[data-team='{i}'] input"
            pg.fill(sel, n); pg.press(sel, "Enter")
    schiet(pg, "03_teams")
    klik(pg, "[data-actie=klaar]")
    # Spel 1: Hoger of lager. Team Groen begint (niet op volgorde).
    schiet(pg, "04_intro_hl")
    klik(pg, "[data-actie=verder]")
    schiet(pg, "04_teamkeuze")
    hoger_lager(pg, 1, 2)
    schiet(pg, "06_hl_beurt_klaar")
    klik(pg, "[data-actie=verder]")
    schiet(pg, "07_teamkeuze_1_klaar")
    hoger_lager(pg, 0, 7); klik(pg, "[data-actie=verder]")
    hoger_lager(pg, 2, 0); klik(pg, "[data-actie=verder]")
    schiet(pg, "08_uitslag_hl", heel=True)
    print("na HL:", pg.evaluate(STAND))
    # Spel 2: F1 per team, 2 starts
    klik(pg, "[data-actie=verder]"); schiet(pg, "08_intro_f1")
    klik(pg, "[data-actie=verder]")
    f1(pg, 0, [[(0, 200), (1, 260), (2, 330)], [(0, 210), (1, 'vals'), (2, 300)]])
    schiet(pg, "10_f1_team_klaar")
    klik(pg, "[data-actie=verder]")
    f1(pg, 2, [[(0, 250), (1, 250), (2, 250)], [(0, 250), (1, 250), (2, 250)]]); klik(pg, "[data-actie=verder]")
    f1(pg, 1, [[(0, 180), (1, 190), (2, 200)], [(0, 180), (1, 190), (2, 200)]]); klik(pg, "[data-actie=verder]")
    schiet(pg, "11_uitslag_f1", heel=True)
    print("na F1:", pg.evaluate(STAND))
    # Spel 3: Wie ben ik? (30 seconden)
    klik(pg, "[data-actie=verder]"); schiet(pg, "11_intro_wbi")
    klik(pg, "[data-actie=verder]")
    wie_ben_ik(pg, 2, ["goed", "goed", "pas", "goed"], foto=True)
    schiet(pg, "13_wbi_klaar"); klik(pg, "[data-actie=verder]")
    wie_ben_ik(pg, 0, ["goed"]); klik(pg, "[data-actie=verder]")
    wie_ben_ik(pg, 1, ["pas", "goed", "goed"]); klik(pg, "[data-actie=verder]")
    schiet(pg, "14_uitslag_wbi", heel=True)
    print("na WBI:", pg.evaluate(STAND))
    klik(pg, "[data-actie=finale]", 1500); schiet(pg, "15_finale")
    klik(pg, "[data-actie=stand]"); schiet(pg, "16_stand")
    klik(pg, "[data-actie=terug]"); klik(pg, "[data-actie=home]", 600)
    schiet(pg, "17_home_na_afloop", heel=True)
    klik(pg, "[data-actie=instellingen]"); schiet(pg, "18_instellingen", heel=True)
    print("uitslagen:", json.dumps(pg.evaluate("Stand.alles()"))[:400])

    # Telefoon
    tf = b.new_page(viewport={"width": 390, "height": 844}, has_touch=True)
    tf.on("pageerror", lambda e: fouten.append(str(e)))
    tf.on("dialog", lambda d: d.accept())
    tf.goto(URL); tf.wait_for_timeout(500)
    tf.screenshot(path=f"{OUT}/20_tel_home.png", full_page=True)
    tf.click("[data-actie=verder]"); tf.wait_for_timeout(300)
    tf.click("[data-actie=klaar]"); tf.wait_for_timeout(300)  # teams zijn hier leeg
    tf.screenshot(path=f"{OUT}/21_tel_intro.png", full_page=True)
    tf.click("[data-actie=verder]"); tf.wait_for_timeout(300)
    tf.screenshot(path=f"{OUT}/22_tel_teamkeuze.png", full_page=True)
    tf.click("[data-actie=kies][data-team='0']"); tf.click("[data-actie=verder]"); tf.wait_for_timeout(500)
    tf.screenshot(path=f"{OUT}/23_tel_hl.png")
    print("scrollbreedte telefoon:", tf.evaluate("document.documentElement.scrollWidth"))
    b.close()
print("fouten:", fouten or "geen")
