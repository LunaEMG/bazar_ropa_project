/**
 * @file app.js
 * @description Script principal para la interfaz del Bazar de Ropa.
 * Maneja la carga de datos, interacciones del carrito,
 * y operaciones CRUD para clientes, proveedores y ventas.
 */

// Espera a que el DOM esté completamente cargado.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuración ---
    /** URL base de la API backend desplegada. */
    const API_URL = 'https://bazar-ropa-project-lunaemg.onrender.com'; 

    // Referencias a elementos clave del DOM.
    const listaDeProductos = document.getElementById('productos-lista');
    const listaDeClientesContenedor = document.getElementById('clientes-lista-contenedor'); // Actualizado
    const formNuevoCliente = document.getElementById('form-nuevo-cliente');
    const clienteMensaje = document.getElementById('cliente-mensaje');
    const carritoItemsDiv = document.getElementById('carrito-items');
    const carritoTotalSpan = document.getElementById('carrito-total');
    const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');
    const compraMensaje = document.getElementById('compra-mensaje');
    const selectorCliente = document.getElementById('selector-cliente');
    const listaDeProveedores = document.getElementById('proveedores-lista');
    const formNuevoProveedor = document.getElementById('form-nuevo-proveedor'); 
    const proveedorMensaje = document.getElementById('proveedor-mensaje'); 
    const direccionesClienteDiv = document.getElementById('direcciones-cliente'); 
    const listaDireccionesCliente = document.getElementById('lista-direcciones-cliente');
    const formNuevaDireccion = document.getElementById('form-nueva-direccion');
    const direccionMensaje = document.getElementById('direccion-mensaje');
    const nombreClienteSeleccionadoSpan = document.getElementById('nombre-cliente-seleccionado');
    const idClienteDireccionInput = document.getElementById('id-cliente-direccion');
    // Referencias para el modal de edición de cliente
    const modalEditarCliente = document.getElementById('modal-editar-cliente');
    const formEditarCliente = document.getElementById('form-editar-cliente');
    const editClienteIdInput = document.getElementById('edit-cliente-id');
    const editNombreClienteInput = document.getElementById('edit-nombre-cliente');
    const editTelefonoClienteInput = document.getElementById('edit-telefono-cliente');
    const editClienteMensaje = document.getElementById('edit-cliente-mensaje');
    const cerrarModalClienteBtn = document.getElementById('cerrar-modal-cliente');

    // --- Estado de la Aplicación ---
    /** Almacena los items del carrito: { id_producto, nombre, precio, cantidad } */
    let carrito = []; 
    /** Almacena el ID del cliente seleccionado para gestión de direcciones. */
    let clienteSeleccionadoId = null; 

    // --- Funciones Auxiliares ---

    /** Muestra un mensaje temporal (éxito/error) en un elemento DOM. */
    function mostrarMensaje(elemento, mensaje, exito = true) {
        if (!elemento) { console.warn("Elemento para mensaje no encontrado"); return; }
        elemento.textContent = mensaje;
        elemento.className = exito ? 'mensaje exito visible' : 'mensaje error visible';
        setTimeout(() => {
            if (elemento) { 
                elemento.textContent = '';
                elemento.className = 'mensaje';
            }
        }, 3500);
    }

    /** Realiza una petición fetch genérica con manejo de errores básico. */
    async function fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // Intenta obtener detalles del error del cuerpo JSON si es posible
                let errorDetail = `HTTP error! status: ${response.status}`;
                try {
                    const errJson = await response.json();
                    errorDetail = errJson.detail || errorDetail;
                } catch (e) { /* Ignora si el cuerpo no es JSON */ }
                throw new Error(errorDetail);
            }
            // Si el status es 204 No Content, no hay cuerpo JSON para parsear
            if (response.status === 204) {
                return null; 
            }
            return await response.json(); // Parsea el cuerpo JSON
        } catch (error) {
            console.error(`Error en fetch a ${url}:`, error);
            throw error; // Relanza el error para manejo posterior
        }
    }

    // --- Funciones de Carga y Renderizado ---

    /** Carga y muestra la lista de productos. */
    async function cargarProductos() {
        if (!listaDeProductos) return;
        listaDeProductos.innerHTML = '<p>Cargando productos...</p>';
        try {
            const productos = await fetchData(`${API_URL}/api/productos`);
            listaDeProductos.innerHTML = ''; 
            if (!productos || productos.length === 0) {
                listaDeProductos.innerHTML = '<p>No hay productos disponibles.</p>'; return;
            }
            productos.forEach(producto => {
                const item = document.createElement('div'); item.className = 'producto-item';
                item.innerHTML = `<h3>${producto.nombre}</h3><p>${producto.descripcion || 'Sin descripción'}</p><p class="precio">$${producto.precio.toFixed(2)}</p><button class="btn-accion btn-add-carrito" data-id="${producto.id_producto}" data-nombre="${producto.nombre}" data-precio="${producto.precio}">Añadir al Carrito</button>`;
                const addButton = item.querySelector('.btn-add-carrito'); if (addButton) { addButton.addEventListener('click', handleAddCarritoClick); }
                listaDeProductos.appendChild(item);
            });
        } catch (error) {
            listaDeProductos.innerHTML = `<p style="color: red;">Error al cargar productos: ${error.message}</p>`;
        }
    }

    /** Carga y muestra la lista de clientes y puebla el selector. */
    async function cargarClientes() {
        if (!listaDeClientesContenedor || !selectorCliente) return;
        listaDeClientesContenedor.innerHTML = '<p>Cargando clientes...</p>';
        selectorCliente.innerHTML = '<option value="">Seleccione un cliente...</option>'; 
        try {
            const clientes = await fetchData(`${API_URL}/api/clientes`);
            listaDeClientesContenedor.innerHTML = ''; 
            if (!clientes || clientes.length === 0) { listaDeClientesContenedor.innerHTML = '<p>No hay clientes registrados.</p>'; return; }
            
            const ul = document.createElement('ul');
            clientes.forEach(cliente => {
                const li = document.createElement('li'); 
                li.innerHTML = `
                    <div class="item-info">
                        <span>${cliente.nombre}</span> 
                        <span>${cliente.telefono || 'Sin teléfono'}</span>
                    </div>
                    <div class="item-acciones">
                        <button class="btn-accion btn-ver-direcciones" data-id="${cliente.id_cliente}" data-nombre="${cliente.nombre}">Direcciones</button>
                        <button class="btn-accion btn-editar-cliente" data-id="${cliente.id_cliente}" data-nombre="${cliente.nombre}" data-telefono="${cliente.telefono || ''}">Editar</button>
                        <button class="btn-accion btn-eliminar-cliente" data-id="${cliente.id_cliente}" data-nombre="${cliente.nombre}">Eliminar</button>
                    </div>
                `;
                // Añadir listeners a los botones de acciones
                li.querySelector('.btn-ver-direcciones').addEventListener('click', handleVerDireccionesClick);
                li.querySelector('.btn-editar-cliente').addEventListener('click', handleEditarClienteClick);
                li.querySelector('.btn-eliminar-cliente').addEventListener('click', handleDeleteClienteClick);
                ul.appendChild(li);

                // Añadir al selector
                const option = document.createElement('option'); option.value = cliente.id_cliente; option.textContent = cliente.nombre;
                selectorCliente.appendChild(option);
            });
            listaDeClientesContenedor.appendChild(ul); // Añade la lista completa al contenedor
        } catch (error) {
            listaDeClientesContenedor.innerHTML = `<p style="color: red;">Error al cargar clientes: ${error.message}</p>`;
        }
    }

    /** Carga y muestra la lista de proveedores. */
    async function cargarProveedores() {
        if (!listaDeProveedores) return; 
        listaDeProveedores.innerHTML = '<p>Cargando proveedores...</p>';
        try {
            const proveedores = await fetchData(`${API_URL}/api/proveedores`);
            listaDeProveedores.innerHTML = ''; 
            if (!proveedores || proveedores.length === 0) { listaDeProveedores.innerHTML = '<p>No hay proveedores registrados.</p>'; return; }
            const ul = document.createElement('ul');
            proveedores.forEach(proveedor => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="item-info">
                        <span>${proveedor.nombre}</span> 
                        <span>${proveedor.telefono || 'Sin teléfono'}</span>
                    </div>
                    <div class="item-acciones">
                        </div>
                `;
                ul.appendChild(li);
            });
            listaDeProveedores.appendChild(ul);
        } catch (error) {
            listaDeProveedores.innerHTML = `<p style="color: red;">Error al cargar proveedores: ${error.message}</p>`;
        }
    }

    /** Carga y muestra las direcciones de un cliente específico. */
    async function cargarDireccionesCliente(clienteId) {
        if (!listaDireccionesCliente) return;
        listaDireccionesCliente.innerHTML = '<p>Cargando direcciones...</p>';
        try {
            const direcciones = await fetchData(`${API_URL}/api/clientes/${clienteId}/direcciones`);
            listaDireccionesCliente.innerHTML = ''; 
            if (!direcciones || direcciones.length === 0) { listaDireccionesCliente.innerHTML = '<p>Este cliente no tiene direcciones registradas.</p>'; return; }
            const ul = document.createElement('ul');
            direcciones.forEach(dir => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="item-info">
                        <span>${dir.calle}</span>
                        <span>${dir.ciudad}, CP ${dir.codigo_postal}</span>
                    </div>
                    <div class="item-acciones">
                        </div>
                    `; 
                ul.appendChild(li);
            });
            listaDireccionesCliente.appendChild(ul);
        } catch (error) {
            listaDireccionesCliente.innerHTML = `<p style="color: red;">Error al cargar direcciones: ${error.message}</p>`;
        }
    }

    // --- Funciones de Lógica de UI ---

    /** Muestra la sección de direcciones para un cliente específico. */
    function mostrarSeccionDirecciones(clienteId, nombreCliente) {
         if (!direccionesClienteDiv || !nombreClienteSeleccionadoSpan || !idClienteDireccionInput) return;
         clienteSeleccionadoId = clienteId; 
         nombreClienteSeleccionadoSpan.textContent = nombreCliente; 
         idClienteDireccionInput.value = clienteId; 
         direccionesClienteDiv.style.display = 'block'; // Muestra la sección
         cargarDireccionesCliente(clienteId); 
    }

    /** Muestra el modal de edición de cliente con los datos precargados. */
    function mostrarModalEditarCliente(clienteId, nombre, telefono) {
        if (!modalEditarCliente || !editClienteIdInput || !editNombreClienteInput || !editTelefonoClienteInput) return;
        editClienteIdInput.value = clienteId;
        editNombreClienteInput.value = nombre;
        editTelefonoClienteInput.value = telefono || ''; // Usa string vacío si es null/undefined
        editClienteMensaje.textContent = ''; // Limpia mensajes previos
        editClienteMensaje.className = 'mensaje';
        modalEditarCliente.style.display = 'block'; // Muestra el modal
    }

    /** Oculta el modal de edición de cliente. */
    function ocultarModalEditarCliente() {
        if (modalEditarCliente) {
            modalEditarCliente.style.display = 'none'; // Oculta el modal
        }
    }

    // --- Funciones del Carrito ---
    function renderizarCarrito() { /* ... (código existente sin cambios) ... */ }
    function handleAddCarritoClick(event) { /* ... (código existente sin cambios) ... */ }
    function handleRemoveCarritoClick(event) { /* ... (código existente sin cambios) ... */ }

    // --- Manejadores de Eventos ---

    /** Maneja el clic en "Ver/Añadir Direcciones". */
    function handleVerDireccionesClick(event) {
        const button = event.target;
        const clienteId = parseInt(button.dataset.id);
        const nombreCliente = button.dataset.nombre;
        mostrarSeccionDirecciones(clienteId, nombreCliente);
    }

    /** Maneja el clic en "Editar Cliente". */
    function handleEditarClienteClick(event) {
        const button = event.target;
        const clienteId = parseInt(button.dataset.id);
        const nombre = button.dataset.nombre;
        const telefono = button.dataset.telefono; // Puede ser string vacío
        mostrarModalEditarCliente(clienteId, nombre, telefono);
    }

    /** Maneja el clic en "Eliminar Cliente". */
    async function handleDeleteClienteClick(event) {
        const button = event.target;
        const clienteId = parseInt(button.dataset.id);
        const nombreCliente = button.dataset.nombre;

        // Confirmación antes de eliminar
        if (!confirm(`¿Estás seguro de que deseas eliminar al cliente "${nombreCliente}"? Esta acción no se puede deshacer.`)) {
            return; // No hacer nada si el usuario cancela
        }

        try {
            // Llama al endpoint DELETE de la API
            await fetchData(`${API_URL}/api/clientes/${clienteId}`, {
                method: 'DELETE',
            });
            // Si la llamada fue exitosa (no lanzó error), actualiza la UI
            mostrarMensaje(clienteMensaje, `Cliente "${nombreCliente}" eliminado con éxito.`, true);
            cargarClientes(); // Recarga la lista de clientes
            // Opcional: Si el cliente eliminado era el seleccionado para direcciones, ocultar esa sección
            if (clienteSeleccionadoId === clienteId && direccionesClienteDiv) {
                direccionesClienteDiv.style.display = 'none';
                clienteSeleccionadoId = null;
            }
        } catch (error) {
            // Muestra error si la API devuelve un problema (ej. 404, 500)
            mostrarMensaje(clienteMensaje, `Error al eliminar cliente: ${error.message}`, false);
        }
    }

    /** Maneja el envío del formulario de edición de cliente. */
    async function handleEditarClienteSubmit(event) {
        event.preventDefault();
        if (!formEditarCliente || !editClienteIdInput || !editNombreClienteInput || !editTelefonoClienteInput || !editClienteMensaje) return;

        const clienteId = parseInt(editClienteIdInput.value);
        const nombre = editNombreClienteInput.value;
        const telefono = editTelefonoClienteInput.value || null; // Enviar null si está vacío

        const submitButton = formEditarCliente.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';

        try {
            // Llama al endpoint PUT de la API
            const clienteActualizado = await fetchData(`${API_URL}/api/clientes/${clienteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, telefono }), // Envía solo los campos a actualizar
            });
            mostrarMensaje(editClienteMensaje, `Cliente "${clienteActualizado.nombre}" actualizado con éxito!`, true);
            ocultarModalEditarCliente(); // Cierra el modal
            cargarClientes(); // Recarga la lista de clientes
        } catch (error) {
            mostrarMensaje(editClienteMensaje, `Error al actualizar: ${error.message}`, false);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Cambios';
        }
    }


    /** Maneja el envío del formulario para crear un nuevo cliente. */
    async function handleNuevoClienteSubmit(event) { /* ... (lógica existente refactorizada a async/await) ... */ 
        event.preventDefault(); if (!formNuevoCliente || !clienteMensaje) return;
        const formData = new FormData(formNuevoCliente); const nombre = formData.get('nombre'); const telefono = formData.get('telefono') || null; 
        const submitButton = formNuevoCliente.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Registrando...';
        try {
            const nuevoCliente = await fetchData(`${API_URL}/api/clientes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, telefono }), });
            mostrarMensaje(clienteMensaje, `Cliente "${nuevoCliente.nombre}" registrado!`, true); formNuevoCliente.reset(); cargarClientes(); 
        } catch (error) { mostrarMensaje(clienteMensaje, `Error: ${error.message}`, false); } 
        finally { submitButton.disabled = false; submitButton.textContent = 'Registrar Cliente'; }
    }

    /** Maneja el envío del formulario para crear un nuevo proveedor. */
    async function handleNuevoProveedorSubmit(event) { /* ... (lógica existente refactorizada a async/await) ... */ 
        event.preventDefault(); if (!formNuevoProveedor || !proveedorMensaje) return; 
        const formData = new FormData(formNuevoProveedor); const nombre = formData.get('nombre'); const telefono = formData.get('telefono') || null; 
        const submitButton = formNuevoProveedor.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Registrando...';
        try {
            const nuevoProveedor = await fetchData(`${API_URL}/api/proveedores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, telefono }), });
            mostrarMensaje(proveedorMensaje, `Proveedor "${nuevoProveedor.nombre}" registrado!`, true); formNuevoProveedor.reset(); cargarProveedores(); 
        } catch (error) { mostrarMensaje(proveedorMensaje, `Error: ${error.message}`, false); } 
        finally { submitButton.disabled = false; submitButton.textContent = 'Registrar Proveedor'; }
    }
    
    /** Maneja el envío del formulario para añadir una dirección. */
    async function handleNuevaDireccionSubmit(event) { /* ... (lógica existente refactorizada a async/await) ... */ 
        event.preventDefault(); if (!formNuevaDireccion || !direccionMensaje || clienteSeleccionadoId === null) return;
        const formData = new FormData(formNuevaDireccion); const calle = formData.get('calle'); const ciudad = formData.get('ciudad'); const codigo_postal = formData.get('codigo_postal');
        const submitButton = formNuevaDireccion.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Añadiendo...';
        try {
            const nuevaDireccion = await fetchData(`${API_URL}/api/clientes/${clienteSeleccionadoId}/direcciones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calle, ciudad, codigo_postal }), });
            mostrarMensaje(direccionMensaje, `Dirección añadida con éxito!`, true); formNuevaDireccion.reset(); cargarDireccionesCliente(clienteSeleccionadoId); 
        } catch (error) { mostrarMensaje(direccionMensaje, `Error: ${error.message}`, false); } 
        finally { submitButton.disabled = false; submitButton.textContent = 'Añadir Dirección'; }
    }

    /** Maneja el clic en "Finalizar Compra". */
    async function handleFinalizarCompraClick() { /* ... (lógica existente refactorizada a async/await) ... */ 
        if (!selectorCliente || !btnFinalizarCompra || !compraMensaje) return;
        const idClienteSeleccionado = selectorCliente.value;
        if (!idClienteSeleccionado) { mostrarMensaje(compraMensaje, "Seleccione un cliente.", false); return; }
        if (carrito.length === 0) { mostrarMensaje(compraMensaje, "El carrito está vacío.", false); return; }
        const ventaData = { id_cliente: parseInt(idClienteSeleccionado), detalles: carrito.map(item => ({ id_producto: item.id_producto, cantidad: item.cantidad, precio_unitario: item.precio })) };
        btnFinalizarCompra.disabled = true; btnFinalizarCompra.textContent = 'Procesando...';
        try {
            const ventaCreada = await fetchData(`${API_URL}/api/ventas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ventaData), });
            mostrarMensaje(compraMensaje, `Venta #${ventaCreada.id_venta} registrada! Total: $${ventaCreada.monto_total.toFixed(2)}`, true); carrito = []; renderizarCarrito(); selectorCliente.value = ""; 
        } catch (error) { mostrarMensaje(compraMensaje, `Error: ${error.message}`, false); } 
        finally { btnFinalizarCompra.textContent = 'Finalizar Compra'; renderizarCarrito(); }
    }

    // --- Inicialización y Asignación de Eventos ---

    // Carga inicial de datos.
    cargarProductos();
    cargarClientes(); 
    cargarProveedores(); 

    // Asigna manejadores de eventos a formularios y botones estáticos.
    if (formNuevoCliente) formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    if (formNuevoProveedor) formNuevoProveedor.addEventListener('submit', handleNuevoProveedorSubmit);
    if (formNuevaDireccion) formNuevaDireccion.addEventListener('submit', handleNuevaDireccionSubmit); 
    if (btnFinalizarCompra) btnFinalizarCompra.addEventListener('click', handleFinalizarCompraClick);
    // Event listener para el formulario de edición en el modal
    if (formEditarCliente) formEditarCliente.addEventListener('submit', handleEditarClienteSubmit);
    // Event listener para cerrar el modal
    if (cerrarModalClienteBtn) cerrarModalClienteBtn.addEventListener('click', ocultarModalEditarCliente);
    // Cierra el modal si se hace clic fuera del contenido
    if (modalEditarCliente) {
        modalEditarCliente.addEventListener('click', (event) => {
            if (event.target === modalEditarCliente) { // Si el clic fue en el fondo oscuro
                ocultarModalEditarCliente();
            }
        });
    }
    
    // Renderiza el estado inicial del carrito.
    renderizarCarrito();

}); // Fin del addEventListener DOMContentLoaded