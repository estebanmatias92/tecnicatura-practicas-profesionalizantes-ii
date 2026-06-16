/**
 * Función para asegurar independencia de los tests de samples 
 * y no depender de otro test para tener un token de sesión válido
 */
 async function okLogin()
 {
    // 1. Login como productor (pepe) para obtener un token válido
     const response = await fetch('/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username: 'pepe', password: '12345' }) // Usamos pepe hardcodeado
     });
     const data = await response.json();
     // Guardamos el token para tests de samples
     localStorage.setItem('test_token', data.token);
 }

/**
 * Test: GET /api/samples/my-samples
 */
 testUtils.createTestButton("Test Listar Mis Samples", async (btn) => {
    await testUtils.resetState();
    // 1. Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    // 2. Realizar la petición
    const { response } = await testUtils.fetchJson('/api/samples/my-samples', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Helper: crear blob WAV válido (con magic bytes reales)
 */
function createWavBlob() {
    const header = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size (placeholder)
        0x57, 0x41, 0x56, 0x45, // WAVE
    ]);
    return new Blob([header], { type: 'audio/wav' });
}

/**
 * Test: POST /api/samples/upload (Simulado)
 */
testUtils.createTestButton("Test Subir Sample (Simulado)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    const formData = new FormData();
    formData.append('display_name', 'Test Loop Pedagogico');
    formData.append('category', 'Drums');
    formData.append('bpm', '120');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'DRUM_LOOP_01.wav');

    const { response } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * NFR-004: POST /api/samples/upload — Inconsistencia de Tipo MIME
 */
testUtils.createTestButton("NFR-004: Subir WAV valido (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR004 WAV Valido');
    formData.append('category', 'Test');
    formData.append('bpm', '120');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'sample_valido.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 201 && data.message === "Sample cargado exitosamente en la biblioteca.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-004: Subir MP3 falso (texto, debe dar 415)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR004 MP3 Falso');
    formData.append('category', 'Test');
    formData.append('bpm', '120');

    // MIME dice audio/mpeg pero el contenido es texto sin magic bytes
    const blob = new Blob(["Esto no es un audio"], { type: 'audio/mpeg' });
    formData.append('audioFile', blob, 'falso.mp3');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 415 && data.message === "El tipo de archivo no coincide con su contenido real.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-004: Subir PDF (MIME no soportado, debe dar 400)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR004 PDF');
    formData.append('category', 'Test');
    formData.append('bpm', '120');

    const blob = new Blob(["dummy pdf content"], { type: 'application/pdf' });
    formData.append('audioFile', blob, 'documento.pdf');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 400 && data.message === "Formato de archivo no soportado. Use MP3, WAV, OGG o FLAC.") {
        testUtils.setSuccess(btn);
    }
});