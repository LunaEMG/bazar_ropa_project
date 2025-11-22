/**
 * @file auth.js
 * @description Gestión de autenticación y roles de usuario
 */

import { API_URL } from './config.js';
import { mostrarMensaje } from './ui.js';
import { setLogoutCallback } from './api.js';

// Estado global de autenticación
export let userRole = 'visualizacion'; // Rol por defecto
export let currentUserId = null; // ID del usuario logueado

/**
 * Obtiene el userRole actual
 */
export function getUserRole() {
    return userRole;
}

/**
 * Decodifica un token JWT (Base64Url) a un objeto JSON
 */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        throw new Error("Token inválido");
    }
}

/**
 * Maneja el envío del formulario de login
 */
export async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginMensaje = document.getElementById('login-mensaje');
    const submitButton = document.querySelector('#form-login button[type="submit"]');
    submitButton.disabled = true;

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
        const response = await fetch(`${API_URL}/api/auth/token`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Email o contraseña incorrectos.");
        }

        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);

        try {
            const payload = parseJwt(data.access_token);
            userRole = payload.rol || 'usuario';
            currentUserId = payload.id || null;
        } catch (e) {
            console.error("Error al decodificar token:", e);
            userRole = 'usuario';
            currentUserId = null;
        }

        mostrarMensaje(loginMensaje, "¡Bienvenido!", true);
        document.getElementById('modal-login').style.display = 'none';
        document.getElementById('form-login').reset();

        // Sincronizar currentUserId con window para acceso global (usado por sales.js)
        window.currentUserId = currentUserId;

        // Actualiza toda la UI (se configurará desde app.js)
        if (window.actualizarUIPorRolCallback) {
            window.actualizarUIPorRolCallback();
        }

    } catch (error) {
        userRole = 'visualizacion';
        mostrarMensaje(loginMensaje, error.message, false);
    } finally {
        submitButton.disabled = false;
    }
}

/**
 * Maneja el envío del formulario de registro
 */
export async function handleRegistroSubmit(event) {
    event.preventDefault();
    const registroMensaje = document.getElementById('registro-mensaje');
    const submitButton = document.querySelector('#form-registro button[type="submit"]');
    submitButton.disabled = true;

    const payload = {
        nombre: document.getElementById('registro-nombre').value,
        email: document.getElementById('registro-email').value,
        password: document.getElementById('registro-password').value,
        telefono: document.getElementById('registro-telefono').value || null
    };

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Error al registrar");
        }

        const nuevoUsuario = await response.json();
        mostrarMensaje(registroMensaje, `¡Usuario ${nuevoUsuario.nombre} creado! Ahora puedes iniciar sesión.`, true);
        document.getElementById('modal-registro').style.display = 'none';
        document.getElementById('form-registro').reset();

    } catch (error) {
        mostrarMensaje(registroMensaje, `Error: ${error.message}`, false);
    } finally {
        submitButton.disabled = false;
    }
}

/**
 * Cierra la sesión del usuario
 */
export function handleLogout() {
    localStorage.removeItem('authToken');
    userRole = 'visualizacion';
    currentUserId = null;
    window.location.reload();
}

/**
 * Verifica si hay un token guardado al cargar la página
 */
export function checkExistingToken() {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const payload = parseJwt(token);
            userRole = payload.rol || 'usuario';
            currentUserId = payload.id || null;

            // Sincronizar con window para acceso global
            window.currentUserId = currentUserId;
        } catch (e) {
            console.error("Token inválido, eliminando...", e);
            localStorage.removeItem('authToken');
            userRole = 'visualizacion';
            currentUserId = null;
            window.currentUserId = null;
        }
    }
}

/**
 * Inicializa los event listeners de autenticación
 */
export function initAuthListeners() {
    // Configurar callback de logout para api.js
    setLogoutCallback(handleLogout);

    // Login
    document.getElementById('form-login')?.addEventListener('submit', handleLoginSubmit);

    // Registro
    document.getElementById('form-registro')?.addEventListener('submit', handleRegistroSubmit);

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

    // Mostrar modales
    document.getElementById('btn-mostrar-login')?.addEventListener('click', () => {
        document.getElementById('modal-login').style.display = 'block';
    });

    document.getElementById('btn-mostrar-registro')?.addEventListener('click', () => {
        document.getElementById('modal-registro').style.display = 'block';
    });

    // Cerrar modales
    document.querySelectorAll('.cerrar-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
}
