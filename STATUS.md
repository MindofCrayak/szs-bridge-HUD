# SZS Command HUD — System Status & Architectural Audit

**Date:** 2026-10-26 (SZS Ledger Epoch)  
**Branch:** `main`  
**Deployment Target:** Session Zero Solutions Command HUD 2.0 (React + Vite + Tailwind, Google Apps Script bridge)

---

## 1. Architectural Audit: Modules A to F (Brief Milestone 0)

| Module | Description | Status | Verification & Notes |
| :--- | :--- | :--- | :--- |
| **Module A** | Auto-Switch View to Client Solar Workbench on Drag Initiation | **Integrated** | Triggered on `dragstart` in `MultiAgentDispatch.tsx` via `onTriggerWorkbench(client)`. Sets `application/json` payload with `serviceId`, `price`, `tasksToInject`. |
| **Module B** | Workbench Orbit Snap & Drop Target Engine | **Integrated** | Tested in `ProjectWorkbenchView.tsx`. Uses radial math `angle = atan2(y, x)`, `r = clamp(220, 480, sqrt(x^2 + y^2))` to snap dropped nodes into orbit. |
| **Module C** | Master Control Backend Persistence | **Integrated** | `syncServiceToMasterControl` in `api.ts` wired to `attachClientServiceNode` in `Central_Router.gs` with offline fallback. Gated by `ENABLE_COMPONENT_PERSISTENCE` flag and financial confirmation dialog. |
| **Module D** | ECS Connection Ports & Dynamic SVG Link Tracers | **Integrated** | `ConnectionPort.tsx` pins (top, bottom, left, right) on all containers. Cubic Bezier curve generator with animated Imperial Gold tracer dots. |
| **Module E** | Universal Resizable Node Container & Right-Click Locking | **Integrated** | `ResizableNodeContainer.tsx` provides zoom-compensated drag, corner resizing, right-click & Alt+Right-Click freeze toggle. |
| **Module F** | Solar Map Selector & RTS Hotkeys (`Ctrl+[1-9]`, `Alt+[1-9]`) | **Integrated** | `SolarMapSelector.tsx` in header dropdown + `useRTSHotkeys` in `useKeybindings.ts` for rapid client jumping. |

---

## 2. Bug Fixes Applied (Solar Map Drag & Drop Diagnostics)

1. **Explicit Draggable & User-Drag**:
   - Fixed `draggable="true"` and `-webkit-user-drag: element; user-select: auto;` on draggable elements.
   - Removed blanket `user-select: none` from container ancestors which was blocking pointer and drag event dispatch in Chromium.
2. **Interaction Container Geometry**:
   - Expanded zero-size `w-0 h-0` center anchor container to full-area `inset-0 pointer-events-none` with `pointer-events-auto` on child nodes so hit-testing and event bubbling execute cleanly across the entire canvas viewport.
3. **Alt + Right-Click Context Menu Support**:
   - Added `Alt + Right-Click` (and standard `Right-Click`) handlers across both `SlimVitalsCard.tsx` (Tactical Canvas) and `ResizableNodeContainer.tsx` (Solar System Workbench).

---

## 3. Milestones Roadmap Tracking

- **Milestone 0: Stabilize and protect** — IN PROGRESS (Audit completed, error boundaries & confirmation gates added).
- **Milestone 1: Data contract and backend hardening** — QUEUED.
- **Milestone 2: ECS store and command system** — QUEUED.
- **Milestone 3: Interaction layer** — QUEUED.
- **Milestone 4: Dual display and performance** — QUEUED.
- **Milestone 5: Agent framework** — QUEUED.
- **Milestone 6: Production readiness** — QUEUED.
