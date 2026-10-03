# AGENTS.md — BiblioTech (greenfield)

Greenfield lab. Only verified source is `docs/bibliotech.md` — read it before any design or code decision.

## Charter (from `docs/bibliotech.md`)

- Digital-book library: Professors upload, every authenticated role reads/searches everything, Admin has full access. No anonymous access. Simple, secure web platform.
- Roles: `Admin` (total) / `Professor` (upload) / `Student` (read-only client).
- Hard constraints: JWT session + BCrypt, Multer file handling, Frontend/Backend separation, Repository pattern, Validator/Filter module (email, password, …), MariaDB as minimum DB engine.
- Out of scope (until discovery says otherwise): physical loans, reservations, fines, notifications.

## Current state — almost nothing exists

- This dir has docs + OOAD config only (`docs/bibliotech.md`, `docs/agents/`, `docs/01-discovery/`, `docs/02-requirements/`, `CONTEXT.md`). No `backend/`, `frontend/`, `package.json`, `docker-compose.yaml`, tests, linter, or CI yet.
- Do NOT assume sibling-lab details (stored procedures, DOM-button tests, seed users like `admin/12345`, `make up`) exist here — they are unverified for this lab.
- Planned stack (decided, not yet installed): Node 22 + TypeScript, NestJS backend (`@nestjs/jwt` + `bcrypt`, Multer `FileInterceptor`, `class-validator`, TypeORM on MariaDB 11), React + TS frontend (Vite build, Vitest). Scaffold only when `ooad-architect`/`ooad-build` says so.

## OOAD order — do not skip

1. `docs/bibliotech.md` (charter, exists) → `/setup-ooad` → `docs/agents/workflow.md`
2. `/ooad-discover` → `docs/01-discovery/PRD.md`
3. `/ooad-requirements` → `/ooad-architect` → `/ooad-build` → `/ooad-verify` → `/ooad-ship`
- Do not create code scaffolding to "get started" before step 2 approves the PRD.

## Repo notes

- Git root is `practicas-profesionalizantes-ii/` (branch `main`); this subdir is currently untracked. Work in place — never `git init` inside it.
- Parent `.gitignore` covers C++ artifacts (`*.o`, `build/`, `bin/`) plus IDE/OS files; add Node/DB ignores (`node_modules/`, `backend/uploads/`, `.env`) when scaffolding.

## Agent skills (OOAD)

### Workflow profile

Iterative RUP — Clean 4 Layers. See `docs/agents/workflow.md`.

### Issue tracker

Local Markdown (`.scratch/<feature>/spec.md + issues/NN-slug.md`). See `docs/agents/issue-tracker.md`.

### Architecture

Clean 4 Layers. See `docs/agents/architecture.md`.

### Domain docs

single-context. See `docs/agents/domain.md`.
