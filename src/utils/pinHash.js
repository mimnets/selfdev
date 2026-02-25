/**
 * Hash a PIN using SHA-256 via the Web Crypto API.
 * Returns a hex string. Never stores the raw PIN.
 */
export async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a raw PIN against a stored hash.
 */
export async function verifyPin(pin, storedHash) {
    const inputHash = await hashPin(pin);
    return inputHash === storedHash;
}
