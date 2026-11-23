/*
 * Hoger of lager
 * Je ziet twee bekende mensen. Van de linker zie je het getal (volgers, medailles).
 * Raad of de rechter hoger of lager zit. Eén keer fout = beurt voorbij.
 * Om de beurt kiest iemand uit het team. 1 punt per goed, +3 bij het doel.
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

  function speelBeurt(beurt) {
    const cat = CATEGORIEEN.find(c => c.id === beurt.inst.categorie) || CATEGORIEEN[0];
    potje = { beurt, cat, doel: beurt.inst.doel, reeks: 0, gebruikt: new Set(), links: null };
    const team = Teams.lijst()[beurt.teamIndex];
    toonBeurt({
      spel: NAAM,
      emoji: cat.data.emoji,
      teamIndex: beurt.teamIndex,
      uitleg: `Wie heeft er meer ${cat.wat}? Haal er <b>${potje.doel}</b> op rij goed.<br>${team.leden.length > 1 ? 'Om de beurt kiest iemand, de rest mag meedenken.' : 'Het hele team mag meedenken.'}`,
      knop: 'We zijn er klaar voor!',
      verder: () => {
        potje.links = volgende();
        potje.rechts = volgende();
        toonVraag();
      },
      terug: () => beurt.stop(),
    });
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
        <div class="wie-speelt">${teamLabel(team)}</div>
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
        if (potje.reeks >= potje.doel) setTimeout(() => einde(true), 1200);
        else setTimeout(() => {
          potje.links = rechts;
          potje.rechts = volgende();
          toonVraag();
        }, 1700);
      } else {
        melding.textContent = 'Helaas! ❌';
        setTimeout(() => einde(false), 2000);
      }
    }, 950);
  }

  function einde(gewonnen) {
    const punten = potje.reeks + (gewonnen ? 3 : 0);
    potje.beurt.klaar({
      punten,
      tekst: gewonnen ? `${potje.reeks} goed + bonus` : `${potje.reeks} goed`,
      titel: gewonnen ? `Doel gehaald: ${potje.doel} op rij!` : potje.reeks === 0 ? 'Oei, meteen mis!' : `${potje.reeks} op rij goed`,
      emoji: gewonnen ? '🏆' : potje.reeks >= 3 ? '👏' : '🎅',
      details: `<p>${gewonnen ? 'Wat een kenners! Dat levert 3 bonuspunten op.' : `De laatste was ${esc(potje.rechts.naam)}: ${potje.cat.formaat(potje.rechts.waarde)} ${potje.cat.eenheid(potje.rechts.waarde)}.`}</p>`,
      feest: gewonnen,
    });
  }

  /* ---------- Aanmelden ---------- */

  registreerSpel({
    id: 'hoger-lager',
    naam: NAAM,
    emoji: '⬆️',
    kort: 'Wie heeft er meer volgers of medailles? Raad hoger of lager en bouw een reeks op.',
    instellingen: {
      categorie: {
        label: 'Categorie',
        standaard: 'instagram',
        opties: CATEGORIEEN.map(c => ({ waarde: c.id, label: c.data.titel, emoji: c.data.emoji, klein: `${c.data.items.length} personen · ${c.data.bijgewerkt}` })),
      },
      doel: { label: 'Hoeveel op rij goed voor de bonus?', standaard: 7, min: 3, max: 15, stap: 1 },
    },
    stappen: inst => {
      const cat = CATEGORIEEN.find(c => c.id === inst.categorie) || CATEGORIEEN[0];
      return [
        { icoon: '👀', tekst: `Je ziet twee bekende mensen. Van de linker zie je hoeveel ${cat.wat} die heeft.` },
        { icoon: '🤔', tekst: 'Heeft de rechter <b>meer</b> of <b>minder</b>? Tik op het goede antwoord.' },
        { icoon: '👥', tekst: 'Om de beurt kiest iemand uit het team. De rest mag meedenken.' },
        { icoon: '❌', tekst: `Eén keer fout en de beurt is voorbij. Haal er <b>${inst.doel}</b> op rij goed!` },
      ];
    },
    punten: inst => `<b>1 punt</b> per goed antwoord. Haal je er <b>${inst.doel}</b> op rij, dan krijg je <b>3 bonuspunten</b> erbij.`,
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
