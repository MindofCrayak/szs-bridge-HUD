# Master Control

Authoritative Apps Script engine for client and project records. The HUD must
consume Master Control as its source of truth and must not substitute local
sample data for unavailable service records.

The repository currently includes the blank-schema database generator
previously kept at the root. It deliberately does not seed sample clients.
The deployed Central Router is not present in this workspace; do not treat
this folder as a complete or deployable router until the authorized Apps
Script project has been cloned and its handlers verified.

Initialize clasp in this directory only after confirming the correct Google
Apps Script project ID. Keep the real `.clasp.json` local or otherwise
restricted, and never commit its ID or credentials.
