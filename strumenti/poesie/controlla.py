#!/usr/bin/env python3
"""Controlla le poesie in it_*.txt / ro_*.txt: strofe di 4 versi, rima vera
(ABAB, AABB o ABBA), niente stessa parola a fine verso in una coppia, lunghezza
dei versi simile. Uso: python3 controlla.py [file...]  (senza argomenti: tutti)"""
import sys,glob,re,unicodedata,os
def norm(w):
    w=unicodedata.normalize('NFD',w.lower())
    w=''.join(c for c in w if unicodedata.category(c)!='Mn')
    return re.sub(r'[^a-z]','',w)
def ultima(v):
    p=re.findall(r"[A-Za-zÀ-ÿĂăÂâÎîȘșȚțŞşŢţ]+",v)
    if not p: return ''
    w=p[-1].lower(); n=norm(w)
    if w[-1] in 'àèéìòóùú': n=n+'!'   # accento finale: rima solo con un altro accento
    return n
def chiave(w,n=3):
    return w[-n:]
def rima(a,b):
    if a.endswith('!') or b.endswith('!'): return a[-3:]==b[-3:] or (a.endswith('!') and b.endswith('!') and a[-3]==b[-3] if len(a)>2 and len(b)>2 else False)
    if a[-3:]==b[-3:]: return True
    v='aeiou'
    return a[-2:]==b[-2:] and a[-1] in v and a[-2] in v
def sillabe(v):
    return len(re.findall(r'[aeiouăâî]+',norm(v).replace(' ','')+' ')) if False else len(re.findall(r'[aeiouy]+',unicodedata.normalize('NFD',v.lower()).encode('ascii','ignore').decode()))
def schema(f):
    a,b,c,d=f
    if rima(a,c) and rima(b,d): return 'ABAB'
    if rima(a,b) and rima(c,d): return 'AABB'
    if rima(a,d) and rima(b,c): return 'ABBA'
    return None
def leggi(p):
    out=[];cur=None
    for riga in open(p,encoding='utf-8').read().split('\n'):
        if riga.startswith('## '):
            cur={'tit':riga[3:].strip(),'righe':[]};out.append(cur)
        elif cur is not None: cur['righe'].append(riga.rstrip())
    for c in out:
        c['testo']='\n'.join(c['righe']).strip()
        c['strofe']=[s for s in re.split(r'\n\s*\n',c['testo']) if s.strip()]
    return out
if __name__=='__main__':
    files=sys.argv[1:] or sorted(glob.glob(os.path.join(os.path.dirname(__file__) or '.','[ir][to]_*.txt')))
    tit=set();tot=0;pb=0
    for f in files:
        for p in leggi(f):
            tot+=1;pr=[]
            if p['tit'] in tit: pr.append('titolo doppio')
            tit.add(p['tit'])
            for k,s in enumerate(p['strofe']):
                v=[x for x in s.split('\n') if x.strip()]
                if len(v)!=4: pr.append(f'strofa {k+1}: {len(v)} versi'); continue
                fin=[ultima(x) for x in v]
                sc=schema(fin)
                if not sc: pr.append(f'strofa {k+1}: non rima ({", ".join(fin)})')
                else:
                    cp={'ABAB':[(0,2),(1,3)],'AABB':[(0,1),(2,3)],'ABBA':[(0,3),(1,2)]}[sc]
                    for i,j in cp:
                        if fin[i]==fin[j]: pr.append(f'strofa {k+1}: stessa parola in rima «{fin[i]}»')
                sl=[sillabe(x) for x in v]
                if max(sl)-min(sl)>4 or min(sl)<7 or max(sl)>15: pr.append(f'strofa {k+1}: lunghezza versi {sl}')
            if pr: pb+=1;print(f'[{os.path.basename(f)}] {p["tit"]}: '+' | '.join(pr))
    print(f'{tot} poesie, {pb} con segnalazioni')
