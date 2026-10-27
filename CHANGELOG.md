# SZS Command HUD — Changelog

All notable changes to this project will be documented in this file.

---

## [Milestone 0 & Solar Drag Fixes] - 2026-10-26

### Added
- **`STATUS.md`**: Architectural audit of Modules A through F with verification notes.
- **`SECURITY.md`**: Credential isolation boundary, OAuth scopes documentation, token handling rules, and developer compromise threat model.
- **`engines/master-control/src/Snapshot_Trigger.gs`**: Standalone daily snapshot script copying Master Control sheets to timestamped backups with automated 30-day retention pruning.
- **`DropConfirmDialog.tsx`**: Human authorization modal guarding any drag-and-drop or ECS module attachment that mutates Contract Value or ledger totals.
- **`HudErrorBoundary.tsx`**: Subsystem isolation boundary wrapping Tactical Canvas and Bottom Console Chassis with fallback UI.
- **Alt + Right-Click Context Menu**: Supported across both `SlimVitalsCard` and `ResizableNodeContainer` for quick locking/context menu triggers.

### Fixed
- **Solar Map Drag & Drop Diagnostics**:
  - Attached explicit `draggable="true"` and set `-webkit-user-drag: element; user-select: auto;` on draggable service nodes.
  - Removed container `user-select: none` blockers that prevented browser native drag initialization.
  - Replaced `w-0 h-0 overflow-visible` hit-testing bottleneck with a full-viewport interaction container (`inset-0 pointer-events-none` with `pointer-events-auto` on interactive nodes).
