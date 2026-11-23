/*
 * Wie ben ik?
 * Eén speler houdt de iPad met het scherm naar voren op het voorhoofd en ziet zelf
 * niet wat er staat. Het team geeft hints of beeldt uit.
 * Rechts tikken = goed (1 punt), links tikken = overslaan.
 * Standaard twee rondes per team: eerst sporters raden, dan sporten uitbeelden,
 * elke ronde raadt iemand anders. Kaartjes komen op een avond niet dubbel voor.
 */
(function () {
  const NAAM = 'Wie ben ik?';
  const SETS = window.KERST_DATA.wieBenIk;
  let potje = null;
  const stapels = {}; // per set, gedeeld door alle teams: geen dubbele kaartjes

  function rondes(inst) {
    return inst.set === 'beide' ? [SETS.sporters, SETS.uitbeelden] : [SETS[inst.set] || SETS.sporters];
  }

  function uitlegRonde(set, lid, team) {
    return `${lid !== team.naam ? `<b>${esc(lid)}</b> raadt` : 'Eén speler raadt'} en houdt de iPad op het voorhoofd.
      De rest van het team ${set === SETS.uitbeelden ? '<b>beeldt uit</b> (niet praten!)' : 'geeft hints'}. Je hebt <b>${potje.duur} seconden</b>.`;
  }

  function speelBeurt(beurt) {
    const lijst = rondes(beurt.inst);
    const team = Teams.lijst()[beurt.teamIndex];
    potje = { beurt, rondes: lijst, ronde: 0, uitslagen: [], duur: beurt.inst.duur };
    potje.set = lijst[0];
    potje.lid = Teams.volgendLid(beurt.teamIndex);
    toonBeurt({
      spel: NAAM,
      emoji: potje.set.emoji,
      teamIndex: beurt.teamIndex,
      lid: potje.lid,
      uitleg: `${lijst.length > 1 ? `<b>Ronde 1 van 2: ${esc(potje.set.titel)}</b><br>` : ''}${uitlegRonde(potje.set, potje.lid, team)}`,
      knop: 'Start het aftellen ⏱️',
      verder: () => aftellen(),
      terug: () => beurt.stop(),
    });
  }

  function aftellen() {
    let n = 3;
    toonScherm(`<div class="midden"><div class="aftel" id="aftel">3</div><p>iPad op je hoofd, scherm naar je team!</p></div>`);
    const t = setInterval(() => {
      n -= 1;
      const el = document.getElementById('aftel');
      if (!el) { clearInterval(t); return; }
      if (n === 0) { clearInterval(t); speel(); return; }
      el.textContent = n;
    }, 1000);
  }

  function volgendeKaart() {
    const id = potje.set.titel;
    if (!stapels[id] || !stapels[id].length) stapels[id] = schud(potje.set.kaarten);
    return stapels[id].pop();
  }

  function kaartHtml(naam) {
    const foto = potje.set === SETS.sporters ? fotoVan(naam) : null;
    return foto
      ? `<img class="wbi-foto" src="${foto}" alt="" draggable="false"><div class="wbi-naam">${esc(naam)}</div>`
      : `<div class="wbi-naam alleen">${esc(naam)}</div>`;
  }

  function speel() {
    const team = Teams.lijst()[potje.beurt.teamIndex];
    potje.gehad = [];
    potje.kaart = volgendeKaart();
    let over = potje.duur;

    toonScherm(`
      <div class="wbi" id="wbi">
        <div class="wbi-balk"><div id="balk" style="width:100%"></div></div>
        <div class="wbi-kop"><span><button class="terug" data-actie="stop">✕</button> ${teamLabel(team)}${potje.rondes.length > 1 ? ` <span class="ronde-label">${potje.set.emoji} ${potje.ronde + 1}/2</span>` : ''}</span><span id="tijd" class="wbi-tijd">${over}</span><span id="score">✅ 0</span></div>
        <div class="wbi-kaart" id="kaart">${kaartHtml(potje.kaart)}</div>
        <div class="wbi-zones">
          <button class="wbi-zone pas" data-zone="pas"><span>⏭️ Overslaan</span></button>
          <button class="wbi-zone goed" data-zone="goed"><span>✅ Goed</span></button>
        </div>
      </div>
    `, {
      stop: () => {
        if (!confirm('Stoppen? Deze beurt telt dan niet en jullie mogen straks opnieuw.')) return;
        clearInterval(potje.klok);
        potje.klok = null;
        potje.beurt.stop();
      },
    });

    app.querySelectorAll('.wbi-zone').forEach(z => {
      z.addEventListener('pointerdown', e => { e.preventDefault(); antwoord(z.dataset.zone === 'goed'); });
    });

    potje.klok = setInterval(() => {
      over -= 1;
      document.getElementById('tijd').textContent = over;
      document.getElementById('balk').style.width = (over / potje.duur) * 100 + '%';
      if (over <= 10) document.getElementById('tijd').classList.add('bijna');
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
    document.getElementById('kaart').innerHTML = kaartHtml(potje.kaart);
  }

  function einde() {
    clearInterval(potje.klok);
    potje.klok = null;
    // De kaart die nog op het scherm stond gaat terug op de stapel.
    stapels[potje.set.titel].push(potje.kaart);
    const r = { set: potje.set, lid: potje.lid, gehad: potje.gehad, laatste: potje.kaart, punten: potje.gehad.filter(g => g.goed).length };
    potje.uitslagen.push(r);
    if (potje.ronde + 1 < potje.rondes.length) toonTussenstand(r);
    else klaar();
  }

  function lijstje(r) {
    return `<ul class="resultaat-lijst">
      ${r.gehad.map(g => `<li class="${g.goed ? 'goed' : ''}">${g.goed ? '✅' : '⏭️'} ${esc(g.kaart)}</li>`).join('')}
      <li>⏰ ${esc(r.laatste)}</li>
    </ul>`;
  }

  // Tussen de rondes: uitslag ronde 1 en wie er nu raadt.
  function toonTussenstand(r) {
    const team = Teams.lijst()[potje.beurt.teamIndex];
    potje.ronde += 1;
    potje.set = potje.rondes[potje.ronde];
    potje.lid = Teams.volgendLid(potje.beurt.teamIndex);
    toonScherm(`
      <div class="kop"><span></span><div class="titel">${esc(NAAM)} · ronde 1 klaar</div><span></span></div>
      <div class="midden schuif-in">
        <h2>⏰ Tijd! ${r.punten} geraden</h2>
        ${lijstje(r)}
        <p class="punten-groot" style="color:${team.kleur}"><b>+${r.punten} ${r.punten === 1 ? 'punt' : 'punten'}</b> in deze ronde</p>
        <div class="volgende-ronde">
          <span class="volgende-emoji">${potje.set.emoji}</span>
          <div><small>Ronde 2</small><b>${esc(potje.set.titel)}</b><p>${uitlegRonde(potje.set, potje.lid, team)}</p></div>
        </div>
        <div class="knoppen"><button class="knop goud groot" data-actie="verder">Start het aftellen ⏱️</button></div>
      </div>
    `, { verder: () => aftellen() });
  }

  function klaar() {
    const u = potje.uitslagen;
    const punten = u.reduce((som, r) => som + r.punten, 0);
    potje.beurt.klaar({
      punten,
      tekst: u.length > 1 ? u.map(r => `${r.set.emoji} ${r.punten}`).join(' · ') + ' geraden' : `${punten} geraden`,
      titel: `${punten} geraden!`,
      emoji: '⏰',
      details: u.length > 1
        ? `<ul class="tijden-lijst">${u.map(r => `<li><span>${r.set.emoji} ${esc(r.set.titel)} (${esc(r.lid)})</span><b>${r.punten} geraden</b></li>`).join('')}</ul>${lijstje(u[u.length - 1])}`
        : lijstje(u[0]),
      feest: punten >= 10,
    });
  }

  registreerSpel({
    id: 'wie-ben-ik',
    naam: NAAM,
    emoji: '🤔',
    minuten: 10,
    kort: 'iPad op je hoofd! Eerst sporters raden met hints, dan sporten raden die je team uitbeeldt.',
    film: 'Eén speler houdt de iPad op het voorhoofd en ziet niet wat erop staat. Eerst raad je bekende sporters met hints van je team. Daarna beeldt je team sporten uit. Hoeveel raden jullie er?',
    instellingen: {
      set: {
        label: 'Welke kaartjes?',
        standaard: 'beide',
        opties: [{ waarde: 'beide', label: 'Allebei', emoji: '⭐🤸', klein: 'Ronde 1 sporters, ronde 2 uitbeelden' }]
          .concat(Object.entries(SETS).map(([id, s]) => ({ waarde: id, label: s.titel, emoji: s.emoji, klein: `${s.uitleg} · ${s.kaarten.length} kaartjes` }))),
      },
      duur: { label: 'Hoeveel seconden per ronde?', standaard: 60, min: 30, max: 180, stap: 15, eenheid: 'sec' },
    },
    stappen: inst => [
      { icoon: '🙆', tekst: 'Eén speler houdt de iPad <b>op het voorhoofd</b>, met het scherm naar het team. Niet spieken!' },
      inst.set === 'beide'
        ? { icoon: '🗣️', tekst: 'Twee rondes, telkens raadt iemand anders. Ronde 1: <b>sporters</b>, het team geeft hints. Ronde 2: sporten, het team <b>beeldt uit</b>.' }
        : { icoon: '🗣️', tekst: `Het team ${inst.set === 'uitbeelden' ? 'beeldt uit' : 'geeft hints'}. De naam zelf zeggen mag niet.` },
      { icoon: '👉', tekst: 'Geraden? Tik op de <b>rechterkant</b> van het scherm. Te moeilijk? Tik <b>links</b> om over te slaan.' },
      { icoon: '⏱️', tekst: `Je hebt <b>${inst.duur} seconden</b>${inst.set === 'beide' ? ' per ronde' : ''}. Raad er zoveel mogelijk!` },
    ],
    punten: () => '<b>1 punt</b> per geraden kaartje.',
    plaatje: () => `
      <div class="plaat plaat-wbi">
        <div class="wbi-waaier">
          ${['Johan Cruijff', 'Serena Williams', 'Max Verstappen', 'Usain Bolt', 'Michael Jordan']
            .map((n, i) => `<div class="waaier-kaart" style="--i:${i - 2}">${fotoHtml(n, { emoji: '⭐' })}</div>`).join('')}
        </div>
        <div class="wbi-vraag">?</div>
      </div>`,
    speelBeurt,
  });
})();
