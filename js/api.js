/**
 * @file api.js
 * @description Cliente HTTP para comunicación con el backend
 */

import { API_URL } from './config.js';

// Callback para logout (será configurado por auth.js)
let logoutCallback = null;

/**
 * Configura el callback de logout
 * @param {Function} callback - Función a ejecutar cuando hay error 401
 */
export function setLogoutCallback(callback) {
    logoutCallback = callback;
}

/**
 * Realiza una petición fetch genérica con manejo de errores básico.
 * @param {string} url - URL completa o relativa (si es relativa, se añade API_URL)
 * @param {Object} options - Opciones de fetch
 * @returns {Promise<any>} - Datos de la respuesta o null si es 204
 */
export async function fetchData(url, options = {}) {
    // Si la URL no es absoluta, añadir API_URL
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    const token = localStorage.getItem('authToken');

    // Si tenemos un token, lo añadimos a la cabecera 'Authorization'
    if (token) {
        if (!options.headers) {
            options.headers = {};
        }
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Ensure JSON content type for POST/PUT/PATCH if body is present and not FormData
    if (options.body && typeof options.body === 'string' && !options.headers['Content-Type']) {
         options.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(fullUrl, options);

        if (response.status === 401) {
            console.warn("Acceso no autorizado. Cerrando sesión...");
            if (logoutCallback) logoutCallback();
        }

        if (!response.ok) {
            let errorDetail = `Error HTTP ${response.status}: ${response.statusText}`;
            try {
                const errJson = await response.json();
                if (errJson.detail) {
                    errorDetail = typeof errJson.detail === 'object' 
                        ? JSON.stringify(errJson.detail) 
                        : errJson.detail;
                }
            } catch (e) { /* Ignora si el cuerpo no es JSON */ }
            throw new Error(errorDetail);
        }

        if (response.status === 204) { return null; }
        return await response.json();
    } catch (error) {
        console.error(`Error en fetch a ${fullUrl}:`, error);
        throw error;
    }
}

/**
 * Helper para peticiones POST (Crear)
 */
export async function postData(url, data) {
    return fetchData(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

/**
 * Helper para peticiones PUT (Actualizar)
 */
export async function putData(url, data) {
    return fetchData(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

/**
 * Helper para peticiones DELETE (Eliminar)
 */
export async function deleteData(url) {
    return fetchData(url, {
        method: 'DELETE'
    });
}
