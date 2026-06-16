# Stickies

Internal sticky-style project-planning canvas for mapping Sonic Sphere workstreams, associated people/organizations, stages, project nodes, and dependencies with React Flow.

This is a static Vite React app. It runs locally, can be deployed to GitHub Pages, and stores project data in the browser with JSON import/export for sharing.

The browser favicon is the Material Design Icons `circle-opacity` glyph, flipped horizontally and served from [public/favicon.svg](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/public/favicon.svg).

## What It Is

- A visual planning canvas for project items and dependencies.
- A multi-tab project map with workstreams, associated people/organizations, per-tab stages, snapshots, settings, and themes.
- A beginner-maintainable React TypeScript app built with Vite, React Flow, Tailwind, Zustand, and localStorage.

## What It Is Not

- It is not a backend project-management database.
- It does not include login, permissions, collaboration, notifications, time tracking, budget tracking, or third-party integrations.
- It is not a React Flow props playground. User-facing controls should stay planning-focused.

## Local Setup

Install dependencies:

```sh
npm install
```

Start the pinned dev server:

```sh
npm run dev
```

Open:

```txt
http://127.0.0.1:5178/Stickies/
```

Public read-only view:

```txt
http://127.0.0.1:5178/Stickies/public/
```

The dev server is pinned in [vite.config.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/vite.config.ts) with strict-port behavior. If port `5178` is already occupied, stop the stale server instead of silently changing the permanent URL.

## Commands

Run the local dev server:

```sh
npm run dev
```

Typecheck and build for production:

```sh
npm run build
```

Typecheck only:

```sh
npm run typecheck
```

Run import regression tests:

```sh
npm run test:imports
```

Preview the production build:

```sh
npm run preview
```

Preview URL:

```txt
http://127.0.0.1:4178/Stickies/
```

Public preview URL:

```txt
http://127.0.0.1:4178/Stickies/public/
```

## GitHub Pages Deployment

The GitHub Pages workflow lives at [.github/workflows/deploy.yml](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/.github/workflows/deploy.yml).

It runs on pushes to `main` and on manual `workflow_dispatch`.

The workflow:

- Checks out the repository.
- Sets up GitHub Pages.
- Uses Node 22.
- Runs `npm ci`.
- Runs `npm run build`.
- Uploads `dist`.
- Deploys with `actions/deploy-pages`.

The workflow sets:

```txt
VITE_BASE_PATH=/${{ github.event.repository.name }}/
```

For a user or organization Pages site deployed at the root domain, set `VITE_BASE_PATH=/` instead.

For a custom domain served at the root, also set:

```txt
VITE_BASE_PATH=/
```

Do not claim deployment succeeded until GitHub Actions has actually run and passed.

## Data Persistence

Current project state is managed in [src/state/projectStore.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/state/projectStore.ts).

The app saves the current project to browser localStorage under:

```txt
project-planner:v1:current
project-planner:v1:last-opened
```

On startup, the app loads saved localStorage data if it validates. If localStorage is empty or invalid, it loads the seed project from [src/data/seedProject.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/data/seedProject.ts).

The seed and committed public snapshot include a `Timeline + Install Process` tab derived from the SS Art Basel 2025 Delivery Plan PDF.

Validation lives in [src/lib/validation.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/lib/validation.ts).

The editor left rail starts with a single `File` menu for browser-local project lifecycle actions:

- `New`: replaces the current browser project with a blank project after confirmation.
- `Open local JSON`: imports a native `.json` project file after validation and confirmation.
- `Close`: clears the current browser project and switches to a blank project after confirmation.
- `Save Snapshot`: creates a named snapshot inside the current project. Autosave to localStorage still happens in the background.
- `Open from Google Drive`: requests Google authorization when needed, opens Google Picker, validates the selected Stickies-compatible JSON file, and replaces the current project only after confirmation.
- `Save As to Google Drive`: asks for a file name, uses Google Picker folder selection, creates a `.stickies.json` file in the selected Drive folder, and binds the current project to that Drive file for later cloud actions.
- `Save to Google Drive`: updates the currently bound Drive file. If the project is not bound to Drive yet, it routes to `Save As to Google Drive`.
- `Share Drive File`: opens Google's native Drive sharing dialog for the currently bound Drive file when the user's account has sharing permission.
- `Publish`: saves a frozen read-only snapshot to GitHub with a random slug link. Later edits do not update that published snapshot.
- `Export`: downloads a JSON project file, Markdown, or DOCX file.
- `Version History`: shows the most recent saved snapshots.

## Public Read-Only View

The public viewer lives at `/Stickies/public/`. It loads the committed static snapshot at [public/public/project.json](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/public/public/project.json) instead of browser localStorage.

Published read-only links live at `/Stickies/public/<slug>/`. The `File` menu's `Publish` action must be run from the pinned local app at `http://127.0.0.1:5178/Stickies/`. It asks the local Stickies app server to commit a frozen JSON snapshot to GitHub at `public/published/<slug>.json` and shows the matching GitHub Pages link. The hosted GitHub Pages app is static, so it can view published snapshots but cannot save new files back to GitHub. Publishing does not download a file or ask for a GitHub token in the browser. Publishing does not create live collaboration and does not update the link when the editor project changes later.

Public mode allows:

- Starting a new editable browser-local copy from the published snapshot.
- Switching tabs.
- Selecting nodes and edges.
- Reading the right inspector.
- Switching themes for the current browser session.
- Toggling the MiniMap.
- Viewing the saved arrow routing and handle placement.
- Panning and zooming the canvas.
- Dragging planning items into temporary positions for the current browser session.

Public mode does not allow durable editing. Add, rename, delete, import, snapshot, settings, connect, and inspector edit controls are hidden or blocked. Temporary item movement is not saved and resets when the public snapshot is loaded again.

To update the public data, export an approved project JSON from the private editor, review it for public-safe content, then replace `public/public/project.json` before deploying. Anything in that file can be public on GitHub Pages.

To update a published slug, publish again to create a new `public/published/<slug>.json` file. Treat every published JSON file as public.

## Import and Export

Export/import helpers live in [src/lib/exportImport.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/lib/exportImport.ts).

The left-rail `File` menu contains `Open local JSON` and `Export`. `Open local JSON` only accepts `.json` project files, validates schema version `1` or `2`, and replaces the current project only after confirmation. It also accepts simplified Stickies JSON shaped as `version`, `name`, and `tabs`; those imports keep nodes, notes, edge labels, and canvas positions while using empty people, workstream, and tag lists internally.

Schema v2 imports are for analyzer-generated software graph projects such as `ss-react-flow-project-v2.json`. The importer preserves `projectOrigin`, `graphSnapshots`, `softwareGraphNavigation`, generated tab metadata, and each node/edge `data.softwareGraph` payload. Generated tabs may omit `stages`; the app normalizes missing stages to an empty array only for renderer compatibility. If a v2 file omits `settings.themeId`, the app applies the default `clean-light` theme while preserving analyzer settings such as `generatedSoftwareGraph` and `readOnlyGeneratedTabs`. When a schema v2 project is loaded, the top bar shows a direct `Export JSON` button that downloads the current v2 project file without converting it to a planning-only outline.

Project settings may include `edgeRoutingMode` (`bezier`, `smooth-step`, or `straight`) and `nodeHandleMode` (`side` or `all-sides`). Missing values fall back to curved arrows with side handles so older project JSON files continue to load.

`Export` opens a centered format picker with three options:

- `JSON project file`: the native project JSON format this flowchart app uses, preserving schema v1/v2 project data and metadata.
- `markdown`: a human-readable `.md` outline that is good to import into AI tools.
- `DOCX`: a plain human-readable Word document generated from the same outline.

Export filenames use this shape:

```txt
project-planner-YYYY-MM-DD-HHmm.json
project-planner-YYYY-MM-DD-HHmm.md
project-planner-YYYY-MM-DD-HHmm.docx
```

Use `Save` for an internal snapshot. Use `Export` when you need a file outside this browser.

## Snapshots

Snapshots are saved inside the project file. A snapshot includes:

- Snapshot ID.
- Label.
- Optional note.
- Created timestamp.
- Full project state without duplicating the snapshot list.

Restoring a snapshot replaces the project with that saved state while keeping the current snapshot history.

## Canvas

The controlled React Flow canvas lives in [src/components/canvas/PlanningCanvas.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/canvas/PlanningCanvas.tsx).

Canvas components:

- [src/components/canvas/PlanningNode.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/canvas/PlanningNode.tsx)
- [src/components/canvas/StageBandNode.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/canvas/StageBandNode.tsx)
- [src/components/canvas/PlanningEdge.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/canvas/PlanningEdge.tsx)

The canvas renders active-tab nodes and edges from Zustand, writes React Flow changes back to project state in editor mode, creates solid line edges on connect in editor mode, saves viewport movement in editor mode, shows the MiniMap setting, and keeps stage/lane backgrounds fixed behind planning nodes. Arrow routing is a project-wide setting: `Curved` uses Bezier paths, `Elbow` uses smooth-step paths, and `Straight` uses direct paths. The canvas also includes a `Recompute arrows` control that refreshes React Flow handle measurements after routing or handle changes.

Each tab has one band orientation at a time. The left sidebar toggle switches between vertical `Stages` and horizontal `Lanes`, rebuilds the background bands in that orientation, and remembers each orientation's band sizes so switching back restores the prior layout. Planning item positions are not moved by the toggle.

Planning item connector handles use enlarged click targets while keeping the visible handle dots small, so nontechnical users can create dependencies without needing pixel-perfect clicks. `Side handles` shows a left input and right output. `All sides` shows left and top inputs plus right and bottom outputs, with stable handle IDs saved on new edges.

## Editing UI

Main layout files:

- [src/components/layout/AppShell.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/layout/AppShell.tsx)
- [src/components/layout/TopBar.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/layout/TopBar.tsx)
- [src/components/layout/TabBar.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/layout/TabBar.tsx)
- [src/components/layout/LeftSidebar.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/layout/LeftSidebar.tsx)
- [src/components/layout/RightInspector.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/layout/RightInspector.tsx)

Inspector files:

- [src/components/inspectors/NodeInspector.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/inspectors/NodeInspector.tsx)
- [src/components/inspectors/EdgeInspector.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/inspectors/EdgeInspector.tsx)
- [src/components/inspectors/TabInspector.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/inspectors/TabInspector.tsx)

In editor mode, users can add planning items, create/rename/delete tabs, edit the active tab's stages from the left sidebar, switch the active tab between vertical stages and horizontal lanes, edit a selected item's title, note, status, and associations, duplicate/delete items, edit/delete selected edges, set edge line types, change arrow routing, change node handle placement, recompute arrows, hide/show the inspector, create/restore snapshots, import/export JSON, and toggle MiniMap, Settings, and Presentation modes. Schema v2 projects also expose a direct top-bar `Export JSON` action.

Generated software graph tabs are read-only by default, so nodes do not drag, generated contents cannot be accidentally edited, and the left-rail stage editor is hidden for those tabs. Use the top-bar `Unlock Layout` control on a generated tab when node positions need to be adjusted; this unlocks layout movement while keeping generated content edits blocked. Existing planning tabs remain editable. The node and edge inspectors show software graph metadata when present, including kind, source path and line range, confidence, provenance source type, extractor, observed time, build ID, snapshot ID, and metadata summary.

In public mode, the right inspector renders selected tab, node, and edge details as read-only field/value rows. Selected edge details show the source and target item titles plus the edge line type.

## Settings and Presentation

The Settings page lives in [src/components/settings/SettingsPage.tsx](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/components/settings/SettingsPage.tsx).

Settings manages the people and organizations that can be associated with nodes. When Settings is active, it replaces the center canvas area while the side panel columns remain visible and empty. The Settings panel owns its scrollbar and reserves that scrollbar space internally, so the outer center-column edge stays aligned with the canvas layout. Each entry has a name, one to three initials, and a type. Removing an associated item creates an automatic snapshot before deletion, then clears that item from every node association.

Display-only filtering code still exists in [src/lib/filters.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/lib/filters.ts) for backward compatibility with saved project files, but search and filter controls are not exposed in the v1 UI. Legacy edge relationships are normalized into line types when projects load.

Presentation Mode hides sidebars and editing actions while keeping tab navigation, the canvas, theme selection, MiniMap toggle, and the exit control.

Public read-only mode is separate from Presentation Mode. It keeps the tab bar, canvas, theme selector, MiniMap toggle, and right inspector visible while removing editor-only controls.

## Themes

Theme helpers live in [src/lib/theme.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/lib/theme.ts).

Supported themes:

- `clean-light`
- `clean-dark`
- `neon-dark`

The app applies the selected theme with `data-theme` on the app root. Theme values are saved in project settings, so the theme persists through localStorage and exported JSON. React Flow receives `colorMode="light"` for `clean-light`, and `colorMode="dark"` for `clean-dark` and `neon-dark`.

## Beginner Maintenance Notes

- Keep project data changes aligned with [src/types/planning.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/types/planning.ts), seed data, and validation.
- Keep user-facing colors token-based in [src/index.css](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/index.css).
- Run `npm run build` after code changes.
- If you add new project fields, update import validation and seed data.
- If you change visible behavior, update this README.
- Do not add backend services, authentication, or real-time collaboration unless that becomes an explicit new version goal.

## Sensitive Data Warning

GitHub Pages is static hosting. Anything committed to this repository can become public depending on repository and Pages settings.

Do not commit confidential project JSON into the repository unless the team has intentionally approved that. This includes [public/public/project.json](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/public/public/project.json), which is the source for the public read-only viewer.

For v1 internal planning data, use browser localStorage and JSON import/export. Share exported JSON through an internal channel.

## Known Limitations

- No login or shared database.
- No real-time collaboration.
- No mobile-first editing.
- No automatic layout engine.
- No third-party integrations.
- GitHub Pages workflow exists, but deployment is not proven until Actions runs.
