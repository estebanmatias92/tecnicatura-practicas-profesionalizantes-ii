/**
 * Función para asegurar independencia de los tests de samples
 * y no depender de otro test para tener un token de sesión válido
 */
async function okLogin() {
  // 1. Login como productor (pepe) para obtener un token válido
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "pepe", password: "12345" }), // Usamos pepe hardcodeado
  });
  const data = await response.json();
  // Guardamos el token para tests de samples
  localStorage.setItem("test_token", data.token);
}

/**
 * Test: GET /api/samples/my-samples
 */
testUtils.createTestButton("Test Listar Mis Samples", async (btn) => {
  // 1. Asegurar y guardar una sesión válida
  await okLogin();
  const token = localStorage.getItem("test_token");

  // 2. Realizar la petición
  const response = await fetch("/api/samples/my-samples", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  testUtils.log(data);
  if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/samples/upload (Simulado)
 */
testUtils.createTestButton("Test Subir Sample (Simulado)", async (btn) => {
  // 1. Asegurar y guardar una sesión válida
  await okLogin();
  const token = localStorage.getItem("test_token");

  // Creamos un FormData
  const formData = new FormData();
  formData.append("display_name", "Test Loop Pedagogico");
  formData.append("category", "Drums");
  formData.append("bpm", "120");

  // Simulamos un archivo WAV (binario vacío para la prueba)
  const blob = new Blob(["Simulated Audio Content"], { type: "audio/wav" });
  formData.append("audioFile", blob, "DRUM_LOOP_01.wav");

  const response = await fetch("/api/samples/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();
  testUtils.log(data);
  if (response.ok) testUtils.setSuccess(btn);
});

/*
    Ejercicios Lab 05
*/

// Ejercicio 03
testUtils.createTestButton("Test Eliminar Sample Dinámico", async (btn) => {
  // 1. Asegurar sesión válida
  await okLogin();
  const token = localStorage.getItem("test_token");

  // 2. Obtener lista de samples del usuario
  const listRes = await fetch("/api/samples/my-samples", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const samples = await listRes.json();
  testUtils.log(samples);

  // 3. Validar existencia
  if (!samples || samples.length === 0) {
    testUtils.log("⚠️ No hay samples para eliminar. Subí un sample primero.");
    return;
  }

  // 4. Extraer ID del primer sample
  const targetId = samples[0].id;
  testUtils.log({ mensaje: `Intentando eliminar sample ID: ${targetId}` });

  // 5. Ejecutar DELETE
  const deleteRes = await fetch(`/api/samples/${targetId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await deleteRes.json();

  //testUtils.log(data);
  testUtils.log({ ...data, deletedSampleId: targetId });

  // 6. Validación: status 200
  if (deleteRes.ok) testUtils.setSuccess(btn);
});

// Ejercicio 04
testUtils.createTestButton(
  "Test Subir Sample - Error por Datos Faltantes",
  async (btn) => {
    // 1. Sesión válida
    await okLogin();
    const token = localStorage.getItem("test_token");

    // 2. FormData sin category (ni display_name)
    const formData = new FormData();
    const blob = new Blob(["Fake Audio"], { type: "audio/wav" });

    formData.append("audioFile", blob, "INCOMPLETE.wav");
    // NO se agrega display_name ni category

    // 3. Intentar subida
    const response = await fetch("/api/samples/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();

    testUtils.log({
      intentoDeSubida: {
        audioFile: "INCOMPLETE.wav",
        display_name: "(omitido)",
        category: "(omitido)",
        bpm: "(omitido)",
      },
      respuestaDelServidor: data,
    });

    // 4. Validación: status 400
    if (response.status === 400) testUtils.setSuccess(btn);
  },
);
