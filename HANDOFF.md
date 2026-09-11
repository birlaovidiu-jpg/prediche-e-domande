# Handoff — Prediche e Domande (SDARM)

> Updated 11 September 2026 — resume in a new Claude Code session.
> **Reply to Ovidiu in Italian, plainly, no jargon.** He is not a programmer.
> Current delivered version: **v7.8**.

---

## 🎯 Goal

One self-contained HTML file (~13 MB, no internet needed) that Ovidiu — an SDARM
church officer working in Italian and Romanian on Mac/iPad/iPhone — uses to run
church meetings: Bible quizzes, hymns, sermons, poems, experiences, a Bible
reader, sunrise/sunset, and a Sabbath-School lesson reader with PDF-style
annotation. Everything projects to a second screen.
"Done" = he can run a whole meeting from it on the iPad.

---

## 📍 Where everything lives

| | |
|---|---|
| Project | `/Users/ovidio/Desktop/ovidiu/claude/prediche e domande/` |
| GitHub | **public** repo `birlaovidiu-jpg/prediche-e-domande` |
| Live app | https://birlaovidiu-jpg.github.io/prediche-e-domande/ (branch `gh-pages`) |
| Build | `python3 costruisci.py 7.9` → `Prediche_e_Domande_v7.9.html` |
| Publish | `python3 pubblica.py 7.9` — builds + updates the site (uses a git worktree, never touches the working tree) |
| Test server | `python3 -m http.server 8796`, then `…v7.9.html?nc=1` (the `?nc=` avoids a stale cache — this cost a long false-alarm debugging session once) |
| Self-tests | open in a browser, run `autoTest()` in the console — **216 checks, `falliti` must be empty** |

**The data is now inside the repo** (`dati/`, ~15 MB). The old temporary-scratchpad
paths are still in `costruisci.py`'s `CARTELLE` list as a fallback, but the old
scratchpad has already been wiped once — do not rely on it.

---

## ✅ Current state — what works

- **Domande bibliche** — 10.000 (5.000 it + 5.000 ro), 2.500 per each of 4 difficulty
  levels, all 66 books. The ~4.900 new ones are machine-built from the Bible text by
  `dati/`-fed generators with four self-verifying shapes (which book · what the
  reference says · complete the verse · which chapter).
- **Chi ha detto?** — 4.816 phrases, speaker verified on the text.
- **Memoria delle presentazioni** — what he has already presented never comes back until
  the pool is exhausted; remembered forever (`stato.viste`, 7-char hashes of the text, so
  it survives rebuilds). Round counter + "Ricomincia il giro" button.
- **Per-language totals** on the home tiles and above both sections.
- **Bibbia** — 3 versions embedded (LND it, Cornilescu ro, KJV en). Tapping a verse projects
  the **whole chapter** starting there, so forward/back works.
- **Cantici** — 1.549 in 4 collections; backing-track play button in projection and regia,
  never automatic.
- **Prediche** — 62, extracted from his `.pages` files **with their formatting** (colours,
  fonts, sizes, bold, italic) by the IWA parser. Full-screen sheet, **one** toolbar,
  Word-like editing, images, pinch zoom, custom **🎞 Diapositive** (PowerPoint-like) that
  can be placed anywhere in the sermon, trash button, total in the top bar.
  New sermon → metadata dialog, then straight into the full-page white sheet in edit mode.
- **Esperienze** — 183 so far (77 `vera` + 106 `racconto`). Two filter buttons, a badge on
  every one, and a notice in the reader saying which it is. They open in the **same
  full-page sheet as the sermons**.
- **Scuola del Sabato** — page fits an iPad without scrolling; annotations cross between the
  Italian and Romanian editions **onto the same words** (see below); highlighter and
  underline stop **at the letter**; PDF rendered at 3× density.
- **Home** — clean blue logo in the top bar, sky panel whose backlight follows the real sky
  colour continuously, moon always visible in its true direction with its real phase and
  the day's real apparent size.
- **Web app** — service worker (`sorgenti/sw.js`, version baked in at publish time) caches
  the whole program; opens instantly and offline after the first visit, and tells him when
  a new version is ready.

---

## 🧩 The hard part: cross-language annotations

Three failed designs before this worked. The current one, in `6d_lettore.js`:

1. **Group** = `t<year>-<quarter>`, taken from the **median Sabbath date** of the detected
   lessons — not from the year printed on the cover, which the two editions write differently.
2. **`schemaGruppo(l)`** decides *how* to write an address, looking at **all** lezionari of
   that quarter at once, so both editions necessarily agree:
   - dates only if **every** edition has them (`completaDate()` fills gaps by counting
     7 days per lesson from any one known date);
   - weekdays only if **every** edition detects them, and only the weekday numbers in the
     **intersection** (`giorniComuni`) — otherwise the Italian, which doesn't print
     "Sabato" on the lesson page, would count pages from a different origin;
   - otherwise the lesson's **ordinal**, normalised to 13 if the editions count a different
     number of lessons.
3. **The key is the DAY, not the page** (`chiaveNota` returns `S<date>G<k>` with no page
   offset). The same sentence can be on page 87 in Italian and page 88 in Romanian.
4. **Every mark stores a text anchor** (`ancoraDa`): which paragraph *of the whole day*
   (paragraphs are stitched back together across page breaks when the previous one doesn't
   end in sentence punctuation), **which sentence**, and the character offsets inside that
   sentence. `rettDaAncora` maps it back onto the other edition's own words.
   Sentence-level is the key: proportional mapping over a whole paragraph drifts by a line.
5. `rettDi(a,n)` returns the rectangles for the current page: from the anchor when there is
   one (so the mark follows the text onto whatever page holds it), otherwise from `a.off`
   (the page offset within the day) for marks with no text under them — empty answer lines,
   pen strokes, text notes.

Verified with real PDFs: highlighting *«Come Fratello maggiore della nostra razza, Egli
conosce le necessità di coloro che…»* in Italian lands exactly on *«Ca Frate mai mare al
neamului nostru, El cunoaște nevoile celor care…»* in Romanian, across a page break.

---

## 📁 Files

| File | Role |
|------|------|
| `costruisci.py` | Build. `CARTELLE` lists where to find data; `dati/` first. |
| `pubblica.py` | Build + publish to GitHub Pages. Uses a **git worktree** — an earlier version used `git stash` and left the repo on an orphan branch. |
| `sorgenti/1_nucleo.js` | State, IndexedDB, `apri()`, navigation, **presentation memory** (`chiaveVista`, `pescaNuove`, `segnaViste`), `contaLingue`/`strisciaLingue` |
| `sorgenti/2_proiezione.js` | Projection, slides, regia, `p-img` slide type, hymn backing track (`BASE_MU`) |
| `sorgenti/3_domande.js` | Questions view + filters (two rows incl. search) |
| `sorgenti/4_cantici.js` | Hymns |
| `sorgenti/5_prediche.js` | **Sermons + the shared full-page sheet** (experiences use it too via `trovaPredica` falling through to `tutteEsperienze`), custom slides, pinch zoom |
| `sorgenti/6_esperienze.js` | Experiences list, `vera`/`racconto` filter |
| `sorgenti/6c_sabato.js` | Lezionari: language/year/quarter/lesson/day detection, `completaDate`, compact page |
| `sorgenti/6d_lettore.js` | **PDF reader** — the most delicate file. Annotations, anchors, tools, undo, canvas lifecycle |
| `sorgenti/6e_sole.js` | Astronomy, continuous sky colours (`CIELO_FASI`), moon |
| `sorgenti/6f_bibbia.js` | Bibles, reference parsing |
| `sorgenti/6g_chihadetto.js` | "Chi ha detto?" |
| `sorgenti/7b/7c/7d_*.js` | PPTX, PDF, sermon PDF |
| `sorgenti/8_home_dati_guida.js` | Home tiles, data/backup (incl. restoring removed sermons/experiences), guide |
| `sorgenti/9_avvio.js` | **216 self-tests** + boot + service-worker registration |
| `sorgenti/sw.js` | Service worker template (`__VER__` replaced at publish) |
| `sorgenti/stile.css` | All CSS (~75 KB) |
| `dati/` | Bible, questions, hymns, sermons, experiences, pdf.js, icons |

---

## ❌ Failed attempts — do not repeat

### Annotations keyed by page position
Marks landed at the same *place on the sheet* in the other language, not on the same words.
He sent photos proving it. → text anchors, see above.

### Anchoring proportionally over the whole paragraph
An 824-character paragraph drifts 40–80 characters between translations — a whole clause.
The Italian «Il Suo stesso esempio…» landed on the Romanian «El știe că solii…».
→ anchor **per sentence**.

### Anchoring per page
The same paragraph is cut by the page break at different points in the two editions, so the
paragraph on "page 87" is not the same paragraph. → stitch paragraphs across the day's pages,
and key annotations by day.

### Word-level highlight selection
He asked for letter precision. Snapping to whole words also dragged in one extra word at each
end. → clip the band at the finger's exact X, clamped to the row's text extent.

### `git stash` inside `pubblica.py`
Left the repo checked out on an orphan branch with the work stashed. → `git worktree`.

### `IntersectionObserver` for lazy page rendering
After freeing a canvas the observer does not fire again for an element whose intersection
state has not *changed*, so pages stayed blank. → scroll listener + 350 ms interval safety net;
`liberaLontane` never frees a visible page.

### Rendering every page's canvas at once
iOS silently returns **blank canvases** past a total-canvas-memory limit. → keep only pages
within `raggioVivo()` (computed from a 190 MB budget at the current density) and free the rest.

### `scrollIntoView({behavior:'smooth'})`
Did not move over long distances inside the scroller. → `portaAPagina(n)` sets `scrollTop`.

### Highlighter drawn with `globalAlpha`
Washed colours and darkening overlaps. → dedicated `.let-evid` canvas with
`mix-blend-mode: multiply`, all rectangles of one mark filled in a **single** `fill(Path2D)`.

### Duplicate top-level `const` across source files
All files are concatenated into ONE script — `SyntaxError: Identifier has already been
declared` kills the **entire app** silently. Happened with `MESI`, `COL_EVID`, `BASE`.
**Always grep `sorgenti/` before adding a global.**

### Lookbehind regex `(?<=…)`
Unsupported by older iPad Safari → parse error → whole app dead. It slipped back in twice.

### Quarter detection by first month name found
Romanian **"mai"** means "more". → look for the month **range** first, then whole words
skipping "mai".

### Weekday detection by full name only
The Italian lezionario writes "Dom, 6 Set". → full name *or* abbreviation followed by a day
number, with word boundaries so "mar" does not match "Marco".

### Positional sermon ids (`'p'+i`)
Changing the sermon list moved his annotations onto the wrong sermons. → ids are now
`'pr'+numero` (from the filename), with a one-time migration table `_MAPPR` applied by
`spostaAppuntiPrediche()`.

---

## ➡️ Next steps (in his order)

1. **Esperienze → 500**: he wants **200 `vera` + 300 `racconto`**. Now at 77 + 106.
   Write them in `<scratchpad>/esp/g*.json` (racconti) and `v*.json` (vere), then
   `python3 _unisci.py` writes `dati/esperienze_500.json`. Each entry needs
   `tit, lg, tipo, rif, testo` and >420 characters; duplicates are keyed by (lg, title).
   **He was told and accepted** that the `racconto` ones are written by me — keep them free
   of invented named real people, and keep the `vera` ones factually checkable.
2. **Translate the 52 Romanian sermons into Italian**, preserving colours/italics/layout.
   They become separate entries in the list (the in-sermon language switch was removed).
3. **Giochi** — at least 300, replacing "Quiz a sorpresa" on the home: maxims/phrases with a
   spiritual reflection, crosswords, tic-tac-toe and more.

---

## ⚠️ Gotchas

- **Ovidiu's standing rule** (memory `regole-lavoro-ovidiu`): do *exactly* what he asks,
  nothing else. No unrequested buttons, sections or "improvements". If you spot a defect,
  tell him in words and wait. Never delete his files.
- Reply **in Italian**, plainly. Never use his real data (names, churches) in examples.
- Every message is a precise list of requests — do all of them, one build, one delivery.
- He sends new requests **while you are still working**. Keep a list; don't drop the earlier ones.
- **Before adding any top-level `const`/`function`, grep `sorgenti/`.**
- No lookbehind regex, no `??=`/`.at()`/`structuredClone` in our own code (old iPad Safari).
- `[hidden]` loses to `display:flex` — use `.x[hidden]{display:none!important}`.
- The browser preview pane used for testing is often `document.hidden` → `requestAnimationFrame`
  and programmatic scroll events do not fire. Do not mistake that for a real bug.
- Delete test PDFs from the project folder before delivering (`lez_*.pdf`, `anc_*.pdf`, `sp_*.pdf`).
- Deliver with `SendUserFile`, and publish with `pubblica.py` so the iPad link updates.
- His sermon `.pages` files are in `/Users/ovidio/Desktop/predici/` (61 files, `<numero>-<titolo>.pages`).
  Apple Pages is **not installed**: they are read by the IWA parser now kept in
  `strumenti/` (`iwa.py` → Snappy, `iwa2.py` → protobuf walker, `estrai_predica.py` → styles
  to HTML, `tutte_prediche.py` → the whole folder).
- **The question and «Chi ha detto» generators were lost** when a temporary scratchpad was
  wiped. The *output* is safe in `dati/domande_10000.json` and `dati/chihadetto_nuovo.json`;
  only the scripts are gone. The method is written up in the section above — rewrite them if
  more are needed. `strumenti/` is there so this does not happen again.
- The repo is **public** and contains the three Bible translations. He was warned about the
  copyright and chose to publish anyway. If a takedown ever arrives, build a public version
  without the Bibles.
