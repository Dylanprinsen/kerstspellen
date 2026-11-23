/*
 * F1-startlichten (per team)
 * Het hele team speelt tegelijk, iedereen een eigen vak op de iPad. Vijf rode lampen
 * gaan aan en daarna tegelijk uit: tik dan zo snel mogelijk op je eigen vak.
 * Elk team doet een paar starts; de gemiddelde reactietijd van het team telt.
 * Te vroeg (valse start) of te laat telt als 1 seconde.
 * Als alle teams geweest zijn: snelste team 5 punten, tweede 3, derde 1.
 */
(function () {
  const NAAM = 'F1-startlichten';
  const STRAF = 1000;
  const PUNTEN = [5, 3, 1];
  let race = null;

  function tijdTekst(ms) {
    return (ms / 1000).toFixed(3).replace('.', ',') + ' s';
  }

  function speelBeurt(beurt) {
    const team = Teams.lijst()[beurt.teamIndex];
    const namen = team.leden.length ? team.leden : [team.naam];
    race = {
      beurt,
      team,
      coureurs: namen.map(naam => ({ naam, tijden: [] })),
      starts: beurt.inst.starts,
      start: 0,
      timers: [],
    };
    toonBeurt({
      spel: NAAM,
      emoji: '🏎️',
      teamIndex: beurt.teamIndex,
      uitleg: `Leg de iPad plat op tafel. ${namen.length > 1 ? `Iedereen uit het team (${namen.map(esc).join(', ')}) krijgt een eigen vak.` : 'Je krijgt een eigen vak.'}<br>
        Jullie doen <b>${race.starts} ${race.starts === 1 ? 'start' : 'starts'}</b>. Lampen uit = tikken!`,
      knop: 'Naar de startgrid 🏁',
      verder: () => toonRace(),
      terug: () => beurt.stop(),
    });
  }

  function toonRace() {
    race.fase = 'klaar';
    race.uitslag = race.coureurs.map(() => null);
    toonScherm(`
      <div class="spelkop">
        <button class="terug" data-actie="stop">✕ Stop</button>
        <div class="wie-speelt">${teamLabel(race.team)} · start ${race.start + 1} van ${race.starts}</div>
        <span></span>
      </div>
      <div class="lichten">
        ${[0, 1, 2, 3, 4].map(i => `<div class="lamp-kolom" data-lamp="${i}"><i></i><i></i></div>`).join('')}
      </div>
      <div class="race-status" id="status">Vinger klaar boven je vak…</div>
      <div class="vakken" style="--aantal:${race.coureurs.length}">
        ${race.coureurs.map((c, i) => `
          <div class="vak" data-vak="${i}" style="--team:${race.team.kleur}">
            <div class="vak-naam">${esc(c.naam)}</div>
            <div class="vak-uitslag" id="uitslag-${i}">👆</div>
          </div>`).join('')}
      </div>
      <div class="knoppen" id="na-race" hidden></div>
    `, {
      stop: () => {
        if (!confirm('Stoppen? Deze beurt telt dan niet en jullie mogen straks opnieuw.')) return;
        stopTimers();
        race.beurt.stop();
      },
    });

    app.querySelectorAll('.vak').forEach(vak => {
      vak.addEventListener('pointerdown', e => { e.preventDefault(); tik(+vak.dataset.vak); });
    });

    race.fase = 'lampen';
    for (let i = 0; i < 5; i++) {
      race.timers.push(setTimeout(() => {
        const lamp = app.querySelector(`[data-lamp="${i}"]`);
        if (lamp) lamp.classList.add('aan');
      }, 1200 + i * 1000));
    }
    race.timers.push(setTimeout(lichtenUit, 5200 + 400 + Math.random() * 2600));
  }

  function lichtenUit() {
    race.fase = 'go';
    race.t0 = performance.now();
    app.querySelectorAll('.lamp-kolom').forEach(l => l.classList.remove('aan'));
    const status = document.getElementById('status');
    status.textContent = 'GO! GO! GO!';
    status.classList.add('go');
    // Wie na 2 seconden nog niet getikt heeft, is te laat.
    race.timers.push(setTimeout(() => {
      race.uitslag.forEach((u, i) => { if (!u) { race.uitslag[i] = { telaat: true }; toonVak(i); } });
      klaar();
    }, 2000));
  }

  function tik(i) {
    if (race.uitslag[i] || (race.fase !== 'lampen' && race.fase !== 'go')) return;
    race.uitslag[i] = race.fase === 'go' ? { tijd: performance.now() - race.t0 } : { vals: true };
    toonVak(i);
    if (race.uitslag.every(Boolean)) klaar();
  }

  function toonVak(i) {
    const u = race.uitslag[i];
    const el = document.getElementById('uitslag-' + i);
    const vak = app.querySelector(`[data-vak="${i}"]`);
    if (!el) return;
    if (u.vals) { el.innerHTML = '🚫<br><small>Valse start!</small>'; vak.classList.add('vals'); }
    else if (u.telaat) { el.innerHTML = '😴<br><small>Te laat</small>'; vak.classList.add('vals'); }
    else { el.textContent = tijdTekst(u.tijd); vak.classList.add('getikt'); }
  }

  function stopTimers() {
    race.timers.forEach(clearTimeout);
    race.timers = [];
  }

  function klaar() {
    if (race.fase === 'uitslag') return;
    race.fase = 'uitslag';
    stopTimers();

    race.uitslag.forEach((u, i) => {
      race.coureurs[i].tijden.push(u.tijd !== undefined ? u.tijd : STRAF);
      if (u.tijd !== undefined) {
        const record = Opslag.lees('startlichten.record', null);
        if (!record || u.tijd < record.tijd) {
          Opslag.schrijf('startlichten.record', { tijd: u.tijd, naam: race.coureurs[i].naam });
          race.nieuwRecord = { tijd: u.tijd, naam: race.coureurs[i].naam };
        }
      }
    });

    const status = document.getElementById('status');
    status.classList.remove('go');
    const deze = race.uitslag.map(u => (u.tijd !== undefined ? u.tijd : STRAF));
    status.textContent = `Start ${race.start + 1}: gemiddeld ${tijdTekst(gemiddelde(deze))}`;

    race.start += 1;
    const na = document.getElementById('na-race');
    na.hidden = false;
    na.innerHTML = race.start < race.starts
      ? `<button class="knop goud groot" data-knop="nog">Volgende start (${race.start + 1} van ${race.starts}) 🔴</button>`
      : '<button class="knop goud groot" data-knop="klaar">Bekijk jullie tijd 🏁</button>';
    // Even wachten, zodat niemand per ongeluk meteen doortikt.
    const knop = na.querySelector('button');
    knop.disabled = true;
    setTimeout(() => { knop.disabled = false; }, 900);
    knop.addEventListener('click', () => (race.start < race.starts ? toonRace() : einde()));
  }

  function gemiddelde(lijst) {
    return lijst.reduce((a, b) => a + b, 0) / lijst.length;
  }

  function einde() {
    const alle = race.coureurs.flatMap(c => c.tijden);
    const gem = gemiddelde(alle);
    const snelste = race.coureurs
      .map(c => ({ naam: c.naam, beste: Math.min(...c.tijden) }))
      .sort((a, b) => a.beste - b.beste);
    race.beurt.klaar({
      score: gem,
      tekst: tijdTekst(gem) + ' gemiddeld',
      titel: `Gemiddeld ${tijdTekst(gem)}`,
      emoji: '🏁',
      details: `
        <ul class="tijden-lijst">
          ${snelste.map(c => `<li><span>${esc(c.naam)}</span><b>${c.beste >= STRAF ? 'geen geldige tijd' : 'beste ' + tijdTekst(c.beste)}</b></li>`).join('')}
        </ul>
        ${race.nieuwRecord ? `<p>🎉 Nieuw record van de avond: <b>${esc(race.nieuwRecord.naam)}</b> met ${tijdTekst(race.nieuwRecord.tijd)}</p>` : ''}`,
      feest: !!race.nieuwRecord,
    });
  }

  registreerSpel({
    id: 'startlichten',
    naam: NAAM,
    emoji: '🏎️',
    kort: 'Lampen uit, tikken! Het hele team tegelijk. Welk team reageert het snelst?',
    instellingen: {
      starts: { label: 'Aantal starts per team', standaard: 3, min: 1, max: 5, stap: 1 },
    },
    stappen: inst => [
      { icoon: '👥', tekst: 'Het hele team speelt tegelijk. Leg de iPad plat neer: iedereen krijgt een eigen vak.' },
      { icoon: '🔴', tekst: 'Vijf rode lampen gaan één voor één aan…' },
      { icoon: '👆', tekst: '…en gaan dan tegelijk <b>uit</b>. Tik dan zo snel als je kunt op je eigen vak!' },
      { icoon: '🚫', tekst: `Te vroeg getikt? Valse start! Dat telt als 1 seconde. Elk team doet <b>${inst.starts}</b> ${inst.starts === 1 ? 'start' : 'starts'}.` },
    ],
    punten: () => `De gemiddelde reactietijd van het team telt. Snelste team <b>${PUNTEN[0]} punten</b>, tweede <b>${PUNTEN[1]}</b>, derde <b>${PUNTEN[2]}</b>.`,
    plaatje: () => `
      <div class="plaat plaat-f1">
        <div class="f1-lichten">${[0, 1, 2, 3, 4].map(i => `<span style="--i:${i}"><i></i><i></i></span>`).join('')}</div>
        <div class="f1-auto">🏎️</div>
        <div class="f1-vlag"></div>
      </div>`,
    speelBeurt,
    // Laagste gemiddelde tijd wint; gelijke tijd = gelijke punten.
    verdeelPunten: resultaten => {
      // Afgerond op hele milliseconden, zoals op het scherm staat.
      const scores = resultaten.map(r => Math.round(r.score));
      return scores.map(s => PUNTEN[scores.filter(t => t < s).length] || 0);
    },
  });
})();
