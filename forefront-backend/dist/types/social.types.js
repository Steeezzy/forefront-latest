/**
 * Social Channel Integration type definitions.
 *
 * Covers WhatsApp Cloud API, Instagram DMs, and Messenger.
 */
// ─── Social API Error ────────────────────────────────────────────────
export class SocialApiError extends Error {
    code;
    type;
    statusCode;
    constructor(message, code, type, statusCode = 400) {
        super(message);
        this.name = 'SocialApiError';
        this.code = code;
        this.type = type;
        this.statusCode = statusCode;
    }
}
//# sourceMappingURL=social.types.js.map