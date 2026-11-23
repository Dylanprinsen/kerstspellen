/*
 * Menu, spelers en scorebord. De spellen zelf staan in js/spellen/.
 */

// Spellen die later komen; ze staan alvast in het menu.
const BINNENKORT = [
  { emoji: '🎄', naam: 'Kerstquiz', tekst: 'Vragen over kerst, de familie en meer.' },
  { emoji: '🤔', naam: 'Wie ben ik?', tekst: 'Raad wie er op je voorhoofd staat.' },
  { emoji: '🎵', naam: 'Raad het liedje', tekst: 'Herken het nummer zo snel mogelijk.' },
];

function toonMenu() {
  const spelers = Spelers.lijst();
  toonScherm(`
    <div class="hero">
      <h1>🎄 Kerstspellen</h1>
      <p>Spelletjes voor de hele familie</p>
    </div>

    <div class="balk">
      <div class="spelers-mini">
        ${spelers.length
          ? spelers.map(s => `<span class="chip"><span class="bol" style="background:${s.kleur};margin-right:0"></span>${esc(s.naam)}</span>`).join('')
          : '<span style="opacity:.8">👋 Voeg eerst de spelers toe</span>'}
      </div>
      <div style="display:flex;gap:8px">
        <button class="knop licht" style="font-size:18px;padding:12px 18px" data-actie="spelers">✏️ Spelers</button>
        <button class="knop licht" style="font-size:18px;padding:12px 18px" data-actie="scores">🏅 Scores</button>
      </div>
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
    spelers: () => toonSpelers(toonMenu),
    scores: () => toonScorebord('hoger-lager', 'Hoger of lager', toonMenu),
    spel: (e, el) => Spellen.find(s => s.id === el.dataset.id).start(),
  });
}

function toonSpelers(terug) {
  const spelers = Spelers.lijst();
  toonScherm(`
    ${kop('Spelers', 'terug')}
    <div class="paneel">
      <form class="invoer-rij" id="nieuw">
        <input class="invoer" id="naam" placeholder="Naam, bijv. Oma" maxlength="20" autocomplete="off" enterkeyhint="done">
        <button class="knop" type="submit">+ Voeg toe</button>
      </form>
      ${spelers.length
        ? `<ul class="spelerlijst">${spelers.map(s => `
            <li><span><span class="bol" style="background:${s.kleur}"></span>${esc(s.naam)}</span>
            <button class="weg" data-actie="weg" data-naam="${esc(s.naam)}" aria-label="Verwijder ${esc(s.naam)}">✕</button></li>`).join('')}</ul>`
        : '<p class="leeg">Nog niemand. Typ een naam en tik op Voeg toe.</p>'}
    </div>
    <div class="knoppen"><button class="knop goud breed" data-actie="terug">Klaar ✔️</button></div>
  `, {
    terug: () => terug(),
    weg: (e, el) => { Spelers.verwijderen(el.dataset.naam); toonSpelers(terug); },
  });

  document.getElementById('nieuw').addEventListener('submit', e => {
    e.preventDefault();
    const naam = document.getElementById('naam').value;
    Spelers.toevoegen(naam);
    toonSpelers(terug);
    document.getElementById('naam').focus();
  });
}

function toonScorebord(spelId, spelNaam, terug) {
  const scores = Scores.voorSpel(spelId);
  const rijen = Object.entries(scores)
    .map(([naam, s]) => ({ naam, ...s }))
    .sort((a, b) => b.gewonnen - a.gewonnen || b.beste - a.beste);
  const kleur = naam => (Spelers.lijst().find(s => s.naam === naam) || {}).kleur || '#64748b';
  const plek = i => ['🥇', '🥈', '🥉'][i] || i + 1;

  toonScherm(`
    ${kop('Scorebord · ' + spelNaam, 'terug')}
    <div class="paneel">
      ${rijen.length
        ? `<table class="score-tabel">
            <tr><th></th><th>Speler</th><th class="getal">Gewonnen</th><th class="getal">Beste reeks</th></tr>
            ${rijen.map((r, i) => `<tr>
              <td class="medaille">${plek(i)}</td>
              <td><span class="bol" style="background:${kleur(r.naam)}"></span>${esc(r.naam)}</td>
              <td class="getal">${r.gewonnen}</td>
              <td class="getal">${r.beste}</td></tr>`).join('')}
          </table>`
        : '<p class="leeg">Nog geen scores. Speel eerst een potje!</p>'}
    </div>
    <div class="knoppen">
      <button class="knop goud" data-actie="terug">Verder ▶️</button>
      ${rijen.length ? '<button class="knop licht" data-actie="wis">Scores wissen</button>' : ''}
    </div>
  `, {
    terug: () => terug(),
    wis: () => {
      if (confirm('Alle scores wissen?')) { Scores.wis(); toonScorebord(spelId, spelNaam, terug); }
    },
  });
}

startSneeuw();
toonMenu();
