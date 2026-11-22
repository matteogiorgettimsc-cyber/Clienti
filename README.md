# La Spesa Sfusa per te

L'app dei clienti della bottega La Spesa Sfusa (Via Lazio 66, Montegranaro): tessera punti, barattolo, missioni e buono.
È una pagina web come Magazzino e Lavoro: si apre dal link e si aggiunge alla schermata del telefono.

## Versione 0.4.0 – Promozioni

- In «Per te», sotto il barattolo, le pubblicità a scorrimento dei prodotti che danno punti in più; in basso la nuova scheda «Promozioni»: missioni del mese con i loro prodotti (prodotto della settimana +20, dolce del mese +10, pane +20), ultimi giorni ×4, «Salvali tu» ×3, «Fatto in bottega» ×2, con il prezzo di oggi (senza prezzo barrato e senza la parola «sconto») e «fino a esaurimento».
- La vetrina la pubblica il Magazzino (dalla 1.35.0) in `vetrina/oggi`; le foto, caricate dalla scheda prodotto del Magazzino, stanno in `vetrinaFoto/{id}` e restano sul telefono (Cache Storage) finché non cambiano.
- In «Missioni» compaiono i prodotti di questa settimana e di questo mese. I clienti di prova hanno una vetrina di prova.

## Versione 0.3.0 – passo 2: collegata a Firebase e al Magazzino

- La tessera vera sta su Firebase in `clienti/{codice}`: l'app la crea all'iscrizione (una volta, senza punti) e la rilegge all'avvio, quando torna davanti e ogni minuto. Le spese le scrive il Magazzino (dalla 1.34.0) in `clienti/{codice}/spese/{id}` quando al Banco si scansiona la tessera e si chiude la spesa.
- Iscrizione con 20 punti, codice di un'amica (20 punti a lei e 30 a chi l'ha invitata alla prima spesa, li scrive il Magazzino), «Ho già la tessera» (cerca la scheda su Firebase).
- Tessera con QR e codice a barre (Code 128), stampabile in formato carta di credito.
- Barattolo verso i 200 punti, avviso dal 25 del mese, buono da 5 € su una spesa di almeno 40 €.
- Missioni del mese: prodotto della settimana (+20), pane della settimana (+20), dolce del mese (+10).
- Barra blu «apri la prova»: la tessera di questo telefono, i tre clienti di prova della scheda per Anita (dati finti, non toccano Firebase), il giorno della prova.
- Regole di Firestore: `firestore.rules` (si incollano nella console di Firebase). Senza password si legge solo la scheda di una tessera conoscendone il codice; il magazzino resta solo del negozio.

Fuori da questa versione: notifiche (passo 4), vetrina «Salvali tu», notizie e acquisti in app.

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
| `firestore.rules` | regole di Firestore (copia di quelle della console) |

## Prove

Con Node.js 18 o più recente: `node --test prove/punti.test.js`.
Controllano l'esempio del riepilogo (49 punti) e i tre clienti della scheda per Anita (famiglia 287 punti con buono il 18, cliente fedele 219 con l'avviso «ti mancano 22 punti», cliente del pane 164 senza buono).

## Pubblicazione

GitHub Pages dal ramo `main`, cartella principale. A ogni nuova versione cambiano `VERSIONE` in `app.js` e `CACHE` in `sw.js`.
