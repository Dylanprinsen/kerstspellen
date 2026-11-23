import sys
# Speelt alles door: teams, Hoger of lager, F1-startlichten, Wie ben ik?, stand.
# Gebruik: python3 tests/test_spel.py <map-voor-screenshots> [url]
from playwright.sync_api import sync_playwright
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
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": 1024, "height": 768}, has_touch=True)
    pg.on("pageerror", lambda e: fouten.append(str(e)))
    pg.on("dialog", lambda d: d.accept())
    pg.goto(URL); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(500)
    # teams vullen
    pg.click("[data-actie=teams]")
    leden = [["Oma", "Dylan", "Lotte"], ["Opa", "Papa", "Sem"], ["Mama", "Tante Ans", "Noor"]]
    for i, namen in enumerate(leden):
        for n in namen:
            sel = f"form[data-team='{i}'] input"
            pg.fill(sel, n); pg.press(sel, "Enter")
    pg.screenshot(path=f"{OUT}/1_teams.png")
    pg.click("[data-actie=terug]")
    # Hoger of lager: team 0 haalt 7, team 1 meteen fout, team 2 3 goed
    pg.click("[data-id=hoger-lager]"); pg.click("[data-actie=start]")
    pg.screenshot(path=f"{OUT}/2_hl_beurt.png")
    for team, aantal in enumerate([7, 0, 3]):
        pg.click("[data-actie=verder]"); pg.wait_for_timeout(300)
        for k in range(aantal):
            pg.click(f"[data-actie={pg.evaluate(KIES, True)}]"); pg.wait_for_timeout(2900 if k < aantal - 1 or aantal < 7 else 2400)
        if aantal < 7:
            pg.click(f"[data-actie={pg.evaluate(KIES, False)}]"); pg.wait_for_timeout(3200)
        if team == 0: pg.screenshot(path=f"{OUT}/3_hl_einde_team.png")
        pg.click("[data-actie=volgende]"); pg.wait_for_timeout(300)
    pg.screenshot(path=f"{OUT}/4_hl_ronde.png")
    print("HL stand:", pg.evaluate("localStorage.getItem('kerst.stand')"))
    pg.click("[data-actie=terug]")
    # F1-startlichten
    pg.click("[data-id=startlichten]"); pg.click("[data-actie=start]")
    pg.screenshot(path=f"{OUT}/5_f1_grid.png")
    pg.click("[data-actie=go]"); pg.wait_for_timeout(2300)
    pg.dispatch_event('[data-vak="0"]', 'pointerdown')
    pg.wait_for_timeout(2900); pg.screenshot(path=f"{OUT}/6_f1_lampen.png")
    pg.wait_for_selector(".race-status.go", timeout=10000)
    pg.wait_for_timeout(180); pg.dispatch_event('[data-vak="2"]', 'pointerdown')
    pg.wait_for_timeout(90); pg.dispatch_event('[data-vak="1"]', 'pointerdown')
    pg.wait_for_timeout(300); pg.screenshot(path=f"{OUT}/7_f1_getikt.png")
    pg.wait_for_timeout(900); pg.screenshot(path=f"{OUT}/8_f1_uitslag.png")
    print("F1 stand:", pg.evaluate("localStorage.getItem('kerst.stand')"))
    pg.click("[data-actie=menu]")
    # Wie ben ik?
    pg.click("[data-id=wie-ben-ik]"); pg.click("[data-actie=min]"); pg.click("[data-actie=min]")
    pg.screenshot(path=f"{OUT}/9_wbi_instellingen.png")
    pg.click("[data-actie=start]"); pg.click("[data-actie=verder]"); pg.wait_for_timeout(3300)
    for z in ["goed", "goed", "pas", "goed"]:
        pg.dispatch_event(f'[data-zone="{z}"]', 'pointerdown'); pg.wait_for_timeout(250)
    pg.screenshot(path=f"{OUT}/10_wbi_spel.png")
    pg.wait_for_timeout(28000)
    pg.screenshot(path=f"{OUT}/11_wbi_einde.png")
    pg.click("[data-actie=terug]"); pg.click("[data-actie=menu]"); pg.wait_for_timeout(300)
    pg.screenshot(path=f"{OUT}/12_menu.png")
    pg.click("[data-actie=stand]"); pg.screenshot(path=f"{OUT}/13_stand.png")
    print("eind stand:", pg.evaluate("localStorage.getItem('kerst.stand')"))
    # telefoon: menu en race
    tf = b.new_page(viewport={"width": 390, "height": 844}, has_touch=True)
    tf.on("pageerror", lambda e: fouten.append(str(e)))
    tf.goto(URL); tf.wait_for_timeout(400); tf.screenshot(path=f"{OUT}/14_tel_menu.png", full_page=True)
    tf.click("[data-id=startlichten]"); tf.click("[data-actie=start]"); tf.click("[data-actie=go]"); tf.wait_for_timeout(5200)
    tf.screenshot(path=f"{OUT}/15_tel_f1.png")
    print("scrollbreedte telefoon:", tf.evaluate("document.documentElement.scrollWidth"))
    b.close()
print("fouten:", fouten or "geen")
