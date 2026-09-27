# Handoff — Prediche e Domande (SDARM)

> Generated on 26 September 2026 — resume in a new Claude Code session.
> **Answer Ovidiu in Italian, plainly, no jargon.** He is not a programmer; short messages, often several in a row (also mid-turn), iPad/iPhone screenshots.
> Do not spawn subagents unless he asks.
> **Standing rules (memory `regole-lavoro-ovidiu`):** do **exactly and only** what he asks; an unrelated defect is **told in words, never fixed silently**.
> When a request is ambiguous ask ONE multiple-choice question.
> Never modify his real files (`/Users/ovidio/Desktop/ovidiu/chiesa/…`, Pages sermons, PowerPoints): read-only, copy to the scratchpad for tests.
> Sister folders `programma tesoreria`, `pubblicazioni` are separate projects — leave them alone. Downloads need his explicit yes.
> **After every tested round:** new version (odometer `X.Y.Z`), `costruisci.py` + `pubblica.py`, verify online with `curl`, reapply the Finder icon,
> delete the previous build — **BUT keep `Prediche_e_Domande_v8.0.4.html`** («non cancellare questa fino quando non faccio io tutte le prove»): ask him before removing it.
> **Current = 8.2.2 (published 27 Sep 2026, verified `const VER="8.2.2"`). Next = 8.2.3.**
> 8.1.9 projection/fit of all games, versetto, lezionario keyboard+note width, gara 1 question per player · 8.2.0 codici 300 + 3D temple (sorgenti/6p_tempio3d.js)
> · 8.2.1 viaggi 200 (strumenti/giochi/viaggi/*.txt) · 8.2.2 misteri 240/1000 (see below).
> **IN PROGRESS — Misteri to 1000 (asked: «almeno 1000 per ogni lingua»):** new cases are written in the short bilingual format
> `strumenti/misteri/casi_1NN_*.txt` (format documented at the top of `strumenti/misteri/genera.py`; one «IT || RO» per line), plan + list of ids
> in `strumenti/misteri/elenco.txt` (Genesi → 2 Re 7 done; continue from 2 Re: iehu, ioas, cassa, frecce_eliseo…). Italian names = Nuova Diodati
> (check with `v.py`-style lookup in dati/bibbia.json; helper fix_it.py changes only the IT half). 6 cases per file, num auto-assigned in file order:
> never insert files before existing ones (unlock order). Validate with `python3 strumenti/misteri/genera.py`. Publish every ~200 cases.
> **v8.0.4 file disappeared from the folder on 27 Sep (not deleted by Claude; probably Ovidiu in Finder) — tell him, don't recreate.**
> Previous handoff: `handoff-history/HANDOFF-2026-09-25.md` (v8.0.4 state: 16 games, Libri, backup ZIP).

---

## 🎯 Goal

One self-contained offline HTML app (~22 MB, installed on iPad/iPhone Home Screen, published on GitHub Pages
`https://birlaovidiu-jpg.github.io/prediche-e-domande/`) that Ovidiu — an SDARM church officer (Italian + Romanian) — uses to run
church meetings: Bible quizzes, 16 Bible games, hymns, sermons/poems/experiences (editable «foglio» + projection), Bible reader,
sunrise/sunset, Sabbath-School lesson reader («lezionario»), PDF «Libri». «Done» = he runs a whole meeting from the iPad.

---

## 📍 Current State

**v8.1.7 built and published. `autoTest()` all passing: 715 (1180×820), 714 (744×1133), 713 (390×844).
Folder holds only `Prediche_e_Domande_v8.0.4.html` (kept for him) + `Prediche_e_Domande_v8.1.7.html`, icon applied. Nothing half-finished.
NOTHING tested on a real iPad/iPhone** (zoom, page turn, keyboard, Apple Pencil, fullscreen, AirPlay all only desktop-simulated).

### Done this session (25–26 Sep), by version
- **8.0.5** Prediche: paste fix (first line → title), foglio saved when leaving/⚙ (`salvaFoglioAperto`); «📄 Importa PDF» / «📝 Importa Word» (`7f_importa_documenti.js`);
  Libri open in the lezionario reader with notes sidebar + multiple dated bookmarks; built-in sermons/poems/experiences REMOVED (`costruisci.py` PR=PO=ES=[]),
  archive file `archivio_prediche_poesie_esperienze.json` (144+34+292) loaded via «📂 Carica backup» (`caricaArchivio`, adds as his own).
- **8.0.6–8.0.8** 5-minute return rule (`USCITA_MS`, `pd_uscita`), position refreshed always, Libri Scorri/Sfoglia, Codice segreto 200/lang + 12 on screen,
  `adattaGioco` (all games fit the screen).
- **8.0.9** Ruota: **2000 new hand-written questions per language** (`strumenti/giochi/domande_nuove/01…39_*.txt`, total 2162); reading full screen
  (`body.pred-legge`, books open `#lettore.libro.nudo`); **zoom flicker fixed** (`zoomNativo()`/`largFinestra()` in `1_nucleo.js`, used by every resize
  handler; `zoomMio()` blocks native gestures where we zoom; lettore pinch uses a snapshot `#letLente`); **no blank page on page turn** (`preparaPag`);
  games also fixed in PORTRAIT (`gioSchermoFisso()`), auto-grow up to 1.5×, bigger fonts (×1.15–1.35 in gio-fissa blocks).
- **8.1.0** poesie/esperienze ⚙ saves the foglio + title sync; «Scorri» stays lit (`aggiornaModo()` in `setStru`).
- **8.1.1** Lezionario flips like books (`lbSfoglia` generic); next page pre-rendered (`precaricaPag`); scroll mode draws visible then ahead;
  note window above keyboard (`txSopraTastiera`, visualViewport); new note width = lesson text right margin (`larghezzaAppunto`).
- **8.1.2** ✏️ Pen on sermons/poems/experiences (`5b_penna.js`, SVG over the foglio, strokes anchored to paragraphs, `annot(i).penna[lg]`).
- **8.1.3** Import PDF → **editable styled text** (pdf.js items + per-word colour sampled from the rendered page, paragraphs rebuilt).
- **8.1.4** **PowerPoint faithful copy** (`7g_pptx_fedele.js`): theme colours, shapes→SVG, p:style, shadows, rotation, crop, inherited text styles, backgrounds, master/layout shapes, tables.
- **8.1.5** **Gara** (competition) in all games except X e O (`6n_gara.js`): turns, striscia, podium, `stato.gare`, «Vincitori delle gare».
- **8.1.6** **🕯️ Mistero Biblico replaces Blitz** (tile only; Blitz code still there and still tested) — engine `6o_mistero.js`, 30 cases as data;
  all games: `adattaScritte` (question/answer text grows to fill its box, up to 2.6×); «Proietta» = fullscreen + no bars + big gara scores.
- **8.1.7** Difficulty row **above** the players row (`.gio-livelli` inside wrapper `#gioGioc.gio-testa-gioc`, not in Cruciverba); players row wraps;
  gara auto-proposes the next player (`garaProponi` 1.6 s after a final result; series games end a turn at `GARA_SERIE`: completa 10, chisono 5, versetto 5, cruciverba 100%).

---

## 📁 Relevant Files

| File | Role |
|------|------|
| `sorgenti/6o_mistero.js` | Mistero Biblico engine (MIS state, archivio/intro/scena/prove/fine, taccuino, aiuti, punteggio, stelle, trofei `mis_*`, `misSblocco`, caso del giorno, inCorso, gara same case via `MIS.garaCaso`) |
| `strumenti/misteri/casi_01…06.json` + `genera.py` | **Cases as data** (it+ro). `genera.py` validates (both languages, ≥6 elements, ≥5 real clues, 3 hints, ≥3 prove, answers exist, unique id/num) and writes `dati/misteri.json` → `MISTERI`. x,y auto-assigned if missing |
| `sorgenti/6n_gara.js` | Gara: `GARA`, `apriGara`, `iniziaGara`, `garaRegistra`, `garaProponi`, `garaProssimo`, `garaFine`, `htmlGara`, `vincitoriGare`, `GARA_SERIE` |
| `sorgenti/6j_giocatori.js` | Players/partite; `htmlGiocatori` (levels row above, gara button), `salvaRisultato` → `garaRegistra` |
| `sorgenti/6h_giochi.js` | Hub tiles, routing, `adattaGioco` (scale 0.6–1.5, `_gioZ` memo per game+size+projection), `adattaScritte`, `_gioEsce`, `proiettaGioco`/`_schermoIntero` |
| `sorgenti/7g_pptx_fedele.js` | Faithful PPTX (`pptxFedele`, `htmlPptxFedele`); `7e_importa_pptx.js` stores `diapoPptx[k].fedele={html,sfondo,alt}` (images as `__PF_id__`) |
| `sorgenti/7f_importa_documenti.js` | `pdfInFoglio` (editable), `docxInFoglio` |
| `sorgenti/5b_penna.js` | Pen on the foglio |
| `sorgenti/6d_lettore.js`, `6k_libri.js` | Reader: `preparaPag`/`precaricaPag`, `letLente`, `larghezzaAppunto`, `txSopraTastiera`, `lbSfoglia` (books AND lezionari) |
| `strumenti/giochi/domande_nuove/`, `controlla_domande.py`, `sostituisci.py` | Ruota questions; check **all files together** (single-file check misses cross-file duplicates) |
| `sorgenti/9_avvio.js` | `autoTest()` (async, ~715 checks) |
| Claude memory | `programma-prediche-domande.md` (top line = last version, full technical log), `regole-lavoro-ovidiu.md` |

---

## ❌ Failed Attempts

- **Quick Look as PPTX reference** (`qlmanage -t -s 1280`): it ignores rotations, gradients and p:style fills and substitutes Calibri/Constantia with Times —
  don't "fix" the renderer to match it; check the XML instead.
- **`cupsfilter`/`textutil`** couldn't make test PDFs in the sandbox → test PDFs are written by hand (`$SCRATCH/fai_pdf.py`, `predica_prova.pdf`).
- **PDF colour per item** failed when pdf.js merged runs of different colours → sample colour per word + `unisciCol` palette.
- **Game auto-grow first version** made Ruota's wheel smaller → added «header rows must not wrap» and «main area share ≥ −8 pts» limits.
- **adattaScritte v1** reduced every game to 0.82: inline font sizes weren't reset before recomputing, and the horizontally scrolling players row counted as overflow → both fixed.
- **Removing cross-file duplicate questions** by line offset: `controlla_domande.py` reports the HEADER line number (IT = n+1).
- Browser pane: screenshots stale when the pane is hidden (`document.visibilityState==='hidden'`, timers throttled → flaky autoTest). Front the tab / scroll once; rerun.

---

## ✅ Working Solutions

- Any new game content = data file + generator with validation; engine untouched (Ruota `genera.py`, Mistero `strumenti/misteri/genera.py`).
- Game fitting pipeline: `adattaGioco` (reset text sizes → scale z) → `adattaScritte` (common text multiplier) → `adattaRuota` if wheel.
- Gara hooks into the existing save path (`salvaRisultato` → `garaRegistra`); Mistero's gara plays the same case for everyone.
- Every resize handler first checks `zoomNativo()`; widths via `largFinestra()`.
- Bibles: IT = Nuova Diodati, RO = Cornilescu (e.g. Tsiba, Ahithofel, Scemaiah, Mikal, Bethel in ND; Iafo, Tars, «valea Terebinților» in RO).

---

## 🔧 Dependencies & Setup

```bash
cd "/Users/ovidio/Desktop/ovidiu/claude/prediche e domande"
SCRATCH=/private/tmp/claude-501/-Users-ovidio-Desktop-ovidiu-claude/<session>/scratchpad   # new session = new scratchpad
python3 strumenti/misteri/genera.py            # after editing strumenti/misteri/casi_*.json
python3 strumenti/giochi/genera.py             # after editing strumenti/giochi/*
python3 costruisci.py 8.1.8                    # ALWAYS pass the version
ln -sf "$PWD/Prediche_e_Domande_v8.1.8.html" "$SCRATCH/app.html"; (cd "$SCRATCH" && python3 -m http.server 8797 &)
# console: r=await autoTest(); JSON.stringify({n:r.n,passati:r.passati.length,errori:r.errori})   at 1180×820, 744×1133, 390×844
DeRez -only icns Prediche_e_Domande_v8.1.7.html > "$SCRATCH/icona.r"   # icon resource (old scratchpad copy is gone in a new session)
python3 pubblica.py 8.1.8
Rez -append "$SCRATCH/icona.r" -o Prediche_e_Domande_v8.1.8.html && SetFile -a C Prediche_e_Domande_v8.1.8.html && rm Prediche_e_Domande_v8.1.7.html   # keep v8.0.4!
for i in $(seq 1 12); do V=$(curl -s "https://birlaovidiu-jpg.github.io/prediche-e-domande/?x=$RANDOM" | grep -o 'const VER="[^"]*"' | head -1); echo $V; case "$V" in *8.1.8*) break;; esac; sleep 20; done
```
Pure Python 3 stdlib + vanilla JS/CSS (pdf.js 3.11 embedded from `dati/pdf*.min.js`). **No** lookbehind regex, `??=`, `?.`, `.at()`, `structuredClone`;
object spread avoided (use `Object.assign`). One strict-mode script concatenated by filename: `grep` for duplicate top-level names before adding.
Test origin localhost:8797 holds test data only (players Anna, Marco, Luca, zzMis…, test lezionari, test book, test sermons).

---

## ➡️ Next Steps

1. **Wait for Ovidiu's feedback on the real iPad/iPhone** for 8.1.7: pinch zoom (no flicker), page turn, note window with keyboard, Apple Pencil pen,
   Proietta fullscreen + AirPlay, game text sizes, Mistero Biblico on iPhone, gara proposal.
2. **Still pending from his requests:** «almeno 1000 domande nuove per lingua» in the OTHER games (Versetto 43, Parola 64, Tempio 20+15, Viaggio 7,
   Impiccato ~865, Codice 200…) — only the Ruota got its 2000. More Mistero cases whenever he asks («tantissime soluzioni»).
3. Told but NOT fixed (fix only if he asks): Viaggio card text «…per sbloccarlo» cut on small iPad portrait; pen strokes not in PDF/print/projection;
   EMF/WMF images in PowerPoint can't be shown; Mistero archive shows the Bible reference only after solving; «metti in ordine» is tap-in-sequence, not drag.
4. Old PowerPoints imported before 8.1.4 need re-import to get the faithful copy.

---

## ⚠️ Gotchas / Traps

- Odometer: 8.1.7 → **8.1.8** → … → 8.1.9 → 8.2.0.
- Mistero unlock: `misSblocco` — first 3 easy open; easy i≥3 needs i−1 solved; medium needs 2+i; expert 5+i (by index within difficulty, cases sorted by `num`).
- Gara: `GARA` is in memory only (not saved); finished gare are in `stato.gare`. Tris has no gara (already 2 players).
- `gio-fissa` for Mistero only in intro/scena/prove (`vMistero` toggles it); archive/fine scroll.
- `_GIO_SCRITTE` selector list decides which texts grow; add new game text classes there.
- `adattaGioco` memo `_gioZ` key = game + window size + projection flag; the scale only shrinks within the same game/screen after the first fit.
- `9_avvio.js` tests snapshot/restore player data; the Blitz tests still run on dormant Blitz code.

---

## 💬 Notes

- His sermons are `.pages` files in `/Users/ovidio/Desktop/ovidiu/chiesa/predici` (read-only); PowerPoints in `…/chiesa/Pawer Point/` and `…/întrebări biblice/`.
- No audio exists in any game (told him); AirPlay mirroring keeps the iPad aspect ratio (bands on a wide TV — told him).
- He adds requests mid-turn: fold them in, finish, and report everything at the end with honest numbers and what was NOT tested on a real device.
