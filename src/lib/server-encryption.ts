import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// In a real app, this should be a long, random string stored in env vars
// For this demo, we'll use a hardcoded fallback if env var is missing, but this is NOT secure for production
const SERVER_SECRET = process.env.SERVER_BACKUP_KEY || 'spends-secure-server-backup-key-change-me-in-prod';

export function encryptServerData(data: any): string {
    const iv = crypto.randomBytes(12);
    const salt = crypto.randomBytes(16);

    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(SERVER_SECRET, salt, 100000, 32, 'sha256');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const jsonStr = JSON.stringify(data);
    let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: salt:iv:authTag:encryptedData
    return `${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decryptServerData(encryptedStr: string): any {
    const parts = encryptedStr.split(':');
    if (parts.length !== 4) throw new Error('Invalid encrypted data format');

    const [saltB64, ivB64, authTagB64, encryptedB64] = parts;

    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const key = crypto.pbkdf2Sync(SERVER_SECRET, salt, 100000, 32, 'sha256');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
}
