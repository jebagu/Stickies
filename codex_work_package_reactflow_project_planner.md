# Codex Work Package: Build the React Flow Project Planning MVP

Status: Ready for implementation  
Audience: Codex or developer agent  
Target repository: new or existing Vite React repository  
Last updated: 2026-06-12

## 1. Mission

Build a beginner-maintainable React Flow project-planning app based on the PRD.

The app should be a clean internal planning canvas for a nontechnical team. It should support tabs, workstreams, people, project nodes, dependency edges, stage bands, filters, local persistence, snapshots, JSON import/export, and theme switching.

Do not build a generic React Flow playground. Hide technical React Flow configuration from the user.

## 2. Implementation posture

Treat this as an MVP with polish, not a large enterprise system.

Make practical choices. Do not pause for product questions unless something blocks compilation. Prefer a working, readable implementation over abstract architecture.

If the repository is empty, create the app from scratch using Vite, React, TypeScript, React Flow, Tailwind, and localStorage persistence.

If the repository already exists, inspect it first and adapt to its conventions.

## 3. Primary docs to use

Use current official docs where needed:

- React Flow quick start: https://reactflow.dev/learn
- React Flow save and restore: https://reactflow.dev/examples/interaction/save-and-restore
- React Flow theming: https://reactflow.dev/learn/customization/theming
- React Flow examples: https://reactflow.dev/examples
- React Flow performance: https://reactflow.dev/learn/advanced-use/performance
- Tailwind with Vite: https://tailwindcss.com/docs/installation/using-vite
- Vite static deployment: https://vite.dev/guide/static-deploy
- GitHub Pages publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- OpenAI Codex docs: https://developers.openai.com/codex
- Codex AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md

## 4. Non-negotiable requirements

The MVP must include:

- Vite React TypeScript app.
- React Flow canvas using `@xyflow/react`.
- Tailwind styling.
- Custom planning node.
- Custom stage band node.
- Custom planning edge.
- Multiple tabs.
- Workstreams and people.
- Node inspector panel.
- Edge inspector panel.
- Node creation, editing, deletion, duplication.
- Edge creation, editing, deletion.
- Tab creation, renaming, deletion.
- Stage bands on each tab.
- Search and filters.
- Theme switcher with clean-light, clean-dark, and neon-dark.
- Presentation Mode.
- localStorage auto-save.
- Manual snapshots and restore.
- Export project JSON.
- Import project JSON.
- GitHub Pages deployment workflow.
- README for a beginner developer.

## 5. Explicit non-goals

Do not implement these:

- Login.
- Backend database.
- Real-time collaboration.
- Notifications.
- Role-based permissions.
- Third-party integrations.
- Budget tracking.
- Time tracking.
- AI features.
- Complex auto-layout as a default behavior.
- A React Flow props playground.
- Exposing raw JSON editor in the normal UI.
- Per-node arbitrary CSS editing.

## 6. Dependency choices

Use:

- `vite`
- `react`
- `react-dom`
- `typescript`
- `@xyflow/react`
- `tailwindcss`
- `@tailwindcss/vite`
- `zustand`
- `lucide-react`
- `nanoid`
- `clsx`

Avoid shadcn/ui in the MVP unless the repository already uses it. The MVP can use simple custom Tailwind components.

Use current package versions from npm at implementation time. Do not pin outdated versions.

## 7. Package scripts

Add or preserve these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b"
  }
}
```

If linting is already configured, keep it. If not, do not spend excessive time adding a complex lint stack. A successful TypeScript build is required.

## 8. Recommended file structure

Create or adapt this structure:

```txt
src/
  main.tsx
  App.tsx
  index.css

  components/
    canvas/
      PlanningCanvas.tsx
      PlanningNode.tsx
      PlanningEdge.tsx
      StageBandNode.tsx
      CanvasControls.tsx
    layout/
      AppShell.tsx
      TopBar.tsx
      LeftSidebar.tsx
      RightInspector.tsx
      TabBar.tsx
    inspectors/
      NodeInspector.tsx
      EdgeInspector.tsx
      TabInspector.tsx
    ui/
      Button.tsx
      Input.tsx
      Select.tsx
      Textarea.tsx
      Modal.tsx
      Badge.tsx
      Toggle.tsx

  data/
    seedProject.ts

  lib/
    exportImport.ts
    filters.ts
    flow.ts
    storage.ts
    theme.ts
    validation.ts

  state/
    projectStore.ts

  types/
    planning.ts

  utils/
    id.ts
    dates.ts
```

Add:

```txt
.github/
  workflows/
    deploy.yml

README.md
AGENTS.md
```

## 9. Codex instruction file

Create `AGENTS.md` at the repository root with this content or equivalent:

```md
# AGENTS.md

## Project

This is a Vite React TypeScript app for an internal React Flow project-planning canvas.

## Working rules

- Keep the UI simple for nontechnical users.
- Do not expose raw React Flow prop playgrounds or developer-only controls.
- Prefer readable, beginner-maintainable code over clever abstractions.
- Use TypeScript types for project data.
- Keep colors theme-token-based. Do not scatter hardcoded colors throughout components.
- Use localStorage and JSON import/export for v1 persistence.
- Do not add backend services, authentication, or real-time collaboration unless explicitly requested.
- After code changes, run `npm run build`.
- If changing data model code, update seed data and validation.
- If changing user-facing behavior, update README.
```

## 10. Data types

Implement these types in `src/types/planning.ts`.

```ts
export type NodeKind =
  | "task"
  | "milestone"
  | "decision"
  | "risk"
  | "question"
  | "note"
  | "deliverable";

export type NodeStatus =
  | "idea"
  | "defined"
  | "owner_assigned"
  | "in_progress"
  | "blocked"
  | "ready"
  | "done"
  | "parked";

export type Priority = "P0" | "P1" | "P2";
export type Confidence = "low" | "medium" | "high";
export type RelationType = "hard_dependency" | "soft_dependency" | "related";
export type ThemeId = "clean-light" | "clean-dark" | "neon-dark";
export type TabOrientation = "vertical" | "horizontal";

export type ProjectFile = {
  schemaVersion: 1;
  projectName: string;
  activeTabId: string;
  people: Person[];
  workstreams: Workstream[];
  tags: Tag[];
  tabs: PlanningTab[];
  snapshots: Snapshot[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
};

export type Person = {
  id: string;
  name: string;
  initials: string;
  role?: string;
  organization?: string;
};

export type Workstream = {
  id: string;
  name: string;
  description?: string;
  defaultOwnerIds?: string[];
  colorToken?: string;
};

export type Tag = {
  id: string;
  label: string;
  colorToken?: string;
};

export type PlanningTab = {
  id: string;
  name: string;
  description?: string;
  orientation: TabOrientation;
  stages: Stage[];
  nodes: AppNode[];
  edges: AppEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  filters?: TabFilters;
};

export type Stage = {
  id: string;
  name: string;
  order: number;
  description?: string;
  colorToken?: string;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type PlanningNodeData = {
  title: string;
  kind: NodeKind;
  status: NodeStatus;
  ownerIds: string[];
  supporterIds?: string[];
  workstreamId?: string;
  tagIds?: string[];
  stageId?: string;
  priority?: Priority;
  targetDate?: string;
  confidence?: Confidence;
  notes?: string;
  links?: PlanningLink[];
  createdAt: string;
  updatedAt: string;
};

export type StageBandData = {
  title: string;
  stageId: string;
  orientation: TabOrientation;
  locked: boolean;
  colorToken?: string;
};

export type AppNodeData = PlanningNodeData | StageBandData;

export type AppNode = {
  id: string;
  type: "planningNode" | "stageBand";
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  data: AppNodeData;
  draggable?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  zIndex?: number;
};

export type AppEdge = {
  id: string;
  source: string;
  target: string;
  type: "planningEdge";
  data: {
    relation: RelationType;
    label?: string;
    notes?: string;
    highlighted?: boolean;
  };
};

export type PlanningLink = {
  id: string;
  label: string;
  url: string;
};

export type Snapshot = {
  id: string;
  label: string;
  note?: string;
  createdAt: string;
  project: Omit<ProjectFile, "snapshots">;
};

export type ProjectSettings = {
  themeId: ThemeId;
  showMiniMap: boolean;
  adminMode: boolean;
  presentationMode: boolean;
};

export type TabFilters = {
  query?: string;
  ownerIds?: string[];
  workstreamIds?: string[];
  statuses?: NodeStatus[];
  priorities?: Priority[];
  blockedOnly?: boolean;
  unassignedOnly?: boolean;
  orphansOnly?: boolean;
  hideRelatedEdges?: boolean;
};
```

If React Flow's exported `Node` and `Edge` generics are convenient, wrap or extend them, but keep the app-level type names above.

## 11. Seed data

Implement `src/data/seedProject.ts`.

Seed people:

- Jeremy
- Mez
- Nicholas
- Alexander
- Ed
- GOH
- DNK
- Capital
- Stoneweg
- Kierkegaard
- Ollie Morgan

Seed tabs:

- Overall Project
- Workstreams
- Audio
- Structure
- Operations: TopCo
- Operations: Co-Ops
- Experience Design
- Show Music Production
- Labs
- Legal
- Ticketing
- Orphans / Parking Lot

Seed workstreams:

- Venue
- Delivery of Physical Sphere
- Delivery of Sound System
- Acoustics Consultant
- Operations
- Ticketing
- Show Music Production
- Labs
- Legal
- Experience Design

Seed stages for every tab:

- Discovery
- Strategy / Decisions
- Partner Confirmation
- Design
- Production
- Delivery / Install
- Live Operations
- Post-Experience

Seed example nodes across tabs. Include at least:

- Confirm venue owner and decision maker.
- Confirm commercial structure.
- Define physical sphere scope.
- Confirm fabrication requirements.
- Define sound system specification.
- Confirm speaker layout.
- Confirm acoustics consultant scope.
- Define operating model.
- Define partner interface model.
- Choose ticketing platform.
- Define ticket tiers.
- Identify artists.
- Develop artist workflow.
- Define Atmos engineer workflow.
- Evaluate Ollie Morgan as possible Atmos engineer.
- Create technical content development process.
- Prepare tier-one artist content-production answer.
- Define lab intake workflow.
- Define lab-to-main-show escalation path.
- Define artist agreement template.
- Confirm IP and music-rights approach.
- Map pre-arrival experience.
- Design queue and line experience.
- Define seating model.
- Define lighting design requirements.
- Define food and beverage concept.
- Define post-experience flow.

Seed some edges:

- Confirm venue owner and decision maker -> Confirm commercial structure.
- Confirm commercial structure -> Define operating model.
- Define physical sphere scope -> Confirm fabrication requirements.
- Define sound system specification -> Confirm speaker layout.
- Confirm acoustics consultant scope -> Define sound system specification.
- Identify artists -> Develop artist workflow.
- Define Atmos engineer workflow -> Create technical content development process.
- Create technical content development process -> Prepare tier-one artist content-production answer.
- Choose ticketing platform -> Define ticket tiers.
- Define operating model -> Design queue and line experience.
- Define seating model -> Define lighting design requirements.

Not every seed item needs a dependency. Leave some orphans.

## 12. State management

Use Zustand in `src/state/projectStore.ts`.

State should include:

- `project`
- `activeTabId`
- `selectedElement`
- `filters`
- `saveStatus`
- `lastSavedAt`

Actions should include:

- `loadInitialProject`
- `setActiveTab`
- `createTab`
- `renameTab`
- `deleteTab`
- `updateTab`
- `createNode`
- `updateNode`
- `deleteNode`
- `duplicateNode`
- `createEdge`
- `updateEdge`
- `deleteEdge`
- `applyNodesChange`
- `applyEdgesChange`
- `setViewport`
- `setFilters`
- `clearFilters`
- `createSnapshot`
- `restoreSnapshot`
- `exportProject`
- `importProject`
- `setTheme`
- `toggleAdminMode`
- `togglePresentationMode`
- `toggleMiniMap`

Use React Flow's change utilities if useful. Keep state updates immutable and readable.

## 13. Persistence

Implement `src/lib/storage.ts`.

Use localStorage keys:

- `project-planner:v1:current`
- `project-planner:v1:last-opened`

Required behavior:

- On app start, load saved project from localStorage if valid.
- If nothing is saved, load seed project.
- Auto-save after meaningful project changes.
- Show save status in top bar: saved, saving, unsaved, error.
- On JSON import, validate before replacing current project.
- On snapshot restore, replace project with the snapshot project and keep the snapshot list.

Implement `src/lib/validation.ts`.

Validation can be simple:

- Object exists.
- `schemaVersion === 1`.
- `projectName` is string.
- `tabs` is an array.
- Each tab has nodes and edges arrays.
- Unknown extra fields are allowed.
- Invalid imported files should show a helpful error.

## 14. Export and import

Implement `src/lib/exportImport.ts`.

Export:

- Create a JSON blob.
- Filename format: `project-planner-YYYY-MM-DD-HHmm.json`.
- Download automatically.

Import:

- Accept `.json`.
- Parse file.
- Validate.
- Replace current project after confirmation.
- Show error if parsing or validation fails.

## 15. React Flow implementation

Implement `PlanningCanvas.tsx`.

Use:

- `ReactFlow`
- `Background`
- `Controls`
- `MiniMap`
- `Panel` if useful.
- Custom node types:
  - `planningNode`
  - `stageBand`
- Custom edge type:
  - `planningEdge`

Behavior:

- Controlled nodes and edges from active tab.
- `onNodesChange` updates active tab nodes.
- `onEdgesChange` updates active tab edges.
- `onConnect` creates a `planningEdge` with relation `hard_dependency`.
- `onNodeClick` selects node and opens inspector.
- `onEdgeClick` selects edge and opens inspector.
- `onPaneClick` clears selection.
- `onMoveEnd` saves viewport to active tab.
- Stage band nodes should sit behind planning nodes.
- Stage band nodes should be locked by default unless Admin Mode is on.
- Use `fitView` on first load.

Important:

- Do not mutate project data directly.
- Do not store React component functions inside project JSON.
- Do not include sensitive data in the static bundle beyond approved seed data.
- Keep custom node components memoized if straightforward.

## 16. Planning node UI

Implement `PlanningNode.tsx`.

Node card should show:

- Kind badge.
- Title.
- Status badge.
- Owner initials.
- Workstream pill or left color stripe.
- Target date or stage.
- Blocked indicator if status is `blocked`.

Node card should support:

- Source and target handles.
- Selected visual state.
- Compact clean styling.
- Light/dark/neon theme compatibility.

Do not show the entire notes field on the card.

## 17. Stage band UI

Implement `StageBandNode.tsx`.

Stage band should show:

- Stage title.
- Optional stage description.
- Subtle background.
- Border or header line.
- Locked appearance unless Admin Mode is active.

For v1:

- Stage bands should be pre-created in each tab.
- Admin Mode controls whether they are draggable/selectable.
- Normal users should not accidentally move stage bands.

## 18. Planning edge UI

Implement `PlanningEdge.tsx`.

Style by relation:

- Hard dependency: solid.
- Soft dependency: dashed.
- Related: thin/muted.
- Highlighted: accent color, optional animation.

Use edge labels only when `data.label` exists. Keep labels small.

Do not animate every edge.

## 19. App layout

Implement `AppShell.tsx`.

Normal mode:

- Top bar.
- Tab bar.
- Left sidebar.
- Canvas.
- Right inspector.

Presentation Mode:

- Hide left sidebar.
- Hide right inspector.
- Hide most editing controls.
- Keep tab bar, canvas, theme switcher, and exit button.

Use responsive behavior:

- Desktop first.
- On narrow screens, allow sidebars to collapse.
- It is acceptable if mobile editing is limited in v1.

## 20. Top bar

Implement `TopBar.tsx`.

Include:

- Project name.
- Active tab name.
- Save status.
- Theme selector.
- Import button.
- Export button.
- Save Snapshot button.
- Version History button.
- MiniMap toggle.
- Admin Mode toggle.
- Presentation Mode toggle.

Use confirmation modals for destructive or major actions.

## 21. Tab bar

Implement `TabBar.tsx`.

Features:

- Switch active tab.
- Add tab.
- Rename tab.
- Delete tab with confirmation.
- Prevent deleting the last tab.

When creating a tab:

- Add default stages.
- Add default stage bands.
- Start with empty planning nodes and edges.

## 22. Left sidebar

Implement `LeftSidebar.tsx`.

Include:

- Add Task.
- Add Milestone.
- Add Decision.
- Add Risk.
- Add Question.
- Add Note.
- Add Deliverable.
- Add Tab.
- Search input.
- Filter controls.

When adding a node:

- Place it near center of current viewport if possible.
- Otherwise place it at a default coordinate in the active tab.
- Select it after creation.
- Open the node inspector.

## 23. Right inspector

Implement `RightInspector.tsx` with subcomponents:

- `NodeInspector`
- `EdgeInspector`
- `TabInspector`

Node inspector fields:

- Title.
- Type.
- Status.
- Owners.
- Supporters.
- Workstream.
- Tags.
- Stage.
- Priority.
- Target date.
- Confidence.
- Notes.
- Links.
- Duplicate.
- Delete.

Edge inspector fields:

- Relationship type.
- Label.
- Notes.
- Highlighted toggle.
- Delete.

Tab inspector fields:

- Tab name.
- Description.
- Orientation.
- Stage list.
- Add stage.
- Rename stage.
- Delete stage.
- Rebuild stage bands.

Stage editing can be visible only in Admin Mode.

## 24. Filtering

Implement `src/lib/filters.ts`.

Filtering should:

- Preserve underlying nodes and edges.
- Return display nodes and display edges.
- Filter planning nodes by query and filters.
- Always include stage band nodes unless the app has a stage visibility toggle.
- Hide edges where source or target is hidden.
- If `hideRelatedEdges` is true, hide related edges.
- If `orphansOnly` is true, show only planning nodes with no visible incoming or outgoing edges.

Search should match:

- Node title.
- Notes.
- Person names and initials.
- Workstream name.
- Tags.
- Link labels and URLs.

## 25. Themes

Implement `src/lib/theme.ts` and CSS variables in `src/index.css`.

Theme IDs:

- `clean-light`
- `clean-dark`
- `neon-dark`

Use `data-theme` on the app root.

Use React Flow `colorMode` prop:

- `clean-light` -> `light`
- `clean-dark` -> `dark`
- `neon-dark` -> `dark`

Do not hardcode colors repeatedly in JSX. Use CSS variables or Tailwind utility classes that reference variables.

Required visual style:

- Clean card design.
- Clear text hierarchy.
- Subtle canvas background.
- Neon-dark theme with dark canvas and pink accent.
- Highlighted edges in neon-dark can glow or animate.
- Normal edges remain restrained.

## 26. GitHub Pages deployment

Create `.github/workflows/deploy.yml`.

Use GitHub Actions with Vite build and Pages artifact deployment.

The Vite config should support a configurable base path.

Recommended `vite.config.ts` pattern:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH ?? "/",
});
```

Recommended workflow:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_BASE_PATH: /${{ github.event.repository.name }}/

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Add README instructions for changing `VITE_BASE_PATH` if deploying to a root domain or custom domain.

## 27. README requirements

Create or update `README.md`.

Include:

- What the app is.
- What it is not.
- Local setup.
- Development command.
- Build command.
- Preview command.
- GitHub Pages deployment.
- Data persistence explanation.
- Import/export explanation.
- Snapshot explanation.
- Theme explanation.
- Beginner maintenance notes.
- Known limitations.
- Sensitive data warning.

The sensitive data warning should say:

- GitHub Pages is static hosting.
- Do not commit confidential project JSON into the repository unless the team has intentionally approved that.
- Use localStorage and JSON import/export for v1 internal planning data.

## 28. Milestones

### Milestone 0: Repository setup

Tasks:

- Inspect repository.
- If empty, initialize Vite React TypeScript.
- Install dependencies.
- Add Tailwind Vite plugin.
- Add React Flow stylesheet import.
- Add base CSS variables.
- Confirm `npm run build` passes.

Acceptance:

- App loads a placeholder page.
- Tailwind classes work.
- React Flow package imports successfully.

### Milestone 1: Types and seed data

Tasks:

- Add `planning.ts`.
- Add `seedProject.ts`.
- Add ID/date utilities.
- Add validation helpers.

Acceptance:

- Seed project contains people, workstreams, tabs, stages, nodes, and edges.
- TypeScript build passes.

### Milestone 2: State and persistence

Tasks:

- Add Zustand store.
- Load localStorage or seed project.
- Auto-save project.
- Implement snapshots.
- Implement import/export helpers.

Acceptance:

- Editing store state persists after reload.
- Snapshot restore works.
- Export creates JSON file.
- Import replaces project after confirmation.

### Milestone 3: Canvas

Tasks:

- Add `PlanningCanvas`.
- Add custom node, edge, and stage band components.
- Wire React Flow controlled state.
- Implement node/edge selection.
- Implement connection creation.
- Implement viewport saving.

Acceptance:

- Seeded project appears on canvas.
- Nodes can move.
- Nodes can connect.
- Edges render by relationship type.
- Stage bands render behind planning nodes.

### Milestone 4: Editing UI

Tasks:

- Build top bar, tab bar, left sidebar, right inspector.
- Implement add/edit/delete/duplicate node.
- Implement edit/delete edge.
- Implement create/rename/delete tab.
- Implement admin mode for stage editing.

Acceptance:

- User can perform core planning edits without touching JSON.
- Last tab cannot be deleted.
- Destructive actions require confirmation.

### Milestone 5: Search, filters, presentation

Tasks:

- Implement search.
- Implement filters.
- Implement orphans filter.
- Implement Presentation Mode.

Acceptance:

- Search finds relevant nodes.
- Filters hide/show correct nodes and edges.
- Presentation Mode hides editing chrome.

### Milestone 6: Themes

Tasks:

- Add clean-light, clean-dark, neon-dark.
- Add theme selector.
- Persist theme in project settings.
- Make React Flow colorMode follow theme.

Acceptance:

- All themes are readable.
- Neon-dark has dark background and pink accent.
- Theme survives reload.

### Milestone 7: Deployment and docs

Tasks:

- Add GitHub Pages workflow.
- Add configurable Vite base path.
- Update README.
- Run final build.

Acceptance:

- `npm run build` passes.
- README is usable by a beginner.
- GitHub Pages workflow exists.

## 29. Quality checklist

Before final response or PR:

- Run `npm run build`.
- Manually check app starts with `npm run dev` if possible.
- Add, edit, move, and delete a node.
- Connect two nodes.
- Edit an edge relationship.
- Add a tab.
- Rename a tab.
- Delete a tab.
- Add a snapshot.
- Restore a snapshot.
- Export JSON.
- Import JSON.
- Reload browser and confirm persistence.
- Switch all three themes.
- Toggle Presentation Mode.
- Confirm README matches actual commands.

## 30. Edge cases to handle

Handle these gracefully:

- localStorage is empty.
- localStorage contains invalid JSON.
- Imported file is not JSON.
- Imported JSON has wrong schema.
- User tries to delete the last tab.
- User deletes a node that has edges.
- User creates an edge between the same nodes twice.
- User creates an edge from a node to itself.
- User clears all filters.
- User has no owner on a node.
- User has no workstream on a node.
- User restores an old snapshot.
- User turns Admin Mode off while a stage band is selected.

Suggested behavior:

- Invalid localStorage: show warning and load seed project.
- Invalid import: show error and keep current project.
- Deleting node: remove connected edges.
- Duplicate edge: prevent or update existing edge.
- Self-edge: prevent.
- Last tab delete: prevent with message.
- No owner/workstream: show "Unassigned" or "No workstream."

## 31. Accessibility checklist

Implement:

- Buttons with visible text or `aria-label`.
- Labeled inputs.
- Keyboard focus states.
- Modal close behavior.
- Confirmation modals for destructive actions.
- Text contrast in all themes.
- Status text, not just color.
- Reasonable tab order in sidebars and inspector.

## 32. Performance guardrails

Follow these rules:

- Do not animate all edges.
- Do not store derived filtered nodes as canonical project data.
- Memoize custom node and edge components if straightforward.
- Keep inspector updates scoped to the selected object.
- Do not put giant note content directly on node cards.
- Avoid creating new nodeTypes/edgeTypes objects on every render.

## 33. Suggested implementation details

### ID utility

Use `nanoid`:

```ts
import { nanoid } from "nanoid";

export function createId(prefix: string) {
  return `${prefix}_${nanoid(8)}`;
}
```

### Save debounce

Use a small debounce for localStorage writes, around 300 to 800 ms. Do not over-engineer this.

### Node placement

When adding a node, place it near the viewport center. If that is complicated, place it at `{ x: 120, y: 120 }` plus a small offset based on node count.

### Stage bands

For vertical orientation, create bands like:

- x: 0, 320, 640, etc.
- width: 300
- height: 1200

For horizontal orientation, create bands like:

- y: 0, 260, 520, etc.
- width: 1800
- height: 240

Keep stage bands behind nodes with low z-index.

### Data migration

No complex migrations in v1. If schema changes later, add a migration function.

## 34. Expected final deliverable

The final deliverable should include:

- Working Vite React TypeScript app.
- React Flow planning canvas.
- Themeable UI.
- Seed project data.
- Local persistence.
- Snapshot restore.
- JSON import/export.
- GitHub Pages workflow.
- README.
- Root `AGENTS.md`.
- Successful `npm run build`.

## 35. Suggested final response from Codex

When done, report:

- Files changed.
- Features implemented.
- Build/test result.
- Any limitations.
- How to run locally.
- How to deploy.
- Any manual follow-up needed.

Do not claim deployment succeeded unless the GitHub Actions workflow actually ran.

## 36. Cutline for scope creep

If time runs long, prioritize in this order:

1. Working canvas with custom nodes and edges.
2. Tabs.
3. Node inspector editing.
4. localStorage persistence.
5. Export/import.
6. Theme switcher.
7. Snapshots.
8. Filters.
9. Presentation Mode.
10. GitHub Pages workflow.
11. Polish.

Do not cut TypeScript build correctness.
