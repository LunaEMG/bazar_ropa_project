/**
 * @file app.js
 * @description Script principal para la interfaz del Bazar de Ropa.
 * Coordina los módulos y maneja CRUD de Productos, Clientes y Proveedores.
 */

// === ES6 Module Imports ===
import { API_URL } from './js/config.js';
import { showLoading, hideLoading, mostrarMensaje } from './js/ui.js';
import { fetchData } from './js/api.js';
import { initCartDOM, setGetUserRoleCallback, handleAddCarritoClick, renderizarCarrito, carrito } from './js/cart.js';
import { userRole, currentUserId, getUserRole, checkExistingToken, initAuthListeners } from './js/auth.js';
import { cargarHistorialVentas, cargarReporteBajoStock, cargarReporteVentasCliente, cargarMisCompras, initSalesListeners } from './js/sales.js';

// Espera a que el DOM esté completamente cargado.
document.addEventListener("DOMContentLoaded", () => {

    // --- Referencias a elementos clave del DOM ---
    const listaDeProductos = document.getElementById('productos-lista');
    const listaDeClientesContenedor = document.getElementById('clientes-lista-contenedor');
    
    // Formularios
    const formNuevoCliente = document.getElementById('form-nuevo-cliente');
    const formNuevoProveedor = document.getElementById('form-nuevo-proveedor');
    const formNuevaDireccion = document.getElementById('form-nueva-direccion');
    const formNuevoProducto = document.getElementById('form-nuevo-producto');
    const formEditarCliente = document.getElementById('form-editar-cliente');

    // Mensajes
    const clienteMensaje = document.getElementById('cliente-mensaje');
    const proveedorMensaje = document.getElementById('proveedor-mensaje');
    const direccionMensaje = document.getElementById('direccion-mensaje');
    const productoMensaje = document.getElementById('producto-mensaje');
    const editClienteMensaje = document.getElementById('edit-cliente-mensaje');

    // Elementos del Carrito (para inicializar módulo)
    const carritoItemsDiv = document.getElementById('carrito-items');
    const carritoTotalSpan = document.getElementById('carrito-total');
    const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');

    // Selectores y Listas
    const selectorCliente = document.getElementById('selector-cliente');
    const listaDeProveedores = document.getElementById('proveedores-lista');
    const direccionesClienteDiv = document.getElementById('direcciones-cliente');
    const listaDireccionesCliente = document.getElementById('lista-direcciones-cliente');
    
    // --- CORRECCIÓN: IDs coincidentes con index.html ---
    const selectorProveedorProducto = document.getElementById('producto-proveedor'); 
    const selectorTipoProducto = document.getElementById('producto-tipo');

    // Inputs y Modales
    const nombreClienteSeleccionadoSpan = document.getElementById('nombre-cliente-seleccionado');
    const idClienteDireccionInput = document.getElementById('id-cliente-direccion');
    const modalEditarCliente = document.getElementById('modal-editar-cliente');
    const editClienteIdInput = document.getElementById('edit-cliente-id');
    const editNombreClienteInput = document.getElementById('edit-nombre-cliente');
    const editTelefonoClienteInput = document.getElementById('edit-telefono-cliente');
    const cerrarModalClienteBtn = document.getElementById('cerrar-modal-cliente');
    const productoIdEditInput = document.getElementById('producto-id-edit');
    const btnCancelarEdicionProducto = document.getElementById('btn-cancelar-edicion-producto');

    // Contenedores de detalles de producto
    const detallesRopa = document.getElementById('detalles-ropa');
    const detallesCalzado = document.getElementById('detalles-calzado');
    const detallesAccesorios = document.getElementById('detalles-accesorios');

    // --- Estado Local ---
    /** Almacena el ID del cliente seleccionado para gestión de direcciones. */
    let clienteSeleccionadoId = null;


    // --- Funciones de Carga y Renderizado (Productos, Clientes, Proveedores) ---

    /** Carga y muestra la lista de productos. */
    async function cargarProductos() {
        if (!listaDeProductos) return;
        listaDeProductos.innerHTML = '<p>Cargando productos...</p>';
        try {
            const productos = await fetchData('/api/productos');
            listaDeProductos.innerHTML = '';

            if (!productos || productos.length === 0) {
                listaDeProductos.innerHTML = '<p>No hay productos disponibles.</p>'; return;
            }

            const esAdmin = (userRole === 'admin');

            productos.forEach(producto => {
                const item = document.createElement('div');
                item.className = 'producto-item';

                let detallesHTML = '';
                if (producto.detalles_subtipo) {
                    const d = producto.detalles_subtipo;
                    if (producto.tipo_producto === 'ropa') {
                        detallesHTML = `<p style="font-size:0.85em; color:#666;">
                                    Talla: <b>${d.talla}</b> | Material: ${d.material} ${d.tipo_corte ? '| Corte: ' + d.tipo_corte : ''}
                                </p>`;
                    } else if (producto.tipo_producto === 'calzado') {
                        detallesHTML = `<p style="font-size:0.85em; color:#666;">
                                    Talla: <b>${d.talla_numerica}</b> | Suela: ${d.material_suela}
                                </p>`;
                    } else if (producto.tipo_producto === 'accesorios') {
                        detallesHTML = `<p style="font-size:0.85em; color:#666;">
                                    Material: ${d.material} ${d.dimensiones ? '| Dim: ' + d.dimensiones : ''}
                                </p>`;
                    }
                }

                let botonesAdminHTML = '';
                if (esAdmin) {
                    botonesAdminHTML = `
                        <button class="btn-accion btn-editar-producto btn-editar" data-id="${producto.id_producto}">Editar</button>
                        <button class="btn-accion btn-eliminar-producto btn-eliminar" data-id="${producto.id_producto}" data-nombre="${producto.nombre}">Eliminar</button>
                    `;
                }

                item.innerHTML = `
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion || 'Sin descripción'}</p>
                    ${detallesHTML}
                    <p style="font-size: 0.9em; color: #555; margin-bottom: 10px;">
                        Disponibles: <strong>${producto.cantidad_stock}</strong>
                    </p>
                    <p class="precio">$${producto.precio.toFixed(2)}</p>
                    
                    <div class="producto-acciones">
                        <button class="btn-accion btn-add-carrito" 
                            data-id="${producto.id_producto}" 
                            data-nombre="${producto.nombre}" 
                            data-precio="${producto.precio}">
                            Añadir
                        </button>
                        ${botonesAdminHTML}
                    </div>
                `;

                // Listener Añadir
                item.querySelector('.btn-add-carrito').addEventListener('click', handleAddCarritoClick);

                if (esAdmin) {
                    // Usamos ?. por seguridad si el elemento no existe
                    item.querySelector('.btn-editar-producto')?.addEventListener('click', () => handleEditarProductoClick(producto.id_producto));
                    item.querySelector('.btn-eliminar-producto')?.addEventListener('click', handleDeleteProductoClick);
                }

                listaDeProductos.appendChild(item);
            });
        } catch (error) {
            listaDeProductos.innerHTML = `<p style="color: red;">Error al cargar productos: ${error.message}</p>`;
        }
    }

    /** Carga clientes y llena el selector */
    async function cargarClientes() {
        if (!listaDeClientesContenedor || !selectorCliente) return;
        listaDeClientesContenedor.innerHTML = '<p>Cargando clientes...</p>';
        selectorCliente.innerHTML = '<option value="">Seleccione un cliente...</option>';
        try {
            const clientes = await fetchData('/api/clientes');
            listaDeClientesContenedor.innerHTML = '';
            if (!clientes || clientes.length === 0) { 
                listaDeClientesContenedor.innerHTML = '<p>No hay clientes registrados.</p>'; 
                return; 
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
                option.value = cliente.id_cliente; 
                option.textContent = cliente.nombre;
                selectorCliente.appendChild(option);
            });
            listaDeClientesContenedor.appendChild(ul);
        } catch (error) {
            listaDeClientesContenedor.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    /** Carga proveedores */
    async function cargarProveedores() {
        // Verifica si existen los elementos en el DOM
        if (!listaDeProveedores || !selectorProveedorProducto) return;
        
        listaDeProveedores.innerHTML = '<p>Cargando proveedores...</p>';
        selectorProveedorProducto.innerHTML = '<option value="">Seleccione un proveedor...</option>';

        try {
            const proveedores = await fetchData('/api/proveedores');
            listaDeProveedores.innerHTML = '';
            if (!proveedores || proveedores.length === 0) {
                listaDeProveedores.innerHTML = '<p>No hay proveedores.</p>';
                selectorProveedorProducto.innerHTML = '<option value="">No hay proveedores</option>';
                return;
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

                const option = document.createElement('option');
                option.value = proveedor.id_proveedor;
                option.textContent = proveedor.nombre;
                selectorProveedorProducto.appendChild(option);
            });
            listaDeProveedores.appendChild(ul);
        } catch (error) {
            listaDeProveedores.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            selectorProveedorProducto.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    /** Carga direcciones de un cliente */
    async function cargarDireccionesCliente(clienteId) {
        if (!listaDireccionesCliente) return;
        listaDireccionesCliente.innerHTML = '<p>Cargando direcciones...</p>';
        try {
            const direcciones = await fetchData(`/api/clientes/${clienteId}/direcciones`);
            listaDireccionesCliente.innerHTML = '';
            if (!direcciones || direcciones.length === 0) { 
                listaDireccionesCliente.innerHTML = '<p>Sin direcciones registradas.</p>'; 
                return; 
            }
            const ul = document.createElement('ul');
            direcciones.forEach(dir => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="item-info">
                        <span>${dir.calle}</span>
                        <span>${dir.ciudad}, CP ${dir.codigo_postal}</span>
                    </div>
                    <div class="item-acciones">
                        <button class="btn-accion btn-editar-direccion btn-editar" 
                            data-id-dir="${dir.id_direccion}" 
                            data-calle="${dir.calle}"
                            data-ciudad="${dir.ciudad}"
                            data-cp="${dir.codigo_postal}">Editar</button>
                        <button class="btn-accion btn-eliminar-direccion btn-eliminar" 
                            data-id-dir="${dir.id_direccion}" 
                            data-id-cli="${dir.id_cliente}">Eliminar</button>
                    </div>
                `;
                li.querySelector('.btn-editar-direccion').addEventListener('click', handleEditarDireccionClick);
                li.querySelector('.btn-eliminar-direccion').addEventListener('click', handleDeleteDireccionClick);
                ul.appendChild(li);
            });
            listaDireccionesCliente.appendChild(ul);
        } catch (error) {
            listaDireccionesCliente.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    // --- Funciones de Lógica de UI y Formularios ---

    function mostrarSeccionDirecciones(clienteId, nombreCliente) {
        if (!direccionesClienteDiv) return;
        clienteSeleccionadoId = clienteId;
        nombreClienteSeleccionadoSpan.textContent = nombreCliente;
        idClienteDireccionInput.value = clienteId;
        direccionesClienteDiv.style.display = 'block';
        resetFormularioDireccion();
        cargarDireccionesCliente(clienteId);
    }

    function mostrarModalEditarCliente(clienteId, nombre, telefono) {
        editClienteIdInput.value = clienteId;
        editNombreClienteInput.value = nombre;
        editTelefonoClienteInput.value = telefono || '';
        editClienteMensaje.textContent = 'Editando Cliente';
        
        const modalTitle = modalEditarCliente.querySelector('h3');
        if (modalTitle) modalTitle.textContent = "Editar Cliente";
        formEditarCliente.setAttribute('data-target-entity', 'cliente');
        
        modalEditarCliente.style.display = 'block';
    }

    function mostrarModalEditarProveedor(proveedorId, nombre, telefono) {
        editClienteIdInput.value = proveedorId;
        editNombreClienteInput.value = nombre;
        editTelefonoClienteInput.value = telefono || '';
        editClienteMensaje.textContent = 'Editando Proveedor';

        const modalTitle = modalEditarCliente.querySelector('h3');
        if (modalTitle) modalTitle.textContent = "Editar Proveedor";
        formEditarCliente.setAttribute('data-target-entity', 'proveedor');

        modalEditarCliente.style.display = 'block';
    }

    function ocultarModalEditarCliente() {
        if (modalEditarCliente) modalEditarCliente.style.display = 'none';
    }

    function handleTipoProductoChange() {
        if (detallesRopa) detallesRopa.style.display = 'none';
        if (detallesCalzado) detallesCalzado.style.display = 'none';
        if (detallesAccesorios) detallesAccesorios.style.display = 'none';
        document.querySelectorAll('.detalles-subtipo input').forEach(input => input.required = false);

        if (!selectorTipoProducto) return;
        const tipo = selectorTipoProducto.value;

        if (tipo === 'ropa') {
            detallesRopa.style.display = 'block';
            document.querySelector('#ropa-material').required = true;
            document.querySelector('#ropa-talla').required = true;
        } else if (tipo === 'calzado') {
            detallesCalzado.style.display = 'block';
            document.querySelector('#calzado-talla').required = true;
            document.querySelector('#calzado-suela').required = true;
        } else if (tipo === 'accesorios') {
            detallesAccesorios.style.display = 'block';
            document.querySelector('#accesorio-material').required = true;
        }
    }

    async function handleEditarProductoClick(productoId) {
        try {
            const producto = await fetchData(`/api/productos/${productoId}`);
            if (!producto) throw new Error("No se pudieron cargar los datos.");

            // Cargar datos en el formulario
            productoIdEditInput.value = producto.id_producto;
            
            // --- CORRECCIÓN DE IDs: Usar los nombres que coinciden con index.html ---
            document.getElementById('nombre-producto').value = producto.nombre;
            document.getElementById('descripcion-producto').value = producto.descripcion || '';
            document.getElementById('precio-producto').value = producto.precio;
            document.getElementById('stock-producto').value = producto.cantidad_stock;
            selectorProveedorProducto.value = producto.id_proveedor;

            // Configurar tipo y detalles
            formNuevoProducto.setAttribute('data-editing-type', producto.tipo_producto);
            selectorTipoProducto.value = producto.tipo_producto;
            handleTipoProductoChange();
            selectorTipoProducto.disabled = true;

            if (producto.detalles_subtipo) {
                const d = producto.detalles_subtipo;
                if (producto.tipo_producto === 'ropa') {
                    document.getElementById('ropa-material').value = d.material;
                    document.getElementById('ropa-talla').value = d.talla;
                    document.getElementById('ropa-corte').value = d.tipo_corte || '';
                } else if (producto.tipo_producto === 'calzado') {
                    document.getElementById('calzado-talla').value = d.talla_numerica;
                    document.getElementById('calzado-suela').value = d.material_suela;
                } else if (producto.tipo_producto === 'accesorios') {
                    document.getElementById('accesorio-material').value = d.material;
                    document.getElementById('accesorio-dimensiones').value = d.dimensiones || '';
                }
            }

            formNuevoProducto.closest('section').querySelector('h2').textContent = "Editar Producto";
            formNuevoProducto.querySelector('button[type="submit"]').textContent = "Actualizar Producto";
            btnCancelarEdicionProducto.style.display = 'inline-block';
            formNuevoProducto.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            mostrarMensaje(productoMensaje, `Error: ${error.message}`, false);
        }
    }

    function resetFormularioProducto() {
        productoIdEditInput.value = '';
        formNuevoProducto.removeAttribute('data-editing-type');
        formNuevoProducto.reset();
        handleTipoProductoChange();
        selectorTipoProducto.disabled = false;
        formNuevoProducto.closest('section').querySelector('h2').textContent = "Registrar Nuevo Producto";
        formNuevoProducto.querySelector('button[type="submit"]').textContent = "Registrar Producto";
        btnCancelarEdicionProducto.style.display = 'none';
    }

    function resetFormularioDireccion() {
        document.getElementById('id-direccion-edit').value = '';
        formNuevaDireccion.reset();
        if (clienteSeleccionadoId) document.getElementById('id-cliente-direccion').value = clienteSeleccionadoId;
        formNuevaDireccion.parentElement.querySelector('h4').textContent = "Añadir Nueva Dirección";
        formNuevaDireccion.querySelector('button[type="submit"]').textContent = "Añadir Dirección";
        document.getElementById('btn-cancelar-edicion-direccion').style.display = 'none';
    }

    async function handleNuevoProductoSubmit(event) {
        event.preventDefault();
        if (!formNuevoProducto) return;

        const editId = productoIdEditInput.value ? parseInt(productoIdEditInput.value) : null;
        const isEditMode = editId !== null;
        let tipoProducto = formNuevoProducto.getAttribute('data-editing-type') || selectorTipoProducto.value;

        // --- CORRECCIÓN DE IDs: Usar los nombres correctos del HTML ---
        const payload = {
            nombre: document.getElementById('nombre-producto').value,
            descripcion: document.getElementById('descripcion-producto').value || null,
            precio: parseFloat(document.getElementById('precio-producto').value),
            cantidad_stock: parseInt(document.getElementById('stock-producto').value),
            id_proveedor: parseInt(selectorProveedorProducto.value),
            tipo_producto: tipoProducto,
            detalles_subtipo: {}
        };

        try {
            if (tipoProducto === 'ropa') {
                payload.detalles_subtipo = {
                    material: document.getElementById('ropa-material').value,
                    talla: document.getElementById('ropa-talla').value,
                    tipo_corte: document.getElementById('ropa-corte').value || null
                };
            } else if (tipoProducto === 'calzado') {
                payload.detalles_subtipo = {
                    talla_numerica: parseFloat(document.getElementById('calzado-talla').value),
                    material_suela: document.getElementById('calzado-suela').value
                };
            } else if (tipoProducto === 'accesorios') {
                payload.detalles_subtipo = {
                    material: document.getElementById('accesorio-material').value,
                    dimensiones: document.getElementById('accesorio-dimensiones').value || null
                };
            }
        } catch (e) {
            mostrarMensaje(productoMensaje, "Error leyendo formulario", false);
            return;
        }

        const submitButton = formNuevoProducto.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        
        const method = isEditMode ? 'PUT' : 'POST';
        const endpoint = isEditMode ? `/api/productos/${editId}` : `/api/productos`;

        try {
            await fetchData(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            mostrarMensaje(productoMensaje, isEditMode ? "Producto actualizado!" : "Producto registrado!", true);
            resetFormularioProducto();
            cargarProductos();
        } catch (error) {
            mostrarMensaje(productoMensaje, `Error: ${error.message}`, false);
        } finally {
            submitButton.disabled = false;
        }
    }

    // --- Manejadores de Eventos (Clicks) ---

    function handleVerDireccionesClick(event) {
        const button = event.target;
        mostrarSeccionDirecciones(parseInt(button.dataset.id), button.dataset.nombre);
    }

    function handleEditarClienteClick(event) {
        const btn = event.target;
        mostrarModalEditarCliente(parseInt(btn.dataset.id), btn.dataset.nombre, btn.dataset.telefono);
    }

    function handleEditarProveedorClick(event) {
        const btn = event.target;
        mostrarModalEditarProveedor(parseInt(btn.dataset.id), btn.dataset.nombre, btn.dataset.telefono);
    }

    function handleEditarDireccionClick(event) {
        const btn = event.target;
        document.getElementById('id-direccion-edit').value = btn.dataset.idDir;
        document.getElementById('calle-direccion').value = btn.dataset.calle;
        document.getElementById('ciudad-direccion').value = btn.dataset.ciudad;
        document.getElementById('cp-direccion').value = btn.dataset.cp;

        formNuevaDireccion.parentElement.querySelector('h4').textContent = "Editar Dirección";
        formNuevaDireccion.querySelector('button[type="submit"]').textContent = "Actualizar Dirección";
        document.getElementById('btn-cancelar-edicion-direccion').style.display = 'inline-block';
    }

    async function handleDeleteClienteClick(event) {
        const btn = event.target;
        if (!confirm(`¿Eliminar cliente "${btn.dataset.nombre}"?`)) return;
        try {
            await fetchData(`/api/clientes/${btn.dataset.id}`, { method: 'DELETE' });
            mostrarMensaje(clienteMensaje, "Cliente eliminado.", true);
            cargarClientes();
            if (clienteSeleccionadoId === parseInt(btn.dataset.id)) direccionesClienteDiv.style.display = 'none';
        } catch (error) {
            mostrarMensaje(clienteMensaje, `Error: ${error.message}`, false);
        }
    }

    async function handleDeleteDireccionClick(event) {
        const btn = event.target;
        if (!confirm("¿Eliminar dirección?")) return;
        try {
            await fetchData(`/api/clientes/${btn.dataset.idCli}/direcciones/${btn.dataset.idDir}`, { method: 'DELETE' });
            mostrarMensaje(direccionMensaje, "Dirección eliminada.", true);
            cargarDireccionesCliente(btn.dataset.idCli);
        } catch (error) {
            mostrarMensaje(direccionMensaje, `Error: ${error.message}`, false);
        }
    }

    async function handleDeleteProveedorClick(event) {
        const btn = event.target;
        if (!confirm(`¿Eliminar proveedor "${btn.dataset.nombre}"?`)) return;
        try {
            await fetchData(`/api/proveedores/${btn.dataset.id}`, { method: 'DELETE' });
            mostrarMensaje(proveedorMensaje, "Proveedor eliminado.", true);
            cargarProveedores();
            cargarProductos();
        } catch (error) {
            mostrarMensaje(proveedorMensaje, `Error: ${error.message}`, false);
        }
    }

    async function handleDeleteProductoClick(event) {
        const btn = event.target;
        if (!confirm(`¿Eliminar producto "${btn.dataset.nombre}"?`)) return;
        try {
            await fetchData(`/api/productos/${btn.dataset.id}`, { method: 'DELETE' });
            mostrarMensaje(productoMensaje, "Producto eliminado.", true);
            cargarProductos();
        } catch (error) {
            mostrarMensaje(productoMensaje, `Error: ${error.message}`, false);
        }
    }

    async function handleEditarSubmit(event) {
        event.preventDefault();
        const entityType = formEditarCliente.getAttribute('data-target-entity');
        const id = parseInt(editClienteIdInput.value);
        const payload = {
            nombre: editNombreClienteInput.value,
            telefono: editTelefonoClienteInput.value || null
        };

        const endpoint = entityType === 'proveedor' ? `/api/proveedores/${id}` : `/api/clientes/${id}`;
        
        try {
            const res = await fetchData(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (entityType === 'cliente') {
                mostrarMensaje(clienteMensaje, `Cliente "${res.nombre}" actualizado`, true);
                cargarClientes();
            } else {
                mostrarMensaje(proveedorMensaje, `Proveedor "${res.nombre}" actualizado`, true);
                cargarProveedores();
            }
            ocultarModalEditarCliente();
        } catch (error) {
            mostrarMensaje(editClienteMensaje, `Error: ${error.message}`, false);
        }
    }

    async function handleNuevoClienteSubmit(event) {
        event.preventDefault();
        const formData = new FormData(formNuevoCliente);
        try {
            await fetchData('/api/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });
            mostrarMensaje(clienteMensaje, "Cliente registrado", true);
            formNuevoCliente.reset();
            cargarClientes();
        } catch (error) {
            mostrarMensaje(clienteMensaje, `Error: ${error.message}`, false);
        }
    }

    async function handleNuevoProveedorSubmit(event) {
        event.preventDefault();
        const formData = new FormData(formNuevoProveedor);
        try {
            await fetchData('/api/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });
            mostrarMensaje(proveedorMensaje, "Proveedor registrado", true);
            formNuevoProveedor.reset();
            cargarProveedores();
        } catch (error) {
            mostrarMensaje(proveedorMensaje, `Error: ${error.message}`, false);
        }
    }

    async function handleNuevaDireccionSubmit(event) {
        event.preventDefault();
        const idEdit = document.getElementById('id-direccion-edit').value;
        const isEdit = idEdit !== '';
        
        let targetClientId = userRole === 'admin' ? clienteSeleccionadoId : currentUserId;
        if (!targetClientId) return;

        const formData = new FormData(formNuevaDireccion);
        const payload = {
            calle: formData.get('calle'),
            ciudad: formData.get('ciudad'),
            codigo_postal: formData.get('codigo_postal')
        };

        const endpoint = isEdit 
            ? `/api/clientes/${targetClientId}/direcciones/${idEdit}` 
            : `/api/clientes/${targetClientId}/direcciones`;

        try {
            await fetchData(endpoint, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            mostrarMensaje(direccionMensaje, isEdit ? "Dirección actualizada" : "Dirección añadida", true);
            resetFormularioDireccion();
            cargarDireccionesCliente(targetClientId);
        } catch (error) {
            mostrarMensaje(direccionMensaje, `Error: ${error.message}`, false);
        }
    }

    /**
     * Actualiza la UI basado en el rol.
     * Esta función es llamada por auth.js después del login.
     */
    async function actualizarUIPorRol() {
        const esAdmin = userRole === 'admin';
        const esUsuario = userRole === 'usuario';
        const esVisualizacion = userRole === 'visualizacion';

        // Botones Auth
        document.getElementById('btn-mostrar-login').style.display = esVisualizacion ? 'inline-block' : 'none';
        document.getElementById('btn-mostrar-registro').style.display = esVisualizacion ? 'inline-block' : 'none';
        document.getElementById('btn-logout').style.display = esVisualizacion ? 'none' : 'inline-block';

        // Secciones Admin
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'block' : 'none');

        // Saludo y datos
        const saludoSpan = document.getElementById('saludo-usuario');
        selectorCliente.style.display = 'none';

        if (esAdmin) {
            saludoSpan.textContent = 'Modo Administrador';
            selectorCliente.style.display = 'block';
            cargarClientes();
            cargarProveedores();
            cargarHistorialVentas();
            cargarReporteBajoStock();
            cargarReporteVentasCliente();
        } else if (esUsuario) {
            saludoSpan.textContent = `¡Hola, usuario!`;
            document.getElementById('seccion-mis-direcciones').style.display = 'block';
            document.getElementById('nombre-cliente-seleccionado').textContent = "tus direcciones";
            if (currentUserId) {
                document.getElementById('id-cliente-direccion').value = currentUserId;
                cargarDireccionesCliente(currentUserId);
            }
            document.getElementById('seccion-mis-compras').style.display = 'block';
            cargarMisCompras();
        } else {
            saludoSpan.textContent = 'Modo Visitante';
            document.getElementById('seccion-mis-direcciones').style.display = 'none';
            document.getElementById('seccion-mis-compras').style.display = 'none';
        }

        // Carga productos para todos
        cargarProductos();

        // Botón Carrito
        if (esVisualizacion) {
            btnFinalizarCompra.textContent = "Iniciar sesión para comprar";
            btnFinalizarCompra.disabled = false;
        } else {
            btnFinalizarCompra.textContent = "Finalizar Compra";
            btnFinalizarCompra.disabled = carrito.length === 0;
        }
        renderizarCarrito();
    }


    // --- Inicialización y Listeners ---

    if (formNuevoCliente) formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    if (formNuevoProveedor) formNuevoProveedor.addEventListener('submit', handleNuevoProveedorSubmit);
    if (formNuevaDireccion) formNuevaDireccion.addEventListener('submit', handleNuevaDireccionSubmit);
    
    if (selectorTipoProducto) selectorTipoProducto.addEventListener('change', handleTipoProductoChange);
    if (formNuevoProducto) formNuevoProducto.addEventListener('submit', handleNuevoProductoSubmit);
    if (btnCancelarEdicionProducto) btnCancelarEdicionProducto.addEventListener('click', resetFormularioProducto);
    if (document.getElementById('btn-cancelar-edicion-direccion')) {
        document.getElementById('btn-cancelar-edicion-direccion').addEventListener('click', resetFormularioDireccion);
    }

    if (formEditarCliente) formEditarCliente.addEventListener('submit', handleEditarSubmit);
    if (cerrarModalClienteBtn) cerrarModalClienteBtn.addEventListener('click', ocultarModalEditarCliente);
    if (modalEditarCliente) {
        modalEditarCliente.addEventListener('click', (e) => {
            if (e.target === modalEditarCliente) ocultarModalEditarCliente();
        });
    }

    // === Inicializar Módulos Externos ===
    
    // 1. Inicializar Cart
    initCartDOM({ carritoItemsDiv, carritoTotalSpan, btnFinalizarCompra });
    
    // 2. Configurar Auth Callback
    setGetUserRoleCallback(getUserRole);

    // 3. Configurar Callbacks Globales (IMPORTANTE: Hacer esto ANTES de initAuthListeners)
    window.actualizarUIPorRolCallback = actualizarUIPorRol;
    window.currentUserId = currentUserId;

    // 4. Verificar Sesión
    checkExistingToken();

    // 5. Inicializar Listeners de Auth (Login, Registro, Logout)
    initAuthListeners();

    // 6. Inicializar Listeners de Sales (Finalizar Compra)
    initSalesListeners();

    // 7. Render inicial
    actualizarUIPorRol();

});