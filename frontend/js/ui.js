/**
 * @file ui.js
 * @description Utilidades de UI - Loading states y mensajes
 */

// Referencia al overlay de loading
const loadingOverlay = document.getElementById('loading-overlay');

/**
 * Muestra el overlay de loading global
 */
export function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('active');
}

/**
 * Oculta el overlay de loading global
 */
export function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

/**
 * Activa/desactiva el estado de loading en un botón
 * @param {HTMLButtonElement} button - El botón a modificar
 * @param {boolean} isLoading - true para mostrar loading, false para quitarlo
 */
export function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

/**
 * Muestra un mensaje temporal (éxito/error) en un elemento DOM.
 * @param {HTMLElement} elemento - El elemento donde mostrar el mensaje
 * @param {string} mensaje - El texto del mensaje
 * @param {boolean} exito - true para éxito (verde), false para error (rojo)
 */
export function mostrarMensaje(elemento, mensaje, exito = true) {
    if (!elemento) return;
    elemento.textContent = mensaje;
    elemento.className = `mensaje visible ${exito ? 'exito' : 'error'}`;
    setTimeout(() => {
        elemento.classList.remove('visible');
    }, 5000);
}
