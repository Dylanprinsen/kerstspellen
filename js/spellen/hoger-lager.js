/*
 * Hoger of lager
 * Je ziet iemand met een getal (volgers, medailles, ...). Raad of de volgende
 * persoon hoger of lager zit. Haal je het doel (standaard 7) op rij, dan win je.
 * Nieuwe categorie: voeg een bestand toe in data/ en een regel in CATEGORIEEN.
 */
(function () {
  const SPEL_ID = 'hoger-lager';

  function formaatVolgers(v) {
    if (v >= 1e6) {
      const m = v / 1e6;
      const afgerond = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
      return afgerond.toLocaleString('nl-NL') + ' mln';
    }
    if (v >= 1000) return (Math.round(v / 1000) * 1000).toLocaleString('nl-NL');
    return Math.round(v).toLocaleString('nl-NL');
  }

  const CATEGORIEEN = [
    {
      id: 'instagram',
      data: window.KERST_DATA.instagram,
      formaat: formaatVolgers,
      eenheid: () => 'volgers op Instagram',
      vraag: (r, l) => `Heeft <b>${esc(r.naam)}</b> meer of minder Instagram-volgers dan <b>${esc(l.naam)}</b>?`,
    },
    {
      id: 'medailles',
      data: window.KERST_DATA.medailles,
      formaat: v => String(Math.round(v)),
      eenheid: v => (v === 1 ? 'Olympische medaille' : 'Olympische medailles'),
      detail: item => `🥇 ${item.goud} &nbsp; 🥈 ${item.zilver} &nbsp; 🥉 ${item.brons}`,
      vraag: (r, l) => `Heeft <b>${esc(r.naam)}</b> meer of minder Olympische medailles dan <b>${esc(l.naam)}</b>?`,
    },
  ];

  const instellingen = Opslag.lees('hoger-lager', { categorie: 'instagram', doel: 7 });
  let potje = null;

  /* ---------- Instellingen ---------- */

  function toonInstellingen() {
    toonScherm(`
      ${kop('Hoger of lager')}
      <div class="sectie-titel">Kies een categorie</div>
      <div class="keuzes">
        ${CATEGORIEEN.map(c => `
          <button class="keuze ${c.id === instellingen.categorie ? 'actief' : ''}" data-actie="categorie" data-id="${c.id}">
            <span class="emoji">${c.data.emoji}</span>
            <span><strong>${esc(c.data.titel)}</strong><small>${c.data.items.length} personen · ${esc(c.data.bijgewerkt)}</small></span>
          </button>`).join('')}
      </div>

      <div class="sectie-titel">Hoeveel op rij goed om te winnen?</div>
      <div class="stepper">
        <button data-actie="min" aria-label="Minder">−</button>
        <span class="getal" id="doel">${instellingen.doel}</span>
        <button data-actie="plus" aria-label="Meer">+</button>
      </div>

      <div class="sectie-titel">Punten</div>
      <div class="balk"><span>Elk team om de beurt. <b>1 punt</b> per goed antwoord, <b>+3 bonus</b> als je het doel haalt.</span></div>

      <div class="knoppen">
        <button class="knop goud breed" data-actie="start">▶️ Start</button>
      </div>
    `, {
      menu: () => toonMenu(),
      categorie: (e, el) => {
        instellingen.categorie = el.dataset.id;
        Opslag.schrijf('hoger-lager', instellingen);
        toonInstellingen();
      },
      min: () => wijzigDoel(-1),
      plus: () => wijzigDoel(1),
      start: () => startPotje(),
    });
  }

  function wijzigDoel(stap) {
    instellingen.doel = Math.max(1, Math.min(20, instellingen.doel + stap));
    Opslag.schrijf('hoger-lager', instellingen);
    document.getElementById('doel').textContent = instellingen.doel;
  }

  /* ---------- Potje en beurten ---------- */

  function startPotje() {
    const cat = CATEGORIEEN.find(c => c.id === instellingen.categorie) || CATEGORIEEN[0];
    potje = { cat, doel: instellingen.doel, team: 0, puntenRonde: Teams.lijst().map(() => 0) };
    toonBeurtHL();
  }

  function toonBeurtHL() {
    potje.lid = Teams.volgendLid(potje.team);
    toonBeurt({
      spel: 'Hoger of lager',
      emoji: potje.cat.data.emoji,
      teamIndex: potje.team,
      lid: potje.lid,
      uitleg: `Haal er <b>${potje.doel}</b> op rij goed. Het team mag meedenken!`,
      knop: 'Ik ben er klaar voor!',
      verder: () => startRonde(),
      terug: () => toonInstellingen(),
    });
  }

  function startRonde() {
    potje.reeks = 0;
    potje.gebruikt = new Set();
    potje.links = volgende();
    potje.rechts = volgende();
    toonSpel();
  }

  // Volgende willekeurige persoon die deze ronde nog niet langs kwam.
  function volgende() {
    const items = potje.cat.data.items;
    let over = items.filter(i => !potje.gebruikt.has(i.naam));
    if (!over.length) {
      potje.gebruikt = new Set(potje.links ? [potje.links.naam] : []);
      over = items.filter(i => !potje.gebruikt.has(i.naam));
    }
    const kies = willekeurig(over);
    potje.gebruikt.add(kies.naam);
    return kies;
  }

  /* ---------- Spelscherm ---------- */

  function kaart(item, toonWaarde, id) {
    const cat = potje.cat;
    return `
      <div class="persoon" id="${id}">
        <div class="avatar" style="background:${item.kleur || '#f1e4cf'}">${item.emoji}</div>
        <div class="naam">${esc(item.naam)}</div>
        <div class="rol">${esc(item.wie)}</div>
        ${toonWaarde
          ? `<div class="waarde">${cat.formaat(item.waarde)}</div>
             <div class="eenheid">${cat.eenheid(item.waarde)}</div>
             ${cat.detail ? `<div class="detail">${cat.detail(item)}</div>` : ''}`
          : `<div class="waarde" id="onthul" style="display:none"></div>
             <div class="eenheid" id="onthul-eenheid" style="display:none"></div>
             <div class="detail" id="onthul-detail" style="display:none"></div>
             <div class="antwoorden" id="antwoorden">
               <button class="knop hoger" data-actie="hoger">⬆️ Hoger</button>
               <button class="knop lager" data-actie="lager">⬇️ Lager</button>
             </div>`}
      </div>`;
  }

  function stippen() {
    let html = '';
    for (let i = 0; i < potje.doel; i++) html += `<span class="stip ${i < potje.reeks ? 'vol' : ''}"></span>`;
    return html;
  }

  function toonSpel() {
    const team = Teams.lijst()[potje.team];
    toonScherm(`
      <div class="spelkop">
        <button class="terug" data-actie="stop">✕ Stop</button>
        <div class="wie-speelt">${teamLabel(team, potje.lid)} · ${potje.reeks}/${potje.doel}</div>
        <div class="stippen" id="stippen">${stippen()}</div>
      </div>
      <div class="vraag">${potje.cat.vraag(potje.rechts, potje.links)}</div>
      <div class="kaarten schuif-in">
        ${kaart(potje.links, true, 'kaart-links')}
        <div class="vs">OF</div>
        ${kaart(potje.rechts, false, 'kaart-rechts')}
      </div>
      <div class="melding" id="melding"></div>
    `, {
      stop: () => { if (confirm('Stoppen met deze beurt?')) toonInstellingen(); },
      hoger: () => antwoord('hoger'),
      lager: () => antwoord('lager'),
    });
  }

  function antwoord(keuze) {
    const { links, rechts, cat } = potje;
    document.getElementById('antwoorden').remove();

    const gelijk = rechts.waarde === links.waarde;
    const goed = gelijk || (keuze === 'hoger' ? rechts.waarde > links.waarde : rechts.waarde < links.waarde);

    const waardeEl = document.getElementById('onthul');
    const eenheidEl = document.getElementById('onthul-eenheid');
    const detailEl = document.getElementById('onthul-detail');
    waardeEl.style.display = '';
    eenheidEl.style.display = '';
    eenheidEl.textContent = cat.eenheid(rechts.waarde);
    telOp(waardeEl, rechts.waarde, cat.formaat);

    setTimeout(() => {
      if (cat.detail) { detailEl.innerHTML = cat.detail(rechts); detailEl.style.display = ''; }
      const kaartEl = document.getElementById('kaart-rechts');
      kaartEl.classList.add(goed ? 'goed' : 'fout');
      kaartEl.insertAdjacentHTML('beforeend', `<div class="uitslag-badge">${goed ? '✅' : '❌'}</div>`);
      const melding = document.getElementById('melding');

      if (goed) {
        potje.reeks += 1;
        document.getElementById('stippen').innerHTML = stippen();
        melding.textContent = gelijk ? 'Precies even veel, dat telt als goed!' : willekeurig(['Goed zo! 🎉', 'Yes! ⭐', 'Lekker bezig! 🔥', 'Helemaal goed! 🎄']);
        if (potje.reeks >= potje.doel) setTimeout(() => toonEinde(true), 1200);
        else setTimeout(() => {
          potje.links = rechts;
          potje.rechts = volgende();
          toonSpel();
        }, 1700);
      } else {
        melding.textContent = 'Helaas! ❌';
        setTimeout(() => toonEinde(false), 2000);
      }
    }, 950);
  }

  /* ---------- Einde van een beurt ---------- */

  function toonEinde(gewonnen) {
    const teams = Teams.lijst();
    const team = teams[potje.team];
    const punten = potje.reeks + (gewonnen ? 3 : 0);
    Stand.geef(potje.team, SPEL_ID, punten);
    potje.puntenRonde[potje.team] += punten;
    const laatste = potje.team === teams.length - 1;

    toonScherm(`
      ${kop('Hoger of lager', 'instellingen')}
      <div class="midden schuif-in">
        <div class="groot-emoji">${gewonnen ? '🏆' : '🎅'}</div>
        <h2>${gewonnen ? 'Doel gehaald!' : potje.reeks + ' goed'}</h2>
        <p>${gewonnen
          ? `${potje.doel} op rij goed, wat een kenners!`
          : potje.reeks === 0 ? 'Oei, meteen mis. Volgende keer beter!' : `${potje.reeks} van de ${potje.doel} op rij goed.`}</p>
        <p style="font-size:30px;color:${team.kleur}"><b>+${punten} punten</b> voor ${esc(team.naam)}</p>
        <div class="knoppen">
          ${laatste
            ? `<button class="knop goud" data-actie="volgende">Bekijk de uitslag ▶️</button>`
            : `<button class="knop goud" data-actie="volgende">Volgende: ${esc(teams[potje.team + 1].naam)} ▶️</button>`}
        </div>
      </div>
    `, {
      instellingen: () => toonInstellingen(),
      volgende: () => {
        if (!laatste) {
          potje.team += 1;
          toonBeurtHL();
          return;
        }
        toonRondeUitslag({
          spel: 'Hoger of lager',
          puntenRonde: potje.puntenRonde,
          opnieuw: () => startPotje(),
          terug: () => toonMenu(),
        });
      },
    });
    if (gewonnen) confetti();
  }

  registreerSpel({
    id: SPEL_ID,
    naam: 'Hoger of lager',
    emoji: '⬆️⬇️',
    tekst: 'Wie heeft meer Instagram-volgers of medailles? Haal er zoveel mogelijk op rij goed.',
    start: toonInstellingen,
  });
})();
