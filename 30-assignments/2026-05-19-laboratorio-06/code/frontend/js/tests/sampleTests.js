/**
 * Función para asegurar independencia de los tests de samples 
 * y no depender de otro test para tener un token de sesión válido
 */
 async function okLogin()
 {
     const credentials = { username: 'pepe', password: '12345' };

     let res = await fetch('/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
     let data = await res.json();

     if (!data.token) {
         // Si pepe no existe en la DB, lo registramos automáticamente
         await fetch('/api/auth/register', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(credentials)
         });
         res = await fetch('/api/auth/login', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(credentials)
         });
         data = await res.json();
     }

     if (data.token) {
         localStorage.setItem('test_token', data.token);
     }
 }

/**
 * Test: GET /api/samples/my-samples
 */
 testUtils.createTestButton("Test Listar Mis Samples", async (btn) => {
    // 1. Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    // 2. Realizar la petición
    const response = await fetch('/api/samples/my-samples', {
        headers: { 'Authorization': `Bearer ${token}` }
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
    const token = localStorage.getItem('test_token');
    
    // Creamos un FormData
    const formData = new FormData();
    formData.append('display_name', 'Test Loop Pedagogico');
    formData.append('category', 'Drums');
    formData.append('bpm', '120');

    // Simulamos un archivo WAV (binario vacío para la prueba)
    const blob = new Blob(["Simulated Audio Content"], { type: 'audio/wav' });
    formData.append('audioFile', blob, 'DRUM_LOOP_01.wav');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/samples/upload (Tipo inválido)
 */
testUtils.createTestButton("Test Subir Sample - Tipo de archivo inválido (.txt)", async (btn) => {
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'Test Invalido');
    formData.append('category', 'Drums');
    formData.append('bpm', '120');

    const blob = new Blob(["contenido no valido"], { type: 'text/plain' });
    formData.append('audioFile', blob, 'test.txt');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 500) {
        testUtils.setSuccess(btn);
    }
});

/**
 * Test: POST /api/samples/upload (Sin archivo)
 */
testUtils.createTestButton("Test Subir Sample - Sin archivo", async (btn) => {
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'Test Sin Archivo');
    formData.append('category', 'Drums');
    formData.append('bpm', '120');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 400) {
        testUtils.setSuccess(btn);
    }
});

/**
 * Test: GET /api/samples/my-samples (Sin token)
 */
testUtils.createTestButton("Test Listar Mis Samples - Sin Token", async (btn) => {
    const response = await fetch('/api/samples/my-samples', {
        headers: {}
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 403) {
        testUtils.setSuccess(btn);
    }
});