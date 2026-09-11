# -*- coding: utf-8 -*-
"""Legge un .pages di Apple fino in fondo: non solo il testo, ma anche
   com'è scritto — carattere, misura, colore, grassetto, corsivo.
   I file .pages sono archivi IWA: protobuf compressi con Snappy."""
import zipfile, os, io, sys, json
from iwa import snappy_raw

# ---------- protobuf generico: non conosco lo schema, leggo i numeri di campo ----------
def varint(b,p):
    n=0; s=0
    while p<len(b):
        c=b[p]; p+=1; n|=(c&0x7f)<<s; s+=7
        if not (c&0x80): return n,p
        if s>70: break
    return n,p

def msg(b):
    """{numero di campo: [valori]} — i valori sono int, float o bytes"""
    out={}
    p=0
    while p<len(b):
        try:
            k,p=varint(b,p)
        except Exception: break
        f,w=k>>3,k&7
        if f==0: break
        try:
            if w==0: v,p=varint(b,p)
            elif w==1: v=b[p:p+8]; p+=8
            elif w==2:
                n,p=varint(b,p)
                if p+n>len(b): break
                v=b[p:p+n]; p+=n
            elif w==5: v=b[p:p+4]; p+=4
            else: break
        except Exception: break
        out.setdefault(f,[]).append(v)
    return out

def f32(v):
    import struct
    return struct.unpack('<f',v)[0] if isinstance(v,bytes) and len(v)==4 else None

# ---------- archivi IWA ----------
def archivi(dati):
    """restituisce [(id, tipo, corpo)] leggendo i chunk uno per uno"""
    buf=bytearray(); p=0
    while p+4<=len(dati):
        ln=int.from_bytes(dati[p+1:p+4],'little'); p+=4
        blk=dati[p:p+ln]; p+=ln
        if not blk: break
        try: buf+=snappy_raw(blk)
        except Exception: pass
    b=bytes(buf); out=[]; p=0
    while p<len(b):
        n,p=varint(b,p)
        if n<=0 or p+n>len(b): break
        info=msg(b[p:p+n]); p+=n
        ident=info.get(1,[0])[0]
        for mi in info.get(2,[]):
            m=msg(mi)
            tipo=m.get(1,[0])[0]
            lung=m.get(3,[0])[0]
            corpo=b[p:p+lung]; p+=lung
            out.append((ident,tipo,corpo))
    return out

def tutti_archivi(path):
    out=[]
    def da_zip(z):
        for n in z.namelist():
            if n.endswith('.iwa'): out.extend(archivi(z.read(n)))
    if os.path.isdir(path):
        iz=os.path.join(path,'Index.zip')
        if os.path.exists(iz): da_zip(zipfile.ZipFile(iz))
        idx=os.path.join(path,'Index')
        if os.path.isdir(idx):
            for f in sorted(os.listdir(idx)):
                if f.endswith('.iwa'): out.extend(archivi(open(os.path.join(idx,f),'rb').read()))
    else:
        da_zip(zipfile.ZipFile(path))
    return out

if __name__=='__main__':
    from collections import Counter
    a=tutti_archivi(sys.argv[1])
    print('archivi:',len(a))
    print('tipi più comuni:',Counter(t for _,t,_ in a).most_common(18))
    # il testo sta nel tipo 2001 (TSWP.StorageArchive)
    for ident,tipo,corpo in a:
        if tipo==2001:
            m=msg(corpo)
            print('--- StorageArchive id',ident,'campi:',{k:len(v) for k,v in sorted(m.items())})
            for t in m.get(3,[])[:3]:
                print('   testo:',repr(t.decode('utf-8','replace')[:150]))
            for f in (4,5,6,7,8,9,10,11,12,13):
                for v in m.get(f,[])[:1]:
                    if isinstance(v,bytes):
                        sub=msg(v)
                        print(f'   campo {f}: sotto-campi',{k:len(x) for k,x in sorted(sub.items())})
            break
