# -*- coding: utf-8 -*-
"""Trova altre frasi vere per «Chi ha detto?», leggendo il testo stesso delle
Bibbie già dentro al programma — non ne inventa nessuna.

Metodo (verificato a mano su tanti campioni prima di usarlo):
- cerco, verso per verso, un verbo di attribuzione (disse/rispose/a zis/...)
  seguito entro poca distanza da una virgoletta di apertura;
- nei 60 caratteri PRIMA del verbo cerco un nome di personaggio già noto
  (la stessa lista _CHD.p usata da tutto il programma, così gli indici
  restano validi); se ne trovo ESATTAMENTE UNO, quello è chi parla — se ne
  trovo zero o più di uno (frase ambigua, es. «Achab vide Elia, gli disse»)
  SCARTO la riga, meglio perderne qualcuna che sbagliare chi ha parlato;
- il discorso può continuare per più versetti: ognuno diventa una voce a sé
  (stesso «chi»), finché non trovo la virgoletta di chiusura.
Uso lo stesso file dati/bibbia.json (compresso) e la stessa lista di nomi
di dati/chihadetto_nuovo.json — non ne serve un altro.
"""
import json,gzip,base64,re,unicodedata,random,os,sys

QUI=os.path.dirname(os.path.abspath(__file__))
RADICE=os.path.dirname(os.path.dirname(QUI))  # .../prediche e domande

BIB=json.load(open(os.path.join(RADICE,'dati','bibbia.json')))
CHD=json.load(open(os.path.join(RADICE,'dati','chihadetto_nuovo.json')))

def ck(s):
    s=unicodedata.normalize('NFD',s.lower())
    s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    s=s.replace('ș','s').replace('ş','s').replace('ț','t').replace('ţ','t')
    return s

VERBI_IT=('disse|rispose|replicò|ribatté|gridò|esclamò|chiese|domandò|aggiunse|continuò|'
           'dicendo|pregò|comandò|ordinò|giurò|promise|profetizzò|cantò|proclamò|annunciò|'
           'dichiarò|supplicò|implorò|insegnò|parlò|scrisse|rivolse')
VERBI_RO=('a zis|a răspuns|a strigat|a exclamat|a întrebat|a spus|a adăugat|a continuat|'
           'zicând|s-a rugat|a poruncit|a jurat|a făgăduit|a proorocit|a cîntat|a vestit|'
           'a mărturisit|a implorat|a învățat|a vorbit|a scris')


# davanti a uno di questi il nome è chi RICEVE l'azione (il destinatario),
# non chi parla — «parlarono a Mosè» non vuol dire che ha parlato Mosè.
# Scoperto provando: Numeri 17:12 «I figli d'Israele parlarono a Mosè,
# dicendo: ...» veniva attribuito per sbaglio a Mosè, che qui ASCOLTA soltanto.
DATIVI_IT=re.compile(r"(?:^|[^a-zàèéìòù])(?:a|ad|ai|agli|alle|al)\s*$")
DATIVI_RO=re.compile(r"(?:^|[^a-zăâîșț])(?:lui|către|catre)\s*$")
# davanti a "di/del/della/..." il nome è quasi sempre parte di un luogo o di un
# genitivo («le parti di Filippo» = Cesarea di Filippo, un LUOGO — non ha
# parlato Filippo), non chi compie l'azione appena dopo
GENITIVI_IT=re.compile(r"(?:^|[^a-zàèéìòù])(?:di|del|dello|della|dei|degli|delle|dell)\s*$")

def estrai(cod,verbi,apri_q,chiudi_q,nomi):
    dativi = DATIVI_RO if cod=='ro' else DATIVI_IT
    genitivi = GENITIVI_IT if cod!='ro' else None
    testo=gzip.decompress(base64.b64decode(BIB['v'][cod]['z'])).decode('utf-8')
    righe=testo.split('\n')
    cpl=BIB['cpl']; capv=BIB['cap']
    nomi_ord=sorted(range(len(nomi)),key=lambda i:-len(nomi[i]))
    nomi_pat=[(i,re.compile(r'\b'+re.escape(ck(nomi[i]))+r'\b')) for i in nomi_ord if len(ck(nomi[i]))>=3]
    verbo_pat=re.compile(r"\b(?:"+verbi+r")\b")
    apri_pat=re.compile(re.escape(apri_q))
    def cerca_nome(finestra):
        """Un solo nome noto nella finestra, che non sia lì solo come
        destinatario/genitivo (vedi dativi/genitivi) → altrimenti None."""
        trovati=[]
        for i,pat in nomi_pat:
            for mm in pat.finditer(finestra):
                precede=finestra[:mm.start()]
                if not dativi.search(precede) and not (genitivi and genitivi.search(precede)):
                    trovati.append(i)
                break
        trovati=list(dict.fromkeys(trovati))
        return trovati[0] if len(trovati)==1 else None
    trovate=[]
    ir=0; ic=0
    for Li in range(len(cpl)):
        for c in range(1,cpl[Li]+1):
            nv=capv[ic]; ic+=1
            speaker=None; in_quote=False
            for v in range(1,nv+1):
                riga=righe[ir]; ir+=1
                if not in_quote:
                    m=verbo_pat.search(riga)
                    if not m: continue
                    finestra_dopo=riga[m.end():m.end()+70]
                    ap=apri_pat.search(finestra_dopo)
                    if not ap: continue
                    # 1) SUBITO dopo il verbo («disse Paolo:», «a răspuns Pavel,») —
                    #    l'ordine verbo-poi-nome è il più affidabile di tutti, capita
                    #    spesso quando l'attribuzione è incastonata in mezzo al
                    #    discorso diretto (scoperto su Atti 26:25, «..., a răspuns
                    #    Pavel, ...», che la sola ricerca "prima del verbo" sbagliava
                    #    prendendo il nome di chi lo aveva appena interrotto)
                    speaker=cerca_nome(ck(finestra_dopo[:ap.start()]))
                    if speaker is None:
                        # 2) altrimenti, PRIMA del verbo, in una finestra stretta
                        #    (un nome lontano è quasi sempre l'oggetto di un altro
                        #    verbo di mezzo: «mandò a chiamare Barak... e gli disse»
                        #    — parla lei, non Barak)
                        speaker=cerca_nome(ck(riga[:m.start()])[-58:])
                    if speaker is None: continue  # ambigua o senza nome: scartata
                    in_quote=True
                    resto=riga[m.end()+ap.end():]
                else:
                    resto=riga
                chiude = chiudi_q in resto
                testo_q=(resto.split(chiudi_q)[0] if chiude else resto).strip()
                # scarto le frasi con una virgoletta aperta dentro e mai richiusa qui
                # (un discorso che cita a sua volta un altro discorso, tipo «disse
                # loro: “X”» dentro a un altro «disse: “...”» — il testo che ne esce
                # è tecnicamente giusto ma taglia a metà, meglio non usarlo)
                # come le frasi già presenti: almeno 20 lettere, e NESSUNA
                # virgoletta dentro (niente discorsi-dentro-al-discorso, anche
                # se tecnicamente bilanciati — le frasi vere non ne hanno mai)
                if 20<=len(testo_q)<=350 and apri_q not in testo_q and chiudi_q not in testo_q:
                    trovate.append({'q':testo_q,'chi':speaker,'L':Li+1,'c':c,'v':v,'lg':cod})
                if chiude:
                    in_quote=False; speaker=None
    return trovate

def scegli(candidati,quante,per_libro_max,rnd):
    """Sceglie fino a `quante` voci, mescolate, senza far dominare un libro solo."""
    rnd.shuffle(candidati)
    scelte=[]; conta_libro={}
    for x in candidati:
        if len(scelte)>=quante: break
        n=conta_libro.get(x['L'],0)
        if n>=per_libro_max: continue
        conta_libro[x['L']]=n+1
        scelte.append(x)
    return scelte

def costruisci_o_g(chi,lg,nomi,rnd):
    """Le stesse 3 opzioni con cui gioca «Chi ha detto?»: quella giusta più
    due sbagliate scelte a caso fra gli altri personaggi della stessa lingua."""
    altri=[i for i in range(len(nomi)) if i!=chi]
    sbagliate=rnd.sample(altri,2)
    opz=[chi]+sbagliate
    rnd.shuffle(opz)
    g=opz.index(chi)
    return [nomi[i] for i in opz], g

def assegna_difficolta(scelte,conta_base):
    """Le frasi già presenti hanno certi conteggi per livello (facile/media/
    difficile — non sempre in terzi perfetti, es. 759/759/758). Ordino i
    personaggi per quanto parlano (più lo si sente, più è facile riconoscerlo)
    e poi, in quell'ordine, do a ogni voce NUOVA il livello che in quel
    momento — contando anche quelle già esistenti — ne ha di meno: così il
    totale finale (vecchie+nuove) resta equilibrato, non solo le nuove."""
    from collections import Counter
    conta=Counter(x['chi'] for x in scelte)
    ordine=sorted(conta,key=lambda k:(-conta[k],k))
    rango={k:i for i,k in enumerate(ordine)}
    scelte=sorted(scelte,key=lambda x:rango[x['chi']])
    tot={1:conta_base.get(1,0),2:conta_base.get(2,0),3:conta_base.get(3,0)}
    for x in scelte:
        d=min((1,2,3),key=lambda k:tot[k])
        x['dif']=d
        tot[d]+=1

def principale():
    from collections import Counter
    rnd=random.Random(20260918)
    esistenti_it=set((x['L'],x['c'],x['v']) for x in CHD['d'] if x['lg']=='it')
    esistenti_ro=set((x['L'],x['c'],x['v']) for x in CHD['d'] if x['lg']=='ro')
    cand_it=[x for x in estrai('it',VERBI_IT,'“','”',CHD['p']['it']) if (x['L'],x['c'],x['v']) not in esistenti_it]
    cand_ro=[x for x in estrai('ro',VERBI_RO,'„','”',CHD['p']['ro']) if (x['L'],x['c'],x['v']) not in esistenti_ro]
    attuali_it=len(esistenti_it); attuali_ro=len(esistenti_ro)
    quante_it=max(0,3000-attuali_it)
    quante_ro=max(0,3000-attuali_ro)
    scelte_it=scegli(cand_it,quante_it,40,rnd)
    scelte_ro=scegli(cand_ro,quante_ro,40,rnd)
    # il gioco riconosce una frase dal testo+chi l'ha detta (non dal versetto):
    # due racconti paralleli (es. lo stesso detto in più Vangeli) darebbero la
    # stessa "chiave" di gioco, quindi le scarto PRIMA di assegnare i livelli
    # (altrimenti il conteggio per l'equilibrio includerebbe voci mai scritte)
    chiavi_viste=set((x['lg'],x['q'],x['chi']) for x in CHD['d'])
    def senza_doppioni(lista):
        buone=[]
        for x in lista:
            k=(x['lg'],x['q'],x['chi'])
            if k in chiavi_viste: continue
            chiavi_viste.add(k); buone.append(x)
        return buone
    scelte_it=senza_doppioni(scelte_it)
    scelte_ro=senza_doppioni(scelte_ro)
    conta_base_it=Counter(x['dif'] for x in CHD['d'] if x['lg']=='it')
    conta_base_ro=Counter(x['dif'] for x in CHD['d'] if x['lg']=='ro')
    assegna_difficolta(scelte_it,conta_base_it)
    assegna_difficolta(scelte_ro,conta_base_ro)
    out=[]
    for x in scelte_it+scelte_ro:
        nomi=CHD['p'][x['lg']]
        o,g=costruisci_o_g(x['chi'],x['lg'],nomi,rnd)
        out.append({'q':x['q'],'chi':x['chi'],'o':o,'g':g,'L':x['L'],'c':x['c'],'v':x['v'],'lg':x['lg'],'dif':x['dif']})
    dest=os.path.join(RADICE,'dati','chihadetto_estensione.json')
    json.dump(out,open(dest,'w',encoding='utf-8'),ensure_ascii=False)
    veri_it=len([x for x in CHD['d'] if x['lg']=='it']); veri_ro=len([x for x in CHD['d'] if x['lg']=='ro'])
    print(f"scritte {len(scelte_it)} it + {len(scelte_ro)} ro = {len(out)} voci nuove")
    print(f"totale dopo: it {veri_it+len(scelte_it)}, ro {veri_ro+len(scelte_ro)}")
    return out

if __name__=='__main__':
    principale()
