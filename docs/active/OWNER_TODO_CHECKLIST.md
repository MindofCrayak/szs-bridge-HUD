# Owner To-Do Checklist: meeting the bot in the middle

**Status:** active. **Place at:** `docs/active/OWNER_TODO_CHECKLIST.md` (the bot reads Part B).
**Legend:** `[ ]` to do, `[x]` done. **Test:** how to prove it worked. Always do Apps Script work on a **copy** of Master Control first.

**Division of labor**

| You (and Apps Script) | The coder bot |
|---|---|
| Everything inside Google: Master Control, COMS, persona sheet, registry, secrets | Everything inside the repo: HUD code, tests, docs |
| Decisions in Part B | Uses your answer, or the stated default |
| Approves schema changes | Never edits `engines/master-control/` |

---

## Part A. Before the bot starts (about 15 minutes)

- [x] **A1.** Put these in the repo under the paths shown:
  - `docs/`: `SZS_DB_LOGIC_AND_PERSONA_CHARTER.md`, `SZS_SCHEMA_CONTROL_SPEC.md`, `alfred-grounding-document-v7.md`, `copilot-instructions-v7.md`, `HUD_HANDOFF_SUMMARY.md`
  - `docs/active/`: `ANTIGRAVITY_PHASE2_IMPLEMENTATION_PLAN.md`, `ANTIGRAVITY_PHASE3_IMPLEMENTATION_PLAN.md`, `OWNER_TODO_CHECKLIST.md`
- [x] **A2.** Put `szs-master-template-link-registry.md` in **`docs/private/`**, not plain `docs/`. It lists Script IDs and deployment URLs, which must stay out of version control.
- [ ] **A3.** Add to `.gitignore`: `docs/private/` and `.env*.local`.
- [x ] **A4.** Remove the bearer-token line from section 8 of the registry **before** anything is committed (see Part E).
- [x ] **A5.** Tell the bot: *"Read docs/active/ANTIGRAVITY_PHASE3_IMPLEMENTATION_PLAN.md and follow it. Start with Block 0."*

**Test:** from the repo root run `git status` and `git check-ignore -v docs/private/szs-master-template-link-registry.md`. Expect: the registry is **not** listed as untracked, and `check-ignore` prints the matching `.gitignore` rule.

---

## Part B. Decisions (fill in; blank means the default is used)

Mark your answer by editing the **Your answer** column (`Y`, `N`, or text).

| ID | Decision | Default if blank | My recommendation | Your answer |
|---|---|---|---|---|
| D1 | Approve any `suggested` event rules? | None approved | Keep none until you've watched them propose for a week | None approved |
| D2 | Build a component "uninstall" that reverses the ledger (through the Financial Mutation gate)? | No | No, until a real need appears |Not until need appears |
| D3 | `pull` chevrons hollow, or truly reversed? | Hollow | Hollow | Hollow |
| D4 | Which existing filter/view control hosts the collapsed "Wires ▸" group? | Bot names the existing filter control and uses it | Fine | MultiAgentDispatch Wires tab; AlfredDock remains dormant |
| D5 | Is a minimal link undo stack acceptable until the command system exists? | Yes (only if none exists) | Yes | Yes; minimal rollback model |
| D6 | New always-visible element: department notification ribbon in the existing top bar | **Approved** (you asked for it). `N` = build the data layer only | Y | |
| D7 | Severity scale `INFO / WARN / BLOCK`; COMS `MEDIUM / HIGH / CRITICAL` map to them | Accept | Y | |
| D8 | Hub IDs win; COMS adds `Master_Client_ID` / `Master_Project_ID` mapping first | Yes | Y | |
| D9 | Add `Projects.ParentProjectID` and `AddendumRef` (SCH-0007) | **Not added**; connectors stay local-only visuals | Y, before the first multi-project client | |
| D10 | Add `Finances.ProjectID` (SCH-0008) | Not added | Y, before the first multi-project client is billed | |
| D11 | Three data tiers: raw, internal summary, client-safe | Adopt | Y | |
| D12 | Daisy is the single outbound voice to clients (all client-facing proposals route through her) | Adopt | Y | |
| D13 | Add `zod` dependency | Yes | Y | |
| D14 | Dial scales: Compliance, Wit, Proactivity, Drift 0 to 1; Candor -1 to 1 | Adopt | Y | |
| D15 | Which Master Control deployment is live: Web App `/exec` (the registry) or API Executable (v7)? | Bot stays on mock data | Confirm after Part C | |
| D16 | HUD autonomy cap = proposal-only for every persona | Yes | Y | |
| D17 | Which SprintStage triggers the **final** invoice: 07, 08, or other? | Left unspecified; Vala shows "final invoice stage not set" | Tell me | |
| D18 | Typed-join rule for the `ICA-02` ClientID/ProjectID ambiguity | Adopt | Y | |
| D19 | Where does the client journey and feedback log live (SCH-0010)? | Flagged only | A `Client_Journey` tab in Master Control owned by Daisy (it joins to Clients/Projects; MCC keeps the sends) | |

- [ ] **B1.** Fill the table (even a partial fill is fine).

**Test:** the bot's per-block report lists "Defaults I used", and every blank above should appear there, nothing else.

---

## Part C. Apps Script work in Master Control (on a COPY first)

You'll add **one new file**, `Schema_Control.gs`. It is additive: it never edits, reorders, or deletes existing tabs, columns, or rows. It has been syntax-checked and run against a mock spreadsheet, but **not** in real Apps Script, so treat step C4 onward as the first live test.

- [x ] **C1. Back up.** In Google Sheets: File, Make a copy of SZS Master Control. Do all of Part C on the copy until C9 passes.
- [x ] **C2. Add the file.** Open the copy's Apps Script project. Add a new script file named `Schema_Control`. Paste in `Schema_Control.gs` (provided separately). Save.
- [x ] **C3. Only if** the script is **not** bound to the sheet: Project Settings, Script Properties, add `MASTER_CONTROL_SHEET_ID` with the copy's ID. (Keep the ID out of the code.)
- [ x] **C4. Create the tabs.** Run `setupSchemaTabs` and approve the permissions prompt.
  - **Test:** tabs `Schema_Registry` and `Schema_Change_Log` exist with header rows. Run it **again**: nothing is duplicated or changed. Status, Severity, and Change_Type cells have dropdowns.
- [x ] **C5. Baseline the live schema.** Run `snapshotLiveSchemaToRegistry`.
  - **Test:** the registry has one row per non-empty header on `Clients`, `Projects`, `Finances`, `Services_Rates`, `Alfred_Alerts`. Spot-check that **`Clients` column `H` is `AccountPhase`** and **`Projects` column `D` is `SprintStage`**. Run it again: it adds 0 rows.
- [x ] **C6. Complete the registry** (this is Dolores's checklist job, done by you for now). For each row fill `Data_Type`, `Owner_Persona`, `Data_Class` (`public` / `internal` / `pii` / `secret`). For enums fill `Allowed_Values`: the 6 AccountPhase values and the 10 SprintStage values (from the Charter, section 4). Set `Schema_Version` to `1.0` when you're satisfied.
  - **Test:** no blank `Data_Class` on any row; AccountPhase and SprintStage rows list all values.
- [x ] **C7. Seed the known gaps.** Run `seedSchemaChangeLog`.
  - **Test:** 14 rows, `SCH-0001` to `SCH-0014`, all `Noted`. Run again: 0 added.
- [ x] **C8. Run the conformance check.** Run `runSchemaConformanceCheck`.
  - **Test 1 (clean):** the Logger says 0 new findings.
  - **Test 2 (drift):** on the **copy**, add a header `Test_Col` to the right of `Clients`, and `Sneaky` to `Finances`. Run the check. Expect exactly **2** new rows, source `police.schema`, status `Noted`: `Clients` as **WARN**, `Finances` as **BLOCK**. Run again: **no duplicates**. Delete the two test headers.
- [x ] **C9. Hook into Police (one line).** Open `Police_Engine.gs`, find `runSystemPoliceAudit`. Add near the end:
  ```javascript
  try { runSchemaConformanceCheck_({ alreadyLocked: true }); }
  catch (e) { Logger.log('Schema check failed: ' + e); }
  ```
  Use `alreadyLocked: true` **only if** that function already holds the script lock; otherwise use `false`.
  - **Test:** run `runSystemPoliceAudit` manually; Executions shows success; the Logger shows "Conformance check done". After the next 15-minute trigger, all executions are green and no duplicate findings appear.
- [x ] **C10. Alerts shape.** Run `reportAlertsHeaderGap`; it lists missing target columns. Add them to the **right** of the existing columns in `Alfred_Alerts` (never reorder or rename existing ones).
  - **Test:** run it again: the missing list is empty. Existing alert rows are untouched. Update the registry rows for the new columns.
- [x ] **C11. Police transparency review.** Open `Police_Engine.gs` and check: does it **log old value, new value, rule, and time before overwriting**? If not, paste the file (with IDs removed) back to me and I'll write a patch.
  - **Test:** after a deliberate conflict on the copy, the log shows a before/after entry.
- [ ] **C12. Promote to live.** When C4 to C11 pass on the copy, repeat C2 to C10 on the real Master Control.
- [ ] **C13. Schema changes needing approval** (only after D9, D10, D19). For each: set the `Schema_Change_Log` row to `Approved` and sign it, add the column on the copy, then on live; set `Applied`; update the registry; run the conformance check; set `Verified`.
  - **Test:** the check returns 0 new findings after the change; the HUD shows no version mismatch.

---

## Part D. Sheet and document edits

### D-1. Personality Controls sheet
- [x ] Replace Daisy's Role, House Function, Relay_Pipeline, Primary_Payload with Charter section 7.4.
- [x ] In Alfred's Operational Rules, replace "90/10 ratio" with a line about the tunable `Wit_Allocation`.
- [? ] Add a README tab documenting dial scales (Charter 7.1).
- **Test:** the bot's `personas.config` values for any three personas match the sheet.

### D-2. v7 documents
- [ ?] In `alfred-grounding-document-v7.md` and `copilot-instructions-v7.md`: replace the "90/10" text (section 2) with Charter 7.5; update the Daisy roster entry (section 6 / 8) with Charter 7.4.
- **Test:** search both files for `90/10`: zero hits.

### D-3. COMS (Oracle)
- [x ] Add `Master_Client_ID` and `Master_Project_ID` columns to `01_Client_Baseline` and fill them (SCH-0001/0002).
- [x ] Make tabs 11 to 13 use the same client ID style as tabs 00 to 10 (SCH-0003).
- [x ] Fix or remove the references to AST-005, 008, 009, 012, 014 in tab 13 (SCH-0004).
- [ x] Make tab 12's `Linked_Module_09_Action` codes point at real `MCC-DRIP-###` / `ALN-###` rows (SCH-0005).
- [ x] Add a `Data_Tier` value (raw / internal / client-safe) to each report output.
- **Test (dangling refs):** in tab 13 add a helper column, `=IF(COUNTIF('05_Master_Asset_Pipeline'!A:A, C2)=0, "MISSING", "ok")` (adjust the tab name to the real one). Expect **no** `MISSING`. Repeat for tab 12's action codes against tab 09 and tab 08. Delete the helpers afterward.
- **Test (ID style):** a filter on `Client_ID` across tabs 00 to 13 returns one ID style per client.

### D-4. Link registry
- [x ] Already includes the two new sheets (done in the provided copy).
- [ ] Remove the bearer token line (Part E).
- [ ] Confirm the **Router row**: is the live deployment a Web App `/exec` or an API Executable? (D15)
- **Test:** open the registry; no line contains "Bearer" or the token name.

---

## Part E. Security (do first if any item is true)

- [ ] **E1.** The registry's section 8 has a static bearer token in plain text. Delete that line, and **rotate** the token if anything still accepts it. Find anything that references it.
- [ ] **E2.** Confirm the registry was never committed: `git log --all --oneline -- "*link-registry*"` should print nothing. If it does, tell me; history cleanup is your call.
- [ ] **E3.** `git check-ignore -v .env.local` prints a rule.
- [ ] **E4.** `grep -rn "VITE_API_SECRET_KEY" apps/ engines/` returns nothing (v7 says it's purged).
- [ ] **E5.** Alfred's key lives in repo-root `.env.local` as `GEMINI_API_KEY` (no `VITE_` prefix). Restart the dev server after changing it.

---

## Part F. Inputs for the bot (optional but unlock Block 8)

All under `docs/private/inputs/` (gitignored). Sanitize first: no client names, no contact data.

- [ ] **F1.** `Services_Rates.csv`: service ID, name, rate (export from Master Control). **Unlocks:** price drift check.
- [ ] **F2.** `task_repositories.txt`: the repository **names only**, one per line (from registry section 4, no links). **Unlocks:** task-set drift check.

If skipped, the bot lists Block 8 under "Needs owner" and moves on.

---

## Part G. End-to-end test script

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | You | Part A | Registry untracked and ignored |
| 2 | Bot | Block 0 | Closeout report; Phase 2 doc in `docs/archive/` (or `closing` with a Needs owner list) |
| 3 | You | Part C on the copy | C4 to C10 tests pass |
| 4 | Bot | Blocks 1 to 9 | Each report: lint and build pass; tests pass; no secrets scan hits |
| 5 | You | Run the HUD in mock mode (`npm run dev`, port 3001) | Status shows `mock`; ribbon shows per-department counts |
| 6 | You | Click each department badge | Opens that department's menu with its log and proposals |
| 7 | You | Type `Staff Meeting` in Alfred Core | Six briefs in order, closing with 1 to 3 decision gates; no emails, phones, or IDs appear |
| 8 | You | Fire the dev event `stage.changed` | A proposal appears in the tray; **nothing** is sent, created, or written |
| 9 | You | Fire the dev event `police.corrected` | A node badge and an alert; **no wire animates** |
| 10 | You | Fire `police.schema` | Housekeeping badge increments |
| 11 | You | In Housekeeping, use "Draft schema change request" | Copyable block; field names equal `Schema_Change_Log` columns; nothing is written |
| 12 | You | Paste the draft into `Schema_Change_Log` on the copy; run the check | Logged as `Requested`; no new Police finding |
| 13 | You | Check at 762x1366 and 1680x1050 | Ribbon and menus fit; no overflow; bays still visible |
| 14 | You | Fire the `addendum.signed` dev event on a client | One proposal offering **both** expand and spawn |
| 15 | You (when OAuth live, D15) | Switch to live adapter on the copy | Status `live`; 3 values match the sheet |

**Done when:** every row in Part G passes and all `[ ]` in Parts A, C, E are `[x]`.
