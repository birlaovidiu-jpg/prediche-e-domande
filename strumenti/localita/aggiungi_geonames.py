#!/usr/bin/env python3
"""Aggiunge a dati/localita.json tutti i paesi, le frazioni e le località
d'Italia e di Romania prese da GeoNames (https://download.geonames.org/export/dump/,
file IT.zip e RO.zip, licenza CC BY 4.0).

Serve perché l'elenco del mondo ha solo i comuni: da Marcena (Arezzo) il
programma diceva «Capolona», il paese più vicino che conosceva.

Uso:  python3 aggiungi_geonames.py CARTELLA_CON_IT.txt_E_RO.txt
Si può rifare quante volte si vuole: una località già presente (stesso nome
entro 3 km) non viene aggiunta di nuovo.
"""
import json, math, os, sys

QUI = os.path.dirname(os.path.abspath(__file__))
DATI = os.path.join(QUI, '..', '..', 'dati', 'localita.json')
# i tipi di «luogo abitato» di GeoNames che teniamo: paesi, frazioni, capoluoghi,
# località. Fuori: quartieri (PPLX), luoghi abbandonati o distrutti, luoghi religiosi.
TIPI = {'PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC', 'PPLL', 'PPLF', 'PPLS'}

def km(a, b):
    dla = a[0] - b[0]; dlo = (a[1] - b[1]) * math.cos(math.radians(a[0]))
    return math.hypot(dla, dlo) * 111.32

def main(cartella):
    D = json.load(open(DATI))
    vicini = {}   # nome in minuscolo -> coordinate già presenti
    for x in D['L']:
        vicini.setdefault(x[0].lower(), []).append((x[1] / 1000, x[2] / 1000))
    nuovi = []
    for cc in ('IT', 'RO'):
        ci = D['cc'].index(cc)
        righe = []
        for r in open(os.path.join(cartella, cc + '.txt'), encoding='utf-8'):
            c = r.rstrip('\n').split('\t')
            if c[6] != 'P' or c[7] not in TIPI: continue
            righe.append((int(c[14] or 0), c[1], float(c[4]), float(c[5]), c[17]))
        righe.sort(key=lambda t: -t[0])          # i più grandi prima (nella ricerca vengono fuori per primi)
        n = 0
        for pop, nome, la, lo, tz in righe:
            k = nome.lower()
            if any(km((la, lo), p) < 3 for p in vicini.get(k, [])): continue
            if tz not in D['tz']: D['tz'].append(tz)
            nuovi.append([nome, round(la * 1000), round(lo * 1000), ci, D['tz'].index(tz)])
            vicini.setdefault(k, []).append((la, lo))
            n += 1
        print(f'{cc}: {len(righe)} luoghi abitati in GeoNames, {n} aggiunti')
    D['L'] += nuovi
    json.dump(D, open(DATI, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'località in tutto: {len(D["L"])}')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
