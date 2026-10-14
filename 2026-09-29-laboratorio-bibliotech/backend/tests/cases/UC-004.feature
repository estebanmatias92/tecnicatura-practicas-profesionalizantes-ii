Feature: UC-004 Gestion Admin y propia Professor (cascada)
  # FR-011, FR-012, FR-013 + BR-004 C-1/C-2/C-3. Fuente: docs/02-requirements/use-cases/UC-004-admin.md
  # Ejecutable en: backend/test/e2e/materials-flow.spec.ts + backend/test/integration/cascade.spec.ts

  Scenario: Admin cambia rol de usuario
    Given JWT Admin y usuario existente id 5 con rol Student
    When PATCH /users/5 con role Professor
    Then 200 y el rol es efectivo en el proximo login/token
    And FR-011 is recorded in RTM as covered

  Scenario: Admin crea usuario con rol via API
    Given JWT Admin
    When POST /users con email "nuevo@biblio.tech", password "Segura123" y requestedRole Professor
    Then 201 con rol Professor
    And FR-011 is recorded in RTM as covered

  Scenario: crear usuario sin requestedRole es 400
    Given JWT Admin
    When POST /users sin requestedRole
    Then 400 y nada persistido
    And FR-011 is recorded in RTM as covered

  Scenario: no-Admin intenta gestionar usuarios
    Given JWT Professor
    When PATCH /users/5 con role Student
    Then 403 y rol intacto
    And FR-011 is recorded in RTM as covered

  Scenario: Admin elimina material ajeno mas su blob (C-3)
    Given JWT Admin y material id 9 de otro dueno con blob
    When DELETE /material/9
    Then 204 y GET /material/9 da 404 y GET /material/9/file da 404
    And FR-012 is recorded in RTM as covered

  Scenario: Professor edita material propio
    Given JWT Professor dueno del material id 9
    When PATCH /material/9 con title "Redes v2"
    Then 200 y cambios persistidos en GET /material/9
    And FR-013 is recorded in RTM as covered

  Scenario: Professor edita material ajeno
    Given JWT Professor y material id 9 de otro dueno
    When PATCH /material/9 con title "hack"
    Then 403 y material intacto
    And FR-013 is recorded in RTM as covered

  Scenario: Professor elimina material ajeno
    Given JWT Professor y material id 9 de otro dueno
    When DELETE /material/9
    Then 403 y material intacto
    And FR-013 is recorded in RTM as covered

  Scenario: Professor elimina material propio mas su blob (C-1)
    Given JWT Professor dueno del material id 9 con blob
    When DELETE /material/9 propio
    Then 204 y GET /material/9 da 404 y GET /material/9/file da 404
    And FR-013 is recorded in RTM as covered

  Scenario: borrado de cuenta Professor con material a cargo en cascada (C-2)
    Given cuenta Professor id 5 con 2 materiales y blobs y JWT Admin
    When DELETE /users/5
    Then 204 y los 2 materiales dan 404 y sus blobs ya no existen
    And FR-011 is recorded in RTM as covered

  Scenario: borrado de cuenta Professor sin material
    Given cuenta Professor id 6 sin material y JWT Admin
    When DELETE /users/6
    Then 204
    And FR-011 is recorded in RTM as covered

  Scenario: borrado de usuario inexistente
    Given JWT Admin e id 999999 inexistente
    When DELETE /users/999999
    Then 404
    And FR-011 is recorded in RTM as covered

  Scenario: fallo al borrar blob en cascada revierte la transaccion (E-001)
    Given JWT Admin, material id 9 con blob y FileStorage que falla al borrar
    When DELETE /material/9
    Then 500 y el material sigue existiendo (rollback, nada eliminado)
    And BR-004 is recorded in RTM as covered
