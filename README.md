## Aurora Assistant (Work in Progress)

Voice-first desktop calendar assistant powered by an Electron background process, a React popup UI, and a Cloudflare Worker backend.

### Prerequisites

- Node.js 20+
- npm 10+
- (Windows) Microphone drivers + SoX/Windows audio support for the `mic` package
- Picovoice Porcupine keyword/model files (`.ppn` / `.pv`)

### Install Dependencies

```bash
# From repo root
cd electron && npm install
cd ../ui && npm install
cd ../worker && npm install
```

### Environment Variables

Copy `.env.example` (if present) to `.env` in the repo root, or create one with:

```
AURORA_WORKER_URL=https://your-worker.workers.dev
PORCUPINE_ACCESS_KEY=...
PORCUPINE_KEYWORD_PATH=artifacts/hey_aurora.ppn
PORCUPINE_MODEL_PATH=artifacts/porcupine_params.pv
PORCUPINE_SENSITIVITY=0.6
AUDIO_INPUT_DEVICE=default
RECORDER_SILENCE_MS=1200
RECORDER_MAX_MS=10000
RECORDER_THRESHOLD=1300
AURORA_UI_URL=http://localhost:5173
```

`AURORA_WORKER_TOKEN` is **optional**. Include it only if your Worker expects a bearer token; leave it unset for open/local testing. When deploying, run `npx wrangler secret put AURORA_WORKER_TOKEN` so Cloudflare stores the same value securely.

### Running Locally

1. **Start the React popup UI**
   ```bash
   cd ui
   npm run dev
   ```
2. **Run the Worker locally (optional while stubbing API)**
   ```bash
   cd worker
   npm run dev   # or `npx wrangler dev`
   ```
3. **Launch the Electron background app**
   ```bash
   cd electron
   npm start
   ```

Electron compiles the TypeScript sources (`npm run build`) and starts the wake-word listener. Speak the “Hey Aurora” wake word to open the popup, record a command, and forward audio to the Worker.

### Notes

- Keep `.env` and Picovoice asset paths outside version control.
- If Porcupine can’t find your mic, set `AUDIO_INPUT_DEVICE` to the exact device name reported by your OS.
- On Windows, allow microphone access for both “Console Window Host” and “Electron” processes.
