# SZS Command HUD: Agent Handoff Summary

Read this first. It covers what the project is, how it is laid out, what has been decided, what is built, what is broken, and the rules to follow. Wireframes in section 6 are **conceptual**, drawn from the owner's descriptions and project docs, not from source code. Verify against the real components before relying on any detail.

**Provenance and trust:** statements marked *(reported)* come from another agent's self-report and have not been independently verified. Do not treat them as done without checking.

---

## 1. What the project is

The Command HUD is a CRM interface built to feel like a **spatial RTS operating system**, not a dashboard. Clients are "spatial units" on an infinite 2D canvas. Selecting a client isolates their Drive folders, meeting notes, and project constraints, and anchors the AI sub-agents to that client's context.

Company: Session Zero Solutions (SZS). Repo: `MindofCrayak/szs-bridge-HUD`.

### Navigation model: hierarchical semantic zoom

| Tier | View | What it is |
|------|------|------------|
| Top | **Universe View** | Multi-account portal, cross-client analytics, global settings. **Deferred**; needs multi-account data and a backend shape not yet defined. |
| 1 | **Galaxy View** | Infinite canvas (`TacticalCanvas.tsx`). Macro `AccountPhase` columns (Intake, Session Zero, Active Sprints, Liftoff) act as territories. Client cards float and change phase when dragged across boundaries. |
| 2 | **Solar System View** | Per-client workbench (`ProjectWorkbenchView.tsx`). Opened by double-clicking a client or `Ctrl+[1-9]` / `Alt+[1-9]`. Camera locks to `(0,0)`. The **Sun** (core deliverable, with SprintStage track and Iron Gate vitals) sits at the center. Departmental nodes and service-component satellites orbit it, joined by SVG tracer lines. |
| 3 | **Planet View** | Planned. A normal DOM screen (Kanban, Gantt, master task list) opened by double-clicking a project or service node. Not rendered inside spatial nodes, because heavy Gantt work would lag the canvas. Should have a real route (e.g. `/client/:id/project/:nodeId`) and lazy-loaded bundles. |

### The agents

| Agent | Domain |
|-------|--------|
| **Alfred** | Client-audit assistant (Gemini). Answers about the selected client, milestones, roadblocks, gate status. May **propose** actions; never performs them. |
| **Pamela** | Legal and Drive Vault |
| **Oracle** | Intel and OSINT (**quarantined**; see section 8) |
| **Dolores** | Tasks and 45-day Gantt |
| **Vala** | Commerce and Fiscal (ledger, invoices) |
| **Daisy** | MCC (Mail Command Center) and broadcasts |

---

## 2. Tech stack and repo layout

- **Frontend:** React + TypeScript + Vite + Tailwind, `apps/command-hud/`, dev server on port 3001. A store (Zustand-style) holds camera and node positions.
- **Backend:** Google Apps Script "Master Control" (`engines/master-control/`, `Master_Control_Bridge.gs`), authoritative source of truth. Sheets: `Clients`, `Projects`, `Finances`, `Alfred_Alerts`. Live reads and writes are **disabled until OAuth is configured** (the old `VITE_*` shared-secret transport was removed).
- **Other folders:** `engines/mail-command-center/` (isolated MCC), `quarantine/oracle-mmd/` (internal-only), `vault/00_SZS_MASTER_TEMPLATES/` (sanitized templates), `docs/` (directives, brand tokens, schema contract, release boundary).
- **Commands (repo root):** `npm install`, `npm run dev`, `npm run lint`, `npm run build`.
- **Tailwind version is unverified.** Check `package.json` before changing `translate` or `transform` classes; v4 uses the CSS `translate` property, so computed `transform: none` can be normal.

### Hardware profiles (currently hardcoded)

- **Display 1, Tactical Horizon:** 1680x1050 landscape. Infinite canvas, 4-column Kanban pipeline, floating 4-bay bottom chassis.
- **Display 2, Avionics Tower:** 762x1366 portrait. Telemetry, Q-C Macro Pad dispatchers, avatar trackers, Hologram Comms Chute. Runs at `/cockpit` as a pop-out with no desktop headers.
- Menus and layouts must work at both. A third size (1104x793) was observed during debugging.

---

## 3. Modules A to F (from `STATUS.md`)

| Module | Function |
|--------|----------|
| **A** | Dragging a service node from the Multi-Agent Dispatch drawer auto-switches to the client's Solar view without aborting the HTML5 drag. Payload includes `serviceId`, `price`, `tasksToInject`. |
| **B** | Orbit snap and drop engine: `angle = atan2(y,x)`, `r = clamp(220, 480, sqrt(x²+y²))`. Blocks duplicate modules; optimistic vitals update. |
| **C** | `syncServiceToMasterControl` in `api.ts` to `attachClientServiceNode` in `Central_Router.gs`. Gated by `ENABLE_COMPONENT_PERSISTENCE` and the **financial confirmation dialog**. Appends service ID, updates Contract Value / Inception Deposit, injects Google Tasks. |
| **D** | `ConnectionPort.tsx` pins (top, bottom, left, right) on all containers; cubic Bezier SVG tracers with animated "Imperial Gold" dots. |
| **E** | `ResizableNodeContainer.tsx`: zoom-compensated drag, corner resize, right-click and Alt+Right-Click lock/freeze. Also in `SlimVitalsCard.tsx` on the Galaxy canvas. |
| **F** | `SolarMapSelector.tsx` header dropdown; `useRTSHotkeys` in `useKeybindings.ts` for `Ctrl+[1-9]` / `Alt+[1-9]`. |

Roadmap milestones (all but 0 queued per `STATUS.md`): 0 Stabilize and protect (in progress), 1 Data contract and backend hardening, 2 ECS store and command system, 3 Interaction layer, 4 Dual display and performance, 5 Agent framework, 6 Production readiness.

---

## 4. Phase 2 work: what was requested and decided

Source plan: [`docs/active/ANTIGRAVITY_PHASE2_IMPLEMENTATION_PLAN.md`](./active/ANTIGRAVITY_PHASE2_IMPLEMENTATION_PLAN.md). Phase 2 remains active and is not closed; see its status snapshot and remaining acceptance work before proceeding to Phase 3.

### 4.1 Owner decisions (settled)

1. **Arrowhead = where the data goes.** Always at the receiving end.
2. **Wire color = source department (where it comes from).** Line style and midpoint glyph = function (what it does). Red is error only. Gold is the Sun and unassigned (matches existing Imperial Gold tracers).
3. **Event rules are suggestions** until approved. Natural logic is welcome, but nothing goes live without confirmation.
4. **Extend, don't replace.** Existing right-click items (Lock/Unlock, Alt+Right-Click) and existing filter/view options stay. New items are added.
5. **Everything nests, collapses, and hides when unused.** About 8 top-level menu items max, rest in submenus. One collapsed "Wires ▸" group inside the existing filter control. No new always-visible toolbars or panels. New UI surfaces need approval.
6. **Merge, don't duplicate.** The new ESC catalogue's behavior (spawns nodes already connected to the project) should live in the original Multi-Agent Dispatch drawer and ECS Node tabs, with one shared catalog config. Then remove the duplicate.
7. **Departments start pre-wired** (with colors and animation), as they were before.
8. Wires appear in **Solar view only**.

The owner-specific decisions in rows D1-D5 are recorded in `docs/active/OWNER_TODO_CHECKLIST.md`: no event rules approved; no uninstall flow until needed; hollow pull chevrons; wire controls in the Multi-Agent Dispatch Wires tab (AlfredDock dormant); minimal undo model accepted. These are resolved, not open questions.

### 4.2 Wire visual language

| Channel | Encodes |
|---------|---------|
| Hue | Source department: Pamela violet, Oracle cyan, Dolores amber, Vala green, Daisy pink, core/Sun gold |
| Line style | Kind: `context` thin solid, `dependency` thick solid (lock glyph when blocked), `trigger` dashed |
| Midpoint glyph | dot (context), lock (dependency), diamond (proposes an action), coin/shield (can end in a ledger or invoice proposal, passes the Financial Mutation gate) |
| Motion | `push` solid chevrons toward the receiver, `pull` hollow chevrons toward the receiver, `sync` both directions. Animate only while an event flows. |

Other rules: respect `prefers-reduced-motion`; cap concurrent animations (about 20); level-of-detail by zoom; dim non-selected wires and animations when a node is selected. "Reverse direction" swaps link ends; it is not a mode.

### 4.3 Draft default wires (editable, deletable, never re-seeded after deletion)

Pamela to Sun (legal and vault status, push); Oracle to Sun (intel summary, push); Dolores and Sun (tasks and Gantt, sync); Vala and Sun (ledger, sync, coin glyph); Sun to Daisy (broadcast feed, push).

### 4.4 Draft event rules (all `suggested`; only `approved` rules fire)

| Event | Wire kind | Effect |
|-------|-----------|--------|
| Pamela `msa.signed` | dependency | Unblocks Vala invoice drafting |
| Pamela `msa.signed` | trigger | Dolores proposes kickoff tasks |
| Component `installed` | trigger | Dolores proposes `tasksToInject`; Vala proposes ledger increment (money gate) |
| Oracle `sweep.complete` | context | Findings **summary only** added to Alfred context |
| Dolores `milestone.done` | trigger | Vala proposes next invoice (money gate); Daisy proposes nurture step |
| Vala `invoice.paid` | trigger | Daisy proposes thank-you; Dolores proposes unlocking next phase |
| Dolores `task.overdue` | trigger | Daisy proposes client check-in |

**Handlers only propose.** They create pending items in the pending-changes tray / Alfred approval list. They never send, create tasks, draft or send invoices, or write the ledger. Money proposals go through the existing Financial Mutation confirmation unchanged. Loop guard: max depth 3, one fire per link per tick.

### 4.5 Context menu decisions

- Node menu: keep Lock/Unlock; add Edit ▸, Arrange ▸, Focus, Connect ▸, Disconnect ▸, Dispatch agent ▸, Open links ▸, Delete.
- **Deleting a service-component node only removes it from the canvas** and shows: "Removed from canvas. Ledger and Google Tasks were not changed." No uninstall or ledger reversal is built unless the owner approves it through the Financial Mutation flow.
- Sun menu: **Delete is shown disabled** with the reason "The core deliverable cannot be deleted."
- Canvas menu: Add node ▸ (shared catalog), Paste, Select all, View ▸, Arrange ▸, Undo, Redo.
- Multi-select: Align ▸, Distribute ▸, Lock/Unlock, Duplicate, Delete selected (one confirm).
- Shortcuts: `Delete`/`Backspace`, `Ctrl+D`, `Ctrl+A`, `L`, `F`, `Esc`, `Ctrl+Z`, `Ctrl+Shift+Z`. Ignore them when an input, textarea, or the Alfred field has focus. Do not break `Ctrl+[1-9]` / `Alt+[1-9]`.
- Menus render through a portal, flip to stay in the viewport, support arrow-key navigation, `role="menu"` / `role="menuitem"`, and tooltips for disabled reasons.

---

## 5. Current state

### Current implementation and verification snapshot (2026-10-30)

Phase 2 is **in progress, not closed**. The following implementation and local-browser checks were recorded during the current work:

- The bottom chassis is visible in Galaxy and Solar at 762x1366 and 1680x1050; Alfred input survived switching away and back.
- The shared ECS catalogue, proposal/event modules, and review-only Pending Proposals group are present. The drawer displays proposals as pending human review; no approval or execution action was added. Production rules remain `suggested`.
- Local Solar wires have versioned per-client persistence, five default wires, port-drag creation, target validation feedback, undo, context-menu "Add node here and connect", and export/import implementation. Browser checks exercised default seeding, creating a sixth wire, undo, reload persistence, then deleting the manual wire to restore the five defaults.
- Wire selection animation, reduced-motion suppression, and dimming of unrelated wires on node selection were exercised in the browser.
- A development-only event fixture produced a draft invoice proposal in the drawer; local dismissal worked. This did not test a real business event or trigger financial behavior.
- The Priority Feed cards are integrated into the existing Multi-Agent Dispatch drawer with no obsolete nested `max-h-48 overflow-y-auto` window. The three current alerts were visible and the old nested-scroll selector matched zero elements.
- The app-local `apps/command-hud/.env.local` is ignored and Vite now loads it before the repo-root env file. The proxy status endpoint reported configured; only malformed-request validation was exercised, not a valid Gemini/provider request.
- `npm run lint` and `npm run build` passed after the event/proposal and wire-animation work. The most recent target pin feedback changes were followed by interrupted lint/build invocations, so the latest source still needs both checks.

Browser checks used the local HUD. They do not establish production provider success or persistence beyond the tested local browser. Do not inspect or print `.env.local` or its contents.

### Remaining Phase 2 acceptance work

1. Rerun `npm run lint` and `npm run build` from the repository root to verify the latest target-feedback changes.
2. Complete and verify the planned node, Sun, canvas, wire, and multi-selection context menus, keyboard navigation, shortcuts, and focus exceptions. The current node menu is still limited to Lock/Unlock and Remove; the full planned shortcut/menu set is absent.
3. Finish wire requirements not yet evidenced, including the collapsed filters/legend in the owner-selected existing surface, complete active-flow behavior/fidelity, and any remaining culling/state details. Keep controls in the Multi-Agent Dispatch Wires tab; do not activate AlfredDock.
4. Connect actual domain events to state transitions only where safe; keep rules `suggested` and handlers proposal-only. The money-proposal path is not connected to the existing Financial Mutation confirmation. Do not modify finance ledger logic or that confirmation flow; treat this as blocked unless it can be wired through an existing approved interface.
5. Verify Alfred's valid-key, missing/bad-key, bad-model, offline, and Stop paths without exposing credentials. A configured proxy and malformed-request validation are not proof of provider success.
6. Exercise export/import round-trip and complete the remaining plan acceptance checks for viewport clamping, keyboard behavior, disabled reasons, regression behavior, and financial confirmation preservation.
7. Complete the Phase 2 audit table and closeout report before archiving the plan or starting Phase 3 Block 1.

The broader data-layer items from earlier architecture review (Apps Script scaling/migration, schema validation and error boundaries, audit/idempotency, DnD replacement, layout profiles/cross-window sync, additional math tests, and boot-state cleanup) remain out of Phase 2 scope; track them separately.

**Resolved — Alfred Priority Feed presentation:** The alert cards are grouped within the existing Multi-Agent Dispatch drawer, without the unnecessary inner scroll window. The drawer's existing scroll area still supports longer lists. Verified in the local browser as described above.

---

## 6. Wireframes (conceptual)

Legend: `[ ]` panel, `( )` node, `*` the Sun, `o` pin, `>>>` push chevrons, `<<<` pull/sync, `🔒` blocked.

### 6.1 App shell (all views)

The bottom chassis mounts **once at the shell level**, outside any view, so view switches never unmount it.

```
+----------------------------------------------------------------------------------+
| TOP BAR / SkyHeader:  [Galaxy|Solar view]  [Solar Map ▾]  [DRAG] [LOCK] [EDIT]    |
|                       [Filters ▾ (existing; Wires ▸ nested + collapsed)]          |
+----------------------------------------------------------------------------------+
|                                                                                  |
|                  FULL-BLEED CANVAS (view content, store camera)                   |
|                  grid layer  <  wire layer  <  node layer                        |
|                                                                                  |
|                                                                                  |
+----------------------------------------------------------------------------------+
| BOTTOM CHASSIS (overlay, pointer-events-none; bays are pointer-events-auto)      |
|  [Calendar]      [Alfred Core]       [Dossier]       [Macro Pad]                 |
+----------------------------------------------------------------------------------+
```

### 6.2 Galaxy View (1680x1050)

```
+----------------------------------------------------------------------------------+
| Galaxy | Melsonian Arts Council | ESC                                  top bar    |
+-----------------+-----------------+-------------------+--------------------------+
|  INTAKE         |  SESSION ZERO   |  ACTIVE SPRINTS   |  LIFTOFF                 |
|                 |                 |                   |                          |
|  [client card]  |  [client card]  |  [client card]    |                          |
|  [client card]  |                 |  [client card]    |  [client card]           |
|                 |                 |                   |                          |
|  (drag a card across a column boundary => phase transition; no wires here)       |
+-----------------+-----------------+-------------------+--------------------------+
|  Bays: Calendar | Alfred Core | Dossier | Macro Pad                              |
+----------------------------------------------------------------------------------+
 Pan = background drag. Zoom floor 20%. "Recenter Horizon" resets. Column resize
 handles are top-left.
```

### 6.3 Solar System View (Tier 2)

```
+----------------------------------------------------------------------------------+
|  top bar                                                                         |
|                                                                                  |
|             (Pamela)o                                   o(Oracle)                |
|              violet  \  >>>                        >>>  /  cyan                  |
|                       \                          /                               |
|                        o                        o                                |
|                          +------------------+                                    |
|     (Dolores)o <<>>>o    |   * SUN *        |   o<<>>> o(Vala) 🪙              |
|      amber               |   core deliverable|        green  (money gate)        |
|                          |   SprintStage     |                                   |
|                          |   Iron Gate vitals|                                   |
|                          +------------------+                                    |
|                        o        |                                                |
|                                 | >>>                                            |
|                                 o                                                |
|                             (Daisy) pink                                         |
|                                                                                  |
|     ( component satellites at orbit radius r in [220, 480] around (0,0) )        |
|                                                                                  |
|  Bays: Calendar | Alfred Core | Dossier | Macro Pad                              |
+----------------------------------------------------------------------------------+
 Wires: hue = source dept; arrowhead at receiver; chevrons animate only while an
 event flows. Dependency wire shows 🔒 at the receiver end while blocked.
```

### 6.4 Node container anatomy

```
              o top pin
        +----------------+
 left o |  Node label     | o right pin
        |  body           |
        |                 |◢  corner resize handle
        +----------------+
              o bottom pin
 Right-click => context menu. Alt+Right-Click => freeze toggle. Lock = move + resize.
```

### 6.5 Wire anatomy

```
 (source) o ━━━━ >>> ━━━━ ◆ ━━━━ >>> ━━━━▶ o (target)
                         glyph at midpoint (dot | lock | diamond | coin)
 hover => label; select => highlight neighbors, dim the rest
 hit path: wide transparent stroke (about 16 px) for easy clicking
```

### 6.6 Context menu structure (≤ about 8 top-level items; the rest nests)

```
NODE MENU                     CANVAS MENU                 SUN MENU
 Lock / Unlock  (existing)     Add node        ▸           Lock / Unlock
 Edit           ▸ Rename       Paste                       Recenter
                  Duplicate    Select all                  Focus
                  Copy ID      View           ▸ Fit all    Connect to…   ▸
 Arrange        ▸ Front/Back                    Recenter   Dispatch…     ▸
                  Reset size                    Grid       Open client links ▸
                  Reset pos                     Snap       Copy client ID
 Focus (F)                                      Satellites ─────────────
 Connect to…    ▸ valid targets  Arrange       ▸ Auto-arrange  Delete (disabled:
 Disconnect     ▸ wires, All                    Lock all       "The core deliverable
 Dispatch…      ▸ agents                        Unlock all      cannot be deleted.")
 Open links     ▸ (if present)  Undo / Redo (disabled when empty)
 ─────────────
 Delete (danger)

LINK MENU: Delete wire | Edit ▸ (label, kind, mode) | Reverse direction | Enable/Disable
MULTI-SELECT: Align ▸ | Distribute ▸ | Lock/Unlock selection | Duplicate | Delete selected
```

### 6.7 Alfred Core bay

```
+----------------------------------------------------------+
| >_ Alfred Core   <client name>                        ▾  |
|  [▼ CLIENT AUDIT & GATE VITALS]            [SRC: client] |
|  +----------------------------------------------------+  |
|  | conversation / status / readable error messages    |  |
|  | proposals appear as pending items, never executed  |  |
|  +----------------------------------------------------+  |
|  [ Command Alfred...                      ] [Send|Stop]  |
+----------------------------------------------------------+
 Missing-key state shows a clear setup message instead of failing silently.
 Mark the input with data-alfred-input so global shortcuts ignore it.
```

### 6.8 Planned Planet View (not built)

```
+----------------------------------------------------------------------------------+
| ← Back to Solar (restores camera)   Client > Project/Service node                |
+----------------------------------------------------------------------------------+
| [Kanban]  [Gantt]  [Master task list]     real DOM, virtualized, lazy-loaded      |
| reads the same store + event log; milestone.done here fires the same wires        |
+----------------------------------------------------------------------------------+
```

---

## 7. Alfred specifics

- **Role:** client-audit assistant. Answers using only provided context. May propose `create_task`, `draft_invoice`, `send_email` as structured suggestions in a ```` ```proposal ```` block. Never performs them. Must never be told it can change contract values.
- **Context whitelist:** name, ID, phase, step, roadblock, deposit status, installed components for the selected client; plus the selected node and its linked neighbors. Exclude Drive links, emails, and anything unneeded. Hard cap (about 4,000 characters).
- **Proposals:** parse, validate against an allowlist, push into the existing pending-changes / approval flow. Nothing executes.
- **UX:** multi-turn (last N turns), loading state, Stop button, readable errors with HTTP status (400/403 bad key or API not enabled or referrer restriction, 404 model id, 429 quota, network failure). Never show or log the key.
- **Key handling (current build):** server-side proxy reads `GEMINI_API_KEY` (no `VITE_` prefix); Vite env loading prefers `apps/command-hud/.env.local` over the repo-root file, and a Vite restart is required after changes. `.env*.local` must stay in `.gitignore`. `VITE_*` values are browser-visible; never put secrets there. Provider success remains unverified.

---

## 8. Hard constraints (do not violate)

1. **Do not modify** `Master_Control_Bridge.gs`, `engines/master-control/`, finance ledger logic, or the Financial Mutation confirmation flow. Stop and ask if a task would require it.
2. **Do not touch `quarantine/oracle-mmd/`.** Oracle internals never enter HUD code, Alfred context, or exported JSON. Only a short findings summary may flow onward.
3. No layout, link, or event data goes to Sheets or the backend. Store plus localStorage only, until the owner approves otherwise.
4. Never log, print, or commit secrets. Keep `.clasp.json` and Apps Script IDs out of version control. Do not push or deploy before the authorized Apps Script project, scopes, and Script Properties are verified.
5. Edit source files only; no runtime DOM injection.
6. Do not claim anything is verified unless you ran it, and say what you ran.

---

## 9. Working method

- Search the repo, quote real code, and report findings **before** editing. Do not guess file names or line numbers.
- One part per commit; run `npm run lint` and `npm run build` after each.
- Use `docs/active/` for plans in progress, `docs/archive/` for completed ones, `docs/PARKING_LOT.md` for out-of-scope findings. Each active doc carries a status header (`Status`, `Last verified`, `Items done/partial/missing`). Mark an item `done` only with evidence from something you ran. When every item is done (or marked "deferred by owner"), add a Closeout section and move the doc to `docs/archive/`.
- Work only on the current task. Do not circle back to earlier parts unless a check you ran fails because of them. Note anything else in the parking lot.
- Report after each part: files changed, what you ran, what you could not verify, new UI surfaces and the existing surfaces they attach to, open questions.

### Remaining Phase 2 order

1. Rerun root `npm run lint` and `npm run build` after the latest connection-target feedback changes.
2. Finish context menus, multi-selection, keyboard navigation, and shortcuts while preserving existing Lock/Unlock and Alt+Right-Click behavior.
3. Complete and verify the remaining wire filters/legend and active-flow requirements in the selected existing surface.
4. Resolve safe event-to-domain behavior and money-proposal routing through an existing approved confirmation interface; otherwise document the constraint without changing finance code.
5. Verify Alfred provider/error/Stop paths without exposing credentials; complete export/import and remaining browser acceptance checks.
6. Produce the audit table and closeout report. Do not archive Phase 2 or start Phase 3 before closeout.

---

## 10. Owner decisions and unresolved acceptance

The Phase 2 decisions D1-D5 are resolved as recorded in `docs/active/OWNER_TODO_CHECKLIST.md`: no rules approved, no uninstall flow until needed, hollow pull chevrons, Multi-Agent Dispatch Wires tab (AlfredDock dormant), and minimal undo model accepted. Remaining Phase 2 work is implementation and verification, not a need to reopen these decisions. Keep any decision that would alter finance behavior or activate event rules deferred unless the owner explicitly changes it.

---

## 11. Glossary

- **Galaxy / Solar / Planet / Universe:** the four zoom tiers described above.
- **Sun:** the client's core deliverable node at the center of Solar view.
- **Satellites:** departmental and service-component nodes orbiting the Sun.
- **ECS:** entity-component-system label used for the node and service-component model. Currently more a naming convention than a strict architecture; the roadmap's Milestone 2 aims to make entities, components, and systems explicit in the store.
- **Bays / chassis:** the four floating hardware panels at the bottom (Calendar, Alfred Core, Dossier, Macro Pad).
- **Avionics Tower:** Display 2 (762x1366 portrait console).
- **Tactical Horizon:** Display 1 (1680x1050 canvas).
- **Iron Gate:** gate vitals shown at the Sun's core.
- **MCC:** Mail Command Center (Daisy's domain).
- **Financial Mutation confirmation:** the existing dialog that must gate anything changing Contract Value, deposits, or the ledger.
- **Proposal:** a pending, human-approved suggestion; the only thing agents and event handlers may create.
