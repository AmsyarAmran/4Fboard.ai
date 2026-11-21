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

## Important: AI connection
This preview does not call a live AI model. Lesson outlines and follow-up responses are local demo content. To enable genuine AI explanations, add a secure backend endpoint and store provider API keys on the server — never in browser JavaScript.

## Files
- `index.html` — page structure
- `style.css` — visual design and responsive layout
- `script.js` — interactions and demo behaviour
