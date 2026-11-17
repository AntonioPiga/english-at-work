# English at Work

Corso di inglese autogestito per chi lavora nel software in ambito finanziario:
**call tecniche**, **mail formali** e **presentazioni**. Grammatica al servizio
della fluidità, quiz a crocette, esercizi di completamento, drill di fluidità a
tempo con sintesi vocale e microfono, flashcard a ripetizione spaziata.

Sito statico, zero dipendenze: HTML + CSS + JavaScript, contenuti in JSON.

## Usarlo

In locale:

```bash
npm run serve
```

poi apri <http://localhost:8080>. I progressi restano nel browser
(`localStorage`); dalla pagina **Progressi** puoi esportarli e reimportarli.

Il microfono (riconoscimento vocale) funziona su Chrome ed Edge; la sintesi
vocale funziona in tutti i browser moderni. Senza microfono gli esercizi di
fluidità restano utilizzabili con timer, risposta modello e autovalutazione.

## Struttura del corso

| Percorso | Moduli | Cosa allena |
|---|---|---|
| Tech calls | 6 | aprire una call, spiegare un incident, chiedere chiarimenti, negoziare date, gestire domande veloci, chiudere con le azioni |
| Formal emails | 6 | oggetto e aperture, richieste formali, follow-up, comunicare ritardi, escalation cortese, rispondere a lamentele |
| Presentations | 6 | aprire e segnalare, descrivere architetture, numeri e trend, roadmap, rischi e raccomandazioni, Q&A |

Più un **test iniziale** da 20 domande e sei mazzi di **flashcard**
(frasi per contesto, falsi amici, connettori, verbi del lavoro).

## Aggiungere un modulo

1. Copia un file in `content/tracks/<track>/` e modificalo seguendo lo schema
   descritto in `docs/superpowers/specs/2026-11-17-english-at-work-design.md` (§7).
2. Aggiungilo a `content/index.json` nel track giusto.
3. Lancia `npm test`: il validatore controlla schema, indici delle risposte,
   id unici e coerenza con l'indice.

## Sviluppo

```bash
npm test        # test unitari + validazione contenuti
npm run validate
```

Licenza MIT. Tutti i contenuti sono originali; nessun nome reale di persone o
controparti.
