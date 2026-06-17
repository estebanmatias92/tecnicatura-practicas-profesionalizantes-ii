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

/**
 * Helper: crear blob WAV de tamaño arbitrario (con magic bytes reales)
 */
function createWavBlobOfSize(sizeInBytes) {
    const header = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size (placeholder)
        0x57, 0x41, 0x56, 0x45, // WAVE
    ]);
    const padding = new Uint8Array(sizeInBytes - header.length);
    return new Blob([header, padding], { type: 'audio/wav' });
}

/**
 * NFR-005: Subida — Límite de Peso (10 MB)
 */
testUtils.createTestButton("NFR-005: Subir 1MB (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR005 1MB');
    formData.append('category', 'Test');
    formData.append('bpm', '120');

    const blob = createWavBlobOfSize(1 * 1024 * 1024);
    formData.append('audioFile', blob, 'sample_1mb.wav');

    const { response } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 201) testUtils.setSuccess(btn);
});

testUtils.createTestButton("NFR-005: Subir 15MB (debe dar 413)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR005 15MB');
    formData.append('category', 'Test');
    formData.append('bpm', '120');

    const blob = new Blob([new Uint8Array(15 * 1024 * 1024)], { type: 'audio/wav' });
    formData.append('audioFile', blob, 'sample_15mb.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 413 && data.message === "El archivo excede el límite de 10 MB.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-005: Subir 10MB exacto (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR005 10MB Exacto');
    formData.append('category', 'Test');
    formData.append('bpm', '120');

    const blob = createWavBlobOfSize(10 * 1024 * 1024);
    formData.append('audioFile', blob, 'sample_10mb.wav');

    const { response } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 201) testUtils.setSuccess(btn);
});

testUtils.createTestButton("NFR-005: Subir 10.1MB (debe dar 413)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR005 10.1MB');
    formData.append('category', 'Test');
    formData.append('bpm', '120');

    const blob = new Blob([new Uint8Array(Math.floor(10.1 * 1024 * 1024))], { type: 'audio/wav' });
    formData.append('audioFile', blob, 'sample_101mb.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 413 && data.message === "El archivo excede el límite de 10 MB.") {
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

/**
 * NFR-006: Subida — Coherencia del BPM (Rango 20-300)
 */
testUtils.createTestButton("NFR-006: BPM 120 valido (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM 120');
    formData.append('category', 'Test');
    formData.append('bpm', '120');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_120.wav');

    const { response } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 201) testUtils.setSuccess(btn);
});

testUtils.createTestButton("NFR-006: BPM 10 (debajo del minimo, debe dar 400)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM 10');
    formData.append('category', 'Test');
    formData.append('bpm', '10');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_10.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 400 && data.message === "El BPM debe estar entre 20 y 300.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-006: BPM 350 (sobre el maximo, debe dar 400)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM 350');
    formData.append('category', 'Test');
    formData.append('bpm', '350');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_350.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 400 && data.message === "El BPM debe estar entre 20 y 300.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-006: BPM 'abc' (no numerico, debe dar 400)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM abc');
    formData.append('category', 'Test');
    formData.append('bpm', 'abc');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_abc.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 400 && data.message === "El BPM debe ser un valor numérico.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-006: BPM 20 (borde inferior, debe dar 201)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM 20');
    formData.append('category', 'Test');
    formData.append('bpm', '20');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_20.wav');

    const { response } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 201) testUtils.setSuccess(btn);
});

testUtils.createTestButton("NFR-006: BPM 300 (borde superior, debe dar 201)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM 300');
    formData.append('category', 'Test');
    formData.append('bpm', '300');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_300.wav');

    const { response } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 201) testUtils.setSuccess(btn);
});

testUtils.createTestButton("NFR-006: BPM 19 (apenas debajo, debe dar 400)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM 19');
    formData.append('category', 'Test');
    formData.append('bpm', '19');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_19.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 400 && data.message === "El BPM debe estar entre 20 y 300.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-006: BPM 301 (apenas sobre, debe dar 400)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM 301');
    formData.append('category', 'Test');
    formData.append('bpm', '301');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_301.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 400 && data.message === "El BPM debe estar entre 20 y 300.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-006: BPM 0 (cero, debe dar 400)", async (btn) => {
    await testUtils.resetState();
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'NFR006 BPM 0');
    formData.append('category', 'Test');
    formData.append('bpm', '0');

    const blob = createWavBlob();
    formData.append('audioFile', blob, 'bpm_0.wav');

    const { response, data } = await testUtils.fetchJson('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.status === 400 && data.message === "El BPM debe estar entre 20 y 300.") {
        testUtils.setSuccess(btn);
    }
});