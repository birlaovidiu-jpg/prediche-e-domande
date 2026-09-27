# -*- coding: utf-8 -*-
"""Prepara le parole dell'Impiccato: solo parole sensate, ognuna con una piccola descrizione.

Fonti, in quest'ordine (se la stessa parola c'è due volte vince la prima):
  1. le descrizioni scritte a mano del Cruciverba (strumenti/cruciverba/indizi_*.txt),
     tipi p persona, l luogo, c cosa, e avvenimento, t popolo;
  2. strumenti/impiccato/parole.txt (animali, piante, cose, luoghi, persone, feste, virtù…).
Mai parole come «perché» o «della»: sono tutte scritte a mano.
Per ogni parola cerco anche il primo versetto dove compare (nel libro indicato, se c'è),
così nel gioco il riferimento si può toccare. Si tolgono le descrizioni che contengono
la parola stessa (la risposta sarebbe già scritta).
Scrive dati/impiccato_parole.json: {"it":[[PAROLA, livello, descrizione, riferimento], …], "ro":[…]}

  cd strumenti/impiccato && python3 genera.py
"""
import json,gzip,base64,re,unicodedata,os,sys,glob

QUI=os.path.dirname(os.path.abspath(__file__))
RADICE=os.path.dirname(os.path.dirname(QUI))
sys.path.insert(0,os.path.join(RADICE,'dati'))
from libri import LIBRI

MINLEN,MAXLEN=3,13

def pul(w):
    """come _pulisciParola() del programma: solo A-Z maiuscole"""
    w=unicodedata.normalize('NFD',w.lower())
    w=''.join(c for c in w if unicodedata.category(c)!='Mn')
    w=w.replace('ș','s').replace('ş','s').replace('ț','t').replace('ţ','t')
    return re.sub(r'[^a-z]','',w).upper()

def contiene(testo,parola):
    return any(pul(t)==parola for t in re.split(r"[^A-Za-zÀ-ÖØ-öø-ÿĂăÂâÎîȘșȚțŞşŢţ]+",testo))

# ---- le parole, con descrizione e livello
voci={'it':{},'ro':{}}
scartate=[]
def metti(lg,parola,liv,descr,L):
    p=pul(parola)
    if not p or not descr or not (MINLEN<=len(p)<=MAXLEN): return
    if p in voci[lg]: return
    if contiene(descr,p): scartate.append((lg,p,descr)); return
    voci[lg][p]=[p,int(liv),descr.strip(),int(L or 0)]

for f in sorted(glob.glob(os.path.join(RADICE,'strumenti','cruciverba','indizi_*.txt'))):
    for r in open(f,encoding='utf-8'):
        r=r.rstrip('\n')
        if not r or r.startswith('#'): continue
        c=r.split('|')
        if len(c)<7 or c[4] not in 'plcet': continue
        a,b,liv,L,t,ci,cr=c[:7]
        if a and ci: metti('it',a,liv,ci,L if L.isdigit() else 0)
        if b and cr: metti('ro',b,liv,cr,L if L.isdigit() else 0)

for r in open(os.path.join(QUI,'parole.txt'),encoding='utf-8'):
    r=r.rstrip('\n')
    if not r or r.startswith('#'): continue
    c=r.split('|')
    if len(c)!=5: sys.exit('riga sbagliata: '+r)
    a,b,liv,ci,cr=c
    if a: metti('it',a,liv,ci,0)
    if b: metti('ro',b,liv,cr,0)

# ---- il primo versetto dove compare ogni parola
BIB=json.load(open(os.path.join(RADICE,'dati','bibbia.json')))
def primi(cod):
    testo=gzip.decompress(base64.b64decode(BIB['v'][cod]['z'])).decode('utf-8')
    righe=testo.split('\n'); cpl=BIB['cpl']; capv=BIB['cap']
    primo={}; perLibro={}
    ir=0; ic=0
    for Li in range(len(cpl)):
        for c in range(1,cpl[Li]+1):
            nv=capv[ic]; ic+=1
            for v in range(1,nv+1):
                riga=righe[ir]; ir+=1
                for g in re.split(r"[^A-Za-zÀ-ÖØ-öø-ÿĂăÂâÎîȘșȚțŞşŢţ]+",riga):
                    if not g: continue
                    p=pul(g)
                    if p not in primo: primo[p]=(Li+1,c,v)
                    if (Li+1,p) not in perLibro: perLibro[(Li+1,p)]=(Li+1,c,v)
    return primo,perLibro

out={}
for lg,cod in (('it','it'),('ro','ro')):
    primo,perLibro=primi(cod)
    lista=[]
    for p,liv,descr,L in sorted(voci[lg].values(),key=lambda x:(x[1],x[0])):
        dove=perLibro.get((L,p)) if L else None
        dove=dove or primo.get(p)
        rif=''
        if dove:
            Li,c,v=dove
            nome=LIBRI[Li-1][2] if lg=='ro' else LIBRI[Li-1][1]
            rif=f"{nome} {c}:{v}"
        lista.append([p,liv,descr,rif])
    out[lg]=lista
    liv={k:sum(1 for x in lista if x[1]==k) for k in (1,2,3)}
    print(f"{lg}: {len(lista)} parole (livelli {liv}), {sum(1 for x in lista if x[3])} con il riferimento")
for s in scartate: print('  tolta (la descrizione contiene la parola):',*s)
json.dump(out,open(os.path.join(RADICE,'dati','impiccato_parole.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('scritto dati/impiccato_parole.json')
