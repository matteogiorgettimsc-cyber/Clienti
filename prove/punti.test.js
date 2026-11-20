/* Prove automatiche del calcolo dei punti: node --test prove/
   Gli esempi vengono dal riepilogo «Le regole dei punti» e dalla scheda «Punti della bottega – proposta per Anita» (17-19/11/2026). */
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../punti.js');

const piu = (data, giorni) => new Date(Date.parse(data + 'T00:00:00Z') + giorni * 86400000).toISOString().slice(0, 10);
const S = (data, nome, cent, extra = {}) => ({ nome, importoCent: cent, scadenza: piu(data, 20), ...extra });   // «Salvali tu», 30-11 giorni
const U = (data, nome, cent, extra = {}) => ({ nome, importoCent: cent, scadenza: piu(data, 5), ...extra });    // 10 giorni o meno
const B = (nome, cent, extra = {}) => ({ nome, importoCent: cent, bottega: true, ...extra });                     // fatto in bottega
const N = (nome, cent, extra = {}) => ({ nome, importoCent: cent, ...extra });                                    // tutto il resto
const PANE = () => B('Pane', 350, { pane: true });

test('punti per euro: 1, 2, 3, 4 e i confini dei giorni', () => {
  const d = '2026-11-20';
  assert.equal(P.puntiPerEuro(N('pasta', 100), d), 1);
  assert.equal(P.puntiPerEuro(B('pane', 100), d), 2);
  assert.equal(P.puntiPerEuro({ importoCent: 100, scadenza: piu(d, 30) }, d), 3);
  assert.equal(P.puntiPerEuro({ importoCent: 100, scadenza: piu(d, 11) }, d), 3);
  assert.equal(P.puntiPerEuro({ importoCent: 100, scadenza: piu(d, 10) }, d), 4);
  assert.equal(P.puntiPerEuro({ importoCent: 100, scadenza: d }, d), 4);              // fino al giorno di scadenza
  assert.equal(P.puntiPerEuro({ importoCent: 100, scadenza: piu(d, 31) }, d), 1);
  assert.equal(P.puntiPerEuro({ importoCent: 100, scadenza: piu(d, -1) }, d), 1);     // scaduto: non si vende, conta 1
  assert.equal(P.puntiPerEuro({ importoCent: 100, bottega: true, scadenza: piu(d, 20) }, d), 3); // vale la regola più alta
});

test('esempio del riepilogo: pasta, yogurt «Salvali tu», pane = 49 punti', () => {
  const d = '2026-11-20';
  const r = P.puntiSpesa({ data: d, righe: [N('Pasta', 590), S(d, 'Yogurt', 1230), B('Pane della bottega', 350)] });
  assert.equal(r.totaleCent, 2170);
  assert.equal(r.lordi, 49);   // 49,80 arrotondato per difetto
  assert.equal(r.punti, 49);
});

/* ---------- 1. Famiglia, spesa grande ogni settimana: buono il 18 ---------- */
const famiglia = {
  iscrittoIl: '2026-10-05',
  spese: [
    { id: 'f1', data: '2026-11-04', righe: [N('pecorino, riso, passata, pasta', 2790), S('2026-11-04', 'uova ×6 e yogurt greco', 1512, { prodottoSettimana: true }), PANE()] },
    { id: 'f2', data: '2026-11-11', righe: [N('parmigiano, ceci, lenticchie, fesa, latte', 2795), S('2026-11-11', 'mozzarella di bufala ×2', 790, { prodottoSettimana: true }), PANE()] },
    { id: 'f3', data: '2026-11-18', righe: [N('pecorino, farina, passata, noci, latte', 2490), S('2026-11-18', 'burro', 350, { prodottoSettimana: true }), U('2026-11-18', 'emmental 200 g', 530), PANE()] },
    { id: 'f4', data: '2026-11-25', buonoUsato: '2026-11-1', righe: [N('riso, pasta, passata, parmigiano', 2830), N('miele', 600, { prodottoSettimana: true }), S('2026-11-25', 'bresaola e würstel', 996), PANE()] }
  ]
};

test('famiglia: 80, 58, 63, 86 punti; 287 nel mese; buono il 18; restano 87', () => {
  const punti = famiglia.spese.map(s => P.puntiSpesa(s).punti);
  assert.deepEqual(punti, [80, 58, 63, 66]);              // il 25: 71,18 − 5 del buono = 66
  const m = P.mese(famiglia, '2026-11-30');
  assert.equal(m.missioni.find(x => x.id === 'settimana').completa, true);   // prodotto della settimana in 4 settimane: +20
  assert.equal(m.totale, 287);
  assert.equal(m.buoniGuadagnati, 1);
  assert.equal(m.nelBarattolo, 87);
  const b = P.buoni(famiglia, '2026-11-30');
  assert.equal(b.length, 1);
  assert.equal(b[0].guadagnatoIl, '2026-11-18');
  assert.equal(b[0].scade, '2026-12-31');
  assert.equal(b[0].stato, 'usato');
  assert.equal(P.buonoUsabile(4776), true);
});

/* ---------- 2. Cliente fedele, 35 € a settimana: buono grazie all'avviso ---------- */
const fedele = {
  iscrittoIl: '2026-10-05',
  spese: [
    { id: 'c1', data: '2026-11-02', righe: [N('pecorino, riso, passata, ceci, latte', 3210), PANE()] },
    { id: 'c2', data: '2026-11-09', righe: [N('parmigiano, fesa, pasta, passata, latte', 3080), PANE()] },
    { id: 'c3', data: '2026-11-16', righe: [N('pecorino, noci, miele, riso', 3090), S('2026-11-16', 'mozzarella di bufala', 395), PANE()] },
    { id: 'c4', data: '2026-11-23', righe: [N('pasta, passata, parmigiano, lenticchie', 2235), S('2026-11-23', 'burro', 350), U('2026-11-23', 'latte bio', 350), PANE()] },
    { id: 'c5', data: '2026-11-28', righe: [N('latte', 240), S('2026-11-28', 'würstel e yogurt', 710), U('2026-11-28', 'ricotta', 260), PANE()] }
  ]
};

test('cliente fedele: 39, 37, 49, 53; il 25 «ti mancano 22 punti»; il 28 arriva a 219 e prende il buono', () => {
  assert.deepEqual(fedele.spese.map(s => P.puntiSpesa(s).punti), [39, 37, 49, 53, 41]);
  const il24 = P.mese(fedele, '2026-11-24');
  assert.equal(il24.avviso, null);                      // prima del 25 niente avviso
  const il25 = P.mese(fedele, '2026-11-25');
  assert.equal(il25.totale, 178);
  assert.equal(il25.avviso.mancano, 22);
  const fine = P.mese(fedele, '2026-11-30');
  assert.equal(fine.totale, 219);
  assert.equal(fine.buoniGuadagnati, 1);
  assert.equal(P.buoni(fedele, '2026-11-30')[0].stato, 'da usare');
});

/* ---------- 3. Cliente del pane, spese piccole: niente buono ----------
   Kefir 2,10 € e yogurt 2,40 € sono dedotti dai totali della scheda (9 + 13 + 14 punti, 17,40 € a settimana). */
const settimanaPane = lun => [
  { id: lun + 'a', data: lun, righe: [PANE(), N('latte', 240)] },
  { id: lun + 'b', data: piu(lun, 2), righe: [PANE(), S(piu(lun, 2), 'kefir', 210)] },
  { id: lun + 'c', data: piu(lun, 4), righe: [PANE(), S(piu(lun, 4), 'yogurt', 240)] }
];
const delPane = { iscrittoIl: '2026-10-05', spese: ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23'].flatMap(settimanaPane) };

test('cliente del pane: 9 + 13 + 14 = 36 a settimana, missione del pane una volta sola, 164 nel mese, niente buono', () => {
  assert.deepEqual(settimanaPane('2026-11-02').map(s => P.puntiSpesa(s).punti), [9, 13, 14]);
  assert.equal(settimanaPane('2026-11-02').reduce((t, s) => t + P.puntiSpesa(s).totaleCent, 0), 1740);
  assert.equal(P.mese(delPane, '2026-11-08').totale, 56);  // 36 + 20 della missione del pane
  const m = P.mese(delPane, '2026-11-30');
  assert.equal(m.totale, 164);
  assert.equal(m.buoniGuadagnati, 0);
  assert.equal(P.buoni(delPane, '2026-11-30').length, 0);
});

test('il 1° del mese punti e missioni ripartono da zero; il buono vale fino alla fine del mese dopo', () => {
  const dic = P.mese(fedele, '2026-12-01');
  assert.equal(dic.totale, 0);
  assert.equal(dic.missioni.every(x => x.fatto === 0), true);
  assert.equal(P.buoni(fedele, '2026-12-31')[0].stato, 'da usare');
  assert.equal(P.buoni(fedele, '2027-01-01')[0].stato, 'scaduto');
});

test('400 punti nel mese = 2 buoni; iscrizione 20; amica 30 a chi invita e 20 all’amica', () => {
  const grande = { iscrittoIl: '2026-11-01', amiche: [{ data: '2026-11-03', ruolo: 'invita' }],
    spese: [{ id: 'g', data: '2026-11-02', righe: [N('spesa grande', 35000)] }] };
  const m = P.mese(grande, '2026-11-10');
  assert.equal(m.totale, 20 + 350 + 30);
  assert.equal(m.buoniGuadagnati, 2);
  assert.equal(m.nelBarattolo, 0);
  assert.equal(P.buoni(grande, '2026-11-10').length, 2);
  const invitata = { iscrittoIl: '2026-11-05', amiche: [{ data: '2026-11-05', ruolo: 'invitata' }], spese: [] };
  assert.equal(P.mese(invitata, '2026-11-05').totale, 40);
});

test('il buono si usa solo da 40 € in su; con il buono si tolgono 5 punti', () => {
  assert.equal(P.buonoUsabile(3999), false);
  assert.equal(P.buonoUsabile(4000), true);
  const r = P.puntiSpesa({ data: '2026-11-20', buonoUsato: 'x', righe: [N('spesa', 4000)] });
  assert.equal(r.lordi, 40);
  assert.equal(r.punti, 35);
});

/* ---------- i clienti di prova dell'app (prova.js) devono dare gli stessi numeri ---------- */
test('clienti di prova dell’app: famiglia 287, fedele 219, pane 164; spesa d’esempio 49', () => {
  const Prova = require('../prova.js');
  const per = id => Prova.SCENARI.find(s => s.id === id).cliente();
  assert.equal(P.mese(per('famiglia'), '2026-11-30').totale, 287);
  assert.equal(P.mese(per('famiglia'), '2026-11-18').totale, 201);
  assert.equal(P.buoni(per('famiglia'), '2026-11-18')[0].stato, 'da usare');
  assert.equal(P.mese(per('fedele'), '2026-11-25').avviso.mancano, 22);
  assert.equal(P.mese(per('fedele'), '2026-11-30').totale, 219);
  assert.equal(P.mese(per('pane'), '2026-11-30').totale, 164);
  assert.equal(P.puntiSpesa(Prova.spesaEsempio('2026-11-20')).punti, 49);
});
