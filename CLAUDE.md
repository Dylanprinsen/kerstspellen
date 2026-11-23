# Kerstspellen

Website met spelletjes voor Dylans familie met kerst. Los project: heeft niets met HQ of de stores te maken, dus geen context of bestanden van daar hierheen halen (en andersom).

## Waar het staat
- Map: `~/Documents/Dylan/kerstspellen`
- GitHub: `Dylanprinsen/kerstspellen` (public, nodig voor gratis GitHub Pages)
- Live: https://dylanprinsen.github.io/kerstspellen/. Een push op `main` werkt de site binnen een paar minuten bij.
- Na een commit mag Claude zelf `git push origin main` doen en meldt wat er live staat.

## Wat Dylan wil
- Communiceer in het Nederlands.
- Familie van 9 mensen in **3 teams**, iedereen is gek op sport (alle sporten). Het moet leuk zijn voor **jong en oud**: niet alleen kennis, ook snelheid, gokken en lachen.
- Eerst spelen op **één iPad** (om de beurt, teamleden wisselen elkaar af). Meerdere apparaten is later een optie: dan hoeven alleen `Teams` en `Stand` in `js/basis.js` naar een gedeelde opslag.
- Eén **totaalstand** over alle spellen van de avond.
- Volgersaantallen zijn een vaste momentopname (Instagram laat live ophalen niet toe); bij twijfel liever weglaten dan gokken.

## Spellen
- **Hoger of lager** (`js/spellen/hoger-lager.js`): Instagram-volgers (opgezocht 23 nov 2026) en Olympische medailles. 1 punt per goed antwoord, +3 als het doel (standaard 7) gehaald wordt.
- **F1-startlichten** (`js/spellen/startlichten.js`): drie spelers tegelijk op één iPad; 3/2/1 punten, valse start 0.
- **Wie ben ik?** (`js/spellen/wie-ben-ik.js`): iPad op het voorhoofd; sets Sporters en Sporten uitbeelden; 1 punt per goed.
- **Binnenkort:** Sportquiz met een niveau per speler (makkelijk/gemiddeld/expert), Schatten. Staan in `BINNENKORT` in `js/app.js`.

## Techniek
- Gewone HTML/CSS/JS, geen build-stap. Zie `README.md` voor de opbouw.
- Nieuw spel: bestand in `js/spellen/` dat `registreerSpel({...})` aanroept, en een `<script>` in `index.html`. Gebruik `toonBeurt`, `toonRondeUitslag` en `Stand.geef` uit `js/basis.js`.
- Testen vóór elke push: `python3 tests/test_spel.py <map-voor-screenshots>` speelt alles door op iPad- en telefoonformaat (Playwright met de geïnstalleerde Chrome). Met een URL als tweede argument test je de live site.
- Nog niet getest op een echte iPad: drie vingers tegelijk bij F1-startlichten.
