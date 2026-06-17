# Stickies

Internal sticky-style project-planning canvas for mapping Sonic Sphere workstreams, associated people/organizations, stages, project nodes, and dependencies with React Flow.

This is a static Vite React app. It runs locally, can be deployed to GitHub Pages, and stores project data in the browser, local `.stickies` files, and optional Google Drive `.stickies` files.

The browser favicon is the Material Design Icons `circle-opacity` glyph, flipped horizontally and served from [public/favicon.svg](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/public/favicon.svg).

## What It Is

- A visual planning canvas for project items and dependencies.
- A multi-tab project map with workstreams, associated people/organizations, per-tab stages, snapshots, settings, and themes.
- A beginner-maintainable React TypeScript app built with Vite, React Flow, Tailwind, Zustand, and localStorage.

## What It Is Not

- It is not a backend project-management database.
- It does not include app-owned accounts, collaboration, notifications, time tracking, budget tracking, or a backend database.
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

## Google Drive Setup

Stickies can open, save, and publish `.stickies` files in the user's own Google Drive. Legacy `.stickies.json` Drive files remain openable. Stickies does not create app accounts, store passwords, run a backend, or maintain an app-owned permission database. Google Drive is the account, file system, storage layer, and sharing layer. Browser localStorage remains a local recovery backup, and full real-time collaboration is not included.

To enable Drive actions, create Google Cloud web credentials for this static app:

- Enable the Google Drive API and Google Picker API in the Google Cloud project.
- Create an OAuth client ID for a web app.
- Create a browser API key allowed to use Google Picker API and Google Drive API from the app origins.
- Add authorized JavaScript origins for local dev and the deployed site, for example `http://127.0.0.1:5178` and the GitHub Pages origin.
- Add authorized redirect URIs for Drive save and publish fallback authorization:
  - `http://127.0.0.1:5178/Stickies/`
  - `https://jebagu.github.io/Stickies/` if the deployed GitHub Pages app should also save to Drive.
- Add API key HTTP referrers for local dev and the deployed site, for example `http://127.0.0.1:5178/*` and the GitHub Pages origin with a path wildcard.
- OAuth uses only `https://www.googleapis.com/auth/drive.file` to create, open, update, and publish Stickies files. Do not switch to full Drive content scope or Drive metadata scope unless a later PRD explicitly changes the permission model.

Create `.env.local` from [.env.example](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/.env.example):

```txt
VITE_GOOGLE_CLIENT_ID=your-web-oauth-client-id
VITE_GOOGLE_API_KEY=your-browser-api-key
VITE_GOOGLE_APP_ID=your-google-cloud-project-number
VITE_PUBLIC_APP_ORIGIN=https://jebagu.github.io
```

These are public browser configuration values, not secrets. Do not add client secrets, refresh tokens, or access tokens to the app. Access tokens are requested only when the user chooses a Drive action and are kept in memory only. When popup authorization fails in the in-app browser, Stickies falls back to a full-page Google redirect; the returned token is read from the URL hash and the hash is immediately removed. To keep OAuth narrow, Stickies does not request a Drive metadata scope to list every folder. `VITE_PUBLIC_APP_ORIGIN` controls the origin used in published viewer links when publishing from local dev; it defaults to the current hosted Stickies origin.

If Google Picker shows `The API developer key is invalid`, the local values may be present but the browser API key is not accepted by Picker for this origin. In Google Cloud, confirm that:

- `VITE_GOOGLE_API_KEY` is an API key credential, not an OAuth client ID.
- The Google Picker API and Google Drive API are enabled and allowed by the API key's API restrictions.
- The key's website restrictions include the current local origin as `http://127.0.0.1:5178/*`.
- `VITE_GOOGLE_APP_ID` is the numeric Cloud project number from IAM & Admin > Settings, not the project ID string.
- The Vite dev server was restarted after `.env.local` changed.

`Save to Google Drive` starts Google authorization before asking for a filename. When no valid Drive token is already in memory, Stickies redirects the current tab to Google, returns to `/Stickies/`, then resumes the same save action. First-time Drive saves ask the user to confirm that Stickies may create a top-level `Stickies` folder in My Drive. After confirmation, Stickies creates and remembers that folder locally, creates the `.stickies` file there, binds the browser project to that Drive file, and shows one copyable Drive file link plus an `Open Folder in Drive` action. Later saves update the bound Drive file and open the same Stickies folder from the success dialog.

The top bar shows where the editable project is saved. Browser-local projects read as locally saved, unsaved, or failed local save. Bound Drive projects read as `Google Drive · <folder> · <file> · <Drive save state>`. New Drive saves store the folder label directly, and older saved bindings use the standard `Stickies` Drive folder label.

`Open recent` is the preferred cloud-open workflow because it reopens locally remembered Stickies Drive files without relying on broad Drive browsing. Google Picker folder selection, broad Drive browsing, pasted folder links, and alternate save folders are not part of the save path. Stickies saves only to the top-level `Stickies` folder it creates in My Drive.

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

On local startup, the editor loads saved localStorage data if it validates. If localStorage is empty or invalid, it opens a new blank project using the `neon-dark` theme. The hosted editor root at `https://jebagu.github.io/Stickies/` always opens a new blank `neon-dark` project, ignoring any older browser-local project saved on that origin.

The seed and committed public snapshot include a `Timeline + Install Process` tab derived from the SS Art Basel 2025 Delivery Plan PDF.

Validation lives in [src/lib/validation.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/lib/validation.ts).

The editor left rail starts with a single `File` menu for browser-local project lifecycle actions:

- `New`: replaces the current browser project with a blank project after confirmation.
- `Open local file`: imports a native `.stickies` project file after validation and confirmation. Legacy `.json` and `.stickies.json` files still open.
- `Save local file`: downloads a Stickies project file, Markdown, or DOCX file.
- `Close`: clears the current browser project and switches to a blank project after confirmation.
- `Open recent`: reopens a locally remembered Drive file by file ID without using the full Picker. Recents store file metadata only, never access tokens or project JSON.
- `Save to Google Drive`: updates the currently bound Drive file. If the project is not bound to Drive yet, it asks for a file name, confirms creation of a top-level `Stickies` folder in My Drive if needed, creates a `.stickies` file there, and binds the current project to that Drive file.
- `Publish`: asks for a snapshot name, saves a frozen read-only Google Drive copy in the Stickies folder, applies anyone-with-the-link reader permission, remembers the latest published link locally, and returns a public Stickies viewer link. Later edits do not update that published snapshot.
- `Save checkpoint`: creates a named restore point inside the current project. Autosave to localStorage still happens in the background.
- `Version history`: shows the most recent saved checkpoints. Checkpoint restore is future work and is not exposed in this menu yet.

Links shaped like `/Stickies/?driveFileId=<file-id>` show an `Open shared Drive file?` prompt before requesting Google authorization. The app does not force an OAuth popup on page load.

## Public Read-Only View

The public viewer lives at `/Stickies/public/`. It loads the committed static snapshot at [public/public/project.stickies](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/public/public/project.stickies) instead of browser localStorage, with [public/public/project.json](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/public/public/project.json) retained as a legacy fallback.

Drive-published read-only links live at `/Stickies/public/drive/<file-id>/`. The `File` menu's `Publish` action asks for a filename, saves a separate frozen snapshot file in the remembered Stickies folder with no version-history checkpoints inside it, makes that file readable by anyone with the link, and shows the matching Stickies public viewer link. When publishing from `127.0.0.1`, the returned link uses `VITE_PUBLIC_APP_ORIGIN` instead of localhost so it can be shared. Published snapshot files do not become the current editable Drive save target. Later edits to the editor project do not update already published snapshots.

The public Drive viewer loads the snapshot JSON through the Google Drive API using the configured browser API key, not OAuth. Viewers do not need to sign in when the file has the anyone-with-the-link reader permission. If a Google Workspace policy blocks public sharing, Stickies may save the snapshot file to Drive but will show a failure explaining that it could not apply the public link permission. In that case, the returned Stickies public link will not work until Drive sharing policy allows public-by-link access.

Legacy static published slug links shaped like `/Stickies/public/<slug>/` try to load `public/published/<slug>.stickies` first and fall back to `public/published/<slug>.json` if those files already exist. New publishing does not create GitHub commits or call a local publish endpoint.

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

To update the static public data at `/Stickies/public/`, save an approved `.stickies` project file from the private editor, review it for public-safe content, then replace `public/public/project.stickies` before deploying. Keep `public/public/project.json` only when you need the legacy fallback updated too. Anything in either file can be public on GitHub Pages.

To publish a new Drive snapshot, run `File -> Publish` again and share the new `/Stickies/public/drive/<file-id>/` link. Treat every published Drive snapshot file as public once anyone-with-the-link permission is applied.

## Local Files

Local file helpers live in [src/lib/exportImport.ts](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/src/lib/exportImport.ts).

The left-rail `File` menu contains `Open local file` and `Save local file`. `Open local file` accepts `.stickies` project files, plus legacy `.json` and `.stickies.json` project files, validates schema version `1` or `2`, and replaces the current project only after confirmation. It also accepts simplified Stickies JSON shaped as `version`, `name`, and `tabs`; those imports keep nodes, notes, edge labels, and canvas positions while using empty people, workstream, and tag lists internally.

Schema v2 imports are for analyzer-generated software graph projects such as `ss-react-flow-project-v2.json`. The importer preserves `projectOrigin`, `graphSnapshots`, `softwareGraphNavigation`, generated tab metadata, and each node/edge `data.softwareGraph` payload. Generated tabs may omit `stages`; the app normalizes missing stages to an empty array only for renderer compatibility. If a v2 file omits `settings.themeId`, the app applies the default `clean-light` theme while preserving analyzer settings such as `generatedSoftwareGraph` and `readOnlyGeneratedTabs`.

Project settings may include `edgeRoutingMode` (`bezier`, `smooth-step`, or `straight`) and `nodeHandleMode` (`side` or `all-sides`). Missing values fall back to curved arrows with side handles so older project JSON files continue to load.

`Save local file` opens a centered format picker with three options:

- `Stickies project file`: the native JSON-backed `.stickies` format this flowchart app uses, preserving schema v1/v2 project data and metadata.
- `markdown`: a human-readable `.md` outline that is good to import into AI tools.
- `DOCX`: a plain human-readable Word document generated from the same outline.

Saved local filenames use this shape:

```txt
project-name.stickies
project-name.md
project-name.docx
```

Use `Save checkpoint` for an internal restore point. Use `Save local file` when you need a file outside this browser.

## Checkpoints

Checkpoints are saved inside the project file. A checkpoint includes:

- Snapshot ID.
- Label.
- Optional note.
- Created timestamp.
- Full project state without duplicating the snapshot list.

Checkpoint restore is planned future work. The current `Version history` menu lists saved checkpoints but does not restore them yet.

## Future Work

- Restore a saved checkpoint from `Version history` while keeping the current checkpoint history.

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

In editor mode, users can add planning items, create/rename/delete tabs, edit the active tab's stages from the left sidebar, switch the active tab between vertical stages and horizontal lanes, edit a selected item's title, note, status, and associations, duplicate/delete items, edit/delete selected edges, set edge line types, change arrow routing, change node handle placement, recompute arrows, hide/show the inspector, create checkpoints, open/save local files, and toggle MiniMap, Settings, and Presentation modes.

Generated software graph tabs keep generated contents read-only by default, so nodes and edges cannot be accidentally edited and the left-rail stage editor is hidden for those tabs. Node positions can still be adjusted in editor mode so generated graph layouts can be cleaned up without unlocking content edits. Existing planning tabs remain editable. The node and edge inspectors show software graph metadata when present, including kind, source path and line range, confidence, provenance source type, extractor, observed time, build ID, snapshot ID, and metadata summary.

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

Do not commit confidential project data into the repository unless the team has intentionally approved that. This includes [public/public/project.stickies](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/public/public/project.stickies) and the legacy fallback [public/public/project.json](/Users/jeremyguillory/Documents/vibecode-projects/SS%20React%20Flow%20Charts/public/public/project.json), which are sources for the public read-only viewer.

For internal planning data, use browser localStorage, `.stickies` import/export, or private Google Drive `.stickies` files. Do not use `Publish` for confidential projects; published Drive snapshots are intended to be public to anyone with the link.

## Known Limitations

- No login or shared database.
- No real-time collaboration.
- No mobile-first editing.
- No automatic layout engine.
- No real-time third-party sync beyond user-initiated Google Drive file actions.
- GitHub Pages workflow exists, but deployment is not proven until Actions runs.
