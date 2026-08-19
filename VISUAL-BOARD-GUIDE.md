# Cadence Visual Workflow Board Guide

The `workflow-board.html` page is the editable visual canvas for reviewing and designing the Cadence furniture production workflow.

## Purpose

Use the main Workflow Studio for structured requirements, questions, decisions, KPIs, roles, and data-model planning. Use the Visual Workflow Board when the team needs to **see and manipulate the workflow itself**: stages, dependencies, parallel paths, gates, notes, and ownership.

The board initializes from the project's proposed Target Workflow and keeps the same uncertainty discipline as the discovery baseline. Parallel fabric execution and merge dependencies remain marked as proposed / needs decision until the team confirms them.

## Core interactions

- **Select:** select and drag cards.
- **Hand:** pan around the canvas.
- **Connect:** click a source card and then a destination card to create a dependency.
- **Stage:** add a new workflow stage near the current viewport center.
- **Workshop note:** add a sticky-style note for assumptions, questions, or decisions.
- **Lane:** create another swimlane for a team, subsystem, or alternate flow.
- **Inspector:** edit title, owner, lane, type, decision status, Definition of Done, tags, and source/rationale.
- **Comments:** keep local review comments attached to a card.
- **Search/filter:** focus the board by text or decision status.
- **Mini-map:** understand and navigate the full workflow.
- **Auto layout:** normalize lane/card positioning after a workshop.
- **Sync Target:** rebuild the visual board from the structured Target Workflow in the main project workspace.

## Decision statuses

- `Confirmed` — approved by the team / stakeholder.
- `Proposed` — design proposal, not yet accepted as a requirement.
- `Needs decision` — open question that can materially change workflow or schema.
- `Blocked` — cannot proceed until another decision or dependency is resolved.

## Connection types

- `sequence` — normal next-step flow.
- `dependency` — one stage or lane depends on another, including cross-lane fabric/production synchronization.
- `feedback` — return/rework/loop connection, useful for QC rejection scenarios.

## Keyboard shortcuts

- `V` Select
- `H` Hand / pan mode
- `C` Connect mode
- `Delete` Remove selected item
- `Ctrl/Cmd + Z` Undo
- `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` Redo
- `+ / -` Zoom
- `Space + drag` Temporary pan
- `Esc` Return to Select and clear selection

## Miro team workflow

Recommended operating model:

1. Use this board to maintain the precise workflow baseline and stage semantics.
2. Export **Miro CSV** when the team wants to bring cards/connectors into a collaborative Miro workshop.
3. Use Miro for live facilitation, sticky notes, voting, discussion, and divergent exploration.
4. After the workshop, enter approved decisions back into Workflow Studio and/or edit the Visual Board.
5. Export a JSON snapshot before a major redesign so the previous baseline remains recoverable.

The local app does not attempt real-time multi-user synchronization. Miro remains the recommended synchronous collaboration surface until the project is moved to a hosted backend with authentication and shared persistence.


## Mouse navigation & right-click creation

- **Drag empty canvas with the left mouse button** to move around the board even while Select mode is active.
- **Mouse wheel / trackpad** pans the board. Hold **Shift** for horizontal wheel panning when needed.
- **Ctrl/Cmd + wheel** zooms around the pointer. Middle mouse and Space+drag remain available as alternative pan controls.
- **Right-click anywhere on the canvas** to open the creation menu at that exact board location. You can add a workflow stage, decision gate, parallel step, workshop note, or a new Section/Lane.
- **Click any workflow card** to open its editable details in the Inspector.
- **Click anywhere on a Section/Lane** to edit the section title, purpose, owner, notes, height and order.


## v1.4 — سریع‌ترین روش کار با Board

- **Pan:** فضای خالی را Drag کنید یا Wheel/Trackpad را حرکت دهید. Space + Drag و Hand mode هم فعال‌اند.
- **Multi-select:** با Shift/Ctrl/Cmd + Click چند کارت را انتخاب کنید. Drag یکی از کارت‌های انتخاب‌شده همه را جابه‌جا می‌کند.
- **Selection rectangle:** در Select mode کلید Shift را نگه دارید و روی فضای خالی Drag کنید، یا ابزار **Marquee** را انتخاب کنید.
- **Group:** حداقل دو کارت را انتخاب کنید و از Floating Actions، Inspector، دکمه Group یا `Ctrl/Cmd + G` استفاده کنید. Header گروه برای جابه‌جایی کل Group قابل Drag است.
- **Lane theme:** Lane را انتخاب کنید و از Inspector/Edit Drawer یکی از Themeهای Mint/Sky/Sand/Rose/Violet/Slate را انتخاب کنید.
- **Collapse:** دکمه `−/＋` روی Header Lane، Floating Actions، Inspector یا Edit Drawer برای جمع/باز کردن Section استفاده می‌شود.
- **Focused edit:** Double-click روی Card/Lane/Group/Connection یا دکمه Edit در Floating Actions، Edit Drawer بزرگ را باز می‌کند.
- **Quick actions:** بعد از هر انتخاب، نوار کوچک Floating Actions نزدیک همان Selection ظاهر می‌شود.


## v1.5 theme and navigation
- Use the **Night / Day** control in the board header to switch themes. The choice is shared with the main Workflow Studio.
- The dark theme is designed specifically for the workflow canvas, including dark lanes, nodes, groups, inspector, edit drawer, context menus and minimap.
- Press **T** while not typing in a field to switch Day/Night mode from the keyboard.
