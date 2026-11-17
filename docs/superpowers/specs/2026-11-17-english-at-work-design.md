# English at Work — Design

Data: 2026-11-17
Stato: approvato dall'utente (brainstorming del 16-17/11/2026)

## 1. Intento e perché

Antonio è un architetto software in una società di consulenza finanziaria
(gruppo bancario/assicurativo, stack Azure + Java + React). L'inglese gli
serve in tre momenti precisi della settimana:

1. **Call tecniche con una controparte** (una banca partner, un fornitore,
   un team esterno): spiegare un incident, negoziare una data, rispondere
   a domande a raffica.
2. **Mail formali** verso banche, fornitori e management.
3. **Presentazioni** al management o al cliente: roadmap, stato
   avanzamento, architettura.

Inciampa in tutte e tre, ma il problema principale è la **fluidità**: al
momento di parlare le parole non arrivano in tempo. La grammatica va
quindi insegnata al servizio della produzione orale e scritta in quei
contesti, non come programma di un libro di testo.

Il risultato è un **corso autogestito**, servito da un piccolo frontend
statico (HTML/CSS/JS) pubblicato su GitHub Pages, con esercizi,
quiz a crocette, pillole di grammatica, esercizi di fluidità a tempo e
flashcard a ripetizione spaziata.

## 2. Obiettivi, non-obiettivi, anti-obiettivi

**Obiettivi**
- Allenamento quotidiano da 10-15 minuti per modulo, fruibile da
  desktop e da telefono.
- Contenuti tagliati sul lavoro reale: microservizi, deploy, incident,
  riconciliazioni, onboarding clienti, firme digitali, KPI, roadmap,
  negoziazione con fornitori e banche.
- Fluidità al centro: esercizi a tempo con risposta modello, lettura
  vocale delle frasi modello, microfono opzionale per confrontare quello
  che si dice con il modello.
- Progressi salvati nel browser, con esportazione/importazione per non
  perderli.
- Aggiungere un modulo deve costare solo un nuovo file JSON.

**Non-obiettivi**
- Nessun backend, login, database o servizio a pagamento.
- Nessuna correzione "intelligente" via AI in v1: il confronto è con
  risposte modello e parole chiave.
- Nessuna certificazione o preparazione a esami (IELTS, Cambridge).

**Anti-obiettivi (sarebbe un fallimento anche se funziona)**
- Un corso generico "English B2" che non parla il linguaggio del suo
  lavoro.
- Lezioni lunghe da leggere: deve prevalere il fare (rispondere,
  scrivere, parlare).
- Dati riservati o nomi reali nel repo pubblico: persone, clienti,
  credenziali, nomi di controparti reali. Le controparti sono generiche
  ("the partner bank", "the fund platform", "the vendor").

## 3. Vincoli

- Repo pubblico GitHub `AntonioPiga/english-at-work`, cartella locale
  `~/Documents/GitHub/english-at-work`.
- Sito statico servito da GitHub Pages dalla root del branch `main`,
  nessun build step.
- Browser target: Chrome/Edge (microfono e sintesi vocale completi),
  Safari (sintesi vocale sì, riconoscimento vocale parziale), mobile.
  Il microfono è sempre opzionale: senza, l'esercizio di fluidità resta
  utilizzabile (timer + risposta modello + autovalutazione).
- Nessuna dipendenza npm a runtime. Per i test di contenuto e logica si
  usa solo Node (`node --test`), già presente sulla macchina.

## 4. Approcci considerati

| # | Approccio | Pro | Contro |
|---|---|---|---|
| 1 | **Sito statico puro**: HTML + CSS + JS (ES modules), contenuti in JSON, GitHub Pages | Zero dipendenze e pipeline; aggiungere un modulo = un JSON; API vocali del browser funzionano uguale | Il JS va tenuto ordinato a mano con la crescita dei contenuti |
| 2 | Vite + React + TypeScript + GitHub Actions | Tipi sui contenuti, componenti, stack che l'utente usa al lavoro | Build step, `node_modules`, pipeline: sproporzionato per un "progettino HTML/CSS" |
| 3 | Generatore statico (Astro/Eleventy) con Markdown | Comodo per lezioni lunghe | Quiz, timer e flashcard finirebbero comunque in JS a mano; un altro tool da imparare |

**Scelto: 1**, su proposta dell'assistente e conferma dell'utente. È ciò
che l'utente ha chiesto, è il più leggero da mantenere e pubblicare.

## 5. Struttura del corso (il "cosa")

### 5.1 Percorsi (tracks)

Tre percorsi, uno per contesto, più un test iniziale e le flashcard:

| Track | Id | Cosa allena |
|---|---|---|
| Tech calls | `calls` | Aprire/chiudere una call, spiegare un incident, chiedere chiarimenti, interrompere con cortesia, negoziare date, gestire domande veloci |
| Formal emails | `emails` | Oggetto e apertura, richiesta formale, follow-up, escalation cortese, comunicare un ritardo, rispondere a una lamentela, chiusure |
| Presentations | `presentations` | Aprire, segnaletica del discorso, descrivere architettura e flussi, numeri e trend, roadmap e rischi, gestire Q&A |

Ogni track ha **6 moduli** in v1, con difficoltà crescente, taggati
`B1`, `B2`, `C1`. Il test iniziale (20 domande) suggerisce da quale
livello partire; l'utente può ignorare il suggerimento.

### 5.2 Anatomia di un modulo

Ogni modulo segue sempre la stessa sequenza, 10-15 minuti totali:

1. **Grammar / Language focus**: una pillola (max 200 parole) con la
   regola o la struttura, 4-6 esempi presi dal contesto di lavoro, e il
   confronto con l'errore tipico di un italofono quando serve.
2. **Phrase bank**: 8-12 frasi pronte per la situazione, ascoltabili
   (sintesi vocale).
3. **Quiz a crocette**: 6-8 domande, 4 opzioni, spiegazione della
   risposta.
4. **Gap fill / Reorder**: 4-6 frasi da completare o riordinare.
5. **Fluency drill**: 3-4 situazioni. Si legge il prompt, parte un timer
   (30-60 s), si risponde a voce; allo scadere compare la risposta
   modello con le parole chiave evidenziate, il bottone "ascolta" e, se
   il microfono è disponibile, la trascrizione di quanto detto con le
   parole chiave trovate/mancanti. L'utente si autovaluta (1-3 stelle).
6. **Write it** (solo track `emails` e `presentations`): un prompt di
   scrittura breve; alla consegna si confronta con il modello e con una
   checklist (registro, apertura, richiesta chiara, chiusura).

### 5.3 Flashcard

Mazzi (`decks`) di 30-50 carte ciascuno:
- `phrases-calls`, `phrases-emails`, `phrases-presentations`: frase
  italiana o situazione sul fronte, frase inglese naturale sul retro.
- `false-friends`: falsi amici e calchi dall'italiano
  ("actually", "eventually", "control", "sensible"…).
- `connectors`: connettori e segnaletica del discorso.
- `verbs-at-work`: verbi e collocazioni ("roll out", "escalate",
  "sign off", "push back"…).

Ripetizione spaziata con **scatole di Leitner** (5 scatole, intervalli
0 / 1 / 3 / 7 / 14 giorni). Risposta giusta: la carta sale di una
scatola; sbagliata: torna alla scatola 1. La sessione giornaliera
propone le carte scadute, poi le nuove (max 20 nuove al giorno).
Ogni carta ha il bottone "ascolta".

### 5.4 Test iniziale (placement)

20 domande a crocette miste (grammatica, registro, vocabolario di
lavoro), ciascuna taggata con un livello. Il punteggio per livello
produce un suggerimento ("Parti dai moduli B2") salvato nei progressi.

### 5.5 Grammar reference

Una pagina indice che raccoglie tutte le pillole di grammatica dei
moduli, consultabile fuori sequenza.

## 6. Architettura (il "come")

```
english-at-work/
├── index.html              # unica pagina, shell dell'app
├── css/
│   └── app.css             # token di design, layout, componenti
├── js/
│   ├── app.js              # bootstrap, router hash (#/track/calls/module/01)
│   ├── router.js
│   ├── store.js            # localStorage, export/import, schema versionato
│   ├── speech.js           # TTS + STT con fallback
│   ├── srs.js              # scheduler Leitner (puro, testabile)
│   ├── grading.js          # confronto parole chiave, normalizzazione testo
│   ├── render/             # una funzione di render per tipo di esercizio
│   │   ├── home.js, track.js, module.js, placement.js, flashcards.js, reference.js
│   │   └── exercises/ (quiz.js, gapfill.js, reorder.js, fluency.js, write.js)
│   └── content.js          # carica l'indice e i JSON dei moduli
├── content/
│   ├── index.json          # lista track, moduli, mazzi, placement
│   ├── placement.json
│   ├── tracks/calls/01-opening-a-call.json … 06-*.json
│   ├── tracks/emails/…
│   ├── tracks/presentations/…
│   └── decks/false-friends.json, connectors.json, …
├── tests/                  # node --test: schema contenuti, srs, grading
├── scripts/validate-content.mjs
├── docs/superpowers/specs/…
├── README.md
└── LICENSE (MIT)
```

- **Routing**: hash router (`#/`, `#/placement`, `#/track/:id`,
  `#/module/:id`, `#/flashcards/:deck`, `#/reference`, `#/progress`),
  così funziona su GitHub Pages senza riscritture.
- **Stato**: `localStorage["eaw:v1"]` = `{ placement, modules: {id:
  {score, completedAt, fluencyStars}}, srs: {cardId: {box, due}},
  streak, settings: {voice, rate, micEnabled} }`. Export/import JSON
  dalla pagina Progress.
- **Voce**: `speechSynthesis` con voce `en-GB` se disponibile, altrimenti
  `en-US`; velocità regolabile. `SpeechRecognition ||
  webkitSpeechRecognition` con `lang=en-GB`, `interimResults=true`;
  se assente, il bottone "registra" non compare e resta
  l'autovalutazione.
- **Grading fluency/write**: normalizzazione (lowercase, punteggiatura,
  contrazioni), confronto con `keyPhrases` del modello, percentuale di
  copertura. Nessun giudizio "giusto/sbagliato" assoluto: è un aiuto
  all'autovalutazione.
- **Stile**: CSS custom properties, tema chiaro/scuro da
  `prefers-color-scheme`, font di sistema, layout mobile-first a una
  colonna, max-width 720px su desktop. Nessuna libreria CSS.
- **Qualità**: `node --test tests/` valida ogni JSON contro lo schema
  (campi obbligatori, indice risposta valido, almeno 4 opzioni, id
  unici), testa `srs.js` e `grading.js`. Il validatore gira anche come
  pre-commit manuale (`npm test` con solo `node --test`, nessuna
  dipendenza).

## 7. Formato dei contenuti (schema JSON di un modulo)

```json
{
  "id": "calls-01-opening",
  "track": "calls",
  "order": 1,
  "title": "Opening a call and setting the agenda",
  "level": "B1",
  "minutes": 12,
  "grammar": {
    "title": "Present simple vs present continuous for status updates",
    "explanation": "…max 200 parole…",
    "examples": [{"en": "We're currently migrating the batch to the new cluster.", "note": "azione in corso"}],
    "italianTrap": "Italiani dicono spesso 'I work on it now' → 'I'm working on it now'."
  },
  "phrases": [{"en": "Thanks everyone for joining.", "it": "Grazie a tutti per esserci", "when": "apertura"}],
  "quiz": [{"q": "…", "options": ["…","…","…","…"], "answer": 1, "why": "…"}],
  "gapfill": [{"text": "Could you ___ me through the error?", "answers": ["walk"], "hint": "guidare passo passo"}],
  "reorder": [{"words": ["Let's","start","with","the","incident"], "answer": "Let's start with the incident"}],
  "fluency": [{"prompt": "The partner bank asks why yesterday's batch failed. Explain in 45 seconds.", "seconds": 45, "model": "…", "keyPhrases": ["root cause","we've identified","rolled back","by end of day"]}],
  "write": [{"prompt": "…", "model": "…", "checklist": ["Oggetto chiaro","Registro formale","Richiesta esplicita","Chiusura"]}]
}
```

Le flashcard: `{"id": "ff-actually", "front": "attualmente", "back": "currently (NOT 'actually' = in realtà)", "example": "We're currently testing it."}`.

## 8. Decisioni già prese

- Nome repo e cartella: `english-at-work`.
- Lingua dell'interfaccia: italiano per istruzioni e spiegazioni
  grammaticali, inglese per tutto il materiale da produrre e ascoltare.
- Voce di default: inglese britannico (la controparte tipica è europea).
- Microfono opzionale, mai bloccante.
- Flashcard con Leitner a 5 scatole (semplice, spiegabile, testabile).
- Licenza MIT, contenuti originali scritti per questo progetto.
- Pubblicazione: GitHub Pages dalla root di `main`, abilitata via `gh api`.

## 9. Lasciato al costruttore

- Palette colori, iconografia, micro-animazioni.
- Testo esatto di ogni esercizio, purché rispetti §5 e l'anonimizzazione.
- Ordine interno dei 6 moduli per track, purché la difficoltà cresca.
- Dettagli del router e della gestione errori di caricamento JSON.

## 10. Decisioni prese dopo la revisione del costruttore (scelte dell'assistente)

- **Volume v1**: tutti i 18 moduli, 6 mazzi da 40 carte, placement da 20 domande. La qualità dell'inglese viene controllata da una revisione indipendente dei JSON prima della pubblicazione.
- **Progressione**: nessun modulo è bloccato; il livello suggerito dal placement è solo un badge "consigliato". Un modulo è completato quando si raggiunge la fine della pagina; per modulo si salvano quiz (giuste/totali), esercizi (giuste/totali), stelle fluency dell'ultimo tentativo, data di completamento. Streak = giorni consecutivi con almeno un'attività.
- **Quiz**: feedback immediato, nessun retry sulla stessa domanda. Gap-fill e reorder usano la normalizzazione di `grading.js` (case, spazi, contrazioni).
- **Placement**: livello suggerito = il più alto tra C1, B2, B1 con almeno il 60% di risposte giuste nelle domande di quel livello; altrimenti B1.
- **SRS**: intervallo 0 della scatola 1 significa "di nuovo in questa sessione": le carte sbagliate si riaccodano in fondo. Due sole risposte: "Sapevo" / "Non sapevo". Il limite di 20 nuove carte al giorno è per mazzo. Il giorno è quello del calendario locale.
- **Fluency**: le parole chiave si confrontano sul testo normalizzato, corrispondenza esatta della frase; la trascrizione non viene salvata. Il microfono compare ovunque l'API esista (anche iOS), con una riga di spiegazione al primo uso. Il timer scade e rivela il modello, ma si può fermare prima ("Ho finito") o saltare ("Senza timer").
- **Persistenza**: gli id di moduli e carte sono stabili e non vanno rinominati; l'import sostituisce lo stato dopo `confirm()` e viene validato (`version === 1`).
- **Indice contenuti**: `content/index.json` è mantenuto a mano; il validatore verifica che ogni file in `content/tracks/**` e `content/decks/*` sia referenziato e coerente (id, track, order, level, title).
- **Lingua UI**: italiano hard-coded, nessun layer i18n. `grammar.explanation` in italiano, max 200 parole imposte dal validatore.
- **Fuori scopo v1**: PWA/offline, telemetria. Accessibilità di base: navigazione da tastiera, focus visibile, `prefers-reduced-motion`. La pagina Reference include sia le pillole di grammatica sia i phrase bank. "Write it" = checklist auto-valutata + copertura parole chiave.
