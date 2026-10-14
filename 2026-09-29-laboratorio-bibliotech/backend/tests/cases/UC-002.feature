Feature: UC-002 Subir material
  # FR-004 + BR-004 + RST-005 + NFR-005. Fuente: docs/02-requirements/use-cases/UC-002-upload.md
  # Ejecutable en: backend/test/e2e/materials-flow.spec.ts (UploadMaterialUseCase + MaterialsController + guards)

  Scenario: subida valida Professor crea Material + FileBlob 1-1
    Given JWT Professor y PDF "redes.pdf" de 1024 bytes con title "Redes" y author "Tanenbaum"
    When POST /material multipart con file + metadatos validos
    Then 201 con id y blobId nuevos y material consultable via GET /material/:id
    And FR-004 is recorded in RTM as covered

  Scenario: subida valida con opcionales subject year edition tags
    Given JWT Professor y PDF con title "Redes" y author "Tanenbaum" mas subject "informatica", year 2020, edition "2da" y tags ["redes", "ospf"]
    When POST /material con esos opcionales
    Then 201 y GET /material/:id devuelve los opcionales persistidos
    And FR-004 is recorded in RTM as covered

  Scenario: Student intenta subir
    Given JWT Student
    When POST /material con PDF valido
    Then 403 y nada persistido
    And FR-004 is recorded in RTM as covered

  Scenario: subida sin token
    Given ningun header Authorization
    When POST /material con PDF valido
    Then 401 (BR-002: auth primero) y nada persistido
    And FR-003 is recorded in RTM as covered

  Scenario: MIME no permitido antes de persistir
    Given JWT Professor y archivo "foto.png" (image/png, 100 bytes)
    When POST /material con ese archivo
    Then 415 con mensaje MIME permitido PDF/EPUB y nada persistido
    And NFR-005 is recorded in RTM as covered

  Scenario: archivo excede 50MB antes de persistir
    Given JWT Professor y binario PDF de 52428801 bytes (50MB + 1)
    When POST /material con ese binario
    Then 413 y nada persistido
    And NFR-005 is recorded in RTM as covered

  Scenario: archivo exactamente 50MB es aceptado (borde)
    Given JWT Professor y binario PDF de 52428800 bytes
    When POST /material con ese binario y metadatos validos
    Then 201
    And RST-005 is recorded in RTM as covered

  Scenario: metadatos invalidos (titulo ausente)
    Given JWT Professor y PDF valido sin title
    When POST /material sin title
    Then 400 via class-validator y nada persistido
    And FR-004 is recorded in RTM as covered

  Scenario: metadatos invalidos (anio fuera de rango)
    Given JWT Professor y PDF valido con year 999
    When POST /material con year 999
    Then 400 y nada persistido
    And FR-004 is recorded in RTM as covered

  Scenario: metadatos invalidos (tags duplicados tras normalizar)
    Given JWT Professor y PDF valido con tags ["Redes", "redes"]
    When POST /material con esos tags
    Then 400 (duplicado case-insensitive) y nada persistido
    And FR-004 is recorded in RTM as covered

  Scenario: binario duplicado crea dos recursos (BR-004, sin 409 por contenido)
    Given material existente con bytes B y JWT Professor
    When POST /material con bytes B (aunque el filename difiera)
    Then 201 con id y blobId nuevos y ambos materiales consultables
    And BR-004 is recorded in RTM as covered

  Scenario: fallo de escritura en storage revierte metadatos (E-001)
    Given JWT Professor, PDF valido y FileStorage que falla al persistir
    When POST /material
    Then 500 y ningun Material ni FileBlob persistido (rollback)
    And FR-004 is recorded in RTM as covered
