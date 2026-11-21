# 4Fboard.ai — Preview 0.1

A responsive visual-learning website starter built with vanilla HTML, CSS and JavaScript.

## Run locally
1. Extract the ZIP.
2. Open the folder in Termux.
3. Run:
   ```bash
   pkg install python -y
   python -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser.

## Included in this preview
- Responsive learning dashboard
- Topic, Exam Prep and Homework modes
- English / Bahasa Melayu interface toggle (starter translation)
- Prompt input and file selection
- Interactive drawing board (pen, eraser, colour, size, undo, clear, export PNG)
- Session-based recent and saved lessons
- Library file list and drag/drop
- Help dialog and mobile navigation

## AI status
The frontend is connected to the deployed Cloudflare Worker API. AI responses will become active after the `OPENAI_API_KEY` secret is added to that Worker in Cloudflare. Never put the key in `script.js` or commit it to GitHub.

## Files
- `index.html` — page structure
- `style.css` — visual design and responsive layout
- `script.js` — interactions and AI Tutor API calls


## AI Tutor backend (Cloudflare Workers + OpenAI)

The secure API lives in `worker/index.js`. The browser calls the Worker; the OpenAI key stays in a Cloudflare secret and is never placed in frontend JavaScript.

### Configure and deploy
1. Install Wrangler: `npm install -g wrangler`
2. Sign in: `wrangler login`
3. From the repository root, set the OpenAI key as a secret (never commit it):
   `wrangler secret put OPENAI_API_KEY`
4. Deploy:
   `wrangler deploy`
5. Add the Worker URL to the frontend setting `AI_API_URL` in `script.js` if it differs from the configured URL.
6. Configure `ALLOWED_ORIGINS` in Cloudflare with the exact origin(s) of the published website. Localhost is allowed for local testing.

### API
- `GET /health` — service status (does not reveal secrets).
- `POST /api/chat` — JSON body: `{ "prompt": "...", "mode": "topic|exam|homework|followup", "language": "en|ms" }`.

The first release generates text lessons and follow-up answers. Uploaded PDF/image parsing and persistent chat history are not included yet.
