# Cuff

A private, encrypted blood pressure tracking app that runs entirely in your browser. No accounts, no cloud sync, no data sharing — your health data stays on your device.

## Features

- **Password-encrypted storage** — AES-256-GCM encryption with PBKDF2 key derivation
- **Track readings** — Log systolic, diastolic, and pulse with date/time
- **Outlier validation** — Prompts for confirmation on unusual values
- **Statistics dashboard** — View averages for 7-day, 30-day, and all-time periods
- **Trend chart** — Visualize BP trends over time with Chart.js
- **BP categories** — Automatic classification (Normal, Elevated, High Stage 1/2, Crisis)
- **Export options** — CSV export for spreadsheets
- **Backup & restore** — Encrypted or plain JSON backups
- **Dark mode** — Easy on the eyes

## Usage

Just open `index.html` in your browser — no server required.

```bash
open index.html
```

On first launch, you'll create a password to encrypt your data. This password is required each time you open the app.

## Privacy

- All data is stored in your browser's `localStorage`
- Encryption happens client-side using the Web Crypto API
- Nothing is ever sent to a server
- No tracking, no analytics, no cookies

## Tech Stack

- Vanilla HTML, CSS, JavaScript (no framework, no build step)
- [Chart.js](https://www.chartjs.org/) for trend visualization
- Web Crypto API for encryption

## Screenshots

*Dark mode interface with BP categories and trend chart*

## License

MIT
