# SDLC Approach — Rationale

## Contexto del proyecto

- **Tipo:** Brownfield (sistema heredado con código existente)
- **Origen:** Cátedra Prácticas Profesionalizantes II — proyecto "Sample Vault"
- **Estado actual:** Backend (Express + MySQL) y Frontend (vanilla JS) funcionando con tests DOM manuales
- **Documentación existente:** Ninguna (no hay SRS, especificaciones, ni diagramas)
- **Consigna:** Cada alumno implementa una validación faltante + su test

## ¿Por qué NO waterfall?

Waterfall asume que se puede especificar el sistema completo antes de construir. En un proyecto brownfield:

1. El sistema **ya está construido** — no se puede "especificar antes de codificar" lo que ya existe
2. Las **intenciones originales** de los stakeholders no están documentadas ni son accesibles
3. No hay SRS que validar contra el código existente

El único enfoque viable es **aceptar el sistema como está** y agregar requerimientos incrementalmente.

## ¿Por qué evolutivo/iterativo?

El ciclo evolutivo (también llamado "ciclo de mantenimiento correctivo/preventivo con extensión") se adapta porque:

| Característica del proyecto | Lo que exige del SDLC |
| --- | --- |
| Código existente sin documentación | No se puede reiniciar el análisis desde cero → ciclos pequeños sobre puntos específicos |
| Cada validación es independiente | Permite paralelismo y ramificación por alumno |
| El TP entrega por branch individual | Cada ciclo produce un incremento verificable (commits en `apellido_nombre`) |
| Hay que defender oralmente | Cada alumno puede explicar su mini-ciclo completo: RE → Diseño → Código → Test |

## Estructura del mini-ciclo

```text
┌──────────────────────────────────────┐
│ 1. REQUIRIMIENTO (RE forward-only)   │
│    NFR format                        │
│    Criterios de aceptación checklist │
└───────────┬──────────────────────────┘
            ▼
┌──────────────────────────────────────┐
│ 2. ANÁLISIS DE IMPACTO               │
│    ¿Qué archivos tocar?              │
│    ¿Backend? ¿Frontend? ¿Multer?     │
└───────────┬──────────────────────────┘
            ▼
┌──────────────────────────────────────┐
│ 3. IMPLEMENTACIÓN                    │
│    Backend: validación + status code │
│    Frontend: showModal con mensaje   │
└───────────┬──────────────────────────┘
            ▼
┌──────────────────────────────────────┐
│ 4. TEST                              │
│    Botón en tests.html               │
│    Verificar HTTP status + modal     │
└───────────┬──────────────────────────┘
            ▼
┌──────────────────────────────────────┐
│ 5. COMMIT + BRANCH                   │
│    Branch: apellido_nombre           │
│    Commit: "feat: nfr-002 password   │
│             length validation"       │
└──────────────────────────────────────┘
```

## Ventajas de este enfoque

1. **Trazabilidad:** cada validación tiene un archivo `.md` que la especifica + un test que la verifica
2. **Defensa oral:** el alumno presenta su NFR, muestra el código y ejecuta el test
3. **Reutilizable:** el esquema sirve para cualquier proyecto brownfield futuro
4. **Ágil pero documentado:** no es "codificar nomás" pero tampoco es "escribir un SRS de 50 páginas"
