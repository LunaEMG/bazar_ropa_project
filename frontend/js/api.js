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
                errorDetail = errJson.detail || errorDetail;
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
