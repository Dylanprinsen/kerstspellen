/*
 * F1-startlichten
 * Eén speler per team, iedereen een eigen vak op dezelfde iPad. Vijf rode lampen
 * gaan aan en daarna tegelijk uit: tik dan zo snel mogelijk op je eigen vak.
 * Snelste 3 punten, tweede 2, derde 1. Te vroeg tikken = valse start = 0 punten.
 */
(function () {
  const SPEL_ID = 'startlichten';
  const NAAM = 'F1-startlichten';
  let race = null;

  function tijdTekst(ms) {
    return (ms / 1000).toFixed(3).replace('.', ',') + ' s';
  }

  function toonUitleg() {
    const record = Opslag.lees('startlichten.record', null);
    toonScherm(`
      ${kop(NAAM)}
      <div class="midden schuif-in">
        <div class="groot-emoji">🏎️</div>
        <h2>Wie reageert het snelst?</h2>
        <p>Uit elk team speelt één persoon. Iedereen krijgt een eigen vak op de iPad.</p>
        <p>Vijf rode lampen gaan aan. Gaan ze <b>uit</b>? Tik dan zo snel mogelijk op je vak!</p>
        <p>Snelste <b>3 punten</b>, tweede <b>2</b>, derde <b>1</b>. Te vroeg = valse start = 0.</p>
        ${record ? `<p style="font-size:17px">🏁 Record: <b>${tijdTekst(record.tijd)}</b> door ${esc(record.naam)}</p>` : ''}
        <div class="knoppen"><button class="knop goud" data-actie="start">Naar de startgrid ▶️</button></div>
      </div>
    `, { menu: () => toonMenu(), start: () => nieuweRace() });
  }

  function nieuweRace() {
    const teams = Teams.lijst();
    race = {
      coureurs: teams.map((t, i) => ({ team: t, lid: Teams.volgendLid(i), uitslag: null })),
      fase: 'klaar',
      timers: [],
    };
    toonScherm(`
      ${kop(NAAM)}
      <div class="midden schuif-in">
        <div class="groot-emoji">🏁</div>
        <h2>Aan de start</h2>
        <div class="ronde-uitslag">
          ${race.coureurs.map(c => `
            <div class="ronde-team" style="--team:${c.team.kleur}">
              <div class="ronde-naam">${esc(c.team.naam)}</div>
              ${c.lid !== c.team.naam ? `<div style="font-size:26px;font-weight:700">${esc(c.lid)}</div>` : ''}
            </div>`).join('')}
        </div>
        <p>Leg de iPad plat neer. Iedereen een vinger boven het eigen vak.</p>
        <div class="knoppen"><button class="knop goud" data-actie="go">Lampen aan! 🔴</button></div>
      </div>
    `, { menu: () => toonMenu(), go: () => toonRace() });
  }

  function toonRace() {
    toonScherm(`
      <div class="spelkop">
        <button class="terug" data-actie="stop">✕ Stop</button>
        <div class="wie-speelt">${NAAM}</div>
        <span></span>
      </div>
      <div class="lichten">
        ${[0, 1, 2, 3, 4].map(i => `<div class="lamp-kolom" data-lamp="${i}"><i></i><i></i></div>`).join('')}
      </div>
      <div class="race-status" id="status">Wacht op de lampen…</div>
      <div class="vakken">
        ${race.coureurs.map((c, i) => `
          <div class="vak" data-vak="${i}" style="--team:${c.team.kleur}">
            ${c.lid !== c.team.naam ? `<div class="vak-team">${esc(c.team.naam)}</div>` : ''}
            <div class="vak-naam">${esc(c.lid)}</div>
            <div class="vak-uitslag" id="uitslag-${i}">👆</div>
          </div>`).join('')}
      </div>
    `, {
      stop: () => { stopTimers(); toonMenu(); },
    });

    app.querySelectorAll('.vak').forEach(vak => {
      vak.addEventListener('pointerdown', e => { e.preventDefault(); tik(+vak.dataset.vak); });
    });

    race.fase = 'lampen';
    for (let i = 0; i < 5; i++) {
      race.timers.push(setTimeout(() => {
        const lamp = app.querySelector(`[data-lamp="${i}"]`);
        if (lamp) lamp.classList.add('aan');
      }, 1000 + i * 1000));
    }
    const uit = 5000 + 400 + Math.random() * 2600;
    race.timers.push(setTimeout(lichtenUit, uit));
  }

  function lichtenUit() {
    race.fase = 'go';
    race.t0 = performance.now();
    app.querySelectorAll('.lamp-kolom').forEach(l => l.classList.remove('aan'));
    const status = document.getElementById('status');
    status.textContent = 'GO! GO! GO!';
    status.classList.add('go');
    // Wie na 3 seconden nog niet getikt heeft, is te laat.
    race.timers.push(setTimeout(() => {
      race.coureurs.forEach((c, i) => { if (!c.uitslag) { c.uitslag = { telaat: true }; toonVak(i); } });
      klaar();
    }, 3000));
  }

  function tik(i) {
    const c = race.coureurs[i];
    if (!c || c.uitslag || race.fase === 'klaar' || race.fase === 'uitslag') return;
    c.uitslag = race.fase === 'go' ? { tijd: performance.now() - race.t0 } : { vals: true };
    toonVak(i);
    if (race.coureurs.every(x => x.uitslag)) klaar();
  }

  function toonVak(i) {
    const c = race.coureurs[i];
    const el = document.getElementById('uitslag-' + i);
    const vak = app.querySelector(`[data-vak="${i}"]`);
    if (!el) return;
    if (c.uitslag.vals) { el.innerHTML = '🚫<br><small>Valse start!</small>'; vak.classList.add('vals'); }
    else if (c.uitslag.telaat) { el.innerHTML = '😴<br><small>Te laat</small>'; vak.classList.add('vals'); }
    else { el.textContent = tijdTekst(c.uitslag.tijd); vak.classList.add('getikt'); }
  }

  function stopTimers() {
    race.timers.forEach(clearTimeout);
    race.timers = [];
  }

  function klaar() {
    if (race.fase === 'uitslag') return;
    race.fase = 'uitslag';
    stopTimers();

    const geldig = race.coureurs.filter(c => c.uitslag.tijd !== undefined).sort((a, b) => a.uitslag.tijd - b.uitslag.tijd);
    const n = race.coureurs.length;
    geldig.forEach((c, plek) => { c.plek = plek; c.punten = n - plek; });
    race.coureurs.forEach((c, i) => {
      c.punten = c.punten || 0;
      Stand.geef(i, SPEL_ID, c.punten);
    });

    let nieuwRecord = false;
    const snelste = geldig[0];
    const record = Opslag.lees('startlichten.record', null);
    if (snelste && (!record || snelste.uitslag.tijd < record.tijd)) {
      Opslag.schrijf('startlichten.record', { tijd: snelste.uitslag.tijd, naam: snelste.lid });
      nieuwRecord = !!record;
    }

    setTimeout(() => toonUitslag(nieuwRecord), 900);
  }

  function toonUitslag(nieuwRecord) {
    const medaille = p => ['🥇', '🥈', '🥉'][p] || '';
    const winnaar = race.coureurs.find(c => c.plek === 0);
    toonScherm(`
      ${kop(NAAM)}
      <div class="midden schuif-in">
        <div class="groot-emoji">${winnaar ? '🏆' : '🙈'}</div>
        <h2>${winnaar ? esc(winnaar.lid) + ' wint!' : 'Iedereen valse start!'}</h2>
        ${nieuwRecord ? `<p>🎉 Nieuw record: <b>${tijdTekst(winnaar.uitslag.tijd)}</b></p>` : ''}
        <div class="ronde-uitslag">
          ${race.coureurs.map(c => `
            <div class="ronde-team" style="--team:${c.team.kleur}">
              <div class="ronde-naam">${esc(c.team.naam)}${c.lid !== c.team.naam ? ' · ' + esc(c.lid) : ''}</div>
              <div style="font-size:22px">${c.uitslag.tijd !== undefined ? medaille(c.plek) + ' ' + tijdTekst(c.uitslag.tijd) : c.uitslag.vals ? '🚫 Valse start' : '😴 Te laat'}</div>
              <div class="ronde-punten">+${c.punten}</div>
            </div>`).join('')}
        </div>
        <div class="knoppen">
          <button class="knop goud" data-actie="opnieuw">Volgende race 🏁</button>
          <button class="knop licht" data-actie="stand">🏆 Stand</button>
        </div>
      </div>
    `, {
      menu: () => toonMenu(),
      opnieuw: () => nieuweRace(),
      stand: () => toonStand(toonMenu),
    });
    if (winnaar) confetti();
  }

  registreerSpel({
    id: SPEL_ID,
    naam: NAAM,
    emoji: '🏎️',
    tekst: 'Lampen uit, tikken! Drie spelers tegelijk op één iPad. Wie reageert het snelst?',
    start: toonUitleg,
  });
})();
