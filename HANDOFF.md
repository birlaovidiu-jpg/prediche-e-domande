# Handoff — Prediche e Domande (SDARM)

> Updated 6 September 2026, 23:30 — resume in a new Claude Code session.
> **Reply to Ovidiu in Italian, simple, no jargon.** He is not a programmer.

---

## 🎯 Goal

One self-contained HTML file (~10.5 MB, no internet needed) that Ovidiu — an SDARM
church officer who works in Italian and Romanian on Mac/iPad/iPhone — uses to run
church meetings: Bible quizzes, hymns, sermons, poems, testimonies, a Bible reader,
sunrise/sunset, and a Sabbath-School lesson reader with PDF-style annotation.
Everything projects to a second screen. "Done" = he can run a whole meeting from it
on the iPad without touching anything else.

Current delivered version: **v7.3** (`Prediche_e_Domande_v7.3.html`, ~12 MB).

### What v7.3 added
- **10,000 questions** (5,000 it + 5,000 ro, 2,500 per difficulty level, all 66 books).
  New ones are machine-built from the Bible text by `genera_domande.py` with four
  self-verifying shapes (which book · what the reference says · complete the verse · which chapter).
- **«Chi ha detto» 2,909 → 4,816**: `chd9.py` (wider speech verbs, inverted subject,
  multi-sentence splitting, partial discourses kept) + `salmi.py` (psalms whose
  superscription names the author). **He asked for +3,000; +1,907 is what strict
  attribution allows** — the rest would need pronoun guessing, which he forbade.
- Per-language totals on the home tiles and above both sections (`strisciaLingue`).
- Tapping a verse now projects the **whole chapter** starting on that verse.
- Lesson reader: PDF canvas at **3×** (was 1.5–2×), notes layers at 2×, alive-page
  radius computed from a 190 MB canvas budget (`fittezza`, `raggioVivo`).
- Highlight/underline **stops mid-line** at the word (`paroleDiRiga` splits pdf.js text
  items into words by proportional width).
- Cross-language notes finally work — see memory `appunti-lezionari-due-lingue`.
- Sabbath-school page fits an iPad without scrolling (`body.sab-fissa`).
- Sky-panel backlight follows the sky colour continuously (`CIELO_FASI`, `luciCielo`).
- Moon always drawn: true azimuth (clamped to the edge when off-panel), real phase,
  size equal to the sun and varying with its real distance; below the horizon it sits
  on the horizon line, dimmed.
- Sermons: full screen (`body.pred-fissa`), **one** toolbar, «Dove ho predicato» in the bar,
  Word-like editing, images stored in IndexedDB (`data-all`, `risolviImmagini`),
  per-language text (`annot(i).testi[lg]`) sharing one sheet style, list defaults to Romanian.
- Projection composer: «Prendi tutti: Versetto / Testo …» (`scegliTipo`).
- Hymn backing track: play button in projection and regia (`bottoneBase`), never automatic.
- **`costruisci.py` now searches a LIST of data folders** and fails with a clear message.

### Still open after v7.3
- His sermon `.pages` files are **not on the Mac any more** (iCloud evicted them), so
  «make the sermons identical to my files» could not be done. He must download
  `Predici` / `Predici Ovidiu` from iCloud first.
- The 150 hymn mp3 (625 MB in `~/Desktop/ovidiu/chiesa/inni/`) cannot be embedded.

---

## 📍 Current State

**Working:**
- **Build**: `python3 costruisci.py <version>` assembles `sorgenti/*.js` + `stile.css` +
  `guscio.html` + JSON data into `Prediche_e_Domande_v<version>.html`.
- **Self-tests**: `autoTest()` in the browser console — **195 checks, all passing**.
- **Domande bibliche** — 5111 questions (IT+RO), book / Old-New Testament / difficulty
  filters, projection, PDF, PowerPoint, "quiz a sorpresa".
- **Chi ha detto?** — 2909 phrases rebuilt from the embedded Bible text with strict
  speaker rules (see Failed Attempts). 3 difficulty levels, OT/NT, "with 3 answers"
  or "answer only" presentation modes.
- **Bibbia** — 3 versions embedded (LND it, Cornilescu ro, KJV en), gzip+base64,
  book/chapter/verse grid.
- **Cantici** — 1549 hymns in 4 collections; Ovidiu's own collection is exactly 84
  (68 from his `Cântări.pdf` + 16 from `~/Desktop/cantari ovidiu/*.pages`).
  Projection has no "Strofa/Ritornello" labels; each written line stays on one screen
  line; music file can be attached from inside the hymn window.
- **Prediche / Poesie / Esperienze / Scuola del Sabato / Bibbia / Dati e copie / Guida**.
- **Home** — no hero box; large tiles; live sun/moon panel (real astronomy, updates
  every 20 s and on returning to the app), horizon line sitting exactly on top of the
  sunset bar, backlight coloured by the current sky.
- **Lesson reader** (`6d_lettore.js`) — continuous scrolling with 2 mm page gap, pinch
  zoom, left toolbar with labels, highlighter (true colours, one-line band, adjustable
  transparency), underline (separate colour + thickness), pen, text notes (movable,
  resizable, font + size + colour, voice dictation), eraser, selection-eraser,
  undo/redo, note list, page colour (11 tints), lesson index, "Sabato" button.
- **Cross-language notes** — annotations are keyed by *Sabbath date + weekday + page
  offset*, so what you write on the Italian lezionario appears on the Romanian one of
  the same quarter and vice versa.

**Not working / not started:**
- **Giochi** (games, 500 crosswords with 3 difficulty levels, Bible games for young
  people) — asked for twice, never started. He postponed them to finish the lezionario.
- **Libri** (Ellen White / Uriah Smith / Jones & Waggoner library) — he chose "books in
  a folder next to the HTML" (`libri/indice.js` loaded via injected `<script>` tags,
  because `fetch` is blocked on `file://`). Never built.
- **"Libri e giochi" as a separate home category** — asked for, blocked by the two above.
- **Working Policy** fully translated IT+RO + a "Finanze" button — asked for long ago.
  `estraiwp.html` (pdf.js position-aware extractor) was written but **never run**.
  The PDF states "no part may be reproduced without written permission" — flagged to him.
- **Chi ha detto** is at 2909, he asked for "at least 3000". Getting the last ~90 would
  require loosening the attribution rules, which he forbade ("no margin of error").

---

## 📁 Relevant Files

| File | Role / Status |
|------|--------------|
| `costruisci.py` | Build script. **Line 4 `SCR=` points at a temporary scratchpad — see Gotchas.** |
| `sorgenti/1_nucleo.js` | State, IndexedDB, `apri()` modal, navigation, `MESI`, `vai()` |
| `sorgenti/2_proiezione.js` | Projection engine, slides, regia, ESC button, text fitting |
| `sorgenti/3_domande.js` | Bible questions view + filters |
| `sorgenti/4_cantici.js` | Hymns, music attachment, projection slides |
| `sorgenti/5_prediche.js` | Sermons, rich-text editor, `FAMIGLIE` font stacks |
| `sorgenti/6c_sabato.js` | Lezionari: language/year/quarter detection, lesson & day detection, next-Sabbath logic, index |
| `sorgenti/6d_lettore.js` | **PDF reader** — the most edited file. Annotations, tools, undo, canvas lifecycle |
| `sorgenti/6e_sole.js` | Sun/moon astronomy, sky drawing, home panel |
| `sorgenti/6f_bibbia.js` | Embedded Bibles, reference parsing |
| `sorgenti/6g_chihadetto.js` | "Chi ha detto?" view |
| `sorgenti/7b/7c/7d_*.js` | PPTX writer, PDF writer, sermon PDF |
| `sorgenti/8_home_dati_guida.js` | Home tiles, data/backup, guide |
| `sorgenti/9_avvio.js` | **157 self-tests** (`autoTest`) + boot |
| `sorgenti/stile.css` | All CSS (~64 KB) |
| `Prediche_e_Domande_v7.2.html` | Last delivered build |

Data JSON (**outside the project**, see Gotchas):
`chihadetto.json`, `cantici_v3.json`, `domande_finali.json`, `bibbia.json`,
`prediche_finali.json`, `poesie_finali.json`, `esperienze_finali.json`,
`localita.json`, `icone.json`, `logopulito.json`.

---

## ❌ Failed Attempts

### IntersectionObserver for lazy page rendering
- **What:** used an `IntersectionObserver` to draw PDF pages as they scrolled into view.
- **Why it failed:** after freeing a far-away page's canvas, the observer does not fire
  again for an element whose intersection state has not *changed*, so pages that were
  freed while still on screen stayed blank forever.
- **Fix:** a `scroll` listener on `#letArea` + a 350 ms interval safety net that compares
  `scrollTop` (`aggiornaVista()`), and `liberaLontane()` never frees a visible page.

### Rendering every page's canvas at once
- **What:** in scroll mode, created 3 canvases per page for all 94 pages.
- **Why it failed:** iOS/iPadOS has a hard total-canvas-memory limit and silently
  returns **blank canvases** past it. Ovidiu saw "only the cover, all other pages white".
- **Fix:** keep only pages within ±3 of the current one; free the rest (`width=height=1`).

### `scrollIntoView({behavior:'smooth'})`
- **What:** used to jump to a lesson from the index.
- **Why it failed:** over long distances inside the scroller it simply did not move; the
  page counter changed but the view stayed put.
- **Fix:** `portaAPagina(n)` computes the delta with `getBoundingClientRect()` and sets
  `area.scrollTop` directly.

### Highlighter drawn with `globalAlpha` on the notes canvas
- **What:** filled the line rectangles with `globalAlpha = 0.38`.
- **Why it failed:** (a) colours came out washed and shifted — "i colori devono essere
  veri"; (b) overlapping rectangles between consecutive lines darkened, which looked
  like a line drawn under the text.
- **Fix:** a dedicated `.let-evid` canvas with CSS `mix-blend-mode: multiply` (real
  marker behaviour), all rectangles of one annotation filled in a **single** `fill(Path2D)`.

### Highlight band geometry
- **What:** first `y0-0.004 … +0.008`, then `y0-10% … height×1.34`.
- **Why it failed:** the band overflowed into the neighbouring lines, so several lines
  merged into one block. He complained twice.
- **Fix:** `y0 + 14% … height × 1.06` — exactly one line tall, text vertically centred.

### Underline position
- **What:** drawn at the text box bottom (= the baseline), then at +20 % of line height.
- **Why it failed:** at the baseline it cut through descenders (g, p, q); at +20 % it was
  visibly too far below.
- **Fix:** `+6 %` of the line height (min 1 px).

### Note key based on the lesson number
- **What:** `L<lessonNumber>G<weekday>+<offset>` as the shared-annotation key.
- **Why it failed:** the Italian and Romanian editions **number the lessons differently**
  (his files: Italian "12. Il privilegio della preghiera" vs Romanian "11. Privilegiul
  rugăciunii" — same lesson, same Sabbath). Notes never met.
- **Fix:** key on the **Sabbath date**: `S2026-09-12G0+0`. `chiaveVecchia()` migrates
  notes saved under the old key on first read.

### Weekday detection by full name only
- **What:** looked for "domenica"/"duminică" in the first 170 characters of the page.
- **Why it failed:** the Italian lezionario writes the day abbreviated and far down the
  page: "Dom, 6 Set". No day found → different key from the Romanian one.
- **Fix:** full name *or* abbreviation (dom/lun/mar/mer/gio/ven/sab, dum/lun/mar/mie/joi/
  vin/sam) followed by a day number, searched in the whole page, with word boundaries so
  "mar" does not match "Marco".

### Quarter detection by first month name found
- **What:** searched month names inside the accent- and space-stripped text.
- **Why it failed:** Romanian **"mai"** means "more" and appears everywhere ("mai
  strânsă"), so *Umblând cu Isus* (July–September) was filed under April–June and did not
  show up in the Lug–Set box.
- **Fix:** look for the month **range** first ("IULIE - SEPTEMBRIE"), then single whole
  words skipping "mai". Already-saved lezionari are re-checked once by
  `ricontrollaTrimestri()` (skipped if the user set the quarter by hand).

### Text-note box wider than the text
- **What:** `.let-tx` had `white-space: pre-wrap`.
- **Why it failed:** the whitespace between `</span>` and the handle `<span>`s in the
  template was rendered, inflating the box.
- **Fix:** `white-space: normal` on `.let-tx`, `pre-wrap` on `.tx-corpo`, no whitespace
  in the template.

### `.let-testi` overlay capturing pointer events
- **Why it failed:** with the text tool active, tapping an empty area hit the overlay and
  nothing happened.
- **Fix:** `pointer-events: none` on the layer, `auto` on the `.let-tx` children.

### Tap-to-hide the toolbars
- **What:** `nudo()` was called from `letGiu()` on the notes canvas.
- **Why it failed:** with the hand tool the notes canvas has `pointer-events: none`, so
  the tap never arrived. Ovidiu reported "the buttons don't work".
- **Fix:** a document-level `click` handler that ignores the toolbars and calls `nudo()`.

### Duplicate top-level `const` names across source files
- **What:** added `MESI` in `6c_sabato.js` and `COL_EVID` in `6d_lettore.js`.
- **Why it failed:** all files are concatenated into ONE script — `SyntaxError:
  Identifier has already been declared` kills the **entire app** silently.
- **Fix:** renamed to `MESI_LEZ`, `COL_EVID_LEZ`. **Always grep before adding a global.**

### Lookbehind regex `(?<=...)`
- **Why it failed:** unsupported by older Safari (iPad) → parse error → whole app dead.
  It slipped back in twice. Avoid entirely.

### "Chi ha detto?" extraction by nearest name
- **What:** the original 3534 phrases were attributed to whatever name was near the quote.
- **Why it failed:** ~1 in 10 wrong (Nicodemus→Jesus, Ahimelech→David, a demon→God), plus
  fragments that were not speech at all.
- **Fix:** rebuilt from the Bible text: the name must be the **subject** of the speech
  verb, only one proper name in the introduction, nested "Così dice l'Eterno" ends the
  span, and the two translations must agree. 58 phrases hand-checked, all correct.

### Julian day truncation in `calcolaSole`
- **Why it failed:** `Math.floor(JD)` returned the *previous* day, so after sunrise the
  panel still showed "ALBA … fra 0 min".
- **Fix:** build the day number from the local calendar date via `Date.UTC(y,m,d)`.

---

## ✅ Working Solutions

- **One build script, many small source files.** Never edit the generated HTML.
- **`autoTest()`** — 157 checks. Run it after every build:
  open the file and evaluate `autoTest()` in the console; `falliti` must be empty.
- **Local server for testing**: `python3 -m http.server 8796` inside the project folder,
  then open `http://localhost:8796/Prediche_e_Domande_vX.Y.html?v=N` (the `?v=` avoids
  the browser cache, which caused a long false-alarm debugging session).
- **Test the UI with real clicks**, not by calling functions from the console. Two real
  bugs (tap-to-hide, index navigation) were invisible to function-level testing.
- **Synthetic lezionari for testing**: build a text file and convert with
  `cupsfilter -i text/plain in.txt > out.pdf` — produces a real PDF with a text layer.
- **Annotations keyed by Sabbath date** — language- and numbering-independent.

---

## 🔧 Dependencies & Setup

```bash
cd "/Users/ovidio/Desktop/ovidiu/claude/prediche e domande"
python3 costruisci.py 7.3          # writes Prediche_e_Domande_v7.3.html
python3 -m http.server 8796        # for testing in the browser
```

No third-party libraries. pdf.js is embedded in the HTML shell; its worker is stored as
`<script id="pdfWorkerSrc" type="text/js-worker">` and started from a Blob URL (running
it on the main thread froze the page).

---

## ➡️ Next Steps

1. **Save the data JSON inside the project** — see the first Gotcha. Without it the
   build cannot run in a new session. Ask Ovidiu first (he decides about his folders).
2. **Giochi** — he asked twice: 500 crosswords with 3 difficulty levels and Bible games
   for young people, in their own home category together with the books.
3. **Libri** — folder-based library (`libri/indice.js` + `<script>` injection, because
   `fetch` is blocked on `file://`), then the "Libri e giochi" home category.
4. **Working Policy** translated IT+RO with a "Finanze" button — run `estraiwp.html`
   first; re-flag the copyright notice before doing the work.
5. Wait for his feedback on v7.2 (bigger flags, cross-language notes). If notes still do
   not cross, ask him to open the **Indice** on both lezionari and check whether one of
   the two lists is empty — that is the fastest diagnostic.

---

## ⚠️ Gotchas / Traps

- **The data now lives in the repo** (`dati/`, ~15 MB) and `costruisci.py` looks there
  first. The old temporary-scratchpad paths are still in the list as a fallback, but the
  build no longer depends on them. Fixed 7 September 2026.
- **The project is a git repo**, pushed to the **private** GitHub repository
  `birlaovidiu-jpg/prediche-e-domande`. Built HTML files are git-ignored; the finished
  build is attached to a **Release** (`gh release create vX.Y "Prediche_e_Domande_vX.Y.html"`).
- **Ovidiu's standing rule (memory `regole-lavoro-ovidiu.md`):** do *exactly* what he
  asks, nothing else. No unrequested buttons, sections, texts or "improvements". If you
  spot a defect, tell him in words and wait. Never delete his files.
- Reply **in Italian**, plainly. Never use his real data (names, churches) in examples.
- Every message is a precise list of requests — do all of them, one build, one delivery.
- **Before adding any top-level `const`/`function`, grep `sorgenti/` for the name.**
- No lookbehind regex, no `??=`/`.at()`/`structuredClone` in our own code (old iPad Safari).
- The browser preview pane used for testing is often `document.hidden` → `requestAnimation
  Frame` and programmatic scroll events do not fire. Do not mistake that for a real bug.
- Delete the test PDFs from the project folder before delivering (`lez_*.pdf`, `cop.pdf`).
- Deliver with `SendUserFile`; he opens the HTML on the iPad.

---

## 💬 Notes

- His Italian and Romanian lezionari are often **different quarters**; annotations only
  cross between editions of the *same* year+quarter. He was told.
- Highlight rectangles transfer to the other language at the same relative position:
  since the two editions are typeset differently they may land on slightly different
  words. Text notes and pen strokes transfer exactly. He was told.
- Sun and moon are drawn much larger than life so they are visible in the small panel;
  their *positions* are real (moon phase within 24 minutes on five known eclipses).
- Open question never answered: 14 phrases with "lo" instead of "Io" and ~660 with
  half-open quotation marks in the *old* "Chi ha detto?" data — superseded by the
  rebuild, but worth re-checking if he reports odd punctuation.
