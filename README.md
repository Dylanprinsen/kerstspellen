# Kerstspellen · Familie-editie 2026

Spelletjes voor de familie met kerst. Gewone HTML/CSS/JS, geen build-stap.

## Verloop van de avond
Startpagina (titel, uitlegfilmpje, programma, teams) → per spel: uitleg → "Welk team heeft de iPad?" →
beurt → iPad doorgeven → als alle teams geweest zijn: uitslag + tussenstand → uitleg volgende spel → … → prijsuitreiking.
De spellen staan in een vaste volgorde en zijn niet los te kiezen.

## Opbouw
- `index.html` laadt alles. De volgorde van de `<script>`-regels onder `js/spellen/` is de volgorde van de avond.
- `js/basis.js`: opslag, teams, uitslagen (`Stand`), instellingen, voorlezen en gedeelde schermen.
- `js/film.js`: het uitlegfilmpje (geanimeerde scènes, ondertitels en voice-over).
- `js/app.js`: startpagina, verloop van de avond, teamkeuze, uitslag, finale, teams, instellingen spelleider.
- `js/spellen/`: één bestand per spel; een spel meldt zich aan met `registreerSpel(...)` (zie de uitleg in `js/basis.js`).
- `data/`: gegevens (Instagram-volgers, medailles, kaartjes voor Wie ben ik?) en `fotos.js` (gemaakt door het fotoscript).
- `img/personen/`: foto's van Wikimedia Commons, bronnen in `img/personen/BRONNEN.md`.
- `tools/haal_fotos.py`: haalt foto's op voor alle namen in `data/`. Draai opnieuw na het toevoegen van namen.
- `tools/maak_stem.py`: maakt de voice-over (`media/stem/`, `data/stem.js`) voor het filmpje en de uitleg per spel. Draai opnieuw na het wijzigen van die teksten (`pip3 install edge-tts`).

Lokaal bekijken: open `index.html` in de browser.
Online: GitHub Pages vanaf de `main`-branch.
