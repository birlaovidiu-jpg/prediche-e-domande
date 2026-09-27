#!/usr/bin/env python3
"""Mistero Biblico: unisce i casi scritti a mano (casi_*.json, in italiano e rumeno), li controlla
e scrive dati/misteri.json, che costruisci.py mette dentro al programma come MISTERI.
Controlli: ogni scritta nelle due lingue, elementi da 6 in su con almeno 5 indizi veri,
tre aiuti, almeno tre prove, risposte giuste esistenti, liste della stessa lunghezza nelle due lingue,
numeri e id dei casi senza doppioni."""
import json, glob, os, sys
QUI=os.path.dirname(os.path.abspath(__file__))
DATI=os.path.join(QUI,'..','..','dati')
errori=[]
def due(o,dove):
    if not isinstance(o,dict) or not str(o.get('it','')).strip() or not str(o.get('ro','')).strip():
        errori.append(f'{dove}: manca il testo in italiano o in rumeno')
def liste(o,dove):
    if not isinstance(o,dict) or not isinstance(o.get('it'),list) or not isinstance(o.get('ro'),list) or len(o['it'])!=len(o['ro']) or not o['it']:
        errori.append(f'{dove}: le due liste (it/ro) mancano o non sono lunghe uguali'); return 0
    return len(o['it'])
casi=[]
for f in sorted(glob.glob(os.path.join(QUI,'casi_*.json'))):
    try: casi+=json.load(open(f,encoding='utf-8'))
    except Exception as e: errori.append(f'{os.path.basename(f)}: {e}')

# ---- i casi scritti nel formato corto (casi_*.txt), una riga per cosa, «italiano || rumeno» ----
#  == id | icona | difficoltà | scena | deco | L c v v2        (il riferimento del caso, per il pulsante 📖)
#  T titolo · S sottotitolo · R riferimento scritto · I introduzione · H la storia finale
#  E i|t|f chiave icona | nome      poi le righe «. …»: indizio (i) → testo, nota · testimone (t) → chi, testo, nota
#                                   · irrilevante (f) → testo (la nota si fa da sola: «Nome: niente»)
#  A aiuto (tre)
#  Q domanda a scelta · + la risposta giusta · - le sbagliate
#  O [domanda] · > le voci nell'ordine giusto          (senza domanda: «Metti in ordine.»)
#  V [domanda] · v frase vera · x frase falsa          (senza domanda: «Tocca tutte le frasi vere…»)
import re, gzip, base64
BIB=json.load(open(os.path.join(DATI,'bibbia.json')))
CPL=BIB['cpl']; CAP=BIB['cap']
def esiste(L,c,v):
    if not(1<=L<=66) or not(1<=c<=CPL[L-1]): return False
    return 1<=v<=CAP[sum(CPL[:L-1])+c-1]
RO_LETTERE=re.compile('[ăâîșțşţĂÂÎȘȚ]')
def coppia(s,dove):
    if '||' not in s: errori.append(f'{dove}: manca «||» fra italiano e rumeno'); return {'it':s.strip(),'ro':''}
    a,b=s.split('||',1); a,b=a.strip(),b.strip()
    if len(a)<2 or len(b)<2: errori.append(f'{dove}: testo troppo corto')
    if RO_LETTERE.search(a): errori.append(f'{dove}: lettere rumene nella parte italiana')
    return {'it':a,'ro':b}
ORDINA={'it':'Metti in ordine.','ro':'Pune în ordine.'}
VERE={'it':'Tocca tutte le frasi vere, poi conferma.','ro':'Atinge toate propozițiile adevărate, apoi confirmă.'}
def leggi_txt(f):
    nome=os.path.basename(f); fuori=[]; c=None; el=None; pr=None
    for n,riga in enumerate(open(f,encoding='utf-8'),1):
        r=riga.strip(); w=f'{nome}:{n}'
        if not r or r.startswith('#'): continue
        if r.startswith('=='):
            p=[x.strip() for x in r[2:].split('|')]
            if len(p)!=6: errori.append(f'{w}: la testa del caso vuole 6 parti'); c=None; continue
            try:
                rn=[int(x) for x in re.split(r'[ :\-]+',p[5])]
                if len(rn)==3: rn.append(rn[2])
                if len(rn)!=4 or not esiste(rn[0],rn[1],rn[2]) or not esiste(rn[0],rn[1],rn[3]): raise ValueError
            except ValueError: errori.append(f'{w}: riferimento sbagliato «{p[5]}»'); rn=None
            c={'id':p[0],'ic':p[1],'dif':int(p[2]) if p[2].isdigit() else 0,'scena':p[3],'deco':p[4],'rifN':rn,
               'elementi':[],'aiuti':[],'prove':[],'punti':2000,'_w':w}
            fuori.append(c); el=pr=None; continue
        if c is None: errori.append(f'{w}: riga fuori da un caso'); continue
        k,resto=r[0],r[1:].strip()
        if r.startswith('. '):
            if el is None: errori.append(f'{w}: riga «.» senza elemento'); continue
            el['_righe'].append(coppia(resto,w))
        elif k in 'TSRIH' and r[1]==' ':
            chi={'T':'titolo','S':'sotto','R':'rif','I':'intro','H':'storia'}[k]
            if '||' in resto or k not in 'IH': c[chi]=coppia(resto,w)
            elif chi not in c:                                           # testo lungo: una riga in italiano…
                c[chi]={'it':resto,'ro':''}
                if RO_LETTERE.search(resto): errori.append(f'{w}: lettere rumene nella riga italiana')
            elif not c[chi]['ro']: c[chi]['ro']=resto                 # …e la riga dopo in rumeno
            else: errori.append(f'{w}: «{k}» ripetuto')
        elif k=='E':
            m=re.match(r'([itf]) (\S+) (\S+) \| (.*)$',resto)
            if not m: errori.append(f'{w}: elemento scritto male'); continue
            el={'k':m[2],'ic':m[3],'tipo':m[1],'n':coppia(m[4],w),'_righe':[],'_w':w}; c['elementi'].append(el); pr=None
        elif k=='A': c['aiuti'].append(coppia(resto,w))
        elif k=='Q': pr={'t':'scelta','q':coppia(resto,w),'opz':{'it':[],'ro':[]},'ok':0,'_g':0}; c['prove'].append(pr); el=None
        elif k in '+-':
            if not pr or pr['t']!='scelta': errori.append(f'{w}: risposta senza domanda'); continue
            x=coppia(resto,w)
            if k=='+':
                if pr['_g']: errori.append(f'{w}: due risposte giuste')
                pr['_g']+=1; pr['opz']['it'].insert(0,x['it']); pr['opz']['ro'].insert(0,x['ro'])
            else: pr['opz']['it'].append(x['it']); pr['opz']['ro'].append(x['ro'])
        elif k=='O': pr={'t':'ordine','q':coppia(resto,w) if resto else dict(ORDINA),'voci':{'it':[],'ro':[]}}; c['prove'].append(pr); el=None
        elif k=='>':
            if not pr or pr['t']!='ordine': errori.append(f'{w}: voce senza «O»'); continue
            x=coppia(resto,w); pr['voci']['it'].append(x['it']); pr['voci']['ro'].append(x['ro'])
        elif k=='V': pr={'t':'vero','q':coppia(resto,w) if resto else dict(VERE),'frasi':[]}; c['prove'].append(pr); el=None
        elif k in 'vx' and r[1]==' ':
            if not pr or pr['t']!='vero': errori.append(f'{w}: frase senza «V»'); continue
            pr['frasi'].append({'t':coppia(resto,w),'v':k=='v'})
        else: errori.append(f'{w}: riga che non capisco')
    for c in fuori:
        for e in c['elementi']:
            R=e.pop('_righe'); w=e.pop('_w')
            chiavi={'i':('tx','nota'),'t':('chi','tx','nota'),'f':('tx',)}[e['tipo']]
            if len(R)!=len(chiavi): errori.append(f"{w}: l'elemento vuole {len(chiavi)} righe «.» ({len(R)})"); continue
            for kk,x in zip(chiavi,R): e[kk]=x
            if e['tipo']=='f': e['nota']={'it':e['n']['it']+': niente','ro':e['n']['ro']+': nimic'}
        for p in c['prove']:
            if p.get('t')=='scelta':
                if p.pop('_g',0)!=1: errori.append(f"{c['_w']}: ogni domanda vuole una sola risposta giusta")
                if len(p['opz']['it'])<3: errori.append(f"{c['_w']}: una domanda con meno di 3 risposte")
        c.pop('_w')
    return fuori
if casi: primo=max(c.get('num',0) for c in casi)+1
else: primo=1
for f in sorted(glob.glob(os.path.join(QUI,'casi_*.txt'))):
    for c in leggi_txt(f):
        c['num']=primo; primo+=1; casi.append(c)
# i posti della scena: otto, che non si coprono; chi scrive un caso può anche dare x,y suoi
POSTI=[(16,24),(40,18),(64,24),(87,30),(13,72),(37,64),(62,74),(87,74),(50,46)]
for c in casi:
    for i,e in enumerate(c.get('elementi',[])):
        if 'x' not in e or 'y' not in e: e['x'],e['y']=POSTI[i%len(POSTI)]
SCENE=('palazzo','deserto','mare','prigione','monte','citta','campo','tempio','notte','casa','giardino','fiume')
ids=set(); nums=set()
for c in casi:
    d=c.get('id','?')
    if d in ids: errori.append(f'{d}: id doppio')
    ids.add(d)
    if c.get('num') in nums: errori.append(f'{d}: numero doppio {c.get("num")}')
    nums.add(c.get('num'))
    for k in ('titolo','sotto','rif','intro','storia'): due(c.get(k),f'{d}.{k}')
    if c.get('dif') not in (1,2,3): errori.append(f'{d}: dif deve essere 1, 2 o 3')
    if c.get('scena') not in SCENE: errori.append(f'{d}: scena sconosciuta {c.get("scena")}')
    if not c.get('rifN'): errori.append(f'{d}: manca il riferimento rifN')
    el=c.get('elementi',[])
    if len(el)<6: errori.append(f'{d}: servono almeno 6 elementi nella scena ({len(el)})')
    if sum(1 for e in el if e.get('tipo') in ('i','t'))<5: errori.append(f'{d}: servono almeno 5 indizi veri')
    ks=set()
    for e in el:
        w=f"{d}.{e.get('k')}"
        if e.get('k') in ks: errori.append(f'{w}: elemento doppio')
        ks.add(e.get('k'))
        if e.get('tipo') not in ('i','f','t'): errori.append(f'{w}: tipo deve essere i, f o t')
        for k in ('n','tx','nota'): due(e.get(k),f'{w}.{k}')
        if e.get('tipo')=='t': due(e.get('chi'),f'{w}.chi')
        if not (0<=e.get('x',-1)<=100 and 0<=e.get('y',-1)<=100): errori.append(f'{w}: posizione x,y fra 0 e 100')
    if len(c.get('aiuti',[]))!=3: errori.append(f'{d}: servono 3 aiuti')
    for i,a in enumerate(c.get('aiuti',[])): due(a,f'{d}.aiuto{i+1}')
    pr=c.get('prove',[])
    if len(pr)<3: errori.append(f'{d}: servono almeno 3 prove')
    for i,p in enumerate(pr):
        w=f'{d}.prova{i+1}'; due(p.get('q'),w+'.q')
        if p.get('t')=='scelta':
            n=liste(p.get('opz'),w+'.opz')
            if not (0<=p.get('ok',-1)<n): errori.append(f'{w}: la risposta giusta non esiste')
        elif p.get('t')=='ordine':
            if liste(p.get('voci'),w+'.voci')<3: errori.append(f'{w}: servono almeno 3 voci da ordinare')
        elif p.get('t')=='vero':
            fr=p.get('frasi',[])
            if len(fr)<3: errori.append(f'{w}: servono almeno 3 frasi')
            if not any(x.get('v') for x in fr): errori.append(f'{w}: almeno una frase vera')
            for j,x in enumerate(fr): due(x.get('t'),f'{w}.frase{j+1}')
        else: errori.append(f'{w}: tipo di prova sconosciuto {p.get("t")}')
if errori:
    print('\n'.join(errori)); print(f'{len(errori)} errori: niente scritto'); sys.exit(1)
# nel riferimento rumeno non devono restare nomi di libri in italiano
sys.path.insert(0,DATI); from libri import LIBRI
SOLO_IT=[L[1] for L in LIBRI if L[1]!=L[2] and not L[2].startswith(L[1])]
for c in casi:
    r=(c.get('rif') or {}).get('ro','')
    for n in SOLO_IT:
        if re.search(r'(^|[ ;,(])'+re.escape(n)+r'\b',r): errori.append(f"{c.get('id')}: nel riferimento rumeno c'è «{n}»")
if errori:
    print('\n'.join(errori)); print(f'{len(errori)} errori: niente scritto'); sys.exit(1)
casi.sort(key=lambda c:c['num'])
json.dump({'casi':casi},open(os.path.join(DATI,'misteri.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
from collections import Counter
print(f"{len(casi)} casi · difficoltà {dict(Counter(c['dif'] for c in casi))} · scritto dati/misteri.json")
