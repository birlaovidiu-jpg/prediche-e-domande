# -*- coding: utf-8 -*-
"""Mette insieme tutte le esperienze scritte a gruppi e le controlla."""
import json,os,glob,re,unicodedata,sys
QUI=os.path.dirname(os.path.abspath(__file__))
DATI='/Users/ovidio/Desktop/ovidiu/claude/prediche e domande/dati'
def ck(t):
    t=unicodedata.normalize('NFD',(t or '').lower())
    return re.sub(r'[^a-z0-9]','',''.join(c for c in t if unicodedata.category(c)!='Mn'))
fuori=json.load(open(DATI+'/esperienze_finali.json'))
for x in fuori: x.setdefault('tipo','vera')   # le quattro che c'erano gia' sono sue: fatti veri raccontati da lui
visti={(x['lg'],ck(x['tit'])) for x in fuori}
n=0
for f in sorted(glob.glob(os.path.join(QUI,'[gv]*.json'))):
    for x in json.load(open(f)):
        k=(x['lg'],ck(x['tit']))
        if k in visti: print('  doppione saltato:',x['tit']); continue
        assert x['lg'] in ('it','ro'), x['tit']
        assert x.get('rif'), 'manca il versetto: '+x['tit']
        assert len(x['testo'])>420, 'troppo corta: '+x['tit']+' ('+str(len(x['testo']))+')'
        visti.add(k); fuori.append({'tit':x['tit'],'lg':x['lg'],'rif':x['rif'],'testo':x['testo'],
                                    'tipo':x.get('tipo','racconto')}); n+=1
from collections import Counter
print('nuove:',n,'| totale:',len(fuori),'|',Counter(x['lg'] for x in fuori),'|',Counter(x.get('tipo') for x in fuori))
print('lunghezza media: %d lettere'%(sum(len(x['testo']) for x in fuori)/len(fuori)))
json.dump(fuori,open(os.path.join(DATI,'esperienze_500.json'),'w'),ensure_ascii=False)
