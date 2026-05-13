/**
 * Test: POST /api/auth/login
 */
testUtils.createTestButton(
  "Test Login Correcto (Pepe y 12345)",
  async (btn) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pepe", password: "12345" }), // Usamos pepe hardcodeado
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.ok) {
      testUtils.setSuccess(btn);
    }
  },
);

testUtils.createTestButton(
  "Test Login - Password Incorrecto (Pepe y 123)",
  async (btn) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pepe", password: "123" }), // Usamos pepe hardcodeado
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 401) {
      testUtils.setSuccess(btn);
    }
  },
);

testUtils.createTestButton(
  "Test Login - Usuario Incorrecto (Juan y 12345)",
  async (btn) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "juan", password: "12345" }), // Usamos juan hardcodeado
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 401) {
      testUtils.setSuccess(btn);
    }
  },
);

/*
    Ejercicios Lab 05
*/

// Ejercicio 01
testUtils.createTestButton("Test Registro - Usuario Nuevo", async (btn) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: `matias_${Date.now()}`, password: "123" }), // Usamos juan hardcodeado
  });

  const data = await response.json();
  testUtils.log(data);

  if (response.status === 201) {
    testUtils.setSuccess(btn);
  }
});

// Ejercicio 02
testUtils.createTestButton(
  "Test Seguridad - Productor accediendo a Admin",
  async (btn) => {
    /// 1. Login como productor (pepe)
    await okLogin(); // Reutilizamos la función de login para obtener un token válido
    // Get the auth token
    const token = localStorage.getItem("test_token");

    // 2. Intentar acceder a ruta de admin con token de productor
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    testUtils.log(data);

    // 3. Validación: status 403 + mensaje de acceso denegado
    if (response.status === 403) {
      testUtils.setSuccess(btn);
    }
  },
);

