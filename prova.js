/* Clienti di prova (dati finti) per la versione 0.2: gli stessi tre esempi della scheda per Anita.
   Prezzi veri del foglio Magazzino del 17/11/2026; kefir 2,10 € e yogurt 2,40 € del cliente del pane sono dedotti dai totali.
   Le prove automatiche (prove/punti.test.js) controllano che diano i punti della scheda. */
(function (radice, fabbrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabbrica();
  else radice.Prova = fabbrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const piu = (data, giorni) => new Date(Date.parse(data + 'T00:00:00Z') + giorni * 86400000).toISOString().slice(0, 10);
  const S = (data, nome, cent, extra = {}) => ({ nome, importoCent: cent, scadenza: piu(data, 20), ...extra });
  const U = (data, nome, cent, extra = {}) => ({ nome, importoCent: cent, scadenza: piu(data, 5), ...extra });
  const N = (nome, cent, extra = {}) => ({ nome, importoCent: cent, ...extra });
  const PANE = () => ({ nome: 'Pane', importoCent: 350, bottega: true, pane: true });

  const famiglia = () => ({
    codice: 'LSSFAM29QX4', codiceAmica: 'AMI7FQ2K', iscrittoIl: '2026-10-05', amiche: [],
    spese: [
      { id: 'f1', data: '2026-11-04', righe: [N('Pecorino, riso, passata, pasta', 2790), S('2026-11-04', 'Uova ×6 e yogurt greco', 1512, { prodottoSettimana: true }), PANE()] },
      { id: 'f2', data: '2026-11-11', righe: [N('Parmigiano, ceci, lenticchie, fesa, latte', 2795), S('2026-11-11', 'Mozzarella di bufala ×2', 790, { prodottoSettimana: true }), PANE()] },
      { id: 'f3', data: '2026-11-18', righe: [N('Pecorino, farina, passata, noci, latte', 2490), S('2026-11-18', 'Burro', 350, { prodottoSettimana: true }), U('2026-11-18', 'Emmental 200 g', 530), PANE()] },
      { id: 'f4', data: '2026-11-25', buonoUsato: '2026-11-1', righe: [N('Riso, pasta, passata, parmigiano', 2830), N('Miele', 600, { prodottoSettimana: true }), S('2026-11-25', 'Bresaola e würstel', 996), PANE()] }
    ]
  });

  const fedele = () => ({
    codice: 'LSSFED7K2M9', codiceAmica: 'AMI3KD8W', iscrittoIl: '2026-10-05', amiche: [],
    spese: [
      { id: 'c1', data: '2026-11-02', righe: [N('Pecorino, riso, passata, ceci, latte', 3210), PANE()] },
      { id: 'c2', data: '2026-11-09', righe: [N('Parmigiano, fesa, pasta, passata, latte', 3080), PANE()] },
      { id: 'c3', data: '2026-11-16', righe: [N('Pecorino, noci, miele, riso', 3090), S('2026-11-16', 'Mozzarella di bufala', 395), PANE()] },
      { id: 'c4', data: '2026-11-23', righe: [N('Pasta, passata, parmigiano, lenticchie', 2235), S('2026-11-23', 'Burro', 350), U('2026-11-23', 'Latte bio', 350), PANE()] },
      { id: 'c5', data: '2026-11-28', righe: [N('Latte', 240), S('2026-11-28', 'Würstel e yogurt', 710), U('2026-11-28', 'Ricotta', 260), PANE()] }
    ]
  });

  const settimanaPane = lun => [
    { id: lun + 'a', data: lun, righe: [PANE(), N('Latte', 240)] },
    { id: lun + 'b', data: piu(lun, 2), righe: [PANE(), S(piu(lun, 2), 'Kefir', 210)] },
    { id: lun + 'c', data: piu(lun, 4), righe: [PANE(), S(piu(lun, 4), 'Yogurt', 240)] }
  ];
  const delPane = () => ({
    codice: 'LSSPAN4QX7K', codiceAmica: 'AMI9PN4H', iscrittoIl: '2026-10-05', amiche: [],
    spese: ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23'].flatMap(settimanaPane)
  });

  /* la spesa del riepilogo grafico: 49 punti */
  const spesaEsempio = data => ({ id: 'e' + Date.now(), data, righe: [N('Pasta', 590), S(data, 'Yogurt «Salvali tu»', 1230), { nome: 'Pane della bottega', importoCent: 350, bottega: true, pane: true }] });

  const SCENARI = [
    { id: 'famiglia', nome: 'Famiglia', oggi: '2026-11-18', descrizione: 'Spesa grande ogni settimana: il 18 arriva a 201 punti e prende il buono', cliente: famiglia },
    { id: 'fedele', nome: 'Cliente fedele', oggi: '2026-11-25', descrizione: '35 € a settimana: il 25 l’app avvisa «ti mancano 22 punti»', cliente: fedele },
    { id: 'pane', nome: 'Cliente del pane', oggi: '2026-11-30', descrizione: 'Spese piccole: 164 punti a fine mese, niente buono', cliente: delPane }
  ];

  /* vetrina di prova (dati finti): come quella che pubblica il Magazzino in vetrina/oggi */
  const vetrinaProva = oggi => ({
    giorno: oggi, aggiornato: null,
    missioni: [
      { tipo: 'settimana', titolo: 'Il prodotto della settimana', testo: 'Prendi il prodotto della settimana in 4 settimane del mese', punti: 20, prodotti: [{ id: 'p1', nome: 'Yogurt greco 500 g', prezzoCent: 390, unita: 'pz', giorni: 12 }] },
      { tipo: 'dolce', titolo: 'Assaggia la novità', testo: 'Prendi il dolce del mese', punti: 10, prodotti: [{ id: 'p2', nome: 'Crostata di mele', prezzoCent: 1400, unita: 'pz' }] },
      { tipo: 'pane', titolo: 'Il pane della settimana', testo: 'Prendi il pane in 3 giorni della stessa settimana', punti: 20, prodotti: [{ id: 'p3', nome: 'Pane casereccio', prezzoCent: 350, unita: 'pz' }, { id: 'p4', nome: 'Pane integrale', prezzoCent: 380, unita: 'pz' }] }
    ],
    ultimi: [{ id: 'p5', nome: 'Emmental 200 g', prezzoCent: 530, unita: 'pz', giorni: 3, ppe: 4 }, { id: 'p6', nome: 'Ricotta', prezzoCent: 260, unita: 'pz', giorni: 6, ppe: 4 }],
    salvali: [{ id: 'p7', nome: 'Kefir senza lattosio', prezzoCent: 210, unita: 'pz', giorni: 14, ppe: 3 }, { id: 'p8', nome: 'Miglio soffiato', prezzoCent: 240, unita: 'pz', giorni: 18, ppe: 3 }, { id: 'p9', nome: 'Mozzarella di bufala', prezzoCent: 395, unita: 'pz', giorni: 22, ppe: 3 }],
    bottega: [{ id: 'p10', nome: 'Biscotti alle mandorle', prezzoCent: 1800, unita: 'kg', ppe: 2 }, { id: 'p11', nome: 'Lasagne', prezzoCent: 650, unita: 'pz', ppe: 2 }]
  });

  return { SCENARI, spesaEsempio, settimanaPane, piu, vetrinaProva };
});
