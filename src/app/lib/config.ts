// Single source of truth for API and contact configuration.
// In dev we go through the Vite proxy (`/api` -> http://127.0.0.1:8000), so the
// browser origin stays http://localhost:5173 and CORS is never involved.
// In a production build, set VITE_API_BASE to the deployed API origin.
export const API_BASE = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/api");

// WhatsApp contact. Override with VITE_WHATSAPP_NUMBER (digits only, e.g. 994501112233).
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "994000000000";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

// Turns a DRF error body into a human-readable message:
// prefers `detail`, then the first field error array, then the raw text.
export function extractApiErrorMessage(bodyText: string, status: number): string {
  let message = bodyText || `API error: ${status}`;
  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;
    if (typeof parsed.detail === "string") {
      message = parsed.detail;
    } else {
      const firstKey = Object.keys(parsed)[0];
      const firstVal = parsed[firstKey];
      if (Array.isArray(firstVal) && typeof firstVal[0] === "string") {
        message = firstVal[0];
      }
    }
  } catch {
    // not JSON — keep the plain text
  }
  return message;
}
