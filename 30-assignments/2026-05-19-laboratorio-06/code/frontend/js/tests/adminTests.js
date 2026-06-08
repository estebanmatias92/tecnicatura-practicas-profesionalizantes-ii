/**
 * Test: GET /api/admin/users (Requiere Login Admin)
 */
 testUtils.createTestButton("Test Admin: Listar Usuarios con Login Admin Correcto", async (btn) => {
    // Primero hacemos un login rápido como admin para obtener el token adecuado
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '12345' })
    });
    
    const { token } = await loginRes.json();

    const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: DELETE /api/admin/users/:id (Requiere Login Admin)
 */
testUtils.createTestButton("Test Admin: Eliminar usuario no-admin", async (btn) => {
    // 1. Login como admin
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '12345' })
    });
    const { token } = await loginRes.json();

    // 2. Listar usuarios para encontrar uno que no sea admin
    const listRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await listRes.json();

    if (!users || users.length < 2) {
        testUtils.log({ message: "No hay suficientes usuarios para probar eliminación" }, true);
        return;
    }

    // Tomar el primer usuario que no tenga rol admin
    const target = users.find(u => u.role !== 'admin') || users[users.length - 1];
    testUtils.log({ info: `Eliminando usuario ID=${target.id} (${target.username})` });

    // 3. Eliminar usuario
    const deleteRes = await fetch(`/api/admin/users/${target.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await deleteRes.json();
    testUtils.log(data);

    if (deleteRes.ok) {
        testUtils.setSuccess(btn);
    }
});