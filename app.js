/* La Spesa Sfusa per te – app dei clienti, versione 0.3.0 (passo 2: collegata a Firebase, solo punti e premio).
   La tessera vera sta su Firebase in clienti/{codice}: il cliente la crea all'iscrizione e la legge; le spese le scrive il Magazzino.
   I clienti di prova (dati finti) restano nel pannello di prova e non toccano Firebase. */
'use strict';
const VERSIONE = '0.3.0';
const R = Punti.REGOLE;
const CHIAVE = 'lss-per-te';
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Firebase (dati pubblici del progetto: a proteggere le schede sono le regole di Firestore) ---------- */
const FB = Object.assign({ apiKey: 'AIzaSyBj_vigsG7m3jQg3MaRSBTwoKkXcPB3HKk', projectId: 'magazzino-spesa-sfusa-69c90', firestoreUrl: 'https://firestore.googleapis.com/v1' },
  (() => { try { return JSON.parse(localStorage.getItem('lss-per-te-firebase')) || {}; } catch (e) { return {}; } })());   // solo per le prove con un Firestore finto
const percorsoFs = p => `${FB.firestoreUrl}/projects/${FB.projectId}/databases/(default)/documents${p}${p.includes('?') ? '&' : '?'}key=${encodeURIComponent(FB.apiKey)}`;
async function chiamaFs(p, { method = 'GET', body = null } = {}) {
  const r = await fetch(percorsoFs(p), { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 404 && method === 'GET') return null;
  const j = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((j && j.error && j.error.message) || 'Errore ' + r.status); e.stato = r.status; throw e; }
  return j;
}
const fsVal = v => v === null || v === undefined ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
  : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(fsVal) } } : { mapValue: { fields: fsObj(v) } };
const fsObj = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, fsVal(v)]));
const daFsVal = x => !x ? null : 'nullValue' in x ? null : 'booleanValue' in x ? x.booleanValue : 'integerValue' in x ? Number(x.integerValue) : 'doubleValue' in x ? x.doubleValue
  : 'stringValue' in x ? x.stringValue : 'timestampValue' in x ? x.timestampValue : 'arrayValue' in x ? (x.arrayValue.values || []).map(daFsVal) : 'mapValue' in x ? daFsObj(x.mapValue.fields) : null;
const daFsObj = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, daFsVal(v)]));
/* la scheda di una tessera, con le sue spese; null se la tessera non c'è */
async function leggiScheda(codice) {
  const d = await chiamaFs('/clienti/' + codice);
  if (!d) return null;
  const lista = ((await chiamaFs('/clienti/' + codice + '/spese?pageSize=300')) || {}).documents || [];
  const s = daFsObj(d.fields);
  return { codice, codiceAmica: s.codiceAmica || null, iscrittoIl: s.iscrittoIl || null, invitatoDa: s.invitatoDa || null, amiche: s.amiche || [],
    spese: lista.map(x => daFsObj(x.fields)).filter(x => x && x.data && Array.isArray(x.righe)) };
}

/* ---------- dati sul telefono ----------
   mio: la tessera di questo telefono (con l'ultima copia della scheda letta da Firebase)
   scenario: un cliente di prova, con dati finti, che non tocca Firebase */
let stato = carica();
function carica() {
  try { const s = JSON.parse(localStorage.getItem(CHIAVE)); if (s && s.versione === 2) return s; } catch (e) { /* niente */ }
  return { versione: 2, mio: null, scenario: null, scenarioDati: null, oggiProva: null };
}
const clienteAttivo = () => stato.scenario ? stato.scenarioDati : stato.mio;
function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); } catch (e) { /* senza memoria si lavora lo stesso */ } }
const oggiVero = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const oggi = () => stato.oggiProva || oggiVero();

/* ---------- formati ---------- */
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const nomeMese = d => MESI[Number(d.slice(5, 7)) - 1];
const dataLunga = d => `${Number(d.slice(8, 10))} ${nomeMese(d)}`;
const dataBreve = d => `${Number(d.slice(8, 10))} ${nomeMese(d).slice(0, 3)}`;
const euro = c => (c / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const punti = n => n === 1 ? '1 punto' : `${n} punti`;

/* ---------- icone (tratto, come nella grafica) ---------- */
const IC = {
  barattolo: '<rect x="7" y="2.5" width="10" height="3.5" rx="1"/><path d="M8 6v1.5h8V6"/><path d="M6.5 8.5h11a1 1 0 0 1 1 1V19a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3V9.5a1 1 0 0 1 1-1z"/><path d="M8.5 16.5h7"/>',
  bandiera: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  tessera: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M6 9.5v5M8.5 9.5v5M10 9.5v5M13 9.5v5M15.5 9.5v5M17.5 9.5v5"/>',
  cesto: '<path d="M3 9.5h18l-1.8 10.2a1.5 1.5 0 0 1-1.5 1.3H6.3a1.5 1.5 0 0 1-1.5-1.3L3 9.5z"/><path d="M8 9.5 12 3l4 6.5"/><path d="M9 13.5v4M15 13.5v4"/>',
  pane: '<path d="M3.5 14c0-4.4 3.8-8 8.5-8s8.5 3.6 8.5 8v4.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V14z"/><path d="M8.5 9.5l1.5 3M12 8.5l1.5 3M15.5 9.5l1.5 3"/>',
  orologio: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4.5l3 2"/><path d="M9.5 2.5h5"/>',
  dolce: '<path d="M4 20h16"/><path d="M6 20v-6h12v6"/><path d="M6 14c0-2 2.7-3.5 6-3.5s6 1.5 6 3.5"/><path d="M12 10.5V7"/><path d="M12 7c-1-1-1-2.5 0-3.5 1 1 1 2.5 0 3.5z"/>',
  amici: '<circle cx="8.5" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.7-6.3 6-6.3s6 2.7 6 6.3"/><path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2"/><path d="M17.5 14c2.4.6 4 3 4 6"/>',
  freccia: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  stampa: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M6 14h12v7H6z"/>',
  telefono: '<rect x="6.5" y="2.5" width="11" height="19" rx="2"/><path d="M12 15v4M10 17h4"/>',
  condividi: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
  spunta: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  campana: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  buono: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6"/>'
};
const icona = (n, colore) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${colore || 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${colore ? ` style="stroke:${colore}"` : ''}>${IC[n]}</svg>`;

/* ---------- il barattolo: si riempie di legumi e semi, dal fondo in su ---------- */
const COLORI = ['#E8C27A', '#8F301B', '#6E8B3D', '#D9772B', '#3B2A22', '#C9A55B', '#B4502A', '#B5552A'];
const VASO = 'M34 74 Q34 58 50 58 H170 Q186 58 186 74 V244 Q186 280 150 280 H70 Q34 280 34 244 Z';
let nVasi = 0;
function vaso(frazione, { etichetta = null, sotto = null, festa = false } = {}) {
  let seme = 7; const rnd = () => { seme = (seme * 16807) % 2147483647; return (seme - 1) / 2147483646; };
  const id = 'v' + (++nVasi);
  const alto = 280 - Math.max(0, Math.min(1, frazione)) * 218; // da 280 (vuoto) a 62 (pieno)
  let fagioli = '';
  for (let riga = 0, y = 271; y > 56; riga++, y -= 10.6) {
    for (let x = 36 + (riga % 2) * 8; x < 190; x += 16.5) {
      const cx = x + rnd() * 3, cy = y + (rnd() - 0.5) * 4, rx = 7.6 + rnd() * 2, ry = 5 + rnd() * 1.3, rot = Math.round(rnd() * 140 - 70), col = COLORI[Math.floor(rnd() * COLORI.length)];
      if (cy < alto) continue;
      fagioli += `<ellipse class="fagiolo" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${col}" stroke="#2A140C" stroke-opacity="0.2" stroke-width="1.1"/>`;
    }
  }
  let scoppio = '';
  if (festa) {
    const sopra = [[24, 18, 30, '#D9772B'], [198, 6, -40, '#6E8B3D'], [112, -30, 15, '#B4502A'], [40, -22, 60, '#E8C27A'], [182, -34, -20, '#3B2A22'], [150, -12, 70, '#B5552A'], [74, -8, -55, '#C9A55B']];
    scoppio = sopra.map(([x, y, r, c]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" transform="rotate(${r} ${x} ${y})" fill="${c}" stroke="#2A140C" stroke-opacity="0.25" stroke-width="1"/>`).join('') +
      '<g stroke="#2F241E" stroke-width="3" stroke-linecap="round"><line x1="12" y1="-4" x2="2" y2="-14"/><line x1="208" y1="30" x2="218" y2="22"/><line x1="100" y1="-40" x2="98" y2="-46"/><line x1="126" y1="-40" x2="130" y2="-46"/><line x1="60" y1="-36" x2="54" y2="-42"/></g>';
  }
  const cartellino = etichetta ? `<rect x="64" y="148" width="92" height="66" rx="6" fill="#FFFDF6" stroke="#2F241E" stroke-width="2.5"/><text x="110" y="${sotto ? 186 : 192}" text-anchor="middle" font-family="Zilla Slab, Georgia, serif" font-weight="700" font-size="${String(etichetta).length > 2 ? 30 : 34}" fill="#2F241E">${esc(etichetta)}</text>${sotto ? `<text x="110" y="204" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="10.5" letter-spacing="1" fill="#2F241E">${esc(sotto)}</text>` : ''}` : '';
  return `<svg viewBox="0 ${festa ? -46 : 0} 220 ${festa ? 330 : 284}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${VASO}"/></clipPath></defs>${scoppio}<path d="${VASO}" fill="#FFFFFF" fill-opacity="0.45"/><g clip-path="url(#${id})">${fagioli}</g><path d="M54 92 Q48 160 54 232" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/><path d="${VASO}" fill="none" stroke="#2F241E" stroke-width="3.4" stroke-linejoin="round"/><rect x="56" y="42" width="108" height="18" rx="4" fill="#F3E7CF" stroke="#2F241E" stroke-width="2.4"/><rect x="46" y="14" width="128" height="32" rx="8" fill="#B4502A" stroke="#2F241E" stroke-width="2.4"/><path d="M58 24 H162" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"/>${cartellino}</svg>`;
}

/* ---------- parti comuni ---------- */
function testata(m) {
  return `<div class="testata"><div class="marchio"><b>La Spesa Sfusa</b><i>per te</i></div>
  <div class="destra"><span class="chip-punti">${punti(m.nelBarattolo)}</span>
  <a class="tondo" href="#tessera" aria-label="Mostra la tessera">${icona('tessera')}</a></div></div>`;
}
const situazione = () => {
  const c = clienteAttivo(), o = oggi();
  return { c, o, m: Punti.mese(c, o), b: Punti.buoni(c, o) };
};
function avvisino(testo) {
  const el = $('#avvisino'); el.textContent = testo; el.hidden = false;
  clearTimeout(avvisino.t); avvisino.t = setTimeout(() => { el.hidden = true; }, 3200);
}
const fraseBarattolo = n => n >= 180 ? 'ci sei quasi!' : n >= 100 ? 'oltre metà strada!' : n >= 40 ? 'si riempie!' : 'si comincia!';

/* ---------- schermate ---------- */
const VISTE = {
  benvenuto() {
    return `<main class="centro" tabindex="-1">
      <div class="indirizzo">VIA LAZIO 66 · MONTEGRANARO</div>
      <h1 class="grande-marchio"><b>La Spesa Sfusa</b><i>per te</i></h1>
      <div class="vetrinetta">${vaso(0.08, { etichetta: R.iscrizione, sotto: 'IN REGALO' })}<span class="mano" aria-hidden="true">${R.iscrizione} punti<br>li regaliamo noi!</span></div>
      <p class="intro">Ogni spesa riempie il tuo barattolo di punti. A <strong>${R.sogliaBuono} punti nel mese</strong> ti regaliamo <strong>un buono da 5 €</strong> per la spesa.</p>
      <div class="azioni">
        <button class="pulsante" data-az="iscriviti">Prendi il barattolo ${icona('freccia')}</button>
        <a class="pulsante secondario" href="#amica">Ho il codice di un’amica</a>
        <a class="pulsante leggero" href="#recupero">Ho già la tessera</a>
        <div class="nota">Niente nome, niente telefono: solo un codice tuo.</div>
      </div></main>`;
  },

  amica() {
    return `<main tabindex="-1">
      <div class="testata"><div class="marchio"><b>La Spesa Sfusa</b><i>per te</i></div><a class="tondo chiaro" href="#benvenuto" aria-label="Torna indietro">×</a></div>
      <h1 class="titolo">Il codice di un’amica</h1>
      <div class="sotto">Con il suo codice, alla tua prima spesa ricevi ${R.amicaInvitata} punti in più, oltre ai ${R.iscrizione} di benvenuto, e lei ne riceve ${R.amicaChiInvita}.</div>
      <form data-form="amica" class="carta pannello" novalidate>
        <label class="campo">Codice dell’amica<input name="codice" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="AMI…" required></label>
        <div class="errore" role="alert" hidden></div>
        <button class="pulsante" type="submit">Prendi il barattolo ${icona('freccia')}</button>
      </form></main>`;
  },

  recupero() {
    const scan = 'BarcodeDetector' in window;
    return `<main tabindex="-1">
      <div class="testata"><div class="marchio"><b>La Spesa Sfusa</b><i>per te</i></div><a class="tondo chiaro" href="${clienteAttivo() ? '#per-te' : '#benvenuto'}" aria-label="Torna indietro">×</a></div>
      <h1 class="titolo">Ho già la tessera</h1>
      <div class="sotto">Scrivi il codice sotto il codice a barre della tua tessera stampata: ritrovi i tuoi punti anche su un telefono nuovo.</div>
      <form data-form="recupero" class="carta pannello" novalidate>
        <label class="campo">Codice della tessera<input name="codice" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="LSS XXXX XXXX" required></label>
        <div class="errore" role="alert" hidden></div>
        <button class="pulsante" type="submit">Ritrova i miei punti</button>
        ${scan ? `<button class="pulsante secondario" type="button" data-az="scansiona">${icona('tessera', '#2F241E')} Inquadra la tessera</button>` : ''}
      </form>
      <div class="nota">Funzionano anche le tessere dei clienti di prova (per esempio LSS FAM2 9QX4), con dati finti.</div>
      </main>`;
  },

  'per-te'() {
    const { m, b } = situazione();
    const daUsare = b.filter(x => x.stato === 'da usare');
    const tacche = Array.from({ length: 20 }, (_, i) => `<span class="${m.nelBarattolo >= (i + 1) * 10 ? 'piena' : ''}"></span>`).join('');
    const fatte = m.missioni.filter(x => x.completa).length;
    const restano = m.missioni.filter(x => !x.completa).reduce((s, x) => s + x.punti, 0);
    const movimenti = [...m.movimenti].reverse().map(mv => `<div class="mov"><span class="q">${dataBreve(mv.data)}</span><span class="d">${esc(mv.titolo)}${mv.tipo === 'spesa' ? `<small>${euro(mv.totaleCent)}${mv.dettaglio.tolti ? ` · −${mv.dettaglio.tolti} punti per il buono` : ''}</small><div class="dettaglio-spesa">${mv.dettaglio.righe.map(r => `<div><span>${esc(r.nome)}</span><span>${euro(r.importoCent)} × ${r.puntiPerEuro}</span></div>`).join('')}</div>` : ''}</span><span class="p">+${mv.punti}</span></div>`).join('');
    return `<main tabindex="-1">${testata(m)}
      ${stato.scenario ? `<a class="avviso" href="#prova" style="text-decoration:none;color:inherit"><div><b>Cliente di prova</b><p>Dati finti${stato.mio ? ': tocca qui per tornare alla tua tessera' : ''}.</p></div></a>` : ''}
      ${daUsare.length ? `<a class="buono-pronto" href="#buono"><span class="riquadro" style="background:var(--cotto)">${icona('buono')}</span><span style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="etichetta" style="color:var(--cotto)">${daUsare.length > 1 ? `Hai ${daUsare.length} buoni` : 'Hai un buono'}</span><span class="grande">5 € di sconto sulla spesa</span><span class="piccolo">Da ${euro(R.spesaMinimaBuonoCent).replace(',00', '')} in su · entro il ${dataLunga(daUsare[0].scade)}</span></span>${icona('freccia', '#B4502A')}</a>` : ''}
      ${m.avviso && m.mancano > 0 ? `<div class="avviso" role="status"><span class="riquadro" style="background:var(--ambra)">${icona('campana')}</span><div><b>Ti mancano ${punti(m.mancano)}</b><p>Hai tempo fino al ${dataLunga(m.fineMese)}: il 1° del mese il barattolo riparte da zero.</p></div></div>` : ''}
      <section class="carta barattolo" aria-label="Il tuo barattolo">
        <div class="vaso">${vaso(m.nelBarattolo / R.sogliaBuono)}</div>
        <div class="dati"><div class="etichetta">Il tuo barattolo</div>
          <div class="numero"><b>${m.nelBarattolo}</b><span>/${R.sogliaBuono}</span></div>
          <div style="font-size:14px;line-height:1.35">Ancora <strong>${punti(m.mancano)}</strong> al buono</div>
          <div class="tacche" role="img" aria-label="${m.nelBarattolo} punti su ${R.sogliaBuono}">${tacche}</div>
          <div class="mano" aria-hidden="true">${fraseBarattolo(m.nelBarattolo)}</div></div>
      </section>
      <div class="carta riga-icona"><span class="riquadro" style="background:var(--cotto)">${icona('buono')}</span><span style="display:flex;flex-direction:column;gap:1px"><span class="etichetta" style="color:var(--cotto)">Il premio</span><span class="premio-titolo">Un buono da 5 € ogni ${R.sogliaBuono} punti</span><span class="nota">Su una spesa di almeno 40 €. Il 1° del mese i punti ripartono da zero.</span></span></div>
      <section class="carta come" aria-label="Come guadagni punti"><div class="etichetta" style="padding-bottom:2px">Punti per ogni euro</div>
        <div class="voce"><span class="ic" style="background:#2F241E14">${icona('cesto', '#2F241E')}</span><span class="testo">Tutti i prodotti<small>Pasta, formaggi, sfuso e il resto della spesa</small></span><span class="val">1</span></div>
        <div class="voce"><span class="ic" style="background:#B4502A14">${icona('pane', '#B4502A')}</span><span class="testo">Fatto in bottega<small>Pane, dolci e piatti fatti da noi</small></span><span class="val" style="color:var(--cotto)">2</span></div>
        <div class="voce"><span class="ic" style="background:#25563314">${icona('barattolo', '#255633')}</span><span class="testo">«Salvali tu»<small>Scade tra 30 e 11 giorni</small></span><span class="val" style="color:var(--verde)">3</span></div>
        <div class="voce"><span class="ic" style="background:#8A5A0014">${icona('orologio', '#8A5A00')}</span><span class="testo">Scade tra 10 giorni o meno<small>Negli ultimi 5 giorni c’è anche lo sconto al banco</small></span><span class="val" style="color:var(--ocra)">4</span></div>
        <div class="nota" style="padding:6px 0 8px">Ogni prodotto conta una volta sola, con il suo valore. Il totale si arrotonda per difetto.</div>
      </section>
      <a class="vai-missioni" href="#missioni"><span class="t"><b>Missioni di ${nomeMese(m.oggi)}</b><span>${fatte === 1 ? '1 fatta' : `${fatte} fatte`} · ${m.missioni.length - fatte} in corso${restano ? ` · fino a ${restano} punti in più` : ''}</span></span>${icona('freccia')}</a>
      <details class="carta movimenti"><summary>I tuoi punti di ${nomeMese(m.oggi)}</summary>${movimenti || '<div class="mov"><span class="d">Ancora niente questo mese.</span></div>'}</details>
      <div class="nota">Danno punti solo le spese al banco con la tessera, su quanto paghi davvero: nella spesa con il buono si tolgono 5 punti.</div>
      ${statoLettura()}
    </main>`;
  },

  missioni() {
    const { c, m } = situazione();
    const fatte = m.missioni.filter(x => x.completa).length;
    const restano = m.missioni.filter(x => !x.completa).reduce((s, x) => s + x.punti, 0);
    const stile = { settimana: ['bandiera', '#255633'], pane: ['pane', '#8A5A00'], dolce: ['dolce', '#B4502A'] };
    const unita = { settimana: 'settimane', pane: 'giorni', dolce: '' };
    const quasi = { settimana: 'manca una settimana!', pane: 'manca un giorno!' };
    const carte = m.missioni.map(mi => {
      const [ic, col] = stile[mi.id];
      const perc = Math.round(mi.fatto / mi.serve * 100);
      return `<div class="carta missione${mi.completa ? ' fatta' : ''}">
        <span class="ic" style="background:${mi.completa ? '#255633' : col + '17'}">${mi.completa ? icona('spunta', '#FFFFFF') : icona(ic, col)}</span>
        <div class="corpo"><div class="top"><span class="nome">${esc(mi.titolo)}</span><span class="valore">+${mi.punti}</span></div>
        <div class="desc">${esc(mi.testo)}</div>
        <div class="avanz"${!mi.completa && quasi[mi.id] && mi.serve - mi.fatto === 1 ? ' style="padding-right:130px"' : ''}><span class="bar"><span style="width:${perc}%;background:${mi.completa ? '#255633' : col}"></span></span><span class="conta">${mi.completa ? 'Fatta' : `${mi.fatto} di ${mi.serve}${unita[mi.id] ? ' ' + unita[mi.id] : ''}`}</span></div></div>
        ${!mi.completa && quasi[mi.id] && mi.serve - mi.fatto === 1 ? `<span class="mano" aria-hidden="true">${quasi[mi.id]}</span>` : ''}</div>`;
    }).join('');
    return `<main tabindex="-1">${testata(m)}
      <div><h1 class="titolo">Missioni di ${nomeMese(m.oggi)}</h1><div class="sotto">Ognuna vale una volta. Finiscono il ${dataLunga(m.fineMese)}.</div></div>
      <div class="chips"><span style="background:#2556331F;color:var(--verde)">${fatte === 1 ? '1 fatta' : `${fatte} fatte`}</span><span style="background:#2F241E12">${m.missioni.length - fatte} in corso</span>${restano ? `<span style="background:#E9A93A33;color:var(--ambra-testo)">fino a +${restano} punti</span>` : ''}</div>
      ${carte}
      <div class="carta missione"><span class="ic" style="background:#1F5C6617">${icona('amici', '#1F5C66')}</span>
        <div class="corpo"><div class="top"><span class="nome">Porta un’amica</span><span class="valore">+${R.amicaChiInvita}</span></div>
        <div class="desc">Si iscrive con il tuo codice e fa la spesa: ${R.amicaChiInvita} punti a te e ${R.amicaInvitata} a lei.</div>
        <div class="desc">Il tuo codice amica: <span class="codice-amica">${esc(c.codiceAmica)}</span></div>
        <button class="condividi" data-az="condividi">${icona('condividi')} Condividi il tuo codice</button></div></div>
      <div class="nota">Il prodotto della settimana può essere in scadenza o no: lo trovi in bottega. Il codice amica è diverso da quello della tessera, così nessuno può aprire i tuoi punti.</div>
    </main>`;
  },

  tessera() {
    const { c, m } = situazione();
    return `<main tabindex="-1">${testata(m).replace(/<a class="tondo"[^]*?<\/a>/, '')}
      <div><h1 class="titolo">La tua tessera</h1><div class="sotto">Falla vedere in cassa, prima di pagare.</div></div>
      <section class="carta tessera" aria-label="Tessera punti">
        <div class="alto"><div class="marchio"><b>La Spesa Sfusa</b><i>per te</i></div><div class="etichetta" style="font-size:10.5px;letter-spacing:.14em">Tessera punti</div></div>
        <div class="qr">${Codici.svgQR(c.codice)}</div>
        <div class="barre">${Codici.svg128(c.codice)}</div>
        <div class="codice">${esc(Codici.leggibile(c.codice))}</div>
        ${stato.scenario ? '<div class="nota" style="font-size:11px">tessera di prova</div>' : ''}
      </section>
      <div class="due"><button class="pulsante secondario" data-az="stampa">${icona('stampa')} Stampala</button><button class="pulsante secondario" data-az="schermata">${icona('telefono')} Sulla schermata</button></div>
      <div class="nota" style="text-align:center">Se cambi telefono, con la tessera stampata non perdi i punti: in «Ho già la tessera» scrivi il codice.</div>
    </main>`;
  },

  buono() {
    const { m, b } = situazione();
    const daUsare = b.filter(x => x.stato === 'da usare');
    const altri = b.filter(x => x.stato !== 'da usare').reverse();
    const storico = altri.length ? `<details class="carta movimenti" style="width:100%;text-align:left"><summary>Buoni usati e scaduti</summary>${altri.map(x => `<div class="mov"><span class="q">${dataBreve(x.guadagnatoIl)}</span><span class="d">Buono da 5 €<small>${x.stato === 'usato' ? `usato il ${dataLunga(x.usatoIl)}` : `scaduto il ${dataLunga(x.scade)}`}</small></span></div>`).join('')}</details>` : '';
    if (!daUsare.length) {
      return `<main tabindex="-1">${testata(m)}
        <div><h1 class="titolo">I tuoi buoni</h1><div class="sotto">Nessun buono da usare adesso. Ti mancano ${punti(m.mancano)} al prossimo.</div></div>
        <a class="pulsante" href="#per-te">Guarda il barattolo</a>${storico}</main>`;
    }
    const appena = daUsare.some(x => x.guadagnatoIl === m.oggi);
    return `<main class="centro festa" tabindex="-1">
      <span class="bollino">${appena ? `${R.sogliaBuono} SU ${R.sogliaBuono}` : (daUsare.length > 1 ? `${daUsare.length} BUONI DA USARE` : 'UN BUONO DA USARE')}</span>
      <h1 class="titolo" style="font-size:38px">Il barattolo è pieno!</h1>
      <div style="width:180px">${vaso(1, { etichetta: R.sogliaBuono, sotto: 'PIENO!', festa: true })}</div>
      ${daUsare.map((x, i) => `<div class="buono"><span class="riquadro" style="background:var(--cotto);width:50px;height:50px;border-radius:14px">${icona('buono')}</span>
        <span style="display:flex;flex-direction:column;gap:2px"><span class="etichetta" style="color:var(--cotto);font-size:11px">Il tuo buono</span>
        <span class="premio-titolo" style="font-size:19px">5 € di sconto sulla spesa</span>
        <span class="nota">Su una spesa di almeno 40 € · entro il ${dataLunga(x.scade)}</span></span>
        ${i === 0 ? '<span class="mano" aria-hidden="true">te lo sei meritato!</span>' : ''}</div>`).join('')}
      <a class="pulsante" href="#tessera" style="margin-top:auto">Mostra la tessera in cassa</a>
      <div class="nota">In cassa vedono il buono dalla tessera. Uno per spesa, niente resto.</div>
      ${storico}
    </main>`;
  },

  prova() {
    const sc = Prova.SCENARI.map(s => `<button class="scenario" data-scenario="${s.id}" aria-pressed="${stato.scenario === s.id}"><b>${esc(s.nome)} · ${dataLunga(s.oggi)}</b><span>${esc(s.descrizione)}</span></button>`).join('');
    return `<main tabindex="-1">
      <div class="testata"><div class="marchio"><b>La Spesa Sfusa</b><i>per te</i></div>${clienteAttivo() ? '<a class="tondo chiaro" href="#per-te" aria-label="Chiudi">×</a>' : ''}</div>
      <div><h1 class="titolo">Prova dell’app</h1><div class="sotto">Versione ${VERSIONE}. La tessera di questo telefono è vera: i punti li scrive il Magazzino quando al Banco si scansiona la tessera. I clienti di prova hanno dati finti e restano su questo telefono.</div></div>
      <section class="carta pannello"><h2>La tessera di questo telefono</h2>
        ${stato.mio ? `<button class="scenario" data-az="mia" aria-pressed="${!stato.scenario}"><b>${esc(Codici.leggibile(stato.mio.codice))}</b><span>${stato.mio.inviata ? 'Su Firebase' : 'Non ancora su Firebase: parte appena c’è internet'}${stato.mio.aggiornato ? ' · letta alle ' + oraBreve(stato.mio.aggiornato) : ''}</span></button>` : '<div class="nota">Nessuna: si crea dal benvenuto con «Prendi il barattolo».</div>'}
        <button class="scenario" data-az="nuovo"><b>Cliente nuovo</b><span>Si riparte dal benvenuto, con una tessera nuova</span></button></section>
      <section class="carta pannello"><h2>Clienti di prova (dati finti)</h2>${sc}</section>
      <section class="carta pannello"><h2>Giorno</h2>
        <label class="data">Oggi, per la prova<input type="date" data-campo="oggi" value="${oggi()}"></label>
        <button class="pulsante secondario" data-az="oggi-vero">Torna alla data di oggi</button>
        <div class="nota">Dal 25 compare l’avviso «ti mancano…». Il 1° del mese punti e missioni ripartono da zero.</div></section>
      <section class="carta pannello"><h2>Spesa di prova</h2>
        <button class="pulsante secondario" data-az="spesa" ${stato.scenario ? '' : 'disabled'}>Aggiungi una spesa (pasta, yogurt «Salvali tu», pane)</button>
        <div class="nota">Solo per i clienti di prova: è l’esempio del riepilogo, 21,70 € di spesa, 49 punti. Sulla tessera vera le spese le scrive il Magazzino.</div></section>
      <button class="pulsante leggero" data-az="cancella">Cancella tutto e ricomincia</button>
    </main>`;
  }
};

/* ---------- navigazione ---------- */
const CON_CLIENTE = ['per-te', 'missioni', 'tessera', 'buono'];
function vista() {
  const c = clienteAttivo();
  let v = location.hash.slice(1) || (c ? 'per-te' : 'benvenuto');
  if (!VISTE[v]) v = c ? 'per-te' : 'benvenuto';
  if (CON_CLIENTE.includes(v) && !c) v = 'benvenuto';
  if (v === 'benvenuto' && c) v = 'per-te';
  return v;
}
function disegna(cambioPagina = true) {
  const v = vista();
  $('#vista').innerHTML = VISTE[v]();
  const tab = { 'per-te': 'per-te', buono: 'per-te', missioni: 'missioni', tessera: 'tessera' }[v];
  $('#tabbar').hidden = !clienteAttivo() || !tab;
  document.querySelectorAll('#tabbar a').forEach(a => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.title = { benvenuto: 'Benvenuto', amica: 'Codice di un’amica', recupero: 'Ho già la tessera', 'per-te': 'Il tuo barattolo', missioni: 'Missioni', tessera: 'La tua tessera', buono: 'I tuoi buoni', prova: 'Prova' }[v] + ' – La Spesa Sfusa per te';
  const ca = clienteAttivo();
  if (ca) {
    $('#stampa').innerHTML = [0, 1].map(() => `<div class="tessera-stampa"><div class="qr">${Codici.svgQR(ca.codice, { lato: 3 })}</div><div class="dx"><div class="marchio"><b>La Spesa Sfusa</b><i>per te</i></div><div class="barre">${Codici.svg128(ca.codice)}</div><div class="codice">${esc(Codici.leggibile(ca.codice))}</div><small>Falla vedere in cassa, prima di pagare. Via Lazio 66, Montegranaro</small></div></div>`).join('');
  }
  if (cambioPagina) { window.scrollTo(0, 0); const main = $('#vista main'); if (main) main.focus({ preventScroll: true }); }
}
window.addEventListener('hashchange', () => disegna());

/* ---------- azioni ---------- */
function nuovoCliente(amica) {
  stato.mio = { codice: Codici.nuovoCodice(), codiceAmica: Codici.nuovoCodiceAmica(), iscrittoIl: oggiVero(), invitatoDa: amica || null, amiche: [], spese: [], inviata: false, aggiornato: null };
  stato.scenario = null; stato.scenarioDati = null; stato.oggiProva = null; salva();
  location.hash = '#per-te'; disegna();
  avvisino(`Ti diamo il benvenuto: ${R.iscrizione} punti nel barattolo`);
  aggiorna();
}
function caricaScenario(id) {
  const s = Prova.SCENARI.find(x => x.id === id);
  stato.scenarioDati = s.cliente(); stato.scenario = id; stato.oggiProva = s.oggi; salva();
}
/* l'iscrizione su Firebase: una volta sola, senza punti (i punti li scrive solo il Magazzino) */
async function inviaIscrizione() {
  const m = stato.mio;
  try {
    await chiamaFs('/clienti?documentId=' + m.codice, { method: 'POST', body: { fields: fsObj({ iscrittoIl: m.iscrittoIl, codiceAmica: m.codiceAmica, invitatoDa: m.invitatoDa || null }) } });
  } catch (e) { if (e.stato !== 409) throw e; }   // 409: c'è già (per esempio creata dal negozio)
  if (stato.mio && stato.mio.codice === m.codice) { stato.mio.inviata = true; salva(); }
}
/* rilegge la scheda: all'avvio, quando l'app torna davanti e ogni minuto */
let aggiornando = false;
async function aggiorna() {
  if (aggiornando || !stato.mio) return;
  aggiornando = true;
  try {
    if (!stato.mio.inviata) await inviaIscrizione();
    const s = await leggiScheda(stato.mio.codice);
    if (s && stato.mio && stato.mio.codice === s.codice) {
      Object.assign(stato.mio, { codiceAmica: s.codiceAmica || stato.mio.codiceAmica, iscrittoIl: s.iscrittoIl || stato.mio.iscrittoIl, invitatoDa: s.invitatoDa, amiche: s.amiche, spese: s.spese, aggiornato: Date.now(), errore: null });
      salva();
      if (!stato.scenario && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) disegna(false);
    }
  } catch (e) { if (stato.mio) { stato.mio.errore = Date.now(); salva(); } }
  finally { aggiornando = false; }
}
const oraBreve = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function statoLettura() {
  if (stato.scenario || !stato.mio) return '';
  const m = stato.mio;
  const t = !m.inviata ? 'Tessera non ancora arrivata al negozio: parte appena c’è internet.' : m.aggiornato ? `Punti aggiornati alle ${oraBreve(m.aggiornato)}.` : 'Leggo i tuoi punti…';
  return `<div class="nota">${t}${m.errore && m.aggiornato ? ' Senza internet: sono gli ultimi letti.' : ''} <button class="pulsante leggero" style="display:inline;width:auto;min-height:44px;padding:0 4px" data-az="aggiorna">Aggiorna</button></div>`;
}
async function trovaTessera(testo) {
  const cod = Codici.pulisci(testo);
  if (!Codici.valido(cod)) return { errore: 'Il codice ha questa forma: LSS e 8 tra lettere e numeri.' };
  const s = Prova.SCENARI.find(x => x.cliente().codice === cod);
  if (s) { caricaScenario(s.id); return { ok: true }; }
  if (stato.mio && stato.mio.codice === cod) { stato.scenario = null; salva(); aggiorna(); return { ok: true }; }
  let sch;
  try { sch = await leggiScheda(cod); } catch (e) { return { errore: 'Serve internet per ritrovare la tessera.' }; }
  if (!sch) return { errore: 'Non trovo questa tessera. Controlla il codice.' };
  stato.mio = { ...sch, inviata: true, aggiornato: Date.now() }; stato.scenario = null; stato.scenarioDati = null; stato.oggiProva = null; salva();
  return { ok: true };
}

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-az],[data-scenario]');
  if (!el) return;
  const az = el.dataset.az;
  if (el.dataset.scenario) { caricaScenario(el.dataset.scenario); location.hash = '#per-te'; disegna(); avvisino('Cliente di prova caricato'); return; }
  if (az === 'iscriviti') nuovoCliente(null);
  else if (az === 'mia') { stato.scenario = null; stato.scenarioDati = null; stato.oggiProva = null; salva(); location.hash = '#per-te'; disegna(); aggiorna(); }
  else if (az === 'aggiorna') { aggiorna().then(() => avvisino(stato.mio && !stato.mio.errore ? 'Punti aggiornati' : 'Senza internet: riprova più tardi')); }
  else if (az === 'nuovo') {
    if (stato.mio && !confirm(`La tessera ${Codici.leggibile(stato.mio.codice)} resta al negozio: per riaprirla serve il suo codice («Ho già la tessera»). Continuo con una tessera nuova?`)) return;
    stato.mio = null; stato.scenario = null; stato.scenarioDati = null; stato.oggiProva = null; salva(); location.hash = '#benvenuto'; disegna();
  }
  else if (az === 'oggi-vero') { stato.oggiProva = null; salva(); disegna(false); avvisino('Data di oggi'); }
  else if (az === 'spesa') { if (!stato.scenario) return; stato.scenarioDati.spese.push(Prova.spesaEsempio(oggi())); salva(); location.hash = '#per-te'; disegna(); avvisino('+49 punti dalla spesa di prova'); }
  else if (az === 'cancella') { if (confirm('Cancellare i dati di prova su questo telefono?')) { try { localStorage.removeItem(CHIAVE); } catch (x) { /* niente */ } stato = carica(); location.hash = '#benvenuto'; disegna(); } }
  else if (az === 'stampa') window.print();
  else if (az === 'schermata') schermata();
  else if (az === 'condividi') {
    const testo = `Ti invito a La Spesa Sfusa per te: con il mio codice ${clienteAttivo().codiceAmica} alla tua prima spesa ricevi ${R.amicaInvitata} punti in più. ${location.origin + location.pathname}`;
    try { if (navigator.share) await navigator.share({ title: 'La Spesa Sfusa per te', text: testo }); else { await navigator.clipboard.writeText(testo); avvisino('Messaggio copiato: incollalo dove vuoi'); } }
    catch (x) { if (x && x.name !== 'AbortError') avvisino('Il tuo codice è ' + clienteAttivo().codiceAmica); }
  }
  else if (az === 'scansiona') scansiona();
});
document.addEventListener('change', e => {
  if (e.target.dataset.campo === 'oggi' && e.target.value) { stato.oggiProva = e.target.value; salva(); avvisino('Oggi, per la prova: ' + dataLunga(e.target.value)); }
});
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  const err = $('.errore', f); const val = f.codice.value;
  if (f.dataset.form === 'amica') {
    const cod = Codici.pulisci(val);
    if (!/^AMI[A-Z0-9]{5}$/.test(cod)) { err.textContent = 'Il codice amica ha questa forma: AMI e 5 tra lettere e numeri.'; err.hidden = false; return; }
    nuovoCliente(cod);
  } else if (f.dataset.form === 'recupero') {
    const bt = f.querySelector('button[type=submit]'); bt.disabled = true;
    const r = await trovaTessera(val);
    bt.disabled = false;
    if (r.errore) { err.textContent = r.errore; err.hidden = false; return; }
    location.hash = '#per-te'; disegna(); avvisino('Ecco di nuovo i tuoi punti');
  }
});

/* ---------- «Sulla schermata»: l'app con la sua icona ---------- */
let invitoInstalla = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); invitoInstalla = e; });
async function schermata() {
  if (invitoInstalla) { invitoInstalla.prompt(); await invitoInstalla.userChoice.catch(() => null); invitoInstalla = null; return; }
  const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const d = $('#finestra');
  $('#finestraCorpo').innerHTML = `<h2>Sulla schermata</h2><p class="nota" style="font-size:14px">Così l’app si apre con un tocco, come le altre.</p>${iphone
    ? '<ol><li>Apri questa pagina con <strong>Safari</strong>.</li><li>Tocca il tasto <strong>Condividi</strong> (il quadrato con la freccia).</li><li>Scegli <strong>Aggiungi alla schermata Home</strong>.</li></ol><p class="nota">Poi apri l’app dall’icona e, se non vedi i tuoi punti, usa «Ho già la tessera» con il codice.</p>'
    : '<ol><li>Apri questa pagina con <strong>Chrome</strong>.</li><li>Tocca i <strong>tre puntini</strong> in alto a destra.</li><li>Scegli <strong>Aggiungi a schermata Home</strong> oppure <strong>Installa app</strong>.</li></ol>'}
    <button class="pulsante" data-chiudi>Ho capito</button>`;
  d.showModal();
}
document.addEventListener('click', e => { if (e.target.closest('[data-chiudi]')) e.target.closest('dialog').close(); });

/* ---------- inquadrare la tessera con la fotocamera (dove il telefono lo permette) ---------- */
async function scansiona() {
  const d = $('#finestra');
  $('#finestraCorpo').innerHTML = '<h2>Inquadra la tessera</h2><video playsinline muted style="width:100%;border-radius:12px;background:#000"></video><p class="nota">Tieni il codice a barre o il QR al centro.</p><button class="pulsante secondario" data-chiudi>Annulla</button>';
  d.showModal();
  let flusso;
  try {
    flusso = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const v = $('video', d); v.srcObject = flusso; await v.play();
    const rilevatore = new BarcodeDetector({ formats: ['qr_code', 'code_128'] });
    while (d.open) {
      const trovati = await rilevatore.detect(v).catch(() => []);
      const t = trovati.map(x => Codici.pulisci(x.rawValue)).find(Codici.valido);
      if (t) { d.close(); const r = await trovaTessera(t); if (r.errore) avvisino(r.errore); else { location.hash = '#per-te'; disegna(); avvisino('Ecco di nuovo i tuoi punti'); } break; }
      await new Promise(r => setTimeout(r, 250));
    }
  } catch (x) { avvisino('Non riesco ad aprire la fotocamera: scrivi il codice.'); if (d.open) d.close(); }
  finally { if (flusso) flusso.getTracks().forEach(t => t.stop()); }
}

/* ---------- avvio ---------- */
$('#versione').textContent = VERSIONE;
disegna(false);
aggiorna();
document.addEventListener('visibilitychange', () => { if (!document.hidden) aggiorna(); });
setInterval(() => { if (!document.hidden) aggiorna(); }, 60000);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => null);
}
