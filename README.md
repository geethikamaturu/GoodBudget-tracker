# GoodBudget-tracker

A vanilla HTML/CSS/JavaScript expense tracker. No build tools, no installs — just open it in a browser.

## Features
- Add, edit, delete expenses (CRUD)
- Search by title/description
- Filter by category and date range
- Total expense and category-wise totals (calculations)
- Data is saved in your browser via `localStorage`, so it survives a refresh

## Files
```
expense-tracker/
├── index.html   → page structure
├── style.css    → styling
├── script.js    → all logic (CRUD, filters, calculations)
└── README.md    → this file
```

## How to run it

**Easiest way:**
1. Unzip the folder.
2. Double-click `index.html`. It opens directly in your default browser — done.

**If double-clicking doesn't work well for you** (some browsers restrict certain features when opened directly as a `file://` path), run a tiny local server instead:

- **Using VS Code:** Install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server."
- **Using Python** (most computers already have it):
  ```bash
  cd expense-tracker
  python3 -m http.server 8000
  ```
  Then open `http://localhost:8000` in your browser.
- **Using Node.js:**
  ```bash
  cd expense-tracker
  npx serve .
  ```
  Then open the URL it prints (usually `http://localhost:3000`).

## Notes
- The app comes pre-loaded with a few sample entries the first time you open it, so the ledger isn't empty. Delete them whenever you like — your own entries are saved automatically after that.
- All data lives only in your browser's local storage on your machine; nothing is sent anywhere.
- To reset everything, open your browser's dev tools → Application/Storage tab → clear local storage for this page (or just delete entries one by one from the UI).
