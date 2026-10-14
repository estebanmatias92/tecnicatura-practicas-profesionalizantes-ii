Feature: UC-001 Autenticarse (registro + login)
  # FR-001, FR-002, FR-003 + BR-003 + BR-002. Fuente: docs/02-requirements/use-cases/UC-001-auth.md
  # Ejecutable en: backend/test/e2e/auth-matrix.spec.ts (1 escenario = 1 test Jest mismo nombre)

  Scenario: registro Student valido queda logueado sin exponer password
    Given reglas BR-003 activas y email "alu01@biblio.tech" no registrado
    When POST /auth/register con email "alu01@biblio.tech" y password "Segura123"
    Then 201 con JWT que expira en <=24h, rol Student, y sin password ni passwordHash en respuesta
    And FR-001 is recorded in RTM as covered

  Scenario: registro con email duplicado (case-insensitive)
    Given usuario existente con email "alu01@biblio.tech"
    When POST /auth/register con email "ALU01@biblio.tech" y password "Segura123"
    Then 409 y nada persistido de mas
    And FR-001 is recorded in RTM as covered

  Scenario: registro con email invalido (particion + borde)
    Given reglas BR-003 activas
    When POST /auth/register con email "mal" y password "Segura123"
    Then 400 con mensaje del Validator y nada persistido
    And BR-003 is recorded in RTM as covered

  Scenario: registro con password de 7 caracteres (borde 7/8)
    Given reglas BR-003 activas
    When POST /auth/register con email "borde@biblio.tech" y password "1234567"
    Then 400 con mensaje del Validator y nada persistido
    And BR-003 is recorded in RTM as covered

  Scenario: registro con cuerpo nulo (null)
    Given reglas BR-003 activas
    When POST /auth/register con cuerpo vacio {}
    Then 400 y nada persistido
    And BR-003 is recorded in RTM as covered

  Scenario: registro publico que pide role Admin queda Student
    Given registro publico sin JWT Admin
    When POST /auth/register con email "vivo@biblio.tech", password "Segura123" y requestedRole "Admin"
    Then 201 con rol Student efectivo
    And FR-001 is recorded in RTM as covered

  Scenario: login valido emite JWT sin password
    Given usuario "alu01@biblio.tech" con hash BCrypt de "Segura123"
    When POST /auth/login con email "alu01@biblio.tech" y password "Segura123"
    Then 200 con JWT (userId + role) y sin password en respuesta
    And FR-002 is recorded in RTM as covered

  Scenario: login con password incorrecta no distingue causa
    Given usuario existente "alu01@biblio.tech"
    When POST /auth/login con password errónea "Otra9999"
    Then 401 con mensaje generico, sin indicar si el email existe
    And FR-002 is recorded in RTM as covered

  Scenario: login con email inexistente responde igual que password mala
    Given ningun usuario con email "nadie@biblio.tech"
    When POST /auth/login con email "nadie@biblio.tech" y password "Segura123"
    Then 401 con el mismo mensaje generico del escenario anterior
    And FR-002 is recorded in RTM as covered

  Scenario: acceso con rol insuficiente a subida
    Given JWT valido de Student
    When POST /material (solo Professor/Admin)
    Then 403
    And FR-003 is recorded in RTM as covered

  Scenario: acceso sin token a ruta protegida
    Given ningun header Authorization
    When GET /material
    Then 401 (BR-002: auth primero)
    And FR-003 is recorded in RTM as covered

  Scenario: acceso con JWT expirado o manipulado
    Given JWT expirado o firmado con otro secreto
    When GET /material con ese token
    Then 401 y el frontend redirige a /login
    And FR-002 is recorded in RTM as covered
