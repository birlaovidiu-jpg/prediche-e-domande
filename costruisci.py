# -*- coding: utf-8 -*-
"""Assembla il file unico HTML del programma."""
import json,io,os,sys,re,base64
QUI=os.path.dirname(os.path.abspath(__file__))
# I dati stanno fuori dal progetto, in cartelle di lavoro. Li cerco in ordine:
# prima i più nuovi, poi quelli di prima.
CARTELLE=[
  os.path.join(QUI,'dati'),          # i dati stanno qui dentro: il programma si ricompila ovunque
  '/private/tmp/claude-501/-Users-ovidio-Desktop-ovidiu-claude/61a5dd09-2e10-48e3-821b-80ed675e9ef8/scratchpad',
  '/private/tmp/claude-501/-Users-ovidio-Desktop-ovidiu-claude/445a7a6a-13e1-43bb-ae19-9a8062abc7fc/scratchpad',
]
def dove(nome):
    for c in CARTELLE:
        p=os.path.join(c,nome)
        if os.path.exists(p): return p
    raise SystemExit('Manca il file dei dati: '+nome+'\n  cercato in:\n   '+'\n   '.join(CARTELLE))
SCR=[c for c in CARTELLE if os.path.isdir(c)][0]
VER=sys.argv[1] if len(sys.argv)>1 else '1.0'
def leggi(p): return io.open(p,encoding='utf-8').read()
def js(o): return json.dumps(o,ensure_ascii=False,separators=(',',':'))

# ---- libri ----
sys.path.insert(0,os.path.dirname(dove('libri.py')))
from libri import LIBRI
libri=[[L[0],L[1],L[2],L[3],L[4]] for L in LIBRI]

# ---- domande ----
D=json.load(open(dove('domande_10000.json')))
Q=[[q['d'],q['o'][0],q['o'][1],q['o'][2],q['g'],q['L'],q.get('v',''),0 if q['lg']=='it' else 1,q.get('dif',2)] for q in D]

# ---- testi dei versetti ----
T=json.load(open(dove('testi_versetti.json')))

# ---- cantici ----
C=json.load(open(dove('cantici_v3.json')))
RAC=['avventista','riformista','azsmr','ovidiu']
CC=[[RAC.index(c['cat']), 0 if c['lg']=='it' else 1, c['num'], c['tit'], c['str'], c['rit'], c.get('audio','')] for c in C]

# ---- prediche, poesie, esperienze ----
PR=json.load(open(dove('prediche_pages.json')))
# come si chiamavano prima le prediche, per non perdere i tuoi appunti
try: mappa=json.load(open(dove('mappa_prediche.json')))
except SystemExit: mappa={}
PO=json.load(open(dove('poesie_finali.json')))
ES=json.load(open(dove('esperienze_500.json')))
PRc=[[p['num'],p['tit'],0 if p['lg']=='it' else 1,p.get('rif',''),p['testo'],
      p.get('html',''),p.get('fam','helvetica'),p.get('px',21),p.get('col') or '#241d10'] for p in PR]
POc=[[p['tit'],0 if p['lg']=='it' else 1,p['testo']] for p in PO]
ESc=[[e['tit'],0 if e['lg']=='it' else 1,e.get('rif',''),e['testo'],1 if e.get('tipo')=='vera' else 0] for e in ES]

# ---- «Chi ha detto?» ----
CHD=json.load(open(dove('chihadetto_nuovo.json')))

# ---- le Bibbie ----
BIB=json.load(open(dove('bibbia.json')))

# ---- località del mondo, per alba e tramonto ----
LOC=json.load(open(dove('localita.json')))

# ---- icone ----
IC=json.load(open(dove('icone.json')))
LP=json.load(open(dove('logopulito.json')))
manifest={"name":"Prediche e Domande — SDARM","short_name":"SDARM","start_url":".","display":"standalone",
  "background_color":"#0f1117","theme_color":"#c8102e","orientation":"any",
  "icons":[{"src":IC['i192'],"sizes":"192x192","type":"image/png","purpose":"any maskable"},
           {"src":IC['i512'],"sizes":"512x512","type":"image/png","purpose":"any maskable"}]}
man='data:application/manifest+json;base64,'+base64.b64encode(json.dumps(manifest).encode()).decode()

dati = f"""/* ============ DATI ============ */
const VER={js(VER)};
const ICONA={js(IC['i192'])};
const LOGO={js(LP['blu'])};
const LOGOB={js(LP['bianco'])};
const LIBRI={js(libri)};
const TESTI={js(T)};
const _Q={js(Q)};
const DOMANDE=_Q.map((x,i)=>({{i,d:x[0],o:[x[1],x[2],x[3]],g:x[4],L:x[5],v:x[6],lg:x[7]?'ro':'it',dif:x[8]}}));
const DIFF={{1:{{et:'Facile',ic:'🟢'}},2:{{et:'Medio',ic:'🔵'}},3:{{et:'Forte',ic:'🟠'}},4:{{et:'Esperti',ic:'🔴'}}}};
const DIFF3={{1:{{et:'Facile',ic:'🟢'}},2:{{et:'Media',ic:'🔵'}},3:{{et:'Difficile',ic:'🔴'}}}};
const _C={js(CC)};
const _P={js(PRc)};
const _PO={js(POc)};
const _ES={js(ESc)};
const _LOCD={js(LOC)};
const _BIBD={js(BIB)};
const _CHD={js(CHD)};
const RACCOLTE={{avventista:{{et:'Innario avventista',br:'Avventista',lg:'it',ic:'📕'}},
  riformista:{{et:'Nuovo innario riformista',br:'Riformista',lg:'it',ic:'📗'}},
  azsmr:{{et:'Imnuri AZSMR',br:'AZSMR',lg:'ro',ic:'📘'}},
  ovidiu:{{et:'Cantici Ovidiu',br:'Ovidiu',lg:'ro',ic:'⭐️'}}}};
const _RAC=['avventista','riformista','azsmr','ovidiu'];
const CANTICI=_C.map((x,i)=>({{i:'a'+i,cat:_RAC[x[0]],lg:x[1]?'ro':'it',num:x[2],tit:x[3],str:x[4],rit:x[5],audio:x[6]}}));
const _MAPPR={js(mappa)};
const PREDICHE=_P.map((x,i)=>({{i:'pr'+(x[0]||('x'+i)),num:x[0],tit:x[1],lg:x[2]?'ro':'it',rif:x[3],testo:x[4],
  html:x[5],fam:x[6],px:x[7],col:x[8],
  tema:'',get sfondo(){{ return this._s||(this._s=sfondoDaTema(this.tit)); }},
  get blocchi(){{ return this._b||(this._b=analizzaPredica(this.testo)); }} }}));
const POESIE=_PO.map((x,i)=>({{i:'q'+i,tit:x[0],lg:x[1]?'ro':'it',testo:x[2],
  get blocchi(){{ return this._b||(this._b=analizzaPoesia(this.testo)); }} }}));
const ESPERIENZE=_ES.map((x,i)=>({{i:'e'+i,tit:x[0],lg:x[1]?'ro':'it',rif:x[2],testo:x[3],tipo:x[4]?'vera':'racconto',sfondo:'alba'}}));
"""

app='\n'.join(leggi(os.path.join(QUI,'sorgenti',f)) for f in sorted(os.listdir(os.path.join(QUI,'sorgenti')))
              if f.endswith('.js'))
# motore PDF (per la Scuola del Sabato): worker prima, cosi pdf.js lo trova gia pronto
PDFJS = leggi(dove('pdf.min.js'))
PDFWORKER = leggi(dove('pdf.worker.min.js'))
css=leggi(os.path.join(QUI,'sorgenti','stile.css'))
html=leggi(os.path.join(QUI,'sorgenti','guscio.html'))
html=(html.replace('__CSS__',css).replace('__DATI__',dati).replace('__PDFWORKER__',PDFWORKER).replace('__PDFJS__',PDFJS).replace('__APP__',app)
      .replace('__ICONA180__',IC['i180']).replace('__ICONA32__',IC['i32'])
      .replace('__ICONA192__',IC['i192']).replace('__ICONA64__',IC['i64'])
      .replace('__LOGOB__',LP['bianco']).replace('__LOGOBLU__',LP['blu'])
      .replace('__MANIFEST__',man))
nome=f'Prediche_e_Domande_v{VER}.html'
io.open(os.path.join(QUI,nome),'w',encoding='utf-8').write(html)
print(f"✓ {nome} — {len(html.encode())/1024:.0f} KB")
print(f"  domande {len(Q)} · chi ha detto {len(CHD['d'])} · cantici {len(CC)} · libri {len(libri)}")
