/*
 * Uitlegfilmpje op de startpagina: geanimeerde scènes met ondertitels en voice-over.
 * De voice-over zijn opnames in media/stem/ (tools/maak_stem.py); zonder opname leest
 * het apparaat zelf voor. Na het aanpassen van een tekst: draai tools/maak_stem.py opnieuw.
 */
const Film = (() => {
  let geluid = Opslag.lees('film.geluid', true);
  let el = null;
  let nr = 0;
  let speelt = false;
  let timers = [];
  let frame = null;

  const TELWOORD = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht'];

  // Letters die één voor één invallen; woorden blijven heel (geen afbreking midden in een woord).
  function letters(tekst, vertraging = 0) {
    let i = 0;
    return tekst.split(' ').map(woord => `<span class="woord">${[...woord]
      .map(c => `<span style="--i:${i++};--v:${vertraging}s">${esc(c)}</span>`).join('')}</span>`).join(' ');
  }

  function sneeuw(aantal = 26) {
    return `<div class="sc-sneeuw">${[...Array(aantal)].map((_, i) =>
      `<i style="--x:${(i * 37) % 100}%;--d:${4 + (i % 5)}s;--w:${-((i * 0.7) % 6)}s;--s:${6 + (i % 4) * 3}px"></i>`).join('')}</div>`;
  }

  function scenes() {
    const teams = Teams.lijst();
    return [
      {
        tekst: `Welkom bij de Kerstspellen, ${EDITIE.toLowerCase()}!`,
        beeld: `<div class="sc-welkom">
          ${sneeuw()}
          <div class="sc-sterren">${[...Array(14)].map((_, i) => `<i style="--i:${i}">✦</i>`).join('')}</div>
          <div class="sc-boom">🎄</div>
          <div class="sc-titel sc-letters">${letters('Kerstspellen', 0.5)}</div>
          <div class="lint klein sc-lint"><span>${EDITIE}</span></div>
          <div class="sc-cadeaus"><span>🎁</span><span>🎅</span><span>🎁</span></div>
        </div>`,
      },
      {
        tekst: 'Vanavond spelen we met drie teams. Je speelt samen, dus jong en oud helpen elkaar.',
        beeld: `<div class="sc-teams">${teams.map((t, i) => `
          <div class="sc-team" style="--team:${t.kleur};--i:${i}">
            <div class="sc-team-bol"></div>
            <b>${esc(t.naam)}</b>
            <div class="sc-leden">${(t.leden.length ? t.leden : ['Speler 1', 'Speler 2', 'Speler 3'])
              .map((l, j) => `<span style="--j:${j}">${esc(l)}</span>`).join('')}</div>
          </div>`).join('')}</div>`,
      },
      {
        tekst: 'Er is één iPad. Bij elk spel kies je eerst welk team de iPad heeft. Na je beurt geef je hem door aan het volgende team.',
        beeld: `<div class="sc-ipad">
          <div class="sc-ipad-rij">${teams.map((t, i) => `<div class="sc-ipad-team" style="--team:${t.kleur};--i:${i}">${esc(t.naam)}</div>`).join('')}</div>
          <div class="sc-ipad-baan">
            <div class="sc-ipad-toestel"><div class="sc-ipad-scherm"><span>📱</span>Jullie<br>beurt!</div></div>
          </div>
        </div>`,
      },
      {
        tekst: `We spelen ${TELWOORD[Spellen.length] || Spellen.length} spellen, altijd in dezelfde volgorde.`,
        beeld: `<div class="sc-programma">${Spellen.map((s, i) => `
          <div class="sc-spel" style="--i:${i}">
            <div class="sc-spel-plaat">${s.plaatje()}<span class="sc-spel-nr">${i + 1}</span></div>
            <div class="sc-spel-naam">${esc(s.naam)}</div>
          </div>`).join('')}</div>`,
      },
      ...Spellen.map((s, i) => ({
        tekst: `Spel ${i + 1}: ${zin(s.naam)} ${s.film || s.kort}`,
        beeld: `<div class="sc-los-spel">
          <div class="sc-los-plaat">${s.plaatje()}</div>
          <div class="sc-los-tekst">
            <div class="sc-los-nr">Spel ${i + 1}</div>
            <div class="sc-los-naam sc-letters">${letters(s.naam, 0.4)}</div>
            <div class="sc-los-kort">${esc(s.kort)}</div>
          </div>
        </div>`,
      })),
      {
        tekst: 'Voor elk spel krijg je eerst uitleg. Als alle teams geweest zijn, zie je de tussenstand.',
        beeld: `<div class="sc-stand">
          <div class="sc-uitleg-kaart"><span>💡</span><b>Uitleg</b><i></i><i></i><i></i></div>
          <div class="sc-pijl">➜</div>
          <div class="sc-balken">${teams.map((t, i) => {
            const w = [62, 88, 45][i] || 60;
            return `<div class="sc-balk" style="--i:${i}">
              <span>${esc(t.naam)}${i === 1 ? ' <em class="sc-kroon">👑</em>' : ''}</span>
              <div class="sc-balk-rij"><i style="background:${t.kleur};--w:${w}%"></i><b data-tel="${Math.round(w / 4)}">0</b></div>
            </div>`;
          }).join('')}</div>
        </div>`,
        na: scene => scene.querySelectorAll('[data-tel]').forEach((b, i) => {
          timers.push(setTimeout(() => telOp(b, +b.dataset.tel, v => String(Math.round(v)), 1400), 1800 + i * 300));
        }),
      },
      {
        tekst: 'Alle punten tellen bij elkaar op. Het team met de meeste punten wint de Kerstbeker. Veel plezier en succes!',
        beeld: `<div class="sc-beker">
          <div class="sc-stralen"></div>
          ${[0, 1, 2, 3].map(b => `<div class="sc-vuurwerk" style="--b:${b}">${[...Array(12)].map((_, i) => `<i style="--a:${i * 30}deg"></i>`).join('')}</div>`).join('')}
          <div class="sc-confetti">${[...Array(24)].map((_, i) => `<i style="--i:${i};--x:${(i * 37) % 100}%"></i>`).join('')}</div>
          <div class="sc-beker-icoon">🏆</div>
          <div class="sc-titel klein sc-letters">${letters('De Kerstbeker', 0.6)}</div>
        </div>`,
      },
    ];
  }

  function teksten() {
    return scenes().map(s => s.tekst);
  }

  function html() {
    const alle = scenes();
    return `
      <div class="film" data-staat="poster">
        <div class="film-beeld">
          <div class="film-scene"><div class="scene-in">${alle[0].beeld}</div></div>
          <div class="film-ondertitel" aria-live="polite"></div>
          <button class="film-groot-play" data-film="speel" aria-label="Speel het filmpje af">
            <span>▶</span><small>Bekijk de uitleg</small>
          </button>
        </div>
        <div class="film-balk">
          <button class="film-knop" data-film="speel" aria-label="Afspelen of pauzeren">▶</button>
          <div class="film-voortgang">${alle.map(() => '<i><b></b></i>').join('')}</div>
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

  // Nieuwe scène in beeld, de oude vervaagt.
  function wissel(scene) {
    const houder = el.querySelector('.film-scene');
    houder.querySelectorAll('.scene-in').forEach(oud => {
      oud.classList.add('scene-weg');
      setTimeout(() => oud.remove(), 600);
    });
    houder.insertAdjacentHTML('beforeend', `<div class="scene-in">${scene.beeld}</div>`);
    if (scene.na) scene.na(houder.lastElementChild);
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

    wissel(scene);
    el.querySelector('.film-ondertitel').textContent = scene.tekst;
    el.querySelectorAll('.film-voortgang i').forEach((s, i) => {
      s.querySelector('b').style.width = i < nr ? '100%' : '0%';
    });

    // Volgende scène als de tijd om is én de stem klaar is.
    const metStem = geluid && Spraak.kan;
    const opname = metStem && Spraak.opname(scene.tekst);
    const duur = opname ? 3500 : Math.max(4500, scene.tekst.length * 70);
    let tijdOm = false;
    let stemKlaar = !metStem;
    const volgende = () => {
      if (!tijdOm || !stemKlaar || !speelt || !nogInBeeld()) return;
      nr += 1;
      if (nr < alle.length) timers.push(setTimeout(() => { if (speelt && nogInBeeld()) speel(); }, 600));
      else einde();
    };
    if (metStem) {
      Spraak.zeg(scene.tekst, () => { stemKlaar = true; volgende(); });
      // Vangnet als de stem nooit "klaar" meldt.
      timers.push(setTimeout(() => { stemKlaar = true; volgende(); }, scene.tekst.length * 90 + 6000));
    }
    timers.push(setTimeout(() => { tijdOm = true; volgende(); }, duur));

    // Voortgangsbalk: volgt de opname als die er is, anders de tijd.
    const start = performance.now();
    const balk = el.querySelectorAll('.film-voortgang b')[nr];
    const lengte = opname ? 0 : duur;
    const loop = nu => {
      if (!nogInBeeld()) { stop(); return; }
      const a = Spraak.audio;
      const deel = opname ? (a && a.duration ? a.currentTime / a.duration : 0) : (nu - start) / lengte;
      balk.style.width = Math.min(100, deel * 100) + '%';
      if (speelt) frame = requestAnimationFrame(loop);
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

  return { html, koppel, teksten };
})();
