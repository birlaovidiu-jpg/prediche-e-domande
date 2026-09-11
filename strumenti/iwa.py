# -*- coding: utf-8 -*-
"""Legge il testo dai file .pages (IWA = protobuf compresso con Snappy)."""
import zipfile,struct,sys,re,io

def snappy_raw(d):
    """decomprime un blocco Snappy grezzo"""
    # lunghezza non compressa (varint)
    p=0; n=0; s=0
    while True:
        b=d[p]; p+=1; n|=(b&0x7f)<<s; s+=7
        if not (b&0x80): break
    out=bytearray()
    while p<len(d):
        t=d[p]; p+=1
        m=t&0x03
        if m==0:
            l=t>>2
            if l<60: l+=1
            else:
                k=l-59; l=int.from_bytes(d[p:p+k],'little')+1; p+=k
            out+=d[p:p+l]; p+=l
        else:
            if m==1:
                l=4+((t>>2)&0x07); off=((t>>5)<<8)|d[p]; p+=1
            elif m==2:
                l=(t>>2)+1; off=int.from_bytes(d[p:p+2],'little'); p+=2
            else:
                l=(t>>2)+1; off=int.from_bytes(d[p:p+4],'little'); p+=4
            if off==0 or off>len(out): break
            start=len(out)-off
            for i in range(l): out.append(out[start+i])
    return bytes(out)

def iwa_blocchi(dati):
    """separa i chunk IWA e li decomprime"""
    out=bytearray(); p=0
    while p+4<=len(dati):
        flag=dati[p]; ln=int.from_bytes(dati[p+1:p+4],'little'); p+=4
        blk=dati[p:p+ln]; p+=ln
        if not blk: break
        try: out+=snappy_raw(blk)
        except Exception: pass
    return bytes(out)

def stringhe(buf,minlen=2):
    """estrae i campi protobuf di tipo 2 che sono testo UTF-8 plausibile"""
    res=[]; i=0; L=len(buf)
    while i<L:
        # varint chiave
        k=0; s=0; start=i
        while i<L:
            b=buf[i]; i+=1; k|=(b&0x7f)<<s; s+=7
            if not (b&0x80): break
            if s>35: break
        if (k&0x07)!=2: 
            wt=k&0x07
            if wt==0:
                while i<L and (buf[i]&0x80): i+=1
                i+=1
            elif wt==5: i+=4
            elif wt==1: i+=8
            else: i=start+1
            continue
        n=0; s=0
        while i<L:
            b=buf[i]; i+=1; n|=(b&0x7f)<<s; s+=7
            if not (b&0x80): break
            if s>35: n=0; break
        if n<=0 or i+n>L: i=start+1; continue
        raw=buf[i:i+n]
        try: t=raw.decode('utf-8')
        except Exception: i=start+1; continue
        # solo testo leggibile
        if len(t)>=minlen and sum(1 for c in t if c.isprintable() or c in '\n\t\r')/len(t)>0.96 \
           and re.search(r'[A-Za-zÀ-ÿăâîșşțţĂÂÎȘŞȚŢ]',t):
            res.append((start,t))
        i+=n
    return res

import os
def _da_zip(z):
    nomi=[n for n in z.namelist() if n.endswith('.iwa') and 'Document' in n]
    if not nomi: nomi=[n for n in z.namelist() if n.endswith('.iwa')]
    out=[]
    for n in nomi:
        out+=[t for _,t in stringhe(iwa_blocchi(z.read(n)))]
    return out

def testo_pages(path):
    """funziona sia con .pages a file unico (zip) sia a cartella (bundle)"""
    if os.path.isdir(path):
        out=[]
        iz=os.path.join(path,'Index.zip')
        if os.path.exists(iz):
            out+=_da_zip(zipfile.ZipFile(iz))
        idx=os.path.join(path,'Index')
        if os.path.isdir(idx):
            for f in sorted(os.listdir(idx)):
                if f.endswith('.iwa'):
                    out+=[t for _,t in stringhe(iwa_blocchi(open(os.path.join(idx,f),'rb').read()))]
        return out
    return _da_zip(zipfile.ZipFile(path))

if __name__=='__main__':
    for p in sys.argv[1:]:
        print('='*70); print(p.split('/')[-1])
        try:
            t=testo_pages(p)
            print('stringhe:',len(t))
            for s in t[:40]: print('   |',repr(s[:110]))
        except Exception as e: print('ERR',e)
