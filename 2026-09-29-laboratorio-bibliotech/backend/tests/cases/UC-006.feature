Feature: UC-006 Descargar archivo original
  # FR-008 (apoya FR-007). Fuente: docs/02-requirements/use-cases/UC-006-download.md
  # Ejecutable en: backend/test/e2e/materials-flow.spec.ts (DownloadFileUseCase)

  Scenario: descarga PDF con JWT
    Given material id 9 con binario PDF y JWT Student
    When GET /material/9/file
    Then 200 con Content-Type application/pdf y Content-Disposition inline con filename
    And FR-008 is recorded in RTM as covered

  Scenario: descarga sin token
    Given material existente id 9
    When GET /material/9/file sin token
    Then 401
    And BR-002 is recorded in RTM as covered

  Scenario: descarga EPUB preserva tipo y nombre
    Given material EPUB id 10 con binario y JWT Student
    When GET /material/10/file
    Then 200 con Content-Type application/epub+zip y Content-Disposition inline con filename original
    And FR-008 is recorded in RTM as covered

  Scenario: id inexistente con token valido
    Given JWT valido e id 999999 inexistente
    When GET /material/999999/file
    Then 404
    And FR-008 is recorded in RTM as covered

  Scenario: id inexistente sin token responde 401 primero
    Given id 999999 inexistente y ningun header Authorization
    When GET /material/999999/file sin token
    Then 401 (auth primero, no 404)
    And BR-002 is recorded in RTM as covered

  Scenario: binario huerfano (metadatos sin archivo)
    Given material id 11 sin blob asociado y JWT valido
    When GET /material/11/file
    Then 500 con log de inconsistencia
    And FR-008 is recorded in RTM as covered

  Scenario: storage caido
    Given material id 9 con binario, JWT valido y FileStorage caido
    When GET /material/9/file
    Then 503
    And FR-008 is recorded in RTM as covered
