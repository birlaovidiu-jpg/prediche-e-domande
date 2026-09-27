# -*- coding: utf-8 -*-
"""Le prediche, le poesie e le esperienze che prima stavano DENTRO al programma
(dati/prediche_pages.json, poesie_*.json, esperienze_*.json) diventano un file a
parte, da caricare dal programma con «📂 Carica backup»: così diventano «tue»
(stato.prediche/poesie/esperienze) e finiscono anche nel backup prediche.zip.
Gli identificativi restano gli stessi di prima (pr<num>, q<n>, e<n>), perciò
i tuoi appunti, stili, luoghi e diapositive su quelle voci si ritrovano da soli.

    python3 strumenti/archivio/esporta.py      → archivio_prediche_poesie_esperienze.json
"""
import json, os
QUI=os.path.dirname(os.path.abspath(__file__))
PROG=os.path.dirname(os.path.dirname(QUI))
D=os.path.join(PROG,'dati')
def j(n): return json.load(open(os.path.join(D,n),encoding='utf-8'))

PR=j('prediche_pages.json')
PO=j('poesie_finali.json')+j('poesie_estensione.json')
ES=j('esperienze_500.json')+j('esperienze_estensione.json')

prediche=[{'i':'pr'+str(p['num'] or ('x'+str(k))),'num':p['num'],'tit':p['tit'],'lg':p['lg'],'rif':p.get('rif',''),
           'testo':p['testo'],'html':p.get('html',''),'fam':p.get('fam','helvetica'),'px':p.get('px',21),
           'col':p.get('col') or '#241d10','tema':'','mia':True} for k,p in enumerate(PR)]
poesie=[{'i':'q'+str(k),'tit':p['tit'],'lg':p['lg'],'testo':p['testo'],'mia':True} for k,p in enumerate(PO)]
esperienze=[{'i':'e'+str(k),'tit':e['tit'],'lg':e['lg'],'rif':e.get('rif',''),'testo':e['testo'],
             'tipo':'vera' if e.get('tipo')=='vera' else 'racconto','sfondo':'alba','all':[],'mia':True} for k,e in enumerate(ES)]
out={'programma':'Prediche e Domande','tipo':'archivio','prediche':prediche,'poesie':poesie,'esperienze':esperienze}
dest=os.path.join(PROG,'archivio_prediche_poesie_esperienze.json')
json.dump(out,open(dest,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(f"✓ {os.path.basename(dest)} — prediche {len(prediche)} · poesie {len(poesie)} · esperienze {len(esperienze)} · {os.path.getsize(dest)//1024} KB")
