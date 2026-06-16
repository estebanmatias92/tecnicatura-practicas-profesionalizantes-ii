# AGENTS.md — SampleVault (Brownfield NFR Project)

## Stack
- **Backend:** Node 22 / Express 5 / mysql2 / bcrypt / jsonwebtoken / multer 2
- **Frontend:** Vanilla JS (zero innerHTML), W3.CSS
- **DB:** MariaDB 11 (via Docker)
- **No build step, no framework CLI, no test runner — tests are DOM buttons**

## Quick start
```sh
make up                    # docker compose up --build -d
make destroy               # down -v (reset DB + uploads from scratch)
make logs                  # tail backend logs
```
App at `http://localhost:3000`. With `NODE_ENV=testing` (default), `/` serves `frontend/html/tests.html`.

## Project anatomy
```
code/
├── backend/
│   ├── server.js          # entrypoint: Express 5 app
│   ├── controllers/       # req/res handlers (classes, exported as singletons)
│   ├── repositories/      # SP calls via mysql2 pool.promise()
│   ├── middleware/         # JWT verify + isAdmin guards
│   ├── config/            # db pool, multer config, init.sql + reset.sql
│   └── routes/            # Express routers (auth, samples, admin, tests, views)
├── frontend/
│   ├── html/              # static pages (tests.html, login.html, etc.)
│   ├── js/
│   │   ├── frontControllers/  # per-page event wiring + showModal calls
│   │   ├── services/apiService.js  # fetch wrapper, auto-logout on 401
│   │   ├── utils/authHelper.js     # localStorage token helpers
│   │   └── tests/          # DOM test buttons (createTestButton pattern)
│   └── css/
├── docs/requirements/      # NFR specs (nfr-NNN-slug.md) + backlog
├── test-samples/           # .wav files for upload tests
├── .env                    # COMPOSE_PROJECT_NAME only
└── Makefile                # up / down / destroy / logs / restart / status
```

## Key facts an agent will miss

### Tests are DOM buttons, not a framework
Open `http://localhost:3000` (testing mode). Each test is a `<button>` created by `testUtils.createTestButton(label, async fn)`. Assertions set `btn` class to green on pass. Tests use `testUtils.fetchJson()` which returns `{ response, data }` and auto-logs to the console div.

### Every test starts with `await testUtils.resetState()`
This calls `POST /api/test/reset` which runs `backend/config/reset.sql` (truncates + re-seeds) and clears `backend/uploads/`. Always call it first.

### Backend uses Stored Procedures (SPs), not raw queries
- `sp_create_user`, `sp_find_user_by_username`, `sp_create_sample`, `sp_delete_sample`, `sp_find_samples_by_user`, etc.
- All in `backend/config/init.sql`.
- Repositories call them with positional `?` params (safe from injection).

### Express 5 quirks
- Error-handling middleware is `app.use((err, req, res, next) => ...)` — 4 args required.
- `res.status(code).json(...)` — Express 5 still supports this.
- `req.body` is undefined without `express.json()` and `express.urlencoded({ extended: true })`.

### Multer 2
- `upload.single('audioFile')` — field name matters.
- No `limits.fileSize` configured yet (NFR-005 pending).
- File filter checks `file.mimetype` string only (no magic-byte verification — NFR-004 pending).

### JWT flow
- `authMiddleware.verifyToken` reads `Authorization: Bearer <token>`.
- Sets `req.userId` and `req.userRole` on success.
- `isAdmin` must come AFTER `verifyToken` in route chain.
- 401 on invalid/expired token, 403 on bad format or missing header.

### API seed users
| User | Pass | Role |
|------|------|------|
| `admin` | `12345` | admin |
| `pepe` | `12345` | producer |

`resetState()` re-creates these.

### NFR completion cycle (RE → Design → Implement → Test → Backlog update)
Each NFR lives in `docs/requirements/nfr-NNN-slug.md` with a checklist. Steps:
1. Read the NFR spec — implement what the checklist says
2. Backend: controller validation → HTTP status + specific JSON message
3. Frontend: `showModal` with the exact message from spec
4. Tests: add `createTestButton` in the matching `frontend/js/tests/*.js` file
5. Update `docs/requirements/validations-backlog.md` row + summary
6. Tick checkboxes in the NFR doc (`[ ]` → `[x]`)
7. Root branch: `lapenta_carlos_matias`

### Current backlog state (10 NFRs)
- 🚀 Complete: NFR-001 (duplicates), NFR-002 (password length), NFR-003 (login incomplete), NFR-004 (MIME)
- ⚠️ Partial: NFR-007 (JWT frontend), NFR-008/009 (403 vs 404), NFR-010 (no tests)
- ❌ Not started: NFR-005 (file size limit), NFR-006 (BPM range)

### Other notes
- `backend/uploads/` is gitignored — recreated on startup by `server.js`.
- `COMPOSE_PROJECT_NAME` in `.env` avoids Docker volume collisions between assignments.
- Docker services: `samplevault-db` (MariaDB) and `samplevault-app` (Node). App waits for DB healthcheck.
- No linter/formatter configured. No CI/CD. No type checking.
- Express 5 static files: `app.use(express.static(...))` — frontend is served directly, no bundler.
