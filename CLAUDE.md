# CLAUDE.md - Cuff Project Guide

## Project Overview

**Cuff** is a privacy-focused blood pressure tracking web application that runs entirely in the browser. All data is encrypted and stored locally—nothing is sent to any server.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js (via CDN)
- **Encryption**: Web Crypto API (native browser)
- **Storage**: localStorage (encrypted)
- **No build step required** - Open index.html directly in browser

## File Structure

```
cuff/
├── index.html      # Single-page application entry point
├── styles.css      # Dark mode styling
├── app.js          # Core application logic (readings, stats, backup, medications)
├── chart.js        # Chart.js configuration and rendering
├── crypto.js       # Encryption/decryption module (AES-256-GCM)
├── README.md       # Project documentation
├── PRD.md          # Product Requirements Document
├── CLAUDE.md       # This file
├── PLANNING.md     # Project planning and milestones
├── TASKS.md        # Task tracking
└── SESSION_NOTES.md # Session summaries
```

## Architectural Decisions

### Encryption Architecture
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **Salt**: 16 bytes, randomly generated per password setup
- **IV**: 12 bytes, randomly generated per encryption operation
- **Storage Keys**:
  - `bp-tracker-encrypted` - Encrypted readings
  - `bp-tracker-medications` - Encrypted medications
  - `bp-tracker-salt` - Salt for key derivation
  - `bp-tracker-verify` - Password verification token

### Data Caching Pattern
- Readings and medications are cached in memory (`cachedReadings`, `cachedMedications`)
- Cache is populated on unlock, updated on every save
- Avoids repeated decryption for better performance

### UI Patterns
- Dark mode by default (CSS variables in `:root`)
- Modal-based forms for data entry
- Inline confirmation for destructive actions
- Category badges with color coding for BP levels

## Key Code Patterns

### Adding New Encrypted Data Types
1. Add storage key constant in `crypto.js`
2. Create `saveEncrypted[Type]()` and `loadEncrypted[Type]()` functions
3. Update `changePassword()` to re-encrypt the new data type
4. Export functions via `window.CryptoModule`
5. Add cache variable and CRUD functions in `app.js`

### Form Handling
- Forms use `handleSubmit` pattern with `e.preventDefault()`
- Validation before save, error display in modal
- Reset form and close modal on success

### Rendering Pattern
- `render[Component]()` functions rebuild innerHTML
- Check for empty state and show appropriate message
- Use template literals for HTML generation

## Development Workflow

### SDLC Process (Feature Branch Workflow)
1. Create GitHub issue describing the feature
2. Create feature branch: `git checkout -b feature/[name]`
3. Implement changes
4. Update PRD.md with new feature and changelog
5. Commit with descriptive message and `Co-Authored-By`
6. Push and create PR referencing the issue
7. Merge to main, delete feature branch

### Commit Message Format
```
Short description of change

- Bullet points for details
- Reference issue: Closes #X

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Common Commands

```bash
# Start development (just open in browser)
open index.html

# Git workflow
git checkout -b feature/[name]
git add .
git commit -m "message"
git push -u origin feature/[name]
git checkout main && git merge feature/[name] --no-ff
git push origin main
git branch -d feature/[name]
```

## Lessons Learned

1. **Stats refresh bug**: Don't destroy DOM elements that need to persist. Use `innerHTML` assignment instead of `appendChild` when rebuilding sections.

2. **Unused variable warnings**: TypeScript/linter catches unused variables - remove them (e.g., `noMedsMsg` was declared but not used).

3. **CSV escaping**: Notes field required proper CSV escaping for commas, quotes, and newlines.

4. **Async unlockApp**: When loading multiple encrypted data types, `unlockApp()` needs to be `async` to await all decryption.

5. **Global onclick handlers**: Functions called from `onclick` attributes in HTML must be exposed on `window` object.
