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

## Workspace and compliance

`DriveFolderUrl`, `NotesDocUrl`, `ChatSpaceUrl`, `RootFolderID`, `MSA_DocID`,
`ProjectFolderID`, `SOW_DocID`, and `MeetingNotes_DriveFolderID` map to their
same-named camel-cased or ID fields in the HUD client model. Missing values
must remain visibly missing; they must not be synthesized.

## Alerts and telemetry

The HUD accepts the live Master Control field spellings, including
`Alert_ID`, `Timestamp`, `ClientID`, `Priority`, `Category`, `Message`,
`Action_URL`, and `Dismissed_Status`. Telemetry fields include `pipeline_mrr`,
`active_sprints`, `missing_deposits`, `active_alerts_count`, and `last_synced`.
Validate additions against the deployed response before treating them as
stable API contract.
