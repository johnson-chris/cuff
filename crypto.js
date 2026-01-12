// BP Tracker - Encryption Module using Web Crypto API

const CRYPTO_STORAGE_KEY = 'bp-tracker-encrypted';
const MEDICATIONS_STORAGE_KEY = 'bp-tracker-medications';
const SALT_KEY = 'bp-tracker-salt';
const VERIFY_KEY = 'bp-tracker-verify';

// Encryption state
let derivedKey = null;

// Convert string to ArrayBuffer
function stringToBuffer(str) {
    return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function bufferToString(buffer) {
    return new TextDecoder().decode(buffer);
}

// Convert ArrayBuffer to base64
function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Convert base64 to ArrayBuffer
function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Generate a random salt
function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
}

// Generate a random IV for AES-GCM
function generateIV() {
    return crypto.getRandomValues(new Uint8Array(12));
}

// Derive encryption key from password using PBKDF2
async function deriveKey(password, salt) {
    const passwordBuffer = stringToBuffer(password);

    const importedKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    return key;
}

// Encrypt data
async function encryptData(data, key) {
    const iv = generateIV();
    const dataString = JSON.stringify(data);
    const dataBuffer = stringToBuffer(dataString);

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
    );

    return {
        iv: bufferToBase64(iv),
        data: bufferToBase64(encryptedBuffer)
    };
}

// Decrypt data
async function decryptData(encryptedObj, key) {
    const iv = base64ToBuffer(encryptedObj.iv);
    const encryptedData = base64ToBuffer(encryptedObj.data);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
    );

    const decryptedString = bufferToString(decryptedBuffer);
    return JSON.parse(decryptedString);
}

// Check if this is first time setup (no existing data)
function isFirstTimeSetup() {
    return !localStorage.getItem(SALT_KEY);
}

// Initialize encryption with password
async function initializeEncryption(password, isNewSetup = false) {
    let salt;

    if (isNewSetup) {
        salt = generateSalt();
        localStorage.setItem(SALT_KEY, bufferToBase64(salt));
    } else {
        const storedSalt = localStorage.getItem(SALT_KEY);
        if (!storedSalt) {
            throw new Error('No encryption key found');
        }
        salt = new Uint8Array(base64ToBuffer(storedSalt));
    }

    derivedKey = await deriveKey(password, salt);

    if (isNewSetup) {
        // Store a verification token to check password later
        const verifyData = await encryptData({ verify: 'bp-tracker' }, derivedKey);
        localStorage.setItem(VERIFY_KEY, JSON.stringify(verifyData));
        // Initialize empty readings
        await saveEncryptedReadings([]);
    } else {
        // Verify password by decrypting verification token
        const verifyData = localStorage.getItem(VERIFY_KEY);
        if (!verifyData) {
            throw new Error('No verification data found');
        }

        try {
            const decrypted = await decryptData(JSON.parse(verifyData), derivedKey);
            if (decrypted.verify !== 'bp-tracker') {
                throw new Error('Invalid verification');
            }
        } catch (e) {
            derivedKey = null;
            throw new Error('Incorrect password');
        }
    }

    return true;
}

// Save readings (encrypted)
async function saveEncryptedReadings(readings) {
    if (!derivedKey) {
        throw new Error('Encryption not initialized');
    }

    const encrypted = await encryptData(readings, derivedKey);
    localStorage.setItem(CRYPTO_STORAGE_KEY, JSON.stringify(encrypted));
}

// Load readings (decrypted)
async function loadEncryptedReadings() {
    if (!derivedKey) {
        throw new Error('Encryption not initialized');
    }

    const stored = localStorage.getItem(CRYPTO_STORAGE_KEY);
    if (!stored) {
        return [];
    }

    try {
        return await decryptData(JSON.parse(stored), derivedKey);
    } catch (e) {
        console.error('Failed to decrypt readings:', e);
        return [];
    }
}

// Check if encryption is initialized
function isEncryptionReady() {
    return derivedKey !== null;
}

// Save medications (encrypted)
async function saveEncryptedMedications(medications) {
    if (!derivedKey) {
        throw new Error('Encryption not initialized');
    }

    const encrypted = await encryptData(medications, derivedKey);
    localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(encrypted));
}

// Load medications (decrypted)
async function loadEncryptedMedications() {
    if (!derivedKey) {
        throw new Error('Encryption not initialized');
    }

    const stored = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
    if (!stored) {
        return [];
    }

    try {
        return await decryptData(JSON.parse(stored), derivedKey);
    } catch (e) {
        console.error('Failed to decrypt medications:', e);
        return [];
    }
}

// Create encrypted backup object
async function createEncryptedBackup(readings) {
    if (!derivedKey) {
        throw new Error('Encryption not initialized');
    }

    const salt = localStorage.getItem(SALT_KEY);
    const encrypted = await encryptData(readings, derivedKey);

    return {
        version: 1,
        encrypted: true,
        exportDate: new Date().toISOString(),
        salt: salt,
        data: encrypted
    };
}

// Decrypt backup file using current password/key
async function decryptBackup(backup) {
    if (!derivedKey) {
        throw new Error('Encryption not initialized');
    }

    if (!backup.encrypted || !backup.data) {
        throw new Error('Invalid encrypted backup format');
    }

    // Check if backup was made with same salt (same password setup)
    const currentSalt = localStorage.getItem(SALT_KEY);

    if (backup.salt !== currentSalt) {
        throw new Error('This backup was created with a different password. Cannot decrypt.');
    }

    try {
        return await decryptData(backup.data, derivedKey);
    } catch (e) {
        throw new Error('Failed to decrypt backup. Password may not match.');
    }
}

// Change password - re-encrypt all data with new password
async function changePassword(currentPassword, newPassword) {
    // First verify current password
    const storedSalt = localStorage.getItem(SALT_KEY);
    if (!storedSalt) {
        throw new Error('No encryption data found');
    }

    const currentSalt = new Uint8Array(base64ToBuffer(storedSalt));
    const testKey = await deriveKey(currentPassword, currentSalt);

    // Verify current password by decrypting verification token
    const verifyData = localStorage.getItem(VERIFY_KEY);
    if (!verifyData) {
        throw new Error('No verification data found');
    }

    try {
        const decrypted = await decryptData(JSON.parse(verifyData), testKey);
        if (decrypted.verify !== 'bp-tracker') {
            throw new Error('Invalid verification');
        }
    } catch (e) {
        throw new Error('Current password is incorrect');
    }

    // Load current readings with old key
    const storedReadings = localStorage.getItem(CRYPTO_STORAGE_KEY);
    let readings = [];
    if (storedReadings) {
        readings = await decryptData(JSON.parse(storedReadings), testKey);
    }

    // Load current medications with old key
    const storedMedications = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
    let medications = [];
    if (storedMedications) {
        medications = await decryptData(JSON.parse(storedMedications), testKey);
    }

    // Generate new salt and derive new key
    const newSalt = generateSalt();
    const newKey = await deriveKey(newPassword, newSalt);

    // Save new salt
    localStorage.setItem(SALT_KEY, bufferToBase64(newSalt));

    // Create new verification token
    const newVerifyData = await encryptData({ verify: 'bp-tracker' }, newKey);
    localStorage.setItem(VERIFY_KEY, JSON.stringify(newVerifyData));

    // Re-encrypt readings with new key
    const newEncryptedReadings = await encryptData(readings, newKey);
    localStorage.setItem(CRYPTO_STORAGE_KEY, JSON.stringify(newEncryptedReadings));

    // Re-encrypt medications with new key
    const newEncryptedMedications = await encryptData(medications, newKey);
    localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(newEncryptedMedications));

    // Update the active key
    derivedKey = newKey;

    return true;
}

// Export functions for use in app.js
window.CryptoModule = {
    isFirstTimeSetup,
    initializeEncryption,
    saveEncryptedReadings,
    loadEncryptedReadings,
    saveEncryptedMedications,
    loadEncryptedMedications,
    isEncryptionReady,
    createEncryptedBackup,
    decryptBackup,
    changePassword
};
