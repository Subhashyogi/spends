import { authenticator } from "otplib";

// Configure authenticator globally
authenticator.options = {
    window: 4, // 2 minutes window for time drift
    step: 30   // Default step is 30s
};

export function verifyTwoFactorCode(code: string, secret: string): boolean {
    if (!code || !secret) return false;

    try {
        // Log for debugging (be careful with secrets in prod)
        console.log(`[2FA] Verifying code: ${code} with secret length: ${secret.length}`);

        const isValid = authenticator.check(code, secret);
        console.log(`[2FA] Verification result: ${isValid}`);

        return isValid;
    } catch (error) {
        console.error("[2FA] Verification error:", error);
        return false;
    }
}

export function generateTwoFactorSecret() {
    return authenticator.generateSecret();
}

export function generateTwoFactorUri(email: string, secret: string) {
    return authenticator.keyuri(email, "Spends App", secret);
}
