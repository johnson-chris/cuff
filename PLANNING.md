# PLANNING.md - Cuff Project Planning

## Current Version: 1.2

## Project Phases

### Phase 1: Core Foundation - COMPLETE
- [x] Basic HTML structure with form and sections
- [x] Dark mode CSS styling
- [x] localStorage data layer (CRUD operations)
- [x] Readings list with delete functionality
- [x] Input validation and BP category display
- [x] Chart.js integration and trend chart
- [x] CSV export functionality

### Phase 2: Security & Privacy - COMPLETE
- [x] Password-protected encryption (AES-256-GCM)
- [x] PBKDF2 key derivation (100,000 iterations)
- [x] First-time setup flow
- [x] Password verification on unlock
- [x] Change password functionality
- [x] Re-encryption of all data on password change

### Phase 3: Data Management - COMPLETE
- [x] Statistics dashboard (7-day, 30-day, all-time)
- [x] Encrypted backup export
- [x] Plain backup export
- [x] Backup restore with merge support
- [x] Duplicate detection on import

### Phase 4: Enhanced Features - COMPLETE
- [x] Notes field for readings
- [x] Outlier validation with confirmation prompt
- [x] Medication tracker (add/edit/delete)
- [x] Encrypted medication storage

### Phase 5: Future Enhancements - PLANNED
- [ ] Reading tags (Morning, Evening, Post-exercise)
- [ ] PWA support (installable app with offline manifest)
- [ ] Print view for doctor visits
- [ ] Additional chart types (distribution, calendar heatmap)
- [ ] Multiple profiles for family members
- [ ] GitHub Pages deployment

## Milestones

| Milestone | Status | Date |
|-----------|--------|------|
| v1.0 - Initial Release | Complete | Jan 2026 |
| v1.1 - Notes Field | Complete | Jan 2026 |
| v1.2 - Medication Tracker | Complete | Jan 2026 |
| v1.3 - Reading Tags | Planned | TBD |
| v2.0 - PWA Support | Planned | TBD |

## Current Sprint Focus

**Completed**: Medication tracker feature (Issue #5)
- Added medications section to UI
- Implemented encrypted storage for medications
- Add/edit/delete functionality
- Updated PRD to v1.2

## Technical Debt

- None identified at this time

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Chart.js | CDN (latest) | Trend visualization |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| localStorage limits (~5-10MB) | Low | Medium | Monitor data size, implement data pruning if needed |
| Password forgotten | Medium | High | No recovery possible - document clearly to users |
| Browser compatibility | Low | Medium | Using standard Web Crypto API, wide support |
