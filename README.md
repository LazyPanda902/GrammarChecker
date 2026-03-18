# GrammarChecker

A desktop grammar and rewriting app built with Electron, React, and the Google Gemini API.

GrammarChecker helps users improve writing in a clean desktop workspace with support for grammar correction, rewrites, tone changes, saved local API key flow, and persistent history across launches.

## Screenshots

### Editor
<img src="screenshots/editor.png" alt="GrammarChecker Editor" width="900" />

### History
<img src="screenshots/history.png" alt="GrammarChecker History" width="900" />

### Settings
<img src="screenshots/settings.png" alt="GrammarChecker Settings" width="900" />

## Features

- Fix grammar, spelling, punctuation, and sentence structure
- Rewrite text more clearly while keeping the meaning
- Convert writing to a formal tone
- Convert writing to a casual tone
- Stream output gradually for a smoother writing experience
- Save the user's API key locally on their own machine
- Persist history across app launches
- Reopen, reuse, and delete past history items
- Keep user secrets out of the public repo

## Current App Flow

1. User opens the desktop app
2. User adds their own Gemini API key in Settings
3. The app stores the key locally on that machine
4. User submits text in one of the writing modes
5. The result streams into the interface with a paced reveal
6. Completed results are saved to local history
7. History remains available after closing and reopening the app

## Modes

- Grammar
- Rewrite
- Formal
- Casual

## Tech Stack

- Electron
- React
- Vite
- JavaScript
- Google Gemini API

## Project Structure

```text
GrammarChecker/
├── backend/
├── frontend/
├── screenshots/
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── SECURITY.md
├── electron-store.js
├── main.js
└── preload.js