# -*- coding: utf-8 -*-
"""Controlla gli indizi scritti a mano PRIMA di rifare le 10.000 parole.

Per ogni persona, luogo e popolo (tipo p, l, t) guarda se il nome c'è davvero nella Bibbia del
programma (Nuova Diodati per l'italiano, Cornilescu per il rumeno): se non c'è, l'ortografia è
probabilmente diversa da quella che leggono in chiesa e va corretta.

  cd strumenti/cruciverba && python3 controlla.py
"""
import re,collections,sys,os
import genera as G

def vocabolario(cod):
    V=G.versetti(cod)
    voc=collections.Counter()
    for L,c,v,t in V:
        for m in G.PAT_PAROLA.finditer(t):
            voc[G.pul(m.group(0))]+=1
    return voc

def main():
    voc={lg:vocabolario(lg) for lg in ('it','ro')}
    a_mano=G.leggi_a_mano()
    mancano=0; visti={'it':collections.Counter(),'ro':collections.Counter()}
    for lg in ('it','ro'):
        for e in a_mano[lg]:
            visti[lg][e['w']]+=1
            if e['tipo'] in 'plt' and voc[lg][e['w']]==0:
                mancano+=1
                print(f"  [{lg}] {e['w']:<14} non c'è nella Bibbia — {e['cl'][:70]}")
    doppie=[(lg,w,n) for lg in visti for w,n in visti[lg].items() if n>2]
    for lg,w,n in doppie: print(f"  [{lg}] {w} ha {n} indizi (più di 2)")
    print(f"\n{len(a_mano['it'])} indizi italiani · {len(a_mano['ro'])} rumeni · {mancano} nomi non trovati nella Bibbia")
    for lg in ('it','ro'):
        c=collections.Counter(e['tipo'] for e in a_mano[lg]); l=collections.Counter(e['liv'] for e in a_mano[lg])
        print(f"  {lg}: per tipo {dict(c)} · per livello {dict(sorted(l.items()))}")

if __name__=='__main__': main()
