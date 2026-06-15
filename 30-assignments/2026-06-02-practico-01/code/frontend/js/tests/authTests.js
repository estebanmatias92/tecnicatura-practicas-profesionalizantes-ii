/**
 * Test: POST /api/auth/login
 */
 testUtils.createTestButton("Test Login Correcto (Pepe y 12345)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe', password: '12345' }) // Usamos pepe hardcodeado
    });

    if (response.ok) {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("Test Login - Password Incorrecto (Pepe y 123)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe', password: '123' }) // Usamos pepe hardcodeado
    });


    if (response.status === 401) {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("Test Login - Usuario Incorrecto (Juan y 12345)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe', password: '123' }) // Usamos pepe hardcodeado
    });


    if (response.status === 401) {
        testUtils.setSuccess(btn);
    }
});

/**
 * NFR-002: POST /api/auth/register — Longitud de Contraseña
 */
testUtils.createTestButton("NFR-002: Registrar con contraseña de 8 caracteres (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'longitud_valida', password: '12345678' })
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 201 && data.message === "Usuario registrado con éxito.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-002: Registrar con contraseña de 7 caracteres (debe dar 400)", async (btn) => {
    await testUtils.resetState();
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'longitud_corta', password: '1234567' })
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 400 && data.message === "La contraseña debe tener al menos 8 caracteres.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-002: Registrar con contraseña vacía (debe dar 400 por presencia)", async (btn) => {
    await testUtils.resetState();
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'sin_password', password: '' })
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 400 && data.message === "Usuario y contraseña son requeridos.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-002: Registrar con exactamente 8 caracteres (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'exacto_8', password: '12345678' })
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 201 && data.message === "Usuario registrado con éxito.") {
        testUtils.setSuccess(btn);
    }
});

/**
 * NFR-001: Test: POST /api/auth/register — Prevención de Duplicados
 */
testUtils.createTestButton("NFR-001: Registrar Usuario Nuevo (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nuevo_usuario', password: '12345678' })
    });
    
    const data = await response.json();
    testUtils.log(data);

    if (response.status === 201 && data.message === "Usuario registrado con éxito.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-001: Registrar Usuario Duplicado (debe dar 409)", async (btn) => {
    await testUtils.resetState();
    // Primer registro — debe ser exitoso
    await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'usuario_dup', password: '12345678' })
    });
    // Segundo registro con el mismo username — debe dar 409
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'usuario_dup', password: '12345678' })
    });
    
    const data = await response.json();
    testUtils.log(data);

    if (response.status === 409 && data.message === "El nombre de usuario ya existe.") {
        testUtils.setSuccess(btn);
    }
});