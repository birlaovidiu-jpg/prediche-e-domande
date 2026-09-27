# -*- coding: utf-8 -*-
"""Controllo delle domande nuove a quattro risposte (strumenti/giochi/domande_nuove/*.txt), prima di
metterle nel programma:
  · il riferimento esiste nelle due Bibbie;
  · la risposta giusta si trova davvero nel versetto (o in quelli vicini): se è in un versetto vicino
    e non in quello scritto, lo dice e propone quello giusto (con --correggi lo corregge nel file);
  · niente doppioni fra le nuove, con le 162 di prima e con le 9.860 del programma.
Uso:  python3 controlla_domande.py [file…] [--correggi] [-v]
"""
import json,gzip,base64,re,os,sys,unicodedata,glob
QUI=os.path.dirname(os.path.abspath(__file__)); RAD=os.path.dirname(os.path.dirname(QUI))
BIB=json.load(open(os.path.join(RAD,'dati','bibbia.json'))); CPL=BIB['cpl']; CAP=BIB['cap']
T={c:gzip.decompress(base64.b64decode(BIB['v'][c]['z'])).decode('utf-8').split('\n') for c in ('it','ro')}
def idx(L,c,v):
    if not(1<=L<=66) or not(1<=c<=CPL[L-1]): return -1
    ic=sum(CPL[:L-1])+c-1
    if not(1<=v<=CAP[ic]): return -1
    return sum(CAP[:ic])+v-1
def vv(cod,L,c,v): i=idx(L,c,v); return T[cod][i] if i>=0 else None
def norm(s):
    s=unicodedata.normalize('NFD',s.lower()); s=''.join(ch for ch in s if unicodedata.category(ch)!='Mn')
    return s.replace('ș','s').replace('ş','s').replace('ț','t').replace('ţ','t')
VUOTE=set('il lo la i gli le un uno una di da del della dei delle in con per su tra fra e ed o che a al alla ai alle nel nella sua suo suoi sue loro lui lei non si piu anni anno re dio cosa chi quale quanti volte giorni the de la cu si sa pe din la un o al ale lui ei lor nu mai ani an zile regele rege fost care ce cine cati'.split())
def chiavi(ans):
    w=[x for x in re.findall(r'[a-z0-9]+',norm(ans)) if len(x)>=3 and x not in VUOTE]
    return w
NUM={'it':{'uno':1,'due':2,'tre':3,'quattro':4,'cinque':5,'sei':6,'sette':7,'otto':8,'nove':9,'dieci':10,'dodici':12,'quaranta':40,'cento':100,'mille':1000,'trenta':30,'venti':20,'settanta':70,'cinquanta':50},
     'ro':{'unu':1,'doi':2,'trei':3,'patru':4,'cinci':5,'sase':6,'sapte':7,'opt':8,'noua':9,'zece':10,'doisprezece':12,'patruzeci':40,'suta':100,'mie':1000,'treizeci':30,'douazeci':20,'saptezeci':70,'cincizeci':50}}
def trovato(ans,testo,cod):
    t=norm(testo); k=chiavi(ans)
    if not k: return True
    for w in k:
        rad=w[:max(4,len(w)-3)] if not w.isdigit() else w
        if w.isdigit():
            n=int(w); nomi=[x for x,y in NUM[cod].items() if y==n]
            if w in t or any(x in t for x in nomi): return True
            continue
        if rad in t: return True
    return False
def leggi(f):
    out=[]; testa=None; lg={}
    for n,r in enumerate(open(f,encoding='utf-8'),1):
        r=r.rstrip('\n')
        if not r.strip() or r.lstrip().startswith('#'): continue
        c=r.split('|')
        if c[0] in('IT','RO'): lg[c[0].lower()]=(n,[x.strip() for x in c[1:]])
        else:
            if testa: out.append((testa,lg))
            testa=(n,c); lg={}
    if testa: out.append((testa,lg))
    return out
def rif(s):
    m=re.fullmatch(r'\s*(\d+)\s+(\d+):(\d+)(?:-(\d+))?\s*',s or '')
    return [int(x) for x in m.groups() if x] if m else None
def nq(s): return ' '.join(re.findall(r'[a-z0-9]+',norm(s)))
esistenti={}
for q in json.load(open(os.path.join(RAD,'dati','domande_10000.json'))): esistenti.setdefault(nq(q['d']),'banca')
for (n,c),lg in leggi(os.path.join(QUI,'domande.txt')):
    for k,(m,x) in lg.items(): esistenti.setdefault(nq(x[0]),'domande.txt')
# domande guardate a mano (la risposta è giusta anche se non è scritta con le stesse parole del versetto)
MANO=[r.strip() for r in open(os.path.join(QUI,'domande_nuove','controllate_a_mano.lst'),encoding='utf-8')
      if r.strip() and not r.startswith('#')] if os.path.exists(os.path.join(QUI,'domande_nuove','controllate_a_mano.lst')) else []
args=[a for a in sys.argv[1:] if not a.startswith('-')]
files=args or sorted(glob.glob(os.path.join(QUI,'domande_nuove','*.txt')))
correggi='--correggi' in sys.argv; verb='-v' in sys.argv
tot=0; male=0; viste={}
for f in files:
    righe=open(f,encoding='utf-8').read().split('\n'); cambi=0
    for (n,c),lg in leggi(f):
        tot+=1; nome=f'{os.path.basename(f)}:{n}'
        probl=[]
        if len(c)!=3: print(nome,'INTESTAZIONE',c); male+=1; continue
        r=rif(c[2])
        if not r or vv('it',r[0],r[1],r[2]) is None or (len(r)>3 and vv('it',r[0],r[1],r[3]) is None): print(nome,'RIFERIMENTO INESISTENTE',c[2]); male+=1; continue
        if set(lg)!={'it','ro'} or any(len(x)!=6 or not all(x) for m,x in lg.values()): print(nome,'CAMPI'); male+=1; continue
        for cod in ('it','ro'):
            m,x=lg[cod]
            if len(set(a.lower() for a in x[1:5]))<4: probl.append(cod+' risposte uguali')
            k=nq(x[0])
            if k in esistenti: probl.append(cod+' DOPPIONE con '+esistenti[k])
            if k in viste: probl.append(cod+' DOPPIONE con '+viste[k])
            viste[k]=nome
        # la risposta nel versetto (o fino a 3 versetti prima/dopo)
        L,C,V=r[:3]; V2=r[3] if len(r)>3 else V
        a_mano=any(lg['it'][1][0].startswith(k) for k in MANO)
        for cod in ('it','ro'):
            if a_mano: break
            ans=lg[cod][1][1]
            dentro=' '.join(vv(cod,L,C,v) or '' for v in range(V,V2+1))
            if trovato(ans,dentro,cod): continue
            vicini=[v for v in range(max(1,V-3),V2+4) if vv(cod,L,C,v) and trovato(ans,vv(cod,L,C,v),cod)]
            if vicini:
                probl.append(f'{cod} «{ans}» non nel versetto, ma in {C}:{vicini}')
                if correggi and cod=='it' and len(vicini)==1 and V==V2:
                    righe[n-1]=f'{c[0]}|{c[1]}|{L} {C}:{vicini[0]}'; cambi+=1
            else: probl.append(f'{cod} «{ans}» NON TROVATA vicino a {c[2]}')
        if probl:
            male+=1; print(nome, c[2], lg['it'][1][0][:70], '→', lg['it'][1][1], '|', '; '.join(probl))
            if verb:
                for cod in ('it','ro'): print('    ',cod, ' '.join(vv(cod,L,C,v) or '' for v in range(V,V2+1))[:300])
    if cambi: open(f,'w',encoding='utf-8').write('\n'.join(righe)); print(f'  corretti {cambi} riferimenti in {os.path.basename(f)}')
print(f'\n{tot} domande controllate, {male} con qualcosa da guardare')
