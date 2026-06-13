# Requirements Engineering Strategy — Brownfield

## Enfoque: RE forward-only (especificación hacia adelante)

Dado que el proyecto es **brownfield** (código existente sin documentación de requerimientos), no se aplica RE desde cero. En lugar de reconstruir especificaciones del pasado (lo que implicaría inferir intenciones de stakeholders inaccesibles), se documenta **solamente lo nuevo que se incorpora**.

### Principios

1. **No reconstruir el pasado.** El sistema ya funciona; no tiene sentido especular sobre lo que "debía hacer" originalmente.
2. **Documentar hacia adelante.** Cada nueva validación se especifica antes de implementarse, generando su propio artefacto RE.
3. **Formato mínimo.** User Story + Criterios de Aceptación (Gherkin). No se necesita un SRS completo.
4. **Test como validación.** El criterio de aceptación se verifica mediante test automatizado en frontend (botón DOM).

### Anatomía de un requerimiento

Cada validación se documenta en `docs/requirements/req-NNN-slug.md` con esta estructura:

```markdown
# RF-NNN: Título de la validación

## User Story
Como [rol], quiero [acción], para [beneficio].

## Criterios de Aceptación (Gherkin)

### Escenario 1: [descripción]
Dado [contexto inicial]
Cuando [evento/acción]
Entonces [resultado esperado]

### Escenario 2: ...
Dado ...
Cuando ...
Entonces ...

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
| Especificación | SRS completo (IEEE 830) | User Story + Gherkin por gap |
| Validación | Revisiones con stakeholders | Test ejecutable (frontend DOM) |
| Alcance | Todo el sistema | Solo lo nuevo que se agrega |

### ¿Por qué User Stories y no SRS?

1. **No hay stakeholders disponibles** para validar un SRS completo.
2. El sistema ya existe, no se negocia el alcance desde cero.
3. User Stories capturan **valor de negocio** en lugar de especificación técnica exhaustiva.
4. Gherkin proporciona **criterios ejecutables** que se traducen directamente a tests.
5. Cada validación es independiente (como una historia en un backlog).

### Proceso para agregar un requerimiento

```
1. Identificar el gap en el backlog
2. Redactar User Story (Como... Quiero... Para...)
3. Definir escenarios Gherkin (Dado... Cuando... Entonces...)
4. Mapear archivos a modificar (diseño)
5. Implementar backend + frontend
6. Escribir test (botón DOM)
7. Verificar que el test pasa
8. Marcar como Completado en el backlog
```
