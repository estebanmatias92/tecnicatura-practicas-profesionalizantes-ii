Feature: NFR-002 Subida de hasta 50MB completa
  # Performance medible (SRS seccion 4). Fuente: NFR-002 duracion inicio->201 <60s
  # Ejecutable con: k6 run backend/tests/perf/k6/perf-upload.js (requiere JWT Professor)

  Scenario: subida de PDF de 50MB completa en menos de 60s
    Given API corriendo, JWT Professor valido y PDF de 50MB generado localmente
    When k6 sube el archivo via POST /material multipart (1 VU, 1 iteracion)
    Then 201 en <60s desde el inicio y material consultable
    And NFR-002 is recorded in RTM as covered
