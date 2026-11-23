/*
 * De avond: startpagina, vaste volgorde van de spellen, teamkeuze per spel,
 * uitslag en tussenstand na elk spel, en de finale. De spellen zelf staan in js/spellen/.
 *
 * Verloop per spel: uitleg → welk team heeft de iPad? → beurt → (volgende team) →
 * als alle teams geweest zijn: uitslag + tussenstand → uitleg van het volgende spel.
 */

const EDITIE = 'Familie-editie 2026';

// Spellen die later komen; ze staan alvast in het programma.
const BINNENKORT = [
  { emoji: '❓', naam: 'Sportquiz', kort: 'Vragen op jouw niveau: makkelijk, gemiddeld of expert.', plaatje: () => plaatjeEmoji('❓', ['⚽', '🎾', '🏀', '⛸️'], '#3b82f6', '#1e3a8a') },
  { emoji: '📏', naam: 'Schatten', kort: 'Hoe lang, hoe hard, hoe ver? Wie zit het dichtst bij?', plaatje: () => plaatjeEmoji('📏', ['🏃', '⏱️', '🚴', '🏊'], '#a855f7', '#4c1d95') },
];

function plaatjeEmoji(groot, klein, kleur1, kleur2) {
  return `<div class="plaat plaat-emoji" style="--k1:${kleur1};--k2:${kleur2}">
    <span class="plaat-groot">${groot}</span>
    ${klein.map((e, i) => `<span class="plaat-klein k${i}">${e}</span>`).join('')}
  </div>`;
}

// Welk spel is nu aan de beurt? -1 als alles gespeeld is.
function huidigSpel() {
  return Spellen.findIndex(s => !Stand.klaar(s.id));
}

function avondBegonnen() {
  return Spellen.some(s => Stand.begonnen(s.id));
}

function plekken(scores, hoogIsBeter = true) {
  // Geeft per index de plek (0 = eerste), gelijke scores dezelfde plek.
  return scores.map(s => scores.filter(t => (hoogIsBeter ? t > s : t < s)).length);
}

const MEDAILLE = ['🥇', '🥈', '🥉'];

/* ---------- Startpagina ---------- */

function toonHome() {
  const teams = Teams.lijst();
  const nu = huidigSpel();
  const begonnen = avondBegonnen();

  let knop;
  if (nu === -1) knop = `<button class="knop goud groot" data-actie="finale">🏆 Naar de prijsuitreiking</button>`;
  else if (!begonnen) knop = `<button class="knop goud groot" data-actie="verder">▶️ Start de avond</button>`;
  else knop = `<button class="knop goud groot" data-actie="verder">▶️ Ga verder: ${esc(Spellen[nu].naam)}</button>`;

  toonScherm(`
    <header class="hero">
      <div class="slinger" aria-hidden="true">${[...Array(18)].map((_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
      <div class="hero-boven">🎄 Kerst 2026 🎄</div>
      <h1 class="hero-titel">Kerstspellen</h1>
      <div class="lint"><span>${EDITIE}</span></div>
      <p class="hero-onder">3 teams · 1 iPad · ${Spellen.length} spellen · 1 Kerstbeker 🏆</p>
    </header>

    <section class="sectie">
      <h2 class="sectie-kop"><span>🎬</span> Zo werkt de avond</h2>
      ${Film.html()}
      <div class="knoppen">${knop}</div>
    </section>

    <section class="sectie">
      <h2 class="sectie-kop"><span>📋</span> Het programma</h2>
      <p class="sectie-uitleg">We spelen alles op deze volgorde. Elk team speelt elk spel één keer.</p>
      <div class="programma">
        ${Spellen.map((s, i) => programmaTegel(s, i, nu)).join('')}
        ${BINNENKORT.map(s => `
          <article class="programma-tegel binnenkort">
            <div class="tegel-plaat">${s.plaatje()}</div>
            <div class="tegel-tekst">
              <span class="status">Binnenkort</span>
              <h3>${s.emoji} ${esc(s.naam)}</h3>
              <p>${esc(s.kort)}</p>
            </div>
          </article>`).join('')}
      </div>
    </section>

    <section class="sectie">
      <h2 class="sectie-kop"><span>👨‍👩‍👧‍👦</span> De teams</h2>
      <div class="team-overzicht">
        ${teams.map((t, i) => `
          <div class="team-tegel" style="--team:${t.kleur}">
            <div class="team-naam">${esc(t.naam)}</div>
            <div class="team-punten">${Stand.totaal(i)}<small> punten</small></div>
            <div class="team-leden">${t.leden.length ? t.leden.map(l => `<span>${esc(l)}</span>`).join('') : '<em>nog geen spelers</em>'}</div>
          </div>`).join('')}
      </div>
      <div class="knoppen">
        <button class="knop licht" data-actie="teams">✏️ Teams aanpassen</button>
        <button class="knop licht" data-actie="stand">📊 Alle punten</button>
      </div>
    </section>

    <footer class="voet">
      <button class="link" data-actie="instellingen">⚙️ Instellingen spelleider</button>
      <button class="link" data-actie="nieuw">🔄 Nieuwe avond</button>
      <p>Tip: zet deze pagina op het beginscherm van de iPad via Delen → Zet op beginscherm.</p>
    </footer>
  `, {
    verder: () => {
      if (!begonnen && Teams.lijst().some(t => !t.leden.length)) {
        toonTeams(() => toonSpelIntro(0), 'Klaar, we beginnen! ▶️');
      } else if (Stand.begonnen(Spellen[nu].id)) toonTeamKeuze(nu);
      else toonSpelIntro(nu);
    },
    finale: () => toonFinale(),
    teams: () => toonTeams(toonHome),
    stand: () => toonStand(toonHome),
    instellingen: () => toonInstellingen(),
    nieuw: () => {
      if (confirm('Nieuwe avond beginnen? Alle punten gaan terug naar 0. De teams blijven staan.')) {
        Stand.wis();
        toonHome();
      }
    },
  });
  Film.koppel(app.querySelector('.film'));
}

function programmaTegel(s, i, nu) {
  let status = 'Straks';
  let klasse = '';
  if (Stand.klaar(s.id)) { status = '✔ Gespeeld'; klasse = 'gespeeld'; }
  else if (i === nu) { status = Stand.begonnen(s.id) ? '▶ Nu bezig' : (i === 0 ? '▶ Eerste spel' : '▶ Volgende'); klasse = 'nu'; }
  return `
    <article class="programma-tegel ${klasse}">
      <div class="tegel-plaat">${s.plaatje()}<span class="tegel-nummer">${i + 1}</span></div>
      <div class="tegel-tekst">
        <span class="status">${status}</span>
        <h3>${esc(s.naam)}</h3>
        <p>${esc(s.kort)}</p>
      </div>
    </article>`;
}

/* ---------- Uitleg van een spel ---------- */

// Tekst die bij "Lees voor" wordt voorgelezen.
function introTekst(i, inst) {
  const s = Spellen[i];
  return `Spel ${i + 1}: ${zin(s.naam)} ${s.stappen(inst).map(st => st.tekst).join(' ')} Punten: ${s.punten(inst)}`;
}

// Alle teksten met een vaste opname (voor tools/maak_stem.py): filmpje + uitleg per spel met standaardinstellingen.
function alleVoorleesTeksten() {
  const standaard = s => Object.fromEntries(Object.entries(s.instellingen || {}).map(([k, d]) => [k, d.standaard]));
  return [...Film.teksten(), ...Spellen.map((s, i) => introTekst(i, standaard(s)))].map(t => Spraak.schoon(t));
}

function toonSpelIntro(i) {
  const s = Spellen[i];
  const inst = Instellingen.lees(s);
  const stappen = s.stappen(inst);
  toonScherm(`
    ${kop(`Spel ${i + 1} van ${Spellen.length}`, 'home', '🏠 Home')}
    <div class="intro schuif-in">
      <div class="intro-plaat">${s.plaatje()}</div>
      <div class="intro-titel">
        <div class="intro-label">Spel ${i + 1}</div>
        <h1>${esc(s.naam)}</h1>
        <p>${esc(s.kort)}</p>
      </div>
    </div>
    <h2 class="sectie-kop klein"><span>💡</span> Zo werkt het</h2>
    <ol class="stappen">
      ${stappen.map((st, n) => `
        <li class="schuif-in" style="animation-delay:${0.1 + n * 0.12}s">
          <span class="stap-nr">${n + 1}</span>
          <span class="stap-icoon">${st.icoon}</span>
          <p>${st.tekst}</p>
        </li>`).join('')}
    </ol>
    <div class="punten-blok"><span>🏆</span><div><b>Punten</b><p>${s.punten(inst)}</p></div></div>
    <div class="knoppen">
      ${Spraak.kan ? '<button class="knop licht" data-actie="voorlezen">🔊 Lees voor</button>' : ''}
      <button class="knop goud groot" data-actie="verder">Kies welk team begint ▶️</button>
    </div>
  `, {
    home: () => toonHome(),
    voorlezen: () => {
      Spraak.zeg(introTekst(i, inst));
    },
    verder: () => toonTeamKeuze(i),
  });
}

/* ---------- Welk team speelt? ---------- */

function toonTeamKeuze(i) {
  const s = Spellen[i];
  const teams = Teams.lijst();
  const r = Stand.van(s.id);
  const over = teams.filter((t, n) => !r[n]).length;
  if (!over) { toonSpelUitslag(i); return; }

  toonScherm(`
    ${kop(s.naam, 'uitleg', '← Uitleg')}
    <div class="midden schuif-in">
      <div class="groot-emoji klein">📱</div>
      <h2>Welk team heeft de iPad?</h2>
      <p>${over === teams.length ? 'Elk team speelt één keer. Wie begint?' : `Nog ${over} ${over === 1 ? 'team' : 'teams'} te gaan.`}</p>
      <div class="team-keuze">
        ${teams.map((t, n) => r[n] ? `
          <div class="keuze-team klaar" style="--team:${t.kleur}">
            <div class="keuze-vink">✔</div>
            <div class="team-naam">${esc(t.naam)}</div>
            <div class="keuze-resultaat">${esc(r[n].tekst)}</div>
            ${s.verdeelPunten ? '' : `<div class="keuze-punten">+${r[n].punten}</div>`}
          </div>` : `
          <button class="keuze-team" style="--team:${t.kleur}" data-actie="kies" data-team="${n}">
            <div class="team-naam">${esc(t.naam)}</div>
            <div class="team-leden">${t.leden.length ? t.leden.map(esc).join(', ') : '&nbsp;'}</div>
            <div class="keuze-knop">Wij spelen ▶</div>
          </button>`).join('')}
      </div>
    </div>
  `, {
    uitleg: () => toonSpelIntro(i),
    kies: (e, el) => startBeurt(i, +el.dataset.team),
  });
}

/*
 * Eén beurt van één team. Het spel krijgt:
 *   teamIndex, inst (instellingen),
 *   klaar(resultaat)  resultaat = { punten, tekst, titel?, emoji?, details?, feest? }
 *                     (bij verdeelPunten: { score, tekst, ... } zonder punten)
 *   stop()            beurt afbreken, terug naar de teamkeuze (telt niet)
 */
function startBeurt(i, teamIndex) {
  const s = Spellen[i];
  s.speelBeurt({
    teamIndex,
    inst: Instellingen.lees(s),
    klaar: res => {
      Stand.zet(s.id, teamIndex, res);
      toonBeurtKlaar(i, teamIndex, res);
    },
    stop: () => toonTeamKeuze(i),
  });
}

function toonBeurtKlaar(i, teamIndex, res) {
  const s = Spellen[i];
  const team = Teams.lijst()[teamIndex];
  const laatste = Stand.klaar(s.id);
  toonScherm(`
    <div class="kop"><span></span><div class="titel">${esc(s.naam)}</div><span></span></div>
    <div class="midden schuif-in">
      <div class="groot-emoji">${res.emoji || '🎉'}</div>
      <h2>${esc(res.titel || res.tekst)}</h2>
      ${res.details || ''}
      ${s.verdeelPunten
        ? `<p class="punten-groot" style="color:${team.kleur}">${esc(team.naam)}: <b>${esc(res.tekst)}</b></p>
           <p>${laatste ? 'Alle teams zijn geweest. Wie heeft er gewonnen?' : 'De punten volgen als alle teams geweest zijn.'}</p>`
        : `<p class="punten-groot" style="color:${team.kleur}"><b>+${res.punten} ${res.punten === 1 ? 'punt' : 'punten'}</b> voor ${esc(team.naam)}</p>`}
      <div class="knoppen">
        ${laatste
          ? '<button class="knop goud groot" data-actie="verder">Bekijk de uitslag 🏆</button>'
          : '<button class="knop goud groot" data-actie="verder">📱 Geef de iPad door ▶️</button>'}
      </div>
    </div>
  `, { verder: () => (laatste ? toonSpelUitslag(i) : toonTeamKeuze(i)) });
  if (res.feest) confetti();
}

/* ---------- Uitslag van een spel + tussenstand ---------- */

function standStaven(teams, totalen, extra = '') {
  const max = Math.max(1, ...totalen);
  const plek = plekken(totalen);
  const volgorde = teams.map((t, i) => i).sort((a, b) => totalen[b] - totalen[a]);
  return `<div class="staven ${extra}">
    ${volgorde.map(i => `
      <div class="staaf-rij">
        <span class="staaf-plek">${MEDAILLE[plek[i]] || plek[i] + 1}</span>
        <span class="staaf-naam">${esc(teams[i].naam)}</span>
        <span class="staaf"><i style="--w:${(totalen[i] / max) * 100}%;background:${teams[i].kleur}"></i></span>
        <span class="staaf-getal">${totalen[i]}</span>
      </div>`).join('')}
  </div>`;
}

function toonSpelUitslag(i) {
  const s = Spellen[i];
  const teams = Teams.lijst();
  const r = Stand.van(s.id);
  const punten = Stand.punten(s.id);
  const plek = plekken(punten);
  const volgorde = teams.map((t, n) => n).sort((a, b) => punten[b] - punten[a]);
  const winnaars = teams.filter((t, n) => plek[n] === 0 && punten[n] > 0);
  const volgende = Spellen[i + 1];
  const totalen = teams.map((t, n) => Stand.totaal(n));

  toonScherm(`
    ${kop(`Uitslag spel ${i + 1}`, 'home', '🏠 Home')}
    <div class="schuif-in">
      <div class="uitslag-kop">
        <div class="groot-emoji klein">${winnaars.length === 1 ? '🏆' : '🤝'}</div>
        <h2>${winnaars.length === 1 ? esc(winnaars[0].naam) + ' wint ' + esc(s.naam) + '!' : winnaars.length ? 'Gelijkspel!' : 'Niemand scoorde'}</h2>
      </div>
      <div class="ronde-uitslag">
        ${volgorde.map(n => `
          <div class="ronde-team" style="--team:${teams[n].kleur}">
            <div class="ronde-plek">${MEDAILLE[plek[n]] || ''}</div>
            <div class="ronde-naam">${esc(teams[n].naam)}</div>
            <div class="ronde-tekst">${esc(r[n] ? r[n].tekst : '')}</div>
            <div class="ronde-punten">+${punten[n]}</div>
          </div>`).join('')}
      </div>
      <h2 class="sectie-kop klein"><span>📊</span> Tussenstand na ${i + 1} ${i === 0 ? 'spel' : 'spellen'}</h2>
      ${standStaven(teams, totalen)}
      <div class="knoppen">
        ${volgende
          ? `<button class="knop goud groot" data-actie="verder">Volgende spel: ${esc(volgende.naam)} ▶️</button>`
          : '<button class="knop goud groot" data-actie="finale">🏆 Naar de prijsuitreiking</button>'}
      </div>
    </div>
  `, {
    home: () => toonHome(),
    verder: () => toonSpelIntro(i + 1),
    finale: () => toonFinale(),
  });
  if (winnaars.length === 1) confetti();
}

/* ---------- Finale ---------- */

function toonFinale() {
  const teams = Teams.lijst();
  const totalen = teams.map((t, i) => Stand.totaal(i));
  const plek = plekken(totalen);
  const winnaars = teams.filter((t, i) => plek[i] === 0);
  // Podium: 2e links, 1e midden, 3e rechts.
  const volgorde = teams.map((t, i) => i).sort((a, b) => totalen[b] - totalen[a]);
  const podium = [volgorde[1], volgorde[0], volgorde[2]].filter(n => n !== undefined);

  toonScherm(`
    ${kop('Prijsuitreiking', 'home', '🏠 Home')}
    <div class="midden schuif-in finale">
      <p class="finale-boven">De Kerstbeker 2026 gaat naar…</p>
      <h2 class="finale-winnaar">${winnaars.map(t => `<span style="color:${t.kleur}">${esc(t.naam)}</span>`).join(' &amp; ')}!</h2>
      <div class="podium">
        ${podium.map(n => `
          <div class="podium-plek p${plek[n] + 1}" style="--team:${teams[n].kleur}">
            <div class="podium-naam">${esc(teams[n].naam)}</div>
            <div class="podium-leden">${teams[n].leden.map(esc).join(', ')}</div>
            <div class="podium-blok">
              <span class="podium-medaille">${MEDAILLE[plek[n]] || ''}</span>
              <span class="podium-punten">${totalen[n]}</span>
            </div>
          </div>`).join('')}
      </div>
      <div class="knoppen">
        <button class="knop licht" data-actie="stand">📊 Alle punten per spel</button>
        <button class="knop goud" data-actie="home">🏠 Terug naar het begin</button>
      </div>
    </div>
  `, {
    home: () => toonHome(),
    stand: () => toonStand(toonFinale),
  });
  confetti();
  setTimeout(confetti, 2500);
}

/* ---------- Teams ---------- */

function toonTeams(terug, knopTekst = 'Klaar ✔️') {
  const teams = Teams.lijst();
  toonScherm(`
    ${kop('Teams', 'terug')}
    <p class="sectie-uitleg">Vul per team de namen in. Ze komen om de beurt aan de beurt.</p>
    <div class="teams-bewerk">
      ${teams.map((t, i) => `
        <div class="team-kaart" style="--team:${t.kleur}">
          <input class="invoer teamnaam" data-team="${i}" value="${esc(t.naam)}" maxlength="18" aria-label="Teamnaam">
          <form class="invoer-rij" data-team="${i}">
            <input class="invoer" placeholder="Naam, bijv. Oma" maxlength="20" autocomplete="off" enterkeyhint="done">
            <button class="knop" type="submit">+</button>
          </form>
          ${t.leden.length
            ? `<ul class="spelerlijst">${t.leden.map((lid, j) => `
                <li><span>${esc(lid)}</span>
                <button class="weg" data-actie="weg" data-team="${i}" data-lid="${j}" aria-label="Verwijder ${esc(lid)}">✕</button></li>`).join('')}</ul>`
            : '<p class="leeg">Nog niemand in dit team.</p>'}
        </div>`).join('')}
    </div>
    <div class="knoppen"><button class="knop goud breed" data-actie="klaar">${knopTekst}</button></div>
  `, {
    terug: () => toonHome(),
    klaar: () => terug(),
    weg: (e, el) => {
      const ts = Teams.lijst();
      ts[el.dataset.team].leden.splice(+el.dataset.lid, 1);
      ts[el.dataset.team].beurt = 0;
      Teams.bewaar(ts);
      toonTeams(terug, knopTekst);
    },
  });

  app.querySelectorAll('.teamnaam').forEach(input => {
    input.addEventListener('change', () => {
      const ts = Teams.lijst();
      ts[input.dataset.team].naam = input.value.trim() || ts[input.dataset.team].naam;
      Teams.bewaar(ts);
    });
  });
  app.querySelectorAll('form[data-team]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const naam = form.querySelector('input').value.trim().slice(0, 20);
      if (!naam) return;
      const ts = Teams.lijst();
      ts[form.dataset.team].leden.push(naam);
      Teams.bewaar(ts);
      toonTeams(terug, knopTekst);
      app.querySelector(`form[data-team="${form.dataset.team}"] input`).focus();
    });
  });
}

/* ---------- Alle punten ---------- */

function toonStand(terug) {
  const teams = Teams.lijst();
  const volgorde = teams.map((t, i) => ({ t, i, totaal: Stand.totaal(i) })).sort((a, b) => b.totaal - a.totaal);
  const plek = plekken(volgorde.map(r => r.totaal));
  const gespeeld = Spellen.filter(s => Stand.begonnen(s.id));

  toonScherm(`
    ${kop('Alle punten', 'terug')}
    <div class="paneel">
      <table class="score-tabel">
        <tr><th></th><th>Team</th>${gespeeld.map(s => `<th class="getal">${esc(s.naam)}</th>`).join('')}<th class="getal">Totaal</th></tr>
        ${volgorde.map((r, n) => `<tr>
          <td class="medaille">${MEDAILLE[plek[n]] || plek[n] + 1}</td>
          <td><span class="bol" style="background:${r.t.kleur}"></span>${esc(r.t.naam)}</td>
          ${gespeeld.map(s => `<td class="getal">${Stand.klaar(s.id) || !s.verdeelPunten ? Stand.punten(s.id)[r.i] : '…'}</td>`).join('')}
          <td class="getal"><b>${r.totaal}</b></td></tr>`).join('')}
      </table>
      ${gespeeld.length ? '' : '<p class="leeg">Nog geen punten. Start de avond!</p>'}
    </div>
    <div class="knoppen"><button class="knop goud" data-actie="terug">Verder ▶️</button></div>
  `, { terug: () => terug() });
}

/* ---------- Instellingen voor de spelleider ---------- */

function toonInstellingen() {
  toonScherm(`
    ${kop('Instellingen spelleider', 'terug')}
    <p class="sectie-uitleg">Stel dit vóór het begin in. Liever niet veranderen halverwege een spel, dan is het niet eerlijk.</p>
    ${Spellen.filter(s => s.instellingen).map(s => {
      const inst = Instellingen.lees(s);
      return `<div class="paneel inst-spel">
        <h3>${s.emoji} ${esc(s.naam)}</h3>
        ${Object.entries(s.instellingen).map(([k, def]) => def.opties ? `
          <div class="sectie-titel">${esc(def.label)}</div>
          <div class="keuzes">
            ${def.opties.map(o => `
              <button class="keuze ${o.waarde === inst[k] ? 'actief' : ''}" data-actie="kies" data-spel="${s.id}" data-sleutel="${k}" data-waarde="${esc(o.waarde)}">
                <span class="emoji">${o.emoji || ''}</span>
                <span><strong>${esc(o.label)}</strong>${o.klein ? `<small>${esc(o.klein)}</small>` : ''}</span>
              </button>`).join('')}
          </div>` : `
          <div class="sectie-titel">${esc(def.label)}</div>
          <div class="stepper">
            <button data-actie="stap" data-spel="${s.id}" data-sleutel="${k}" data-stap="-1" aria-label="Minder">−</button>
            <span class="getal">${inst[k]}${def.eenheid ? `<small> ${esc(def.eenheid)}</small>` : ''}</span>
            <button data-actie="stap" data-spel="${s.id}" data-sleutel="${k}" data-stap="1" aria-label="Meer">+</button>
          </div>`).join('')}
      </div>`;
    }).join('')}
    <div class="knoppen"><button class="knop goud breed" data-actie="terug">Klaar ✔️</button></div>
  `, {
    terug: () => toonHome(),
    kies: (e, el) => {
      const s = Spellen.find(x => x.id === el.dataset.spel);
      Instellingen.zet(s, el.dataset.sleutel, el.dataset.waarde);
      const y = window.scrollY;
      toonInstellingen();
      window.scrollTo(0, y);
    },
    stap: (e, el) => {
      const s = Spellen.find(x => x.id === el.dataset.spel);
      const def = s.instellingen[el.dataset.sleutel];
      const nu = Instellingen.lees(s)[el.dataset.sleutel];
      Instellingen.zet(s, el.dataset.sleutel, Math.max(def.min, Math.min(def.max, nu + def.stap * +el.dataset.stap)));
      const y = window.scrollY;
      toonInstellingen();
      window.scrollTo(0, y);
    },
  });
}

startSneeuw();
toonHome();
