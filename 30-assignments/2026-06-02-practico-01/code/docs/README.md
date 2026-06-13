# Sample Vault — Documentación del proyecto

Sample Vault es un sistema **brownfield** (código existente sin documentación original) para la gestión de librerías de samples de audio. Este directorio contiene todos los artefactos de ingeniería generados para extenderlo con nuevas validaciones, siguiendo un ciclo de vida evolutivo con RE forward-only.

## Estructura

```text
docs/
├── README.md                 ← Este archivo (punto de entrada)
├── sdlc/                     ← Ciclo de vida del desarrollo
│   ├── README.md             ← Enfoque general (evolutivo/iterativo)
│   ├── approach.md           ← Justificación brownfield detallada
│   └── process-diagram.md    ← Diagramas del proceso + layout de archivos
├── requirements/             ← Ingeniería de requerimientos
│   ├── README.md             ← Estrategia RE forward-only
│   ├── validations-backlog.md ← Estado de las 10 validaciones del TP
│   └── req-*.md              ← User Stories + Gherkin (una por validación)
└── diagrams/                 ← Diagramas de arquitectura
    ├── README.md             ← Índice + mapeo validación → diagrama
    ├── context-diagram.md    ← C4 Context (actores, sistemas externos)
    ├── layer-diagram.md      ← Capas (Frontend → API → DB/FS)
    ├── package-diagram.md    ← Paquetes UML del backend y frontend
    ├── sequence-login.md     ← Secuencia de autenticación
    ├── sequence-upload.md    ← Secuencia de subida de audio
    ├── sequence-delete.md    ← Secuencia de eliminación con ownership
    └── erd.md                ← Entidad-Relación (tablas, SPs, permisos)
```

## Ciclo de vida (SDLC)

Cada validación sigue un mini-ciclo completo de 5 fases:

```text
RE forward-only → Diseño → Implementación → Test → Commit
```

El enfoque es **evolutivo/iterativo** porque:

- El sistema ya existe (brownfield), no aplica waterfall
- Cada validación es independiente y puede desarrollarse en paralelo
- Los tests DOM verifican inmediatamente si la validación funciona

→ Ver [`sdlc/README.md`](./sdlc/README.md)

## Estrategia de requerimientos (RE)

No se reconstruyen requerimientos del pasado. Cada validación nueva se especifica con:

- **User Story** (rol, acción, beneficio)
- **Criterios de Aceptación en Gherkin** (Dado/Cuando/Entonces)
- **Mapa de implementación** (archivos a modificar)
- **Test ejecutable** (botón DOM contra API real)

Cada requerimiento se documenta en `requirements/req-NNN-slug.md`.

→ Ver [`requirements/README.md`](./requirements/README.md)

## Backlog de validaciones

El archivo [`requirements/validations-backlog.md`](./requirements/validations-backlog.md) contiene las 10 validaciones del TP con su estado actual:

| Estado | Significado |
| ------ | ----------- |
| ✅ | Implementado |
| ⚠️ | Parcial / incompleto |
| ❌ | No implementado |
| 📝 | User Story redactada |
| 🔧 | En implementación |
| 🧪 | Test escrito |
| 🚀 | Ciclo completo |

## Diagramas

Los diagramas (C4, capas, paquetes, secuencias, ERD) son artefactos de la fase de **Diseño** del ciclo adaptado. Cada validación del backlog está mapeada a los diagramas donde impacta.

→ Ver [`diagrams/README.md`](./diagrams/README.md)

## Flujo de lectura recomendado

```text
1. sdlc/README.md                       → Entender el ciclo de vida y por qué se eligió
2. requirements/README.md               → Cómo se especifica cada validación
3. requirements/validations-backlog.md  → Estado actual de las 10 validaciones
4. diagrams/README.md                   → Explorar la arquitectura del sistema
5. requirements/req-NNN-slug.md         → Leer la especificación de una validación concreta
6. Código fuente                        → Ver la implementación (backend + frontend + tests)
```

## Referencias externas

- [RE Brownfield — Referencia Rápida](../sdlc/approach.md) (nota metodológica general)
