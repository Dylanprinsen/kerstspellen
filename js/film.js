/*
 * Uitlegfilmpje op de startpagina: geanimeerde scènes met ondertitels,
 * voorgelezen door de stem van de iPad (kan uit met de luidspreker-knop).
 * De teams en spellen komen uit de app zelf, dus het filmpje klopt altijd.
 */
const Film = (() => {
  let geluid = Opslag.lees('film.geluid', true);
  let el = null;
  let nr = 0;
  let speelt = false;
  let timers = [];
  let frame = null;

  function scenes() {
    const teams = Teams.lijst();
    const namen = teams.map(t => t.naam);
    const spellen = Spellen.map(s => s.naam);
    const opsomming = l => (l.length > 1 ? l.slice(0, -1).join(', ') + ' en ' + l[l.length - 1] : l[0] || '');
    const volgorde = spellen.length > 2
      ? `eerst ${spellen[0]}, dan ${spellen.slice(1, -1).join(', dan ')} en als laatste ${spellen[spellen.length - 1]}`
      : opsomming(spellen);

    return [
      {
        tekst: `Welkom bij de Kerstspellen, ${EDITIE}!`,
        beeld: `<div class="sc-welkom">
          <div class="sc-sterren">${[...Array(14)].map((_, i) => `<i style="--i:${i}">✦</i>`).join('')}</div>
          <div class="sc-boom">🎄</div>
          <div class="sc-titel">Kerstspellen</div>
          <div class="lint klein"><span>${EDITIE}</span></div>
        </div>`,
      },
      {
        tekst: `We spelen met drie teams: ${opsomming(namen)}.`,
        beeld: `<div class="sc-teams">${teams.map((t, i) => `
          <div class="sc-team" style="--team:${t.kleur};--i:${i}">
            <div class="sc-team-bol">${['🔴', '🟢', '🟡'][i] || '⭐'}</div>
            <b>${esc(t.naam)}</b>
            <small>${t.leden.length ? t.leden.map(esc).join(' · ') : '3 spelers'}</small>
          </div>`).join('')}</div>`,
      },
      {
        tekst: 'Er is één iPad. Bij elk spel kies je eerst welk team de iPad heeft. Na je beurt geef je hem door aan het volgende team.',
        beeld: `<div class="sc-ipad">
          <div class="sc-ipad-rij">${teams.map(t => `<div class="sc-ipad-team" style="--team:${t.kleur}">${esc(t.naam)}</div>`).join('')}</div>
          <div class="sc-ipad-toestel"><div class="sc-ipad-scherm">Welk team<br>heeft de iPad?</div></div>
        </div>`,
      },
      {
        tekst: `We spelen de spellen op een vaste volgorde: ${volgorde}`.replace(/([^?!])$/, '$1.'),
        beeld: `<div class="sc-programma">${Spellen.map((s, i) => `
          <div class="sc-spel" style="--i:${i}">
            <div class="sc-spel-plaat">${s.plaatje()}</div>
            <div class="sc-spel-naam"><span>${i + 1}</span>${esc(s.naam)}</div>
          </div>`).join('')}</div>`,
      },
      {
        tekst: 'Voor elk spel krijg je eerst uitleg. Als alle drie de teams geweest zijn, zie je de tussenstand.',
        beeld: `<div class="sc-stand">
          <div class="sc-uitleg-kaart"><span>💡</span><b>Uitleg</b><i></i><i></i><i></i></div>
          <div class="sc-pijl">➜</div>
          <div class="sc-balken">${teams.map((t, i) => `
            <div class="sc-balk"><span>${esc(t.naam)}</span><i style="background:${t.kleur};--w:${[78, 55, 92][i] || 60}%;--i:${i}"></i></div>`).join('')}
          </div>
        </div>`,
      },
      {
        tekst: 'Alle punten tellen bij elkaar op. Het team met de meeste punten wint de Kerstbeker. Veel plezier en succes!',
        beeld: `<div class="sc-beker">
          <div class="sc-confetti">${[...Array(24)].map((_, i) => `<i style="--i:${i};--x:${(i * 37) % 100}%"></i>`).join('')}</div>
          <div class="sc-beker-icoon">🏆</div>
          <div class="sc-titel klein">De Kerstbeker</div>
        </div>`,
      },
    ];
  }

  function html() {
    const aantal = scenes().length;
    return `
      <div class="film" data-staat="poster">
        <div class="film-beeld">
          <div class="film-scene"><div class="scene-in">${scenes()[0].beeld}</div></div>
          <div class="film-ondertitel" aria-live="polite"></div>
          <button class="film-groot-play" data-film="speel" aria-label="Speel het filmpje af">
            <span>▶</span><small>Bekijk de uitleg</small>
          </button>
        </div>
        <div class="film-balk">
          <button class="film-knop" data-film="speel" aria-label="Afspelen of pauzeren">▶</button>
          <div class="film-voortgang">${[...Array(aantal)].map(() => '<i><b></b></i>').join('')}</div>
          ${Spraak.kan ? `<button class="film-knop" data-film="geluid" aria-label="Geluid aan of uit">${geluid ? '🔊' : '🔇'}</button>` : ''}
          <button class="film-knop" data-film="opnieuw" aria-label="Opnieuw">⟲</button>
        </div>
      </div>`;
  }

  function koppel(nieuwEl) {
    stop();
    el = nieuwEl;
    nr = 0;
    if (!el) return;
    el.querySelectorAll('[data-film]').forEach(k => k.addEventListener('click', () => {
      const actie = k.dataset.film;
      if (actie === 'speel') speelt ? pauze() : speel();
      if (actie === 'opnieuw') { nr = 0; speel(); }
      if (actie === 'geluid') {
        geluid = !geluid;
        Opslag.schrijf('film.geluid', geluid);
        k.textContent = geluid ? '🔊' : '🔇';
        if (!geluid) Spraak.stop();
        else if (speelt) speel();
      }
    }));
  }

  function stop() {
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(frame);
    speelt = false;
  }

  function nogInBeeld() {
    return el && document.body.contains(el);
  }

  function pauze() {
    stop();
    Spraak.stop();
    if (el) el.dataset.staat = 'pauze';
    zetKnop('▶');
  }

  function zetKnop(t) {
    const k = el.querySelector('.film-balk [data-film="speel"]');
    if (k) k.textContent = t;
  }

  function speel() {
    stop();
    Spraak.stop();
    const alle = scenes();
    if (nr >= alle.length) nr = 0;
    const scene = alle[nr];
    speelt = true;
    el.dataset.staat = 'speelt';
    zetKnop('⏸');

    el.querySelector('.film-scene').innerHTML = `<div class="scene-in">${scene.beeld}</div>`;
    el.querySelector('.film-ondertitel').textContent = scene.tekst;
    el.querySelectorAll('.film-voortgang i').forEach((s, i) => {
      s.querySelector('b').style.width = i < nr ? '100%' : '0%';
    });

    // Volgende scène als de tijd om is én de stem klaar is.
    const duur = Math.max(4500, scene.tekst.length * 70);
    let tijdOm = false;
    let stemKlaar = !geluid || !Spraak.kan;
    const volgende = () => {
      if (!tijdOm || !stemKlaar || !speelt || !nogInBeeld()) return;
      nr += 1;
      if (nr < alle.length) speel();
      else einde();
    };
    if (!stemKlaar) {
      Spraak.zeg(scene.tekst, () => { stemKlaar = true; volgende(); });
      // Vangnet als de stem nooit "klaar" meldt.
      timers.push(setTimeout(() => { stemKlaar = true; volgende(); }, duur + 6000));
    }
    timers.push(setTimeout(() => { tijdOm = true; volgende(); }, duur));

    const start = performance.now();
    const balk = el.querySelectorAll('.film-voortgang b')[nr];
    const loop = nu => {
      if (!nogInBeeld()) { stop(); return; }
      balk.style.width = Math.min(100, ((nu - start) / duur) * 100) + '%';
      if (nu - start < duur) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
  }

  function einde() {
    stop();
    nr = 0;
    el.dataset.staat = 'einde';
    zetKnop('▶');
    el.querySelector('.film-groot-play small').textContent = 'Nog een keer kijken';
  }

  return { html, koppel };
})();
