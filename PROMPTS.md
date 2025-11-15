# Prompts

## System Architecture (ChatGPT)

```
Build a full architecture diagram for the following project. An AI assistant that is persistent on a users desktop (windows) for a the wake-word "Hey Aurora". The application will then capture a short voice command, and uses a Cloudflare Worker with Llama 3.3 and Durable Objects to interpret natural-language requests, modify a persistent personal calendar, and return human-readable responses. The tech stack used should include a background Electron listener, a React-based animated popup UI, a wake-word detection engine, an audio recording pipeline, and a Cloudflare AI backend that performs STT, LLM reasoning, intent parsing, and calendar state management.
```

## Initial Implementation for electon/ (Cursor Agent)

```
You are working inside the “electron/” directory of the Aurora Assistant project.
Generate a complete TypeScript-based Electron implementation that handles:

1. Persistent background execution
2. Wake-word detection using Picovoice Porcupine
3. Microphone audio recording until user stops talking
4. POSTing recorded audio to the Cloudflare Worker endpoint:
   POST https://<my-worker>.workers.dev/api/voice
5. Receiving the AI response from the Worker and sending it to the renderer via IPC
6. Secure IPC bridge (preload.ts) exposing:
   - onWakeWord(callback)
   - onAIResponse(callback)
7. Launching and managing a transparent, frameless popup window (renderer = vite React UI) found in "ui/"
8. IPC to show/hide the popup window when wake-word is detected
9. Graceful error handling for microphone access, wake-word engine failure, and network errors
10. Clean modular structure with separate files:

Implementation requirements:
• Use ES modules or CommonJS consistently.
• Use TypeScript in all files.
• Add comments that explain WHY, not what.
• Do not expose Node APIs directly to the renderer.
• The popup window should load http://localhost:5173 in dev mode.
• The popup should fade in and out via IPC events, handled on the React side.
• Should use enviroment variables found in the root directoy of the project in .env

Create the full implementation with all files and cross-file imports.
Make the code immediately runnable.

```

## Initial Implementation for ui/ (Cursor Agent)

```
You are working inside the “ui/” folder of the Aurora Assistant project.
Implement a full TypeScript + React + Vite UI that is designed specifically
to run as the renderer for the Electron popup window defined in electron/.

The UI will NOT run standalone — it must be built entirely in the context of:

1. electron/
   - electron/main.ts creates a transparent, frameless popup BrowserWindow
   - preload.ts exposes secure IPC functions:
       window.electronAPI.onWakeWord(callback)
       window.electronAPI.onAIResponse(callback)
   - wake-word detection happens in electron/, and the UI only responds to IPC

2. worker/
   - The Worker receives recorded audio and returns a JSON response:
       { response: string }
   - The UI simply displays the text returned by Electron via IPC

Your task: build a complete popup UI that displays:
- A circular glowing “AI orb” that pulses when listening
- A clean, modern text area that displays assistant responses
- Smooth fade-in and fade-out animations triggered via IPC
- Optional state transitions:
    • “Listening…”
    • “Processing…”
    • Showing the LLM reply

UI Requirements:

1. Technology:
   • TypeScript
   • React (functional components + hooks)
   • Vite dev server
   • CSS modules or a single popup.css file for animations
   • No external CSS frameworks unless absolutely necessary

2. IPC Integration:
   Implement listeners:


Do NOT call Node APIs directly — only through the preload bridge.

3. Popup Behavior:
- Default hidden
- When onWakeWord triggers:
     • popup fades in
     • AI orb pulses
     • text says: "Listening…"
- When onAIResponse triggers:
     • text changes to the assistant response
     • orb slows pulse or glows softly
- After a short delay (e.g., 3 seconds), fade out and hide.

4. Visual Design (important):
• Semi-transparent glassmorphic style popup
• The popup should float near bottom-right of the Electron window.
• The AI orb should be:
• Text should be clean, large, easy to read.
• Fade and scale transitions must be smooth (CSS transitions).

5. Export:
Implement everything required for Electron to load the UI.

Deliverables:
- Full React component code
- CSS animations and layout
- IPC event handlers
- Types for UI state
- Clean, production-ready structure
- Make sure UI runs as soon as Vite is started and Electron opens the window

Generate all necessary code files and ensure imports are valid.
```
