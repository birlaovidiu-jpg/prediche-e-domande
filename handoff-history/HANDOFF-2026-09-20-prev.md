# Handoff — Prediche e Domande (SDARM)

> Generated 19–20 September 2026 (build v7.74) — resume in a new Claude Code session.
> **Reply to Ovidiu in Italian, plainly, no jargon.** He is not a programmer.
> Standing rules (memory `regole-lavoro-ovidiu`): do **exactly** what he asks, nothing more; if you spot an
> unrelated defect, tell him in words and wait. **Publish to GitHub automatically after every tested round**
> (new version number each time, verify live with `curl`), keep only the newest `Prediche_e_Domande_v*.html`,
> reapply the Finder icon after `pubblica.py`.
> Previous handoff (v7.68–v7.72): `handoff-history/HANDOFF-2026-09-19b.md`.

---

## 🎯 Goal

One self-contained HTML file (~17.8 MB, offline-capable) that Ovidiu — an SDARM church officer working in
Italian and Romanian on Mac/iPad/iPhone — uses to run church meetings: Bible quizzes and games, hymns, sermons,
poems, experiences, a Bible reader, sunrise/sunset, and a Sabbath-School lesson reader ("lezionario") with PDF
annotation. Published to GitHub Pages (`https://birlaovidiu-jpg.github.io/prediche-e-domande/`, repo public).

---

## 📍 Current State

**v7.74 built, `autoTest()` 303/303 clean, PUBLISHED and verified live (`VER="7.74"`), Finder icon
reapplied, only `Prediche_e_Domande_v7.74.html` in the folder.**

### v7.74 — text notes on the lezionario (second request of the session)

- A **new text note is born the same size as the lesson text around the tap** (`grandezzaTestoLez`).
- The size unit («Grandezza» 2–20) now means "at a 900-pt-wide page" — the unit the shared PDF already used —
  so `mostraTesti` renders it through `_pxTestoLez` and notes **scale with the page when zooming** (before they
  stayed fixed in pixels, so the "right" size only held at the zoom where it was written). Old notes change by ~6%.
- **Two taps on a note open «Modifica l'appunto»** (`LET._dueTocchi`, 500 ms window); one tap still only selects.
  The old 2-second long-press is gone.
- Verified on the real lezionario: new note 25.5 px vs lesson text 24.1 px; fast double tap opens the editor,
  two slow taps do not.

### What this session did (one request, fully delivered)

Ovidiu asked: inside the lezionario's «Appunti» window, replace the buttons «Rifai» and «Importa dall'altra
lingua» with **«Copia appunti»** and **«Incolla appunti»**; copy *all* notes of a lesson he picks from a list,
and paste them in the other language **exactly on the corresponding highlighted words**.

| Piece | Where |
|---|---|
| Two new buttons + lesson pickers (with note counts, «la stai guardando», «stesso sabato») | `sorgenti/6d_lettore.js`: `apriAppunti`, `scegliLezioneCopia`, `scegliLezioneIncolla`, `ICO.copia`/`ICO.incolla` |
| Clipboard (all note types) kept in IndexedDB key `copia:appunti`, survives restart | `preparaCopiaAppunti`, `leggiCopiaAppunti`, `copiaAppuntiLezione` |
| Paste core + placement of each note type | `incollaAppuntiIn`, `_posaSegno`, `_rettangoliParole`, `_parolaCorrispondente`, `incollaAppuntiLezione` |
| **Real word-level alignment of the two translations** (replaces the old proportional anchor for cross-language use) | `allineaParole`, `_segnaliAl`, `_pesoAl`, `_catenaAl`, `_coppieAl`, `portaTratto` |
| Lesson words + flags (paragraph start / line end / running header-footer) | `pagineLezione`, `paroleLezione` |
| One «Annulla» undoes a whole paste | `_statoAdesso`, `_rimetti` (STORIA entries may carry `gruppo`) |
| Removed | `appuntoImportabile`, `importaAppuntiAltraLingua`, `importaEriapriAppunti`, `ICO.importa` |
| New tests (9 checks) + fixed a flaky old one (`LET.lez=null`) | `sorgenti/9_avvio.js` |

**How the alignment works** (full explanation in memory `appunti-lezionari-due-lingue.md`): signals that mean the
same in both languages — verse/page numbers, weekday+date headers, question letters, **real sentence ends
(weight 3.2)**, question marks, commas, quotes, paragraph starts, look-alike words with a length-ratio guard, and
a small dictionary (Dio/Dumnezeu, Salmi/Psalmi, Atti/Faptele…). Two passes (strong anchors → guide → everything in
a narrow band), heaviest monotone chain (Fenwick tree, ~60 ms per lesson), outlier filter, two-sided boundaries for
text one edition has extra, then boundaries snap to sentence/clause starts without ever crossing an anchor.
Running headers/footers are detected (same line on ≥2 pages, or a lone page number) and never highlighted.
If the other edition simply lacks that text, nothing is pasted (counted as «non ritrovato»).

### Verified (really, not by reading)

- Both **real Q3 2026 lezionari** loaded in the app (`/Users/ovidio/Desktop/ovidiu/chiesa/pubblicazioni/lezionari/2026/`):
  all 212 sentences of lesson «Pentimento» → «Pocăința» and 248 the other way, plus 345 comma-level clauses: nearly
  all land exactly on the corresponding text.
- End-to-end with **real gestures** (synthetic mouse events on `.let-note`): 5 highlights + 1 underline + 1 pen
  circle + 1 text note → «Copia appunti» → other edition → «Incolla appunti» → all 8 correct
  (pen circle ends up around «David», the note stays on the same question line).
- Re-paste = «8 c'erano già»; round trip IT→RO→IT does not duplicate; one «Annulla» removes a whole paste.

---

## 🔧 Dependencies & Setup

```bash
cd "/Users/ovidio/Desktop/ovidiu/claude/prediche e domande"
python3 costruisci.py 7.74        # ALWAYS pass the version
python3 -m http.server 8796       # then http://localhost:8796/Prediche_e_Domande_v7.74.html?nc=1
# console:  autoTest()   → falliti must be []  (run twice: the «599/600» check is flaky on the first run)
python3 pubblica.py 7.74          # builds + pushes gh-pages (never touches main)
cp /tmp/icon_tmp.icns ./icon_tmp.icns && printf 'read '"'"'icns'"'"' (-16455) "icon_tmp.icns";\n' > icon_tmp.r \
 && Rez -append icon_tmp.r -o Prediche_e_Domande_v7.74.html && SetFile -a C Prediche_e_Domande_v7.74.html && rm icon_tmp.icns icon_tmp.r
for i in $(seq 1 20); do V=$(curl -s "https://birlaovidiu-jpg.github.io/prediche-e-domande/" | grep -o 'VER="[0-9.]*"' | head -1); [ "$V" = 'VER="7.74"' ] && break; sleep 6; done; echo $V
```

Testing the lezionario needs the real PDFs: serve a scratch folder with the built HTML + the two PDFs, then in the
console use a helper that builds a `File`, assigns it to `#nlF` via `DataTransfer` and calls `salvaLez()`
(see this session's transcript). Load them in the **same page session** you test in.

Pure Python 3 stdlib + vanilla JS/CSS. No lookbehind regex, no `??=`/`?.`/`.at()`/`structuredClone` (old iPad Safari).

---

## ➡️ Next Steps

1. **Ask Ovidiu to try «Copia appunti» / «Incolla appunti» on the iPad** with his own lezionari and tell us if any
   highlight lands off. If one does: ask which lesson + which phrase, then debug with `allineaParole` on those two
   lessons (that is how this was tuned).
2. **Told him, waiting for his word (do not fix unasked):** `autoTest()` runs at every startup and its colour check
   calls `setCol('#123456')` without restoring — so each launch resets his highlighter colour to that dark blue.
   One-line fix in `9_avvio.js` when he asks.
3. Older items still open: poems (25 it + 5 ro delivered of 200 + 200 asked — batches of ~25, quality first);
   more Esperienze (292, he wanted 700); ~1.200 «Che cosa dice X?» questions still to replace; two ambiguous
   cantici pairs; dozens of Romanian sermons without an Italian counterpart.
4. Marks made before v7.69 have no `pg` and can still repeat on later pages — he must erase and redo those.

---

## ⚠️ Gotchas / Traps

- Before touching the annotation area (`rettDi`/`ancoraDa`/`segnoQui`/`paginaDelSegno`/`allineaParole`), read memory
  `appunti-lezionari-due-lingue.md`: it now has six rounds of history and the exact reasons behind each rule.
- `autoTest()` must not be run with a lezionario open in tests that build fake pages (`LET.lez=null` — fixed here).
- Before adding a top-level `const`/`function`, `grep sorgenti/` — all files concatenate into one script.
- Positional ids: never delete/reorder rows in source JSON; append via extension files merged in `costruisci.py`.
- Test pane can't lay out when hidden (`innerWidth 0`); screenshots need the Browser pane visible — drive the reader
  with synthetic mouse events and verify by reading the data instead.
- The app is **public** on GitHub Pages: never accept "it's private" as a copyright argument.

---

## 💬 Notes

- Ovidiu writes short Italian instructions, often with screenshots; his preference is exact, minimal changes.
- The lezionario lesson list of the Italian Q3 2026 PDF contains a couple of odd entries («3 Offerta del primo»):
  that is the existing lesson recognition, not the new feature — he has never complained about it.
