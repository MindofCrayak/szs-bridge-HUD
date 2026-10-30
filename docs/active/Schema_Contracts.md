# Schema Contracts

Master Control is the single source of truth for client and project records.
The Command HUD maps the live endpoint response into its typed UI model; UI
state and drafts are not authoritative records.

## Client identity

| Meaning | Master Control field | HUD field | Notes |
| --- | --- | --- | --- |
| Stable client key | `ClientID` | `id` | Use this key for selection and mutations. Never derive it from a name. |
| External system key | `external_id` | No current HUD field | Preserve the source value when integrating an external system; do not alias it to `ClientID` without an explicit contract. |
| Display company | `Company_Name` / `CompanyName` | `companyName` | Live response field spellings are normalized case-insensitively and without underscores. |
| Person name | `First_Name` + `Last_Name` | `name` | Used only as a display fallback. |
| Primary contact | `PrimaryContact` | `primaryContact` | Optional; never substitute an unrelated record. |
| Lead source | `Lead_Source` / `LeadSource` | `leadSource` | Optional display fallback when no primary contact exists. |

## Pipeline and finance

| Meaning | Master Control field | HUD field |
| --- | --- | --- |
| Pipeline stage | `PipelineStage` (legacy: `Current_Stage`, `Stage`) | `pipelineStage` |
| Contract amount | `ContractValue` | `contractValue` |
| Deposit state | `DepositPaid` | `depositPaid` |

Stage identifiers are canonical strings `00`–`09` as defined in
`apps/command-hud/src/data/pipeline.ts`. The HUD may optimistically render a
requested change, but only a successful Master Control response confirms
persistence.

### Stage 04+ authorization gate

The local `updateKanban` handler blocks transitions to stage `04` or later
unless a matching row in `Finances` has `DepositPaid` true, the `Clients` row
has a non-empty `MSA_DocID`, and a matching `Projects` row has a non-empty
`SOW_DocID`. An exception requires explicit
`overrideAuth: true`, a non-empty reason, server-side authorization, and a
successfully persisted audit record before the mutation. A request field
supplied by the browser is not itself authorization. The helper currently in
`engines/master-control/src/Pipeline_Phase_Gate.gs` is wired into the local
router and covered by handler tests. The deployed endpoint remains unverified;
OAuth/API setup is incomplete, so the HUD does not currently send the request.
See `docs/Master_Control_Governance.md`.

## Workspace and compliance

`DriveFolderUrl`, `NotesDocUrl`, and `ChatSpaceUrl` are client fields.
`MSA_DocID` is stored on the client; `SOW_DocID` and
`MeetingNotes_DriveFolderID` are project fields. Do not infer `RootFolderID`
or `ProjectFolderID` from a URL unless an explicit mapping is approved.
Oracle case files and raw findings are quarantined and must not be copied into
client Drive folders or HUD payloads.

## Alerts and telemetry

The HUD accepts the live Master Control field spellings, including
`Alert_ID`, `Timestamp`, `ClientID`, `Priority`, `Category`, `Message`,
`Action_URL`, and `Dismissed_Status`. Telemetry fields include `pipeline_mrr`,
`active_sprints`, `missing_deposits`, `active_alerts_count`, and `last_synced`.
Validate additions against the deployed response before treating them as
stable API contract.
