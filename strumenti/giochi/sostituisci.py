# -*- coding: utf-8 -*-
"""Sostituisce una domanda (le sue tre righe) in un file di domande_nuove, cercandola per l'inizio della
domanda italiana. Uso da altri script: sostituisci(file, {inizio_domanda_it: 'tre righe nuove'})"""
import os,re
def sostituisci(f,cambi):
    L=open(f,encoding='utf-8').read().split('\n'); fatti=set()
    for i,r in enumerate(L):
        if r.startswith('IT|'):
            for k,nuovo in cambi.items():
                if r[3:].startswith(k) and k not in fatti:
                    L[i-1:i+2]=nuovo.strip().split('\n'); fatti.add(k); break
    manc=set(cambi)-fatti
    if manc: print('NON TROVATE:',manc)
    open(f,'w',encoding='utf-8').write('\n'.join(L))
