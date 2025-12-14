/**
 * @file client_addresses.js
 * @description Módulo para gestión de direcciones de clientes en el frontend.
 */

import { fetchData, postData, putData, deleteData } from './api.js';
import { mostrarMensaje } from './ui.js';

/**
 * Carga las direcciones del cliente especificado y las renderiza en el contenedor.
 * @param {number} clienteId - ID del cliente.
 */
export async function cargarDireccionesCliente(clienteId) {
    const contenedor = document.getElementById('lista-direcciones-cliente');
    if (!contenedor) return;

    contenedor.innerHTML = '<p>Cargando direcciones...</p>';

    try {
        const direcciones = await fetchData(`/api/clientes/${clienteId}/direcciones`);
        contenedor.innerHTML = '';

        if (!direcciones || direcciones.length === 0) {
            contenedor.innerHTML = '<p>No hay direcciones registradas.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        direcciones.forEach(dir => {
            const li = document.createElement('li');
            li.className = 'direccion-item';
            li.style.borderBottom = '1px solid #eee';
            li.style.padding = '10px 0';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';

            // Ensure we use the correct ID property (id_direccion) from schema
            const dirId = dir.id_direccion || dir.id; 

            li.innerHTML = `
                <div>
                    <strong>${dir.calle}</strong><br>
                    ${dir.ciudad}, CP: ${dir.codigo_postal}
                </div>
                <div>
                    <button class="btn-secondary btn-sm" onclick="window.prepararEdicionDireccion(${dirId}, '${dir.calle}', '${dir.ciudad}', '${dir.codigo_postal}')">Editar</button>
                    <button class="btn-danger btn-sm" onclick="window.eliminarDireccion(${clienteId}, ${dirId})" style="margin-left: 5px;">Eliminar</button>
                </div>
            `;
            ul.appendChild(li);
        });
        contenedor.appendChild(ul);

    } catch (error) {
        console.error('Error cargando direcciones:', error);
        contenedor.innerHTML = '<p class="error">Error al cargar direcciones.</p>';
    }
}

/**
 * Maneja el envío del formulario de nueva dirección.
 * @param {Event} event 
 */
export async function handleNuevaDireccionSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const direccionMensaje = document.getElementById('direccion-mensaje');
    
    const clienteId = document.getElementById('id-cliente-direccion').value;
    const calle = document.getElementById('calle-direccion').value;
    const ciudad = document.getElementById('ciudad-direccion').value;
    const cp = document.getElementById('cp-direccion').value;
    const idDireccionEdit = document.getElementById('id-direccion-edit').value; // Hidden input for edit mode

    if (!clienteId) {
        mostrarMensaje(direccionMensaje, 'Error: No hay cliente seleccionado.', 'error');
        return;
    }

    const data = {
        calle: calle,
        ciudad: ciudad,
        codigo_postal: cp
    };

    try {
        if (idDireccionEdit) {
            // Edit Mode
            await putData(`/api/clientes/${clienteId}/direcciones/${idDireccionEdit}`, data);
            mostrarMensaje(direccionMensaje, 'Dirección actualizada correctamente.', 'success');
        } else {
            // Create Mode
            await postData(`/api/clientes/${clienteId}/direcciones`, data);
            mostrarMensaje(direccionMensaje, 'Dirección añadida correctamente.', 'success');
        }
        
        form.reset();
        document.getElementById('id-cliente-direccion').value = clienteId; // Preserve client ID
        resetFormularioDireccion();
        cargarDireccionesCliente(clienteId); // Refresh list

    } catch (error) {
        console.error('Error guardando dirección:', error);
        mostrarMensaje(direccionMensaje, 'Error al guardar la dirección.', 'error');
    }
}

/**
 * Resetea el formulario de dirección a su estado inicial (modo creación).
 */
export function resetFormularioDireccion() {
    const form = document.getElementById('form-nueva-direccion');
    const btnCancelar = document.getElementById('btn-cancelar-edicion-direccion');
    const submitBtn = form.querySelector('button[type="submit"]');
    const hiddenIdEdit = document.getElementById('id-direccion-edit');
    
    if (form) form.reset();
    if (hiddenIdEdit) hiddenIdEdit.value = "";
    if (btnCancelar) btnCancelar.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Añadir Dirección';
    
    // Restore hidden client ID if present in session/variable
    const clientId = window.currentUserId || document.getElementById('id-cliente-direccion').value;
    if (clientId) document.getElementById('id-cliente-direccion').value = clientId;
}


// Expose helpers globally for inline onclicks
window.prepararEdicionDireccion = function(id, calle, ciudad, cp) {
    document.getElementById('id-direccion-edit').value = id;
    document.getElementById('calle-direccion').value = calle;
    document.getElementById('ciudad-direccion').value = ciudad;
    document.getElementById('cp-direccion').value = cp;

    const btnCancelar = document.getElementById('btn-cancelar-edicion-direccion');
    const submitBtn = document.getElementById('form-nueva-direccion').querySelector('button[type="submit"]');
    
    if (btnCancelar) btnCancelar.style.display = 'inline-block';
    if (submitBtn) submitBtn.textContent = 'Actualizar Dirección';
};

window.eliminarDireccion = async function(clienteId, idDireccion) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) return;
    
    const direccionMensaje = document.getElementById('direccion-mensaje');
    try {
        await deleteData(`/api/clientes/${clienteId}/direcciones/${idDireccion}`);
        mostrarMensaje(direccionMensaje, 'Dirección eliminada correctamente.', 'success');
        cargarDireccionesCliente(clienteId);
    } catch (error) {
        console.error('Error eliminando dirección:', error);
        mostrarMensaje(direccionMensaje, 'Error al eliminar la dirección.', 'error');
    }
};
