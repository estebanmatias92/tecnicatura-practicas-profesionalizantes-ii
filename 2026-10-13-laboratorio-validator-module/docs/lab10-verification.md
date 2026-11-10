# Lab 10 — Validador de mensajes localizados (evidencia de verificación)

Fecha: 2026-11-10
Rama: `main`
Commits de la iteración: `4fd9323` (ticket 01), `3aaa41f` (ticket 02), y el de ticket 03.

## Comandos ejecutados

```bash
cd backend
npm test                                  # 6 suites, 74 tests, todos verdes
npm run test:e2e                          # e2e contra MariaDB, 7 tests verdes
npm run test:cov                          # cobertura: messages 100% líneas
npm run lint                              # eslint, 0 errores
npm run build                             # nest build (typecheck), OK sin errores
```

## Resultado esperado

- `EmailValidator` y `PasswordValidator` lanzan el texto del catálogo en el idioma activo.
- `setLanguage('en')` cambia el idioma en caliente y `setLanguage('fr')` (no soportado) conserva el idioma previo.
- Fallback `activo → es → validation.resource.invalid`; nunca `undefined`.
- Cobertura global de `src/model/messages/**` ≥ 80 % (catálogo 100, language-manager 100).
- DTO path (Bad Request, array) y dominio path (VALIDATION, string) comparten `resolve()`.
- Ningún mensaje de `class-validator` llega al cliente; mensajes por defecto no aparecen en los bodies 400.

## E2e de localización de contraseñas y email

- Registro y login con email inválido en `es` y `en` (400, mensaje localizado, `error` estable).
- Registro con contraseña corta, larga o vacía en `es` y `en` (400, mensaje localizado).
- Login con contraseña que excede el máximo (400, mensaje localizado).
- Email no en texto plano/validation `@IsString` localizado; ambos idiomas cubiertos.
- `class-validator` defaults ausentes en los bodies de respuesta 400.

## Notas

- RF-01 (módulo validador Lab 09) verificado intacto; sin tickets de reconstrucción.
- El alta de usuario Admin por el endpoint de Admin queda fuera del alcance de los e2e de esta iteración (solo registro y login), según la decisión confirmada.
- `docs/requirements.md` contiene FR-017…FR-022, NFR-013…NFR-015 y US-009.
- Diagrams actualizados: component-architecture, component-backend, class-diagram, class-validation, seq-validation-error.
