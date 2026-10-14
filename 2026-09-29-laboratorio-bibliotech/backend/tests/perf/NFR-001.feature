Feature: NFR-001 Lectura autenticada rapida
  # Performance medible (SRS seccion 4, ISO25010). Fuente: NFR-001 p95 <200ms en lab
  # Ejecutable con: k6 run backend/tests/perf/k6/perf-catalog.js (requiere API + DB con seed)

  Scenario: catalogo p95 bajo 200ms con carga de laboratorio
    Given API corriendo con MariaDB 11 y 100 materiales seed, JWT Student valido
    When k6 ejecuta 20 VUs por 30s contra GET /material y GET /material?q=redes
    Then p95 < 200ms y tasa de error < 1%
    And NFR-001 is recorded in RTM as covered

  Scenario: lectura por id p95 bajo 200ms
    Given API corriendo y material existente id 1
    When k6 ejecuta 10 VUs por 15s contra GET /material/1
    Then p95 < 200ms
    And NFR-001 is recorded in RTM as covered
