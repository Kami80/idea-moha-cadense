# Cadence Workflow Studio

Editable local HTML/CSS/JS workspace built from the 25-page project discovery document for the Cadence furniture production workflow.

## What this is

This is not the production ERP/MES itself. It is the **main project workflow and planning workspace** used before and during product design/development so the team can review the business, make decisions, refine requirements, and keep one approved workflow baseline.

The source document described a Human-Driven / Person-Centric process built around messaging apps, Excel, paper production tickets (بیجک), and manual status follow-up. This workspace restructures that material into a workflow-first model with clearly separated source facts, open questions, proposed future-state design, roadmap, data model, roles, KPI definitions, risks, and a Miro collaboration bridge.

## Main sections

1. Overview — scope, problem statement, known facts, north star, design principles.
2. Current workflow — editable As-Is flow from sales order to dispatch.
3. Target workflow — proposed State Machine with Order, Fabric, and Production lanes.
4. Requirements & roadmap — editable MVP / V1 / V2 backlog with acceptance criteria.
5. Data model & documents — Order, OrderItem, ProductModel, WorkOrder, StageRun, FabricRequirement, QC, Dispatch, AuditEvent, etc.
6. Roles & access — proposed role cards and permission matrix.
7. Production planning — two-week visibility and an editable assisted-priority model.
8. KPI & dashboard — source KPIs plus enhanced metrics such as Stage Cycle Time, WIP Age, OTD readiness, and Rework Rate.
9. Questions, risks & decisions — workshop decision backlog, risk register, decision log.
10. Miro & collaboration — board frame blueprint, workshop agenda, Miro CSV export, and board brief copy action.
11. Visual Workflow Board — editable canvas with lanes, cards, links, comments, pan/zoom, filters and Miro/SVG/JSON export.
12. Change log — simple project baseline/version history.

## Editing and persistence

- Use the **Edit / Add** controls throughout the app.
- Changes are stored in browser `localStorage` under `cadence-workflow-studio-v1`.
- Use **Export JSON** before important workshops or major changes.
- Use **Import JSON** to restore a prior snapshot.
- Use **Export Markdown** to create a portable project specification for developers/AI agents.
- `Reset baseline` clears local edits and restores the shipped source-derived version.

## Run locally

Simplest: open `index.html` directly in a modern browser.

For the most predictable browser behavior, serve the folder locally:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

No package install, build step, database, framework, or external JavaScript library is required.

## Miro workflow

The local planning app intentionally does **not** store Miro access tokens. It supports team collaboration in three low-risk ways:

- Save/open the team's Miro board URL from the Miro section.
- Export `Miro CSV` containing frames, questions, target stages, requirements, entities, roles, KPIs, risks, and decisions.
- Use `Copy board brief` to create a structured prompt for the Miro-connected ChatGPT workflow so it can build the frames/stickies/diagram on the team's board.

A future hosted version can add a proper OAuth-based Miro integration or live embedded board as a separate integration layer.

## Important product decisions still open

The app deliberately keeps unresolved issues visible instead of silently assuming them. The highest-impact decisions include:

- Work Order / بیجک scope: whole order vs order item vs product component.
- Fabric meter formula and whether formulas are versioned/overrideable.
- Whether woodworking and fabric/sewing paths run in parallel.
- Whether stages may partially complete quantities.
- Who records stage progress: supervisor vs operator vs order coordinator.
- Rework routing after QC rejection.
- Production planning cadence, capacity definition, and priority rules.
- What data becomes immutable after approval/release.
- Real baselines for registration time, follow-up calls, lead time, delays, and rework.

These are intentionally centralized in the **Questions / Risks / Decisions** view and should be resolved in the Miro workshop before schema and development are locked.

## File structure

- `index.html` — application shell.
- `styles.css` — responsive UI system.
- `project-data.js` — editable baseline created from the discovery PDF.
- `app.js` — rendering, editing, persistence, imports/exports, Miro bridge.
- `workflow-board.html` — advanced interactive workflow canvas.
- `workflow-board.css` — board/canvas/inspector/minimap UI.
- `workflow-board.js` — drag, pan/zoom, connections, editing, comments, undo/redo and exports.
- `VISUAL-BOARD-GUIDE.md` — team usage, decision-status conventions, shortcuts and Miro handoff.
- `miro/MIRO-BOARD-GUIDE.md` — recommended board operating model.



## Advanced Visual Workflow Board

`workflow-board.html` یک برد تعاملی مستقل برای طراحی و مرور Workflow است و مستقیماً با داده‌های همین Project Workspace کار می‌کند. امکانات اصلی:

- Pan / zoom / fit-to-view و mini-map
- Drag & drop مراحل با Snap-to-grid
- Swimlaneهای قابل ویرایش و افزودن Lane جدید
- ساخت Stage و Workshop Sticky Note
- ساخت Connection بین مراحل با نوع sequence / dependency / feedback
- Inspector کامل برای عنوان، Owner، Status، Type، DoD، Source و Tag
- Commentهای محلی برای مرور تیمی
- Undo / Redo، Duplicate، Delete، Search و Status Filter
- Auto-layout و Sync مجدد از Target Workflow اصلی
- Export به JSON، Miro-friendly CSV و SVG
- ذخیره خودکار Board داخل `cadence-workflow-studio-v1` تا Snapshot اصلی پروژه و Board یک منبع واحد داشته باشند.

نکته: همکاری همزمان چندکاربره در نسخه Local انجام نمی‌شود. برای Workshop زنده تیمی، Miro مرجع collaborative canvas باقی می‌ماند؛ این Visual Board برای طراحی دقیق Workflow، baseline و تحویل به توسعه مناسب است.


### Visual Board v1.4 — second-pass collaboration UX
- Left-drag empty canvas to pan; Wheel/trackpad pans; Ctrl/Cmd + wheel zooms.
- **Multi-select:** Shift/Ctrl/Cmd + click; selected cards move together.
- **Selection Rectangle:** Shift + drag in Select mode, or use the dedicated Marquee tool (`M`).
- **Grouping:** group 2+ cards, move the group together, duplicate it, select members, or ungroup; `Ctrl/Cmd + G` opens Group creation.
- **Section color themes:** Mint, Sky, Sand, Rose, Violet, and Slate.
- **Collapsible lanes:** collapse a Section without deleting its cards; downstream lanes reflow automatically.
- **Floating Quick Actions:** selection-aware Edit/Group/Duplicate/Status/Delete actions appear beside the selection.
- **Focused Edit Drawer:** double-click cards, lanes, groups, or connections for a larger editor; Group creation uses a dedicated modal.
- Right-click canvas creation menu remains available for stages, gates, parallel steps, notes, and Sections/Lanes.
- The existing Inspector remains available for quick edits and comments.

### UI shell v1.5 — enhanced sidebar + night mode

- The main sidebar is reorganized into three navigation groups with distinct line icons, section search (`/` shortcut), workshop-readiness status, a persistent Visual Board shortcut, and compact save/reset utilities.
- Desktop users can collapse the sidebar to an icon rail; the state is remembered locally and expands back to a full mobile navigation layout on small screens.
- A shared Day/Night theme is available from the sidebar and from the Visual Board header. Theme choice is stored in `localStorage` using `cadence-ui-theme`, so both pages stay in sync.
- Night mode is a purpose-built dark clay/neumorphism design rather than a color inversion: cards, forms, tables, workflow nodes, lanes, groups, drawers, context menus, minimap, and controls all use dark-specific surfaces and shadows.
- On first use, the app follows the operating-system color preference unless the user has already chosen a theme.
