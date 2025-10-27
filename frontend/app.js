/**
 * @file app.js
 * @description Script principal para la interfaz del Bazar de Ropa.
 * Maneja la carga de datos, interacciones del carrito,
 * y operaciones CRUD para clientes, proveedores, direcciones y ventas.
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuración ---
    const API_URL = 'https://bazar-ropa-project-lunaemg.onrender.com'; 

    // Referencias a elementos del DOM
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

    // --- Estado ---
    let carrito = []; 
    let clienteSeleccionadoId = null; 

    // --- Auxiliares ---
    function mostrarMensaje(elemento, mensaje, exito = true) {
        if (!elemento) return;
        elemento.textContent = mensaje;
        elemento.className = exito ? 'mensaje exito visible' : 'mensaje error visible';
        setTimeout(() => {
            elemento.textContent = '';
            elemento.className = 'mensaje';
        }, 3500);
    }

    async function fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                let errorDetail = `Error HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errJson = await response.json();
                    if (errJson && errJson.detail) errorDetail = errJson.detail;
                } catch (_) {}
                throw new Error(errorDetail);
            }
            if (response.status === 204) return null;
            return await response.json();
        } catch (error) {
            console.error(`Error en fetch a ${url}:`, error);
            throw error;
        }
    }

    // --- Carga y Renderizado ---

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
                item.querySelector('.btn-add-carrito').addEventListener('click', handleAddCarritoClick); 
                listaDeProductos.appendChild(item);
            });
        } catch (error) {
            listaDeProductos.innerHTML = `<p style="color:red;">Error al cargar productos: ${error.message}</p>`;
        }
    }

    async function cargarClientes() {
        if (!listaDeClientesContenedor || !selectorCliente) return;
        listaDeClientesContenedor.innerHTML = '<p>Cargando clientes...</p>';
        selectorCliente.innerHTML = '<option value="">Seleccione un cliente...</option>'; 
        try {
            const clientes = await fetchData(`${API_URL}/api/clientes`);
            listaDeClientesContenedor.innerHTML = ''; 
            if (!clientes.length) {
                listaDeClientesContenedor.innerHTML = '<p>No hay clientes registrados.</p>'; return;
            }
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
                li.querySelector('.btn-ver-direcciones').addEventListener('click', handleVerDireccionesClick);
                li.querySelector('.btn-editar-cliente').addEventListener('click', handleEditarClienteClick);
                li.querySelector('.btn-eliminar-cliente').addEventListener('click', handleDeleteClienteClick);
                ul.appendChild(li);
                const option = document.createElement('option'); 
                option.value = cliente.id_cliente; option.textContent = cliente.nombre;
                selectorCliente.appendChild(option);
            });
            listaDeClientesContenedor.appendChild(ul); 
        } catch (error) {
            listaDeClientesContenedor.innerHTML = `<p style="color:red;">Error al cargar clientes: ${error.message}</p>`;
        }
    }

    async function cargarProveedores() {
        if (!listaDeProveedores) return; 
        listaDeProveedores.innerHTML = '<p>Cargando proveedores...</p>';
        try {
            const proveedores = await fetchData(`${API_URL}/api/proveedores`);
            listaDeProveedores.innerHTML = ''; 
            if (!proveedores.length) {
                listaDeProveedores.innerHTML = '<p>No hay proveedores registrados.</p>'; return;
            }
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
                li.querySelector('.btn-editar-proveedor').addEventListener('click', handleEditarProveedorClick);
                li.querySelector('.btn-eliminar-proveedor').addEventListener('click', handleDeleteProveedorClick);
                ul.appendChild(li);
            });
            listaDeProveedores.appendChild(ul);
        } catch (error) {
            listaDeProveedores.innerHTML = `<p style="color:red;">Error al cargar proveedores: ${error.message}</p>`;
        }
    }

    async function cargarDireccionesCliente(clienteId) {
        if (!listaDireccionesCliente) return;
        listaDireccionesCliente.innerHTML = '<p>Cargando direcciones...</p>';
        try {
            const direcciones = await fetchData(`${API_URL}/api/clientes/${clienteId}/direcciones`);
            listaDireccionesCliente.innerHTML = ''; 
            if (!direcciones.length) {
                listaDireccionesCliente.innerHTML = '<p>Este cliente no tiene direcciones.</p>'; return;
            }
            const ul = document.createElement('ul');
            direcciones.forEach(dir => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="item-info">
                        <span>${dir.calle}</span>
                        <span>${dir.ciudad}, CP ${dir.codigo_postal}</span>
                    </div>
                `;
                ul.appendChild(li);
            });
            listaDireccionesCliente.appendChild(ul);
        } catch (error) {
            listaDireccionesCliente.innerHTML = `<p style="color:red;">Error al cargar direcciones: ${error.message}</p>`;
        }
    }

    // --- UI ---
    function mostrarSeccionDirecciones(clienteId, nombreCliente) {
        clienteSeleccionadoId = clienteId; 
        nombreClienteSeleccionadoSpan.textContent = nombreCliente; 
        idClienteDireccionInput.value = clienteId; 
        direccionesClienteDiv.style.display = 'block'; 
        cargarDireccionesCliente(clienteId); 
    }

    function mostrarModalEditarCliente(clienteId, nombre, telefono) {
        editClienteIdInput.value = clienteId;
        editNombreClienteInput.value = nombre;
        editTelefonoClienteInput.value = telefono || ''; 
        editClienteMensaje.textContent = ''; 
        modalEditarCliente.style.display = 'block'; 
    }

    function ocultarModalEditarCliente() {
        modalEditarCliente.style.display = 'none'; 
    }

    // --- Carrito ---
    function renderizarCarrito() { 
        carritoItemsDiv.innerHTML = ''; 
        let total = 0;
        if (carrito.length === 0) { 
            carritoItemsDiv.innerHTML = '<p>El carrito está vacío.</p>'; 
            btnFinalizarCompra.disabled = true; 
        } else {
            carrito.forEach(item => {
                const itemDiv = document.createElement('div'); 
                itemDiv.className = 'carrito-item'; 
                itemDiv.innerHTML = `<span>${item.nombre}</span><span>x${item.cantidad}</span><span>$${(item.precio * item.cantidad).toFixed(2)}</span><button class="btn-remove-carrito" data-id="${item.id_producto}">X</button>`;
                itemDiv.querySelector('.btn-remove-carrito').addEventListener('click', handleRemoveCarritoClick);
                carritoItemsDiv.appendChild(itemDiv); 
                total += item.precio * item.cantidad;
            });
            btnFinalizarCompra.disabled = false; 
        }
        carritoTotalSpan.textContent = total.toFixed(2); 
    }

    function handleAddCarritoClick(e) {
        const { id, nombre, precio } = e.target.dataset;
        const itemExistente = carrito.find(i => i.id_producto === parseInt(id));
        if (itemExistente) itemExistente.cantidad++;
        else carrito.push({ id_producto: parseInt(id), nombre, precio: parseFloat(precio), cantidad: 1 });
        renderizarCarrito();
    }

    function handleRemoveCarritoClick(e) {
        const id = parseInt(e.target.dataset.id);
        carrito = carrito.filter(i => i.id_producto !== id);
        renderizarCarrito();
    }

    // --- Eventos Clientes ---
    function handleVerDireccionesClick(e) {
        const b = e.target;
        mostrarSeccionDirecciones(parseInt(b.dataset.id), b.dataset.nombre);
    }

    function handleEditarClienteClick(e) {
        const b = e.target;
        mostrarModalEditarCliente(parseInt(b.dataset.id), b.dataset.nombre, b.dataset.telefono);
    }

    async function handleDeleteClienteClick(e) {
        const b = e.target;
        const id = parseInt(b.dataset.id);
        if (!confirm(`¿Eliminar cliente "${b.dataset.nombre}"?`)) return;
        try {
            await fetchData(`${API_URL}/api/clientes/${id}`, { method: 'DELETE' });
            mostrarMensaje(clienteMensaje, `Cliente eliminado con éxito.`, true);
            cargarClientes();
        } catch (err) {
            mostrarMensaje(clienteMensaje, `Error: ${err.message}`, false);
        }
    }

    async function handleEditarClienteSubmit(e) {
        e.preventDefault();
        const id = parseInt(editClienteIdInput.value);
        const nombre = editNombreClienteInput.value;
        const telefono = editTelefonoClienteInput.value || null; 
        const btn = formEditarCliente.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Guardando...';
        try {
            const actualizado = await fetchData(`${API_URL}/api/clientes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, telefono })
            });
            mostrarMensaje(editClienteMensaje, `Cliente "${actualizado.nombre}" actualizado.`, true);
            ocultarModalEditarCliente(); 
            cargarClientes(); 
        } catch (err) {
            mostrarMensaje(editClienteMensaje, `Error: ${err.message}`, false);
        } finally {
            btn.disabled = false; btn.textContent = 'Guardar Cambios';
        }
    }

    // --- Eventos Proveedores (añadidos) ---
    function handleEditarProveedorClick(event) {
        const b = event.target;
        const id = parseInt(b.dataset.id);
        const nombre = b.dataset.nombre;
        const telefono = b.dataset.telefono;
        alert(`Editar proveedor:\nID: ${id}\nNombre: ${nombre}\nTeléfono: ${telefono}`);
    }

    async function handleDeleteProveedorClick(event) {
        const b = event.target;
        const id = parseInt(b.dataset.id);
        const nombre = b.dataset.nombre;
        if (!confirm(`¿Eliminar proveedor "${nombre}"?`)) return;
        try {
            await fetchData(`${API_URL}/api/proveedores/${id}`, { method: 'DELETE' });
            mostrarMensaje(proveedorMensaje, `Proveedor "${nombre}" eliminado.`, true);
            cargarProveedores();
        } catch (err) {
            mostrarMensaje(proveedorMensaje, `Error al eliminar: ${err.message}`, false);
        }
    }

    // --- Formularios ---
    async function handleNuevoClienteSubmit(e) {
        e.preventDefault();
        const fd = new FormData(formNuevoCliente);
        const nombre = fd.get('nombre'); const telefono = fd.get('telefono') || null;
        const btn = formNuevoCliente.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Registrando...';
        try {
            const nuevo = await fetchData(`${API_URL}/api/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, telefono }),
            });
            mostrarMensaje(clienteMensaje, `Cliente "${nuevo.nombre}" registrado.`, true);
            formNuevoCliente.reset(); cargarClientes();
        } catch (err) {
            mostrarMensaje(clienteMensaje, `Error: ${err.message}`, false);
        } finally {
            btn.disabled = false; btn.textContent = 'Registrar Cliente';
        }
    }

    async function handleNuevoProveedorSubmit(e) {
        e.preventDefault();
        const fd = new FormData(formNuevoProveedor);
        const nombre = fd.get('nombre'); const telefono = fd.get('telefono') || null;
        const btn = formNuevoProveedor.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Registrando...';
        try {
            const nuevo = await fetchData(`${API_URL}/api/proveedores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, telefono }),
            });
            mostrarMensaje(proveedorMensaje, `Proveedor "${nuevo.nombre}" registrado.`, true);
            formNuevoProveedor.reset(); cargarProveedores();
        } catch (err) {
            mostrarMensaje(proveedorMensaje, `Error: ${err.message}`, false);
        } finally {
            btn.disabled = false; btn.textContent = 'Registrar Proveedor';
        }
    }

    async function handleNuevaDireccionSubmit(e) { 
        e.preventDefault(); 
        if (clienteSeleccionadoId === null) return;
        const fd = new FormData(formNuevaDireccion);
        const data = {
            calle: fd.get('calle'),
            ciudad: fd.get('ciudad'),
            codigo_postal: fd.get('codigo_postal'),
        };
        const btn = formNuevaDireccion.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Añadiendo...';
        try {
            await fetchData(`${API_URL}/api/clientes/${clienteSeleccionadoId}/direcciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            mostrarMensaje(direccionMensaje, `Dirección añadida.`, true);
            formNuevaDireccion.reset(); cargarDireccionesCliente(clienteSeleccionadoId);
        } catch (err) {
            mostrarMensaje(direccionMensaje, `Error: ${err.message}`, false);
        } finally {
            btn.disabled = false; btn.textContent = 'Añadir Dirección';
        }
    }

    async function handleFinalizarCompraClick() { 
        const idCliente = selectorCliente.value;
        if (!idCliente) return mostrarMensaje(compraMensaje, "Seleccione un cliente.", false);
        if (!carrito.length) return mostrarMensaje(compraMensaje, "El carrito está vacío.", false);
        const data = {
            id_cliente: parseInt(idCliente),
            detalles: carrito.map(p => ({ id_producto: p.id_producto, cantidad: p.cantidad })),
        };
        btnFinalizarCompra.disabled = true; btnFinalizarCompra.textContent = 'Procesando...';
        try {
            const venta = await fetchData(`${API_URL}/api/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            mostrarMensaje(compraMensaje, `Compra registrada con ID: ${venta.id_venta}`, true);
            carrito = []; renderizarCarrito();
        } catch (err) {
            mostrarMensaje(compraMensaje, `Error: ${err.message}`, false);
        } finally {
            btnFinalizarCompra.disabled = false; btnFinalizarCompra.textContent = 'Finalizar Compra';
        }
    }

    // --- Listeners ---
    if (formNuevoCliente) formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    if (formEditarCliente) formEditarCliente.addEventListener('submit', handleEditarClienteSubmit);
    if (cerrarModalClienteBtn) cerrarModalClienteBtn.addEventListener('click', ocultarModalEditarCliente);
    if (formNuevoProveedor) formNuevoProveedor.addEventListener('submit', handleNuevoProveedorSubmit);
    if (formNuevaDireccion) formNuevaDireccion.addEventListener('submit', handleNuevaDireccionSubmit);
    if (btnFinalizarCompra) btnFinalizarCompra.addEventListener('click', handleFinalizarCompraClick);

    // --- Inicialización ---
    cargarProductos();
    cargarClientes();
    cargarProveedores();
    renderizarCarrito();
});
