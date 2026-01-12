// BP Tracker - Main Application Logic

// Outlier thresholds for validation warnings
const OUTLIER_LIMITS = {
    systolic: { min: 70, max: 180 },
    diastolic: { min: 40, max: 120 },
    pulse: { min: 40, max: 150 }
};

// DOM Elements
const form = document.getElementById('reading-form');
const readingsBody = document.getElementById('readings-body');
const noReadingsMsg = document.getElementById('no-readings');
const exportBtn = document.getElementById('export-csv');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmSaveBtn = document.getElementById('confirm-save');
const confirmCancelBtn = document.getElementById('confirm-cancel');

// Password modal elements
const passwordModal = document.getElementById('password-modal');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const passwordConfirm = document.getElementById('password-confirm');
const confirmPasswordGroup = document.getElementById('confirm-password-group');
const passwordTitle = document.getElementById('password-title');
const passwordSubtitle = document.getElementById('password-subtitle');
const passwordError = document.getElementById('password-error');
const passwordSubmit = document.getElementById('password-submit');

let pendingReading = null;
let cachedReadings = []; // Cache readings in memory
let cachedMedications = []; // Cache medications in memory

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initPasswordModal();
});

// Password Modal Handling
function initPasswordModal() {
    const isFirstTime = window.CryptoModule.isFirstTimeSetup();

    if (isFirstTime) {
        passwordTitle.textContent = 'Create Password';
        passwordSubtitle.textContent = 'Create a password to encrypt your health data.';
        confirmPasswordGroup.style.display = 'block';
        passwordSubmit.textContent = 'Create & Encrypt';
    } else {
        passwordTitle.textContent = 'Enter Password';
        passwordSubtitle.textContent = 'Your data is encrypted. Enter your password to unlock.';
        confirmPasswordGroup.style.display = 'none';
        passwordSubmit.textContent = 'Unlock';
    }

    passwordForm.addEventListener('submit', handlePasswordSubmit);
}

async function handlePasswordSubmit(e) {
    e.preventDefault();
    hidePasswordError();

    const password = passwordInput.value;
    const isFirstTime = window.CryptoModule.isFirstTimeSetup();

    if (isFirstTime) {
        const confirm = passwordConfirm.value;
        if (password !== confirm) {
            showPasswordError('Passwords do not match');
            return;
        }
        if (password.length < 4) {
            showPasswordError('Password must be at least 4 characters');
            return;
        }
    }

    try {
        passwordSubmit.disabled = true;
        passwordSubmit.textContent = 'Unlocking...';

        await window.CryptoModule.initializeEncryption(password, isFirstTime);

        // Load readings into cache
        cachedReadings = await window.CryptoModule.loadEncryptedReadings();

        // Unlock the app
        unlockApp();
    } catch (error) {
        showPasswordError(error.message || 'Failed to unlock');
    } finally {
        passwordSubmit.disabled = false;
        passwordSubmit.textContent = isFirstTime ? 'Create & Encrypt' : 'Unlock';
    }
}

function showPasswordError(message) {
    passwordError.textContent = message;
    passwordError.style.display = 'block';
}

function hidePasswordError() {
    passwordError.style.display = 'none';
}

async function unlockApp() {
    passwordModal.classList.remove('active');
    document.body.classList.remove('app-locked');

    // Load medications
    cachedMedications = await window.CryptoModule.loadEncryptedMedications();

    // Initialize the main app
    setDefaultDateTime();
    renderReadings();
    renderStats();
    renderMedications();
    initEventListeners();

    // Initialize chart
    if (typeof initChart === 'function') {
        initChart();
        initChartControls();
    }
}

function initEventListeners() {
    form.addEventListener('submit', handleFormSubmit);
    exportBtn.addEventListener('click', exportToCSV);
    confirmSaveBtn.addEventListener('click', confirmSave);
    confirmCancelBtn.addEventListener('click', closeModal);
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeModal();
    });

    // Backup & Restore
    document.getElementById('backup-encrypted-btn').addEventListener('click', downloadEncryptedBackup);
    document.getElementById('backup-btn').addEventListener('click', downloadBackup);
    document.getElementById('restore-btn').addEventListener('click', () => {
        document.getElementById('restore-file').click();
    });
    document.getElementById('restore-file').addEventListener('change', handleRestore);

    // Change Password
    document.getElementById('change-password-btn').addEventListener('click', openChangePasswordModal);
    document.getElementById('change-password-cancel').addEventListener('click', closeChangePasswordModal);
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    document.getElementById('change-password-modal').addEventListener('click', (e) => {
        if (e.target.id === 'change-password-modal') closeChangePasswordModal();
    });

    // Medications
    document.getElementById('add-medication-btn').addEventListener('click', openMedicationModal);
    document.getElementById('medication-cancel').addEventListener('click', closeMedicationModal);
    document.getElementById('medication-form').addEventListener('submit', handleMedicationSubmit);
    document.getElementById('medication-modal').addEventListener('click', (e) => {
        if (e.target.id === 'medication-modal') closeMedicationModal();
    });
}

function setDefaultDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    document.getElementById('reading-datetime').value = local.toISOString().slice(0, 16);
}

// Storage Functions (using encrypted storage)
function getReadings() {
    return cachedReadings;
}

async function saveReadings(readings) {
    cachedReadings = readings;
    await window.CryptoModule.saveEncryptedReadings(readings);
}

async function addReading(reading) {
    const readings = getReadings();
    readings.unshift(reading);
    await saveReadings(readings);
}

async function deleteReading(id) {
    const readings = getReadings().filter(r => r.id !== id);
    await saveReadings(readings);
    renderReadings();
    renderStats();
    if (typeof updateChart === 'function') {
        updateChart();
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Form Handling
function handleFormSubmit(e) {
    e.preventDefault();

    const systolic = parseInt(document.getElementById('systolic').value);
    const diastolic = parseInt(document.getElementById('diastolic').value);
    const pulse = parseInt(document.getElementById('pulse').value);
    const timestamp = document.getElementById('reading-datetime').value;
    const notes = document.getElementById('reading-notes').value.trim();

    const reading = {
        id: generateId(),
        systolic,
        diastolic,
        pulse,
        timestamp: new Date(timestamp).toISOString(),
        notes: notes || ''
    };

    const outliers = checkOutliers(reading);

    if (outliers.length > 0) {
        pendingReading = reading;
        showOutlierWarning(outliers);
    } else {
        saveAndRender(reading);
    }
}

function checkOutliers(reading) {
    const outliers = [];

    if (reading.systolic < OUTLIER_LIMITS.systolic.min || reading.systolic > OUTLIER_LIMITS.systolic.max) {
        outliers.push(`Systolic ${reading.systolic} mmHg`);
    }
    if (reading.diastolic < OUTLIER_LIMITS.diastolic.min || reading.diastolic > OUTLIER_LIMITS.diastolic.max) {
        outliers.push(`Diastolic ${reading.diastolic} mmHg`);
    }
    if (reading.pulse < OUTLIER_LIMITS.pulse.min || reading.pulse > OUTLIER_LIMITS.pulse.max) {
        outliers.push(`Pulse ${reading.pulse} bpm`);
    }

    return outliers;
}

function showOutlierWarning(outliers) {
    confirmMessage.textContent = `The following values seem unusual: ${outliers.join(', ')}. Are you sure you want to save this reading?`;
    confirmModal.classList.add('active');
}

function confirmSave() {
    if (pendingReading) {
        saveAndRender(pendingReading);
        pendingReading = null;
    }
    closeModal();
}

function closeModal() {
    confirmModal.classList.remove('active');
    pendingReading = null;
}

async function saveAndRender(reading) {
    await addReading(reading);
    form.reset();
    setDefaultDateTime();
    renderReadings();
    renderStats();
    if (typeof updateChart === 'function') {
        updateChart();
    }
}

// BP Category Classification
function getBPCategory(systolic, diastolic) {
    if (systolic > 180 || diastolic > 120) {
        return { name: 'Crisis', class: 'crisis' };
    }
    if (systolic >= 140 || diastolic >= 90) {
        return { name: 'High Stage 2', class: 'high-2' };
    }
    if (systolic >= 130 || diastolic >= 80) {
        return { name: 'High Stage 1', class: 'high-1' };
    }
    if (systolic >= 120 && diastolic < 80) {
        return { name: 'Elevated', class: 'elevated' };
    }
    return { name: 'Normal', class: 'normal' };
}

// Render Readings Table
function renderReadings() {
    const readings = getReadings();

    if (readings.length === 0) {
        readingsBody.innerHTML = '';
        noReadingsMsg.style.display = 'block';
        document.getElementById('readings-table').style.display = 'none';
        return;
    }

    noReadingsMsg.style.display = 'none';
    document.getElementById('readings-table').style.display = 'table';

    readingsBody.innerHTML = readings.map(reading => {
        const date = new Date(reading.timestamp);
        const category = getBPCategory(reading.systolic, reading.diastolic);
        const notes = reading.notes || '';
        const notesDisplay = notes ? `<span title="${notes.replace(/"/g, '&quot;')}">${notes}</span>` : '-';

        return `
            <tr>
                <td>${date.toLocaleDateString()}</td>
                <td>${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${reading.systolic}</td>
                <td>${reading.diastolic}</td>
                <td>${reading.pulse}</td>
                <td><span class="category-badge category-${category.class}">${category.name}</span></td>
                <td class="notes-cell">${notesDisplay}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteReading('${reading.id}')" title="Delete">
                        &#x2715;
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// CSV Export
function exportToCSV() {
    const readings = getReadings();

    if (readings.length === 0) {
        alert('No readings to export');
        return;
    }

    const headers = ['Date', 'Time', 'Systolic (mmHg)', 'Diastolic (mmHg)', 'Pulse (bpm)', 'Category', 'Notes'];

    const rows = readings.map(reading => {
        const date = new Date(reading.timestamp);
        const category = getBPCategory(reading.systolic, reading.diastolic);
        const notes = reading.notes || '';
        // Escape notes for CSV (wrap in quotes if contains comma, quote, or newline)
        const escapedNotes = notes.includes(',') || notes.includes('"') || notes.includes('\n')
            ? `"${notes.replace(/"/g, '""')}"`
            : notes;
        return [
            date.toLocaleDateString(),
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reading.systolic,
            reading.diastolic,
            reading.pulse,
            category.name,
            escapedNotes
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `cuff-readings-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Statistics Rendering
function renderStats() {
    const readings = getReadings();
    const statsGrid = document.getElementById('stats-grid');

    if (readings.length === 0) {
        statsGrid.innerHTML = '<p class="no-data-message">Add readings to see statistics</p>';
        return;
    }

    const now = new Date();
    const periods = [
        { name: '7 Days', days: 7 },
        { name: '30 Days', days: 30 },
        { name: 'All Time', days: null }
    ];

    const statsHTML = periods.map(period => {
        const filtered = period.days
            ? readings.filter(r => {
                const diff = (now - new Date(r.timestamp)) / (1000 * 60 * 60 * 24);
                return diff <= period.days;
            })
            : readings;

        if (filtered.length === 0) {
            return `
                <div class="stat-card">
                    <h4>${period.name}</h4>
                    <p class="stat-label">No data</p>
                </div>
            `;
        }

        const stats = calculateStats(filtered);
        const category = getBPCategory(stats.avgSystolic, stats.avgDiastolic);

        return `
            <div class="stat-card">
                <h4>${period.name}</h4>
                <div class="stat-value">
                    <span class="systolic">${stats.avgSystolic}</span>/<span class="diastolic">${stats.avgDiastolic}</span>
                </div>
                <p class="stat-label">Avg BP (${filtered.length} readings)</p>
                <div style="margin-top: 0.5rem;">
                    <span class="category-badge category-${category.class}">${category.name}</span>
                </div>
                <div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-secondary);">
                    <div>Pulse: <span class="pulse">${stats.avgPulse}</span> bpm</div>
                    <div style="margin-top: 0.25rem;">Range: ${stats.minSystolic}-${stats.maxSystolic}/${stats.minDiastolic}-${stats.maxDiastolic}</div>
                </div>
            </div>
        `;
    }).join('');

    statsGrid.innerHTML = statsHTML;
}

function calculateStats(readings) {
    const systolics = readings.map(r => r.systolic);
    const diastolics = readings.map(r => r.diastolic);
    const pulses = readings.map(r => r.pulse);

    return {
        avgSystolic: Math.round(systolics.reduce((a, b) => a + b, 0) / systolics.length),
        avgDiastolic: Math.round(diastolics.reduce((a, b) => a + b, 0) / diastolics.length),
        avgPulse: Math.round(pulses.reduce((a, b) => a + b, 0) / pulses.length),
        minSystolic: Math.min(...systolics),
        maxSystolic: Math.max(...systolics),
        minDiastolic: Math.min(...diastolics),
        maxDiastolic: Math.max(...diastolics)
    };
}

// Backup & Restore Functions
async function downloadEncryptedBackup() {
    const readings = getReadings();

    if (readings.length === 0) {
        alert('No readings to backup');
        return;
    }

    try {
        const backup = await window.CryptoModule.createEncryptedBackup(readings);

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `cuff-encrypted-${new Date().toISOString().slice(0, 10)}.json`);
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Failed to create encrypted backup: ' + error.message);
    }
}

function downloadBackup() {
    const readings = getReadings();

    if (readings.length === 0) {
        alert('No readings to backup');
        return;
    }

    const backup = {
        version: 1,
        encrypted: false,
        exportDate: new Date().toISOString(),
        readings: readings
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `cuff-backup-${new Date().toISOString().slice(0, 10)}.json`);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function handleRestore(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const backup = JSON.parse(text);

        let backupReadings;

        // Check if backup is encrypted
        if (backup.encrypted === true) {
            try {
                backupReadings = await window.CryptoModule.decryptBackup(backup);
            } catch (decryptError) {
                alert('Failed to decrypt backup: ' + decryptError.message);
                e.target.value = '';
                return;
            }
        } else if (backup.readings && Array.isArray(backup.readings)) {
            // Plain backup
            backupReadings = backup.readings;
        } else {
            throw new Error('Invalid backup file format');
        }

        const existingReadings = getReadings();
        const existingIds = new Set(existingReadings.map(r => r.id));

        // Filter out duplicates based on ID
        const newReadings = backupReadings.filter(r => !existingIds.has(r.id));

        if (newReadings.length === 0) {
            alert('No new readings to import. All readings in the backup already exist.');
            e.target.value = '';
            return;
        }

        const confirmMsg = existingReadings.length > 0
            ? `Found ${newReadings.length} new readings. Merge with existing ${existingReadings.length} readings?`
            : `Import ${newReadings.length} readings?`;

        if (!confirm(confirmMsg)) {
            e.target.value = '';
            return;
        }

        // Merge and sort by timestamp (newest first)
        const merged = [...existingReadings, ...newReadings];
        merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        await saveReadings(merged);
        renderReadings();
        renderStats();
        if (typeof updateChart === 'function') {
            updateChart();
        }

        alert(`Successfully imported ${newReadings.length} readings.`);
    } catch (error) {
        alert('Failed to restore backup: ' + error.message);
    }

    e.target.value = '';
}

// Change Password Functions
function openChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('active');
    document.getElementById('current-password').focus();
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').classList.remove('active');
    document.getElementById('change-password-form').reset();
    document.getElementById('change-password-error').style.display = 'none';
}

async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('new-password-confirm').value;
    const errorEl = document.getElementById('change-password-error');
    const submitBtn = document.getElementById('change-password-submit');

    // Hide previous error
    errorEl.style.display = 'none';

    // Validate new password
    if (newPassword.length < 4) {
        errorEl.textContent = 'New password must be at least 4 characters';
        errorEl.style.display = 'block';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'New passwords do not match';
        errorEl.style.display = 'block';
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Changing...';

        await window.CryptoModule.changePassword(currentPassword, newPassword);

        closeChangePasswordModal();
        alert('Password changed successfully!');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';
    }
}

// Medication Functions
function getMedications() {
    return cachedMedications;
}

async function saveMedications(medications) {
    cachedMedications = medications;
    await window.CryptoModule.saveEncryptedMedications(medications);
}

async function addMedication(medication) {
    const medications = getMedications();
    medications.push(medication);
    await saveMedications(medications);
}

async function updateMedication(id, updates) {
    const medications = getMedications().map(m =>
        m.id === id ? { ...m, ...updates } : m
    );
    await saveMedications(medications);
}

async function deleteMedication(id) {
    if (!confirm('Are you sure you want to delete this medication?')) {
        return;
    }
    const medications = getMedications().filter(m => m.id !== id);
    await saveMedications(medications);
    renderMedications();
}

function renderMedications() {
    const medications = getMedications();
    const listEl = document.getElementById('medications-list');

    if (medications.length === 0) {
        listEl.innerHTML = '<p class="no-data-message" id="no-medications">No medications added. Track your BP medications here.</p>';
        return;
    }

    listEl.innerHTML = medications.map(med => {
        const timeDisplay = med.timeOfDay ? ` - ${med.timeOfDay}` : '';
        return `
            <div class="medication-card">
                <div class="medication-info">
                    <div class="medication-name">${escapeHtml(med.name)}</div>
                    <div class="medication-details">${escapeHtml(med.dosage)} • ${escapeHtml(med.frequency)}${timeDisplay}</div>
                </div>
                <div class="medication-actions">
                    <button class="btn btn-secondary" onclick="editMedication('${med.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteMedication('${med.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openMedicationModal(medicationId = null) {
    const modal = document.getElementById('medication-modal');
    const title = document.getElementById('medication-modal-title');
    const form = document.getElementById('medication-form');
    const idInput = document.getElementById('medication-id');

    form.reset();
    document.getElementById('medication-error').style.display = 'none';

    if (medicationId) {
        const medication = getMedications().find(m => m.id === medicationId);
        if (medication) {
            title.textContent = 'Edit Medication';
            idInput.value = medication.id;
            document.getElementById('medication-name').value = medication.name;
            document.getElementById('medication-dosage').value = medication.dosage;
            document.getElementById('medication-frequency').value = medication.frequency;
            document.getElementById('medication-time').value = medication.timeOfDay || '';
        }
    } else {
        title.textContent = 'Add Medication';
        idInput.value = '';
    }

    modal.classList.add('active');
    document.getElementById('medication-name').focus();
}

function closeMedicationModal() {
    document.getElementById('medication-modal').classList.remove('active');
    document.getElementById('medication-form').reset();
    document.getElementById('medication-error').style.display = 'none';
}

async function handleMedicationSubmit(e) {
    e.preventDefault();

    const idInput = document.getElementById('medication-id');
    const name = document.getElementById('medication-name').value.trim();
    const dosage = document.getElementById('medication-dosage').value.trim();
    const frequency = document.getElementById('medication-frequency').value;
    const timeOfDay = document.getElementById('medication-time').value;
    const errorEl = document.getElementById('medication-error');

    if (!name || !dosage || !frequency) {
        errorEl.textContent = 'Please fill in all required fields';
        errorEl.style.display = 'block';
        return;
    }

    const medication = {
        id: idInput.value || generateId(),
        name,
        dosage,
        frequency,
        timeOfDay: timeOfDay || null
    };

    try {
        if (idInput.value) {
            await updateMedication(medication.id, medication);
        } else {
            await addMedication(medication);
        }
        closeMedicationModal();
        renderMedications();
    } catch (error) {
        errorEl.textContent = 'Failed to save medication: ' + error.message;
        errorEl.style.display = 'block';
    }
}

function editMedication(id) {
    openMedicationModal(id);
}

// Make functions available globally for onclick handlers
window.deleteReading = deleteReading;
window.deleteMedication = deleteMedication;
window.editMedication = editMedication;
