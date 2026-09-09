# Sample Vault — Codebase Design Report

*Generated using the /codebase-design skill vocabulary*

Reports references diagrams in `docs/`:

- [module-architecture.svg](docs/module-architecture.svg) — Backend + frontend module map with dependencies and seam annotations
- [seam-map.svg](docs/seam-map.svg) — Confirmed and potential adapter seams with current/potential adapters
- [depth-priorities.svg](docs/depth-priorities.svg) — Prioritized depth improvement recommendations with effort/impact

Source `.puml` files are also available for regeneration:

- `docs/module-architecture.puml`
- `docs/seam-map.puml`
- `docs/depth-priorities.puml`

Diagrams are generated via PlantUML (plantuml available at /usr/bin/plantuml).

---

## Glossary

Used consistently throughout this report.

| Term | Definition |
| ------ | ----------- |
| **Module** | Anything with an interface and an implementation. A function, class, package, or tier-spanning slice. |
| **Interface** | Everything a caller must know to use the module correctly: type signature, invariants, ordering constraints, error modes, required configuration, performance characteristics. |
| **Implementation** | What's inside a module, its body of code. |
| **Adapter** | A concrete thing that satisfies an interface at a seam. Describes role, not substance. |
| **Seam** | A place where you can alter behaviour without editing in that place; the location at which a module's interface lives. |
| **Depth** | Leverage at the interface: the amount of behaviour a caller (or test) can exercise per unit of interface they have to learn. |
| **Leverage** | More capability per unit of interface learned. One implementation pays back across N call sites and M tests. |
| **Locality** | Change, bugs, knowledge, and verification concentrate in one place rather than spreading across callers. Fix once, fixed everywhere. |

---

## Module Map

The repo contains two primary domains: **backend** (Node/Express server) and **frontend** (client-side JavaScript).

```text
┌──────────────────────────────────────────────────────────────────┐
│                     SAMPLE VAULT CODEBASE                        │
├─────────────────────┬────────────────────────┬───────────────────┤
│                     │                        │                   │
│       BACKEND       │        FRONTEND        │      SHARED       │
│                     │                        │                   │
├─────────────────────┼────────────────────────┼───────────────────┤
│                     │                        │                   │
│  server.js          │  apiService.js         │  (none direct)    │
│  authMiddleware.js  │  authFrontCtrl.js      │                   │
│  db.js              │  adminFrontCtrl.js     │                   │
│  sampleRepo.js      │  samplesFrontCtrl.js   │                   │
│  sampleController.js│                        │                   │
│  adminController.js │                        │                   │
│  authController.js  │                        │                   │
│  multerConfig.js    │  utils/                │                   │
│  config/            │  js/utils/             │                   │
│  routes/            │  js/services/          │                   │
│  controllers/       │  js/frontControllers/  │                   │
│  middleware/        │                        │                   │
│                     │                        │                   │
└─────────────────────┴────────────────────────┴───────────────────┘
```

![[module-architecture.svg]]

---

## Backend Modules

### `server.js` (entry point / router)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `initialize()` — configure app, middlewares, static serving, register 5 route groups, global error handler | Express app setup, cors, json parsing, folder creation, static serving, route registration, NODE_ENV check, error handler, listen | **Shallow** — interface is small (1 "method" via export), but implementation wires many concerns; deleting it would scatter configuration across the codebase |

**Seam opportunities**: None critical — primarily wiring module. Could extract route registration into a configurator adapter if multiple server configs are needed.

---

### `authMiddleware.js` (JWT verification + role check)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `verifyToken(req, res, next)` — validate Bearer token, decode JWT, set `req.userId` + `req.userRole`, call next<br>`isAdmin(req, res, next)` — check if role includes 'admin' | JWT verification (jsonwebtoken), SECRET_KEY from env, role flexible check (string or array), 401/403 responses | **Moderate** — small interface (2 methods), but each has non-trivial crypto/validation; one adapter (session-based, OAuth) would confirm real seam |

**Key invariant**: Token format must be `Bearer <token>`. Role can be `"admin"` or `["producer", "admin"]`.

**Deletion test**: ✅ Complexity reappears across all protected routes in all controllers.

**Recommendation**: Extract auth strategy into adapter pattern. Currently JWT-only; add session-based or OAuth adapter to confirm seam and deepen interface.

---

### `db.js` (MySQL connection pool)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `pool.promise()` — exported promise pool | `mysql.createPool()` with env vars (DB_HOST, DB_USER, DB_PASS, DB_NAME), `waitForConnections`, `connectionLimit`, `queueLimit` | **Shallow** — purely infrastructure; single export. Deletion would require replacing pool creation in all repo modules |

**Seam**: DB adapter seam. Currently mysql2 pool. A second adapter (TypeORM, Sequelize, in-memory pool for tests) would confirm.

**Recommendation**: Keep as-is; it's already well-encapsulated. The seam is real (multiple DB implementations possible).

---

### `sampleRepo.js` (MySQL stored procedure wrapper)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `create(sampleData)`<br>`findByUserId(userId)`<br>`findById(id, userId)`<br>`delete(id, userId)` — 4 methods | Each delegates to SQL stored procedure: `sp_create_sample`, `sp_find_samples_by_user`, `sp_find_sample_by_id`, `sp_delete_sample`. Uses `db.execute` from `db.js`. | **Moderate** — small interface (4 methods), but each exercises a different SP hiding complex business logic; two adapters (different DB, different ORM) would confirm real seam |

**Key behaviors**:

- `create`: returns `insertId`
- `findByUserId`: `sp_find_samples_by_user` auto-filters by user_id via JOIN
- `findById`: validates ID + owner, returns first row
- `delete`: validates ownership via SP

**Deletion test**: ✅ Complexity reappears across 3 controllers (`sampleController`, `adminController`, `authController`) that all call repo methods.

**Seam confirmed**: Yes — repo is the primary data access seam. Adapters: MySQL SP, TypeORM repo, in-memory fake for tests.

**Recommendation**: Add business-facing methods to reduce caller complexity, e.g.:

- `countByCategory(category)`
- `exists(id, userId)`
- `getRecentSamples(days)`

These would exercise the SPs through a simpler interface.

---

### `sampleController.js` (sample upload/get/delete)

| Interface                                                                                    | Implementation                                                                                                 | Depth                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uploadSample(req, res)`<br>`getMySamples(req, res)`<br>`deleteSample(req, res)` — 3 methods | Each has: validation, repo call, error handling with file cleanup, physical file deletion, response formatting | **Moderate** — small interface (3 methods), but each implements non-trivial business rules: file cleanup on error, 404 on missing sample/permissions, physical file deletion; extraction of file management into an adapter would deepen it |

**Flow `uploadSample`**:

1. Validate `req.file` + `display_name`, `category` from `req.body`
2. If missing data: delete physical file via `fileHelper`, return 400
3. Get `userId` from `req.userId` (JWT), `filename`, `filePath`
4. Call `sampleRepo.create({user_id, filename, display_name, category, bpm, file_path})`
5. Return 201 with `id`, `path`

**Flow `deleteSample`**:

1. Get `id` from `req.params`, `userId` from `req.userId`
2. Call `sampleRepo.findById(id, userId)` — if not found, return 404
3. Call `sampleRepo.delete(id, userId)`
4. Call `fileHelper.deleteFile(sample.file_path)`
5. Return success

**Seam opportunity**: Extract file storage into `FileStorageAdapter` interface. The controller would then only orchestrate: "validate → repo → storage adapter → respond." This would deepen the controller interface while localizing complexity.

**Deletion test**: ✅ Complexity reappears across upload/get/delete flows; file management logic is duplicated in `adminController.deleteUser()` which also calls `fileHelper` directly.

**Recommendation**: Create `FileStorageAdapter` with `upload(file, metadata)` and `delete(path)` methods. `SampleController` depends on the adapter interface, not the concrete `fileHelper`. This mirrors the repo pattern and deepens the controller.

---

### `adminController.js` (user admin operations)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `getAllUsers(req, res)`<br>`deleteUser(req, res)` — 2 methods | Each has: repo calls, business rule enforcement, file cleanup, response formatting | **Moderate** — 2 methods with cross-cutting business rule ("no self-delete"); the rule is a distinct concern from the deletion orchestration |

**Flow `deleteUser`**:

1. Get `targetUserId` from `req.params`, `adminId` from `req.userId`
2. Business rule: if `targetUserId == adminId`, return 403 ("No puedes eliminar tu propia cuenta")
3. Call `sampleRepo.findByUserId(targetUserId)` to get user's samples
4. Call `userRepo.delete(targetUserId)`
5. If success: delete each sample's physical file via `fileHelper.deleteFile(sample.file_path)`
6. Return success with count of removed files

**Seam opportunity**: Extract the "no self-delete" business rule into a `UserDeletionValidator` service. This would separate the invariant from the orchestration and make the rule testable in isolation.

**Deletion test**: ✅ Complexity reappears across any code that needs to enforce the "no self-delete" invariant.

---

### `authController.js` (registration + login)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `register(req, res)`<br>`login(req, res)` — 2 methods | Each has: validation, crypto/hashing, repo call, token/JWT generation, error handling (ER_DUP_ENTRY), response formatting | **Moderate** — 2 methods, each with security-sensitive logic; password hashing + token generation pair forms a deep interface |

**Flow `register`**:

1. Validate `username`, `password` present
2. `bcrypt.hash(password, 10)`
3. `userRepo.create(username, hashedPassword, 'producer')` — role hardcoded to `'producer'`
4. Return 201 with `userId`

**Flow `login`**:

1. Validate `username`, `password` present
2. `userRepo.findByUsername(username)`
3. Compare password with `bcrypt.compare`
4. If invalid, return 401
5. `jwt.sign({id, role}, SECRET_KEY, {expiresIn: '2h'})`
6. Return 200 with `token`, `role`

**Seam opportunity**: Parameterize role in `register()`: `register(req, res, role = 'producer')`. This increases leverage — callers don't need to know the default role.

**Deletion test**: ✅ Complexity reappears across any auth flow; the registration+hashing+token pattern is duplicated in spirit if not in code.

---

### `middleware/authMiddleware.js` (already analyzed above as `authMiddleware.js`)

Same as `authMiddleware.js` entry in backend modules.

---

### `utils/fileHelper.js` (file system operations)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `deleteFile(relativePath)` — 1 method | `fs.existsSync()` + `fs.unlinkSync()` on `path.join(process.cwd(), relativePath)` | **Shallow** — single method, pure filesystem utility. Deletion would require replacing with cloud storage adapter |

**Seam**: File storage adapter. Currently local filesystem. A cloud storage adapter (S3, Cloudinary) would confirm the seam.

**Recommendation**: Extract into `FileStorageAdapter` interface (see `sampleController.js` recommendation). The adapter pattern would allow switching from local FS to cloud storage without changing callers.

---

## Frontend Modules

### `apiService.js` (centralized fetch wrapper)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `request(endpoint, method = 'GET', data = null, isFormData = false)` — 1 method | Centralized fetch with: token retrieval via `authHelper.getToken()`, auth header setup, content-type management, 401 auto-logout via `authHelper.logout()`, response JSON parsing, error throwing | **Shallow** — one method does multiple concerns (auth, error handling, 401 handling, content-type); the token retrieval + header setup + response parsing are three concerns bundled into one method |

**Flow**: `fetch(`${API_URL}${endpoint}`, config)` → parse JSON → if 401 → `authHelper.logout()` → if !ok → throw Error(result.message || 'Error en la petición') → return result

**Seam opportunity**: Split into more specific methods for depth. Currently shallow because one method handles multiple concerns. Could refactor toward `get(endpoint)`, `post(endpoint, data)`, `upload(endpoint, formData)` — each would encapsulate a concern and increase depth per method... or keep as-is if the frontend is small and practical.

**Deletion test**: ✅ Complexity reappears across all frontend components (`adminFrontController`, `authFrontController`, `samplesFrontController`) that depend on API calls.

**Recommendation**: Evaluate frontend size. If growing, split `request()` into `apiGet()`, `apiPost()`, `apiUpload()` to increase depth and clarity. If staying small, keep as-is with better JSDoc documenting the 401 auto-logout behavior.

---

### `adminFrontController.js` (admin UI controller)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `loadUsers()`<br>`renderUsersTable(users)`<br>`banUser(id)` — 3 methods | Each: DOMContentLoaded event → API call via `apiService` → render table via DOM manipulation; minimal logic beyond orchestration + rendering | **Shallow** — 3 methods but each is mostly orchestration + DOM manipulation; the rendering logic could be extracted into separate adapter components |

**Flow `loadUsers`**:

1. `DOMContentLoaded` → `loadUsers()`
2. `apiService.request('/admin/users', 'GET')`
3. `renderUsersTable(users)`

**Flow `renderUsersTable`**: For each user, create `<tr>`, `<td>`, set textContent, append spans/buttons, inject into `<tbody>`

**Flow `banUser`**: Confirm → `apiService.request(`/admin/users/${id}`, 'DELETE')` → showModal → `loadUsers()`

**Seam opportunity**: Extract table rendering into a `UsersTableAdapter` or `Renderer` component. The front controller would then only handle API orchestration, not DOM details.

**Deletion test**: ✅ Complexity reappears across any admin UI page that needs user listing.

---

### `authFrontController.js` (auth UI controller)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| Login form submit handler<br>Register form submit handler — 2 methods | Each: collect form values → `apiService.request()` → `authHelper.saveSession()` → redirection or modal error | **Shallow** — 2 event handlers; the real logic is in `apiService` and `authHelper`; could deepen by extracting form validation into its own module |

**Flow `login submit`**:

1. `e.preventDefault()`
2. Get `username`, `password` from form inputs
3. `apiService.request('/auth/login', 'POST', {username, password})`
4. `authHelper.saveSession(data.token, data.role)`
5. Redirect based on `data.role`

**Flow `register submit`**: Same pattern with `/auth/register` endpoint.

**Seam opportunity**: Extract form validation into `AuthFormValidator` module. The front controller would then depend on the validator interface, not inline DOM access.

**Deletion test**: ✅ Complexity reappears across any auth UI (login + register forms).

---

### `samplesFrontController.js` (samples UI controller)

| Interface | Implementation | Depth |
|-----------|----------------|-------|
| `loadSamples()`<br>`renderSamplesTable(samples)`<br>`deleteSample(id)`<br>`handleUpload(formData)` — 4 methods | Each: DOMContentLoaded → API call → render table; audio player creation + source URL construction; confirmation + delete API call; FormData construction + `apiService.request()` with `isFormData=true` | **Shallow** — 4 methods but each is mostly UI updates + `apiService` delegation; the audio player creation + source URL construction could be an adapter |

**Flow `renderSamplesTable`**: For each sample, create `<tr>`, `<td>` for name/category/BPM, create `<audio>` element with `<source src="http://localhost:3000${s.file_path}">`, append controls, inject into `<tbody>`

**Flow `handleUpload`**: Construct `FormData` with display_name, category, bpm, audioFile → `apiService.request('/samples/upload', 'POST', formData, true)` → showModal → `uploadForm.reset()` → `loadSamples()`

**Seam opportunity**: Extract audio player construction into `AudioPlayerAdapter` component. The sample renderer would depend on the adapter interface, not hardcoded `http://localhost:3000${s.file_path}`.

**Deletion test**: ✅ Complexity reappears across any samples UI page.

---

## Seam Map (confirmed & potential)

| Seam | Module | Current Adapter | Potential Second Adapter | Status |
| ------ | -------- | ----------------- | ---------------------- | -------- |
| **DB adapter** | `sampleRepo.js` | MySQL SP (`sp_*`) | TypeORM repo, in-memory fake for tests | ✅ Confirmed real |
| **Auth strategy** | `authMiddleware.js` | JWT (`jsonwebtoken`, SECRET_KEY) | Session-based, OAuth2, Passport | ✅ Likely real |
| **File storage** | `fileHelper.js` / `sampleController.js` | Local FS (`path.join(process.cwd(), relativePath)`) | S3, Cloudinary, local in-memory for tests | ✅ Likely real |
| **API client** | `apiService.js` | `fetch` through `/api` prefix | Versioned API (`/v1/api`), mock for tests | ✅ Real (testability) |
| **Auth form validation** | `authFrontController.js` | Inline DOM access + `apiService` | Dedicated `AuthFormValidator` module | Potential |
| **Table rendering** | `adminFrontController.js` / `samplesFrontController.js` | Inline DOM manipulation | `Renderer` / `TableAdapter` components | Potential |
| **Audio player** | `samplesFrontController.js` | Hardcoded `http://localhost:3000${s.file_path}` | `AudioPlayerAdapter` with configurable base URL | Potential |

---

![[seam-map.svg]]

## Deletion Test Summary

| Module | If deleted, does complexity reappear across callers? |
| -------- | ----------------------------------------------------- |
| `sampleRepo.js` | ✅ Yes — 3 controllers call repo methods |
| `authMiddleware.js` | ✅ Yes — all protected routes depend on verifyToken + isAdmin |
| `db.js` | ✅ Yes — all repos use `db.execute` |
| `apiService.js` | ✅ Yes — all frontend components depend on API calls |
| `server.js` | ✅ Yes — route registration, middleware, static serving would need replication |
| `fileHelper.js` | ✅ Yes — any file deletion in controllers would need replacement |
| `sampleController.js` | ✅ Yes — upload/get/delete flows each have validation + repo + error handling + file logic |
| `adminController.js` | ✅ Yes — user listing + deletion with business rule + file cleanup |
| `authController.js` | ✅ Yes — registration + login each have validation + hashing + repo + token |
| `apiService.js` | ✅ Yes — all frontend components depend on API calls |
| `adminFrontController.js` | ✅ Yes — any admin UI page needing user listing |
| `authFrontController.js` | ✅ Yes — any auth UI (login + register) |
| `samplesFrontController.js` | ✅ Yes — any samples UI page |

---

![[depth-priorities.svg]]

## Depth Improvement Recommendations (priority order)

### 1. Extract FileStorageAdapter (sampleController + fileHelper)

- **Why**: File management logic is duplicated (`adminController.deleteUser()` also calls `fileHelper` directly). An adapter interface localizes this complexity and enables cloud storage swapping.
- **How**: Create `FileStorageAdapter` with `upload(file, metadata)` and `delete(path)`. `SampleController` depends on the adapter, not `fileHelper`. `AdminController` can use the same adapter or the concrete implementation.

### 2. Parameterize role in authController.register()

- **Why**: Role is hardcoded to `'producer'`. Parameterizing increases leverage for callers.
- **How**: Change signature to `register(req, res, role = 'producer')`. Callers can pass any role without forking the function.

### 3. Add business-Facing methods to sampleRepo.js

- **Why**: Callers currently need to understand SP return structures (`rows[0][0].insertId`, etc.). Simpler methods reduce interface complexity.
- **How**: Add `countByCategory(category)`, `exists(id, userId)`, `getRecentSamples(days)`.

### 4. Split apiService.js into more specific methods (or document thoroughly)

- **Why**: Single `request()` method is shallow — one method handles auth, content-type, error handling, 401 auto-logout. Splitting increases depth per method.
- **How**: If frontend grows, refactor toward `apiGet(endpoint)`, `apiPost(endpoint, data)`, `apiUpload(endpoint, formData)`. If staying small, add comprehensive JSDoc to the existing method.

### 5. Extract "no self-delete" rule into validator (adminController)

- **Why**: The business rule is a distinct concern from the deletion orchestration. Extracting it makes the rule testable in isolation and keeps the controller focused.
- **How**: Create `UserDeletionValidator` with `canDelete(adminId, targetUserId)` method. `AdminController.deleteUser()` calls this before proceeding.

### 6. Extract table renderers into adapter components (frontend)

- **Why**: Rendering logic is inline in front controllers. Extracting into adapters localizes DOM details and makes controllers focus on orchestration.
- **How**: Create `UsersTableRenderer`, `SamplesTableRenderer` components. Front controllers depend on the renderer interface, not inline DOM manipulation.

### 7. Extract form validation into dedicated modules (frontend)

- **Why**: Form validation is inline in front controllers' event handlers. Dedicated validators reduce duplication and improve testability.
- **How**: Create `AuthFormValidator` module with `validateLogin(formData)` and `validateRegister(formData)` methods. Front controllers depend on the validator interface.

---

## Module Depth Snapshots

### Backend depth chart (small interface + deep implementation = good)

```text
sampleRepo.js:    ██ interface ███████ implementation  → Moderate
sampleController: ██ interface ██████████ implementation → Moderate (file logic could be adapter'd)
authController:   ██ interface ████ implementation → Moderate (parameterize role)
authMiddleware:   ██ interface ████ implementation → Moderate (one adapter confirms seam)
db.js:            ██ interface ███ implementation → Shallow (infrastructure)
server.js:        ██ interface █████ implementation → Shallow (wiring)
```

### Frontend Depth Chart

```text
apiService.js:    ██ interface ██ implementation → Shallow (one method, multiple concerns)
adminFrontCtrl:   ██ interface ███ implementation → Shallow (orchestration + DOM)
authFrontCtrl:    ██ interface ███ implementation → Shallow (event handlers + apiService)
samplesFrontCtrl: ██ interface ████ implementation → Shallow (UI + apiService + audio player)
```

---

## Conclusion

The Sample Vault codebase uses sensible patterns (repository, middleware, controller, service) with the repository pattern in `sampleRepo.js` being the most established seam. Several modules can be deepened by extracting adapter interfaces:

1. **File storage** (`fileHelper`/`sampleController`) — highest priority; duplication across controllers + adapter enables cloud storage
2. **Role parameterization** (`authController`) — low-effort, high-leverage change
3. **Repo business methods** (`sampleRepo`) — reduces caller complexity, exercises SPs through simpler interface
4. **API service splitting** (`apiService`) — evaluate based on frontend growth plans
5. **Validator extraction** (`adminController`/`frontend`) — moderate effort, improves testability

The deletion test confirms that complexity is concentrated in well-placed modules; removing any one would require replicating its logic across multiple callers, which is the expected behavior for modules that earn their keep through depth.
