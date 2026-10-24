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
  accessing user. The existing deployed project has not been updated or
  verified; this local manifest does not change a live deployment.
- `reference/` contains tagged legacy and migration sources for review only.
  `.claspignore` excludes it, along with tests, from uploads. Do not run the
  migration source: it rewrites schemas, including Oracle.

No deployment, trigger installation, live spreadsheet mutation, or Drive
provisioning has been performed. Configure only approved identifiers and
allowlists in Script Properties. Rotate credentials exposed in the tagged
source before production use.

## Tests

Run from the repository root:

```powershell
node --test engines/master-control/test/pipeline-phase-gate.test.mjs engines/master-control/test/master-control-router.test.mjs
```

These tests use local mocks. They do not verify Apps Script deployment,
Workspace OAuth, live schemas, or production permissions.
