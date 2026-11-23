/*
 * Schatten
 * Alle teams krijgen dezelfde schatvragen (hoe hoog, hoe zwaar, welk jaar...).
 * Elk team vult in zijn beurt geheim een getal in per vraag. Na het laatste team
 * volgt de onthulling: per vraag de schattingen, dan het goede antwoord.
 * Per vraag: dichtstbij 2 punten, tweede 1 punt, (bijna) precies goed +1 bonus.
 */
(function () {
  const NAAM = 'Schatten';
  const VRAGEN = window.KERST_DATA.schatten;
  const PUNTEN = [2, 1];
  const PRECIES = 0.01; // binnen 1% telt als precies goed
  let potje = null;

  function getal(v) {
    return Number(v).toLocaleString('nl-NL', { maximumFractionDigits: 2 });
  }

  function metEenheid(v, q) {
    return getal(v) + (q.eenheid ? ' ' + q.eenheid : '');
  }

  // Dezelfde vragen voor alle teams: gekozen bij het eerste team van de avond.
  function vragenVanDeAvond(aantal) {
    const bewaard = Opslag.lees('schatten.set', null);
    if (Stand.begonnen('schatten') && bewaard) return bewaard;
    const set = schud(VRAGEN.map((q, i) => i)).slice(0, Math.min(aantal, VRAGEN.length));
    Opslag.schrijf('schatten.set', set);
    return set;
  }

  // Punten per team voor één vraag.
  function beoordeel(q, antwoorden) {
    const verschil = antwoorden.map(a => Math.abs(a - q.antwoord));
    return verschil.map(d => {
      const plek = verschil.filter(x => x < d).length;
      return (PUNTEN[plek] || 0) + (d <= Math.abs(q.antwoord) * PRECIES ? 1 : 0);
    });
  }

  /* ---------- Beurt: geheim invullen ---------- */

  function speelBeurt(beurt) {
    const set = vragenVanDeAvond(beurt.inst.aantal);
    potje = { beurt, set, nr: 0, antwoorden: [], team: Teams.lijst()[beurt.teamIndex] };
    toonBeurt({
      spel: NAAM,
      emoji: '📏',
      teamIndex: beurt.teamIndex,
      uitleg: `Jullie krijgen <b>${set.length} schatvragen</b>. Overleg samen en vul per vraag één getal in.<br>
        De andere teams mogen <b>niet meekijken</b>! Pas na het laatste team komt de onthulling.`,
      knop: 'Begin met schatten 📏',
      verder: () => toonVraag(),
      terug: () => beurt.stop(),
    });
  }

  function toonVraag() {
    const q = VRAGEN[potje.set[potje.nr]];
    potje.invoer = '';
    toonScherm(`
      <div class="spelkop">
        <button class="terug" data-actie="stop">✕ Stop</button>
        <div class="wie-speelt">${teamLabel(potje.team)}</div>
        <span class="quiz-voortgang">Vraag ${potje.nr + 1}/${potje.set.length}</span>
      </div>
      <div class="schat schuif-in">
        <div class="schat-vraag">${esc(q.v)}</div>
        <div class="schat-scherm"><span id="schat-getal" class="leeg">?</span>${q.eenheid ? `<small>${esc(q.eenheid)}</small>` : ''}</div>
        <div class="toetsen">
          ${['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map(t => `<button class="toets" data-toets="${t}">${t}</button>`).join('')}
        </div>
        <div class="knoppen"><button class="knop goud groot" id="schat-verder" disabled>${potje.nr + 1 < potje.set.length ? 'Volgende vraag ▶️' : 'Klaar ✔️'}</button></div>
      </div>
    `, {
      stop: () => { if (confirm('Stoppen? Deze beurt telt dan niet en jullie mogen straks opnieuw.')) potje.beurt.stop(); },
    });
    app.querySelectorAll('.toets').forEach(b => b.addEventListener('click', () => typ(b.dataset.toets)));
    document.getElementById('schat-verder').addEventListener('click', () => volgende());
  }

  function typ(t) {
    let s = potje.invoer;
    if (t === '⌫') s = s.slice(0, -1);
    else if (t === ',') { if (!s.includes(',')) s = (s || '0') + ','; }
    else if (s.replace(',', '').length < 9) s = s === '0' ? t : s + t;
    potje.invoer = s;
    const el = document.getElementById('schat-getal');
    el.textContent = s || '?';
    el.classList.toggle('leeg', !s);
    document.getElementById('schat-verder').disabled = !s || s === ',';
  }

  function volgende() {
    potje.antwoorden.push(parseFloat(potje.invoer.replace(',', '.')) || 0);
    potje.nr += 1;
    if (potje.nr < potje.set.length) { toonVraag(); return; }
    potje.beurt.klaar({
      antwoorden: potje.antwoorden,
      vragen: potje.set,
      tekst: 'Ingevuld 🤫',
      titel: 'Alles ingevuld!',
      emoji: '🤫',
      details: '<p>Niet verklappen wat jullie hebben ingevuld! Na het laatste team komt de onthulling.</p>',
    });
  }

  /* ---------- Onthulling na het laatste team ---------- */

  function onthulling(klaar) {
    const teams = Teams.lijst();
    const r = Stand.van('schatten');
    const set = r[0].vragen;
    let nr = 0;

    function toon() {
      const q = VRAGEN[set[nr]];
      const antwoorden = teams.map((t, i) => r[i].antwoorden[nr]);
      const punten = beoordeel(q, antwoorden);
      toonScherm(`
        <div class="kop"><span></span><div class="titel">🎬 Onthulling · vraag ${nr + 1} van ${set.length}</div><span></span></div>
        <div class="onthul schuif-in">
          <div class="schat-vraag">${esc(q.v)}</div>
          <div class="onthul-teams">
            ${teams.map((t, i) => `
              <div class="onthul-team" style="--team:${t.kleur};--i:${i}">
                <div class="onthul-naam">${esc(t.naam)}</div>
                <div class="onthul-gok">${metEenheid(antwoorden[i], q)}</div>
                <div class="onthul-punten" hidden>${punten[i] ? '+' + punten[i] : '0'}</div>
              </div>`).join('')}
          </div>
          <div class="onthul-antwoord" id="onthul-antwoord" hidden>
            <small>Het goede antwoord</small>
            <b id="onthul-getal">0</b>
            ${q.u ? `<p>${esc(q.u)}</p>` : ''}
          </div>
          <div class="knoppen" id="onthul-knoppen">
            <button class="knop goud groot" data-actie="toon">🥁 Wat is het goede antwoord?</button>
          </div>
        </div>
      `, {
        toon: () => {
          const blok = document.getElementById('onthul-antwoord');
          blok.hidden = false;
          telOp(document.getElementById('onthul-getal'), q.antwoord, v => metEenheid(Number.isInteger(q.antwoord) ? Math.round(v) : Math.round(v * 100) / 100, q), 1500);
          setTimeout(() => {
            const beste = Math.max(...punten);
            app.querySelectorAll('.onthul-team').forEach((el, i) => {
              el.querySelector('.onthul-punten').hidden = false;
              if (punten[i] === beste && beste > 0) el.classList.add('winnaar');
            });
            if (beste > 0) confetti();
            const laatste = nr + 1 >= set.length;
            const knoppen = document.getElementById('onthul-knoppen');
            knoppen.innerHTML = `<button class="knop goud groot">${laatste ? 'Naar de uitslag 🏆' : 'Volgende vraag ▶️'}</button>`;
            knoppen.querySelector('button').addEventListener('click', () => {
              if (laatste) klaar();
              else { nr += 1; toon(); }
            });
          }, 1600);
          document.querySelector('[data-actie="toon"]').remove();
        },
      });
    }
    toon();
  }

  registreerSpel({
    id: 'schatten',
    naam: NAAM,
    emoji: '📏',
    minuten: 14,
    kort: 'Hoe hoog, hoe zwaar, welk jaar? Elk team schat geheim. Wie zit het dichtst bij?',
    film: 'Hoe hoog hangt een basket? Hoe zwaar is een voetbal? Elk team schat in het geheim. Aan het eind volgt de grote onthulling: wie zit het dichtst bij?',
    instellingen: {
      aantal: { label: 'Aantal schatvragen', standaard: 8, min: 4, max: VRAGEN.length, stap: 1 },
    },
    stappen: inst => [
      { icoon: '🤔', tekst: `Jullie krijgen <b>${inst.aantal} schatvragen</b> over sport: hoe hoog, hoe zwaar, welk jaar?` },
      { icoon: '🗣️', tekst: 'Overleg samen en tik per vraag één getal in.' },
      { icoon: '🙈', tekst: 'De andere teams mogen <b>niet meekijken</b>. Alle teams krijgen dezelfde vragen.' },
      { icoon: '🎬', tekst: 'Na het laatste team komt de <b>onthulling</b>: per vraag zie je ieders schatting en het goede antwoord.' },
    ],
    punten: () => 'Per vraag: dichtstbij <b>2 punten</b>, tweede <b>1 punt</b>. Precies goed? <b>+1 bonus</b>.',
    plaatje: () => `
      <div class="plaat plaat-schat">
        <div class="schat-mini-lat">${[...Array(11)].map((_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
        <div class="schat-mini-getal">≈ <span>305</span>?</div>
        <div class="schat-mini-doel">🎯</div>
      </div>`,
    speelBeurt,
    onthulling,
    verdeelPunten: resultaten => {
      const set = resultaten[0].vragen;
      const totaal = resultaten.map(() => 0);
      set.forEach((v, nr) => {
        beoordeel(VRAGEN[v], resultaten.map(r => r.antwoorden[nr])).forEach((p, i) => { totaal[i] += p; });
      });
      return totaal;
    },
  });
})();
