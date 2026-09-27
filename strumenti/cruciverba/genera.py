# -*- coding: utf-8 -*-
"""Prepara il mucchio di parole del Cruciverba per lingua, ognuna con il suo indizio.

Ogni parola ha un indizio VERO, mai «Antico Testamento · 34 capitoli»:
  1. indizi scritti a mano (strumenti/cruciverba/indizi*.txt): persone, luoghi,
     cose, avvenimenti, popoli e qualche libro, con una domanda o una
     definizione (tipo p/l/c/e/t/b);
  2. domande bibliche GIÀ dentro al programma (dati/domande_10000.json) la cui
     risposta giusta è UNA parola (tolti articoli e «il monte», «la città di»…,
     e i numeri scritti a lettere): l'indizio è la domanda stessa (tipo d);
     tolte quelle che chiedono «in quale libro si trova?» (le risposte sarebbero
     nomi di libri) e quelle che dipendono da «questo capitolo»;
  3. i personaggi di «Chi ha detto?» (tipo p): l'indizio è una loro frase,
     scelta dal programma ogni volta;
  4. versetti da completare (tipo v): l'indizio è un versetto preso dal testo
     stesso, con la parola tolta — niente è inventato. Servono a arrivare al
     totale voluto (TOTALE = 5.000 per lingua): sono quelli che mancano dopo aver
     preso TUTTE le parole con una domanda o una definizione vera, presi a passo
     regolare fra le parole più e meno usate della Bibbia. Nel cruciverba però
     i versetti pesano poco: il programma mette prima le parole con l'indizio
     vero (CRV_QUOTA_VERE), quindi in un cruciverba ce ne sono 1 o 2 su 14.
Ogni livello (facile, medio, difficile) ha lo stesso numero di parole.
Se la stessa parola sta in più fonti vince la prima dell'elenco (ma un
personaggio tiene anche la sua frase di «Chi ha detto?»).
I nomi propri veri della Bibbia sono ~3.000 per lingua: per questo con solo nomi,
luoghi e domande non si arriva a 5.000 e il resto sono versetti.
Scrive dati/cruciverba_parole.json.

  cd strumenti/cruciverba && python3 genera.py
"""
import json,gzip,base64,re,unicodedata,os,sys,collections

QUI=os.path.dirname(os.path.abspath(__file__))
RADICE=os.path.dirname(os.path.dirname(QUI))
sys.path.insert(0,os.path.join(RADICE,'dati'))
from libri import LIBRI

TOTALE=5000             # parole in tutto, per lingua (le mancanti sono versetti da completare)
MINLEN,MAXLEN=3,13

def pul(w):
    """come _pulisciParola() del programma: solo A-Z maiuscole"""
    w=unicodedata.normalize('NFD',w.lower())
    w=''.join(c for c in w if unicodedata.category(c)!='Mn')
    w=w.replace('ș','s').replace('ş','s').replace('ț','t').replace('ţ','t')
    return re.sub(r'[^a-z]','',w).upper()

BIB=json.load(open(os.path.join(RADICE,'dati','bibbia.json')))
CHD=json.load(open(os.path.join(RADICE,'dati','chihadetto_nuovo.json')))
try: CHD_EST=json.load(open(os.path.join(RADICE,'dati','chihadetto_estensione.json')))
except OSError: CHD_EST=[]
DOM=json.load(open(os.path.join(RADICE,'dati','domande_10000.json')))

# ------------------------------------------------------------------ parole da NON usare
# parole grammaticali (articoli, preposizioni, pronomi, congiunzioni, avverbi,
# ausiliari): sarebbero risposte senza senso in un cruciverba
STOP_IT=set("""
DELLA DELLE DELLO DEGLI NELLA NELLE NELLO NEGLI SULLA SULLE SULLO SUGLI DALLA DALLE DALLO DAGLI ALLA ALLE ALLO AGLI
SENZA SOPRA SOTTO DENTRO FUORI DAVANTI DIETRO VERSO CONTRO INTORNO ATTORNO ATTRAVERSO PRESSO DURANTE MEDIANTE OLTRE
FINO ENTRO LUNGO INSIEME ASSIEME INCONTRO INDIETRO ADDOSSO RIGUARDO SECONDO DOPO PRIMA DOVE QUANDO MENTRE FINCHE
AFFINCHE PERCHE POICHE PERCIO QUINDI DUNQUE INFATTI TUTTAVIA INVECE INOLTRE ANZI PERO ANCHE PURE ANCORA SEMPRE ORMAI
ALLORA COSI COME COMUNQUE ECCO OGNI ALCUN ALCUNO ALCUNA ALCUNI ALCUNE NESSUN NESSUNO NESSUNA QUALCHE QUALCUNO QUALCOSA
QUALUNQUE CIASCUNO CIASCUNA OGNUNO CHIUNQUE TUTTO TUTTA TUTTI TUTTE ALTRO ALTRA ALTRI ALTRE STESSO STESSA STESSI STESSE
MEDESIMO QUESTO QUESTA QUESTI QUESTE QUELLO QUELLA QUELLI QUELLE QUEGLI QUEL COLUI COLEI COLORO COSTUI COSTORO ESSO ESSA
ESSI ESSE EGLI ELLA LORO SUOI TUOI MIEI VOSTRO VOSTRA VOSTRI VOSTRE NOSTRO NOSTRA NOSTRI NOSTRE PROPRIO PROPRIA QUALE
QUALI QUANTO QUANTA QUANTI QUANTE TANTO TANTA TROPPO MOLTO MOLTA MOLTI MOLTE POCO MENO ABBASTANZA SIANO FOSSE FOSSERO
SARA SARANNO SARAI SARETE SARO SAREBBE SIETE SIAMO SONO ERANO STATO STATA STATI STATE ESSERE ESSENDO AVERE AVEVA AVEVANO
AVEVO AVETE ABBIAMO ABBIA ABBIANO AVRA AVRANNO AVRAI AVREBBE HANNO AVUTO AVENDO FARA FARO FARAI FARANNO FARETE POSSA
POTRA POTERE POSSONO DEVE DEVONO DOVRA VUOLE VOGLIO ALCUNI STANNO STAVA STAVANO ANDO ANDARE VENIRE VIENE VENNE
DELL NELL SULL DALL QUEST QUELL SULL COLLE FORSE FINCHE OGGI QUI MAI GIA DEH AMEN COSA COSE
""".split())
STOP_RO=set("""
CARE ESTE PENTRU CACI CAND DUPA SUNT DACA TOATE INAINTEA FACUT FOST IATA PANA TOTI PRIN IMPOTRIVA CUM TINE PESTE ACEASTA
NICI ACEEA ACESTA ATUNCI FARA VETI TOATA ACOLO VENIT DECAT CELOR APOI DOUA ASTFEL AVEA MELE ACUM NISTE SPRE ALE FIECARE
INTRE DESPRE AFARA MULT NIMIC ASUPRA CHIAR CELUI LANGA VOASTRE INAINTE UNUL NIMENI ESTI DINTRE NUMAI FIINDCA IARASI
POATE TUTUROR OARE INAPOI VOASTRA VOSTRU NOSTRU NOASTRA NOASTRE NOSTRI ACELA ACESTE ACESTEA ACESTIA ACEIA ACEEASI ACELASI
ACESTOR ACESTUIA ACESTEIA ACEST TOTUSI PRINTRE CATRE FOARTE NICIO NICIUN NICIUNUL ALTUL ALTA ALTII ALTE ORICE ORICINE
CATE AICI ASTAZI UNII UNUI UNEI UNELE MULTI MULTE MULTA DINTAI TREBUIE ASA CEEA CEVA CINEVA ADICA DECI INSA MACAR CUMVA
TOTDEAUNA NICIODATA PRECUM ASEMENEA AVETI AVEAU AVUT SUNTEM SUNTETI ERAU FIICA SPUS ZIS ZICE ZICAND
INTR DINTR PRICEPUT IMPREUNA DEASUPRA DINAINTEA DEPARTE APROAPE PRINTRE
""".split())

# ------------------------------------------------------------------ la Bibbia, versetto per versetto
def versetti(cod):
    testo=gzip.decompress(base64.b64decode(BIB['v'][cod]['z'])).decode('utf-8')
    righe=testo.split('\n')
    cpl=BIB['cpl']; capv=BIB['cap']
    out=[]; ir=0; ic=0
    for Li in range(len(cpl)):
        for c in range(1,cpl[Li]+1):
            nv=capv[ic]; ic+=1
            for v in range(1,nv+1):
                out.append((Li+1,c,v,righe[ir].strip())); ir+=1
    return out

PAT_PAROLA=re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿĂăÂâÎîȘșȚțŞşŢţ]+")
SEGNO='______'

def nome_libro(cod,L): return LIBRI[L-1][2] if cod=='ro' else LIBRI[L-1][1]

def frammento(testo,ini,fin,massimo=150):
    """la frase con la parola tolta; se è lunga, una finestra intorno"""
    prima,dopo=testo[:ini],testo[fin:]
    if len(testo)<=massimo: return prima+SEGNO+dopo
    pw=prima.split(); dw=dopo.split()
    a=pw[-10:]; b=dw[:8]
    s=' '.join(a)+(' ' if a else '')+SEGNO+(' ' if b else '')+' '.join(b)
    if len(pw)>10: s='…'+s
    if len(dw)>8: s=s+'…'
    return s.strip()

def parole_versetti(cod,stop):
    """le parole della Bibbia per frequenza, ognuna col suo versetto migliore"""
    V=versetti(cod)
    conta=collections.Counter(); forme=collections.defaultdict(collections.Counter)
    occ=collections.defaultdict(list)          # parola -> [(indice versetto, ini, fin, forma)]
    for vi,(L,c,v,t) in enumerate(V):
        for m in PAT_PAROLA.finditer(t):
            g=m.group(0)
            if t[m.end():m.end()+1] in ("'","’"): continue      # «dell'», «un'»: pezzi, non parole
            p=pul(g)
            if not (4<=len(p)<=MAXLEN): continue
            conta[p]+=1; f=g.lower(); forme[p][f]+=1
            occ[p].append((vi,m.start(),m.end(),f))
    ordine=[p for p,_ in sorted(conta.items(),key=lambda kv:(-kv[1],kv[0])) if p not in stop]
    return V,ordine,conta,forme,occ

def scegli_versetto(p,V,forme,occ):
    """il versetto in cui la parola sta meglio: una frase intera di lunghezza
    giusta dove la parola compare una volta sola, nella forma più usata"""
    dominante=forme[p].most_common(1)[0][0]
    per_versetto=collections.Counter(o[0] for o in occ[p])
    migliore=None
    for vi,ini,fin,f in occ[p]:
        if f!=dominante or per_versetto[vi]>1: continue
        t=V[vi][3]
        pt=abs(len(t)-85)
        if not t[:1].isupper(): pt+=30
        if t[-1:] not in '.!?;:”»': pt+=8
        if ini<3: pt+=6
        if migliore is None or pt<migliore[0]: migliore=(pt,vi,ini,fin)
    if migliore is None:
        # nessun versetto «pulito»: uso il primo e tolgo tutte le occorrenze
        vi,ini,fin,f=occ[p][0]
        return vi,ini,fin
    return migliore[1],migliore[2],migliore[3]

# ------------------------------------------------------------------ 1. indizi scritti a mano
TIPI='plcetb'
def leggi_a_mano():
    """indizi.txt: RISPOSTA_IT|RISPOSTA_RO|livello|libro|tipo|indizio it|indizio ro"""
    out={'it':[],'ro':[]}
    for nomefile in sorted(x for x in os.listdir(QUI) if re.fullmatch(r'indizi.*\.txt',x)):
        for n,riga in enumerate(open(os.path.join(QUI,nomefile),encoding='utf-8'),1):
            riga=riga.strip()
            if not riga or riga.startswith('#'): continue
            f=[x.strip() for x in riga.split('|')]
            dove=f'{nomefile} riga {n}'
            if len(f)!=7: raise SystemExit(f'{dove}: servono 7 campi, ne ho {len(f)}: {riga[:80]}')
            ait,aro,liv,L,tipo,cit,cro=f
            if tipo not in TIPI: raise SystemExit(f'{dove}: tipo «{tipo}» sconosciuto')
            if liv not in ('1','2','3'): raise SystemExit(f'{dove}: livello «{liv}»')
            for lg,a,cl in (('it',ait,cit),('ro',aro,cro)):
                if not a or not cl: continue
                w=pul(a)
                if not (MINLEN<=len(w)<=MAXLEN): raise SystemExit(f'{dove}: «{a}» ({lg}) ha {len(w)} lettere')
                if w in pul_parole(cl): raise SystemExit(f'{dove}: l\'indizio ({lg}) contiene la risposta {w}')
                out[lg].append({'w':w,'liv':int(liv),'L':int(L),'tipo':tipo,'cl':cl})
    return out
def pul_parole(s): return {pul(x) for x in PAT_PAROLA.findall(s)}

# ------------------------------------------------------------------ i libri della Bibbia (pochissimi)
def leggi_libri():
    """libri.txt: LIBRO|RISPOSTA_IT|RISPOSTA_RO|indizio it|indizio ro — una riga per libro con il
    nome di UNA parola. Servono al tema «Libri della Bibbia»; nel mucchio generale entrano solo
    se la parola non c'è già (Isaia, Daniele… restano persone)."""
    out={'it':[],'ro':[]}
    p=os.path.join(QUI,'libri.txt')
    if not os.path.exists(p): return out
    for n,riga in enumerate(open(p,encoding='utf-8'),1):
        riga=riga.strip()
        if not riga or riga.startswith('#'): continue
        f=[x.strip() for x in riga.split('|')]
        if len(f)!=5: raise SystemExit(f'libri.txt riga {n}: servono 5 campi')
        L,ait,aro,cit,cro=f
        for lg,a,cl in (('it',ait,cit),('ro',aro,cro)):
            if not a or not cl: continue
            w=pul(a)
            if not (MINLEN<=len(w)<=MAXLEN): raise SystemExit(f'libri.txt riga {n}: «{a}» ({lg}) ha {len(w)} lettere')
            if w in pul_parole(cl): raise SystemExit(f'libri.txt riga {n}: l\'indizio ({lg}) contiene la risposta {w}')
            out[lg].append({'w':w,'liv':0,'L':int(L),'tipo':'b','cl':cl})
    return out

# ------------------------------------------------------------------ 2. domande già nel programma
ESCLUDI_Q=re.compile(r"in quale libro|capitol|all'inizio|alla fine|acestei|acestui|cărții|"
                     r"quest[oaie]\s+(?:episodio|preghiera|visione|profezia|brano|salmo|testo|parabola|storia|passo|discorso|"
                     r"racconto|lettera|libro|capitolo|versetto|sogno|scena|momento|punto|caso|contesto|genealogia|elenco|lista)|"
                     r"secondo il testo|in questo|di questo|di questa|"
                     r"în care carte|capitolul \d|la început|la sfârşit|la sfârșit|"
                     r"acest(?:a|e|ei|ui)?\s+(?:episod|rugăciune|viziune|profeţie|profeție|pasaj|psalm|text|parabol|poveste|"
                     r"discurs|scrisoare|carte|capitol|verset|vis|scen|moment|caz|context|genealogie|list)|"
                     r"\.\.\.|…|:\?|\?\?",re.I)
GENERICHE_IT=set("NESSUNO NESSUNA NIENTE NULLA TUTTI TUTTE TUTTO ENTRAMBI ENTRAMBE AMBEDUE VERO FALSO QUESTO QUELLO ALTRO ALTRI SEMPRE MAI SOLO MOLTE MOLTI CHIUNQUE UGUALE GIUNTO PARZIALMENTE SUBITO".split())
GENERICHE_RO=set("NIMENI NIMIC TOTI TOATE TOT AMANDOI AMANDOUA ADEVARAT FALS ACESTA ACELA ALTUL ALTII MEREU NICIODATA NICIUNA NICIUN NICIUNUL".split())
# articoli e preposizioni che stanno davanti alla risposta («Il Giordano», «A Betlemme», «În Egipt»)
ART_IT=set("il lo la le i gli l un uno una un di del dello della dei degli delle dell a ad al allo alla ai agli alle all "
           "in nel nello nella nei negli nelle nell su sul sullo sulla sui sugli sulle sull da dal dallo dalla dai dagli dalle dall "
           "con col per tra fra presso verso oltre dentro sopra sotto davanti".split())
ART_RO=set("în la pe din cu de pentru spre către catre între intre o un niște niste al a ale lui".split())
# nomi comuni che precedono il nome proprio («il monte Nebo» → NEBO)
GENER_IT=set("monte monti fiume fiumi città citta valle mare regno paese terra isola deserto torrente lago colle collina re regina "
             "profeta profetessa apostolo discepolo sacerdote giudice figlio figlia padre madre fratello sorella moglie marito servo "
             "capo popolo tribù tribu casa villaggio pozzo fonte sorgente giardino campo luogo provincia regione tempio santuario "
             "porta strada libro lettera salmo festa".split())
GENER_RO=set("muntele munte râul raul râu cetatea cetate orașul orasul oraşul valea vale marea mare țara ţara tara pământul pamantul "
             "insula pustia deșertul desertul torentul lacul dealul împăratul imparatul regele prorocul proorocul profetul apostolul "
             "ucenicul preotul judecătorul fiul fiica tatăl mama fratele sora soția soţia robul căpetenia capetenia poporul seminția "
             "seminţia casa satul fântâna fantana izvorul grădina gradina ogorul locul ținutul tinutul templul cartea epistola psalmul "
             "sărbătoarea sarbatoarea pârâul paraul pârâu paraul valea marea muntele râul".split())
RX_PAROLA=re.compile(r"[^\W\d_]+(?:-[^\W\d_]+)*")

def pezzi_risposta(a,lg):
    """la risposta senza articoli, preposizioni e nomi comuni davanti: la lista delle parole che restano"""
    art=ART_RO if lg=='ro' else ART_IT; gen=GENER_RO if lg=='ro' else GENER_IT
    a=a.strip().rstrip('.!?;:,')
    a=re.sub(r"(\b[A-Za-zÀ-ÿ]{1,5})['’](?=\S)",r"\1 ",a)          # «L'Egitto» → «L Egitto»
    t=a.split()
    while t:
        k=t[0].lower()
        if k in art: t=t[1:]; continue
        if k in gen and len(t)>1 and t[1][:1].isupper(): t=t[1:]; continue
        # «la città di Ebron», «il paese di Madian»: resta il nome proprio
        if k in gen and len(t)>2 and t[1].lower() in art and t[2][:1].isupper(): t=t[2:]; continue
        break
    return t

def risposta_persa(w,d):
    """la domanda contiene già la risposta, anche in un'altra forma («Betleem» / «Betleemului»)?"""
    for q in pul_parole(d):
        if q==w: return True
        if len(w)>=5 and len(q)>=5 and (q.startswith(w[:-1]) or w.startswith(q[:-1])): return True
    return False

# ---- i numeri scritti a lettere (le domande «Quanti…?» hanno la risposta in cifre) ----
_IT_U=['zero','uno','due','tre','quattro','cinque','sei','sette','otto','nove','dieci','undici','dodici','tredici',
       'quattordici','quindici','sedici','diciassette','diciotto','diciannove']
_IT_D=['','','venti','trenta','quaranta','cinquanta','sessanta','settanta','ottanta','novanta']
def it_numero(n):
    if n<20: return _IT_U[n]
    if n<100:
        d,u=divmod(n,10); b=_IT_D[d]
        if u in (1,8): b=b[:-1]
        return b+('tré' if u==3 else _IT_U[u] if u else '')
    if n<1000:
        c,r=divmod(n,100); b='cento' if c==1 else _IT_U[c]+'cento'
        if r==0: return b
        if 80<=r<90: b=b[:-1]
        return b+it_numero(r)
    if n<1000000:
        m,r=divmod(n,1000); b='mille' if m==1 else it_numero(m)+'mila'
        return b+(it_numero(r) if r else '')
    return None
# in rumeno uno, due e i loro composti cambiano col genere del nome: li lascio fuori, restano quelli che non cambiano
_RO_N={3:'trei',4:'patru',5:'cinci',6:'șase',7:'șapte',8:'opt',9:'nouă',10:'zece',11:'unsprezece',13:'treisprezece',
       14:'paisprezece',15:'cincisprezece',16:'șaisprezece',17:'șaptesprezece',18:'optsprezece',19:'nouăsprezece',
       20:'douăzeci',30:'treizeci',40:'patruzeci',50:'cincizeci',60:'șaizeci',70:'șaptezeci',80:'optzeci',90:'nouăzeci'}
def numero_parola(cifre,lg):
    try: n=int(re.sub(r"[.\s]","",cifre))
    except ValueError: return None
    if lg=='ro': return _RO_N.get(n)
    return it_numero(n) if n>=2 else None

# nomi troppo generici per dire di chi parla una domanda («Quanti anni è stato re sopra Israele?» non dice quale re)
NOMI_GENERICI=set("israele giuda dio signore eterno israeliti bibbia testamento gesù gesu cristo israel iuda dumnezeu domnul biblia testament isus hristos".split())
def ha_nome_preciso(d):
    """la domanda nomina qualcuno o qualcosa di preciso (una parola maiuscola in mezzo alla frase, non generica)"""
    for m in re.finditer(r"(?<=\s)[A-ZÀ-ÝĂÂÎȘȚŞŢ][\w'’-]+",d):
        if m.group(0).lower().strip("'’") not in NOMI_GENERICI: return True
    return False

def da_domande(lg):
    gen=GENERICHE_RO if lg=='ro' else GENERICHE_IT
    per=collections.defaultdict(list)
    for q in DOM:
        if q['lg']!=lg: continue
        a0=q['o'][q['g']].strip()
        t=pezzi_risposta(a0,lg)
        if not t or len(t)>2: continue
        if len(t)==1 and re.fullmatch(r"[\d.\s]+",t[0]):
            w0=numero_parola(t[0],lg)
            if not w0: continue
            w=pul(w0)
            dq=re.sub(r"\s+"," ",q['d']).strip()
            if not ha_nome_preciso(dq): continue          # un numero senza dire di chi si parla non è un indizio
        else:
            if not all(RX_PAROLA.fullmatch(x) for x in t): continue          # niente «46. 500», «1 Re»
            if len(t)==2 and not t[1][:1].isupper(): continue                 # «Veniva ucciso»: non è un nome
            w=pul(''.join(t))
        if not (MINLEN<=len(w)<=MAXLEN) or w in gen: continue
        d=re.sub(r"\s+"," ",q['d']).strip()
        if ESCLUDI_Q.search(d) or len(d)>170 or len(d)<14: continue
        # una domanda troppo generica («Chi ha vinto la guerra?») non basta: ci vuole un nome o una cifra
        if len(d.split())<8 and not re.search(r"\d|(?<=\s)[A-ZÀ-Ý]",d): continue
        if risposta_persa(w,d): continue
        d=re.sub(r"\s*:\s*$","…",d)          # «Il padre di X è stato:» -> «…»
        liv=1 if q.get('dif',2)<=1 else 2 if q.get('dif',2)==2 else 3
        per[w].append({'w':w,'liv':liv,'L':q['L'],'tipo':'d','cl':d})
    out=[]
    for w,lista in per.items():
        visti=set(); scelte=[]
        for e in lista:
            if e['cl'] in visti: continue
            visti.add(e['cl']); scelte.append(e)
        out.append({'w':w,'liv':min(e['liv'] for e in scelte),'L':scelte[0]['L'],'tipo':'d','cl':[e['cl'] for e in scelte[:3]]})
    return out

# ------------------------------------------------------------------ 3. personaggi di «Chi ha detto?»
def da_personaggi(lg):
    nomi=CHD['p'][lg]
    quante=collections.Counter(); libri={}
    for c in CHD['d']+CHD_EST:
        if c['lg']==lg:
            quante[c['chi']]+=1; libri.setdefault(c['chi'],c['L'])
    out=[]; viste=set()
    for i,nome in enumerate(nomi):
        if re.search(r"['\-]",nome): continue
        w=pul(nome)
        if not (MINLEN<=len(w)<=MAXLEN) or w in viste or not quante[i]: continue
        viste.add(w)
        n=quante[i]
        out.append({'w':w,'liv':1 if n>=20 else 2 if n>=8 else 3,'L':libri.get(i,0),'tipo':'p','chi':i})
    return out

# ------------------------------------------------------------------ tutto insieme
def costruisci(lg,a_mano,libri):
    voci={}                                   # parola -> voce
    def aggiungi(e):
        w=e['w']
        if w in voci:
            v=voci[w]
            if 'chi' in e and 'chi' not in v: v['chi']=e['chi']            # il personaggio tiene la sua frase
            if 'cl' in e and isinstance(v.get('cl'),list) and len(v['cl'])<3:
                for c in (e['cl'] if isinstance(e['cl'],list) else [e['cl']]):
                    if c not in v['cl']: v['cl'].append(c)
            return
        v=dict(e)
        if 'cl' in v and not isinstance(v['cl'],list): v['cl']=[v['cl']]
        v.setdefault('cl',[])
        v.setdefault('chi',-1)
        voci[w]=v
    for e in a_mano[lg]: aggiungi(e)
    for e in libri[lg]:                       # un libro entra solo se la parola non c'è già (Isaia resta persona)
        if e['w'] not in voci: aggiungi(dict(e,liv=livello_libro(e['L'])))
    for e in da_domande(lg): aggiungi(e)
    for e in da_personaggi(lg): aggiungi(e)
    n_a=len(voci)
    stop=STOP_RO if lg=='ro' else STOP_IT
    V,ordine,conta,forme,occ=parole_versetti(lg,stop)
    cand=[]                                   # (rango, parola, versetto, frase) di quelle che si possono usare
    for rango,p in enumerate(ordine):
        if p in voci or not (4<=len(p)<=MAXLEN): continue
        vi,ini,fin=scegli_versetto(p,V,forme,occ)
        L,c,v,t=V[vi]
        fr=frammento(t,ini,fin)
        if p in pul_parole(fr.replace(SEGNO,' ')+' '+nome_libro(lg,L)): continue   # la parola avanzata nel testo o nel nome del libro
        cand.append((rango,p,L,c,v,fr))
    # i versetti riempiono quello che manca fino a TOTALE, livello per livello (stesso numero di parole per livello);
    # sono presi a passo regolare fra le parole più e meno usate, e le più usate vanno ai livelli più facili
    per_liv=collections.Counter(v['liv'] for v in voci.values())
    obiettivo={1:TOTALE//3+(1 if TOTALE%3>0 else 0),2:TOTALE//3+(1 if TOTALE%3>1 else 0),3:TOTALE//3}
    servono={l:max(0,obiettivo[l]-per_liv[l]) for l in (1,2,3)}
    tot=sum(servono.values())
    if tot>len(cand): raise SystemExit(f'{lg}: servono {tot} versetti ma ne ho solo {len(cand)}')
    scelti=[cand[int(k*len(cand)/tot)] for k in range(tot)] if tot else []
    pos=0
    for liv in (1,2,3):
        for rango,p,L,c,v,fr in scelti[pos:pos+servono[liv]]:
            voci[p]={'w':p,'liv':liv,'L':L,'tipo':'v','cl':[f"«{fr}» — {nome_libro(lg,L)} {c}:{v}"],'chi':-1}
        pos+=servono[liv]
    return list(voci.values()),n_a

# quanto è conosciuto un libro (come livLibro() nel programma)
NOTI=[1,2,8,17,18,19,20,23,27,32,40,41,42,43,44,45,49,66]
MEDI=[3,4,5,6,7,9,10,11,12,21,24,26,46,47,48,50,58,59]
def livello_libro(L): return 1 if L in NOTI else 2 if L in MEDI else 3

def main():
    a_mano=leggi_a_mano(); libri=leggi_libri()
    out={}; rapporto={}
    for lg in ('it','ro'):
        voci,n_a=costruisci(lg,a_mano,libri)
        if len(voci)!=TOTALE: raise SystemExit(f'{lg}: {len(voci)} parole, dovevano essere {TOTALE}')
        out[lg]=[[v['w'],v['liv'],v['tipo'],v['L'],v['cl'],v['chi']] for v in voci]
        c=collections.Counter(v['tipo'] for v in voci); l=collections.Counter(v['liv'] for v in voci)
        rapporto[lg]=(len(voci),dict(c),dict(sorted(l.items())),n_a)
    dest=os.path.join(RADICE,'dati','cruciverba_parole.json')
    with open(dest,'w',encoding='utf-8') as f:
        json.dump(out,f,ensure_ascii=False,separators=(',',':'))
    print('scritto',dest,round(os.path.getsize(dest)/1024),'KB')
    # i libri, per il tema «Libri della Bibbia»: libro, parola, indizio
    dl=os.path.join(RADICE,'dati','cruciverba_libri.json')
    with open(dl,'w',encoding='utf-8') as f:
        json.dump({lg:[[e['L'],e['w'],e['cl']] for e in libri[lg]] for lg in libri},f,ensure_ascii=False,separators=(',',':'))
    print('scritto',dl,{lg:len(libri[lg]) for lg in libri})
    for lg,(n,c,l,na) in rapporto.items():
        print(f'  {lg}: {n} parole · per tipo {c} · per livello {l} · con indizio non-versetto {na}')

if __name__=='__main__': main()
