/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

// Configuración base de la API
// Este comentario va a dar conflicto
const API_URL = "/api";

const apiService = {
    // Función centralizada para peticiones Fetch
    async request(endpoint, method = 'GET', data = null, isFormData = false) {
        // Usamos el helper en lugar de acceder directo a localStorage o sessionStorage
        const token = authHelper.getToken();
        
        const headers = {};
        if (!isFormData) headers['Content-Type'] = 'application/json';
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (data) {
            // Si es FormData (para archivos), no se stringifica
            config.body = isFormData ? data : JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);
        const result = await response.json();

        // Si el token expiró (401), limpiamos sesión y redirigimos al login
        if (response.status === 401) {
            authHelper.storage.clear();
            window.location.href = '/login?session=expired';
            return;
        }

        if (!response.ok) throw new Error(result.message || 'Error en la petición');
        return result;
    }
};