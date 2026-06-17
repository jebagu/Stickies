# Stickies Google Drive Picker Work Packages

## Source-code notes used for this package

The current Stickies app is a static Vite React app that stores current project state in browser `localStorage` and supports JSON import/export, with a GitHub Pages public read-only mode.

Relevant repo areas:

- `src/components/layout/FileMenu.tsx` owns New, Open local JSON, Close, Save snapshot, Publish, Export, and Version History.
- `src/state/projectStore.ts` already has the right lifecycle surface for this work, including `saveStatus`, `loadInitialProject`, `createNewProject`, `importProject`, `createSnapshot`, `restoreSnapshot`, and related project actions.
- `src/lib/storage.ts` currently persists only `project-planner:v1:current` and `project-planner:v1:last-opened` in localStorage.
- `src/components/ui/DialogProvider.tsx` already supports alert, confirm, prompt, and choice flows, so this package can use the current UX primitives instead of introducing a modal framework.

The Google side should use Google Identity Services for browser access tokens, not an app account system. Use the `drive.file` scope with Google Picker because it is narrow, per-file, and appropriate for Picker-based file access. Picker supports file MIME filtering and folder selection, which is exactly what this workflow needs. Drive multipart upload is the right upload method for small project files with metadata, and the Drive sharing dialog can be launched with `showSettingsDialog()` for saved Drive files.

Useful references:

- Google Identity Services overview: <https://developers.google.com/identity/oauth2/web/guides/overview>
- Drive API scopes: <https://developers.google.com/workspace/drive/api/guides/api-specific-auth>
- Google Picker overview: <https://developers.google.com/workspace/drive/picker/guides/overview>
- Picker selectable MIME types: <https://developers.google.com/workspace/drive/picker/reference/picker.pickerbuilder.setselectablemimetypes>
- Picker folder selection: <https://developers.google.com/workspace/drive/picker/reference/picker.docsview.setselectfolderenabled>
- Drive uploads: <https://developers.google.com/workspace/drive/api/guides/manage-uploads>
- Drive sharing dialog: <https://developers.google.com/workspace/drive/api/guides/share-button>

---

# Work Package 3: Simplified Google Drive Save Workflow

This package replaces the broken Google Picker-dependent save/folder path with a predictable Stickies-owned Drive workflow.

The intended user workflow is:

1. `Save to Drive` requests Google authorization only when Drive access is needed.
2. First save asks for a project filename.
3. If no remembered Stickies folder exists, the user sees `Create Stickies folder?` with copy equivalent to: `Stickies will create a folder named "Stickies" at the top level of My Drive and save this project there. Future Stickies files will use that folder automatically.`
4. After confirmation, Stickies creates a top-level `Stickies` folder in My Drive, remembers only non-sensitive folder metadata locally, and saves the `.stickies.json` file there.
5. First-save success shows one Drive file link, one copy action, one open action, and no duplicated raw URL text.
6. Future `Save to Drive` updates the current bound Drive file without asking for a folder.
7. `Open recent` is the preferred cloud-open workflow.
8. `Open by link/ID` is the fallback for files that are not in recents.
9. Google Picker folder selection and broad Drive browsing are not primary UX.
10. Existing manually created Drive folders may be supported only through an advanced pasted folder link/ID path, not through Drive search.
11. `Publish` creates a separate frozen public/read-only snapshot in the remembered Stickies folder and shows the shareable public viewer link.
12. Checkpoint restore is future work. The current `Version history` menu should list checkpoints without implying that restore is available.

Technical constraints:

- Keep OAuth at `https://www.googleapis.com/auth/drive.file`.
- Keep access tokens in memory only.
- Do not add a backend, app accounts, refresh-token storage, client secrets, realtime sync, or full Drive listing.
- Do not use Google Picker in the primary save or publish destination workflow.
- Preserve localStorage autosave, JSON import/export, Drive recents, and public Drive snapshot viewing.

---

# Work Package 1: PRD addendum, Google Drive Picker workflow

You are Codex working in the `jebagu/Stickies` repo.

Your first task is documentation-only. Do not implement Google Drive code yet. Add an addendum to `reactflow_project_planning_prd.md` describing the Google Drive Picker workflow. After that, commit the change and stop.

## Scope

Append a section near the persistence/import/export/public-sharing parts of the PRD. Title it:

`Addendum: Google Drive Picker Native File Workflow`

The addendum should say:

Stickies will remain a static browser app with no Stickies-owned user accounts. Google Drive is the user’s account, file system, storage layer, and sharing layer. The app is an editor for Stickies project files, not a hosted project database.

The primary user workflow is:

1. User can start blank immediately without Google authorization.
2. User can browse built-in examples without Google authorization.
3. User clicks `Open from Google Drive` when they want to open a cloud file.
4. Stickies requests Google authorization only at the moment Drive access is needed.
5. Google Picker opens as the user’s Drive-native file chooser.
6. User chooses a Stickies-compatible JSON file.
7. Stickies validates the project JSON using the existing validation path, then replaces the current project only after confirmation.
8. User clicks `Save to Google Drive` to update the currently bound Drive file.
9. If there is no currently bound Drive file, `Save to Google Drive` routes to `Save As to Google Drive`.
10. `Save As to Google Drive` asks for a file name and uses Google Picker folder selection to choose the destination folder.
11. Stickies creates a `.stickies.json` Drive file in the selected folder.
12. Existing browser localStorage autosave remains as a local recovery backup.
13. Drive save is explicit in the first implementation. Do not silently autosave every canvas move to Drive in this package.
14. `Share` opens Google’s Drive sharing dialog for the bound Drive file.
15. View-only Drive files should open read-only, with a visible `Save a copy` path.
16. Recently opened Drive files may be remembered locally, but Drive remains the source of truth.
17. No backend, password system, user profile, app-owned permission database, or custom cloud file browser is introduced.
18. Current local JSON import/export remains available.
19. Current GitHub public snapshot publishing remains available but is separate from Drive saving.
20. Public gallery and Drive UI `Open with Stickies` integration are deferred unless a later work package explicitly adds them.

Technical constraints to document:

- Use `https://www.googleapis.com/auth/drive.file`, not full Drive scope.
- Use Google Identity Services for access tokens.
- Use Google Picker for opening files and choosing save folders.
- Use Drive API `files.get`, `files.create`, and `files.update`.
- Use multipart upload for project JSON file creation and update.
- Keep access tokens in memory only.
- Do not put client secrets in the browser.
- Use Vite env variables for public Google client configuration.
- Drive files created by Stickies should use a clear filename suffix, preferably `.stickies.json`.
- Project JSON schema should remain compatible with existing `ProjectFile` validation.

## Acceptance gates

Run:

```bash
npm run typecheck
npm run build
```

Then commit:

```bash
git add reactflow_project_planning_prd.md
git commit -m "docs: add Google Drive Picker workflow addendum"
```

## Required Codex output footer

At the end of your response, include exactly this information:

```text
Done: Work Package 1, Slice 1/1 - PRD addendum for Google Drive Picker workflow
Human check: Open reactflow_project_planning_prd.md and confirm the new addendum clearly says there are no Stickies accounts, Drive is the file system, Picker is used for Open and folder selection, Save updates a bound Drive file, Save As creates a .stickies.json file, Share uses Google Drive sharing, localStorage remains a recovery backup, and public gallery/Open-with-Drive are deferred.
Next: Work Package 2 - Google Drive Picker Upgrade
Slices remaining: 7
```

Stop after the commit.

---

# Work Package 2: Google Drive Picker Upgrade

We’re going to do a new work package called **Google Drive Picker Upgrade**.

This package implements the PRD addendum in small slices. Commit after every slice. Do not skip acceptance gates. Do not combine slices unless the human explicitly says to.

## Global implementation rules

Before starting any slice:

```bash
git status --short
```

If the tree has unrelated human changes, do not overwrite them. Preserve current behavior unless the slice explicitly changes it.

Use the existing architecture:

- Keep `projectStore.ts` as the owner of project lifecycle state.
- Keep localStorage autosave intact.
- Keep local JSON import/export intact.
- Keep GitHub Publish intact.
- Use the existing `DialogProvider` for simple alert, confirm, prompt, and choice flows where possible.
- Add custom UI only when the existing dialog primitives are insufficient.
- Do not add a backend.
- Do not add app accounts.
- Do not add full Drive scope.
- Do not add refresh-token storage.
- Do not add a Google client secret.
- Do not add a public gallery in this package.
- Do not remove current GitHub Pages public snapshot behavior.

Use these env variables:

```text
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_API_KEY
VITE_GOOGLE_APP_ID
```

Add `.env.example` if it does not exist.

Use this scope:

```text
https://www.googleapis.com/auth/drive.file
```

Use these file conventions:

```ts
const STICKIES_DRIVE_MIME = "application/vnd.jebagu.stickies+json";
const LEGACY_JSON_MIME = "application/json";
const STICKIES_FILE_SUFFIX = ".stickies.json";
```

Created Drive files should use the custom MIME if it works cleanly with Picker and Drive download. Opening should accept both the custom MIME and normal JSON, then validate the file body with the existing project validation/import path.

## Required Codex output footer for every implementation slice

At the end of every slice response, include:

```text
Done: Work Package 2, Slice X/7 - <slice name>
Human check: <specific manual check that a human should perform>
Next: Work Package 2, Slice Y/7 - <next slice name>
Slices remaining: <number>
```

For Slice 7, use:

```text
Next: None, Google Drive Picker Upgrade complete
Slices remaining: 0
```

---

## Slice 1/7: Drive configuration, script loaders, and disabled UI placeholders

### Goal

Add the configuration and loading foundation without trying to open Google Drive yet.

### Tasks

1. Add a Drive config module, probably `src/lib/googleDrive/config.ts`, exposing:
   - `GOOGLE_DRIVE_SCOPE`
   - `STICKIES_DRIVE_MIME`
   - `LEGACY_JSON_MIME`
   - `STICKIES_FILE_SUFFIX`
   - `getGoogleDriveConfig()`
   - `isGoogleDriveConfigured()`

2. Add a small script loader utility, probably `src/lib/loadScript.ts`, that:
   - Loads external scripts once.
   - Reuses the same Promise for repeated calls.
   - Rejects with a useful error if loading fails.

3. Add TypeScript global declarations for the minimum Google globals used later:
   - `window.google`
   - `window.gapi`
   - Do not over-type the entire Google API. Keep this intentionally small and expand later when actual calls are added.

4. Add `.env.example` with:

```text
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_API_KEY=
VITE_GOOGLE_APP_ID=
```

5. Add File menu placeholders:
   - `Open from Google Drive`
   - `Save to Google Drive`
   - `Save As to Google Drive`
   - `Share Drive File`

   If Google env vars are missing, these should either be disabled or show a clear alert:

```text
Google Drive is not configured. Add VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY, and VITE_GOOGLE_APP_ID to .env.local.
```

6. Keep existing menu items, but rename current `Open` to `Open local JSON` and current `Save` to `Save Snapshot`. Do not remove their behavior.

### Acceptance gates

Run:

```bash
npm run typecheck
npm run build
```

Commit:

```bash
git add .
git commit -m "feat(drive): add Google Drive configuration placeholders"
```

### Human check

Run the app without Google env vars. Open the File menu. Confirm:

- Existing local actions still work.
- The old `Open` is now clearly `Open local JSON`.
- The old `Save` is now clearly `Save Snapshot`.
- Drive actions are visible but do not pretend to work when env is missing.
- Clicking a Drive action gives a useful setup message, not a crash or silent no-op.

Required footer:

```text
Done: Work Package 2, Slice 1/7 - Drive configuration, script loaders, and disabled UI placeholders
Human check: Run the app without Google env vars, open File, verify local New/Open local JSON/Save Snapshot/Export still work, and verify each Drive action is visible but safely blocked with a clear missing-config message.
Next: Work Package 2, Slice 2/7 - Google authorization and Picker open flow
Slices remaining: 6
```

---

## Slice 2/7: Google authorization and Picker open flow

### Goal

Let the user open an existing Stickies-compatible Drive file using Google Picker.

### Tasks

1. Add `src/lib/googleDrive/auth.ts`:
   - Dynamically load Google Identity Services.
   - Use `google.accounts.oauth2.initTokenClient`.
   - Request only `drive.file`.
   - Return an access token.
   - Keep the token in memory only.
   - Refresh by requesting a new token when Drive calls fail with auth errors.

2. Add `src/lib/googleDrive/picker.ts`:
   - Dynamically load `https://apis.google.com/js/api.js`.
   - Load Picker.
   - Build an open-file Picker.
   - Filter/select compatible MIME types:
     - `application/vnd.jebagu.stickies+json`
     - `application/json`
   - Include folders for navigation.
   - Return picked file ID, name, MIME type, and any available metadata.

3. Add `src/lib/googleDrive/driveClient.ts` with enough functionality to:
   - `getFileMetadata(fileId, accessToken)`
   - `downloadFileText(fileId, accessToken)`
   - Request fields including:
     - `id`
     - `name`
     - `mimeType`
     - `modifiedTime`
     - `version`
     - `webViewLink`
     - `capabilities/canEdit`
     - `capabilities/canShare`
     - `capabilities/canDownload`

4. Add a text parsing path in `exportImport.ts` or a new helper:
   - Do not duplicate validation logic.
   - Reuse the same project validation used by local JSON import.
   - Add `parseProjectJsonText(text, sourceName)` if needed.
   - Make `parseProjectJsonFile` call the text helper to avoid drift.

5. Wire `File > Open from Google Drive`:
   - Request Drive token.
   - Open Picker.
   - Download selected file text.
   - Validate.
   - Confirm before replacing current project.
   - Import into store.
   - Keep localStorage autosave behavior.
   - Store a Drive file handle in state, but do not implement save/update yet.
   - If validation fails, show a clear `Open from Google Drive failed` alert.

### Acceptance gates

Run:

```bash
npm run typecheck
npm run build
npm run test:imports
```

Commit:

```bash
git add .
git commit -m "feat(drive): open Drive files with Google Picker"
```

### Human check

Use a real Google Cloud OAuth client and API key in `.env.local`. Create or upload a valid Stickies JSON file into Drive. Start the app, choose `File > Open from Google Drive`, complete Google consent, pick the file, and confirm:

- Picker opens as a Google Drive file chooser.
- The app does not request full Drive access.
- Picking a valid Stickies JSON replaces the current project after confirmation.
- Picking a non-Stickies JSON gives a validation error and does not destroy the current project.
- The browser console has no unhandled promise rejection.

Required footer:

```text
Done: Work Package 2, Slice 2/7 - Google authorization and Picker open flow
Human check: With real Google env vars, open a valid Stickies JSON from Drive through Picker, confirm the project loads after confirmation, then try a random JSON file and confirm the current project is preserved with a validation error.
Next: Work Package 2, Slice 3/7 - Save As to Google Drive with folder Picker
Slices remaining: 5
```

---

## Slice 3/7: Save As to Google Drive with folder Picker

### Goal

Let the user create a new Drive file in a user-selected Drive folder.

### Tasks

1. Add folder Picker support:
   - Function: `pickDriveFolder(accessToken): Promise<DriveFolderPick | null>`
   - Use Picker folder selection, not a custom folder browser.
   - Return folder ID and folder name when available.

2. Add Drive file creation:
   - Function: `createStickiesDriveFile(accessToken, folderId, name, project)`
   - Use multipart upload.
   - File name must end with `.stickies.json`.
   - Metadata should include:
     - `name`
     - `mimeType`
     - `parents`
     - `appProperties` with `app: "stickies"` and `schemaVersion`.
   - Body is pretty-printed project JSON.

3. Wire `File > Save As to Google Drive`:
   - Prompt for file name, defaulting from `project.projectName`.
   - Let the user choose destination folder with Picker.
   - Create the Drive file.
   - Bind the returned Drive file handle into project store state.
   - Show a success alert with file name and, if available, a Google Drive link.
   - Add useful error handling.

4. Keep local Export as a separate action. Do not make `Export` save to Drive.

### Acceptance gates

Run:

```bash
npm run typecheck
npm run build
```

Commit:

```bash
git add .
git commit -m "feat(drive): save copies to Google Drive"
```

### Human check

Create a blank project, add one item with a distinctive title, then use `File > Save As to Google Drive`. In Picker, select a specific Drive folder. After save:

- Open that folder in Google Drive and confirm the file exists there.
- Confirm the filename ends with `.stickies.json`.
- Download the file or open it as text and confirm the distinctive item title is in the JSON.
- Refresh Stickies and use `Open from Google Drive` to open that saved file.
- Confirm the file loads as the same chart.

Required footer:

```text
Done: Work Package 2, Slice 3/7 - Save As to Google Drive with folder Picker
Human check: Save a new chart to a specific Drive folder, verify the .stickies.json file appears in that folder, inspect/download it to confirm it contains the edited chart JSON, then reopen it through Picker.
Next: Work Package 2, Slice 4/7 - Bound Drive save and visible cloud status
Slices remaining: 4
```

---

## Slice 4/7: Bound Drive save and visible cloud status

### Goal

Make `Save to Google Drive` update the currently bound Drive file and make Drive binding visible.

### Tasks

1. Extend project store state with cloud file state:
   - `cloudFile`
   - `cloudSaveStatus`
   - `cloudError`
   - `lastCloudSavedAt`
   - actions such as:
     - `setCloudFile`
     - `clearCloudFile`
     - `setCloudSaveStatus`
     - `setCloudError`
   - Do not put Drive file IDs inside exported `ProjectFile` JSON.

2. Persist the current Drive file handle separately in localStorage:
   - New key, for example `project-planner:v1:current-drive-file`.
   - Clear it when starting a new local project, closing project, or opening local JSON.
   - Restore it on app boot only when it corresponds to the current browser-local recovery project.
   - Be conservative. If in doubt, clear stale binding rather than silently updating the wrong Drive file.

3. Add Drive file update:
   - Function: `updateStickiesDriveFile(accessToken, fileId, project, expectedVersion?)`
   - Use multipart upload or an appropriate Drive update flow.
   - Refresh metadata after update.
   - If metadata says `canEdit === false`, do not attempt update.

4. Wire `File > Save to Google Drive`:
   - If no bound Drive file, call Save As flow.
   - If bound and editable, update existing Drive file.
   - If bound but read-only, block with a `Save a copy` path.
   - Set cloud status:
     - `saving`
     - `saved`
     - `error`
     - `read-only`

5. Add visible status in `TopBar`:
   - Show current project name or Drive file name.
   - Show `Local draft`, `Saved to Drive`, `Saving to Drive`, `Drive save failed`, or `View-only Drive file`.
   - Do not clutter the canvas.

6. Rename local save indicators if needed so the user can distinguish:
   - Local browser recovery save.
   - Manual Drive save.

### Acceptance gates

Run:

```bash
npm run typecheck
npm run build
```

Commit:

```bash
git add .
git commit -m "feat(drive): update bound Drive files"
```

### Human check

Open a Drive-saved Stickies file. Add a distinctive item or rename a tab. Click `Save to Google Drive`. Then:

- Reload the browser.
- Open the same Drive file again through Picker.
- Confirm the edit is present.
- In Google Drive, check the file’s modified time changed.
- Confirm the top bar clearly tells you whether the chart is a local draft or saved to Drive.
- Confirm `Save Snapshot` still creates an internal snapshot and is not confused with Drive saving.

Required footer:

```text
Done: Work Package 2, Slice 4/7 - Bound Drive save and visible cloud status
Human check: Edit a Drive-bound chart, click Save to Google Drive, reopen the same Drive file through Picker, verify the edit persisted, and check the top bar clearly distinguishes local draft, saving, saved, error, and view-only states.
Next: Work Package 2, Slice 5/7 - Drive sharing dialog and read-only guard
Slices remaining: 3
```

---

## Slice 5/7: Drive sharing dialog and read-only guard

### Goal

Use Google Drive sharing instead of a custom permissions system, and prevent users from editing files they cannot save.

### Tasks

1. Add `src/lib/googleDrive/share.ts`:
   - Dynamically load `gapi`.
   - Load `drive-share`.
   - Create `gapi.drive.share.ShareClient`.
   - Set OAuth token.
   - Set current Drive file ID.
   - Open `showSettingsDialog()`.

2. Wire `File > Share Drive File`:
   - If no bound Drive file, explain that the chart must be saved to Drive first.
   - If bound but `canShare === false`, explain the user does not have sharing permission.
   - Otherwise open Google’s sharing dialog.
   - If sharing dialog fails, show an actionable alert. If `webViewLink` exists, include it as copyable text.

3. Strengthen read-only handling:
   - If `getFileMetadata` says `canEdit === false`, set `cloudSaveStatus` to `read-only`.
   - Prevent editing if the current project was opened from a read-only Drive file.
   - Reuse existing public/read-only patterns where sensible, but do not confuse public snapshot mode with Drive read-only mode.
   - Show a banner or top-bar state: `View-only Drive file`.
   - Provide `Save As to Google Drive` as the escape hatch.

4. Do not build custom invite emails, custom link permissions, or custom public gallery submission in this slice.

### Acceptance gates

Run:

```bash
npm run typecheck
npm run build
```

Commit:

```bash
git add .
git commit -m "feat(drive): add Drive sharing dialog"
```

### Human check

Open a Drive-bound file that you own. Click `Share Drive File` and confirm Google’s native sharing dialog opens for that exact file. Then use a second Google account or a file shared view-only to test read-only behavior:

- The file opens.
- Editing controls are blocked or clearly disabled.
- The user is told it is view-only.
- `Save to Google Drive` does not pretend to save.
- `Save As to Google Drive` lets the user make an editable copy.

Required footer:

```text
Done: Work Package 2, Slice 5/7 - Drive sharing dialog and read-only guard
Human check: Open a Drive file you own and verify the native Google sharing dialog opens for that file, then open a view-only shared file and verify editing/save are blocked while Save As remains available.
Next: Work Package 2, Slice 6/7 - Recent Drive files and driveFileId link opener
Slices remaining: 2
```

---

## Slice 6/7: Recent Drive files and `driveFileId` link opener

### Goal

Make the Picker workflow feel convenient without building a custom cloud file manager.

### Tasks

1. Add local recent Drive files:
   - New localStorage key, for example `project-planner:v1:drive-recents`.
   - Store up to 10 recent Drive files.
   - Store:
     - file ID
     - name
     - modified time
     - webViewLink if available
     - last opened timestamp
   - Do not store access tokens.
   - Do not store project JSON in recents.

2. Update recents when:
   - Opening a Drive file succeeds.
   - Saving As creates a Drive file.
   - Saving a bound Drive file succeeds and metadata changes.

3. Add `File > Open recent Drive file`:
   - Use existing `dialog.choose` if possible.
   - Selecting a recent file should request token, fetch metadata, download, validate, confirm replace, then import.
   - If access fails, show a clear message and remove or mark stale only after user confirmation.

4. Add `?driveFileId=<id>` support:
   - On app boot, detect the query param.
   - Do not trigger an OAuth popup without a user gesture if browser behavior blocks it.
   - Show a small modal or banner:
     - `Open shared Drive file?`
     - Buttons: `Open from Google Drive`, `Dismiss`
   - On click, request token, fetch metadata, download, validate, import.
   - Preserve resource-key handling as a later TODO unless the URL includes enough data to support it cleanly.

5. Keep this distinct from Google Drive UI `Open with` integration. That is not part of this package.

### Acceptance gates

Run:

```bash
npm run typecheck
npm run build
```

Commit:

```bash
git add .
git commit -m "feat(drive): add Drive recents and file links"
```

### Human check

Open two different Drive files through Picker. Then:

- Open File menu and confirm both appear in `Open recent Drive file`.
- Reopen one from the recent list and confirm it loads without using the full Picker.
- Manually visit `/Stickies/?driveFileId=<actual-file-id>`.
- Confirm the app shows a clear open prompt instead of immediately forcing OAuth.
- Click the prompt and confirm the Drive file loads.
- Try a bad file ID and confirm the app fails gracefully without replacing the current project.

Required footer:

```text
Done: Work Package 2, Slice 6/7 - Recent Drive files and driveFileId link opener
Human check: Open two Drive files, verify they appear in Open recent Drive file, reopen one from the recent list, then manually test /Stickies/?driveFileId=<id> for both a real file and a bad file ID.
Next: Work Package 2, Slice 7/7 - Documentation, tests, and final polish
Slices remaining: 1
```

---

## Slice 7/7: Documentation, tests, and final polish

### Goal

Make the feature maintainable for a beginner programmer and safe to ship.

### Tasks

1. Update `README.md`:
   - Add Google Drive Picker setup.
   - Explain required Google Cloud configuration at a practical level:
     - OAuth client ID for web app.
     - API key.
     - Picker/Drive API enabled.
     - Authorized JavaScript origins for local dev and deployed GitHub Pages.
     - `.env.local` variables.
   - Explain that Stickies does not create accounts.
   - Explain that Drive files remain in the user’s Google Drive.
   - Explain that localStorage remains a recovery backup.
   - Explain that `drive.file` is intentionally narrow.
   - Explain that full real-time collaboration is not included.

2. Add lightweight tests where practical:
   - Parsing text helper still validates existing imports.
   - File name helper appends `.stickies.json` exactly once.
   - Recent list helper caps at 10 and deduplicates by file ID.
   - Drive config helper reports missing config.
   - Do not try to test Google OAuth itself in Node.

3. Audit UX strings:
   - No “login” language unless referring to Google’s own consent window.
   - Prefer `Connect to Google Drive`, `Open from Google Drive`, `Save to Google Drive`.
   - Error messages should tell the user what to do next.

4. Run a repo-wide check for accidental secrets:
   - No client ID values committed.
   - No API key values committed.
   - No access token persistence.
   - No full Drive scope.

5. Verify old flows:
   - Local New.
   - Open local JSON.
   - Export native/Markdown/DOCX.
   - Save Snapshot.
   - Version History.
   - Publish.

### Acceptance gates

Run:

```bash
npm run test:imports
npm run typecheck
npm run build
git grep -n "https://www.googleapis.com/auth/drive\"\\|refresh_token\\|access_token.*localStorage\\|client_secret" -- . ':!package-lock.json'
```

The `git grep` command may return references in explanatory docs if they are clearly warnings. It must not reveal committed secrets or code that stores tokens in localStorage.

Commit:

```bash
git add .
git commit -m "docs(drive): document Google Drive Picker setup"
```

### Human check

Do a full smoke test:

- Start with no `.env.local` and confirm the app still works locally and Drive actions are safely blocked.
- Add `.env.local` and confirm Drive actions appear functional.
- Open from Drive.
- Save As to Drive.
- Edit and Save to Drive.
- Share.
- Reopen from recent.
- Open via `?driveFileId=`.
- Confirm Export still downloads a local file.
- Confirm Publish still uses the existing GitHub snapshot flow and was not converted into Drive behavior.

Required footer:

```text
Done: Work Package 2, Slice 7/7 - Documentation, tests, and final polish
Human check: Run the app once without Google env vars and once with them, then smoke test Open from Drive, Save As, Save, Share, recent files, ?driveFileId=, local Export, Save Snapshot, Version History, and existing Publish.
Next: None, Google Drive Picker Upgrade complete
Slices remaining: 0
```

---

# One important implementation note for Codex

Do not let `Save to Google Drive` overwrite the wrong file after a local import or `New`. Clearing the Drive binding on local-only lifecycle actions is critical. The safest rule is:

- Opening from Drive binds the current project to that Drive file.
- Save As to Drive binds the current project to the newly created Drive file.
- New local project clears the binding.
- Close project clears the binding.
- Open local JSON clears the binding.
- Public snapshot copy starts as an unbound local draft.
- Export never changes the binding.
- Save Snapshot never changes the binding.

That rule prevents the worst user-facing failure: opening a local draft and accidentally overwriting an unrelated Drive file.
