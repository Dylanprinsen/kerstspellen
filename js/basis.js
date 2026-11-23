/*
 * Basis voor alle spellen: opslag, spelers, scores en schermen.
 *
 * Alles wordt nu op dit ene apparaat bewaard (localStorage).
 * Later, voor meerdere apparaten, hoeven alleen Spelers en Scores
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

const KLEUREN = ['#c8102e', '#2eb872', '#f4c542', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#8b5a2b', '#64748b'];

const Spelers = {
  lijst() {
    return Opslag.lees('spelers', []);
  },
  toevoegen(naam) {
    naam = naam.trim().slice(0, 20);
    if (!naam) return;
    const lijst = this.lijst();
    if (lijst.some(s => s.naam.toLowerCase() === naam.toLowerCase())) return;
    const gebruikt = lijst.map(s => s.kleur);
    const kleur = KLEUREN.find(k => !gebruikt.includes(k)) || KLEUREN[lijst.length % KLEUREN.length];
    lijst.push({ naam, kleur });
    Opslag.schrijf('spelers', lijst);
  },
  verwijderen(naam) {
    Opslag.schrijf('spelers', this.lijst().filter(s => s.naam !== naam));
  },
  // Spelers voor een potje; zonder ingevoerde spelers speel je als "Speler".
  voorPotje() {
    const lijst = this.lijst();
    return lijst.length ? lijst : [{ naam: 'Speler', kleur: KLEUREN[0] }];
  },
};

const Scores = {
  alles() {
    return Opslag.lees('scores', {});
  },
  // Een gespeelde beurt bewaren: beste reeks en aantal keer gewonnen.
  bewaar(spelId, naam, score, gewonnen) {
    const alles = this.alles();
    const spel = alles[spelId] || (alles[spelId] = {});
    const s = spel[naam] || (spel[naam] = { beste: 0, gewonnen: 0, gespeeld: 0 });
    s.beste = Math.max(s.beste, score);
    s.gespeeld += 1;
    if (gewonnen) s.gewonnen += 1;
    Opslag.schrijf('scores', alles);
  },
  voorSpel(spelId) {
    return this.alles()[spelId] || {};
  },
  wis() {
    Opslag.schrijf('scores', {});
  },
};

/* ---------- Schermen ---------- */

const app = document.getElementById('app');

// Toon een scherm. `acties` koppelt data-actie="naam" aan een functie.
function toonScherm(html, acties = {}) {
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

function kop(titel, terugActie = 'menu') {
  return `<div class="kop">
    <button class="terug" data-actie="${terugActie}">← Terug</button>
    <div class="titel">${esc(titel)}</div>
    <span style="width:80px"></span>
  </div>`;
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

/* ---------- Spellen-register ---------- */

// Elk spel meldt zich hier aan met { id, naam, emoji, tekst, start }.
const Spellen = [];
function registreerSpel(spel) {
  Spellen.push(spel);
}
