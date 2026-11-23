/*
 * Basis voor alle spellen: opslag, teams, uitslagen, schermen en hulpjes.
 *
 * Alles wordt nu op dit ene apparaat bewaard (localStorage).
 * Later, voor meerdere apparaten, hoeven alleen Teams en Stand
 * een gedeelde opslag te krijgen; de spellen zelf blijven hetzelfde.
 */

const Opslag = {
  lees(sleutel, standaard) {
    try {
      const v = localStorage.getItem('kerst.' + sleutel);
      return v === null ? standaard : JSON.parse(v);
    } catch (e) {
      return standaard;
    }
  },
  schrijf(sleutel, waarde) {
    try {
      localStorage.setItem('kerst.' + sleutel, JSON.stringify(waarde));
    } catch (e) { /* privévenster: dan gewoon niet bewaren */ }
  },
};

const STANDAARD_TEAMS = [
  { naam: 'Team Rood', kleur: '#e5484d', leden: [], beurt: 0 },
  { naam: 'Team Groen', kleur: '#2eb872', leden: [], beurt: 0 },
  { naam: 'Team Goud', kleur: '#f4c542', leden: [], beurt: 0 },
];

const Teams = {
  lijst() {
    return Opslag.lees('teams', STANDAARD_TEAMS);
  },
  bewaar(teams) {
    Opslag.schrijf('teams', teams);
  },
  // Wie van dit team is nu aan de beurt? Schuift daarna door naar het volgende lid.
  volgendLid(i) {
    const teams = this.lijst();
    const t = teams[i];
    if (!t.leden.length) return t.naam;
    const lid = t.leden[t.beurt % t.leden.length];
    t.beurt = (t.beurt + 1) % t.leden.length;
    this.bewaar(teams);
    return lid;
  },
};

/* ---------- Spellen-register ---------- */

/*
 * Elk spel meldt zich aan met registreerSpel({...}). De volgorde van de
 * <script>-regels in index.html is de vaste volgorde van de avond.
 *   id, naam, emoji, kort           tekst op de startpagina
 *   plaatje()                       html voor het plaatje bij het spel
 *   stappen(inst), punten(inst)     uitleg vóór het spel
 *   instellingen                    keuzes voor de spelleider (zie Instellingen)
 *   speelBeurt(beurt)               speelt één beurt van één team, zie startBeurt in app.js
 *   verdeelPunten(resultaten)       optioneel: punten pas als alle teams geweest zijn
 */
const Spellen = [];
function registreerSpel(spel) {
  Spellen.push(spel);
}

// Instellingen van een spel: standaardwaarden, aangepast door de spelleider.
const Instellingen = {
  lees(spel) {
    const bewaard = Opslag.lees('inst.' + spel.id, {});
    const inst = {};
    Object.entries(spel.instellingen || {}).forEach(([k, def]) => {
      inst[k] = k in bewaard ? bewaard[k] : def.standaard;
    });
    return inst;
  },
  zet(spel, sleutel, waarde) {
    const bewaard = Opslag.lees('inst.' + spel.id, {});
    bewaard[sleutel] = waarde;
    Opslag.schrijf('inst.' + spel.id, bewaard);
  },
};

/*
 * Uitslagen van de avond: per spel per team het resultaat van de beurt,
 * bijv. { punten: 5, tekst: '4 goed + bonus' }. De stand wordt hieruit berekend.
 */
const Stand = {
  alles() {
    return Opslag.lees('uitslagen', {});
  },
  van(spelId) {
    return this.alles()[spelId] || {};
  },
  zet(spelId, teamIndex, resultaat) {
    const alles = this.alles();
    (alles[spelId] = alles[spelId] || {})[teamIndex] = resultaat;
    Opslag.schrijf('uitslagen', alles);
  },
  // Hebben alle teams dit spel gespeeld?
  klaar(spelId) {
    const r = this.van(spelId);
    return Teams.lijst().every((t, i) => r[i]);
  },
  begonnen(spelId) {
    return Object.keys(this.van(spelId)).length > 0;
  },
  // Punten per team voor één spel.
  punten(spelId) {
    const spel = Spellen.find(s => s.id === spelId);
    const r = this.van(spelId);
    const n = Teams.lijst().length;
    if (spel && spel.verdeelPunten) {
      return this.klaar(spelId) ? spel.verdeelPunten([...Array(n)].map((_, i) => r[i])) : Array(n).fill(0);
    }
    return [...Array(n)].map((_, i) => (r[i] && r[i].punten) || 0);
  },
  totaal(teamIndex) {
    return Spellen.reduce((som, s) => som + this.punten(s.id)[teamIndex], 0);
  },
  wis() {
    Opslag.schrijf('uitslagen', {});
  },
};

/* ---------- Schermen ---------- */

const app = document.getElementById('app');

// Toon een scherm. `acties` koppelt data-actie="naam" aan een functie.
function toonScherm(html, acties = {}) {
  Spraak.stop();
  app.innerHTML = html;
  app.querySelectorAll('[data-actie]').forEach(el => {
    const fn = acties[el.dataset.actie];
    if (fn) el.addEventListener('click', e => fn(e, el));
  });
  window.scrollTo(0, 0);
}

function esc(tekst) {
  return String(tekst).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function kop(titel, terugActie = 'terug', terugTekst = '← Terug') {
  return `<div class="kop">
    <button class="terug" data-actie="${terugActie}">${terugTekst}</button>
    <div class="titel">${esc(titel)}</div>
    <span class="kop-ruimte"></span>
  </div>`;
}

// Zet een punt achter een zin, tenzij die al op . ? of ! eindigt.
function zin(t) {
  return /[.?!]$/.test(t) ? t : t + '.';
}

function willekeurig(lijst) {
  return lijst[Math.floor(Math.random() * lijst.length)];
}

function schud(lijst) {
  const a = lijst.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- Foto's van personen ---------- */

function fotoVan(naam) {
  return (window.KERST_DATA.fotos || {})[naam] || null;
}

// Foto van een persoon, of een gekleurd rondje met emoji als er geen foto is.
function fotoHtml(naam, { emoji = '⭐', kleur = '#f1e4cf', klasse = '' } = {}) {
  const src = fotoVan(naam);
  return src
    ? `<img class="foto ${klasse}" src="${src}" alt="${esc(naam)}" draggable="false">`
    : `<div class="foto foto-leeg ${klasse}" style="background:${kleur}">${emoji}</div>`;
}

/* ---------- Voorlezen ---------- */

/*
 * Voorlezen. Teksten waarvoor een opname bestaat (data/stem.js, gemaakt met
 * tools/maak_stem.py) worden met die warme stem afgespeeld. Andere teksten
 * (bijv. na het hernoemen van iets) leest het apparaat zelf voor.
 */
const Spraak = {
  kan: 'speechSynthesis' in window || 'Audio' in window,
  audio: null,
  // Tekst zoals hij voorgelezen wordt: zonder html en dubbele spaties. Zelfde regel als in tools/maak_stem.py.
  schoon(tekst) {
    return String(tekst).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  },
  opname(tekst) {
    return ((window.KERST_DATA || {}).stem || {})[this.schoon(tekst)] || null;
  },
  stemVanApparaat() {
    const stemmen = 'speechSynthesis' in window ? speechSynthesis.getVoices() : [];
    return stemmen.find(s => s.lang === 'nl-NL') || stemmen.find(s => s.lang && s.lang.startsWith('nl')) || null;
  },
  // Lees een tekst voor. klaar() wordt aangeroepen als het af is (ook bij een fout).
  zeg(tekst, klaar) {
    this.stop();
    const gedaan = () => { if (klaar) { const k = klaar; klaar = null; k(); } };
    const src = this.opname(tekst);
    if (src) {
      // Eén audio-element hergebruiken: op de iPad mag dat na de eerste tik steeds opnieuw spelen.
      if (!this.audio) this.audio = new Audio();
      this.audio.onended = gedaan;
      this.audio.onerror = gedaan;
      this.audio.src = src;
      const p = this.audio.play();
      if (p && p.catch) p.catch(gedaan);
      return;
    }
    if (!('speechSynthesis' in window)) { gedaan(); return; }
    const u = new SpeechSynthesisUtterance(this.schoon(tekst));
    u.lang = 'nl-NL';
    const stem = this.stemVanApparaat();
    if (stem) u.voice = stem;
    u.rate = 0.95;
    u.onend = gedaan;
    u.onerror = gedaan;
    speechSynthesis.speak(u);
  },
  stop() {
    if (this.audio) { this.audio.onended = null; this.audio.onerror = null; this.audio.pause(); }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  },
};

/* ---------- Effecten ---------- */

function startSneeuw() {
  const laag = document.querySelector('.sneeuw');
  if (!laag) return;
  for (let i = 0; i < 28; i++) {
    const v = document.createElement('span');
    v.className = 'vlok';
    v.textContent = Math.random() < .5 ? '❄' : '•';
    v.style.left = Math.random() * 100 + 'vw';
    v.style.fontSize = 8 + Math.random() * 14 + 'px';
    v.style.animationDuration = 8 + Math.random() * 12 + 's';
    v.style.animationDelay = -Math.random() * 20 + 's';
    laag.appendChild(v);
  }
}

function confetti() {
  const laag = document.createElement('div');
  laag.className = 'confetti';
  const kleuren = ['#c8102e', '#f4c542', '#2eb872', '#fff', '#3b82f6'];
  for (let i = 0; i < 120; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = willekeurig(kleuren);
    c.style.animationDuration = 2 + Math.random() * 2.5 + 's';
    c.style.animationDelay = Math.random() * .8 + 's';
    laag.appendChild(c);
  }
  document.body.appendChild(laag);
  setTimeout(() => laag.remove(), 5500);
}

// Laat een getal oplopen in een element.
function telOp(el, doel, formaat, duur = 900) {
  const start = performance.now();
  function stap(nu) {
    const t = Math.min(1, (nu - start) / duur);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = formaat(doel * ease);
    if (t < 1) requestAnimationFrame(stap);
    else el.textContent = formaat(doel);
  }
  requestAnimationFrame(stap);
}

/* ---------- Gedeelde schermen voor spellen ---------- */

function teamLabel(team, lid) {
  return `<span class="team-label" style="--team:${team.kleur}"><span class="bol" style="background:${team.kleur}"></span>${esc(team.naam)}${lid && lid !== team.naam ? ' · ' + esc(lid) : ''}</span>`;
}

// "Aan de beurt"-scherm. opties: { spel, emoji, teamIndex, lid, uitleg, knop, verder, terug }
function toonBeurt(o) {
  const team = Teams.lijst()[o.teamIndex];
  toonScherm(`
    ${kop(o.spel, 'terug', '← Ander team')}
    <div class="midden schuif-in">
      <div class="beurt-kaart" style="--team:${team.kleur}">
        <div class="groot-emoji">${o.emoji}</div>
        <p>Aan de beurt:</p>
        <h2 style="color:${team.kleur}">${esc(team.naam)}</h2>
        ${o.lid && o.lid !== team.naam ? `<p class="beurt-lid">${esc(o.lid)}</p>` : ''}
        <p>${o.uitleg}</p>
      </div>
      <div class="knoppen"><button class="knop goud groot" data-actie="verder">${o.knop || 'Klaar? Start!'}</button></div>
    </div>
  `, { terug: o.terug, verder: o.verder });
}
