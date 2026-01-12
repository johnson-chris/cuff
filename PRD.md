# Cuff - Product Requirements Document

## Overview

**Product Name:** Cuff
**Version:** 1.0
**Last Updated:** January 2026

Cuff is a privacy-focused blood pressure tracking application that runs entirely in the browser. All data is encrypted and stored locally—nothing is ever sent to a server.

---

## Problem Statement

Existing blood pressure tracking apps require:
- Account creation and cloud sync
- Dependency on Apple Health, Google Fit, or proprietary platforms
- Trust that the provider will protect sensitive health data

Users who want to track their blood pressure privately have limited options. Cuff solves this by keeping everything local and encrypted.

---

## Target Users

- Individuals monitoring blood pressure for health reasons
- Privacy-conscious users who don't want health data in the cloud
- Users without smartphones who want a desktop-friendly solution
- People who want to share BP data with doctors via export (not app access)

---

## Features

### Core Features (Implemented)

| Feature | Description |
|---------|-------------|
| **Password-Protected Encryption** | AES-256-GCM encryption with PBKDF2 key derivation (100,000 iterations) |
| **Add Readings** | Log systolic, diastolic, pulse with date/time |
| **Notes Field** | Optional text notes for context (e.g., "after coffee", "feeling stressed") |
| **Outlier Validation** | Confirmation prompt for unusual values (systolic >180/<70, diastolic >120/<40, pulse >150/<40) |
| **Readings List** | Table view with notes and delete functionality |
| **BP Categories** | Automatic classification: Normal, Elevated, High Stage 1, High Stage 2, Crisis |
| **Statistics Dashboard** | Averages for 7-day, 30-day, and all-time periods with min/max ranges |
| **Trend Chart** | Line chart visualization with 7-day, 30-day, all-time filters |
| **CSV Export** | Export readings with notes for spreadsheets or sharing with healthcare providers |
| **Backup & Restore** | Encrypted or plain JSON backup files with merge support |
| **Change Password** | Re-encrypt all data with a new password |
| **Dark Mode UI** | Dark theme optimized for reduced eye strain |

### Non-Functional Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Privacy** | Zero network requests; all data in localStorage |
| **No Dependencies** | No accounts, no cloud, no external health platforms |
| **Offline-First** | Works without internet (after initial page load) |
| **Portable** | Single HTML file can be opened directly in any browser |
| **No Build Step** | Vanilla HTML/CSS/JS—no compilation required |

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Charts** | Chart.js (via CDN) |
| **Encryption** | Web Crypto API (native browser) |
| **Storage** | localStorage |

### File Structure

```
cuff/
├── index.html      # Single-page application entry point
├── styles.css      # Dark mode styling
├── app.js          # Core application logic
├── chart.js        # Chart.js configuration and rendering
├── crypto.js       # Encryption/decryption module
├── README.md       # Project documentation
└── PRD.md          # This document
```

### Data Model

**Reading Object:**
```json
{
  "id": "lxyz123abc",
  "systolic": 120,
  "diastolic": 80,
  "pulse": 72,
  "timestamp": "2026-01-10T14:30:00.000Z",
  "notes": "After morning coffee"
}
```

**Encrypted Storage Structure:**
```json
{
  "iv": "base64-encoded-iv",
  "data": "base64-encoded-encrypted-data"
}
```

**Backup File Format:**
```json
{
  "version": 1,
  "encrypted": false,
  "exportDate": "2026-01-10T14:30:00.000Z",
  "readings": [...]
}
```

---

## Security

### Encryption Details

| Component | Specification |
|-----------|---------------|
| **Algorithm** | AES-256-GCM (authenticated encryption) |
| **Key Derivation** | PBKDF2 with SHA-256, 100,000 iterations |
| **Salt** | 16 bytes, randomly generated per password setup |
| **IV** | 12 bytes, randomly generated per encryption operation |

### Security Considerations

- **No password recovery:** If the user forgets their password, data is unrecoverable
- **No server:** Eliminates network-based attack vectors
- **Browser security:** Relies on browser's Web Crypto API implementation
- **localStorage limits:** Data subject to browser storage limits (~5-10MB)

---

## User Flows

### First-Time Setup
1. User opens app
2. Password creation modal appears
3. User enters and confirms password
4. App initializes with empty data, encrypted storage created

### Returning User
1. User opens app
2. Password entry modal appears
3. User enters password
4. App decrypts and displays existing readings

### Adding a Reading
1. User enters systolic, diastolic, pulse values
2. User selects date/time (defaults to now)
3. User clicks "Save Reading"
4. If values are outliers → confirmation prompt
5. Reading saved, UI updates (list, stats, chart)

### Changing Password
1. User clicks "Change Password" in Security section
2. Modal opens
3. User enters current password, new password (twice)
4. App verifies current password
5. App re-encrypts all data with new key
6. Success confirmation

---

## BP Classification Reference

| Category | Systolic | Diastolic |
|----------|----------|-----------|
| Normal | <120 | AND <80 |
| Elevated | 120-129 | AND <80 |
| High Stage 1 | 130-139 | OR 80-89 |
| High Stage 2 | ≥140 | OR ≥90 |
| Crisis | >180 | OR >120 |

---

## Future Enhancements (Backlog)

| Feature | Priority | Description |
|---------|----------|-------------|
| Reading tags | Medium | Quick tags (Morning, Evening, Post-exercise) |
| PWA support | Medium | Installable app with offline manifest |
| Print view | Low | Printer-friendly format for doctor visits |
| Data visualization | Low | Additional chart types (distribution, calendar heatmap) |
| Multiple profiles | Low | Track readings for family members |
| Medication log | Low | Correlate BP with medications |

---

## Repository

**GitHub:** https://github.com/johnson-chris/cuff
**Live Demo:** https://johnson-chris.github.io/cuff (pending deployment)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | Jan 2026 | Add notes field for reading context |
| 1.0 | Jan 2026 | Initial release with core features |
