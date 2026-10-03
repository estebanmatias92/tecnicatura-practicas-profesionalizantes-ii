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
- **Source**: UC-002, UC-003 (FR-004/FR-007)
- **Responsibilities — doing**: expone metadatos a todo rol autenticado (title/author + subject/year/edition/tags opcionales)
- **Responsibilities — knowing**: conoce título, autor, subject, year, edition, tags, contentHash (SHA-256 de bytes), mime, tamaño, storageKey, ownerId
- **Collaborators**: User (owner), MaterialRepository
- **GRASP (architect)**: Information Expert → pendiente

### Walkthrough

- UC-002 paso 4 → asigna owner → User
- UC-003 paso 3 → responde a todo rol autenticado → MaterialRepository

## AuthSession (Service provider)

- **Role stereotype**: Service provider
- **Source**: UC-001 (FR-002)
- **Responsibilities — doing**: verifica BCrypt; emite y valida JWT
- **Responsibilities — knowing**: conoce token, userId, expiración
- **Collaborators**: User, UserRepository
- **GRASP (architect)**: Controller/Indirection → pendiente

### Walkthrough

- UC-001 paso 4 → compara hash → User.passwordHash
- UC-001 paso 5 → firma JWT ≤24h → caller

## UserRepository (Interfacer)

- **Role stereotype**: Interfacer
- **Source**: UC-001, UC-004 (BR-006)
- **Responsibilities — doing**: persiste/busca usuarios; sin reglas de negocio
- **Responsibilities — knowing**: conoce mapeo User ↔ MariaDB
- **Collaborators**: User, MariaDB
- **GRASP (architect)**: Indirection → pendiente

## MaterialRepository (Interfacer)

- **Role stereotype**: Interfacer
- **Source**: UC-002, UC-003, UC-005 (BR-006)
- **Responsibilities — doing**: persiste/busca material con filtros (q + campos, AND, paginación); busca por contentHash (dedup BR-007)
- **Responsibilities — knowing**: conoce mapeo Material ↔ MariaDB
- **Collaborators**: Material, MariaDB
- **GRASP (architect)**: Indirection → pendiente

## Validator (Service provider)

- **Role stereotype**: Service provider
- **Source**: UC-001, UC-002 (BR-003, NFR-005)
- **Responsibilities — doing**: valida email/password (class-validator); valida MIME/tamaño; valida subject/year/edition/tags (v0.3.0)
- **Responsibilities — knowing**: conoce reglas, no datos
- **Collaborators**: User, Material (candidatos a validar)
- **GRASP (architect)**: Pure Fabrication → pendiente

## FileStorage (Service provider)

- **Role stereotype**: Service provider
- **Source**: UC-002, UC-006 (NFR-005)
- **Responsibilities — doing**: guarda binario vía Multer; calcula SHA-256 sobre los bytes (no el filename); entrega por storageKey
- **Responsibilities — knowing**: conoce storageKey → bytes
- **Collaborators**: Material, MaterialRepository
- **GRASP (architect)**: Indirection → pendiente
