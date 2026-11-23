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
- De avond moet **ruim een uur** duren (nu ± 85 min). Niet te snel klaar: bij nieuwe spellen of wijzigingen de duur bewaken (`minuten` per spel, totaal staat op de startpagina).
- Volgersaantallen zijn een vaste momentopname (Instagram laat live ophalen niet toe); bij twijfel liever weglaten dan gokken.

## Verloop
- Vaste volgorde: de spellen zijn alleen te bekijken, niet te kiezen. Per spel: uitleg → kies welk team de iPad heeft → beurt → doorgeven → na alle 3 teams uitslag + tussenstand → volgende spel → prijsuitreiking.
- Startpagina: titel "Familie-editie 2026", uitlegfilmpje (`js/film.js`, geanimeerde scènes, ~1,5 min), programma met plaatjes, teams.
- Voice-over: Dylan wil een warme stem, geen standaard robotstem. Opnames in `media/stem/` gemaakt met `tools/maak_stem.py` (edge-tts, stem nl-NL-FennaNeural; quotes bij Raad het moment met Maarten / Engelse / Argentijnse stem via `voorleesExtra`). Na het wijzigen van een film- of uitlegtekst het script opnieuw draaien, anders valt die tekst terug op de robotstem van het apparaat.
- Instellingen (categorie, doel, seconden, aantal starts) staan achter "Instellingen spelleider" onderaan de startpagina.

## Spellen
- **Hoger of lager** (`js/spellen/hoger-lager.js`): per team twee rondes: eerst Instagram-volgers (opgezocht 23 nov 2026), dan Olympische medailles, met foto's. Per vraag kiest een ander teamlid. Per ronde 1 punt per goed antwoord, +3 als het doel (standaard 7) gehaald wordt.
- **F1-startlichten** (`js/spellen/startlichten.js`): per team; het hele team tegelijk, ieder een eigen vak. Standaard 3 starts; gemiddelde reactietijd telt (valse start/te laat = 1 s). Na alle teams: 5/3/1 punten.
- **Sportquiz** (`js/spellen/sportquiz.js`, vragen in `data/sportquiz.js`): geen niveaukeuze (Dylan wil dat niet): elke speler krijgt een vaste mix makkelijk → gemiddeld → moeilijk = 1/2/3 punten per goed. Standaard 3 vragen per speler, 30 seconden per vraag. Vragen worden op een avond niet herhaald.
- **Wie ben ik?** (`js/spellen/wie-ben-ik.js`): iPad op het voorhoofd; per team twee rondes van 60 s (Sporters met foto, dan Sporten uitbeelden), elke ronde raadt iemand anders; 1 punt per goed.
- **Raad het moment** (`js/spellen/moment.js`, momenten in `data/momenten.js`): quote van een sportcommentator in beeld + voorgelezen (namen weggepiept). Zonder hulp 3 punten, na hint (sport + jaar) 2, met 4 keuzes 1. Team zegt het antwoord hardop en keurt zelf goed/fout. Elk team andere quotes (standaard 5). Alleen bij `echt: true` is het een letterlijk citaat (met `wie`); de Nederlandse momenten zijn nagespeeld ("vrij naar het commentaar") omdat de exacte woorden niet zeker waren. Echte audiofragmenten kunnen niet in de openbare repo (auteursrecht).
- **Schatten** (`js/spellen/schatten.js`, vragen in `data/schatten.js`): alle teams dezelfde 8 vragen, geheim invullen; na het laatste team een onthulling per vraag. Dichtstbij 2, tweede 1, binnen 1% +1 bonus.
- Volgorde: Hoger of lager → F1 → Sportquiz → Wie ben ik? → Raad het moment → Schatten → prijsuitreiking. `BINNENKORT` in `js/app.js` is nu leeg.
- Foto's: `python3 tools/haal_fotos.py` haalt ze van Wikipedia/Commons (lokaal opgeslagen). Verkeerde foto: zet de juiste pagina of het Commons-bestand in `OVERRIDES` en draai met `--opnieuw "Naam"`.

## Testmodus
- Onderaan de startpagina "🧪 Testmodus" of `?test` achter het adres (`?echt` zet hem uit). Aparte opslag (`kerst.test.`), dus de echte avond blijft onaangeroerd. Teams met één testspeler, elk spel in het programma aanklikbaar, en na één beurt "Andere teams overslaan" (kopieert het resultaat).

## Techniek
- Gewone HTML/CSS/JS, geen build-stap. Zie `README.md` voor de opbouw.
- Nieuw spel: bestand in `js/spellen/` dat `registreerSpel({...})` aanroept (velden staan beschreven in `js/basis.js`), en een `<script>` in `index.html` op de plek in de volgorde. Het spel speelt één beurt via `speelBeurt(beurt)` en meldt `beurt.klaar({punten, tekst})`; de app regelt teamkeuze, stand en uitslag. Optioneel: `verdeelPunten` (punten pas na alle teams), `onthulling` (scherm vóór de uitslag), `minuten`, `film` (tekst in het filmpje).
- Testen vóór elke push: `python3 tests/test_spel.py <map-voor-screenshots>` speelt alles door op iPad- en telefoonformaat (Playwright met de geïnstalleerde Chrome). Met een URL als tweede argument test je de live site.
- Nog niet getest op een echte iPad: drie vingers tegelijk bij F1-startlichten, en de voorleesstem van het filmpje.
