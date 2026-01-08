/**
 * @file auth.js
 * @description Gestión de autenticación y roles de usuario
 */

import { API_URL } from './config.js';
import { mostrarMensaje, showGlobalNotification } from './ui.js';
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
        console.log("Login Response:", data); // DEBUG
        localStorage.setItem('authToken', data.access_token);

        try {
            const payload = parseJwt(data.access_token);
            console.log("Token Payload:", payload); // DEBUG
            userRole = payload.rol || payload.role || 'usuario'; // Fallback to 'role' just in case
            currentUserId = payload.id || payload.sub || null;
            console.log("Determined Role:", userRole); // DEBUG
        } catch (e) {
            console.error("Error al decodificar token:", e);
            userRole = 'usuario';
            currentUserId = null;
        }

        // mostrarMensaje(loginMensaje, "¡Bienvenido!", true); // Removed in favor of global toast
        showGlobalNotification("Sesión iniciada correctamente", "success");
        
        // Delay closing to show message briefly? No, usually login is instant.
        // But let's keep it instant for login, consistent with user expectation.
        const modalLogin = document.getElementById('modal-login');
        if (modalLogin) {
            modalLogin.classList.remove('show');
            modalLogin.style.display = '';
        }
        document.getElementById('form-login').reset();

        // Sincronizar currentUserId con window para acceso global (usado por sales.js)
        window.currentUserId = currentUserId;

        // Actualiza toda la UI (se configurará desde app.js)
        if (window.actualizarUIPorRolCallback) {
            console.log("Actualizando UI..."); // DEBUG
            window.actualizarUIPorRolCallback();
        }

    } catch (error) {
        console.error("Login Error:", error); // DEBUG
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
        mostrarMensaje(registroMensaje, `Usuario ${nuevoUsuario.nombre} creado. Redirigiendo...`, true);
        
        // Delay closing so user sees the message
        setTimeout(() => {
            const modalRegistro = document.getElementById('modal-registro');
            if (modalRegistro) {
                 modalRegistro.classList.remove('show');
                 modalRegistro.style.display = '';
            }
            document.getElementById('form-registro').reset();
            
            // Optional: Automatically open login modal?
            // document.getElementById('modal-login').classList.add('show');
        }, 2000); 

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
    showGlobalNotification("Cerrando sesión...", "info", 2000);
    localStorage.removeItem('authToken');
    userRole = 'visualizacion';
    currentUserId = null;
    setTimeout(() => {
        window.location.reload();
    }, 1500);
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

    // Cerrar modales (Generic closer)
    document.querySelectorAll('.cerrar-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
                modal.style.display = '';
            }
        });
    });
}
