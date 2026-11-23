/*
 * Menu, teams en totaalstand. De spellen zelf staan in js/spellen/.
 */

// Spellen die later komen; ze staan alvast in het menu.
const BINNENKORT = [
  { emoji: '❓', naam: 'Sportquiz', tekst: 'Vragen op jouw niveau: makkelijk, gemiddeld of expert.' },
  { emoji: '📏', naam: 'Schatten', tekst: 'Hoe lang, hoe hard, hoe ver? Wie zit het dichtst bij?' },
];

function standBalk() {
  return `<div class="stand-balk">
    ${Teams.lijst().map((t, i) => `
      <div class="stand-team" style="--team:${t.kleur}">
        <div class="naam">${esc(t.naam)}</div>
        <div class="punten">${Stand.totaal(i)}</div>
        <div class="leden">${t.leden.length ? t.leden.map(esc).join(', ') : 'nog geen spelers'}</div>
      </div>`).join('')}
  </div>`;
}

function toonMenu() {
  toonScherm(`
    <div class="hero">
      <h1>🎄 Kerstspellen</h1>
      <p>Spelletjes voor de hele familie</p>
    </div>

    ${standBalk()}
    <div class="knoppen" style="margin:0 0 22px">
      <button class="knop licht" style="font-size:18px;padding:12px 18px" data-actie="teams">✏️ Teams</button>
      <button class="knop licht" style="font-size:18px;padding:12px 18px" data-actie="stand">🏆 Stand</button>
    </div>

    <div class="spellen">
      ${Spellen.map(s => `
        <button class="spel-tegel" data-actie="spel" data-id="${s.id}">
          <span class="emoji">${s.emoji}</span>
          <h3>${esc(s.naam)}</h3>
          <p>${esc(s.tekst)}</p>
        </button>`).join('')}
      ${BINNENKORT.map(s => `
        <div class="spel-tegel binnenkort">
          <span class="label">Binnenkort</span>
          <span class="emoji">${s.emoji}</span>
          <h3>${esc(s.naam)}</h3>
          <p>${esc(s.tekst)}</p>
        </div>`).join('')}
    </div>
    <p class="voetnoot">Tip: zet deze pagina op je beginscherm via Delen → Zet op beginscherm.</p>
  `, {
    teams: () => toonTeams(toonMenu),
    stand: () => toonStand(toonMenu),
    spel: (e, el) => Spellen.find(s => s.id === el.dataset.id).start(),
  });
}

function toonTeams(terug) {
  const teams = Teams.lijst();
  toonScherm(`
    ${kop('Teams', 'terug')}
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
    <div class="knoppen"><button class="knop goud breed" data-actie="terug">Klaar ✔️</button></div>
  `, {
    terug: () => terug(),
    weg: (e, el) => {
      const ts = Teams.lijst();
      ts[el.dataset.team].leden.splice(+el.dataset.lid, 1);
      ts[el.dataset.team].beurt = 0;
      Teams.bewaar(ts);
      toonTeams(terug);
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
      toonTeams(terug);
      app.querySelector(`form[data-team="${form.dataset.team}"] input`).focus();
    });
  });
}

function toonStand(terug) {
  const teams = Teams.lijst();
  const stand = Stand.alles();
  const volgorde = teams.map((t, i) => ({ t, i, totaal: Stand.totaal(i) })).sort((a, b) => b.totaal - a.totaal);
  const gespeeld = Spellen.filter(s => stand[s.id]);
  const plek = n => ['🥇', '🥈', '🥉'][n] || n + 1;

  toonScherm(`
    ${kop('Kerststand', 'terug')}
    <div class="paneel">
      <table class="score-tabel">
        <tr><th></th><th>Team</th>${gespeeld.map(s => `<th class="getal">${s.emoji}</th>`).join('')}<th class="getal">Totaal</th></tr>
        ${volgorde.map((r, n) => `<tr>
          <td class="medaille">${plek(n)}</td>
          <td><span class="bol" style="background:${r.t.kleur}"></span>${esc(r.t.naam)}</td>
          ${gespeeld.map(s => `<td class="getal">${stand[s.id][r.i] || 0}</td>`).join('')}
          <td class="getal"><b>${r.totaal}</b></td></tr>`).join('')}
      </table>
      ${gespeeld.length ? '' : '<p class="leeg">Nog geen punten. Speel een spel!</p>'}
    </div>
    <div class="knoppen">
      <button class="knop goud" data-actie="terug">Verder ▶️</button>
      <button class="knop licht" data-actie="wis">Stand op 0 zetten</button>
    </div>
  `, {
    terug: () => terug(),
    wis: () => {
      if (confirm('Weet je het zeker? Alle punten gaan terug naar 0.')) { Stand.wis(); toonStand(terug); }
    },
  });
}

startSneeuw();
toonMenu();
