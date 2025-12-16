import crypto from "node:crypto";
import { env } from "~/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

interface EncryptedData {
	iv: string;
	authTag: string;
	encrypted: string;
}

function getEncryptionKey(): Buffer {
	const key = env.ENCRYPTION_KEY;
	if (!key) {
		throw new Error("ENCRYPTION_KEY environment variable is required");
	}

	// Support 32-byte key as hex (64 chars) or base64 (44 chars)
	if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
		return Buffer.from(key, "hex");
	}

	// Try base64
	const buffer = Buffer.from(key, "base64");
	if (buffer.length === 32) {
		return buffer;
	}

	// If it's exactly 32 characters, use as raw bytes
	if (key.length === 32) {
		return Buffer.from(key, "utf8");
	}

	throw new Error(
		"ENCRYPTION_KEY must be 32 bytes (64 hex chars, 44 base64 chars, or 32 raw chars)",
	);
}

export function encrypt(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

	let encrypted = cipher.update(plaintext, "utf8", "base64");
	encrypted += cipher.final("base64");

	const authTag = cipher.getAuthTag();

	const data: EncryptedData = {
		iv: iv.toString("base64"),
		authTag: authTag.toString("base64"),
		encrypted,
	};

	return JSON.stringify(data);
}

export function decrypt(encryptedJson: string): string {
	const key = getEncryptionKey();
	const data: EncryptedData = JSON.parse(encryptedJson) as EncryptedData;

	const iv = Buffer.from(data.iv, "base64");
	const authTag = Buffer.from(data.authTag, "base64");
	const encrypted = Buffer.from(data.encrypted, "base64");

	const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encrypted);
	decrypted = Buffer.concat([decrypted, decipher.final()]);

	return decrypted.toString("utf8");
}
