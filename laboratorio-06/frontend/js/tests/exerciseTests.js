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
 * 1. Solución: Registro de Usuarios
 * Este test imita la estructura de los tests de autenticación 
 * para validar la creación de una cuenta nueva.
 */
/**
 * Test: POST /api/auth/register
 */
 testUtils.createTestButton("Ej01 - Test Registro - Usuario Nuevo", async (btn) => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: 'nuevo_productor_' + Date.now(), // Nombre único para evitar duplicados
            password: 'password123' 
        })
    });
    
    const data = await response.json();
    testUtils.log(data);

    // El servidor debe responder con 201 Created
    if (response.status === 201) {
        testUtils.setSuccess(btn);
    }
});

/**
 * 2. Solución: El Intruso (Acceso Denegado)
 * Este test combina la lógica de login con la verificación 
 * de permisos de administrador.
 */
/**
 * Test: Seguridad en /api/admin/users
 */
 testUtils.createTestButton("Ej02 - Test Seguridad - Productor accediendo a Admin", async (btn) => {
    // 1. Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');

    // 2. Intentar acceder a la ruta de administración
    const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    testUtils.log(data);

    // El test es exitoso si el servidor efectivamente prohíbe el acceso (403 Forbidden)
    if (response.status === 403) {
        testUtils.setSuccess(btn);
    }
});

/**
 * 3. Solución: Eliminación de Samples (Dinámica)
 * Implementación del método DELETE asegurádose de que 
 * el sample existe obteniendo la lista previamente.
 */
/**
 * Test: DELETE /api/samples/:id
 */
 testUtils.createTestButton("Ej03 - Test Eliminar Sample Dinámico", async (btn) => {
    // 1. Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    // 2. Obtener lista de samples para encontrar un ID real
    const listResponse = await fetch('/api/samples/my-samples', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const samples = await listResponse.json();

    // Validar si el usuario tiene samples para borrar
    if (!samples || samples.length === 0) {
        testUtils.log({ message: "No hay samples disponibles para probar el borrado. Suba uno primero." }, true);
        return;
    }

    // Tomamos el ID del primer sample encontrado
    const targetId = samples[0].id;
    testUtils.log({ info: `Intentando borrar sample con ID dinámico: ${targetId}` });

    // 3. Realizar la petición DELETE al ID obtenido dinámicamente
    const response = await fetch(`/api/samples/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    testUtils.log(data);

    if (response.ok) {
        testUtils.setSuccess(btn);
    }
});

/**
 * 4. Solución: Carga Incompleta (Error 400) 
 * Validación de la robustez del servidor ante el envío 
 * de formularios FormData incompletos.
 */
/**
 * Test: POST /api/samples/upload (Faltan campos obligatorios)
 */
 testUtils.createTestButton("Ej04 - Test Subir Sample - Error por Datos Faltantes", async (btn) => {
    // 1. Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    const formData = new FormData();
    // 2. Omitimos intencionalmente 'display_name' y 'category'
    formData.append('bpm', '128');

    const blob = new Blob(["Contenido de audio simulado"], { type: 'audio/wav' });
    formData.append('audioFile', blob, 'test_incompleto.wav');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);

    // El test es exitoso si el servidor detecta el error del cliente (400 Bad Request)
    if (response.status === 400) {
        testUtils.setSuccess(btn);
    }
});

/**
 * 5. Solución: Registro Duplicado
 * Verifica que el servidor rechace un segundo registro 
 * con el mismo nombre de usuario (409 Conflict).
 */
/**
 * Test: POST /api/auth/register (Duplicado)
 */
testUtils.createTestButton("Ej05 - Test Registro - Usuario Duplicado", async (btn) => {
    const username = 'dup_test_' + Date.now();
    const password = 'password123';

    // 1. Primer registro — debe ser exitoso
    const res1 = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data1 = await res1.json();
    testUtils.log({ step: "Primer registro", status: res1.status, data: data1 });

    // 2. Segundo registro con el mismo username — debe fallar por duplicado
    const res2 = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data2 = await res2.json();
    testUtils.log({ step: "Segundo registro (duplicado)", status: res2.status, data: data2 });

    if (res2.status === 409) {
        testUtils.setSuccess(btn);
    }
});