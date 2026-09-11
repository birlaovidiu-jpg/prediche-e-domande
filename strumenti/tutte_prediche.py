# -*- coding: utf-8 -*-
"""Legge tutte le prediche dalla cartella e le mette in un file solo,
   tenendo com'erano scritte: colori, caratteri, misure, grassetto, corsivo."""
import os, re, sys, json, unicodedata, traceback
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from estrai_predica import html_predica, leggi

CART='/Users/ovidio/Desktop/predici'
RO=re.compile(r'\b(şi|și|pentru|este|Dumnezeu|Domnul|care|nostru|să|nu|din|către|lui|Isus|omul|viaţa|viața)\b',re.I)
IT=re.compile(r'\b(che|della|degli|dalla|Dio|Signore|nostro|perché|questo|non|con|sono|gli|una|delle)\b',re.I)
def lingua(t):
    t=t[:20000]
    segni=len(re.findall(r'[ăâîşșţț]',t,re.I))
    return 'ro' if (segni*0.6 + len(RO.findall(t))*3) > len(IT.findall(t))*3 else 'it'

def testo_semplice(h):
    """il testo senza i tag, ma con la riga vuota fra un paragrafo e l'altro:
       serve al programma per capire dove finisce un blocco e comincia l'altro"""
    t=re.sub(r'</p\s*>','\n\n',h)
    t=re.sub(r'<br\s*/?>','\n',t)
    t=re.sub(r'<[^>]+>','',t)
    t=(t.replace('&#x27;',"'").replace('&amp;','&').replace('&lt;','<')
        .replace('&gt;','>').replace('&quot;','"').replace('&nbsp;',' '))
    t=re.sub(r'[ \t]+',' ',t)
    t=re.sub(r' *\n *','\n',t)
    return re.sub(r'\n{3,}','\n\n',t).strip()

def solo_testo(h):
    return re.sub(r'<[^>]+>',' ',h).replace('&#x27;',"'").replace('&amp;','&').replace('&lt;','<').replace('&gt;','>')

def rif_biblico(t):
    m=re.search(r'\b([1-3]?\s?[A-ZÎŞŢĂÂ][a-zà-ÿăâîşșţț]{2,14})\s+(\d{1,3}):(\d{1,3})',t[:4000])
    return f'{m.group(1).strip()} {m.group(2)}:{m.group(3)}' if m else ''

fuori=[]; errori=[]
for nome in sorted(os.listdir(CART)):
    if not nome.endswith('.pages') or nome.startswith('.'): continue
    p=os.path.join(CART,nome)
    base=unicodedata.normalize('NFC',nome[:-6])
    m=re.match(r'\s*(\d{1,3})\s*[-–—.]?\s*(.+)$',base)
    num=int(m.group(1)) if m else 0
    tit=(m.group(2) if m else base).strip()
    try:
        h,st=html_predica(p)
        t=solo_testo(h)
        if len(t.strip())<40: raise ValueError('quasi vuota (%d lettere)'%len(t.strip()))
        fuori.append({'num':num,'tit':tit,'lg':lingua(t),'rif':rif_biblico(t),
                      'html':h,'testo':testo_semplice(h),
                      'car':st.get('car'),'dim':st.get('dim'),'col':st.get('col'),
                      'file':nome})
    except Exception as e:
        errori.append((nome,str(e)))
print('lette:',len(fuori),'| errori:',len(errori))
for n,e in errori: print('   ✗',n,'—',e)
from collections import Counter
print('lingue:',Counter(x['lg'] for x in fuori))
print('caratteri di base:',Counter(x['car'] for x in fuori).most_common(6))
print('numeri:',sorted(x['num'] for x in fuori))
json.dump(fuori,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'prediche_pages.json'),'w'),ensure_ascii=False)
