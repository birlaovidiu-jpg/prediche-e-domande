# -*- coding: utf-8 -*-
"""Mette il programma sul sito: https://birlaovidiu-jpg.github.io/prediche-e-domande/

   Uso:  python3 pubblica.py 7.8
   Compila, prepara il ramo «gh-pages» con dentro solo il programma, e lo spinge.
"""
import os, sys, re, json, shutil, base64, zipfile, subprocess, tempfile
QUI=os.path.dirname(os.path.abspath(__file__))
VER=sys.argv[1] if len(sys.argv)>1 else '7.7'

def cmd(*a, **k):
    return subprocess.run(a, cwd=QUI, check=True, **k)

# 1) compilo
cmd('python3','costruisci.py',VER)
prog=os.path.join(QUI,f'Prediche_e_Domande_v{VER}.html')
if not os.path.exists(prog): sys.exit('manca '+prog)

# 2) preparo i file del sito in una cartella a parte
tmp=tempfile.mkdtemp()
open(os.path.join(tmp,'.nojekyll'),'w').close()

sw=open(os.path.join(QUI,'sorgenti','sw.js'),encoding='utf-8').read().replace('__VER__',VER)
open(os.path.join(tmp,'sw.js'),'w',encoding='utf-8').write(sw)

# Safari (aggiungi a Home su iPad/iPhone) non prende bene le icone scritte come
# "data:...base64" dentro al link — restano vuote e lui si arrangia con una S rossa a
# caso. Nel programma unico va bene così (deve restare un solo file, senza internet),
# ma qui sul sito posso scrivere le icone come file veri: molto più affidabile.
IC=json.load(open(os.path.join(QUI,'dati','icone.json')))
def scrivi_icona(chiave,nomefile):
    b64=IC[chiave].split(',',1)[1]
    open(os.path.join(tmp,nomefile),'wb').write(base64.b64decode(b64))
scrivi_icona('i32','icon-32.png')
scrivi_icona('i180','icon-180.png')
scrivi_icona('i192','icon-192.png')
scrivi_icona('i512','icon-512.png')

# i pdf dei lezionari stanno solo nel dispositivo di Ovidiu (IndexedDB del
# browser): da qui, un programma Python, non ci si arriva. Il ponte è questo:
# dal programma lui scarica "📦 Scarica tutti i PDF dei lezionari" (Dati e
# copie), che fa un unico file Lezionari PDF.zip — se lo mette in questa
# stessa cartella (accanto a pubblica.py), qui lo apro e li metto sul sito
# dentro a /lezionari/. Se lo zip non c'è, va bene lo stesso: pubblica come
# sempre, senza lezionari (non è un errore, magari quella volta non servono).
lez_zip=os.path.join(QUI,'Lezionari PDF.zip')
lez_file=[]                                  # percorsi relativi dentro a tmp, es. "lezionari/x.pdf"
if os.path.exists(lez_zip):
    dest=os.path.join(tmp,'lezionari')
    os.makedirs(dest, exist_ok=True)
    with zipfile.ZipFile(lez_zip) as z:
        for nome in z.namelist():
            if not nome.lower().endswith('.pdf') or nome.endswith('/'): continue
            base=os.path.basename(nome)                 # tolgo eventuali cartelle dentro allo zip
            if not base: continue
            with z.open(nome) as sorgente, open(os.path.join(dest,base),'wb') as fuori:
                shutil.copyfileobj(sorgente, fuori)
            lez_file.append('lezionari/'+base)
    print(f'  + {len(lez_file)} pdf di lezionari da {os.path.basename(lez_zip)}')

manifest={"name":"Prediche e Domande — SDARM","short_name":"SDARM","start_url":"./",
  "scope":"./","display":"standalone","orientation":"any",
  "background_color":"#0f1117","theme_color":"#c8102e",
  "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},
           {"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]}
json.dump(manifest, open(os.path.join(tmp,'manifest.json'),'w'), ensure_ascii=False)

# l'html compilato ha le icone/il manifest incollati dentro come data:...base64: per il
# sito li punto ai file veri appena scritti sopra, così Safari li trova per davvero
pagina=open(prog,encoding='utf-8').read()
pagina=re.sub(r'<link rel="apple-touch-icon" href="[^"]*">',
              '<link rel="apple-touch-icon" href="icon-180.png">', pagina)
pagina=re.sub(r'<link rel="icon" type="image/png" sizes="32x32" href="[^"]*">',
              '<link rel="icon" type="image/png" sizes="32x32" href="icon-32.png">', pagina)
pagina=re.sub(r'<link rel="manifest" href="[^"]*">',
              '<link rel="manifest" href="manifest.json">', pagina)
open(os.path.join(tmp,'index.html'),'w',encoding='utf-8').write(pagina)

# 3) il ramo del sito lo rifaccio da zero ogni volta, in una copia a parte:
#    così quello su cui sto lavorando non lo tocco nemmeno
lavoro=tempfile.mkdtemp()
cmd('git','worktree','add','--detach','-q',lavoro)
def cmdl(*a): subprocess.run(a, cwd=lavoro, check=True)
try:
    cmdl('git','checkout','--orphan','sito-tmp')
    subprocess.run(['git','rm','-rq','--cached','.'],cwd=lavoro)
    for f in os.listdir(lavoro):
        if f=='.git': continue
        p2=os.path.join(lavoro,f)
        shutil.rmtree(p2,ignore_errors=True) if os.path.isdir(p2) else os.remove(p2)
    file_sito=['index.html','sw.js','manifest.json','.nojekyll',
               'icon-32.png','icon-180.png','icon-192.png','icon-512.png'] + lez_file
    for f in file_sito:
        dest=os.path.join(lavoro,f)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(os.path.join(tmp,f), dest)
    cmdl('git','add','-f',*file_sito)
    cmdl('git','-c','commit.gpgsign=false','commit','-q','-m',
         'Versione %s sul sito\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>'%VER)
    cmdl('git','push','-f','-q','origin','sito-tmp:gh-pages')
    print('✓ pubblicato: https://birlaovidiu-jpg.github.io/prediche-e-domande/')
finally:
    subprocess.run(['git','worktree','remove','--force',lavoro],cwd=QUI)
    subprocess.run(['git','branch','-D','sito-tmp','-q'],cwd=QUI,
                   stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    shutil.rmtree(tmp, ignore_errors=True)
