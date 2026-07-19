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
 * NFR-003: POST /api/auth/login — Estructura Incompleta
 */
testUtils.createTestButton("NFR-003: Login sin username (debe dar 400)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '12345' })
    });

    if (response.status === 400 && data.message === "Credenciales incompletas.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-003: Login sin password (debe dar 400)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe' })
    });

    if (response.status === 400 && data.message === "Credenciales incompletas.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-003: Login con ambos campos vacios (debe dar 400)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '', password: '' })
    });

    if (response.status === 400 && data.message === "Credenciales incompletas.") {
        testUtils.setSuccess(btn);
    }
});

/**
 * NFR-002: POST /api/auth/register — Longitud de Contraseña
 */
testUtils.createTestButton("NFR-002: Registrar con contraseña de 8 caracteres (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'longitud_valida', password: '12345678' })
    });



    if (response.status === 201 && data.message === "Usuario registrado con éxito.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-002: Registrar con contraseña de 7 caracteres (debe dar 400)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'longitud_corta', password: '1234567' })
    });



    if (response.status === 400 && data.message === "La contraseña debe tener al menos 8 caracteres.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-002: Registrar con contraseña vacía (debe dar 400 por presencia)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'sin_password', password: '' })
    });



    if (response.status === 400 && data.message === "Usuario y contraseña son requeridos.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-002: Registrar con exactamente 8 caracteres (debe dar 201)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'exacto_8', password: '12345678' })
    });



    if (response.status === 201 && data.message === "Usuario registrado con éxito.") {
        testUtils.setSuccess(btn);
    }
});

/**
 * NFR-001: Test: POST /api/auth/register — Prevención de Duplicados
 */
testUtils.createTestButton("NFR-001: Registrar Usuario Nuevo (debe dar 201)", async (btn) => {
   
    const { response } = await testUtils.fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nuevo_usuario', password: '12345678' })
    });


    if (response.message === "Usuario registrado con éxito.") {
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
    const { response, data } = await testUtils.fetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'usuario_dup', password: '12345678' })
    });


    if (response.status === 409 && data.message === "El nombre de usuario ya existe.") {
        testUtils.setSuccess(btn);
    }
});

/**
 * NFR-007: Seguridad — Manipulación del Token JWT
 */
testUtils.createTestButton("NFR-007: Token valido accede a ruta protegida (debe dar 200)", async (btn) => {
    await testUtils.resetState();
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe', password: '12345' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const { response } = await testUtils.fetchJson('/api/samples/my-samples', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) testUtils.setSuccess(btn);
});

testUtils.createTestButton("NFR-007: Token alterado (debe dar 401)", async (btn) => {
    await testUtils.resetState();
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe', password: '12345' })
    });
    const loginData = await loginRes.json();
    // Alterar el último carácter del token
    const tamperedToken = loginData.token.slice(0, -1) + 'X';

    const { response, data } = await testUtils.fetchJson('/api/samples/my-samples', {
        headers: { 'Authorization': `Bearer ${tamperedToken}` }
    });

    if (response.status === 401 && data.message === "Token inválido o expirado.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-007: Token expirado (firmeza invalida, debe dar 401)", async (btn) => {
    await testUtils.resetState();
    // Construir un JWT con payload expirado (la firma será inválida, jwt.verify rechaza)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        id: 2,
        role: 'producer',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600
    }));
    const expiredToken = `${header}.${payload}.signerinvalida`;

    const { response, data } = await testUtils.fetchJson('/api/samples/my-samples', {
        headers: { 'Authorization': `Bearer ${expiredToken}` }
    });

    if (response.status === 401 && data.message === "Token inválido o expirado.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-007: Sin header Authorization (debe dar 403)", async (btn) => {
    await testUtils.resetState();

    const { response, data } = await testUtils.fetchJson('/api/samples/my-samples');

    if (response.status === 403 && data.message === "Formato de token incorrecto o inexistente.") {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("NFR-007: Token de otro usuario (debe dar 404)", async (btn) => {
    await testUtils.resetState();

    // 1. Crear usuario nuevo (sin samples)
    await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test_user_nfr007', password: '12345678' })
    });

    // 2. Login como ese usuario
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test_user_nfr007', password: '12345678' })
    });
    const loginData = await loginRes.json();

    // 3. Intentar borrar sample de pepe (id=1)
    const { response } = await testUtils.fetchJson('/api/samples/1', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    // 4. El SP filtra por userId, usuario nuevo no tiene samples
    if (response.status === 404) testUtils.setSuccess(btn);
});

/**
 * NFR-010: Register con payload SQL injection
 */
testUtils.createTestButton("NFR-010: Register SQLi ' OR 1=1 -- (400)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: "' OR 1=1 --", password: '12345678' })
    });

    if (response.status === 400 && data.message === "Caracteres no permitidos en la entrada.") {
        testUtils.setSuccess(btn);
    }
});

/**
 * NFR-010: Register con payload XSS
 */
testUtils.createTestButton("NFR-010: Register XSS <script> (400)", async (btn) => {
    await testUtils.resetState();
    const { response, data } = await testUtils.fetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '<script>alert(1)</script>', password: '12345678' })
    });

    if (response.status === 400 && data.message === "Caracteres no permitidos en la entrada.") {
        testUtils.setSuccess(btn);
    }
});