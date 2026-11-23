/*
 * Wie ben ik?
 * Eén speler houdt de iPad met het scherm naar voren op het voorhoofd en ziet zelf
 * niet wat er staat. Het team geeft hints of beeldt uit.
 * Rechts tikken = goed (1 punt), links tikken = overslaan.
 */
(function () {
  const SPEL_ID = 'wie-ben-ik';
  const NAAM = 'Wie ben ik?';
  const SETS = window.KERST_DATA.wieBenIk;

  const instellingen = Opslag.lees('wie-ben-ik', { set: 'sporters', duur: 60 });
  let potje = null;

  function toonInstellingen() {
    toonScherm(`
      ${kop(NAAM)}
      <div class="sectie-titel">Kies de kaartjes</div>
      <div class="keuzes">
        ${Object.entries(SETS).map(([id, s]) => `
          <button class="keuze ${id === instellingen.set ? 'actief' : ''}" data-actie="set" data-id="${id}">
            <span class="emoji">${s.emoji}</span>
            <span><strong>${esc(s.titel)}</strong><small>${esc(s.uitleg)} · ${s.kaarten.length} kaartjes</small></span>
          </button>`).join('')}
      </div>

      <div class="sectie-titel">Hoeveel seconden per beurt?</div>
      <div class="stepper">
        <button data-actie="min" aria-label="Minder">−</button>
        <span class="getal" id="duur">${instellingen.duur}</span>
        <button data-actie="plus" aria-label="Meer">+</button>
      </div>

      <div class="sectie-titel">Zo werkt het</div>
      <div class="balk"><span>Eén speler houdt de iPad <b>op het voorhoofd</b>, scherm naar het team. Het team geeft hints of beeldt uit.
        Tik <b>rechts</b> bij goed (1 punt), <b>links</b> om over te slaan.</span></div>

      <div class="knoppen"><button class="knop goud breed" data-actie="start">▶️ Start</button></div>
    `, {
      menu: () => toonMenu(),
      set: (e, el) => { instellingen.set = el.dataset.id; Opslag.schrijf('wie-ben-ik', instellingen); toonInstellingen(); },
      min: () => wijzigDuur(-15),
      plus: () => wijzigDuur(15),
      start: () => startPotje(),
    });
  }

  function wijzigDuur(stap) {
    instellingen.duur = Math.max(30, Math.min(180, instellingen.duur + stap));
    Opslag.schrijf('wie-ben-ik', instellingen);
    document.getElementById('duur').textContent = instellingen.duur;
  }

  function startPotje() {
    potje = {
      set: SETS[instellingen.set],
      duur: instellingen.duur,
      team: 0,
      puntenRonde: Teams.lijst().map(() => 0),
      stapel: schud(SETS[instellingen.set].kaarten),
    };
    toonBeurtWBI();
  }

  function toonBeurtWBI() {
    potje.lid = Teams.volgendLid(potje.team);
    const raden = potje.lid !== Teams.lijst()[potje.team].naam ? `<b>${esc(potje.lid)}</b> raadt` : 'Eén speler raadt';
    toonBeurt({
      spel: NAAM,
      emoji: potje.set.emoji,
      teamIndex: potje.team,
      lid: potje.lid,
      uitleg: `${raden} en houdt de iPad op het voorhoofd. De rest van het team helpt. Je hebt ${potje.duur} seconden.`,
      knop: 'Start het aftellen',
      verder: () => aftellen(),
      terug: () => toonInstellingen(),
    });
  }

  function aftellen() {
    let n = 3;
    toonScherm(`<div class="midden"><div class="aftel" id="aftel">3</div><p>iPad op je hoofd!</p></div>`);
    const t = setInterval(() => {
      n -= 1;
      if (n === 0) { clearInterval(t); speel(); return; }
      document.getElementById('aftel').textContent = n;
    }, 1000);
  }

  function volgendeKaart() {
    if (!potje.stapel.length) potje.stapel = schud(potje.set.kaarten);
    return potje.stapel.pop();
  }

  function speel() {
    const team = Teams.lijst()[potje.team];
    potje.gehad = [];
    potje.kaart = volgendeKaart();
    let over = potje.duur;

    toonScherm(`
      <div class="wbi" id="wbi">
        <div class="wbi-balk"><div id="balk" style="width:100%"></div></div>
        <div class="wbi-kop"><span><button class="terug" data-actie="stop">✕</button> ${teamLabel(team)}</span><span id="tijd">${over}</span><span id="score">✅ 0</span></div>
        <div class="wbi-kaart" id="kaart">${esc(potje.kaart)}</div>
        <div class="wbi-zones">
          <button class="wbi-zone" data-zone="pas">⏭️ Overslaan</button>
          <button class="wbi-zone" data-zone="goed">✅ Goed</button>
        </div>
      </div>
    `, {
      stop: () => {
        if (!confirm('Beurt stoppen? Deze beurt telt dan niet.')) return;
        clearInterval(potje.klok);
        potje.klok = null;
        toonInstellingen();
      },
    });

    app.querySelectorAll('.wbi-zone').forEach(z => {
      z.addEventListener('pointerdown', e => { e.preventDefault(); antwoord(z.dataset.zone === 'goed'); });
    });

    potje.klok = setInterval(() => {
      over -= 1;
      document.getElementById('tijd').textContent = over;
      document.getElementById('balk').style.width = (over / potje.duur) * 100 + '%';
      if (over <= 0) einde();
    }, 1000);
  }

  function antwoord(goed) {
    if (!potje.klok) return;
    potje.gehad.push({ kaart: potje.kaart, goed });
    const wbi = document.getElementById('wbi');
    wbi.classList.remove('wbi-flits-goed', 'wbi-flits-pas');
    void wbi.offsetWidth;
    wbi.classList.add(goed ? 'wbi-flits-goed' : 'wbi-flits-pas');
    document.getElementById('score').textContent = '✅ ' + potje.gehad.filter(g => g.goed).length;
    potje.kaart = volgendeKaart();
    document.getElementById('kaart').textContent = potje.kaart;
  }

  function einde() {
    clearInterval(potje.klok);
    potje.klok = null;
    const teams = Teams.lijst();
    const team = teams[potje.team];
    const punten = potje.gehad.filter(g => g.goed).length;
    Stand.geef(potje.team, SPEL_ID, punten);
    potje.puntenRonde[potje.team] += punten;
    const laatste = potje.team === teams.length - 1;

    toonScherm(`
      ${kop(NAAM, 'terug')}
      <div class="midden schuif-in">
        <div class="groot-emoji">⏰</div>
        <h2>Tijd!</h2>
        <p style="font-size:30px;color:${team.kleur}"><b>+${punten} punten</b> voor ${esc(team.naam)}</p>
        <ul class="resultaat-lijst">
          ${potje.gehad.map(g => `<li class="${g.goed ? 'goed' : ''}">${g.goed ? '✅' : '⏭️'} ${esc(g.kaart)}</li>`).join('')}
          <li>⏰ ${esc(potje.kaart)}</li>
        </ul>
        <div class="knoppen">
          <button class="knop goud" data-actie="volgende">${laatste ? 'Bekijk de uitslag ▶️' : 'Volgende: ' + esc(teams[potje.team + 1].naam) + ' ▶️'}</button>
        </div>
      </div>
    `, {
      terug: () => toonInstellingen(),
      volgende: () => {
        if (!laatste) { potje.team += 1; toonBeurtWBI(); return; }
        toonRondeUitslag({
          spel: NAAM,
          puntenRonde: potje.puntenRonde,
          opnieuw: () => { potje.team = 0; potje.puntenRonde = teams.map(() => 0); toonBeurtWBI(); },
          terug: () => toonMenu(),
        });
      },
    });
  }

  registreerSpel({
    id: SPEL_ID,
    naam: NAAM,
    emoji: '🤔',
    tekst: 'iPad op je hoofd, je team geeft hints of beeldt uit. Hoeveel raad je in een minuut?',
    start: toonInstellingen,
  });
})();
