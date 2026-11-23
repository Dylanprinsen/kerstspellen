/*
 * Basis voor alle spellen: opslag, spelers, scores en schermen.
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

// Totaalstand van de avond: punten per spel per team (op volgorde van de teams).
const Stand = {
  alles() {
    return Opslag.lees('stand', {});
  },
  geef(teamIndex, spelId, punten) {
    if (!punten) return;
    const alles = this.alles();
    const rij = alles[spelId] || (alles[spelId] = []);
    rij[teamIndex] = (rij[teamIndex] || 0) + punten;
    Opslag.schrijf('stand', alles);
  },
  totaal(teamIndex) {
    return Object.values(this.alles()).reduce((som, rij) => som + (rij[teamIndex] || 0), 0);
  },
  wis() {
    Opslag.schrijf('stand', {});
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

/* ---------- Gedeelde schermen voor spellen met teams ---------- */

function teamLabel(team, lid) {
  return `<span class="team-label" style="--team:${team.kleur}"><span class="bol" style="background:${team.kleur}"></span>${esc(team.naam)}${lid && lid !== team.naam ? ' · ' + esc(lid) : ''}</span>`;
}

// "Aan de beurt"-scherm. opties: { spel, emoji, teamIndex, lid, uitleg, knop, verder, terug }
function toonBeurt(o) {
  const team = Teams.lijst()[o.teamIndex];
  toonScherm(`
    ${kop(o.spel, 'terug')}
    <div class="midden schuif-in">
      <div class="groot-emoji">${o.emoji}</div>
      <p>Aan de beurt:</p>
      <h2 style="color:${team.kleur}">${esc(team.naam)}</h2>
      ${o.lid && o.lid !== team.naam ? `<p style="font-size:26px"><b>${esc(o.lid)}</b></p>` : ''}
      <p>${o.uitleg}</p>
      <div class="knoppen"><button class="knop goud" data-actie="verder">${o.knop || 'Klaar? Start!'}</button></div>
    </div>
  `, { terug: o.terug, verder: o.verder });
}

// Uitslag na een ronde (elk team één beurt). puntenRonde: punten per team deze ronde.
function toonRondeUitslag({ spel, puntenRonde, opnieuw, terug }) {
  const teams = Teams.lijst();
  const max = Math.max(...puntenRonde);
  const winnaars = teams.filter((t, i) => puntenRonde[i] === max && max > 0);
  toonScherm(`
    ${kop(spel, 'terug')}
    <div class="midden schuif-in">
      <div class="groot-emoji">${winnaars.length === 1 ? '🏆' : '🤝'}</div>
      <h2>${winnaars.length === 1 ? esc(winnaars[0].naam) + ' wint de ronde!' : max > 0 ? 'Gelijkspel!' : 'Niemand scoorde'}</h2>
      <div class="ronde-uitslag">
        ${teams.map((t, i) => `
          <div class="ronde-team" style="--team:${t.kleur}">
            <div class="ronde-naam">${esc(t.naam)}</div>
            <div class="ronde-punten">+${puntenRonde[i] || 0}</div>
            <div class="ronde-totaal">totaal ${Stand.totaal(i)}</div>
          </div>`).join('')}
      </div>
      <div class="knoppen">
        <button class="knop goud" data-actie="opnieuw">Nog een ronde 🔁</button>
        <button class="knop licht" data-actie="stand">🏆 Stand</button>
      </div>
    </div>
  `, { terug, opnieuw, stand: () => toonStand(terug) });
  if (winnaars.length === 1) confetti();
}
