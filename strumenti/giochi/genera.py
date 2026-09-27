# -*- coding: utf-8 -*-
"""Prepara i contenuti degli 8 giochi nuovi (dal 9 al 16) → dati/giochi_nuovi.json

I contenuti stanno qui accanto, scritti a mano, in italiano e in rumeno:
  domande.txt       domande a 4 risposte con categoria e livello (Ruota, Sprint, Scalata, Tempio, Codice)
  parole.txt        parole della Parola Misteriosa, con categoria e tre indizi
  versetti.txt      i riferimenti dei versetti di «Costruisci il versetto» (il testo si prende dalla Bibbia del programma)
  sequenze.txt      fatti da mettere in ordine (Tempio, Codice)
  associazioni.txt  coppie da abbinare (Tempio)
  viaggi.json       i viaggi del «Viaggio biblico», tappa per tappa, con la prova di ogni tappa
  codici.json       i livelli del «Codice segreto», con i loro enigmi
Ogni riferimento viene cercato davvero nel testo delle due Bibbie: se un versetto non esiste lo script si ferma.
Con -v stampa accanto a ogni domanda il testo del versetto, per ricontrollarle a occhio.

  cd strumenti/giochi && python3 genera.py [-v]
"""
import json,gzip,base64,re,os,sys,unicodedata

QUI=os.path.dirname(os.path.abspath(__file__))
RADICE=os.path.dirname(os.path.dirname(QUI))
VERBOSO='-v' in sys.argv
errori=[]

BIB=json.load(open(os.path.join(RADICE,'dati','bibbia.json')))
CPL=BIB['cpl']; CAP=BIB['cap']
TESTO={cod:gzip.decompress(base64.b64decode(BIB['v'][cod]['z'])).decode('utf-8').split('\n') for cod in ('it','ro')}
def indice(L,c,v):
    if not(1<=L<=66) or not(1<=c<=CPL[L-1]): return -1
    ic=sum(CPL[:L-1])+c-1
    if not(1<=v<=CAP[ic]): return -1
    return sum(CAP[:ic])+v-1
def versetto(cod,L,c,v):
    i=indice(L,c,v); return TESTO[cod][i] if i>=0 else None

def leggi_rif(s,dove):
    """«43 14:6» oppure «43 14:6-7» → [L,c,v] o [L,c,v,v2]"""
    m=re.fullmatch(r'\s*(\d+)\s+(\d+):(\d+)(?:-(\d+))?\s*',s or '')
    if not m: errori.append(f'{dove}: riferimento non valido «{s}»'); return None
    r=[int(x) for x in m.groups() if x]
    for v in range(r[2],(r[3] if len(r)>3 else r[2])+1):
        if versetto('it',r[0],r[1],v) is None: errori.append(f'{dove}: il versetto {s} non esiste'); return None
    return r

def pul(w):
    w=unicodedata.normalize('NFD',w.lower()); w=''.join(ch for ch in w if unicodedata.category(ch)!='Mn')
    return re.sub(r'[^a-z]','',w.replace('ș','s').replace('ş','s').replace('ț','t').replace('ţ','t')).upper()
def righe(nome):
    for n,r in enumerate(open(os.path.join(QUI,nome),encoding='utf-8'),1):
        r=r.rstrip('\n')
        if r.strip() and not r.lstrip().startswith('#'): yield n,r

# ---------------------------------------------------------------- domande a 4 risposte
CATEGORIE=['personaggi','re','profeti','miracoli','luoghi','at','nt','profezie']
def leggi_domande():
    out=[]; testa=None; lingue={}
    def chiudi():
        if testa is None: return
        n,cat,liv,rif=testa
        if set(lingue)!={'it','ro'}: errori.append(f'{nome_f}:{n}: manca IT o RO'); return
        out.append({'id':'q%03d'%(len(out)+1),'gameType':['ruota','sprint','scalata','tempio'],'category':cat,'difficulty':liv,
                    'question':{k:lingue[k][0] for k in lingue},'answers':{k:lingue[k][1:5] for k in lingue},'correctAnswer':0,
                    'explanation':{k:lingue[k][5] for k in lingue},'biblicalReference':rif})
    import glob
    # le domande di prima (domande.txt) e poi quelle nuove, scritte a parte e controllate con
    # controlla_domande.py (domande_nuove/*.txt, stesso formato)
    nomi=['domande.txt']+sorted(os.path.relpath(p,QUI) for p in glob.glob(os.path.join(QUI,'domande_nuove','*.txt')))
    for nome_f in nomi:
     for n,r in righe(nome_f):
         c=r.split('|')
         if c[0] in ('IT','RO'):
             if len(c)!=7 or not all(x.strip() for x in c): errori.append(f'{nome_f}:{n}: servono 7 campi pieni'); continue
             lingue[c[0].lower()]=[x.strip() for x in c[1:]]
             if len(set(x.lower() for x in c[2:6]))<4: errori.append(f'{nome_f}:{n}: due risposte uguali')
         else:
             chiudi(); lingue={}
             if len(c)!=3 or c[0] not in CATEGORIE or c[1] not in '1234': errori.append(f'{nome_f}:{n}: intestazione sbagliata «{r}»'); testa=None; continue
             testa=(n,c[0],int(c[1]),leggi_rif(c[2],f'domande.txt:{n}'))
    chiudi()
    return out
DOM=leggi_domande()

if VERBOSO:
    for q in DOM:
        L,c,v=q['biblicalReference'][:3]
        print(f"{q['id']} {q['category']}/{q['difficulty']} {q['question']['it']} → {q['answers']['it'][0]}\n   IT {versetto('it',L,c,v)}\n   RO {versetto('ro',L,c,v)}")

# ---------------------------------------------------------------- i file che ci sono già: li leggo se ci sono
def carica_facoltativo(fn,*a):
    return fn(*a) if os.path.exists(os.path.join(QUI,a[0] if a else '')) else []

def leggi_parole(nome='parole.txt'):
    out=[]; testa=None; lingue={}
    def chiudi():
        if testa is None: return
        n,cat,liv,rif=testa
        if set(lingue)!={'it','ro'}: errori.append(f'{nome}:{n}: manca IT o RO'); return
        out.append({'id':'w%03d'%(len(out)+1),'gameType':['parola'],'category':cat,'difficulty':liv,
                    'answer':{k:lingue[k][0] for k in lingue},'hints':{k:lingue[k][1:] for k in lingue},'biblicalReference':rif})
    for n,r in righe(nome):
        c=r.split('|')
        if c[0] in ('IT','RO'):
            if len(c)!=5 or not all(x.strip() for x in c): errori.append(f'{nome}:{n}: servono 5 campi pieni'); continue
            parola=c[1].strip()
            if not re.fullmatch(r"[A-ZÀ-ÖØ-ÞĂÂÎȘȚŞŢ]+",parola): errori.append(f'{nome}:{n}: la parola «{parola}» deve essere una sola, in maiuscolo')
            lingue[c[0].lower()]=[x.strip() for x in c[1:]]
            p=pul(parola)
            for h in c[2:]:
                if any(pul(t)==p for t in re.split(r"[^\wÀ-ÿĂăÂâÎîȘșȚțŞşŢţ]+",h)): errori.append(f'{nome}:{n}: l\'indizio «{h.strip()}» contiene la parola')
        else:
            chiudi(); lingue={}
            if len(c)!=3 or c[1] not in '123': errori.append(f'{nome}:{n}: intestazione sbagliata «{r}»'); testa=None; continue
            testa=(n,c[0],int(c[1]),leggi_rif(c[2],f'{nome}:{n}'))
    chiudi()
    return out

def leggi_versetti(nome='versetti.txt'):
    out=[]
    for n,r in righe(nome):
        c=r.split('|')
        rif=leggi_rif(c[0],f'{nome}:{n}')
        if not rif: continue
        testo={}
        for cod in ('it','ro'):
            pezzi=[versetto(cod,rif[0],rif[1],v) for v in range(rif[2],(rif[3] if len(rif)>3 else rif[2])+1)]
            t=' '.join(pezzi)
            # pulizia: niente spazi prima della punteggiatura, virgolette tipografiche tolte
            t=re.sub(r'\s+([,.;:!?])',r'\1',t)
            t=re.sub(r'[“”„«»"]','',t)
            t=t.replace('  ',' ').strip()
            # comincia con la maiuscola e finisce con un punto (un versetto a volte finisce con la virgola)
            t=re.sub(r'[,;:]$','.',t)
            if t and t[-1] not in '.!?': t+='.'
            t=t[0].upper()+t[1:]
            testo[cod]=t
        out.append({'id':'v%03d'%(len(out)+1),'gameType':['versetto'],'difficulty':int(c[1]) if len(c)>1 and c[1].strip() in '123' else 2,
                    'text':testo,'biblicalReference':rif})
    return out

def leggi_blocchi(nome,campi_min,tipo,prefisso):
    """sequenze e associazioni: «rif» poi IT|… e RO|… con gli elementi in ordine"""
    out=[]; testa=None; lingue={}
    def chiudi():
        if testa is None: return
        n,rif,titolo=testa
        if set(lingue)!={'it','ro'}: errori.append(f'{nome}:{n}: manca IT o RO'); return
        if len(lingue['it'])!=len(lingue['ro']): errori.append(f'{nome}:{n}: IT e RO hanno un numero diverso di elementi')
        out.append({'id':prefisso+'%03d'%(len(out)+1),'gameType':[tipo],'items':lingue.copy(),'biblicalReference':rif})
    for n,r in righe(nome):
        c=r.split('|')
        if c[0] in ('IT','RO'):
            el=[x.strip() for x in c[1:] if x.strip()]
            if len(el)<campi_min: errori.append(f'{nome}:{n}: troppo pochi elementi')
            lingue[c[0].lower()]=el
        else:
            chiudi(); lingue={}
            testa=(n,leggi_rif(c[0],f'{nome}:{n}'),None)
    chiudi()
    return out

def esiste(n): return os.path.exists(os.path.join(QUI,n))
PAR=leggi_parole() if esiste('parole.txt') else []
VER=leggi_versetti() if esiste('versetti.txt') else []
SEQ=leggi_blocchi('sequenze.txt',3,'sequenza','s') if esiste('sequenze.txt') else []
ASS=leggi_blocchi('associazioni.txt',4,'associazione','a') if esiste('associazioni.txt') else []

def controlla_rif_json(o,dove):
    """dentro ai viaggi e ai codici i riferimenti sono stringhe «L c:v»: le trasformo e le controllo"""
    if isinstance(o,dict):
        for k,v in list(o.items()):
            if k in ('rif','biblicalReference') and isinstance(v,str): o[k]=leggi_rif(v,dove)
            else: controlla_rif_json(v,dove)
    elif isinstance(o,list):
        for x in o: controlla_rif_json(x,dove)
VIAG=json.load(open(os.path.join(QUI,'viaggi.json'),encoding='utf-8')) if esiste('viaggi.json') else []
controlla_rif_json(VIAG,'viaggi.json')
# ---- i viaggi scritti a righe: viaggi/luoghi.txt (i luoghi con le coordinate) e viaggi/NN_*.txt ----
# Forma di un viaggio (la prima risposta è quella giusta; nelle prove «ordina» le voci sono già in ordine):
#   = id | icona | titolo italiano | titolo rumeno | riferimento del viaggio («1 28:10»)
#   @ luogo | riferimento [| nome italiano | nome rumeno, se diverso da luoghi.txt]
#   it: che cosa accadde lì            ro: …
#   ? luogo|evento|personaggio|domanda|ordina|puzzle | riferimento   (dalla seconda tappa in poi)
#   qi: la domanda in italiano         qr: …
#   ai: giusta | sbagliata | sbagliata | sbagliata      ar: …      (puzzle: ai/ar = la parola da ricomporre)
import glob
def leggi_viaggi_testo():
    cart=os.path.join(QUI,'viaggi')
    if not os.path.isdir(cart): return []
    LUO={}
    for n,r in righe(os.path.join('viaggi','luoghi.txt')):
        c=[x.strip() for x in r.split('|')]
        if len(c)!=5: errori.append(f'luoghi.txt:{n}: servono 5 campi'); continue
        if c[0] in LUO: errori.append(f'luoghi.txt:{n}: luogo doppio {c[0]}')
        LUO[c[0]]={'it':c[1],'ro':c[2],'lat':float(c[3]),'lon':float(c[4])}
    out=[]
    for f in sorted(glob.glob(os.path.join(cart,'[0-9]*.txt'))):
        nome=os.path.basename(f); v=t=pr=None
        for n,r in righe(os.path.join('viaggi',nome)):
            dove=f'viaggi/{nome}:{n}'; r=r.strip()
            try:
                if r.startswith('='):
                    c=[x.strip() for x in r[1:].split('|')]
                    v={'id':c[0],'ic':c[1],'titolo':{'it':c[2],'ro':c[3]},'rif':leggi_rif(c[4],dove),'tappe':[],'_d':dove}
                    out.append(v); t=pr=None; continue
                if r.startswith('@'):
                    c=[x.strip() for x in r[1:].split('|')]
                    if c[0] not in LUO: errori.append(f'{dove}: luogo sconosciuto «{c[0]}»'); t={'fatto':{}}; continue
                    l=LUO[c[0]]
                    t={'luogo':{'it':c[2] if len(c)>2 and c[2] else l['it'],'ro':c[3] if len(c)>3 and c[3] else l['ro']},
                       'lat':l['lat'],'lon':l['lon'],'rif':leggi_rif(c[1],dove),'fatto':{},'_d':dove}
                    v['tappe'].append(t); pr=None; continue
                if r.startswith('?'):
                    c=[x.strip() for x in r[1:].split('|')]
                    if c[0] not in ('luogo','evento','personaggio','domanda','ordina','puzzle'): errori.append(f'{dove}: tipo di prova sconosciuto «{c[0]}»')
                    if 'prova' in t: errori.append(f'{dove}: due prove nella stessa tappa')
                    pr={'tipo':c[0],'rif':leggi_rif(c[1],dove),'q':{},'_d':dove}; t['prova']=pr; continue
                k,_,testo=r.partition(':'); k=k.strip(); testo=testo.strip()
                if k in ('it','ro','qi','qr') and len(testo)<12: errori.append(f'{dove}: testo troppo corto (segnaposto?) «{testo}»')
                lg={'i':'it','r':'ro'}.get(k[-1:])
                if k in ('it','ro'): t['fatto'][k]=testo
                elif k in ('qi','qr'): pr['q'][lg]=testo
                elif k in ('ai','ar'):
                    voci=[x.strip() for x in testo.split('|')]
                    if pr['tipo']=='ordina': pr.setdefault('items',{})[lg]=voci
                    elif pr['tipo']=='puzzle': pr.setdefault('parola',{})[lg]=voci[0]
                    else: pr.setdefault('a',{})[lg]=voci[0]; pr.setdefault('w',{})[lg]=voci[1:]
                else: errori.append(f'{dove}: riga non capita «{r[:40]}»')
            except Exception as e: errori.append(f'{dove}: {e}')
    ids=set()
    for v in out:
        d=v['_d']
        if v['id'] in ids: errori.append(f'{d}: id doppio {v["id"]}')
        ids.add(v['id'])
        if len(v['tappe'])<3: errori.append(f'{d}: servono almeno 3 tappe')
        for i,t in enumerate(v['tappe']):
            dt=t.get('_d',d)
            if set(t.get('fatto',{}))!={'it','ro'}: errori.append(f'{dt}: manca «it:» o «ro:»')
            p=t.get('prova')
            if i==0:
                if p: errori.append(f'{dt}: la prima tappa è la partenza, senza prova')
                continue
            if not p: errori.append(f'{dt}: manca la prova'); continue
            if set(p['q'])!={'it','ro'}: errori.append(f'{dt}: manca qi o qr')
            if p['tipo']=='ordina':
                it,ro=p.get('items',{}).get('it',[]),p.get('items',{}).get('ro',[])
                if len(it)<3 or len(it)!=len(ro): errori.append(f'{dt}: ordina: servono almeno 3 voci, uguali nelle due lingue')
            elif p['tipo']=='puzzle':
                for lg in ('it','ro'):
                    w=pul(p.get('parola',{}).get(lg,''))
                    if not 3<=len(w)<=12: errori.append(f'{dt}: puzzle: la parola ({lg}) deve avere da 3 a 12 lettere')
            else:
                for lg in ('it','ro'):
                    o=[p.get('a',{}).get(lg,'')]+p.get('w',{}).get(lg,[])
                    if len(o)!=4 or not all(o): errori.append(f'{dt}: servono 4 risposte in {lg}')
                    elif len(set(x.lower() for x in o))!=4: errori.append(f'{dt}: risposte doppie in {lg}')
            p.pop('_d',None)
        for t in v['tappe']: t.pop('_d',None)
        v.pop('_d',None)
    return out
_nuovi=leggi_viaggi_testo()
_gia={v['id'] for v in VIAG}
for v in _nuovi:
    if v['id'] in _gia: errori.append(f'viaggio {v["id"]}: c\'è già in viaggi.json')
# tutti i viaggi in ordine biblico (dal riferimento del viaggio)
VIAG=sorted(VIAG+_nuovi,key=lambda v:tuple(v.get('rif') or [99,0,0])[:3])
COD=json.load(open(os.path.join(QUI,'codici.json'),encoding='utf-8')) if esiste('codici.json') else []
controlla_rif_json(COD,'codici.json')

# ---- Codice segreto: 300 scrigni per lingua, divisi per difficoltà ----
# Gli 11 scrigni scritti a mano valgono per tutte e due le lingue; gli altri si fanno qui dalle
# domande già controllate del programma (dati/domande_10000.json, ognuna col suo versetto):
# facile = 3 enigmi fra le domande facili, media = 4 fra le medie, difficile = 5 fra le forti ed
# esperte (fino a due con il numero da scrivere nel tastierino). Ogni risposta giusta dà un
# pezzo del codice. Si rifanno sempre uguali (il caso parte da un seme fisso).
import random
DIF_A_MANO={'creazione':1,'arca':1,'gesu':1,'giuseppe':1,'esodo':2,'davide':2,'gerico':2,'sinai':2,
            'babilonia':3,'apostoli':3,'apocalisse':3}
for c in COD: c.setdefault('dif',DIF_A_MANO.get(c['id'],2))
sys.path.insert(0,os.path.join(RADICE,'dati'))
from libri import LIBRI as _LIB
def _ic_libro(L):
    if L<=5: return '📜'
    if L<=17: return '🏛️'
    if L<=22: return '🎵'
    if L<=39: return '📯'
    if L<=43: return '✝️'
    if L==44: return '⛵'
    if L<=65: return '✉️'
    return '👑'
DOMANDE_TUTTE=json.load(open(os.path.join(RADICE,'dati','domande_10000.json'),encoding='utf-8'))
QUANTI_PER_LINGUA=300
def genera_codici(lg):
    rnd=random.Random('codici-'+lg)
    mano=[c for c in COD if not c.get('lg') or c.get('lg')==lg]
    resto=QUANTI_PER_LINGUA-len(mano)
    per_dif={1:resto//3+(1 if resto%3>0 else 0),2:resto//3+(1 if resto%3>1 else 0),3:resto//3}
    usate=set(); out=[]
    for dif,(livelli,n_enigmi) in {1:((1,),3),2:((2,),4),3:((3,4),5)}.items():
        pool=[q for q in DOMANDE_TUTTE if q['lg']==lg and q.get('dif',2) in livelli and q['d'] not in usate]
        rnd.shuffle(pool)
        per_libro={}
        for q in pool: per_libro.setdefault(q['L'],[]).append(q)
        # un libro alla volta, a giro, così gli scrigni non sono tutti di Genesi
        libri=sorted(per_libro); fatti=0; conta_libro={}
        while fatti<per_dif[dif] and libri:
            for L in list(libri):
                if fatti>=per_dif[dif]: break
                qs=per_libro[L]
                if len(qs)<n_enigmi: libri.remove(L); continue
                scelte=[]
                num=[q for q in qs if re.fullmatch(r'\d{1,3}',q['o'][q['g']].strip())]
                if dif==3:
                    for q in num[:rnd.choice((1,2))]: scelte.append(q)
                for q in qs:
                    if len(scelte)>=n_enigmi: break
                    if q in scelte: continue
                    if dif<3 and q in num and rnd.random()<0.5: pass
                    scelte.append(q)
                if len(scelte)<n_enigmi: libri.remove(L); continue
                for q in scelte: qs.remove(q); usate.add(q['d'])
                rnd.shuffle(scelte)
                conta_libro[L]=conta_libro.get(L,0)+1
                nome=_LIB[L-1][1 if lg=='it' else 2]
                tit=(f"Codice di {nome}" if lg=='it' else f"Codul din {nome}")+f" {conta_libro[L]}"
                enigmi=[]
                for q in scelte:
                    giusta=q['o'][q['g']].strip()
                    cerca=(f"Cerca in {q['v']}." if lg=='it' else f"Caută în {q['v']}.") if q.get('v') else \
                          ("Rileggi il libro di "+nome+"." if lg=='it' else "Recitește cartea "+nome+".")
                    if dif==3 and re.fullmatch(r'\d{1,3}',giusta) and len([e for e in enigmi if e['tipo']=='num'])<2:
                        enigmi.append({'tipo':'num','q':{lg:q['d']},'a':giusta,'hint':{lg:cerca}})
                    else:
                        enigmi.append({'tipo':'scelta','q':{lg:q['d']},'a':{lg:giusta},
                                       'w':{lg:[x.strip() for k,x in enumerate(q['o']) if k!=q['g']]},
                                       'parte':str(rnd.randint(1,9)),'hint':{lg:cerca}})
                out.append({'id':f"g{lg}{dif}{fatti+1:03d}",'lg':lg,'dif':dif,'ic':_ic_libro(L),
                            'titolo':{lg:tit},'enigmi':enigmi})
                fatti+=1
        if fatti<per_dif[dif]: errori.append(f'codici {lg}: solo {fatti} scrigni di difficoltà {dif} su {per_dif[dif]}')
    return out
COD=COD+genera_codici('it')+genera_codici('ro')

if errori:
    print('\n'.join(errori)); sys.exit(1)

out={'domande':DOM,'parole':PAR,'versetti':VER,'sequenze':SEQ,'associazioni':ASS,'viaggi':VIAG,'codici':COD}
json.dump(out,open(os.path.join(RADICE,'dati','giochi_nuovi.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
cont={}
for q in DOM: cont[q['category']]=cont.get(q['category'],0)+1
liv={}
for q in DOM: liv[q['difficulty']]=liv.get(q['difficulty'],0)+1
print(f"domande {len(DOM)} {cont} livelli {liv}")
print(f"parole {len(PAR)} · versetti {len(VER)} · sequenze {len(SEQ)} · associazioni {len(ASS)} · viaggi {len(VIAG)} ({sum(len(v.get('tappe',[])) for v in VIAG)} tappe) · codici {len(COD)} (per lingua: it {len([c for c in COD if c.get('lg') in (None,'it')])}, ro {len([c for c in COD if c.get('lg') in (None,'ro')])})")
print('scritto dati/giochi_nuovi.json')
