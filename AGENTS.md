# AGENTS.md

## Project

This is a Vite React TypeScript app for an internal React Flow project-planning canvas.

Permanent local URL: `http://127.0.0.1:5178/Stickies/`

Public read-only local URL: `http://127.0.0.1:5178/Stickies/public/`

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
- Keep the dev server pinned to `127.0.0.1:5178` with strict-port behavior. If the port is occupied, stop the stale server or report the conflict instead of silently moving ports.

## Work package reporting

When doing a work package, always end each message with:

- The slice number just finished.
- Anything the human operator needs to inspect. If there is nothing to inspect, say `No inspection` or `No inspection or test`.
- The next work slice and its slice number.
- If the work package is complete, say that it is the end of the work package.
