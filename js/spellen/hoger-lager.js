/*
 * Hoger of lager
 * Je ziet twee bekende mensen. Van de linker zie je het getal (volgers, medailles).
 * Raad of de rechter hoger of lager zit. Eén keer fout = ronde voorbij.
 * Standaard speelt elk team twee rondes: eerst Instagram, dan medailles.
 * Om de beurt kiest iemand uit het team. Per ronde 1 punt per goed, +3 bij het doel.
 * Nieuwe categorie: voeg een bestand toe in data/ en een regel in CATEGORIEEN.
 */
(function () {
  const NAAM = 'Hoger of lager';

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
      wat: 'Instagram-volgers',
    },
    {
      id: 'medailles',
      data: window.KERST_DATA.medailles,
      formaat: v => String(Math.round(v)),
      eenheid: v => (v === 1 ? 'Olympische medaille' : 'Olympische medailles'),
      detail: item => `🥇 ${item.goud} &nbsp; 🥈 ${item.zilver} &nbsp; 🥉 ${item.brons}`,
      wat: 'Olympische medailles',
    },
  ];

  let potje = null;

  /* ---------- Beurt van één team ---------- */

  // Categorieën van een beurt: 'beide' = eerst Instagram, dan medailles.
  function rondes(inst) {
    if (inst.categorie === 'beide') return CATEGORIEEN;
    return [CATEGORIEEN.find(c => c.id === inst.categorie) || CATEGORIEEN[0]];
  }

  function speelBeurt(beurt) {
    const lijst = rondes(beurt.inst);
    potje = { beurt, rondes: lijst, ronde: 0, uitslagen: [], doel: beurt.inst.doel };
    const team = Teams.lijst()[beurt.teamIndex];
    toonBeurt({
      spel: NAAM,
      emoji: lijst.map(c => c.data.emoji).join(''),
      teamIndex: beurt.teamIndex,
      uitleg: `${lijst.length > 1
        ? `Twee rondes: eerst <b>${lijst[0].wat}</b>, daarna <b>${lijst[1].wat}</b>.`
        : `Wie heeft er meer ${lijst[0].wat}?`} Haal er per ronde <b>${potje.doel}</b> op rij goed.<br>
        ${team.leden.length > 1 ? 'Om de beurt kiest iemand, de rest mag meedenken.' : 'Het hele team mag meedenken.'}`,
      knop: 'We zijn er klaar voor!',
      verder: () => startRonde(),
      terug: () => beurt.stop(),
    });
  }

  function startRonde() {
    potje.cat = potje.rondes[potje.ronde];
    potje.reeks = 0;
    potje.gebruikt = new Set();
    potje.links = null;
    potje.links = volgende();
    potje.rechts = volgende();
    toonVraag();
  }

  function rondeLabel() {
    return potje.rondes.length > 1 ? `Ronde ${potje.ronde + 1}/${potje.rondes.length} · ${potje.cat.data.emoji}` : potje.cat.data.emoji;
  }

  // Volgende willekeurige persoon die deze beurt nog niet langs kwam.
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
        <div class="persoon-foto" style="background:${item.kleur || '#e8dcc6'}">
          ${fotoVan(item.naam) ? `<img class="foto-waas" src="${fotoVan(item.naam)}" alt="" aria-hidden="true">` : ''}
          ${fotoHtml(item.naam, item)}
        </div>
        <div class="persoon-info">
          <div class="naam">${esc(item.naam)}</div>
          <div class="rol">${esc(item.wie)}</div>
          ${toonWaarde
            ? `<div class="waarde">${cat.formaat(item.waarde)}</div>
               <div class="eenheid">${cat.eenheid(item.waarde)}</div>
               ${cat.detail ? `<div class="detail">${cat.detail(item)}</div>` : ''}`
            : `<div class="waarde" id="onthul" hidden></div>
               <div class="eenheid" id="onthul-eenheid" hidden></div>
               <div class="detail" id="onthul-detail" hidden></div>
               <div class="antwoorden" id="antwoorden">
                 <button class="knop hoger" data-actie="hoger">⬆️ Meer</button>
                 <button class="knop lager" data-actie="lager">⬇️ Minder</button>
               </div>`}
        </div>
      </div>`;
  }

  function stippen() {
    let html = '';
    for (let i = 0; i < potje.doel; i++) html += `<span class="stip ${i < potje.reeks ? 'vol' : ''}"></span>`;
    return html;
  }

  function toonVraag() {
    const team = Teams.lijst()[potje.beurt.teamIndex];
    const lid = Teams.volgendLid(potje.beurt.teamIndex);
    const { links, rechts, cat } = potje;
    toonScherm(`
      <div class="spelkop">
        <button class="terug" data-actie="stop">✕ Stop</button>
        <div class="wie-speelt">${teamLabel(team)} <span class="ronde-label">${rondeLabel()}</span></div>
        <div class="stippen" id="stippen" aria-label="${potje.reeks} van ${potje.doel}">${stippen()}</div>
      </div>
      ${lid !== team.naam ? `<div class="kiezer">🎯 <b>${esc(lid)}</b> kiest</div>` : ''}
      <div class="vraag">Heeft <b>${esc(rechts.naam)}</b> meer of minder ${cat.wat} dan <b>${esc(links.naam)}</b>?</div>
      <div class="kaarten schuif-in">
        ${kaart(links, true, 'kaart-links')}
        <div class="vs">OF</div>
        ${kaart(rechts, false, 'kaart-rechts')}
      </div>
      <div class="melding" id="melding"></div>
    `, {
      stop: () => { if (confirm('Stoppen? Deze beurt telt dan niet en jullie mogen straks opnieuw.')) potje.beurt.stop(); },
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
    waardeEl.hidden = false;
    eenheidEl.hidden = false;
    eenheidEl.textContent = cat.eenheid(rechts.waarde);
    telOp(waardeEl, rechts.waarde, cat.formaat);

    setTimeout(() => {
      if (cat.detail) { detailEl.innerHTML = cat.detail(rechts); detailEl.hidden = false; }
      const kaartEl = document.getElementById('kaart-rechts');
      kaartEl.classList.add(goed ? 'goed' : 'fout');
      kaartEl.insertAdjacentHTML('beforeend', `<div class="uitslag-badge">${goed ? '✅' : '❌'}</div>`);
      const melding = document.getElementById('melding');

      if (goed) {
        potje.reeks += 1;
        document.getElementById('stippen').innerHTML = stippen();
        melding.textContent = gelijk ? 'Precies even veel, dat telt als goed!' : willekeurig(['Goed zo! 🎉', 'Yes! ⭐', 'Lekker bezig! 🔥', 'Helemaal goed! 🎄']);
        if (potje.reeks >= potje.doel) setTimeout(() => rondeKlaar(true), 1200);
        else setTimeout(() => {
          potje.links = rechts;
          potje.rechts = volgende();
          toonVraag();
        }, 1700);
      } else {
        melding.textContent = 'Helaas! ❌';
        setTimeout(() => rondeKlaar(false), 2000);
      }
    }, 950);
  }

  function rondeKlaar(gewonnen) {
    const r = {
      cat: potje.cat,
      reeks: potje.reeks,
      gewonnen,
      punten: potje.reeks + (gewonnen ? 3 : 0),
      laatste: potje.rechts,
    };
    potje.uitslagen.push(r);
    if (potje.ronde + 1 < potje.rondes.length) { toonTussenstand(r); if (gewonnen) confetti(); }
    else einde();
  }

  function rondeTekst(r) {
    return `${r.reeks} goed${r.gewonnen ? ' + bonus' : ''}`;
  }

  // Tussen ronde 1 en 2: uitslag van de ronde en de volgende categorie.
  function toonTussenstand(r) {
    const team = Teams.lijst()[potje.beurt.teamIndex];
    const volgende = potje.rondes[potje.ronde + 1];
    toonScherm(`
      <div class="kop"><span></span><div class="titel">${esc(NAAM)} · ronde ${potje.ronde + 1} klaar</div><span></span></div>
      <div class="midden schuif-in">
        <div class="groot-emoji klein">${r.gewonnen ? '🏆' : r.reeks >= 3 ? '👏' : '🎅'}</div>
        <h2>${r.cat.data.emoji} ${r.gewonnen ? `Doel gehaald: ${potje.doel} op rij!` : r.reeks === 0 ? 'Oei, meteen mis!' : `${r.reeks} op rij goed`}</h2>
        ${r.gewonnen ? '' : `<p>De laatste was ${esc(r.laatste.naam)}: ${r.cat.formaat(r.laatste.waarde)} ${r.cat.eenheid(r.laatste.waarde)}.</p>`}
        <p class="punten-groot" style="color:${team.kleur}"><b>+${r.punten} ${r.punten === 1 ? 'punt' : 'punten'}</b> in deze ronde</p>
        <div class="volgende-ronde">
          <span class="volgende-emoji">${volgende.data.emoji}</span>
          <div><small>Ronde ${potje.ronde + 2}</small><b>${esc(volgende.data.titel)}</b><p>Wie heeft er meer ${volgende.wat}?</p></div>
        </div>
        <div class="knoppen"><button class="knop goud groot" data-actie="verder">Start ronde ${potje.ronde + 2} ▶️</button></div>
      </div>
    `, {
      verder: () => { potje.ronde += 1; startRonde(); },
    });
  }

  function einde() {
    const u = potje.uitslagen;
    const punten = u.reduce((som, r) => som + r.punten, 0);
    const alles = u.every(r => r.gewonnen);
    const laatste = u[u.length - 1];
    potje.beurt.klaar({
      punten,
      tekst: u.length > 1 ? u.map(r => `${r.cat.data.emoji} ${rondeTekst(r)}`).join(' · ') : rondeTekst(laatste),
      titel: u.length > 1 ? `${u.reduce((som, r) => som + r.reeks, 0)} goed in ${u.length} rondes` : laatste.gewonnen ? `Doel gehaald: ${potje.doel} op rij!` : `${laatste.reeks} op rij goed`,
      emoji: alles ? '🏆' : punten >= 6 ? '👏' : '🎅',
      details: `<ul class="tijden-lijst">
        ${u.map(r => `<li><span>${r.cat.data.emoji} ${esc(r.cat.data.titel)}</span><b>${rondeTekst(r)} = ${r.punten} ${r.punten === 1 ? 'punt' : 'punten'}</b></li>`).join('')}
      </ul>
      ${laatste.gewonnen ? '' : `<p>De laatste was ${esc(laatste.laatste.naam)}: ${laatste.cat.formaat(laatste.laatste.waarde)} ${laatste.cat.eenheid(laatste.laatste.waarde)}.</p>`}`,
      feest: alles,
    });
  }

  /* ---------- Aanmelden ---------- */

  registreerSpel({
    id: 'hoger-lager',
    naam: NAAM,
    emoji: '⬆️',
    kort: 'Wie heeft er meer Instagram-volgers of Olympische medailles? Raad meer of minder en bouw een reeks op.',
    film: 'Wie heeft er meer Instagram-volgers? En wie heeft meer Olympische medailles? Raad meer of minder, en maak een zo lang mogelijke reeks.',
    instellingen: {
      categorie: {
        label: 'Categorie',
        standaard: 'beide',
        opties: [{ waarde: 'beide', label: 'Allebei', emoji: '📸🥇', klein: 'Ronde 1 Instagram, ronde 2 medailles' }].concat(CATEGORIEEN.map(c => ({ waarde: c.id, label: c.data.titel, emoji: c.data.emoji, klein: `${c.data.items.length} personen · ${c.data.bijgewerkt}` }))),
      },
      doel: { label: 'Hoeveel op rij goed voor de bonus (per ronde)?', standaard: 7, min: 3, max: 15, stap: 1 },
    },
    stappen: inst => {
      const lijst = rondes(inst);
      return [
        lijst.length > 1
          ? { icoon: '📸', tekst: `Twee rondes: eerst <b>${lijst[0].wat}</b>, daarna <b>${lijst[1].wat}</b>.` }
          : { icoon: lijst[0].data.emoji, tekst: `Het gaat om <b>${lijst[0].wat}</b>.` },
        { icoon: '👀', tekst: 'Je ziet twee bekende mensen. Van de linker zie je het aantal. Heeft de rechter <b>meer</b> of <b>minder</b>?' },
        { icoon: '👥', tekst: 'Om de beurt kiest iemand uit het team. De rest mag meedenken.' },
        { icoon: '❌', tekst: `Eén keer fout en de ronde is voorbij. Haal er <b>${inst.doel}</b> op rij goed!` },
      ];
    },
    punten: inst => `${rondes(inst).length > 1 ? 'Per ronde: ' : ''}<b>1 punt</b> per goed antwoord. Haal je er <b>${inst.doel}</b> op rij, dan krijg je <b>3 bonuspunten</b> erbij.`,
    plaatje: () => `
      <div class="plaat plaat-hl">
        <div class="hl-duo">
          ${fotoHtml('Cristiano Ronaldo', { emoji: '⚽' })}
          <span class="hl-vs">VS</span>
          ${fotoHtml('Lionel Messi', { emoji: '⚽' })}
        </div>
        <div class="hl-pijlen"><span>⬆️</span><span>⬇️</span></div>
      </div>`,
    speelBeurt,
  });
})();
