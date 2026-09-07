# Prediche e Domande — SDARM

Un **unico file HTML** che funziona senza internet, su Mac, iPad e iPhone.
Serve per condurre le riunioni di chiesa: quiz biblici, cantici, prediche,
poesie, esperienze, la Bibbia, alba e tramonto e i lezionari della Scuola
del Sabato con le annotazioni.

## Come si scarica il programma pronto

Vai su **Releases** (colonna a destra) e scarica il file `.html` più recente.
Aprilo con Safari o Chrome. Non serve installare niente.

Sull'iPad: aprilo una volta, poi **Condividi → Aggiungi alla schermata Home**.

## Che cosa c'è dentro

| | |
|---|---|
| Domande bibliche | 10.000 (5.000 in italiano, 5.000 in rumeno), quattro livelli di difficoltà, tutti e 66 i libri |
| Chi ha detto? | 4.816 frasi prese parola per parola dalla Bibbia, con l'autore controllato sul testo |
| Bibbia | tre versioni intere: Nuova Diodati, Cornilescu, King James |
| Cantici | 1.549 in quattro raccolte, con la base musicale |
| Prediche | 62, prese dai file di Pages con i loro colori e caratteri |
| Esperienze | vere e racconti, ognuna con il suo testo biblico |
| Scuola del Sabato | i lezionari in PDF da leggere, evidenziare e annotare; gli appunti passano da una lingua all'altra |
| Alba e tramonto | calcolo astronomico offline per 19.642 località |

## Per chi ci mette le mani

Il programma non si modifica sul file compilato: si modificano i **sorgenti**
e si ricompila.

```bash
python3 costruisci.py 7.8        # scrive Prediche_e_Domande_v7.8.html
python3 -m http.server 8796      # per provarlo nel browser
```

- `sorgenti/*.js` — il programma, diviso in pezzi. Vengono uniti **in un solo
  script**: attenzione a non ripetere lo stesso nome di variabile in due file.
- `sorgenti/stile.css` — tutto l'aspetto.
- `sorgenti/guscio.html` — l'ossatura della pagina.
- `dati/` — i contenuti (Bibbia, domande, cantici, prediche…) e il motore PDF.
- `HANDOFF.md` — le note di lavoro: cosa funziona, cosa è stato provato e non
  funziona, e le trappole da evitare.

### Il controllo automatico

Aperto il programma nel browser, nella console si scrive:

```js
autoTest()
```

Fa più di duecento controlli su tutto. `falliti` deve restare vuoto.

## Note

Niente librerie esterne. pdf.js è dentro al file compilato.
Evitare `(?<=…)` nelle espressioni regolari: il Safari degli iPad più vecchi
non lo capisce e il programma non parte.
