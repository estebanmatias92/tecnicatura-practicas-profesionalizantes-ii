# CRC Cards — BiblioTech (RDD, Wirfs-Brock)

> Una tarjeta por clase candidata. Sustantivos de UC → clases; verbos → responsabilidades; pasos → colaboradores. Filtro: Information Expert + High Cohesion.

## User (Information holder)

- **Role stereotype**: Information holder
- **Source**: UC-001, UC-004 (FR-001/FR-011)
- **Responsibilities — doing**: registra credenciales validadas; cambia de rol (vía Admin)
- **Responsibilities — knowing**: conoce email, passwordHash, role
- **Collaborators**: Validator, UserRepository
- **GRASP (architect)**: Information Expert → pendiente

### Walkthrough

- UC-001 paso 2 → valida email/password → Validator
- UC-001 paso 3 → persiste usuario → UserRepository

## Material (Information holder)

- **Role stereotype**: Information holder
- **Source**: UC-002, UC-003, UC-004 (FR-004/FR-007/FR-012/FR-013)
- **Responsibilities — doing**: expone metadatos a todo rol autenticado (title/author + subject/year/edition/tags opcionales); al eliminarse borra su FileBlob (C-1/C-3)
- **Responsibilities — knowing**: conoce título, autor, subject, year, edition, tags, ownerId, blobId, createdAt
- **Collaborators**: User (owner), FileBlob (1:1), MaterialRepository
- **GRASP (architect)**: Information Expert → pendiente

### Walkthrough

- UC-002 paso 4 → asigna owner + blobId → User, FileBlob
- UC-003 paso 3 → responde a todo rol autenticado → MaterialRepository
- UC-004 C-1/C-3 → delete material → delete blob → MaterialRepository, FileBlobRepository

## FileBlob (Information holder, v0.4.0)

- **Role stereotype**: Information holder
- **Source**: UC-002, UC-006, UC-004 (FR-004/FR-008, BR-004 cascada)
- **Responsibilities — doing**: guarda bytes vía Multer/FileStorage; muere con su Material (sin refCount, sin compartir)
- **Responsibilities — knowing**: conoce storageKey, mime, sizeBytes, fileName (normalizado), contentHash informativo no-único, createdAt
- **Collaborators**: Material (1:1), FileStorage, FileBlobRepository
- **GRASP (architect)**: Information Expert → pendiente

### Walkthrough

- UC-002 paso 4 → crea blob nuevo por cada POST (duplicados → 201) → FileStorage
- UC-006 paso 3 → sirve bytes + fileName normalizado por storageKey → FileStorage
- UC-004 C-1/C-2/C-3 → cascada borra blob con su material/cuenta → FileBlobRepository

## AuthSession (Service provider)

- **Role stereotype**: Service provider
- **Source**: UC-001 (FR-002)
- **Responsibilities — doing**: delega verificación BCrypt a PasswordHasher; delega emisión/validación JWT a TokenSigner
- **Responsibilities — knowing**: conoce token, userId, expiración
- **Collaborators**: User, UserRepository
- **GRASP (architect)**: Controller/Indirection → pendiente

### Walkthrough

- UC-001 paso 3 → PasswordHasher.compare/hash → User.passwordHash (ADR-0004)
- UC-001 paso 4 → TokenSigner.sign ≤24h → caller

## UserRepository (Interfacer)

- **Role stereotype**: Interfacer
- **Source**: UC-001, UC-004 (RST-004)
- **Responsibilities — doing**: persiste/busca usuarios; borra en cascada materials + blobs vía colaboradores (C-2); sin reglas de negocio
- **Responsibilities — knowing**: conoce mapeo User ↔ MariaDB
- **Collaborators**: User, MaterialRepository, MariaDB
- **GRASP (architect)**: Indirection → pendiente

## MaterialRepository (Interfacer)

- **Role stereotype**: Interfacer
- **Source**: UC-002, UC-003, UC-004, UC-005 (RST-004)
- **Responsibilities — doing**: persiste/busca material con filtros (q + campos, AND, paginación); borra material + su blob (C-1/C-3)
- **Responsibilities — knowing**: conoce mapeo Material ↔ MariaDB
- **Collaborators**: Material, FileBlob, MariaDB
- **GRASP (architect)**: Indirection → pendiente

## FileBlobRepository (Interfacer, v0.4.0)

- **Role stereotype**: Interfacer
- **Source**: UC-002, UC-006, UC-004 (RST-004, BR-004 cascada)
- **Responsibilities — doing**: persiste/borra blobs 1:1 con su material; sin dedup, sin búsqueda por hash
- **Responsibilities — knowing**: conoce mapeo FileBlob ↔ MariaDB/storage
- **Collaborators**: FileBlob, MariaDB
- **GRASP (architect)**: Indirection → pendiente

## Validator (Service provider)

- **Role stereotype**: Service provider
- **Source**: UC-001, UC-002 (BR-003, NFR-005)
- **Responsibilities — doing**: valida email/password (class-validator); valida MIME/tamaño; valida subject/year/edition/tags (v0.3.0); normaliza `file_name` (basename, sin path/CRLF, v0.5.0)
- **Responsibilities — knowing**: conoce reglas, no datos
- **Collaborators**: User, Material (candidatos a validar)
- **GRASP (architect)**: Pure Fabrication → pendiente

## FileStorage (Service provider)

- **Role stereotype**: Service provider
- **Source**: UC-002, UC-006 (NFR-005)
- **Responsibilities — doing**: guarda binario vía Multer como FileBlob nuevo por cada POST; entrega/borra por storageKey en cascada
- **Responsibilities — knowing**: conoce storageKey → bytes
- **Collaborators**: FileBlob, FileBlobRepository
- **GRASP (architect)**: Indirection → pendiente
