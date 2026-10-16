# ADR-0004: Autenticación y sesión — JWT + BCrypt con revocación por `token_version`

- **Status**: Accepted
- **Date**: 2026-10-16
- **Deciders**: Tech Lead + Stakeholder (aprobado por usuario 2026-10-16)
- **Consulted**: `docs/02-requirements/SRS.md` §4 (NFR-003/004/006), `UC-001`, `UC-004` (Token Invalidation v0.5.0)

## Context

BR-002 exige JWT en todo acceso; NFR-003 fija BCrypt ≥10 y expiración JWT ≤24h; NFR-004 prohíbe secretos en claro/logs; NFR-006 (v0.5.0, BT-09) exige **ventana objetivo 0**: el cambio de rol o el borrado de cuenta debe invalidar los tokens ya emitidos, de modo que ninguna mutación pueda ejecutarse con un rol que la cuenta ya no posee. Sin revocación, un JWT stateless sigue siendo válido hasta expirar (≤24h), violando NFR-006. Faltaba un ADR que registrara TTL, cost y secreto (BT-05 §7).

## Decision

- **Hashing**: BCrypt con `cost = 10` como mínimo, detrás del puerto `PasswordHasher` (`BcryptHasher` en Frameworks). Nunca se compara ni persiste password en claro.
- **Token**: JWT firmado por `TokenSigner` (`JwtTokenSigner` sobre `@nestjs/jwt`), expiración ≤24h (`JWT_EXPIRES_H`, default 24). El `JWT_SECRET` es obligatorio y sin default inseguro (NFR-004).
- **Revocación (NFR-006)**: `users.token_version INT` (default 0). El JWT incluye el claim `ver`. `JwtAuthGuard` compara el `ver` del token con `users.token_version` vigente; si difieren → 401. El cambio de rol (`PATCH /users/:id`) y el borrado de cuenta (C-2) **incrementan la versión**, invalidando con ventana 0 todos los tokens previos.
- **Fuera**: refresh tokens, rotación de secreto, MFA (no requeridos v1).

## Responsibility assignment (GRASP)

- `PasswordHasher`/`TokenSigner` — **Indirection** + **Protected Variations** (`Mission:` both sides depend on something stable) implementado con GoF **Adapter** (`BcryptHasher`/`JwtTokenSigner`): el core no conoce BCrypt/JWT.
- `User.tokenVersion` — **Information Expert** (`Mission:` co-locate behavior with information): la cuenta conoce su versión; `JwtAuthGuard` la consulta vía `UserRepository.findById`.
- `JwtAuthGuard`/`RolesGuard` — **Adapter** (Indirection): verifican token + `ver` contra `users.token_version` antes de llegar al UseCase (BR-002, 401 primero).

## Consequences

- **Positive**: cumple NFR-003/004 y NFR-006 con ventana 0; revocación stateless-friendly (una columna, un claim, una comparación); rotación de credenciales por cambio de rol efectiva de inmediato.
- **Negative / Costs**: el guard hace una lectura de `users` por request (`token_version`); se mitiga con caché/índice por PK. Firma de token no es "pura stateless" (hay un lookup de versión).
- **Risks**: bump accidental de versión invalida tokens de más — acotado a operaciones Admin explícitas; testeable con matriz de revocación.

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| JWT stateless sin revocación (≤24h) | Cero estado, simple | Ventana ≤24h con rol viejo → viola NFR-006 (BT-09) | Incumple NFR-006 "ventana 0" |
| Denylist de `jti` con TTL | Revocación granular por token | Tabla + job de limpieza; crece con cada emisión | Más superficie que una versión por cuenta a escala lab |
| Access + refresh tokens | Sesiones largas revocables | Complejidad de flujos/refresh | No requerido v1; el TTL ≤24h ya acota |
| TTL muy corto (p. ej. 5 min) | Reduce ventana | Peor UX; no llega a 0; RE lo desmiente | No cumple "ventana objetivo 0" |

## Compliance

Audit de config (BCrypt cost ≥10, TTL ≤24h, `JWT_SECRET` presente) + test de revocación (rol cambiado/borrado ⇒ token previo 401). Traza: NFR-003/004/006, FR-002/FR-011, UC-001/UC-004.

## References

- NFR-003, NFR-004, NFR-006; FR-002, FR-011; BR-002, BR-003; UC-001, UC-004
- `class-diagram.puml` (`PasswordHasher`/`TokenSigner`, `User.tokenVersion`), `sequence-diagram-UC-001.puml`, `sequence-diagram-UC-004.puml`, `data-model-er.puml`
