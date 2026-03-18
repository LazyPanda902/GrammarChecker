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


GrammarChecker/
├── backend/
├── build/
├── frontend/
├── screenshots/
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── SECURITY.md
├── electron-store.js
├── main.js
├── package.json
└── preload.js

## Local API Key Behavior

This project is designed so each user provides their own Gemini API key.

The key is stored locally on the user's machine through the desktop app and is not meant to be committed to the repository. This keeps the public project safe while still allowing other people to run the app with their own credentials.

## Getting Started

### 1. Clone the repository

    git clone https://github.com/LazyPanda902/GrammarChecker.git
    cd GrammarChecker

### 2. Install dependencies

    npm install
    cd frontend
    npm install
    cd ..

### 3. Run the desktop app

    npm run desktop

### 4. Build the app

    npm run pack

Or create a distributable build with:

    npm run dist

## Security

- Do not hardcode real API keys into source files
- Do not commit a real `.env` file
- Do not commit any local settings or user data files
- Each user should enter their own API key in the app

If you discover a security issue, report it responsibly through the repository owner.

## Credits

This project used [Design Prompts](https://www.designprompts.dev/) as inspiration for design prompting and interface direction.

## License

This project is licensed under the MIT License.
