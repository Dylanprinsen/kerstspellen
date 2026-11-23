/*
 * Iconische sportmomenten voor "Raad het moment".
 *   quote     wat de commentator zegt; [tussen haken] wordt weggepiept (namen e.d.)
 *   taal      nl, en of es (bepaalt de voorleesstem, of zet zelf `stem`); bij en/es staat er een vertaling bij
 *   echt      true = letterlijk citaat (met `wie`), false = nagespeeld ("vrij naar het commentaar")
 *   hint      sport, jaar en een tip (hint 1)
 *   kort      korte naam van het moment (voor de 4 keuzes)
 *   antwoord  wat er gebeurde
 *   foto      naam in data/fotos.js (optioneel)
 * De feiten kloppen; bij twijfel over de exacte woorden staat echt: false.
 */
window.KERST_DATA = window.KERST_DATA || {};

KERST_DATA.momenten = [
  // ---------- Internationaal, letterlijk ----------
  {
    id: 'wk1966', taal: 'en', echt: true, wie: 'Kenneth Wolstenholme (BBC)',
    quote: "Some people are on the pitch... they think it's all over... it is now!",
    vertaling: 'Er staan al mensen op het veld... ze denken dat het voorbij is... nu is het dat!',
    sport: 'voetbal', hint: '⚽ Voetbal · 1966 · WK-finale in Londen',
    kort: 'Engeland wereldkampioen, WK-finale 1966',
    antwoord: 'Geoff Hurst maakt de 4-2 in de WK-finale tegen West-Duitsland: Engeland wordt wereldkampioen (1966).',
  },
  {
    id: 'aguero', taal: 'en', echt: true, wie: 'Martin Tyler (Sky Sports)',
    quote: "[Agüerooooo!] I swear you'll never see anything like this ever again!",
    vertaling: '▇▇▇! Ik zweer het, zoiets zie je nooit meer!',
    sport: 'voetbal', hint: '⚽ Voetbal · 2012 · laatste minuut van de Engelse competitie',
    kort: 'Agüero, kampioensgoal Manchester City 2012',
    antwoord: 'Sergio Agüero scoort in blessuretijd van de laatste wedstrijd: Manchester City pakt de Engelse titel (2012).',
  },
  {
    id: 'miracle', taal: 'en', stem: 'en-US-GuyNeural', echt: true, wie: 'Al Michaels (ABC)',
    quote: 'Do you believe in miracles? Yes!',
    vertaling: 'Geloof je in wonderen? Ja!',
    sport: 'ijshockey', hint: '🏒 IJshockey · 1980 · Olympische Winterspelen',
    kort: '"Miracle on Ice", Winterspelen 1980',
    antwoord: 'Het "Miracle on Ice": een team Amerikaanse studenten verslaat de oppermachtige Sovjet-Unie op de Winterspelen van 1980.',
  },
  {
    id: 'solskjaer', taal: 'en', echt: true, wie: 'Clive Tyldesley (ITV)',
    quote: 'And [Solskjaer] has won it!',
    vertaling: 'En ▇▇▇ heeft hem gewonnen!',
    sport: 'voetbal', hint: '⚽ Voetbal · 1999 · Champions League-finale',
    kort: 'Manchester United – Bayern, CL-finale 1999',
    antwoord: 'Manchester United maakt in blessuretijd twee goals tegen Bayern München en wint de Champions League (1999).',
  },
  {
    id: 'maradona', taal: 'es', echt: true, wie: 'Víctor Hugo Morales (Argentijnse radio)',
    quote: '¡Barrilete cósmico! ¿De qué planeta viniste?',
    vertaling: 'Kosmische vlieger! Van welke planeet kom jij?',
    sport: 'voetbal', hint: '⚽ Voetbal · 1986 · WK-kwartfinale tegen Engeland',
    kort: 'Maradona dribbelt door Engeland, WK 1986',
    antwoord: 'Diego Maradona dribbelt langs half Engeland en scoort het "doelpunt van de eeuw" (WK 1986).',
    foto: 'Diego Maradona',
  },
  {
    id: 'glock', taal: 'en', echt: true, wie: 'Martin Brundle (ITV)',
    quote: 'Is that [Glock]? Is that [Glock] going slowly?',
    vertaling: 'Is dat ▇▇▇? Rijdt ▇▇▇ daar langzaam?',
    sport: 'formule 1', hint: '🏎️ Formule 1 · 2008 · laatste bochten van het seizoen in Brazilië',
    kort: 'Hamilton wereldkampioen in de laatste bocht, 2008',
    antwoord: 'Lewis Hamilton haalt in de laatste bochten Timo Glock in en wordt op het nippertje wereldkampioen (Brazilië 2008).',
    foto: 'Lewis Hamilton',
  },

  // ---------- Nederland, nagespeeld commentaar ----------
  {
    id: 'vanbasten', taal: 'nl', echt: false,
    quote: '[Van Basten]... wat een goal! Wat een goal! Uit een onmogelijke hoek, zo over de keeper heen!',
    sport: 'voetbal', hint: '⚽ Voetbal · 1988 · EK-finale tegen de Sovjet-Unie',
    kort: 'Van Basten, de volley in de EK-finale 1988',
    antwoord: 'Marco van Basten schiet uit een bijna onmogelijke hoek de volley binnen: Nederland wordt Europees kampioen (1988).',
    foto: 'Marco van Basten',
  },
  {
    id: 'bergkamp', taal: 'nl', echt: false,
    quote: 'Een lange bal van achteruit... aannemen, nog een keer... en raak! [Dennis Bergkamp]! [Dennis Bergkamp]! [Dennis Bergkamp]!',
    sport: 'voetbal', hint: '⚽ Voetbal · 1998 · WK-kwartfinale, 90e minuut',
    kort: 'Bergkamp tegen Argentinië, WK 1998',
    antwoord: 'Dennis Bergkamp neemt in de 90e minuut een lange bal van Frank de Boer perfect aan en scoort de 2-1 tegen Argentinië (WK 1998).',
    foto: 'Dennis Bergkamp',
  },
  {
    id: 'vanpersie', taal: 'nl', echt: false,
    quote: 'Een lange bal... en hij duikt! Hij zweeft door de lucht! Zo over de keeper heen! Wat een kopbal van [Van Persie]!',
    sport: 'voetbal', hint: '⚽ Voetbal · 2014 · WK, tegen de regerend wereldkampioen',
    kort: 'Van Persie\'s zweefduik tegen Spanje, WK 2014',
    antwoord: 'Robin van Persie scoort met een zweefkopbal tegen Spanje; Oranje wint met 5-1 van de wereldkampioen (WK 2014).',
    foto: 'Robin van Persie',
  },
  {
    id: 'iniesta', taal: 'nl', echt: false,
    quote: 'Nog vier minuten in de verlenging... en daar is het toch gebeurd. [Iniesta]. Het is voorbij. Zo dichtbij...',
    sport: 'voetbal', hint: '⚽ Voetbal · 2010 · WK-finale in Johannesburg',
    kort: 'Iniesta in de verlenging, WK-finale 2010',
    antwoord: 'Andrés Iniesta scoort in de 116e minuut van de WK-finale: Spanje wint van Nederland (2010).',
  },
  {
    id: 'kluivert', taal: 'nl', echt: false,
    quote: 'Een jongen van achttien... hij draait... hij schiet... JA! [Kluivert]! Vijf minuten voor tijd!',
    sport: 'voetbal', hint: '⚽ Voetbal · 1995 · Champions League-finale in Wenen',
    kort: 'Kluivert wint de Champions League voor Ajax, 1995',
    antwoord: 'De 18-jarige Patrick Kluivert scoort vijf minuten voor tijd: Ajax wint de Champions League van AC Milan (1995).',
  },
  {
    id: 'leeuwinnen', taal: 'nl', echt: false,
    quote: 'Het eindsignaal! Een uitverkocht stadion in Enschede staat op zijn kop... ze zijn Europees kampioen, in eigen land!',
    sport: 'voetbal', hint: '⚽ Voetbal · 2017 · EK-finale tegen Denemarken',
    kort: 'Oranjeleeuwinnen Europees kampioen, 2017',
    antwoord: 'De Oranjeleeuwinnen winnen de EK-finale in Enschede met 4-2 van Denemarken en worden Europees kampioen in eigen land (2017).',
  },
  {
    id: 'max2021', taal: 'nl', echt: false,
    quote: 'De allerlaatste ronde... hij duikt naar binnen... hij gaat erlangs! Hij gaat erlangs! [Max Verstappen] is wereldkampioen!',
    sport: 'formule 1', hint: '🏎️ Formule 1 · 2021 · laatste ronde van het seizoen in Abu Dhabi',
    kort: 'Verstappen wereldkampioen in de laatste ronde, 2021',
    antwoord: 'Max Verstappen haalt Lewis Hamilton in de allerlaatste ronde in en wordt voor het eerst wereldkampioen (Abu Dhabi 2021).',
    foto: 'Max Verstappen',
  },
  {
    id: 'max2016', taal: 'nl', echt: false,
    quote: 'Achttien jaar oud! In zijn allereerste race voor zijn nieuwe team... en hij wint! De jongste winnaar ooit!',
    sport: 'formule 1', hint: '🏎️ Formule 1 · 2016 · Grand Prix van Spanje',
    kort: 'Verstappen wint zijn eerste Grand Prix, 2016',
    antwoord: 'Max Verstappen wint als 18-jarige in zijn eerste race voor Red Bull de Grand Prix van Spanje: de jongste winnaar ooit (2016).',
    foto: 'Max Verstappen',
  },
  {
    id: 'kramer', taal: 'nl', echt: false,
    quote: 'Hij moet naar binnen... nee! Nee! Hij gaat naar buiten! Dit is niet goed... dit is een drama!',
    sport: 'schaatsen', hint: '⛸️ Schaatsen · 2010 · olympische 10 kilometer in Vancouver',
    kort: 'Kramer wisselt verkeerd, Spelen 2010',
    antwoord: 'Sven Kramer rijdt op weg naar goud op de 10 km de verkeerde baan in, op aanwijzing van zijn coach, en wordt gediskwalificeerd (Vancouver 2010).',
    foto: 'Sven Kramer',
  },
  {
    id: 'angenent', taal: 'nl', echt: false,
    quote: 'Daar komen ze de Bonkevaart op, na bijna tweehonderd kilometer... en hij wint! [Henk Angenent] wint de tocht der tochten!',
    sport: 'schaatsen', hint: '⛸️ Schaatsen · 1997 · Friesland',
    kort: 'Angenent wint de Elfstedentocht van 1997',
    antwoord: 'Henk Angenent wint de Elfstedentocht van 1997, de laatste die verreden is.',
  },
  {
    id: 'bol2024', taal: 'nl', echt: false,
    quote: 'Ze krijgt het stokje ver achter de rest... ze komt, ze komt... en in de laatste meters gaat ze erover! Ongelooflijk!',
    sport: 'atletiek', hint: '🏃 Atletiek · 2024 · laatste loper van de estafette in Parijs',
    kort: 'Femke Bol en de gemengde estafette, Parijs 2024',
    antwoord: 'Femke Bol loopt als laatste loper van de gemengde 4x400 meter iedereen voorbij: olympisch goud (Parijs 2024).',
    foto: 'Femke Bol',
  },
  {
    id: 'hassan2021', taal: 'nl', echt: false,
    quote: 'Ze valt! In de laatste ronde ligt ze op de baan... maar ze staat op... ze gaat ze allemaal voorbij... en ze wint nog!',
    sport: 'atletiek', hint: '🏃 Atletiek · 2021 · een serie op de 1500 meter in Tokio',
    kort: 'Hassan valt en wint toch, Tokio 2021',
    antwoord: 'Sifan Hassan valt in de laatste ronde van haar serie op de 1500 meter, staat op en wint toch nog (Tokio 2021).',
    foto: 'Sifan Hassan',
  },
  {
    id: 'schippers', taal: 'nl', echt: false,
    quote: 'Ze komt de bocht uit... ze is als eerste... [Dafne Schippers] is wereldkampioen! En dat in een Europees record!',
    sport: 'atletiek', hint: '🏃 Atletiek · 2015 · WK in Peking',
    kort: 'Schippers wereldkampioen 200 meter, 2015',
    antwoord: 'Dafne Schippers wordt wereldkampioen op de 200 meter in een Europees record (Peking 2015).',
    foto: 'Dafne Schippers',
  },
  {
    id: 'bolt', taal: 'nl', echt: false,
    quote: 'Hij is weg... niemand komt in de buurt... negen... vijf... acht! Wereldrecord! Dat is niet menselijk!',
    sport: 'atletiek', hint: '🏃 Atletiek · 2009 · WK in Berlijn',
    kort: 'Bolt loopt 9,58, Berlijn 2009',
    antwoord: 'Usain Bolt loopt het wereldrecord op de 100 meter: 9,58 seconden (Berlijn 2009).',
    foto: 'Usain Bolt',
  },
  {
    id: 'zonderland', taal: 'nl', echt: false,
    quote: 'Hij gaat voor alles... de ene vlucht na de andere... en dan de landing... hij staat! Hij staat! Goud!',
    sport: 'turnen', hint: '🤸 Turnen · 2012 · Olympische Spelen in Londen',
    kort: 'Zonderland goud aan de rekstok, Londen 2012',
    antwoord: 'Epke Zonderland wint olympisch goud aan de rekstok met drie vluchtelementen achter elkaar (Londen 2012).',
    foto: 'Epke Zonderland',
  },
  {
    id: 'hoogenband', taal: 'nl', echt: false,
    quote: 'In zijn eigen land, voor zijn eigen publiek... hij komt terug... maar [Pieter] houdt hem af! Wereldrecordtijd!',
    sport: 'zwemmen', hint: '🏊 Zwemmen · 2000 · Olympische Spelen in Sydney',
    kort: 'Van den Hoogenband verslaat Thorpe, Sydney 2000',
    antwoord: 'Pieter van den Hoogenband verslaat Ian Thorpe in diens eigen land op de 200 meter vrij, in een wereldrecordtijd (Sydney 2000).',
    foto: 'Pieter van den Hoogenband',
  },
  {
    id: 'krajicek', taal: 'nl', echt: false,
    quote: 'Matchpoint... en het is voorbij! Hij heeft het gedaan... de eerste Nederlander ooit!',
    sport: 'tennis', hint: '🎾 Tennis · 1996 · Londen',
    kort: 'Krajicek wint Wimbledon, 1996',
    antwoord: 'Richard Krajicek wint Wimbledon, als eerste en tot nu toe enige Nederlandse man (1996).',
  },
  {
    id: 'vanderpoel', taal: 'nl', echt: false,
    quote: 'Hij zit nog zo ver terug... dit kan niet meer... of toch? Hij komt, hij komt... hij wint! Dit is niet normaal!',
    sport: 'wielrennen', hint: '🚴 Wielrennen · 2019 · klassieker in Limburg',
    kort: 'Van der Poel wint de Amstel Gold Race, 2019',
    antwoord: 'Mathieu van der Poel wint de Amstel Gold Race na een onmogelijk lijkende inhaalrace in de laatste kilometer (2019).',
    foto: 'Mathieu van der Poel',
  },
];
