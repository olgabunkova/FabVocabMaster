# FabVocabMaster

FabVocabMaster is a browser-based Russian vocabulary trainer.
It loads topic files from `topics/*.txt`, creates a two-way flashcard deck (English -> Russian and Russian -> English), and runs a mixed quiz mode (multiple choice + open recall).

It also includes a lightweight recommendation flow:
if a learner clicks `I don't know`, that pair is moved to a review list and persisted to `topics/difficult_words_timestamp_YYYY-MM-DD.txt`.

## Runtime Modes

1. Local server mode (recommended)
- Start `local_server.py`.
- App runs at `http://localhost:8000/russian_app.html`.
- Recommender persistence API (`POST /api/difficult-words`) is available.

2. File mode (`file://`)
- If you open `russian_app.html` directly, the app shows server instructions.
- Topic fetch and persistence are limited by browser security restrictions.

## Quick Start

1. Generate topic index:
```bash
python3 generate_index.py
```

2. Run server:
```bash
python3 local_server.py
```

3. Open:
- `http://localhost:8000/russian_app.html`

Optional script:
- `./serve.sh` regenerates index, starts server, and opens the page.

## Topic File Format

Each line in a topic file is:
```text
english,russian,pronunciation
```

`pronunciation` is optional. Examples:
```text
cat,кот,kot
tea,чай
```

## App Flow (End-to-End)

1. Bootstrap
- `src/main.js` waits for DOM ready and calls `initApp()`.
- It also attempts to register `sw.js`.

2. Load topic manifest and files
- `src/services/topicLoader.js` fetches `./topics/index.json`.
- It fetches each listed topic file (`./topics/<name>.txt`).
- UI renders checkbox rows for topics.

3. Build session deck
- On `Start Practice`, selected topic text is parsed by `src/services/cardParser.js`.
- `parseTopicText()` converts each csv-like line into `{ eng, rus, pron }`.
- `buildBidirectionalDeck()` doubles entries into both directions.

4. Initialize quiz state
- `src/state/sessionState.js` holds runtime state.
- `resetSession()` shuffles queue, resets score, clears difficult tracking maps/sets.

5. Run question loop
- `src/controllers/quizEngine.js` returns quiz methods.
- `shouldUseMultipleChoice()` randomly chooses MC when enough cards exist.
- For open recall, answer is shown and user self-checks.
- For MC, wrong answer triggers modal with correction.

6. Answer handling and queue behavior
- Correct answer: card removed, score increments.
- Wrong answer (`No` or wrong MC): card goes back to queue.
- Skip (`I don't know`): counted per word pair.
- At 3 skips for same pair:
  - card is not re-queued,
  - word pair goes to difficult queue,
  - persistence is attempted.

7. Persist recommended difficult words
- `src/services/recommendationStore.js` posts to `/api/difficult-words`.
- `local_server.py` validates and appends to `topics/difficult_words_timestamp_YYYY-MM-DD.txt` with dedupe.
- If API is unavailable, fallback stores items in `localStorage` key `fvm_difficult_words_topic`.

## Module Reference

### UI Layer

- `src/ui/app.js`
  - Main orchestration module.
  - Wires DOM events, screens, rendering, score updates, and modal interactions.
  - Bridges UI actions to quiz engine and persistence services.

- `src/ui/dom.js`
  - Small DOM helpers: element lookup, show/hide, clear children.

- `src/ui/modal.js`
  - Modal open/close abstraction with optional callback on confirm.

- `src/styles.css`
  - App styles, responsive layout, quiz card UI, buttons, modal styles.

### Controller Layer

- `src/controllers/quizEngine.js`
  - Pure quiz logic over mutable session state.
  - Encapsulates current card, stats, progress, mode choice, and answer handling.
  - Implements difficult-word threshold logic (`I don't know` x3).

### State Layer

- `src/state/sessionState.js`
  - Session state factory and mutators.
  - Stores loaded topics, current queue, score, and difficult-word tracking structures.

### Services Layer

- `src/services/topicLoader.js`
  - Fetches topic index and topic file text.

- `src/services/cardParser.js`
  - Parses topic text lines and constructs bidirectional deck entries.

- `src/services/recommendationStore.js`
  - Persists difficult words via HTTP API.
  - Uses browser fallback storage when API is not reachable.

### Utils

- `src/utils/format.js`
  - Topic label formatting and pronunciation formatting helpers.

### Entry + Static Shell

- `russian_app.html`
  - Single page shell containing setup view, quiz view, and modal root.

- `src/main.js`
  - App bootstrap and service worker registration.

### Python Support Scripts

- `local_server.py`
  - Static file server for local app hosting.
  - Adds `POST /api/difficult-words` endpoint.
  - Appends deduped entries to `topics/difficult_words_timestamp_YYYY-MM-DD.txt`.

- `generate_index.py`
  - Scans `topics/` and writes `topics/index.json` atomically.
  - Optional watch mode for polling-based updates.

- `serve.sh`
  - Convenience script to regenerate index, restart server on port 8000, and open browser.

### PWA + Build Tooling

- `sw.js`
  - Cache-first service worker.
  - Precaches shell plus topic files listed in `topics/index.json`.

- `manifest.json`
  - Web app manifest for installable/mobile-friendly behavior.

- `vite.config.js`
  - Build input configuration (`russian_app.html`).

- `package.json`
  - Scripts:
    - `npm run dev`
    - `npm run build`
    - `npm run preview`
    - `npm run lint`
    - `npm run test`

## Data and Persistence

- `topics/*.txt`
  - Source vocabulary files.

- `topics/index.json`
  - Generated manifest of topic files.

- `topics/difficult_words_timestamp_YYYY-MM-DD.txt`
  - Persistent difficult-word output file (per day).
  - Written through server endpoint with dedupe by `eng,rus` pair.

## Architecture Notes

1. UI and business logic are separated.
- UI in `src/ui/*`.
- Quiz behavior in `src/controllers/quizEngine.js`.

2. Topic I/O and parsing are isolated.
- Loading in `topicLoader`.
- Parsing/deck generation in `cardParser`.

3. Recommendation persistence is pluggable.
- API-first with local fallback keeps app usable when endpoint is unavailable.

4. Current storage is intentionally text-based.
- Fits current simplicity goal.
- Can later be swapped for structured storage without rewriting UI/controller contracts.
