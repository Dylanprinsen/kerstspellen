/*
 * Sportquiz
 * Elke speler van het team krijgt een paar meerkeuzevragen op een zelfgekozen niveau:
 * makkelijk (1 punt per goed), gemiddeld (2) of expert (3). Alleen wie aan de beurt is antwoordt.
 * Vragen komen uit data/sportquiz.js en worden op een avond niet herhaald.
 */
(function () {
  const NAAM = 'Sportquiz';
  const NIVEAUS = window.KERST_DATA.sportquiz;
  const LETTERS = ['A', 'B', 'C', 'D'];
  let potje = null;

  function speelBeurt(beurt) {
    const team = Teams.lijst()[beurt.teamIndex];
    const spelers = team.leden.length ? team.leden.slice() : [team.naam];
    potje = { beurt, team, spelers, s: 0, perSpeler: beurt.inst.vragen, seconden: beurt.inst.seconden, uitslag: [] };
    toonBeurt({
      spel: NAAM,
      emoji: '❓',
      teamIndex: beurt.teamIndex,
      uitleg: `${spelers.length > 1 ? `Iedereen (${spelers.map(esc).join(', ')})` : 'Jullie'} krijgt <b>${potje.perSpeler} vragen</b> op een zelfgekozen niveau.<br>
        Alleen wie aan de beurt is mag antwoorden. Niet voorzeggen!`,
      knop: 'Begin de quiz ❓',
      verder: () => kiesNiveau(),
      terug: () => beurt.stop(),
    });
  }

  /* ---------- Niveau kiezen ---------- */

  function kiesNiveau() {
    const speler = potje.spelers[potje.s];
    toonScherm(`
      ${spelkop()}
      <div class="midden schuif-in">
        <p class="niveau-wie">🎯 Aan de beurt: <b>${esc(speler)}</b></p>
        <h2>Welk niveau kies je?</h2>
        <p>Moeilijker = meer punten per goed antwoord. Fout is altijd 0.</p>
        <div class="niveaus">
          ${Object.entries(NIVEAUS).map(([id, n]) => `
            <button class="niveau niveau-${id}" data-actie="niveau" data-id="${id}">
              <span class="niveau-emoji">${n.emoji}</span>
              <b>${esc(n.titel)}</b>
              <span class="niveau-punten">${n.punten} ${n.punten === 1 ? 'punt' : 'punten'}</span>
              <small>per goed antwoord</small>
            </button>`).join('')}
        </div>
      </div>
    `, {
      stop: () => stoppen(),
      niveau: (e, el) => {
        potje.niveau = el.dataset.id;
        potje.uitslag.push({ speler, niveau: el.dataset.id, goed: 0, punten: 0 });
        potje.vraagNr = 0;
        toonVraag();
      },
    });
  }

  function spelkop(extra = '') {
    return `<div class="spelkop">
      <button class="terug" data-actie="stop">✕ Stop</button>
      <div class="wie-speelt">${teamLabel(potje.team)} ${extra}</div>
      <span class="quiz-voortgang">Speler ${potje.s + 1}/${potje.spelers.length}</span>
    </div>`;
  }

  function stoppen() {
    if (!confirm('Stoppen? Deze beurt telt dan niet en jullie mogen straks opnieuw.')) return;
    clearInterval(potje.klok);
    potje.beurt.stop();
  }

  /* ---------- Vragen ---------- */

  // Volgende vraag van dit niveau die vanavond nog niet gesteld is.
  function pakVraag(niveau) {
    const gehad = new Set(Opslag.lees('sportquiz.gehad', []));
    let over = NIVEAUS[niveau].vragen.filter(q => !gehad.has(q.v));
    if (!over.length) {
      NIVEAUS[niveau].vragen.forEach(q => gehad.delete(q.v));
      over = NIVEAUS[niveau].vragen;
    }
    const q = willekeurig(over);
    gehad.add(q.v);
    Opslag.schrijf('sportquiz.gehad', [...gehad]);
    return { ...q, opties: schud(q.a), goed: q.a[0] };
  }

  function toonVraag() {
    const n = NIVEAUS[potje.niveau];
    const speler = potje.spelers[potje.s];
    const q = pakVraag(potje.niveau);
    potje.vraag = q;
    potje.beantwoord = false;
    toonScherm(`
      ${spelkop(`· <b>${esc(speler)}</b> <span class="ronde-label">${n.emoji} ${esc(n.titel)}</span>`)}
      <div class="quiz schuif-in">
        <div class="quiz-teller">Vraag ${potje.vraagNr + 1} van ${potje.perSpeler}</div>
        ${potje.seconden ? '<div class="quiz-tijd"><i id="quiz-tijd"></i></div>' : ''}
        <div class="quiz-vraag">${esc(q.v)}</div>
        <div class="quiz-antwoorden">
          ${q.opties.map((a, i) => `
            <button class="quiz-antwoord" data-actie="antwoord" data-i="${i}">
              <span class="quiz-letter">${LETTERS[i]}</span><span>${esc(a)}</span>
            </button>`).join('')}
        </div>
        <div class="quiz-uitslag" id="quiz-uitslag"></div>
      </div>
    `, {
      stop: () => stoppen(),
      antwoord: (e, el) => antwoord(+el.dataset.i),
    });

    if (potje.seconden) {
      const balk = document.getElementById('quiz-tijd');
      const start = Date.now();
      clearInterval(potje.klok);
      potje.klok = setInterval(() => {
        const over = 1 - (Date.now() - start) / (potje.seconden * 1000);
        if (!document.body.contains(balk)) { clearInterval(potje.klok); return; }
        balk.style.width = Math.max(0, over * 100) + '%';
        balk.classList.toggle('bijna', over < 0.3);
        if (over <= 0) antwoord(null);
      }, 100);
    }
  }

  function antwoord(i) {
    if (potje.beantwoord) return;
    potje.beantwoord = true;
    clearInterval(potje.klok);
    const q = potje.vraag;
    const n = NIVEAUS[potje.niveau];
    const goed = i !== null && q.opties[i] === q.goed;
    const u = potje.uitslag[potje.uitslag.length - 1];
    if (goed) { u.goed += 1; u.punten += n.punten; }

    app.querySelectorAll('.quiz-antwoord').forEach((b, j) => {
      b.disabled = true;
      if (q.opties[j] === q.goed) b.classList.add('juist');
      else if (j === i) b.classList.add('onjuist');
    });

    potje.vraagNr += 1;
    const laatsteVraag = potje.vraagNr >= potje.perSpeler;
    const laatsteSpeler = laatsteVraag && potje.s + 1 >= potje.spelers.length;
    const volgendeSpeler = laatsteVraag && !laatsteSpeler ? potje.spelers[potje.s + 1] : null;

    document.getElementById('quiz-uitslag').innerHTML = `
      <div class="quiz-melding ${goed ? 'goed' : 'fout'}">
        ${goed ? `✅ Goed! +${n.punten} ${n.punten === 1 ? 'punt' : 'punten'}` : i === null ? `⏰ Tijd is om! Het was: <b>${esc(q.goed)}</b>` : `❌ Helaas, het was: <b>${esc(q.goed)}</b>`}
        ${q.u ? `<small>${esc(q.u)}</small>` : ''}
      </div>
      <button class="knop goud" id="quiz-verder">${laatsteSpeler ? 'Klaar! Bekijk de score ▶️' : volgendeSpeler ? `Volgende speler: ${esc(volgendeSpeler)} ▶️` : 'Volgende vraag ▶️'}</button>`;
    if (goed) confettiKlein();
    document.getElementById('quiz-verder').addEventListener('click', () => {
      if (!laatsteVraag) toonVraag();
      else if (!laatsteSpeler) { potje.s += 1; kiesNiveau(); }
      else einde();
    });
  }

  function confettiKlein() {
    const el = app.querySelector('.quiz-antwoord.juist');
    if (el) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 400 });
  }

  function einde() {
    const u = potje.uitslag;
    const punten = u.reduce((s, x) => s + x.punten, 0);
    const goed = u.reduce((s, x) => s + x.goed, 0);
    const totaal = u.length * potje.perSpeler;
    potje.beurt.klaar({
      punten,
      tekst: `${goed} van ${totaal} goed`,
      titel: `${goed} van de ${totaal} goed!`,
      emoji: goed === totaal ? '🧠' : goed >= totaal / 2 ? '👏' : '🎅',
      details: `<ul class="tijden-lijst">
        ${u.map(x => `<li><span>${NIVEAUS[x.niveau].emoji} ${esc(x.speler)}</span><b>${x.goed}/${potje.perSpeler} goed = ${x.punten} ${x.punten === 1 ? 'punt' : 'punten'}</b></li>`).join('')}
      </ul>`,
      feest: goed === totaal,
    });
  }

  registreerSpel({
    id: 'sportquiz',
    naam: NAAM,
    emoji: '❓',
    minuten: 12,
    kort: 'Meerkeuzevragen over sport. Iedereen kiest zelf: makkelijk, gemiddeld of expert.',
    film: 'Iedereen krijgt sportvragen op een zelfgekozen niveau: makkelijk, gemiddeld of expert. Hoe moeilijker, hoe meer punten. Durf jij expert?',
    instellingen: {
      vragen: { label: 'Vragen per speler', standaard: 3, min: 1, max: 6, stap: 1 },
      seconden: { label: 'Seconden per vraag (0 = geen klok)', standaard: 30, min: 0, max: 60, stap: 10, eenheid: 'sec' },
    },
    stappen: inst => [
      { icoon: '🎯', tekst: `Iedereen uit het team krijgt om de beurt <b>${inst.vragen} ${inst.vragen === 1 ? 'vraag' : 'vragen'}</b>.` },
      { icoon: '🟢🟡🔴', tekst: 'Kies vooraf je niveau: <b>makkelijk</b>, <b>gemiddeld</b> of <b>expert</b>.' },
      { icoon: '🤫', tekst: 'Alleen wie aan de beurt is mag antwoorden. Niet voorzeggen!' },
      { icoon: '⏱️', tekst: inst.seconden ? `Je hebt <b>${inst.seconden} seconden</b> per vraag. Tik op A, B, C of D.` : 'Neem de tijd en tik op A, B, C of D.' },
    ],
    punten: () => 'Per goed antwoord: makkelijk <b>1 punt</b>, gemiddeld <b>2 punten</b>, expert <b>3 punten</b>. Fout is 0.',
    plaatje: () => `
      <div class="plaat plaat-quiz">
        <div class="quiz-mini">
          <div class="quiz-mini-vraag">?</div>
          <div class="quiz-mini-grid"><span>A</span><span class="juist">B</span><span>C</span><span>D</span></div>
        </div>
        <div class="quiz-mini-niveaus"><span>🟢 1</span><span>🟡 2</span><span>🔴 3</span></div>
      </div>`,
    speelBeurt,
  });
})();
