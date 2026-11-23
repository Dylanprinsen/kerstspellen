/*
 * Wie ben ik?
 * Eén speler houdt de iPad met het scherm naar voren op het voorhoofd en ziet zelf
 * niet wat er staat. Het team geeft hints of beeldt uit.
 * Rechts tikken = goed (1 punt), links tikken = overslaan.
 */
(function () {
  const NAAM = 'Wie ben ik?';
  const SETS = window.KERST_DATA.wieBenIk;
  let potje = null;

  function speelBeurt(beurt) {
    const set = SETS[beurt.inst.set] || SETS.sporters;
    const lid = Teams.volgendLid(beurt.teamIndex);
    const team = Teams.lijst()[beurt.teamIndex];
    potje = { beurt, set, duur: beurt.inst.duur, lid, stapel: schud(set.kaarten) };
    toonBeurt({
      spel: NAAM,
      emoji: set.emoji,
      teamIndex: beurt.teamIndex,
      lid,
      uitleg: `${lid !== team.naam ? `<b>${esc(lid)}</b> raadt` : 'Eén speler raadt'} en houdt de iPad op het voorhoofd.
        De rest van het team geeft hints${set === SETS.uitbeelden ? ' en beeldt uit' : ''}. Je hebt <b>${potje.duur} seconden</b>.`,
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
    if (!potje.stapel.length) potje.stapel = schud(potje.set.kaarten);
    return potje.stapel.pop();
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
        <div class="wbi-kop"><span><button class="terug" data-actie="stop">✕</button> ${teamLabel(team)}</span><span id="tijd" class="wbi-tijd">${over}</span><span id="score">✅ 0</span></div>
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
    const punten = potje.gehad.filter(g => g.goed).length;
    potje.beurt.klaar({
      punten,
      tekst: `${punten} geraden`,
      titel: `Tijd! ${punten} geraden`,
      emoji: '⏰',
      details: `<ul class="resultaat-lijst">
        ${potje.gehad.map(g => `<li class="${g.goed ? 'goed' : ''}">${g.goed ? '✅' : '⏭️'} ${esc(g.kaart)}</li>`).join('')}
        <li>⏰ ${esc(potje.kaart)}</li>
      </ul>`,
      feest: punten >= 8,
    });
  }

  registreerSpel({
    id: 'wie-ben-ik',
    naam: NAAM,
    emoji: '🤔',
    kort: 'iPad op je hoofd, je team geeft hints of beeldt uit. Hoeveel raad je in een minuut?',
    film: 'Eén speler houdt de iPad op het voorhoofd en ziet niet wie erop staat. De rest van het team geeft hints. Hoeveel raden jullie er in één minuut?',
    instellingen: {
      set: {
        label: 'Welke kaartjes?',
        standaard: 'sporters',
        opties: Object.entries(SETS).map(([id, s]) => ({ waarde: id, label: s.titel, emoji: s.emoji, klein: `${s.uitleg} · ${s.kaarten.length} kaartjes` })),
      },
      duur: { label: 'Hoeveel seconden per beurt?', standaard: 60, min: 30, max: 180, stap: 15, eenheid: 'sec' },
    },
    stappen: inst => [
      { icoon: '🙆', tekst: 'Eén speler houdt de iPad <b>op het voorhoofd</b>, met het scherm naar het team. Niet spieken!' },
      { icoon: '🗣️', tekst: `Het team geeft hints${inst.set === 'uitbeelden' ? ' en beeldt uit' : ''}. De naam zelf zeggen mag niet.` },
      { icoon: '👉', tekst: 'Geraden? Tik op de <b>rechterkant</b> van het scherm. Te moeilijk? Tik <b>links</b> om over te slaan.' },
      { icoon: '⏱️', tekst: `Je hebt <b>${inst.duur} seconden</b>. Raad er zoveel mogelijk!` },
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
