/*
 * Olympische medailles (zomer + winter) per sporter, totaal = goud + zilver + brons.
 * Alleen sporters van wie het aantal vaststaat (gestopt, of laatste Spelen = Parijs 2024).
 */
window.KERST_DATA = window.KERST_DATA || {};

KERST_DATA.medailles = {
  titel: 'Olympische medailles',
  emoji: '🥇',
  bijgewerkt: 't/m Parijs 2024',
  items: [
    // Nederland
    { naam: 'Ireen Wüst', wie: 'Schaatsster 🇳🇱', emoji: '⛸️', kleur: '#dbeafe', goud: 6, zilver: 5, brons: 2 },
    { naam: 'Sven Kramer', wie: 'Schaatser 🇳🇱', emoji: '⛸️', kleur: '#dbeafe', goud: 4, zilver: 2, brons: 3 },
    { naam: 'Anky van Grunsven', wie: 'Dressuuramazone 🇳🇱', emoji: '🐎', kleur: '#fde68a', goud: 3, zilver: 5, brons: 1 },
    { naam: 'Inge de Bruijn', wie: 'Zwemster 🇳🇱', emoji: '🏊‍♀️', kleur: '#cffafe', goud: 4, zilver: 2, brons: 2 },
    { naam: 'Pieter van den Hoogenband', wie: 'Zwemmer 🇳🇱', emoji: '🏊‍♂️', kleur: '#cffafe', goud: 3, zilver: 2, brons: 2 },
    { naam: 'Leontien van Moorsel', wie: 'Wielrenster 🇳🇱', emoji: '🚴‍♀️', kleur: '#fee2e2', goud: 4, zilver: 1, brons: 1 },
    { naam: 'Harrie Lavreysen', wie: 'Baanwielrenner 🇳🇱', emoji: '🚴‍♂️', kleur: '#fee2e2', goud: 5, zilver: 0, brons: 1 },
    { naam: 'Sifan Hassan', wie: 'Atlete 🇳🇱', emoji: '🏃‍♀️', kleur: '#ffedd5', goud: 3, zilver: 0, brons: 3 },
    { naam: 'Femke Bol', wie: 'Atlete 🇳🇱', emoji: '🏃‍♀️', kleur: '#ffedd5', goud: 1, zilver: 1, brons: 2 },
    { naam: 'Ranomi Kromowidjojo', wie: 'Zwemster 🇳🇱', emoji: '🏊‍♀️', kleur: '#cffafe', goud: 3, zilver: 1, brons: 0 },
    { naam: 'Fanny Blankers-Koen', wie: 'Atlete 🇳🇱 (1948)', emoji: '🏃‍♀️', kleur: '#ffedd5', goud: 4, zilver: 0, brons: 0 },
    { naam: 'Marianne Vos', wie: 'Wielrenster 🇳🇱', emoji: '🚴‍♀️', kleur: '#fee2e2', goud: 2, zilver: 1, brons: 0 },
    { naam: 'Sharon van Rouwendaal', wie: 'Openwaterzwemster 🇳🇱', emoji: '🌊', kleur: '#cffafe', goud: 2, zilver: 1, brons: 0 },
    { naam: 'Marit Bouwmeester', wie: 'Zeilster 🇳🇱', emoji: '⛵', kleur: '#e0f2fe', goud: 1, zilver: 1, brons: 1 },
    { naam: 'Jochem Uytdehaage', wie: 'Schaatser 🇳🇱', emoji: '⛸️', kleur: '#dbeafe', goud: 2, zilver: 1, brons: 0 },
    { naam: 'Dorian van Rijsselberghe', wie: 'Windsurfer 🇳🇱', emoji: '🏄‍♂️', kleur: '#e0f2fe', goud: 2, zilver: 0, brons: 0 },
    { naam: 'Epke Zonderland', wie: 'Turner 🇳🇱', emoji: '🤸‍♂️', kleur: '#ede9fe', goud: 1, zilver: 0, brons: 0 },
    { naam: 'Dafne Schippers', wie: 'Atlete 🇳🇱', emoji: '🏃‍♀️', kleur: '#ffedd5', goud: 0, zilver: 1, brons: 0 },
    { naam: 'Ellen van Langen', wie: 'Atlete 🇳🇱', emoji: '🏃‍♀️', kleur: '#ffedd5', goud: 1, zilver: 0, brons: 0 },
    { naam: 'Maarten van der Weijden', wie: 'Openwaterzwemmer 🇳🇱', emoji: '🌊', kleur: '#cffafe', goud: 1, zilver: 0, brons: 0 },
    { naam: 'Nicolien Sauerbreij', wie: 'Snowboardster 🇳🇱', emoji: '🏂', kleur: '#dbeafe', goud: 1, zilver: 0, brons: 0 },

    // Internationaal
    { naam: 'Michael Phelps', wie: 'Zwemmer 🇺🇸', emoji: '🏊‍♂️', kleur: '#cffafe', goud: 23, zilver: 3, brons: 2 },
    { naam: 'Larisa Latynina', wie: 'Turnster 🇷🇺 (Sovjet-Unie)', emoji: '🤸‍♀️', kleur: '#ede9fe', goud: 9, zilver: 5, brons: 4 },
    { naam: 'Marit Bjørgen', wie: 'Langlaufster 🇳🇴', emoji: '⛷️', kleur: '#dbeafe', goud: 8, zilver: 4, brons: 3 },
    { naam: 'Katie Ledecky', wie: 'Zwemster 🇺🇸', emoji: '🏊‍♀️', kleur: '#cffafe', goud: 9, zilver: 4, brons: 1 },
    { naam: 'Simone Biles', wie: 'Turnster 🇺🇸', emoji: '🤸‍♀️', kleur: '#ede9fe', goud: 7, zilver: 2, brons: 2 },
    { naam: 'Allyson Felix', wie: 'Atlete 🇺🇸', emoji: '🏃‍♀️', kleur: '#ffedd5', goud: 7, zilver: 3, brons: 1 },
    { naam: 'Carl Lewis', wie: 'Atleet 🇺🇸', emoji: '🏃‍♂️', kleur: '#ffedd5', goud: 9, zilver: 1, brons: 0 },
    { naam: 'Ian Thorpe', wie: 'Zwemmer 🇦🇺', emoji: '🏊‍♂️', kleur: '#cffafe', goud: 5, zilver: 3, brons: 1 },
    { naam: 'Nadia Comăneci', wie: 'Turnster 🇷🇴', emoji: '🤸‍♀️', kleur: '#ede9fe', goud: 5, zilver: 3, brons: 1 },
    { naam: 'Usain Bolt', wie: 'Sprinter 🇯🇲', emoji: '⚡', kleur: '#fef9c3', goud: 8, zilver: 0, brons: 0 },
    { naam: 'Léon Marchand', wie: 'Zwemmer 🇫🇷', emoji: '🏊‍♂️', kleur: '#cffafe', goud: 4, zilver: 0, brons: 1 },
    { naam: 'LeBron James', wie: 'Basketballer 🇺🇸', emoji: '🏀', kleur: '#ffedd5', goud: 3, zilver: 0, brons: 1 },
    { naam: 'Eliud Kipchoge', wie: 'Marathonloper 🇰🇪', emoji: '🏃‍♂️', kleur: '#ffedd5', goud: 2, zilver: 1, brons: 1 },
    { naam: 'Mo Farah', wie: 'Atleet 🇬🇧', emoji: '🏃‍♂️', kleur: '#ffedd5', goud: 4, zilver: 0, brons: 0 },
    { naam: 'Serena Williams', wie: 'Tennisster 🇺🇸', emoji: '🎾', kleur: '#dcfce7', goud: 4, zilver: 0, brons: 0 },
    { naam: 'Shaun White', wie: 'Snowboarder 🇺🇸', emoji: '🏂', kleur: '#dbeafe', goud: 3, zilver: 0, brons: 0 },
    { naam: 'Rafael Nadal', wie: 'Tennisser 🇪🇸', emoji: '🎾', kleur: '#dcfce7', goud: 2, zilver: 0, brons: 0 },
    { naam: 'Novak Djokovic', wie: 'Tennisser 🇷🇸', emoji: '🎾', kleur: '#dcfce7', goud: 1, zilver: 0, brons: 1 },
    { naam: 'Roger Federer', wie: 'Tennisser 🇨🇭', emoji: '🎾', kleur: '#dcfce7', goud: 1, zilver: 1, brons: 0 },
    { naam: 'Armand Duplantis', wie: 'Polsstokhoogspringer 🇸🇪', emoji: '🏅', kleur: '#fef9c3', goud: 2, zilver: 0, brons: 0 },
  ],
};

KERST_DATA.medailles.items.forEach(i => { i.waarde = i.goud + i.zilver + i.brons; });
