---
description: Completa el ciclo completo de una validación NFR-NNN (backend + frontend + tests + backlog)
---

Completar el ciclo de la validación NFR-NNN siguiendo estos pasos:

1. Leer `docs/requirements/nfr-NNN-slug.md` — entender criterios de aceptación y mensajes esperados
2. Implementar validación backend (HTTP status + mensaje JSON específico en el controlador)
3. Implementar manejo frontend (showModal con el mensaje exacto del spec)
4. Escribir tests DOM en `frontend/js/tests/` siguiendo el patrón createTestButton con `await testUtils.resetState()` primero
5. Actualizar `docs/requirements/validations-backlog.md` (fila + resumen)
6. Tildar checkboxes en `docs/requirements/nfr-NNN-slug.md` (`[ ]` → `[x]`)
7. Preguntar al usuario si quiere ejecutar `npm run typecheck && npm run lint` si existe, sino informar que no hay

Branch base: `lapenta_carlos_matias`
