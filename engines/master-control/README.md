# Master Control

Authoritative Apps Script workspace for Master Control client, project, and
finance records.

## Local source and safety boundary

- `src/Central_Router.gs` is the locally imported canonical router.
- `src/Master_Control_Auth.gs` requires an authenticated Workspace user listed
  in the `AUTHORIZED_USER_EMAILS` Script Property. Stage-gate exceptions and
  the police audit use separate `PIPELINE_OVERRIDE_EMAILS` and
  `POLICE_AUDIT_EMAILS` allowlists.
- `src/Pipeline_Phase_Gate.gs` is wired into `updateKanban`. Stage 04 and later
  require a paid deposit in `Finances`, a recorded MSA in `Clients`, and a
  recorded SOW in `Projects`. An authorized exception is audited before the
  stage field is updated.
- Internal service functions end in `_` so they are not API-executable
  entrypoints. The legacy lead-graduation and payment actions remain disabled.
- The manifest is restricted to authenticated domain users and executes as the
  accessing user. The verified version 25 deployment targets the
  owner-confirmed disposable copy, not a production deployment. This local
  manifest does not change a live deployment.
- `reference/` contains tagged legacy and migration sources for review only.
  `.claspignore` excludes it, along with tests, from uploads. Do not run the
  migration source: it rewrites schemas, including Oracle.

Version 25 of the configured disposable Apps Script project contains the
scoped service-attachment handler fix, prioritizes the configured
`MASTER_CONTROL_SHEET_ID`, and enables the Tasks advanced service with its
required OAuth scope. That Script Property is verified to point to the
owner-confirmed disposable copy. The approved
`Projects.ActiveComponents` header was added and saved. One authorized MCC
attachment attempt against version 22 was rejected before any sheet write or
Google Tasks insert because the handler could not find one or more required
headers. A fresh authenticated read against version 23 showed C-107 at `$0`
with no active modules; attachment verification remains pending. A second
attempt was rejected before writes because version 23 did not enable the Apps
Script Tasks advanced service. Version 25 has since been pulled back and
verified to include the service and OAuth scope. The HUD now requests that
scope; the signed-in user must re-consent before the authorized retry. No
service attachment, contract update, or task insert has been confirmed.
Configure only approved identifiers and allowlists in Script Properties.
Rotate credentials exposed in the tagged source before production use.

## Tests

Run from the repository root:

```powershell
node --test engines/master-control/test/pipeline-phase-gate.test.mjs engines/master-control/test/master-control-router.test.mjs
```

These tests use local mocks. They do not verify Apps Script deployment,
Workspace OAuth, live schemas, or production permissions.
