# SZS Airship Bridge

Local modular monorepo for the React Command HUD, isolated Apps Script
engines, the internal-only Oracle MMD quarantine, shared directives, and
sanitized commercial starter templates.

## Layout

- `apps/command-hud/` — React/TypeScript HUD; local dev server on port 3001
- `engines/master-control/` — authoritative Apps Script workspace
- `engines/mail-command-center/` — isolated MCC workspace
- `quarantine/oracle-mmd/` — internal-only Oracle code; never included in HUD
  or client deliverables
- `vault/00_SZS_MASTER_TEMPLATES/` — sanitized commercial starter templates
- `docs/` — shared agent directive, brand tokens, schema contract, and release
  boundary

Open [szs-bridge.code-workspace](./szs-bridge.code-workspace) to load all
workspaces in VS Code.

## Setup

**Prerequisite:** Node.js with npm.

1. Install workspace dependencies from the repository root: `npm install`.
2. Copy `apps/command-hud/.env.example` to
   `apps/command-hud/.env.local` and configure local values.
3. Run `npm run dev` from the root; the HUD listens at
   `http://localhost:3001`.

Vite `VITE_*` values are browser-visible. Do not put privileged credentials
there. Keep actual `.clasp.json` files and Apps Script IDs out of version
control.

## Validation

Run `npm run lint` and `npm run build` from the root. Package the HUD only
from `apps/command-hud/`; see [release boundaries](./docs/RELEASE_BOUNDARIES.md).

## Integration status

The Apps Script database generator is at
`engines/master-control/src/SZS_Database_Generator.gs`; it creates a blank
schema and does not seed example clients. The deployed Master Control router
is still not present. The Oracle and Mail Command Center source repositories
have been copied into their designated quarantine and engine folders; local
`.env` and `.clasp.json` files were intentionally excluded. Verify the
authorized Apps Script project ID and source configuration before pushing.
