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
