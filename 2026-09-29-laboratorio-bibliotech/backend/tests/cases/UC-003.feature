Feature: UC-003 Consultar catalogo y leer material
  # FR-006, FR-007 + BR-002. Fuente: docs/02-requirements/use-cases/UC-003-read.md
  # Ejecutable en: backend/test/e2e/materials-flow.spec.ts (SearchCatalogUseCase.getById + guards)

  Scenario: Student lee material ajeno (todo rol autenticado ve todo)
    Given JWT Student y material id 7 de otro dueno
    When GET /material/7
    Then 200 con los metadatos del material
    And FR-007 is recorded in RTM as covered

  Scenario: catalogo exige JWT
    Given JWT Professor valido
    When GET /material
    Then 200 con envelope items/total/page/limit
    And FR-006 is recorded in RTM as covered

  Scenario: lectura sin token
    Given material existente id 7
    When GET /material/7 sin Authorization
    Then 401
    And BR-002 is recorded in RTM as covered

  Scenario: lectura con token expirado
    Given JWT expirado
    When GET /material
    Then 401
    And FR-007 is recorded in RTM as covered

  Scenario: material inexistente con JWT valido
    Given JWT valido e id 999999 inexistente
    When GET /material/999999
    Then 404
    And FR-006 is recorded in RTM as covered

  Scenario: id inexistente sin token responde 401 primero (precedencia auth)
    Given id 999999 inexistente y ningun header Authorization
    When GET /material/999999 sin token
    Then 401 (no 404: auth primero)
    And BR-002 is recorded in RTM as covered
