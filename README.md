# La Spesa Sfusa per te

L'app dei clienti della bottega La Spesa Sfusa (Via Lazio 66, Montegranaro): tessera punti, barattolo, missioni e buono.
È una pagina web come Magazzino e Lavoro: si apre dal link e si aggiunge alla schermata del telefono.

## Versione 0.2.0 – passo 1: solo punti e premio, dati finti

- Iscrizione con 20 punti, codice di un'amica, «Ho già la tessera».
- Tessera con QR e codice a barre (Code 128), stampabile in formato carta di credito.
- Barattolo verso i 200 punti, avviso dal 25 del mese, buono da 5 € su una spesa di almeno 40 €.
- Missioni del mese: prodotto della settimana (+20), pane della settimana (+20), dolce del mese (+10); «Porta un'amica» (+30 a chi invita, +20 all'amica).
- **Versione di prova:** tutto resta sul telefono, niente arriva al negozio. Dalla barra blu in alto si caricano i tre clienti della scheda per Anita, si cambia il giorno e si aggiunge una spesa d'esempio.

Fuori da questa versione: collegamento a Firebase (passo 2), aggiunte al Magazzino (passo 3), notifiche (passo 4), vetrina «Salvali tu», notizie e acquisti in app.

## Le regole dei punti (approvate da Matteo il 17 e il 19/11/2026)

| Il cliente compra | Punti per euro |
| --- | --- |
| Qualsiasi prodotto | 1 |
| Fatto in bottega | 2 |
| «Salvali tu»: scade tra 30 e 11 giorni | 3 |
| Scade tra 10 giorni o meno | 4 |

Per ogni riga prezzo × punti per euro, somma, un solo arrotondamento per difetto. Nella spesa con il buono si tolgono 5 punti.
200 punti nel mese = buono da 5 €, valido fino alla fine del mese dopo. Il 1° del mese punti e missioni ripartono da zero.
Il calcolo sta tutto in `punti.js`, che dal passo 3 userà anche il Magazzino.

## File

| File | Cosa fa |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | l'app |
| `punti.js` | il calcolo dei punti, dei buoni e delle missioni |
| `codici.js` | codice della tessera, codice a barre e QR |
| `prova.js` | i clienti di prova |
| `qrcode.js` | libreria per il QR (qrcode-generator 1.5.2 di Kazuhiko Arase, licenza MIT) |
| `fonts/` | caratteri Zilla Slab, IBM Plex Sans e Mono, Caveat (licenza SIL OFL 1.1, testi nella cartella) |
| `sw.js`, `manifest.webmanifest`, `icons/` | app sulla schermata e funzionamento senza internet |
| `prove/punti.test.js` | prove automatiche del calcolo |

## Prove

Con Node.js 18 o più recente: `node --test prove/punti.test.js`.
Controllano l'esempio del riepilogo (49 punti) e i tre clienti della scheda per Anita (famiglia 287 punti con buono il 18, cliente fedele 219 con l'avviso «ti mancano 22 punti», cliente del pane 164 senza buono).

## Pubblicazione

GitHub Pages dal ramo `main`, cartella principale. A ogni nuova versione cambiano `VERSIONE` in `app.js` e `CACHE` in `sw.js`.
