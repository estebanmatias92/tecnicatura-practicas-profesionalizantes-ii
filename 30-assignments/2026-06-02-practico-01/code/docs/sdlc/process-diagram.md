# SDLC Process Diagram — Sample Vault

## Visión general del ciclo adaptado

```mermaid
flowchart TB
    subgraph Inicio
        A[Legacy Codebase<br/>Sample Vault] --> B[Identify Gap<br/>1 validation from backlog]
    end

    subgraph Mini-Cycle
        direction TB
        C[RE Forward<br/>User Story + Gherkin]
        D[Design<br/>Map files to modify]
        E[Implement<br/>Backend + Frontend]
        F[Test<br/>DOM button + modal check]
    end

    subgraph Delivery
        G[Commit to branch<br/>apellido_nombre]
        H[Oral Defense<br/>Show cycle artifacts]
    end

    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    F -->|Pass| G
    F -->|Fail| E
    G --> H
```

## Artefactos por fase

```mermaid
flowchart LR
    subgraph RE
        R1[req-NNN-slug.md]
        R2[User Story]
        R3[Gherkin Scenarios]
    end

    subgraph Design
        D1[File map:<br/>controller, routes,<br/>middleware, frontend]
    end

    subgraph Implementation
        I1[Backend:<br/>validation logic<br/>HTTP status code]
        I2[Frontend:<br/>showModal message]
    end

    subgraph Test
        T1[test button<br/>in tests.html]
        T2[Verification:<br/>status + modal]
    end

    R1 --> D1
    D1 --> I1
    D1 --> I2
    I1 --> T1
    I2 --> T1
    T1 --> T2
```

## Layout de archivos

```text
code/
├── docs/                         ← Artefactos SDLC
│   ├── sdlc/
│   │   ├── README.md             ← Enfoque general
│   │   ├── approach.md           ← Justificación brownfield
│   │   └── process-diagram.md    ← Este archivo
│   ├── requirements/
│   │   ├── README.md             ← Estrategia RE en brownfield
│   │   ├── validations-backlog.md ← Backlog con estado
│   │   └── req-*.md              ← User Stories + Gherkin
│   └── RE-brownfield-reference.md
├── backend/
│   ├── controllers/              ← Validación implementada
│   ├── middleware/               ← Guards, verifyToken
│   ├── config/
│   │   └── multerConfig.js      ← Filtros MIME, límites
│   └── ...
├── frontend/
│   ├── js/
│   │   ├── frontControllers/    ← showModal en catch
│   │   ├── tests/               ← Nuevo botón de test
│   │   └── ...
│   └── ...
└── ...
```

## Flujo de trabajo por alumno

```mermaid
gitGraph
    commit id: "initial codebase"
    branch lapenta_carlos_matias
    checkout lapenta_carlos_matias
    commit id: "docs: add req-002 user story"
    commit id: "feat: password length validation backend"
    commit id: "feat: password length test frontend"
    checkout main
```
