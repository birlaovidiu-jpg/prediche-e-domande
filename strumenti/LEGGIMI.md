# Strumenti

Gli attrezzi con cui sono stati preparati i contenuti. Non servono per usare il
programma: servono se un giorno bisogna rifare o allargare i dati.

Stanno qui dentro al progetto perché le cartelle di lavoro temporanee si
svuotano, e una volta è già successo.

## Leggere i file .pages di Ovidiu

Apple Pages non è installato su questo Mac. Questi file leggono da soli il
formato IWA (protobuf compresso con Snappy) e tirano fuori il testo **con la
sua forma**: carattere, misura, colore, grassetto, corsivo, allineamento.

| file | che cosa fa |
|---|---|
| `iwa.py` | decomprime i blocchi Snappy |
| `iwa2.py` | legge i messaggi protobuf senza conoscere lo schema |
| `estrai_predica.py` | da una predica tira fuori l'HTML con i suoi stili |
| `tutte_prediche.py` | fa la stessa cosa su tutta la cartella `~/Desktop/predici` e scrive `dati/prediche_pages.json` |

```bash
cd strumenti && python3 tutte_prediche.py
```

Il campo 11 di uno stile porta: 1 = grassetto, 2 = corsivo, 3 = misura,
5 = nome del carattere, 7 = colore (rosso, verde, blu come numeri da 0 a 1),
9 = sottolineato. Lo stile da cui uno deriva sta nel campo 3 della sua base,
**non** nel 5 (quello è il foglio di stile).

## Le esperienze

In `esperienze/` stanno i gruppi scritti a mano: `g*.json` sono i racconti,
`v*.json` quelle vere. `_unisci.py` li mette insieme, controlla che ognuna abbia
il suo versetto e almeno 420 lettere, toglie i doppioni e scrive
`dati/esperienze_500.json`.

```bash
cd strumenti/esperienze && python3 _unisci.py
```

Ogni esperienza ha: `tit`, `lg` (`it`/`ro`), `tipo` (`vera`/`racconto`),
`rif` (il testo biblico) e `testo`.

## Le parole del Cruciverba

In `cruciverba/` sta tutto quello che serve per rifare le parole del Cruciverba, per lingua, ognuna con
il suo indizio vero: **5.000 parole per lingua** (`TOTALE` in `genera.py`), un terzo per livello. Sono TUTTE
quelle con una domanda o una definizione vera (circa 1.100: nomi di personaggi, città, cose, avvenimenti,
domande del quiz) e, per arrivare a 5.000, i **versetti da completare**. I nomi propri veri della Bibbia sono
circa 3.000 per lingua, molti oscuri: per questo con solo nomi e domande non si arriva a 5.000. Nel cruciverba
i versetti pesano poco (`CRV_QUOTA_VERE` in `6h_giochi.js`: nove parole su dieci hanno l'indizio vero), quindi in
un cruciverba di 14 parole ce n'è in media meno di uno.

| file | che cosa fa |
|---|---|
| `indizi_*.txt` | gli indizi scritti a mano: persone, luoghi, cose, avvenimenti, popoli. Una riga per parola: `RISPOSTA IT\|RISPOSTA RO\|livello 1-3\|libro\|tipo\|indizio italiano\|indizio rumeno` |
| `libri.txt` | i nomi dei libri della Bibbia di una parola sola, ognuno con una descrizione (per il tema «Libri della Bibbia») |
| `controlla.py` | guarda che ogni nome scritto a mano esista davvero nella Bibbia del programma (Nuova Diodati, Cornilescu): se no, l'ortografia va corretta |
| `genera.py` | mette insieme le parole a mano, le domande del quiz con risposta di una parola (tolti gli articoli e «il monte…», i numeri scritti a lettere), i personaggi di «Chi ha detto?» e, per arrivare a `TOTALE` (5.000), le parole con il **versetto da completare**, prese a passo regolare fra le più e le meno usate della Bibbia (le più usate ai livelli facili); scrive `dati/cruciverba_parole.json` e `dati/cruciverba_libri.json` |

```bash
cd strumenti/cruciverba && python3 controlla.py && python3 genera.py
```

Per avere più parole con una domanda vera basta aggiungere righe a un `indizi_*.txt` e rilanciare
(le parole scritte a mano hanno la precedenza sui versetti, che si riducono in proporzione: il totale resta 5.000).
Per cambiare il totale cambia `TOTALE` in `genera.py` (e le prove in `autoTest()`, che controllano `===5000`).

## Le località d'Italia e di Romania (alba e tramonto)

`localita/aggiungi_geonames.py` aggiunge a `dati/localita.json` tutti i paesi e le
frazioni d'Italia e di Romania presi da GeoNames (file `IT.zip` e `RO.zip` di
https://download.geonames.org/export/dump/, licenza CC BY 4.0). Prima l'elenco
aveva solo i comuni, e da Marcena diceva «Capolona». Si può rifare: le località
già presenti non vengono aggiunte due volte.

```bash
python3 strumenti/localita/aggiungi_geonames.py CARTELLA_DOVE_STANNO_IT.txt_E_RO.txt
```

## Le parole dell'Impiccato

`impiccato/genera.py` prepara `dati/impiccato_parole.json`: solo parole sensate, ognuna con una piccola
descrizione (quelle scritte a mano del Cruciverba più `impiccato/parole.txt`). Dopo aver cambiato
`parole.txt` rilanciarlo e poi ricompilare.

```bash
cd strumenti/impiccato && python3 genera.py
```

## I giochi dal 9 al 16

`giochi/genera.py` prepara `dati/giochi_nuovi.json` dai file scritti a mano in `giochi/`, in italiano e
in rumeno: `domande.txt` (Ruota, Sprint, Scalata, Tempio), `parole.txt` (Parola misteriosa),
`versetti.txt` (Costruisci il versetto: il testo viene dalle Bibbie del programma), `sequenze.txt` e
`associazioni.txt` (Tempio), `viaggi.json` (Viaggio biblico), `codici.json` (Codice segreto).
Ogni riferimento viene cercato davvero nelle due Bibbie; con `-v` stampa ogni domanda accanto al suo
versetto, per ricontrollarla. Per aggiungere contenuti basta scrivere altre righe nello stesso formato.

```bash
cd strumenti/giochi && python3 genera.py -v
```
