# TASKS.md - Cuff Project Tasks

## Completed Tasks

### Core Features
- [x] Create HTML structure with form and sections
- [x] Implement dark mode CSS styling
- [x] Build localStorage data layer (CRUD operations)
- [x] Create readings list with delete functionality
- [x] Add input validation
- [x] Implement BP category classification and display
- [x] Integrate Chart.js for trend visualization
- [x] Add chart time range controls (7-day, 30-day, all-time)
- [x] Implement CSV export functionality
- [x] Add outlier validation with confirmation prompt

### Security Features
- [x] Implement AES-256-GCM encryption
- [x] Add PBKDF2 key derivation (100,000 iterations)
- [x] Create password modal for first-time setup
- [x] Create password modal for returning users
- [x] Add password verification on unlock
- [x] Implement change password functionality (Issue #1)
- [x] Re-encrypt all data types on password change

### Data Management
- [x] Create statistics dashboard
- [x] Add 7-day, 30-day, all-time period stats
- [x] Implement encrypted backup export
- [x] Implement plain backup export
- [x] Add backup restore functionality
- [x] Handle duplicate detection on import
- [x] Fix stats auto-refresh bug

### Enhanced Features
- [x] Add notes field to readings (Issue #3)
- [x] Update CSV export to include notes
- [x] Implement medication tracker (Issue #5)
- [x] Add medication modal with form fields
- [x] Implement medication CRUD operations
- [x] Add encrypted storage for medications

### Documentation & DevOps
- [x] Create README.md
- [x] Create PRD.md
- [x] Set up GitHub repository
- [x] Establish feature branch workflow
- [x] Update PRD with each feature release

## In Progress

None currently.

## Pending Tasks

### Phase 5 Features (Backlog)
- [ ] Add reading tags (Morning, Evening, Post-exercise)
- [ ] Implement PWA support with offline manifest
- [ ] Create print-friendly view for doctor visits
- [ ] Add distribution chart visualization
- [ ] Add calendar heatmap visualization
- [ ] Implement multiple user profiles

### Deployment
- [ ] Enable GitHub Pages hosting
- [ ] Test deployment

### Nice to Have
- [ ] Link medications to specific readings
- [ ] Medication reminder notifications (if PWA)
- [ ] Data export in PDF format
- [ ] Import from other BP tracking apps

## Blocked Tasks

None currently.

## GitHub Issues Reference

| Issue # | Title | Status |
|---------|-------|--------|
| #1 | Add change password functionality | Closed |
| #3 | Add notes field to readings | Closed |
| #5 | Add medication tracker | Closed |
