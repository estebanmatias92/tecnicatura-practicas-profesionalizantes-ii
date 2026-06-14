# Requirements Engineering Strategy — Brownfield

## Enfoque: RE forward-only (especificación hacia adelante)

Dado que el proyecto es **brownfield** (código existente sin documentación de requerimientos), no se aplica RE desde cero. En lugar de reconstruir especificaciones del pasado (lo que implicaría inferir intenciones de stakeholders inaccesibles), se documenta **solamente lo nuevo que se incorpora**.

### Principios

1. **No reconstruir el pasado.** El sistema ya funciona; no tiene sentido especular sobre lo que "debía hacer" originalmente.
2. **Documentar hacia adelante.** Cada nueva validación se especifica antes de implementarse, generando su propio artefacto RE.
3. **Formato mínimo.** Criterios de aceptación en checklist. No se necesita un SRS completo.
4. **Test como validación.** El criterio de aceptación se verifica mediante test manual en frontend (botón DOM).

### Anatomía de un NFR (validación)

Dado que las 10 validaciones del backlog son **guardas de seguridad, performance e integridad sobre funcionalidad existente**, se documentan como **Requerimientos No Funcionales (NFR)**. Cada NFR se especifica en `docs/requirements/nfr-NNN-slug.md` con esta estructura:

```markdown
# NFR-NNN: Título de la validación

## Categoría
[Seguridad / Performance / Fiabilidad / Mantenibilidad / UX / Integridad]

## Descripción
Qué validación se agrega, por qué es necesaria, qué protege.

## Criterios de aceptación
- [ ] [condición de entrada] → [código HTTP] + modal "[mensaje exacto]"
- [ ] [condición de entrada alternativa] → [código HTTP] + modal "[mensaje exacto]"

## Implementación
- **Backend:** [archivo(s) a modificar]
- **Frontend:** [archivo(s) a modificar y mensaje del modal]
- **Test:** [archivo de test y qué verifica]

## Estado
[Pendiente / En Progreso / Completado]
```

### Diferencia con RE tradicional

| Aspecto | RE tradicional (greenfield) | RE brownfield (este proyecto) |
| --------- | ---------------------------- | ------------------------------- |
| Punto de partida | Necesidades de stakeholders | Código existente + gaps identificados |
| Elicitación | Entrevistas, workshops | Reverse-engineer del código + consigna del TP |
| Especificación | SRS completo (IEEE 830) | NFR checklist por gap |
| Validación | Revisiones con stakeholders | Test manual (botón DOM) |
| Alcance | Todo el sistema | Solo lo nuevo que se agrega |

### ¿Por qué checklist de aceptación en lugar de Gherkin?

1. **No hay automatización BDD.** Gherkin (Given/When/Then) está diseñado para frameworks como Cucumber. Nuestros tests son manuales y se ejecutan clickeando botones en el DOM; el overhead sintáctico de Gherkin no aporta valor ejecutable.
2. **Cada validación es una guarda, no una feature.** No hay escenarios complejos con múltiples caminos — son condiciones binarias (pasa/no pasa) que se capturan mejor con un checklist.
3. **Legibilidad para defensa oral.** Un checklist es más directo de presentar y verificar en vivo que un escenario Gherkin.
4. **Los tests JS ya son el "executable specification".** El código en `frontend/js/tests/` cumple el rol de especificación ejecutable; duplicarlo en Gherkin sería redundante.

### Proceso para agregar un requerimiento

```text
1. Identificar el gap en el backlog
2. Redactar `docs/requirements/nfr-NNN-slug.md` con descripción + criterios de aceptación (checklist)
3. Mapear archivos a modificar (diseño)
4. Implementar backend + frontend
5. Escribir test (botón DOM, comenzando con `await testUtils.resetState()`)
6. Verificar que el test pasa
7. Marcar como Completado en el backlog
```
