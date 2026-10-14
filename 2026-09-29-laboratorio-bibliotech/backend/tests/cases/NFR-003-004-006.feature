Feature: NFR-003 NFR-004 NFR-006 Seguridad y matriz de autorizacion
  # Seguridad medible (SRS seccion 4). Fuente: SRS NFR-003/004/006 + BR-002/BR-003
  # Ejecutable en: backend/test/security/security-audit.spec.ts + backend/test/e2e/auth-matrix.spec.ts

  Scenario: hash BCrypt con cost mayor o igual a 10
    Given configuracion de PasswordHasher con cost 10
    When se crea BcryptHasher con cost menor a 10
    Then lanza error (cost >= 10, NFR-003)
    And NFR-003 is recorded in RTM as covered

  Scenario: JWT expira en menos o igual a 24h
    Given JWT_EXPIRES_H configurado en 24
    When se emite un token de sesion
    Then su expiracion es <= 24h (NFR-003)
    And NFR-003 is recorded in RTM as covered

  Scenario: sin secretos en claro ni en logs
    Given codigo en backend/src y frontend/src
    When se inspecciona en busca de password/secret en respuestas o console.log
    Then 0 ocurrencias (NFR-004)
    And NFR-004 is recorded in RTM as covered

  Scenario: matriz 401 - toda lectura sin token es 401 (6 UCs)
    Given ningun header Authorization
    When GET /material, GET /material/1, GET /material/1/file, POST /material, PATCH /material/1, DELETE /material/1, GET /users, PATCH /users/1, DELETE /users/1
    Then cada una responde 401
    And NFR-006 is recorded in RTM as covered

  Scenario: matriz 403 - Student no muta nada
    Given JWT Student
    When POST /material, PATCH /material/1 ajeno, DELETE /material/1 ajeno, GET /users, PATCH /users/1, DELETE /users/1
    Then cada una responde 403 y nada cambia
    And NFR-006 is recorded in RTM as covered

  Scenario: matriz 403 - Professor solo lo propio
    Given JWT Professor y material ajeno id 9
    When PATCH /material/9, DELETE /material/9, GET /users
    Then 403 y material intacto
    And NFR-006 is recorded in RTM as covered

  Scenario: matriz 200 - Admin todo
    Given JWT Admin
    When GET /users, PATCH /users/5, DELETE /material/9 ajeno
    Then 200/204 segun corresponda
    And NFR-006 is recorded in RTM as covered

  Scenario: MIME y tamanio se validan antes de persistir (fixtures 100% rechazo)
    Given fixtures: PNG 100B, PDF 0B, PDF 50MB+1B, MIME vacio nulo
    When cada fixture pasa por Validator.validateFile
    Then todas rechazadas (UNSUPPORTED_MEDIA / PAYLOAD_TOO_LARGE / BAD_REQUEST) y nada persistido
    And NFR-005 is recorded in RTM as covered
