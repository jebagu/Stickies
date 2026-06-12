# PRD: Internal React Flow Project Planning Site

Status: Draft v1  
Owner: Jeremy and project team  
Audience: internal planning team, Codex, future developer  
Last updated: 2026-06-12

## 1. Executive summary

Build a clean internal project-planning web app using React Flow. The app should let a nontechnical team map the project as a visual canvas of activities, dependencies, owners, stages, and workstreams.

The app should be similar in spirit to the React Flow playground and homepage examples, but not expose developer controls. Coworkers should not see raw React Flow props, edge algorithms, handle settings, or visual configuration panels. They should see a simple planning interface: tabs, nodes, owners, workstreams, stages, statuses, filters, save, restore, import, export, and themes.

The first version should be a static React app hosted on GitHub Pages, with project data saved locally in the browser and exportable/importable as JSON. Shared authenticated editing is out of scope for v1.

## 2. Background

The team needs a canvas for project planning across multiple connected workstreams: venue, physical sphere delivery, sound system, acoustics, operations, ticketing, show music production, labs, legal, and experience design.

The canvas needs to handle both structured dependencies and loose orphan ideas. Some items will be serial dependencies. Some will be parallel. Some will simply be related. The product should make this legible without turning into a complex project-management database.

## 3. Goals

The product should:

- Let the team visually map project activities, deliverables, decisions, risks, and dependencies.
- Keep the interface simple enough for nontechnical collaborators.
- Support multiple planning tabs for different views of the project.
- Support workstreams as metadata that can cut across tabs.
- Let users associate people with activities.
- Let users add disconnected orphan nodes without forcing premature structure.
- Let users create stage bands or lanes that organize the canvas.
- Provide clean light, dark, and neon-dark visual themes.
- Save, reload, version, export, and import project states.
- Be maintainable by a beginner developer.

## 4. Non-goals for v1

Do not build these in v1:

- Real-time multiplayer editing.
- User login or role-based permissions.
- Backend database.
- Jira, Asana, Notion, Google Drive, or Slack integrations.
- Complex Gantt chart functionality.
- Budget tracking.
- Time tracking.
- Notifications.
- Custom scripting.
- Mobile-first editing.
- Advanced React Flow prop playground.
- Per-node low-level style editing.
- Full automatic layout engine.

These can be considered after the team proves it uses the v1 planning canvas.

## 5. Users

Primary users:

- Project lead: needs the full project map and dependency visibility.
- Workstream owner: needs to see responsibilities, blockers, and related work.
- Meeting participant: needs a readable shared planning canvas.
- Nontechnical collaborator: needs to add and edit items without learning React Flow.

Admin user:

- Maintains workstream list, people list, themes, tab structure, and saved versions.

## 6. Product principles

The product should feel like a custom internal planning tool, not a code playground.

Core principles:

- Simple editing over advanced configurability.
- Clear structure over feature count.
- Fast meeting use over perfect database design.
- Visual hierarchy over verbose fields.
- Reversible changes through snapshots.
- Manual layout first, automatic layout later.
- Themeable by tokens, not hardcoded colors.

## 7. Information architecture

Use two separate concepts:

### Tabs

Tabs are saved planning views or canvases.

Example tabs:

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

Each tab has its own canvas, stage bands, nodes, edges, viewport, and tab-level filters.

### Workstreams

Workstreams are metadata on nodes. They can cut across tabs.

Example: a node called "Atmos engineer workflow" can belong to the Show Music Production workstream, but appear on both the Overall Project tab and the Audio tab.

For v1, keep nodes tab-local. A later version can support global nodes that appear in multiple tabs with different positions.

## 8. Initial workstreams

Seed the app with these workstreams.

### Venue

People or organizations:

- DNK
- Capital
- Stoneweg

Example nodes:

- Confirm venue owner and decision maker.
- Confirm commercial structure.
- Confirm venue access schedule.
- Confirm legal agreement path.
- Identify site constraints.

### Delivery of Physical Sphere

People:

- Nicholas
- Alexander

Example nodes:

- Define physical sphere scope.
- Confirm fabrication requirements.
- Confirm shipping and install plan.
- Confirm safety requirements.
- Confirm on-site handoff.

### Delivery of Sound System

People:

- Mez
- Jeremy

Example nodes:

- Define sound system specification.
- Confirm speaker layout.
- Confirm signal chain.
- Confirm install schedule.
- Confirm test and calibration plan.

### Acoustics Consultant

Person or firm:

- Kierkegaard

Example nodes:

- Confirm acoustics consultant scope.
- Share physical space assumptions.
- Review acoustic constraints.
- Confirm measurement and tuning plan.

### Operations

People or organizations:

- Ed
- GOH

Sub-areas:

- TopCo operations.
- Operational co-operations.

Example nodes:

- Define operating model.
- Define on-site staffing model.
- Define partner interface model.
- Confirm opening and closing procedures.
- Confirm escalation process.

### Ticketing

Example nodes:

- Choose ticketing platform.
- Define ticket tiers.
- Define guest and VIP handling.
- Define refunds and transfers.
- Define on-site ticketing process.

### Show Music Production

Example nodes:

- Identify artists.
- Develop artist workflow.
- Define Atmos engineer workflow.
- Evaluate Ollie Morgan as possible Atmos engineer.
- Create technical content development process.
- Prepare credible answer for tier-one artists on how content is produced.
- Define content QA process.
- Define artist approval process.

### Labs

Example nodes:

- Define open participation model.
- Define intake workflow.
- Define lab format.
- Define lab outputs.
- Define lab-to-main-show escalation path.
- Define moderation or curation process.

### Legal

Example nodes:

- Define artist agreement template.
- Define venue agreement path.
- Define vendor agreement path.
- Confirm insurance requirements.
- Confirm IP and music-rights approach.
- Confirm data/privacy approach for ticketing.

### Experience Design

Sub-areas:

- Before experience.
- After experience.
- Food and beverage.
- Seating.
- Lights / lighting design.
- Line experience.

Example nodes:

- Map pre-arrival experience.
- Design queue and line experience.
- Define seating model.
- Define lighting design requirements.
- Define food and beverage concept.
- Define post-experience flow.
- Define accessibility requirements.

## 9. Node model

Keep node fields concise. The canvas card should show only the most important fields. The right-side inspector can show the full editable data.

### Node types

Supported node types:

- Task: a concrete piece of work.
- Milestone: a checkpoint or date-based goal.
- Decision: a choice that affects future work.
- Risk / Blocker: something that could slow or prevent progress.
- Question: an unresolved planning question.
- Note / Orphan: a loose item that is useful but not yet integrated.
- Deliverable: a tangible output or artifact.

Do not add more node types in v1 unless there is a clear team need.

### Fields visible on node cards

Show these on each node card:

- Title.
- Status.
- Owner initials.
- Workstream pill or color stripe.
- Stage or target date.
- Blocked indicator, only if relevant.
- Node type label or small icon.

The node card should not show long notes, all tags, links, full owner names, or complex metadata.

### Fields editable in the inspector

Each node should support:

- Title.
- Node type.
- Status.
- Owners.
- Supporters.
- Primary workstream.
- Tags.
- Stage.
- Priority.
- Target date.
- Confidence.
- Notes.
- Links.
- Created at.
- Updated at.

Recommended enum values:

Node type:

- task
- milestone
- decision
- risk
- question
- note
- deliverable

Status:

- idea
- defined
- owner_assigned
- in_progress
- blocked
- ready
- done
- parked

Priority:

- P0
- P1
- P2

Confidence:

- low
- medium
- high

## 10. Relationship model

Relationships are represented as React Flow edges.

The direction of an edge means:

Source enables, informs, or precedes target.

Supported relationship types:

- Hard dependency: target cannot realistically proceed until source is done.
- Soft dependency: source informs or helps target, but does not fully block it.
- Related / parallel: items are connected, but not serial.

Visual rules:

- Solid line for hard dependency.
- Dashed line for soft dependency.
- Thin muted line for related / parallel.
- Animated or glowing line only for highlighted critical path, not every edge.

The app should avoid creating visual noise. Most edges should be calm and readable.

## 11. Stages and lanes

The product needs horizontal or vertical stage lines/bands.

Each tab should support:

- Orientation: vertical columns or horizontal lanes.
- Stage names.
- Stage order.
- Optional stage description.
- Optional stage color token.
- Locked/unlocked stage editing.

Recommended default stages:

- Discovery
- Strategy / Decisions
- Partner Confirmation
- Design
- Production
- Delivery / Install
- Live Operations
- Post-Experience

Implementation recommendation for v1:

Use locked `stageBand` nodes behind planning nodes. These stage bands are saved with each tab and can be edited only in Admin Mode.

Do not build freeform rectangle drawing in v1. That can come later.

## 12. Layout

The app should have four main UI regions.

### Top bar

Include:

- Project name.
- Current tab name.
- Save status.
- Theme switcher.
- Import JSON.
- Export JSON.
- Version history.
- Presentation Mode toggle.

### Left sidebar

Include:

- Add Task.
- Add Milestone.
- Add Decision.
- Add Risk.
- Add Question.
- Add Note.
- Add Tab.
- Search box.
- Basic filters.

### Canvas

Include:

- React Flow canvas.
- Background grid or dots.
- Custom planning nodes.
- Custom relationship edges.
- Stage bands.
- Zoom controls.
- Fit view.
- MiniMap toggle.
- Selection and drag behavior.
- Edge connection behavior.

### Right inspector

Open when an object is selected.

For node selection:

- Show node fields.
- Allow edit and delete.
- Allow duplicate.

For edge selection:

- Show relationship type.
- Allow label/notes.
- Allow delete.

For tab/stage selection:

- Show editable tab or stage settings.
- Stage editing should be in Admin Mode.

## 13. Interaction requirements

### Add a node

User clicks an add button in the left sidebar. A new node appears near the center of the current viewport or in a parking area. The right inspector opens immediately for editing.

### Edit a node

User clicks a node. The right inspector opens. Edits are applied immediately and auto-saved.

### Connect nodes

User drags from one node handle to another. A new edge is created as a hard dependency by default. User can change it to soft dependency or related in the edge inspector.

### Create a tab

User clicks Add Tab. They enter a tab name. The app creates a new blank tab with default stages.

### Create orphan items

User can add notes/questions/tasks without connecting them to anything. Orphans should not be treated as errors.

### Filter

User can filter by owner, workstream, status, priority, blocked status, orphan status, or text search.

### Presentation Mode

Presentation Mode hides sidebars and editing controls, leaving the canvas, tab bar, and minimal navigation.

## 14. Search and filters

Search should match:

- Node title.
- Notes.
- People.
- Workstreams.
- Tags.
- Link labels.
- Link URLs.

Filters:

- My items.
- Owner.
- Workstream.
- Status.
- Priority.
- Blocked only.
- Unassigned only.
- Orphans only.
- Due soon.
- Hide related edges.
- Show current tab only.

Clicking a search result should center the viewport on the node.

## 15. Save, reload, versioning, import, and export

### v1 persistence

Use browser localStorage for the current project file.

Required features:

- Auto-save after changes.
- Save status indicator.
- Manual Save Snapshot.
- Restore Snapshot.
- Export JSON.
- Import JSON.

Each snapshot should include:

- Snapshot ID.
- Label.
- Optional note.
- Created at.
- Full project state.

### Data sensitivity

GitHub Pages is static hosting. The v1 site must not require sensitive project data to be bundled into the public app. Seed data should be safe sample data or data the team is comfortable committing.

For real internal data, the safer v1 workflow is:

- Host the static app.
- Keep project data in browser storage or imported JSON.
- Share exported JSON through an internal channel.

A future v2 can add authenticated shared storage.

## 16. Data model

Use this as the conceptual TypeScript model.

```ts
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
  orientation: "vertical" | "horizontal";
  stages: Stage[];
  nodes: PlanningNode[];
  edges: PlanningEdge[];
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

export type PlanningNode = {
  id: string;
  type: "planningNode" | "stageBand";
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  data: PlanningNodeData | StageBandData;
};

export type PlanningNodeData = {
  title: string;
  kind: "task" | "milestone" | "decision" | "risk" | "question" | "note" | "deliverable";
  status: "idea" | "defined" | "owner_assigned" | "in_progress" | "blocked" | "ready" | "done" | "parked";
  ownerIds: string[];
  supporterIds?: string[];
  workstreamId?: string;
  tagIds?: string[];
  stageId?: string;
  priority?: "P0" | "P1" | "P2";
  targetDate?: string;
  confidence?: "low" | "medium" | "high";
  notes?: string;
  links?: PlanningLink[];
  createdAt: string;
  updatedAt: string;
};

export type StageBandData = {
  title: string;
  stageId: string;
  orientation: "vertical" | "horizontal";
  locked: boolean;
  colorToken?: string;
};

export type PlanningEdge = {
  id: string;
  source: string;
  target: string;
  type: "planningEdge";
  data: {
    relation: "hard_dependency" | "soft_dependency" | "related";
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
  themeId: "clean-light" | "clean-dark" | "neon-dark";
  showMiniMap: boolean;
  adminMode: boolean;
};

export type TabFilters = {
  query?: string;
  ownerIds?: string[];
  workstreamIds?: string[];
  statuses?: string[];
  priorities?: string[];
  blockedOnly?: boolean;
  unassignedOnly?: boolean;
  orphansOnly?: boolean;
  hideRelatedEdges?: boolean;
};
```

## 17. Theming

Use Tailwind for layout, spacing, typography, and component styling. Use CSS variables for theme tokens.

Do not hardcode colors repeatedly in components.

Required themes:

### Clean Light

Use for normal editing and printing.

### Clean Dark

Use for meetings and projector use.

### Neon Dark

Inspired by the React Flow homepage/Turbo aesthetic: dark canvas, pink accent, flowing or glowing highlighted edges, crisp cards, high contrast.

Theme tokens should include:

- `--app-bg`
- `--panel-bg`
- `--canvas-bg`
- `--card-bg`
- `--card-border`
- `--text-primary`
- `--text-muted`
- `--accent`
- `--accent-soft`
- `--edge-hard`
- `--edge-soft`
- `--edge-related`
- `--status-blocked`
- `--status-done`
- `--status-warning`

Switching cost guidance:

- Tailwind plus CSS variables from the start: low switching cost.
- Hardcoded Tailwind colors across components: medium switching cost.
- Mixed custom CSS and inline styles: medium/high switching cost.
- Introducing shadcn/ui later: moderate switching cost, useful only if the app needs more polished form controls.

## 18. Hosting and deployment

v1 hosting target:

- GitHub Pages for the static React app.

Deployment requirements:

- Vite build.
- GitHub Actions workflow.
- Configurable Vite base path.
- No sensitive project data bundled into the public build unless explicitly approved by the team.

If the repository is deployed as `https://username.github.io/repo-name/`, the build needs a base path like `/repo-name/`. If deployed at a root Pages domain or custom domain, the base path can be `/`.

## 19. Accessibility and usability

Requirements:

- All form fields have labels.
- Buttons have clear text or accessible labels.
- Keyboard navigation works for sidebar and inspector controls.
- Color is not the only status indicator.
- Node cards remain readable in dark and light themes.
- Text contrast is adequate.
- Interactive controls have visible focus states.
- Destructive actions require confirmation.

## 20. Performance

v1 target:

- Smooth interaction for at least 200 nodes and 300 edges.
- Filtering should not mutate the underlying project data.
- Avoid unnecessary full-canvas re-renders.
- Keep node data lean.
- Avoid animating all edges.

Future performance improvements:

- Memoize custom nodes and inspector selectors.
- Store derived search/filter results separately.
- Use Zustand selectors carefully.
- Add virtualization only if non-canvas lists become large.

## 21. Success criteria

The v1 is successful if a nontechnical team member can:

- Open the site.
- Switch tabs.
- Add a node.
- Edit the title, owner, workstream, status, stage, notes, and links.
- Connect two nodes.
- Change relationship type.
- Move nodes into stage bands.
- Add an orphan note.
- Filter to their responsibilities.
- Save a snapshot.
- Reload and see their edits.
- Export and import the project JSON.
- Switch themes.
- Use Presentation Mode in a meeting.

A project lead should be able to:

- See the whole project tree.
- See workstream owners.
- Find unassigned items.
- Find blockers.
- Find orphan nodes.
- Restore a previous version.
- Present the project map without confusing editing panels.

## 22. MVP acceptance criteria

Ship v1 when all of the following pass:

- App runs locally with `npm run dev`.
- App builds with `npm run build`.
- App deploys to GitHub Pages with GitHub Actions.
- React Flow canvas loads with seeded tabs.
- User can add, edit, move, delete, duplicate, and connect nodes.
- User can create, rename, and delete tabs.
- User can create snapshots and restore them.
- User can export and import JSON.
- User can search and filter nodes.
- User can switch themes.
- User can enter and exit Presentation Mode.
- Reloading the browser preserves the current project through localStorage.
- README explains setup, development, build, deploy, import/export, and known limitations.

## 23. Future v2 ideas

Consider these after v1 is used in real planning sessions:

- Authenticated shared database.
- Team login.
- Multi-user editing.
- Comments on nodes.
- Activity history.
- Global nodes across multiple tabs.
- Auto-layout button.
- Dependency path highlighting.
- PDF or PNG export.
- Google Drive or Notion link helpers.
- Simple permissions: viewer, editor, admin.
- Backups to cloud storage.
- AI-assisted cleanup: detect duplicates, blockers, missing owners, and orphan clusters.

## 24. Reference notes

These implementation references were checked while drafting this PRD:

- React Flow quick start: https://reactflow.dev/learn
- React Flow save and restore example: https://reactflow.dev/examples/interaction/save-and-restore
- React Flow theming guide: https://reactflow.dev/learn/customization/theming
- React Flow Tailwind example and styling examples: https://reactflow.dev/examples
- React Flow performance guidance: https://reactflow.dev/learn/advanced-use/performance
- Tailwind CSS Vite installation: https://tailwindcss.com/docs/installation/using-vite
- Vite static deployment guide: https://vite.dev/guide/static-deploy
- GitHub Pages publishing source docs: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub Pages overview: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- OpenAI Codex docs: https://developers.openai.com/codex
- Codex AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md
