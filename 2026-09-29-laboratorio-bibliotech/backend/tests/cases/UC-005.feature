Feature: UC-005 Buscar filtrar y paginar catalogo
  # FR-009, FR-010 (apoya FR-006). Fuente: docs/02-requirements/use-cases/UC-005-search.md
  # Ejecutable en: backend/test/e2e/materials-flow.spec.ts (SearchCatalogUseCase.execute)

  Scenario: busqueda por titulo como Student
    Given 3 materiales con "redes" en el titulo (distintos duenos) y JWT Student
    When GET /material?q=redes
    Then 200 con los 3 y total consistente en el envelope
    And FR-009 is recorded in RTM as covered

  Scenario: busqueda sin token
    Given materiales existentes
    When GET /material?q=redes sin token
    Then 401
    And BR-002 is recorded in RTM as covered

  Scenario: paginacion segunda pagina
    Given 25 materiales y JWT valido
    When GET /material?page=2&limit=10
    Then 200 con 10 items, total 25, page 2, limit 10
    And FR-010 is recorded in RTM as covered

  Scenario: q vacio no es error
    Given materiales existentes y JWT valido
    When GET /material?q=
    Then 200 con envelope y total consistente (sin filtro de texto)
    And FR-009 is recorded in RTM as covered

  Scenario: filtro por autor parcial case-insensitive
    Given materiales de "Tanenbaum" y otros, y JWT valido
    When GET /material?author=tanen
    Then 200 solo con los de Tanenbaum
    And FR-009 is recorded in RTM as covered

  Scenario: filtro por tags multiples en AND
    Given materiales con tags variados y JWT valido
    When GET /material?tag=redes&tag=ospf
    Then 200 solo con los que contienen ambas
    And FR-009 is recorded in RTM as covered

  Scenario: filtro por rango de anios inclusivo
    Given materiales de 2010, 2015 y 2020, y JWT valido
    When GET /material?yearFrom=2010&yearTo=2015
    Then 200 solo con los de 2010 y 2015
    And FR-009 is recorded in RTM as covered

  Scenario: rango de anios invalido
    Given JWT valido
    When GET /material?yearFrom=2020&yearTo=2010
    Then 400
    And FR-009 is recorded in RTM as covered

  Scenario: limite excede maximo
    Given JWT valido
    When GET /material?limit=1000
    Then 400 (maxLimit 50)
    And FR-010 is recorded in RTM as covered

  Scenario: pagina cero es error (borde 0/1)
    Given JWT valido
    When GET /material?page=0&limit=10
    Then 400
    And FR-010 is recorded in RTM as covered

  Scenario: parametros nulos usan defaults page 1 limit 10
    Given 25 materiales y JWT valido
    When GET /material sin page ni limit
    Then 200 con 10 items, total 25, page 1, limit 10
    And FR-010 is recorded in RTM as covered
