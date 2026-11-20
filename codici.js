/* Codici della tessera: codice a barre classico (Code 128, lo leggono tutti i lettori) e QR.
   Il QR usa la libreria qrcode-generator (licenza MIT, file qrcode.js). */
(function (radice, fabbrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabbrica();
  else radice.Codici = fabbrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* larghezze di barre e spazi dei 107 simboli del Code 128 (standard ISO/IEC 15417) */
  const C128 = ('212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 ' +
    '123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 ' +
    '111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 ' +
    '231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 ' +
    '141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 ' +
    '124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 ' +
    '311141 411131 211412 211214 211232 2331112').split(' ');

  /* testo (caratteri ASCII da 32 a 126) → elenco di moduli: 1 = barra, 0 = spazio */
  function moduli128(testo) {
    const valori = [104]; // partenza B
    for (const ch of testo) {
      const c = ch.charCodeAt(0);
      if (c < 32 || c > 126) throw new Error('Carattere non valido nel codice: ' + ch);
      valori.push(c - 32);
    }
    let somma = 104;
    for (let i = 1; i < valori.length; i++) somma += valori[i] * i;
    valori.push(somma % 103, 106);
    const out = [];
    for (const v of valori) {
      const w = C128[v];
      for (let i = 0; i < w.length; i++) for (let k = 0; k < +w[i]; k++) out.push(i % 2 === 0 ? 1 : 0);
    }
    return out;
  }

  function svg128(testo, { altezza = 56, modulo = 2, margine = 10, colore = '#1E120C', etichetta = 'Codice a barre della tessera' } = {}) {
    const m = moduli128(testo);
    const larghezza = (m.length + margine * 2) * modulo;
    let d = '', i = 0;
    while (i < m.length) {
      if (m[i] === 1) { let j = i; while (j < m.length && m[j] === 1) j++; d += `M${(i + margine) * modulo} 0h${(j - i) * modulo}v${altezza}h-${(j - i) * modulo}z`; i = j; } else i++;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${larghezza} ${altezza}" width="${larghezza}" height="${altezza}" role="img" aria-label="${etichetta}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#FFFFFF"/><path d="${d}" fill="${colore}"/></svg>`;
  }

  function svgQR(testo, { lato = 4, margine = 4, colore = '#1E120C', etichetta = 'Codice QR della tessera' } = {}) {
    const fabbricaQR = (typeof qrcode !== 'undefined') ? qrcode : (typeof require === 'function' ? require('./qrcode.js') : null);
    const q = fabbricaQR(0, 'M');
    q.addData(testo);
    q.make();
    const n = q.getModuleCount();
    const tot = (n + margine * 2) * lato;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${(c + margine) * lato} ${(r + margine) * lato}h${lato}v${lato}h-${lato}z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tot} ${tot}" width="${tot}" height="${tot}" role="img" aria-label="${etichetta}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#FFFFFF"/><path d="${d}" fill="${colore}"/></svg>`;
  }

  /* codice della tessera: LSS + 8 caratteri senza quelli che si confondono (0/O, 1/I) */
  const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function nuovoCodice(lunghezza = 8) {
    const a = new Uint32Array(lunghezza);
    (typeof crypto !== 'undefined' ? crypto : require('crypto').webcrypto).getRandomValues(a);
    return 'LSS' + [...a].map(x => ALFABETO[x % ALFABETO.length]).join('');
  }
  const leggibile = c => c.replace(/^LSS(.{4})(.{4})(.*)$/, (_, a, b, r) => `LSS ${a} ${b}${r ? ' ' + r : ''}`).trim();
  const pulisci = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const valido = s => /^LSS[A-Z0-9]{8}$/.test(pulisci(s));
  /* codice amica: diverso da quello della tessera, così chi lo riceve non può aprire la tua scheda */
  const nuovoCodiceAmica = () => 'AMI' + nuovoCodice(5).slice(3);

  return { moduli128, svg128, svgQR, nuovoCodice, nuovoCodiceAmica, leggibile, pulisci, valido };
});
