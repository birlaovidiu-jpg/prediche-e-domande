# -*- coding: utf-8 -*-
"""Da un .pages di Ovidiu tira fuori la predica COM'È: le parole e insieme
   il carattere, la misura, il colore, il grassetto e il corsivo."""
import sys, os, re, html, json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from iwa2 import tutti_archivi, msg, f32

def _f(v):
    return f32(v) if isinstance(v,bytes) and len(v)==4 else None

class Doc:
    def __init__(self,path):
        self.arc=tutti_archivi(path)
        self.per_id={}
        for ident,t,c in self.arc: self.per_id.setdefault(ident,(t,c))
        st=[x for x in self.arc if x[1]==2001]
        if not st: raise ValueError('niente testo')
        self.ident,_,corpo=max(st,key=lambda x:len(x[2]))
        self.m=msg(corpo)
        self.testo=self.m[3][0].decode('utf-8') if 3 in self.m else ''
    def rif(self,b):
        return msg(b).get(1,[0])[0]
    def stile_corpo(self):
        """lo stile «Body» del documento: è quello con cui è scritto quasi tutto"""
        for ident,t,c in self.arc:
            if t!=2022: continue
            mm=msg(c)
            base=msg(mm[1][0]) if (1 in mm and isinstance(mm[1][0],bytes)) else {}
            nome=base.get(2,[b''])[0]
            nome=nome.decode('utf-8','replace') if isinstance(nome,bytes) else ''
            if 'paragraphstyle-Body' in nome: return ident
        return None
    def predefinito(self,f):
        """lo stile con cui è scritto tutto il resto del documento"""
        if f not in self.m: return None
        if not isinstance(self.m[f][0],bytes): return None
        t=msg(self.m[f][0])
        for e in t.get(1,[]):
            if not isinstance(e,bytes): continue
            v=msg(e)
            if 2 in v and isinstance(v[2][0],bytes):
                r=self.rif(v[2][0])
                if isinstance(r,int) and r: return r
        return None
    def tabella(self,f):
        if f not in self.m: return []
        if not isinstance(self.m[f][0],bytes): return []
        tab=msg(self.m[f][0]); out=[]
        for e in tab.get(1,[]):
            if not isinstance(e,bytes): continue
            v=msg(e)
            i=v.get(1,[0])[0]
            r=self.rif(v[2][0]) if (2 in v and isinstance(v[2][0],bytes)) else None
            out.append((i if isinstance(i,int) else 0, r if isinstance(r,int) else None))
        return sorted(out)
    def prop(self,sid,campo):
        """le proprietà, seguendo la catena degli stili da cui deriva"""
        visti=set()
        while sid and sid not in visti:
            visti.add(sid)
            t,c=self.per_id.get(sid,(None,None))
            if c is None: return {}
            mm=msg(c)
            if campo in mm and isinstance(mm[campo][0],bytes): return msg(mm[campo][0])
            base=msg(mm[1][0]) if (1 in mm and isinstance(mm[1][0],bytes)) else {}
            # il campo 3 è lo stile da cui deriva; il 5 è il foglio di stile, non serve
            sid=msg(base[3][0]).get(1,[0])[0] if (3 in base and isinstance(base[3][0],bytes)) else None
            if not isinstance(sid,int): sid=None
        return {}

def colore(p,campo=7):
    if campo not in p: return None
    c=msg(p[campo][0])
    r,g,b=(_f(c[k][0]) if k in c else None for k in (3,4,5))
    if None in (r,g,b): return None
    return '#%02x%02x%02x'%tuple(max(0,min(255,round(x*255))) for x in (r,g,b))

ALLIN={0:'left',1:'right',2:'center',3:'justify',4:'justify'}

def stile_carattere(d,sid,eredita=True):
    p=d.prop(sid,11) if sid else {}
    def i(k):
        x=p.get(k,[0])[0]
        return x if isinstance(x,int) else 0
    return {
        'gr': i(1)==1,
        'co': i(2)==1,
        'so': i(9)!=0,
        'dim': _f(p[3][0]) if 3 in p else None,
        'car': (p[5][0].decode('utf-8','replace') if isinstance(p[5][0],bytes) else None) if 5 in p else None,
        'col': colore(p),
    }

def leggi(path):
    d=Doc(path)
    testo=d.testo
    par=d.tabella(5); car=d.tabella(8)
    parDef=d.stile_corpo(); carDef=None
    def stile_a(tab,i,dif):
        s=dif
        for idx,sid in tab:
            if idx<=i: s=sid if sid else dif
            else: break
        return s
    # i paragrafi, con dentro i pezzi che cambiano aspetto
    fuori=[]; conta={}
    inizio=0
    for pezzo in testo.split('\n'):
        fine=inizio+len(pezzo)
        psid=stile_a(par,inizio,parDef)
        pc=stile_carattere(d,psid)
        pp=d.prop(psid,12)
        allin=ALLIN.get(pp.get(1,[0])[0],'left') if 1 in pp else 'left'
        chiave=(pc['car'],pc['dim'],pc['col'],pc['gr'],pc['co'],allin)
        conta[chiave]=conta.get(chiave,0)+len(pezzo)
        # i cambi di carattere dentro al paragrafo
        tagli=sorted({inizio,fine} | {i for i,_ in car if inizio<i<fine})
        pezzi=[]
        for k in range(len(tagli)-1):
            a,b=tagli[k],tagli[k+1]
            cs=stile_carattere(d,stile_a(car,a,carDef))
            pezzi.append((testo[a:b],cs))
        if not pezzi: pezzi=[(pezzo,{})]
        fuori.append({'testo':pezzo,'p':{'car':pc['car'],'dim':pc['dim'],'col':pc['col'],
                       'gr':pc['gr'],'co':pc['co'],'all':allin},'pezzi':pezzi})
        inizio=fine+1
    b=stile_carattere(d,parDef) if parDef else {}
    if not b.get('car') and conta:
        m2=max(conta,key=conta.get); b={'car':m2[0],'dim':m2[1],'col':m2[2]}
    return fuori, {'car':b.get('car'),'dim':b.get('dim'),'col':b.get('col'),'all':'left'}

FAM={'Helvetica':"Helvetica,'Helvetica Neue',Arial,sans-serif",
     'Helvetica Neue':"'Helvetica Neue',Helvetica,Arial,sans-serif",
     'Times New Roman':"'Times New Roman',Times,serif",
     'Georgia':"Georgia,'Times New Roman',serif",
     'Palatino':"Palatino,'Palatino Linotype',Georgia,serif",
     'Baskerville':"Baskerville,'Iowan Old Style',Georgia,serif",
     'Optima':"Optima,'Gill Sans','Avenir Next',sans-serif",
     'Avenir Next':"'Avenir Next',Avenir,'Helvetica Neue',sans-serif",
     'Arial':"Arial,Helvetica,sans-serif",
     'Verdana':"Verdana,Geneva,sans-serif"}
def famiglia(n):
    if not n: return None
    n=re.sub(r'-(Regular|Bold|Italic|BoldItalic|Oblique|Light|Medium|Semibold)$','',n)
    n=n.replace('MT','').strip()
    return FAM.get(n, f"'{n}',Georgia,serif")

def html_predica(path):
    par,base=leggi(path)
    out=[]
    for p in par:
        if not p['testo'].strip():
            out.append('<p><br></p>'); continue
        st=[]
        if p['p']['all']!='left': st.append('text-align:'+p['p']['all'])
        f=famiglia(p['p']['car'])
        if f and f!=famiglia(base['car']): st.append('font-family:'+f)
        if p['p']['dim'] and base['dim'] and abs(p['p']['dim']-base['dim'])>0.4:
            st.append('font-size:%.0fpx'%(p['p']['dim']*1.34))
        if p['p']['col'] and p['p']['col']!=base['col']: st.append('color:'+p['p']['col'])
        if p['p']['gr']: st.append('font-weight:700')
        if p['p']['co']: st.append('font-style:italic')
        dentro=[]
        for t,cs in p['pezzi']:
            if not t: continue
            s2=[]
            if cs.get('gr') and not p['p']['gr']: s2.append('font-weight:700')
            if cs.get('co') and not p['p']['co']: s2.append('font-style:italic')
            if cs.get('so'): s2.append('text-decoration:underline')
            if cs.get('col') and cs['col']!=p['p']['col']: s2.append('color:'+cs['col'])
            if cs.get('dim') and p['p']['dim'] and abs(cs['dim']-p['p']['dim'])>0.4:
                s2.append('font-size:%.0fpx'%(cs['dim']*1.34))
            fc=famiglia(cs.get('car'))
            if fc and fc!=f: s2.append('font-family:'+fc)
            e=html.escape(t)
            dentro.append(f'<span style="{";".join(s2)}">{e}</span>' if s2 else e)
        out.append(f'<p style="{";".join(st)}">{"".join(dentro)}</p>' if st else f'<p>{"".join(dentro)}</p>')
    return '\n'.join(out), base

if __name__=='__main__':
    h,b=html_predica(sys.argv[1])
    print('BASE:',b)
    print(h[:2500])
