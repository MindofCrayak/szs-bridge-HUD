# Session Zero Solutions Command HUD

React/TypeScript client HUD backed by a Google Apps Script web app. Configure the Apps Script endpoint and Alfred Gemini key locally before running.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure these variables in a local `.env` file:
   - `VITE_GEMINI_API_KEY` for Alfred's Gemini connection
   - `VITE_APPS_SCRIPT_URL` for the Apps Script Web App URL
   - `VITE_API_SECRET_KEY` for the HUD-state request token

   Vite-prefixed values are included in browser code. Do not use privileged secrets as `VITE_*` values; use a server-side proxy for privileged credentials.
3. Run the app:
   `npm run dev`

## Validation

- `npm run lint`
- `npm run build`
