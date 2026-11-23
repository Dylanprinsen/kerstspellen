/*
 * Raad het moment
 * Een quote van een sportcommentator (in beeld en voorgelezen, namen weggepiept).
 * Welk iconisch sportmoment is dit? Stap voor stap:
 *   zonder hulp geraden = 3 punten, na de hint (sport + jaar) = 2, met 4 keuzes = 1.
 * Bij "we weten het" zegt het team het antwoord hardop, daarna verschijnt het goede
 * antwoord en tikt het team eerlijk op goed of fout.
 * Elk team krijgt andere momenten (data/momenten.js), op een avond niet dubbel.
 */
(function () {
  const NAAM = 'Raad het moment';
  const MOMENTEN = window.KERST_DATA.momenten;
  const STEMMEN = {
    nl: { stem: 'nl-NL-MaartenNeural', snelheid: '+4%' },
    en: { stem: 'en-GB-RyanNeural', snelheid: '+0%' },
    es: { stem: 'es-AR-TomasNeural', snelheid: '+6%' },
  };
  const LETTERS = ['A', 'B', 'C', 'D'];
  let potje = null;

  /* ---------- Teksten ---------- */

  // Wat de stem voorleest: weggepiepte stukken worden "piep".
  function stemTekst(m) {
    return m.quote.replace(/\[[^\]]+\]/g, 'piep');
  }

  function quoteHtml(m, open = false) {
    return esc(m.quote).replace(/\[([^\]]+)\]/g, (_, t) => open
      ? `<b class="ontpiept">${t}</b>`
      : `<span class="piep">${'▇'.repeat(Math.min(7, Math.max(3, Math.round(t.length / 2))))}</span>`);
  }

  function bron(m) {
    return m.echt ? `🎙️ ${esc(m.wie)}` : '🎙️ Vrij naar het commentaar';
  }

  /* ---------- Beurt ---------- */

  function kiesMomenten(aantal) {
    const gehad = new Set(Opslag.lees('momenten.gehad', []));
    let over = MOMENTEN.filter(m => !gehad.has(m.id));
    if (over.length < aantal) { gehad.clear(); over = MOMENTEN; }
    const lijst = schud(over).slice(0, aantal);
    lijst.forEach(m => gehad.add(m.id));
    Opslag.schrijf('momenten.gehad', [...gehad]);
    return lijst;
  }

  function speelBeurt(beurt) {
    potje = { beurt, team: Teams.lijst()[beurt.teamIndex], lijst: kiesMomenten(beurt.inst.aantal), nr: 0, uitslag: [] };
    toonBeurt({
      spel: NAAM,
      emoji: '🎙️',
      teamIndex: beurt.teamIndex,
      uitleg: `Jullie horen <b>${potje.lijst.length} quotes</b> van sportcommentatoren. Welk moment is het?<br>
        Zonder hulp <b>3 punten</b>, met een hint <b>2</b>, met vier keuzes <b>1</b>. Overleg samen!`,
      knop: 'Zet het geluid aan en start 🔊',
      verder: () => toonQuote(),
      terug: () => beurt.stop(),
    });
  }

  function spelkop() {
    return `<div class="spelkop">
      <button class="terug" data-actie="stop">✕ Stop</button>
      <div class="wie-speelt">${teamLabel(potje.team)}</div>
      <span class="quiz-voortgang">Moment ${potje.nr + 1}/${potje.lijst.length}</span>
    </div>`;
  }

  function toonQuote() {
    const m = potje.lijst[potje.nr];
    potje.stap = 'quote';
    toonScherm(`
      ${spelkop()}
      <div class="moment schuif-in">
        <div class="moment-kaart" data-id="${m.id}">
          <div class="moment-mic">🎙️</div>
          <blockquote class="moment-quote">“${quoteHtml(m)}”</blockquote>
          ${m.vertaling ? `<div class="moment-vertaling">Vertaling: ${esc(m.vertaling)}</div>` : ''}
          <div class="moment-bron">${m.echt ? '🎙️ Echt commentaar' : '🎙️ Vrij naar het commentaar'}
            <button class="moment-nog" data-actie="luister">🔊 Nog een keer</button></div>
        </div>
        <div class="moment-hint" id="moment-hint" hidden>💡 ${esc(m.hint)}</div>
        <div class="moment-acties" id="moment-acties"></div>
      </div>
    `, {
      stop: () => { if (confirm('Stoppen? Deze beurt telt dan niet en jullie mogen straks opnieuw.')) potje.beurt.stop(); },
      luister: () => Spraak.zeg(stemTekst(m)),
    });
    Spraak.zeg(stemTekst(m));
    toonActies();
  }

  function punten() {
    return { quote: 3, hint: 2, keuzes: 1 }[potje.stap];
  }

  function knop(actie, tekst, klasse = 'goud') {
    return `<button class="knop ${klasse}" data-k="${actie}">${tekst}</button>`;
  }

  // Knoppen onder de quote, afhankelijk van de stap.
  function toonActies() {
    const m = potje.lijst[potje.nr];
    const el = document.getElementById('moment-acties');
    if (potje.stap === 'quote') {
      el.innerHTML = `<p>Weten jullie welk moment dit is? Zeg het eerst hardop!</p>
        <div class="knoppen">${knop('weten', '🗣️ We weten het! (3 punten)')}${knop('hint', '💡 Geef een hint', 'licht')}</div>`;
    } else if (potje.stap === 'hint') {
      document.getElementById('moment-hint').hidden = false;
      el.innerHTML = `<p>Weten jullie het nu? Zeg het hardop!</p>
        <div class="knoppen">${knop('weten', '🗣️ We weten het! (2 punten)')}${knop('keuzes', '🔤 Laat 4 keuzes zien', 'licht')}</div>`;
    } else if (potje.stap === 'keuzes') {
      const opties = schud([m, ...afleiders(m)]);
      el.innerHTML = `<p>Welke is het? (1 punt)</p>
        <div class="quiz-antwoorden">${opties.map((o, i) => `
          <button class="quiz-antwoord" data-keuze="${o.id}"><span class="quiz-letter">${LETTERS[i]}</span><span>${esc(o.kort)}</span></button>`).join('')}</div>`;
      el.querySelectorAll('[data-keuze]').forEach(b => b.addEventListener('click', () => resultaat(b.dataset.keuze === m.id ? 1 : 0)));
    } else if (potje.stap === 'oordeel') {
      el.innerHTML = `<div class="moment-oplossing">
          <small>Het goede antwoord</small><b>${esc(m.kort)}</b>
        </div>
        <p>Hadden jullie het goed?</p>
        <div class="knoppen">${knop('goed', `✅ Ja, goed! (+${potje.waarde})`)}${knop('fout', '❌ Nee, fout', 'licht')}</div>`;
    }
    el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k === 'weten') { potje.waarde = punten(); potje.stap = 'oordeel'; toonActies(); }
      else if (k === 'hint') { potje.stap = 'hint'; toonActies(); }
      else if (k === 'keuzes') { potje.stap = 'keuzes'; toonActies(); }
      else if (k === 'goed') resultaat(potje.waarde);
      else if (k === 'fout') resultaat(0);
    }));
  }

  // Drie andere momenten als foute keuzes, liefst uit dezelfde sport.
  function afleiders(m) {
    const andere = schud(MOMENTEN.filter(x => x.id !== m.id));
    const zelfde = andere.filter(x => x.sport === m.sport);
    return [...zelfde, ...andere.filter(x => x.sport !== m.sport)].slice(0, 3);
  }

  /* ---------- Onthulling per moment ---------- */

  function resultaat(p) {
    const m = potje.lijst[potje.nr];
    potje.uitslag.push({ m, punten: p });
    const laatste = potje.nr + 1 >= potje.lijst.length;
    toonScherm(`
      ${spelkop()}
      <div class="moment-uitleg schuif-in">
        ${m.foto && fotoVan(m.foto) ? `<img class="moment-foto" src="${fotoVan(m.foto)}" alt="${esc(m.foto)}">` : '<div class="moment-foto leeg">🏆</div>'}
        <div class="moment-tekst">
          <div class="moment-punten ${p ? 'goed' : ''}">${p ? `✅ +${p} ${p === 1 ? 'punt' : 'punten'}` : '❌ Geen punten'}</div>
          <h2>${esc(m.kort)}</h2>
          <p>${esc(m.antwoord)}</p>
          <blockquote class="moment-quote klein">“${quoteHtml(m, true)}”</blockquote>
          <div class="moment-bron">${bron(m)}</div>
        </div>
      </div>
      <div class="knoppen"><button class="knop goud groot" data-actie="verder">${laatste ? 'Klaar! Bekijk de score ▶️' : 'Volgende moment ▶️'}</button></div>
    `, {
      stop: () => { if (confirm('Stoppen? Deze beurt telt dan niet en jullie mogen straks opnieuw.')) potje.beurt.stop(); },
      verder: () => {
        if (laatste) { einde(); return; }
        potje.nr += 1;
        toonQuote();
      },
    });
    if (p === 3) confetti();
  }

  function einde() {
    const u = potje.uitslag;
    const punten = u.reduce((s, x) => s + x.punten, 0);
    const geraden = u.filter(x => x.punten).length;
    potje.beurt.klaar({
      punten,
      tekst: `${geraden} van ${u.length} geraden`,
      titel: `${geraden} van de ${u.length} momenten geraden!`,
      emoji: geraden === u.length ? '🏆' : geraden >= u.length / 2 ? '👏' : '🎅',
      details: `<ul class="tijden-lijst">${u.map(x => `<li><span>${esc(x.m.kort)}</span><b>${x.punten ? '+' + x.punten : '0'}</b></li>`).join('')}</ul>`,
      feest: geraden === u.length,
    });
  }

  registreerSpel({
    id: 'moment',
    naam: NAAM,
    emoji: '🎙️',
    minuten: 14,
    kort: 'Je hoort een sportcommentator. Over welk iconisch sportmoment gaat het?',
    film: 'Je hoort een quote van een sportcommentator, maar de namen zijn weggepiept. Over welk beroemd sportmoment gaat het? Zonder hulp levert het de meeste punten op.',
    instellingen: {
      aantal: { label: 'Quotes per team', standaard: 5, min: 3, max: Math.floor(MOMENTEN.length / 3), stap: 1 },
    },
    stappen: inst => [
      { icoon: '🎙️', tekst: `Jullie horen <b>${inst.aantal} quotes</b> van sportcommentatoren. Namen zijn weggepiept.` },
      { icoon: '🗣️', tekst: 'Weet je welk moment het is? Zeg het <b>hardop</b> en kijk dan of het klopt.' },
      { icoon: '💡', tekst: 'Geen idee? Vraag een <b>hint</b> (sport en jaar), of daarna <b>vier keuzes</b>.' },
      { icoon: '🏆', tekst: 'Daarna zie je wat er echt gebeurde, met foto.' },
    ],
    punten: () => 'Zonder hulp <b>3 punten</b>, na de hint <b>2 punten</b>, met de vier keuzes <b>1 punt</b>.',
    plaatje: () => `
      <div class="plaat plaat-moment">
        <div class="moment-mini-mic">🎙️</div>
        <div class="moment-mini-ballon">“Wat een goal van <span>▇▇▇▇</span>!”</div>
        <div class="moment-mini-golven"><i></i><i></i><i></i></div>
      </div>`,
    speelBeurt,
    // Voor tools/maak_stem.py: alle quotes met de stem die bij de taal past.
    voorleesExtra: () => MOMENTEN.map(m => ({ tekst: stemTekst(m), ...(m.stem ? { stem: m.stem } : STEMMEN[m.taal]) })),
  });
})();
