/**
 * @file app.js
 * @description Script principal para la interfaz del Bazar de Ropa.
 * Maneja la carga de datos, interacciones del carrito,
 * y operaciones CRUD para clientes, proveedores, direcciones y ventas.
 */

// Espera a que el DOM esté completamente cargado.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuración ---
    /** URL base de la API backend desplegada. */
    const API_URL = 'https://bazar-ropa-project-lunaemg.onrender.com'; 

    // Referencias a elementos clave del DOM.
    const listaDeProductos = document.getElementById('productos-lista');
    const listaDeClientesContenedor = document.getElementById('clientes-lista-contenedor'); 
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
        if (!elemento) { console.warn("Elemento para mensaje no encontrado:", elemento); return; }
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
            console.error(`Error en fetch a ${url}:`, error);
            throw error; 
        }
    }

    // --- Funciones de Carga y Renderizado ---

    /** Carga y muestra la lista de productos (Corregido listener). */
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
                const item = document.createElement('div'); 
                item.className = 'producto-item';
                item.innerHTML = `
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion || 'Sin descripción'}</p>
                    <p class="precio">$${producto.precio.toFixed(2)}</p>
                    <button class="btn-accion btn-add-carrito" data-id="${producto.id_producto}" data-nombre="${producto.nombre}" data-precio="${producto.precio}">Añadir al Carrito</button>
                `;
                const addButton = item.querySelector('.btn-add-carrito'); 
                if (addButton) {
                    addButton.addEventListener('click', handleAddCarritoClick); 
                } else {
                    console.error(`Error: Botón 'Añadir al Carrito' no encontrado para producto ID: ${producto.id_producto}`);
                }
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
                // Asignación de Listeners de Clientes
                li.querySelector('.btn-ver-direcciones').addEventListener('click', handleVerDireccionesClick);
                li.querySelector('.btn-editar-cliente').addEventListener('click', handleEditarClienteClick);
                li.querySelector('.btn-eliminar-cliente').addEventListener('click', handleDeleteClienteClick);
                ul.appendChild(li);

                // Añadir al selector
                const option = document.createElement('option'); option.value = cliente.id_cliente; option.textContent = cliente.nombre;
                selectorCliente.appendChild(option);
            });
            listaDeClientesContenedor.appendChild(ul); 
        } catch (error) {
            listaDeClientesContenedor.innerHTML = `<p style="color: red;">Error al cargar clientes: ${error.message}</p>`;
        }
    }

    /** Carga y muestra la lista de proveedores (Corregido listener). */
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
                         <button class="btn-accion btn-editar-proveedor" data-id="${proveedor.id_proveedor}" data-nombre="${proveedor.nombre}" data-telefono="${proveedor.telefono || ''}">Editar</button>
                         <button class="btn-accion btn-eliminar-proveedor" data-id="${proveedor.id_proveedor}" data-nombre="${proveedor.nombre}">Eliminar</button>
                    </div>
                `;
                // --- ASIGNACIÓN DE LISTENERS DE PROVEEDORES (CORRECCIÓN) ---
                li.querySelector('.btn-editar-proveedor').addEventListener('click', handleEditarProveedorClick);
                li.querySelector('.btn-eliminar-proveedor').addEventListener('click', handleDeleteProveedorClick);
                
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
         direccionesClienteDiv.style.display = 'block'; 
         cargarDireccionesCliente(clienteId); 
    }

    /** Muestra el modal de edición de cliente con los datos precargados. */
    function mostrarModalEditarCliente(clienteId, nombre, telefono) {
        if (!modalEditarCliente || !editClienteIdInput || !editNombreClienteInput || !editTelefonoClienteInput) return;
        editClienteIdInput.value = clienteId;
        editNombreClienteInput.value = nombre;
        editTelefonoClienteInput.value = telefono || ''; 
        editClienteMensaje.textContent = 'Editando Cliente'; 
        editClienteMensaje.className = 'mensaje';
        modalEditarCliente.style.display = 'block'; 
        
        // Ajuste visual para el modal:
        const modalTitle = modalEditarCliente.querySelector('h3');
        if (modalTitle) modalTitle.textContent = "Editar Cliente";
        // Añadir una clase al formulario para diferenciar el manejador de envío
        formEditarCliente.setAttribute('data-target-entity', 'cliente');
    }

    /** Muestra el modal de edición de proveedor con los datos precargados. */
    function mostrarModalEditarProveedor(proveedorId, nombre, telefono) {
        if (!modalEditarCliente || !editClienteIdInput || !editNombreClienteInput || !editTelefonoClienteInput) return;
        
        editClienteIdInput.value = proveedorId;
        editNombreClienteInput.value = nombre;
        editTelefonoClienteInput.value = telefono || ''; 
        editClienteMensaje.textContent = 'Editando Proveedor'; 
        editClienteMensaje.className = 'mensaje';
        
        // Ajuste visual para el modal:
        const modalTitle = modalEditarCliente.querySelector('h3');
        if (modalTitle) modalTitle.textContent = "Editar Proveedor";
        // Añadir una clase al formulario para diferenciar el manejador de envío
        formEditarCliente.setAttribute('data-target-entity', 'proveedor');
        
        modalEditarCliente.style.display = 'block'; 
    }
    
    /** Oculta el modal de edición. */
    function ocultarModalEditarCliente() {
        if (modalEditarCliente) {
            modalEditarCliente.style.display = 'none'; 
        }
    }

    // --- Funciones del Carrito ---

    /** Actualiza la vista del carrito en el HTML y calcula el total. */
    function renderizarCarrito() { 
        if (!carritoItemsDiv || !carritoTotalSpan || !btnFinalizarCompra) return;
        carritoItemsDiv.innerHTML = ''; 
        let total = 0;
        if (carrito.length === 0) { carritoItemsDiv.innerHTML = '<p>El carrito está vacío.</p>'; btnFinalizarCompra.disabled = true; } 
        else {
            carrito.forEach(item => {
                const itemDiv = document.createElement('div'); 
                itemDiv.className = 'carrito-item'; 
                itemDiv.innerHTML = `<span class="item-nombre">${item.nombre}</span><span class="item-cantidad">x ${item.cantidad}</span><span class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</span><button class="btn-remove-carrito" data-id="${item.id_producto}" style="color: red; background: none; border: none; cursor: pointer;">X</button>`;
                const removeButton = itemDiv.querySelector('.btn-remove-carrito'); 
                if (removeButton) { removeButton.addEventListener('click', handleRemoveCarritoClick); } 
                else { console.error("Error: Botón remover no encontrado para item:", item); }
                carritoItemsDiv.appendChild(itemDiv); total += item.precio * item.cantidad;
            });
            btnFinalizarCompra.disabled = false; 
        }
        carritoTotalSpan.textContent = total.toFixed(2); 
    }

    /** Maneja el clic en "Añadir al Carrito" (funciona como un Toggle/Añadir). */
    function handleAddCarritoClick(event) {
        const button = event.target;
        const idProducto = parseInt(button.dataset.id); 
        const nombre = button.dataset.nombre;
        const precio = parseFloat(button.dataset.precio); 
        // console.log("Añadiendo al carrito:", { idProducto, nombre, precio }); 

        const itemExistente = carrito.find(item => item.id_producto === idProducto);
        if (itemExistente) {
            itemExistente.cantidad++; 
        } else {
            carrito.push({ id_producto: idProducto, nombre, precio, cantidad: 1 });
        }
        renderizarCarrito(); // Actualiza la vista
    }

    /** Maneja el clic en el botón "X" para remover item del carrito. */
    function handleRemoveCarritoClick(event) {
        const button = event.target; 
        const idProducto = parseInt(button.dataset.id);
        carrito = carrito.filter(item => item.id_producto !== idProducto); 
        renderizarCarrito(); 
    }

    // --- Manejadores de Eventos CRUD ---

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
        const telefono = button.dataset.telefono; 
        mostrarModalEditarCliente(clienteId, nombre, telefono);
    }
    
    /** Maneja el clic en "Editar Proveedor". */
    function handleEditarProveedorClick(event) {
        const button = event.target;
        const proveedorId = parseInt(button.dataset.id);
        const nombre = button.dataset.nombre;
        const telefono = button.dataset.telefono; 
        mostrarModalEditarProveedor(proveedorId, nombre, telefono);
    }

    /** Maneja el clic en "Eliminar Cliente". */
    async function handleDeleteClienteClick(event) {
        const button = event.target;
        const clienteId = parseInt(button.dataset.id);
        const nombreCliente = button.dataset.nombre;

        if (!confirm(`¿Estás seguro de que deseas eliminar al cliente "${nombreCliente}"?`)) {
            return; 
        }

        try {
            await fetchData(`${API_URL}/api/clientes/${clienteId}`, {
                method: 'DELETE',
            });
            mostrarMensaje(clienteMensaje, `Cliente "${nombreCliente}" eliminado con éxito.`, true);
            cargarClientes(); 
            if (clienteSeleccionadoId === clienteId && direccionesClienteDiv) {
                direccionesClienteDiv.style.display = 'none';
                clienteSeleccionadoId = null;
            }
        } catch (error) {
            mostrarMensaje(clienteMensaje, `Error al eliminar cliente: ${error.message}`, false); 
        }
    }
    
    /** Maneja el clic en "Eliminar Proveedor". */
    async function handleDeleteProveedorClick(event) {
        const button = event.target;
        const proveedorId = parseInt(button.dataset.id);
        const nombreProveedor = button.dataset.nombre;

        if (!confirm(`¿Estás seguro de que deseas eliminar al proveedor "${nombreProveedor}"?`)) {
            return; 
        }

        try {
            // Llama al endpoint DELETE
            await fetchData(`${API_URL}/api/proveedores/${proveedorId}`, {
                method: 'DELETE',
            });
            // Éxito (status 204)
            mostrarMensaje(proveedorMensaje, `Proveedor "${nombreProveedor}" eliminado con éxito.`, true);
            cargarProveedores(); // Recarga la lista de proveedores
            // Opcional: Recargar productos ya que los productos de ese proveedor podrían haberse quedado huérfanos
            cargarProductos(); 
        } catch (error) {
            // Muestra el mensaje de error DETALLADO que viene de la API (ej. 409 Conflict)
            mostrarMensaje(proveedorMensaje, `Error al eliminar proveedor: ${error.message}`, false); 
        }
    }


/** Maneja el envío del formulario de edición de cliente/proveedor. */
async function handleEditarSubmit(event) {
    event.preventDefault();
    // Obtiene la entidad objetivo ('cliente' o 'proveedor') del atributo data-target-entity
    const entityType = formEditarCliente.getAttribute('data-target-entity'); 
    
    if (!entityType || !formEditarCliente || !editClienteIdInput || !editClienteMensaje) return;

    // --- PUNTO CRÍTICO 1: Obtenemos el ID del input oculto (reutilizado) ---
    const id = parseInt(editClienteIdInput.value); 
    const nombre = editNombreClienteInput.value;
    const telefono = editTelefonoClienteInput.value || null; 

    // Verificación de ID válida
    if (isNaN(id) || id <= 0) {
        mostrarMensaje(editClienteMensaje, `Error: ID de ${entityType} no válido (${id}).`, false);
        return;
    }

    const submitButton = formEditarCliente.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    try {

        // Construcción de la URL: /api/{entidad en plural}s/{id}
        let pluralEntity = entityType;
        if (entityType === 'proveedor') pluralEntity = 'proveedores';
        else pluralEntity = `${entityType}s`;

        const endpoint = `${API_URL}/api/${pluralEntity}/${id}`;
        
        console.log(`[EDIT] Enviando PUT a: ${endpoint}`); // Log de depuración
        console.log(`[EDIT] Datos enviados:`, { nombre, telefono }); // Log de depuración

        const actualizado = await fetchData(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono }), 
        });
        
        // Lógica de UI según la entidad editada
        if (entityType === 'cliente') {
            mostrarMensaje(clienteMensaje, `Cliente "${actualizado.nombre}" actualizado!`, true);
            cargarClientes();
        } else if (entityType === 'proveedor') {
             mostrarMensaje(proveedorMensaje, `Proveedor "${actualizado.nombre}" actualizado!`, true);
             cargarProveedores();
        }
        
        ocultarModalEditarCliente(); 
    } catch (error) {
        mostrarMensaje(editClienteMensaje, `Error al actualizar: ${error.message}`, false); 
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Guardar Cambios';
    }
}


    /** Maneja el envío del formulario para crear un nuevo cliente. */
    async function handleNuevoClienteSubmit(event) { 
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
    async function handleNuevoProveedorSubmit(event) { 
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
    async function handleNuevaDireccionSubmit(event) { 
        event.preventDefault(); if (!formNuevaDireccion || !direccionMensaje || clienteSeleccionadoId === null) return;
        const formData = new FormData(formNuevaDireccion); const calle = formData.get('calle'); const ciudad = formData.get('ciudad'); const codigo_postal = formData.get('codigo_postal');
        const submitButton = formNuevaDireccion.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Añadiendo...';
        try {
            const nuevaDireccion = await fetchData(`${API_URL}/api/clientes/${clienteSeleccionadoId}/direcciones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calle, ciudad, codigo_postal }), });
            mostrarMensaje(direccionMensaje, `Dirección añadida!`, true); formNuevaDireccion.reset(); cargarDireccionesCliente(clienteSeleccionadoId); 
        } catch (error) { mostrarMensaje(direccionMensaje, `Error: ${error.message}`, false); } 
        finally { submitButton.disabled = false; submitButton.textContent = 'Añadir Dirección'; }
    }

    /** Maneja el clic en "Finalizar Compra". */
    async function handleFinalizarCompraClick() { 
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
    
    // El formulario de edición del modal maneja ahora Cliente y Proveedor
    if (formEditarCliente) formEditarCliente.addEventListener('submit', handleEditarSubmit); 
    
    if (cerrarModalClienteBtn) cerrarModalClienteBtn.addEventListener('click', ocultarModalEditarCliente);
    if (modalEditarCliente) {
        modalEditarCliente.addEventListener('click', (event) => {
            if (event.target === modalEditarCliente) { 
                ocultarModalEditarCliente();
            }
        });
    }
    
    // Renderiza el estado inicial del carrito.
    renderizarCarrito();

}); // Fin del addEventListener DOMContentLoaded