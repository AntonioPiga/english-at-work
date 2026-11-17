# English at Work Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, dependency-free web app that delivers a work-focused English course (3 tracks × 6 modules, placement test, 6 flashcard decks) with quizzes, gap-fills, timed fluency drills with speech, and progress saved in the browser, published on GitHub Pages.

**Architecture:** Single `index.html` shell; ES modules under `js/` with a hash router rendering one view at a time into `#app`; all course material in JSON under `content/` loaded with `fetch`; pure logic (SRS, grading, store) isolated so it is testable with `node --test`.

**Tech Stack:** HTML, CSS custom properties, vanilla JS (ES2022 modules), Web Speech API, `localStorage`, Node 20+ `node --test` for tests only. No npm dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-english-at-work-design.md`

## Global Constraints

- No runtime npm dependencies; no build step; site served from repo root on GitHub Pages (`main`).
- UI copy in Italian; all course material (phrases, models, quiz stems, cards' backs) in English; grammar explanations in Italian.
- No real names of people, clients, counterparties or credentials in content. Counterparties are generic: "the partner bank", "the fund platform", "the vendor", "the custodian".
- Every module JSON validates against the schema in spec §7; quiz has 6-8 questions × exactly 4 options; phrases 8-12; fluency 3-4 drills; gapfill+reorder 4-6 total; grammar explanation ≤ 200 words.
- Default TTS voice `en-GB`, fallback `en-US`; microphone optional and never blocking.
- Leitner: 5 boxes, intervals in days `[0, 1, 3, 7, 14]`; wrong → box 1; max 20 new cards per day.
- `localStorage` key `eaw:v1`.

## Review Focus

1. Content JSON fails to load (offline, 404, bad JSON): the view must show an Italian error with a retry link, not a blank page. (Task 7 test: `content.js` rejects → module view renders `.error`.)
2. `localStorage` unavailable or corrupted (Safari private mode, truncated JSON): the app must still run with in-memory defaults. (Task 2 test: `createStore` with a throwing storage and with `"{not json"`.)
3. A fluency answer with contractions and punctuation ("we've rolled it back.") must match key phrase "we have rolled it back" / "rolled back". (Task 4 test: normalize expands contractions.)
4. Gap-fill answers with different casing or trailing spaces ("Walk ") must count as correct. (Task 4 test.)
5. A card answered correctly in box 5 stays in box 5 with due +14 days; the SRS session never returns a card due in the future. (Task 3 tests.)

---

### Task 1: Project scaffold, router, shell

**Files:**
- Create: `index.html`, `css/app.css`, `js/app.js`, `js/router.js`, `package.json`, `README.md`, `LICENSE`, `.gitignore`, `.nojekyll`
- Test: `tests/router.test.mjs`

**Interfaces:**
- Produces: `parseRoute(hash: string) -> {name: string, params: Record<string,string>}` in `js/router.js`. Routes: `""|"#/"` → `home`; `#/placement` → `placement`; `#/track/:id` → `track`; `#/module/:id` → `module`; `#/flashcards` → `decks`; `#/flashcards/:deck` → `flashcards`; `#/reference` → `reference`; `#/progress` → `progress`; anything else → `notfound`.
- Produces: `startRouter(onChange: (route) => void)` listens to `hashchange` and calls `onChange(parseRoute(location.hash))` immediately and on each change.
- `index.html` has `<header class="topbar">` with nav links to `#/`, `#/flashcards`, `#/reference`, `#/progress`, and `<main id="app">`.

- [ ] **Step 1: Write failing tests**

```js
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { parseRoute } from '../js/router.js';
test('home', () => assert.deepEqual(parseRoute(''), {name:'home', params:{}}));
test('module', () => assert.deepEqual(parseRoute('#/module/calls-01-opening'), {name:'module', params:{id:'calls-01-opening'}}));
test('deck', () => assert.deepEqual(parseRoute('#/flashcards/false-friends'), {name:'flashcards', params:{deck:'false-friends'}}));
test('notfound', () => assert.equal(parseRoute('#/nope/x/y').name, 'notfound'));
```

- [ ] **Step 2: Run `node --test tests/` → FAIL (module not found)**
- [ ] **Step 3: Implement `js/router.js`; write `index.html`, `css/app.css` (tokens: `--bg`, `--fg`, `--muted`, `--accent`, `--ok`, `--warn`, `--err`, `--card`, `--radius`; dark via `prefers-color-scheme`; `.topbar`, `.card`, `.btn`, `.btn-primary`, `.choice`, `.progress-bar`, `.badge-level`), `js/app.js` that imports `startRouter` and renders `<p>Caricamento…</p>` placeholder per route**
- [ ] **Step 4: `package.json`: `{"name":"english-at-work","private":true,"type":"module","scripts":{"test":"node --test tests/","serve":"python3 -m http.server 8080"}}`; `.gitignore` with `.DS_Store`; empty `.nojekyll`; MIT `LICENSE`; `README.md` (Italian: cosa è, come usarlo, come aggiungere un modulo)**
- [ ] **Step 5: Run `npm test` → PASS**
- [ ] **Step 6: Commit `chore: scaffold app shell and hash router`**

### Task 2: Store (localStorage, export/import)

**Files:**
- Create: `js/store.js`
- Test: `tests/store.test.mjs`

**Interfaces:**
- Produces: `createStore(storage = globalThis.localStorage) -> Store` where `Store` has `get() -> State`, `update(fn: (state) => void)` (mutates a draft then persists), `exportJSON() -> string`, `importJSON(text: string) -> boolean`, `reset()`.
- `State` default: `{version: 1, placement: null, modules: {}, srs: {}, streak: {last: null, days: 0}, settings: {rate: 1, voice: null, mic: true}}`.
- Module progress shape: `modules[id] = {quiz: {correct, total}, exercises: {correct, total}, fluency: number[] /* stars 1-3 */, completedAt: ISO|null}`.

- [ ] **Step 1: Write failing tests**: default state when storage empty; `update` persists under key `eaw:v1`; corrupted value `"{not json"` yields defaults; storage whose `getItem` throws yields in-memory store that still updates; `importJSON` rejects text without `version: 1` and returns `false`.
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement `js/store.js`** (deep-merge imported state over defaults).
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit `feat: versioned localStorage store with export/import`**

### Task 3: SRS scheduler (Leitner)

**Files:**
- Create: `js/srs.js`
- Test: `tests/srs.test.mjs`

**Interfaces:**
- Produces: `INTERVALS = [0,1,3,7,14]`; `review(card: {box:number, due:number}|undefined, correct: boolean, now: number) -> {box, due, last: now}` (undefined card = new, box 1; correct → `min(box+1, 5)` and `due = now + INTERVALS[box-1] days` using the *new* box; wrong → box 1, due = now).
- Produces: `buildSession(cardIds: string[], srsState: Record<string, {box,due}>, now: number, maxNew = 20) -> string[]` = due cards (due ≤ now) sorted by due asc, then up to `maxNew` unseen cards in deck order.

- [ ] **Step 1: Failing tests**: new card correct → box 2, due = now + 1 day; box 5 correct → stays 5, due +14 days; box 4 wrong → box 1, due = now; session excludes future cards; session caps new cards at 20; session puts due before new.
- [ ] **Step 2: Run → FAIL** · **Step 3: Implement** · **Step 4: Run → PASS**
- [ ] **Step 5: Commit `feat: leitner scheduler`**

### Task 4: Grading helpers

**Files:**
- Create: `js/grading.js`
- Test: `tests/grading.test.mjs`

**Interfaces:**
- Produces: `normalize(text) -> string` (lowercase; expand contractions `'ve→ have`, `'re→ are`, `'ll→ will`, `'d→ would`, `n't→ not`, `'m→ am`, `'s→ is`; curly quotes→straight; strip punctuation; collapse spaces; trim).
- Produces: `keyPhraseCoverage(answer, keyPhrases: string[]) -> {found: string[], missing: string[], ratio: number}` comparing normalized forms.
- Produces: `checkGap(input, answers: string[]) -> boolean` (normalized equality with any accepted answer).
- Produces: `checkReorder(words: string[], answer) -> boolean` (join with space, compare normalized).

- [ ] **Step 1: Failing tests** incl. Review Focus 3 and 4: `keyPhraseCoverage("We've rolled it back.", ["we have rolled it back"]).ratio === 1`; `checkGap("Walk ", ["walk"]) === true`; `checkGap("walks", ["walk"]) === false`.
- [ ] **Step 2: Run → FAIL** · **Step 3: Implement** · **Step 4: Run → PASS**
- [ ] **Step 5: Commit `feat: grading helpers`**

### Task 5: Speech wrapper

**Files:**
- Create: `js/speech.js`

**Interfaces:**
- Produces: `speak(text, {rate = 1} = {}) -> Promise<void>` using `speechSynthesis`; picks a voice whose `lang` starts with `en-GB`, else `en-US`, else default; resolves on `end`; no-op resolved promise when API missing.
- Produces: `canListen() -> boolean`; `listen({lang = 'en-GB', onInterim}) -> {stop(): void, result: Promise<string>}` using `SpeechRecognition || webkitSpeechRecognition`, `continuous = true`, `interimResults = true`; `result` resolves with the final transcript when stopped or on `end`.
- Produces: `stopSpeaking()`.

- [ ] **Step 1: Implement `js/speech.js`** (no unit test: browser API; verified in Task 9).
- [ ] **Step 2: Commit `feat: speech synthesis and recognition wrapper`**

### Task 6: Content loader and schema validation

**Files:**
- Create: `js/content.js`, `scripts/validate-content.mjs`, `content/index.json`, one sample module `content/tracks/calls/01-opening-a-call.json`, one sample deck `content/decks/false-friends.json` (3 cards, placeholder until Task 7), `content/placement.json` (empty `questions: []` placeholder)
- Test: `tests/content.test.mjs`

**Interfaces:**
- `content/index.json` shape: `{tracks: [{id, title, subtitle, modules: [{id, file, title, level, minutes}]}], decks: [{id, file, title, description}], placement: "placement.json"}`. File paths relative to `content/`.
- Produces in `js/content.js`: `loadIndex() -> Promise<Index>`, `loadModule(id) -> Promise<Module>` (looks up `file` in index, fetches `content/<file>`), `loadDeck(id) -> Promise<Deck>`, `loadPlacement() -> Promise<Placement>`, `loadAllModules() -> Promise<Module[]>` (for reference page). All use `fetch` relative to `document.baseURI`; cache in a `Map`. Reject with `Error('content-load-failed')` on non-OK response.
- Produces in `scripts/validate-content.mjs`: `validateModule(m) -> string[]` (list of error strings, empty if valid), `validateDeck(d) -> string[]`, `validatePlacement(p) -> string[]`, `validateIndex(i) -> string[]`; when run as a script it loads every file referenced by `content/index.json` and exits 1 printing errors. Rules = Global Constraints + spec §7 (required fields, `answer` index in `[0, options.length)`, unique ids across modules and across cards, `level ∈ {B1,B2,C1}`, every `file` exists, every module `track` equals its parent track id, `order` matches position).
- Deck card shape: `{id, front, back, example}`; `Deck = {id, title, description, cards: Card[]}`.
- Placement shape: `{questions: [{q, options: [4], answer, level, why}]}`, exactly 20 questions when complete (validator requires 20 unless `questions.length === 0`).

- [ ] **Step 1: Failing tests**: `validateModule` on a correct fixture → `[]`; with `answer: 4` → contains `/answer/`; with 3 options → error; with 5 quiz questions → error; `validateIndex` referencing a missing file → error; a test that runs the validator over the real `content/` tree and asserts zero errors.
- [ ] **Step 2: Run → FAIL** · **Step 3: Implement validator, `js/content.js`, sample content** · **Step 4: Run → PASS**
- [ ] **Step 5: Commit `feat: content loader and schema validator`**

### Task 7: Course content

**Files:**
- Create: `content/tracks/calls/01..06-*.json`, `content/tracks/emails/01..06-*.json`, `content/tracks/presentations/01..06-*.json`, `content/decks/{phrases-calls,phrases-emails,phrases-presentations,false-friends,connectors,verbs-at-work}.json`, `content/placement.json`
- Modify: `content/index.json`

**Interfaces:**
- Consumes: schema from Task 6; the validator must pass (`npm test`).
- Module plan (title · level · grammar focus):
  - calls: 01 Opening a call & agenda · B1 · present simple vs continuous for status; 02 Explaining an incident · B1 · past simple vs present perfect; 03 Asking for clarification & interrupting politely · B2 · indirect questions, softeners; 04 Negotiating dates and scope · B2 · first/second conditional, modal verbs for commitment (will/would/could/might); 05 Handling fast questions & buying time · B2 · fillers, echo questions, "let me…" structures; 06 Closing, actions and follow-up · C1 · future forms (going to / will / present continuous), reported speech for minutes.
  - emails: 01 Subject lines and openings · B1 · register, fixed openers; 02 Making a formal request · B1 · modals of politeness, "would appreciate"; 03 Following up and chasing · B2 · present perfect with "yet/still/already", passive for tact; 04 Communicating a delay or a problem · B2 · passive voice, hedging; 05 Escalating and pushing back politely · C1 · conditionals, "while/although", distancing; 06 Replying to complaints and closing · C1 · relative clauses, nominalisation.
  - presentations: 01 Opening and signposting · B1 · sequencers, "let's / I'd like to"; 02 Describing architecture and flows · B1 · present simple for processes, prepositions of movement (through/into/from/to); 03 Numbers and trends · B2 · comparatives, verbs of change (rise/fall/plateau), approximations; 04 Roadmap and timelines · B2 · future perfect/continuous ("by Q2 we will have…"); 05 Risks, trade-offs and recommendations · C1 · "should/ought to", concession, emphasis (what we need is…); 06 Handling Q&A · C1 · indirect questions, paraphrasing, cleft sentences.
- Content guardrails: no real names (people, counterparties, employer); `italianTrap` present in every grammar block; fluency `keyPhrases` 3-6 items that appear verbatim in `model`; `write` present only in emails and presentations (1-2 prompts).
- Decks: 40 cards each (`id` prefix = deck id).
- Placement: 20 questions, 7 B1 / 7 B2 / 6 C1, `level` on each.

- [ ] **Step 1: Write calls track (6 files) → run `node scripts/validate-content.mjs` → zero errors**
- [ ] **Step 2: Write emails track (6 files) → validate**
- [ ] **Step 3: Write presentations track (6 files) → validate**
- [ ] **Step 4: Write 6 decks + placement → validate; update `content/index.json`**
- [ ] **Step 5: `npm test` → PASS; commit `content: full course v1 (3 tracks, 6 decks, placement)`**

### Task 8: Views and exercises

**Files:**
- Create: `js/render/home.js`, `track.js`, `module.js`, `placement.js`, `decks.js`, `flashcards.js`, `reference.js`, `progress.js`, `notfound.js`, `js/render/exercises/quiz.js`, `gapfill.js`, `reorder.js`, `fluency.js`, `write.js`, `js/dom.js`
- Modify: `js/app.js`, `css/app.css`
- Test: `tests/dom.test.mjs`

**Interfaces:**
- `js/dom.js`: `h(tag, attrs?, ...children) -> HTMLElement` (attrs: `class`, `on*` handlers, others as attributes; children strings become text nodes); `escapeHTML(s)`. Testable with a minimal fake `document` only for `escapeHTML`; `h` verified in browser.
- Every view module exports `render(ctx) -> Promise<HTMLElement>|HTMLElement`, with `ctx = {params, store, content, navigate(hash)}`.
- Every exercise module exports `mount(container, items, {onResult(correct: boolean, total: number)})`; `fluency.mount` also receives `{speech, settings}` and calls `onResult(stars, 3)` per drill; `write.mount` calls `onResult(ratio >= 0.6 ? 1 : 0, 1)`.
- `module.js` renders sections in spec §5.2 order as an accordion-free single page with a sticky section nav; on completion writes `store.modules[id]` and sets `completedAt`, updates `streak` (today's date; `days` increments if `last` was yesterday, resets if older).
- `home.js`: placement call-to-action if `store.placement` null, else suggested level badge; 3 track cards with completed/total; today's due flashcards count across decks (uses `buildSession`).
- `placement.js`: 20 questions, result = level with the highest ratio of correct answers among `B1/B2/C1` scanning from C1 down with threshold ≥ 0.6, else B1; stores `{level, score, at}`.
- `flashcards.js`: session from `buildSession`; card flip; buttons "Sapevo" / "Non sapevo" → `review` → `store.srs[cardId]`; listen button; end screen with counts.
- `reference.js`: all `grammar` blocks grouped by track with links to their module.
- `progress.js`: per-track completion, placement, streak, SRS box distribution, export (download `english-at-work-progress.json`), import (file input), reset with `confirm()`.
- Error state: any `render` whose content load rejects returns `<div class="error">Non riesco a caricare i contenuti. <a href="#…">Riprova</a></div>`.

- [ ] **Step 1: Failing test for `escapeHTML('<a&b>')` → `'&lt;a&amp;b&gt;'`; run → FAIL; implement `js/dom.js`; PASS**
- [ ] **Step 2: Implement `app.js` routing table → view modules, `notfound.js`, `home.js`, `track.js`; serve with `npm run serve` and open `http://localhost:8080` → home lists 3 tracks**
- [ ] **Step 3: Implement `quiz.js`, `gapfill.js`, `reorder.js` (click-to-build word chips), `module.js` grammar + phrases (speak button) + these exercises; verify module `calls-01-opening` in browser**
- [ ] **Step 4: Implement `fluency.js` (timer ring, reveal model, speak, optional record with live transcript, key phrase chips found/missing, 1-3 stars) and `write.js` (textarea, model, checklist checkboxes, coverage ratio)**
- [ ] **Step 5: Implement `placement.js`, `decks.js`, `flashcards.js`, `reference.js`, `progress.js`**
- [ ] **Step 6: CSS polish: mobile 375px no horizontal scroll, dark mode, focus states, `prefers-reduced-motion`**
- [ ] **Step 7: `npm test` → PASS; commit `feat: views and exercises`**

### Task 9: Browser verification and publication

**Files:**
- Modify: `README.md` (add live URL)

- [ ] **Step 1: Serve locally; walk through: home → placement (complete, check level stored) → module calls-01 end-to-end (quiz, gaps, reorder, fluency with TTS; mic if available) → flashcards false-friends 5 cards → progress export file downloads → reload keeps progress. Check console: zero errors. Check 375px viewport and dark mode.**
- [ ] **Step 2: Fix anything found; `npm test` → PASS; commit**
- [ ] **Step 3: `gh repo create AntonioPiga/english-at-work --public --source . --remote origin --push --description "Corso di inglese per il lavoro: call, mail, presentazioni"`**
- [ ] **Step 4: Enable Pages: `gh api -X POST repos/AntonioPiga/english-at-work/pages -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/'`; wait for `https://antoniopiga.github.io/english-at-work/` to return 200; open it in the browser and repeat the smoke test on the published URL**
- [ ] **Step 5: Add the live URL to README; commit `docs: live url`; push**
