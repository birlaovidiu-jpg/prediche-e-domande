# -*- coding: utf-8 -*-
"""Mette il programma sul sito: https://birlaovidiu-jpg.github.io/prediche-e-domande/

   Uso:  python3 pubblica.py 7.8
   Compila, prepara il ramo «gh-pages» con dentro solo il programma, e lo spinge.
"""
import os, sys, json, shutil, subprocess, tempfile
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
shutil.copy2(prog, os.path.join(tmp,'index.html'))
open(os.path.join(tmp,'.nojekyll'),'w').close()

sw=open(os.path.join(QUI,'sorgenti','sw.js'),encoding='utf-8').read().replace('__VER__',VER)
open(os.path.join(tmp,'sw.js'),'w',encoding='utf-8').write(sw)

IC=json.load(open(os.path.join(QUI,'dati','icone.json')))
manifest={"name":"Prediche e Domande — SDARM","short_name":"SDARM","start_url":"./",
  "scope":"./","display":"standalone","orientation":"any",
  "background_color":"#0f1117","theme_color":"#c8102e",
  "icons":[{"src":IC['i192'],"sizes":"192x192","type":"image/png","purpose":"any maskable"},
           {"src":IC['i512'],"sizes":"512x512","type":"image/png","purpose":"any maskable"}]}
json.dump(manifest, open(os.path.join(tmp,'manifest.json'),'w'), ensure_ascii=False)

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
    for f in ('index.html','sw.js','manifest.json','.nojekyll'):
        shutil.copy2(os.path.join(tmp,f), os.path.join(lavoro,f))
    cmdl('git','add','-f','index.html','sw.js','manifest.json','.nojekyll')
    cmdl('git','-c','commit.gpgsign=false','commit','-q','-m',
         'Versione %s sul sito\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>'%VER)
    cmdl('git','push','-f','-q','origin','sito-tmp:gh-pages')
    print('✓ pubblicato: https://birlaovidiu-jpg.github.io/prediche-e-domande/')
finally:
    subprocess.run(['git','worktree','remove','--force',lavoro],cwd=QUI)
    subprocess.run(['git','branch','-D','sito-tmp','-q'],cwd=QUI,
                   stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    shutil.rmtree(tmp, ignore_errors=True)
