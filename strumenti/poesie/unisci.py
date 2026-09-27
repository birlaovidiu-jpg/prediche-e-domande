#!/usr/bin/env python3
"""Unisce le poesie scritte in it_*.txt / ro_*.txt in dati/poesie_estensione.json
(lette da costruisci.py). Prima lancia controlla.py per le rime."""
import glob,json,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from controlla import leggi
qui=os.path.dirname(os.path.abspath(__file__))
out=[]
for lg in ('it','ro'):
    for f in sorted(glob.glob(os.path.join(qui,lg+'_*.txt'))):
        for p in leggi(f):
            out.append({'tit':p['tit'],'lg':lg,'testo':p['testo']})
dest=os.path.join(qui,'..','..','dati','poesie_estensione.json')
json.dump(out,open(dest,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(len(out),'poesie →',os.path.normpath(dest))
