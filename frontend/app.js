/**
 * @file app.js
 * @description Script principal para la interfaz del Bazar de Ropa.
 * Maneja la carga de datos, interacciones del carrito,
 * y operaciones CRUD para clientes, proveedores, direcciones y ventas.
 */

// === ES6 Module Imports ===
import { API_URL } from './js/config.js';
import { showLoading, hideLoading, setButtonLoading, mostrarMensaje } from './js/ui.js';
import { fetchData } from './js/api.js';
import { carrito, renderizarCarrito, handleAddCarritoClick, clearCarrito, initCartDOM, setGetUserRoleCallback } from './js/cart.js';
import { userRole, currentUserId, getUserRole, checkExistingToken, initAuthListeners } from './js/auth.js';
import { cargarHistorialVentas, cargarReporteBajoStock, cargarReporteVentasCliente, cargarMisCompras, initSalesListeners } from './js/sales.js';

// Espera a que el DOM estÈ completamente cargado.
document.addEventListener("DOMContentLoaded", () => {

    // --- ConfiguraciÛn ---
    /*
     * NOTA: API_URL ahora se importa desde ./js/config.js
     * Las funciones de UI, Auth, Cart y Sales tambiÈn se importan de sus mÛdulos respectivos
     */

    // Inicializar mÛdulos al cargar

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
    const historialVentasLista = document.getElementById('historial-ventas-lista');
    const productoIdEditInput = document.getElementById('producto-id-edit');
    const btnCancelarEdicionProducto = document.getElementById('btn-cancelar-edicion-producto');


    // --- NUEVAS REFERENCIAS PARA FORMULARIO DE PRODUCTOS ---
    const formNuevoProducto = document.getElementById('form-nuevo-producto');
    const productoMensaje = document.getElementById('producto-mensaje');
    const selectorProveedorProducto = document.getElementById('producto-proveedor');
    const selectorTipoProducto = document.getElementById('producto-tipo');

    // Contenedores de detalles
    const detallesRopa = document.getElementById('detalles-ropa');
    const detallesCalzado = document.getElementById('detalles-calzado');
    const detallesAccesorios = document.getElementById('detalles-accesorios');

    // --- Estado de la AplicaciÛn ---
    /** Almacena los items del carrito: { id_producto, nombre, precio, cantidad } */
    let carrito = [];
    /** Almacena el ID del cliente seleccionado para gestiÛn de direcciones. */
    let clienteSeleccionadoId = null;


    // --- Funciones Auxiliares ---

    /** Muestra un mensaje temporal (Èxito/error) en un elemento DOM. */
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

    /** Realiza una peticiÛn fetch genÈrica con manejo de errores b·sico. */
    async function fetchData(url, options = {}) {

        const token = localStorage.getItem('authToken');

        // Si tenemos un token, lo aÒadimos a la cabecera 'Authorization'
        if (token) {
            if (!options.headers) {
                options.headers = {};
            }
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                console.warn("Acceso no autorizado. Cerrando sesiÛn...");
                handleLogout();
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
            console.error(`Error en fetch a ${url}:`, error);
            throw error;
        }
    }

    // --- Funciones de Carga y Renderizado ---

    /**
     * @function cargarProductos
     * @description Carga y muestra la lista de productos (ACTUALIZADO CON ROLES).
     * - Rol VisualizaciÛn: Ve botones "AÒadir" deshabilitados.
     * - Rol Usuario: Ve botones "AÒadir" habilitados.
     * - Rol Admin: Ve botones "AÒadir", "Editar" y "Eliminar" habilitados.
     */
    async function cargarProductos() {
        if (!listaDeProductos) return;
        listaDeProductos.innerHTML = '<p>Cargando productos...</p>';
        try {
            const productos = await fetchData(`${API_URL}/api/productos`);
            listaDeProductos.innerHTML = '';

            if (!productos || productos.length === 0) {
                listaDeProductos.innerHTML = '<p>No hay productos disponibles.</p>'; return;
            }

            // Asumimos que 'userRole' es una variable global 
            const esAdmin = (userRole === 'admin');
            const esUsuario = (userRole === 'usuario');
            const esVisualizacion = (userRole === 'visualizacion');

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

                // 1. Botones de Admin (Editar/Eliminar)
                let botonesAdminHTML = '';
                if (esAdmin) {
                    botonesAdminHTML = `
                                <button class="btn-accion btn-editar-producto btn-editar" data-id="${producto.id_producto}">Editar</button>
                                <button class="btn-accion btn-eliminar-producto btn-eliminar" data-id="${producto.id_producto}" data-nombre="${producto.nombre}">Eliminar</button>
                            `;
                }

                // 2. BotÛn de AÒadir al Carrito
                const deshabilitado = esVisualizacion ? 'disabled' : '';

                // 3. Montaje del HTML
                item.innerHTML = `
                            <h3>${producto.nombre}</h3>
                            <p>${producto.descripcion || 'Sin descripciÛn'}</p>
                            
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
                                    AÒadir
                                </button>
                                ${botonesAdminHTML}
                            </div>
                        `;

                // Listener AÒadir
                item.querySelector('.btn-add-carrito').addEventListener('click', handleAddCarritoClick);

                // Listeners de Admin
                if (esAdmin) {
                    const editButton = item.querySelector('.btn-editar-producto');
                    if (editButton) {
                        editButton.addEventListener('click', () => handleEditarProductoClick(producto.id_producto));
                    }

                    const deleteButton = item.querySelector('.btn-eliminar-producto');
                    if (deleteButton) {
                        deleteButton.addEventListener('click', handleDeleteProductoClick);
                    }
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
                        <span>${cliente.telefono || 'Sin telÈfono'}</span>
                    </div>
                    <div class="item-acciones">
                        <button class="btn-accion btn-ver-direcciones" data-id="${cliente.id_cliente}" data-nombre="${cliente.nombre}">Direcciones</button>
                        <button class="btn-accion btn-editar-cliente" data-id="${cliente.id_cliente}" data-nombre="${cliente.nombre}" data-telefono="${cliente.telefono || ''}">Editar</button>
                        <button class="btn-accion btn-eliminar-cliente" data-id="${cliente.id_cliente}" data-nombre="${cliente.nombre}">Eliminar</button>
                    </div>
                `;
                // AsignaciÛn de Listeners de Clientes
                li.querySelector('.btn-ver-direcciones').addEventListener('click', handleVerDireccionesClick);
                li.querySelector('.btn-editar-cliente').addEventListener('click', handleEditarClienteClick);
                li.querySelector('.btn-eliminar-cliente').addEventListener('click', handleDeleteClienteClick);
                ul.appendChild(li);

                // AÒadir al selector
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
        // AÒade el selector del formulario de productos a la comprobaciÛn
        if (!listaDeProveedores || !selectorProveedorProducto) return;

        listaDeProveedores.innerHTML = '<p>Cargando proveedores...</p>';

        // --- MODIFICADO: Limpia el selector del formulario de productos ---
        selectorProveedorProducto.innerHTML = '<option value="">Seleccione un proveedor...</option>';

        try {
            const proveedores = await fetchData(`${API_URL}/api/proveedores`);
            listaDeProveedores.innerHTML = '';
            if (!proveedores || proveedores.length === 0) {
                listaDeProveedores.innerHTML = '<p>No hay proveedores registrados.</p>';
                // Aseg˙rate de que el selector tambiÈn lo refleje
                selectorProveedorProducto.innerHTML = '<option value="">No hay proveedores</option>';
                return;
            }

            const ul = document.createElement('ul');
            proveedores.forEach(proveedor => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="item-info">
                        <span>${proveedor.nombre}</span> 
                        <span>${proveedor.telefono || 'Sin telÈfono'}</span>
                    </div>
                    <div class="item-acciones">
                         <button class="btn-accion btn-editar-proveedor" data-id="${proveedor.id_proveedor}" data-nombre="${proveedor.nombre}" data-telefono="${proveedor.telefono || ''}">Editar</button>
                         <button class="btn-accion btn-eliminar-proveedor" data-id="${proveedor.id_proveedor}" data-nombre="${proveedor.nombre}">Eliminar</button>
                    </div>
                `;
                // --- ASIGNACI√ìN DE LISTENERS DE PROVEEDORES (CORRECCI√ìN) ---
                li.querySelector('.btn-editar-proveedor').addEventListener('click', handleEditarProveedorClick);
                li.querySelector('.btn-eliminar-proveedor').addEventListener('click', handleDeleteProveedorClick);

                ul.appendChild(li);

                // --- MODIFICADO: AÒadir al selector del formulario de productos ---
                const option = document.createElement('option');
                option.value = proveedor.id_proveedor;
                option.textContent = proveedor.nombre;
                selectorProveedorProducto.appendChild(option);
            });
            listaDeProveedores.appendChild(ul);
        } catch (error) {
            listaDeProveedores.innerHTML = `<p style="color: red;">Error al cargar proveedores: ${error.message}</p>`;
            // --- MODIFICADO: Mostrar error en el selector ---
            selectorProveedorProducto.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    /** Carga y muestra las direcciones de un cliente especÌfico. */
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
                        <button class="btn-accion btn-editar-direccion btn-editar" 
                            data-id-dir="${dir.id_direccion}" 
                            data-calle="${dir.calle}"
                            data-ciudad="${dir.ciudad}"
                            data-cp="${dir.codigo_postal}"
                        >Editar</button>
                        <button class="btn-accion btn-eliminar-direccion btn-eliminar" 
                            data-id-dir="${dir.id_direccion}" 
                            data-id-cli="${dir.id_cliente}"
                        >Eliminar</button>
                    </div>
                `;

                // AÒadir listeners para los nuevos botones
                li.querySelector('.btn-editar-direccion').addEventListener('click', handleEditarDireccionClick);
                li.querySelector('.btn-eliminar-direccion').addEventListener('click', handleDeleteDireccionClick);

                ul.appendChild(li);
            });
            listaDireccionesCliente.appendChild(ul);
        } catch (error) {
            listaDireccionesCliente.innerHTML = `<p style="color: red;">Error al cargar direcciones: ${error.message}</p>`;
        }
    }

    /** Carga y muestra el historial de ventas. */
    async function cargarHistorialVentas() {
        if (!historialVentasLista) return;
        historialVentasLista.innerHTML = '<p>Cargando historial de ventas...</p>';

        try {
            // Llama al endpoint GET /api/ventas
            const ventas = await fetchData(`${API_URL}/api/ventas`);
            historialVentasLista.innerHTML = '';

            if (!ventas || ventas.length === 0) {
                historialVentasLista.innerHTML = '<p>No hay ventas registradas.</p>';
                return;
            }

            const ul = document.createElement('ul');
            // Itera sobre las ventas (vienen ordenadas por fecha desde el backend)
            ventas.forEach(venta => {
                const li = document.createElement('li');
                li.className = 'venta-item'; // (AÒadiremos este estilo en CSS)

                const nombreClienteMostrado = venta.nombre_cliente
                    ? `<strong>${venta.nombre_cliente}</strong> (ID: ${venta.id_cliente})`
                    : '<strong>(Cliente Eliminado)</strong>';

                // Formatea la fecha para que sea m·s legible
                const fechaFormateada = new Date(venta.fecha).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                // Header de la venta
                let ventaHTML = `
                    <div class="venta-header">
                        <span><strong>Venta #${venta.id_venta}</strong></span>
                        <span>${fechaFormateada}</span>
                        <span class="venta-total">Total: $${venta.monto_total.toFixed(2)}</span>
                    </div>
                    <p>Cliente: ${nombreClienteMostrado}</p> <div class="venta-detalles">
                        <h4>Detalles de la Venta:</h4>
                        <ul>
                `;

                // Itera sobre los detalles (productos) de esa venta
                venta.detalles.forEach(detalle => {
                    ventaHTML += `
                        <li class="detalle-item">
                            <span>${detalle.nombre_producto || '(Producto no disponible)'}</span>
                            <span>Cant: ${detalle.cantidad}</span>
                            <span>@ $${detalle.precio_unitario.toFixed(2)} c/u</span>
                        </li>
                    `;
                });

                ventaHTML += `</ul></div>`;
                li.innerHTML = ventaHTML;
                ul.appendChild(li);
            });
            historialVentasLista.appendChild(ul);

        } catch (error) {
            historialVentasLista.innerHTML = `<p style="color: red;">Error al cargar el historial de ventas: ${error.message}</p>`;
        }
    }

    /** Carga y muestra el reporte de productos con bajo stock. */
    async function cargarReporteBajoStock() {
        const contenedor = document.getElementById('reporte-bajo-stock');
        if (!contenedor) return;
        contenedor.innerHTML = '<p>Cargando reporte...</p>';
        try {
            const data = await fetchData(`${API_URL}/api/reportes/bajo-stock`);
            if (!data || data.length === 0) {
                contenedor.innerHTML = '<p>No hay productos con bajo stock.</p>'; return;
            }

            let tablaHTML = '<table class="reporte-tabla"><thead><tr><th>ID</th><th>Nombre</th><th class="numero">Stock</th></tr></thead><tbody>';
            data.forEach(item => {
                tablaHTML += `<tr><td>${item.id_producto}</td><td>${item.nombre}</td><td class="numero">${item.cantidad_stock}</td></tr>`;
            });
            tablaHTML += '</tbody></table>';
            contenedor.innerHTML = tablaHTML;

        } catch (error) {
            contenedor.innerHTML = `<p style="color: red;">Error al cargar reporte: ${error.message}</p>`;
        }
    }


    /** Carga y muestra el reporte de ventas por cliente. */
    async function cargarReporteVentasCliente() {
        const contenedor = document.getElementById('reporte-ventas-cliente');
        if (!contenedor) return;
        contenedor.innerHTML = '<p>Cargando reporte...</p>';
        try {
            const data = await fetchData(`${API_URL}/api/reportes/ventas-cliente`);
            if (!data || data.length === 0) {
                contenedor.innerHTML = '<p>No hay ventas registradas para mostrar.</p>'; return;
            }

            let tablaHTML = '<table class="reporte-tabla"><thead><tr><th>Cliente (ID)</th><th>Nombre</th><th class="numero">Total Compras</th><th class="numero">Gasto Total</th></tr></thead><tbody>';
            data.forEach(item => {
                tablaHTML += `
                <tr>
                    <td>${item.id_cliente}</td>
                    <td>${item.nombre}</td>
                    <td class="numero">${item.total_compras}</td>
                    <td class="numero">$${item.gasto_total.toFixed(2)}</td>
                </tr>`;
            });
            tablaHTML += '</tbody></table>';
            contenedor.innerHTML = tablaHTML;

        } catch (error) {
            contenedor.innerHTML = `<p style="color: red;">Error al cargar reporte: ${error.message}</p>`;
        }
    }


    // 1. FunciÛn para cargar mis compras
    async function cargarMisCompras() {
        const contenedor = document.getElementById('mis-compras-lista');
        if (!contenedor) return;

        try {
            const ventas = await fetchData(`${API_URL}/api/ventas/mis-compras`); // Nuevo Endpoint
            contenedor.innerHTML = '';

            if (!ventas || ventas.length === 0) {
                contenedor.innerHTML = '<p>A˙n no has realizado compras.</p>';
                return;
            }

            const ul = document.createElement('ul');
            ventas.forEach(venta => {
                const li = document.createElement('li');
                li.className = 'venta-item';
                const fecha = new Date(venta.fecha).toLocaleDateString();

                let html = `
                <div class="venta-header">
                    <span><strong>Compra #${venta.id_venta}</strong></span>
                    <span>${fecha}</span>
                    <span class="venta-total">$${venta.monto_total.toFixed(2)}</span>
                </div>
                <div class="venta-detalles"><ul>`;

                venta.detalles.forEach(d => {
                    html += `<li>${d.cantidad}x ${d.nombre_producto} ($${d.precio_unitario})</li>`;
                });

                html += `</ul></div>`;
                li.innerHTML = html;
                ul.appendChild(li);
            });
            contenedor.appendChild(ul);
        } catch (error) {
            contenedor.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        }
    }

    // --- Funciones de LÛgica de UI ---

    /** Muestra la secciÛn de direcciones para un cliente especÌfico. */
    function mostrarSeccionDirecciones(clienteId, nombreCliente) {
        if (!direccionesClienteDiv || !nombreClienteSeleccionadoSpan || !idClienteDireccionInput) return;
        clienteSeleccionadoId = clienteId;
        nombreClienteSeleccionadoSpan.textContent = nombreCliente;
        idClienteDireccionInput.value = clienteId;
        direccionesClienteDiv.style.display = 'block';
        resetFormularioDireccion();
        cargarDireccionesCliente(clienteId);
    }

    /** Muestra el modal de ediciÛn de cliente con los datos precargados. */
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
        // AÒadir una clase al formulario para diferenciar el manejador de envÌo
        formEditarCliente.setAttribute('data-target-entity', 'cliente');
    }

    /** Muestra el modal de ediciÛn de proveedor con los datos precargados. */
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
        // AÒadir una clase al formulario para diferenciar el manejador de envÌo
        formEditarCliente.setAttribute('data-target-entity', 'proveedor');

        modalEditarCliente.style.display = 'block';
    }

    /** Oculta el modal de ediciÛn. */
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
        if (carrito.length === 0) { carritoItemsDiv.innerHTML = '<p>El carrito est· vacÌo.</p>'; btnFinalizarCompra.disabled = true; }
        else {
            carrito.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'carrito-item';
                itemDiv.innerHTML = `
                    <span class="item-nombre">${item.nombre}</span>
                    <div class="carrito-item-controles">
                        <button class="btn-qty btn-decrease-qty" data-id="${item.id_producto}">-</button>
                        <span class="item-cantidad">x ${item.cantidad}</span>
                        <button class="btn-qty btn-increase-qty" data-id="${item.id_producto}">+</button>
                    </div>
                    <span class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</span>
                `;
                // AÒadimos listeners a los nuevos botones de cantidad
                itemDiv.querySelector('.btn-decrease-qty').addEventListener('click', handleDecreaseQuantity);
                itemDiv.querySelector('.btn-increase-qty').addEventListener('click', handleIncreaseQuantity);
                carritoItemsDiv.appendChild(itemDiv); total += item.precio * item.cantidad;
            });
            btnFinalizarCompra.disabled = false;
        }
        carritoTotalSpan.textContent = total.toFixed(2);
    }

    /** Maneja el clic en "AÒadir al Carrito" (funciona como un Toggle/AÒadir). */
    function handleAddCarritoClick(event) {
        if (userRole === 'visualizacion') {
            alert("?? Registrate o inicia sesiÛn para agregar productos al carrito.");
            document.getElementById('modal-login').style.display = 'block';
            return;
        }

        const button = event.target;
        const idProducto = parseInt(button.dataset.id);
        const nombre = button.dataset.nombre;
        const precio = parseFloat(button.dataset.precio);

        const itemExistente = carrito.find(item => item.id_producto === idProducto);
        if (itemExistente) {
            itemExistente.cantidad++;
        } else {
            carrito.push({ id_producto: idProducto, nombre, precio, cantidad: 1 });
        }
        renderizarCarrito(); // Actualiza la vista
    }

    /** Maneja el clic en el botÛn "X" para remover item del carrito. */
    function handleRemoveCarritoClick(event) {
        const button = event.target;
        const idProducto = parseInt(button.dataset.id);
        carrito = carrito.filter(item => item.id_producto !== idProducto);
        renderizarCarrito();
    }

    /** Maneja el clic en el botÛn "-" para reducir la cantidad o eliminar */
    function handleDecreaseQuantity(event) {
        const idProducto = parseInt(event.target.dataset.id);
        const itemEnCarrito = carrito.find(item => item.id_producto === idProducto);

        if (itemEnCarrito) {
            itemEnCarrito.cantidad--; // Reduce la cantidad

            // Si la cantidad llega a 0, elimina el item del carrito
            if (itemEnCarrito.cantidad <= 0) {
                carrito = carrito.filter(item => item.id_producto !== idProducto);
            }
        }
        renderizarCarrito(); // Actualiza la vista
    }

    /** Maneja el clic en el botÛn "+" para aumentar la cantidad */
    function handleIncreaseQuantity(event) {
        const idProducto = parseInt(event.target.dataset.id);
        const itemEnCarrito = carrito.find(item => item.id_producto === idProducto);

        if (itemEnCarrito) {
            itemEnCarrito.cantidad++; // Aumenta la cantidad
        }
        renderizarCarrito(); // Actualiza la vista
    }


    // --- NUEVAS FUNCIONES PARA EL FORMULARIO DE PRODUCTOS ---

    /**
     * @function handleTipoProductoChange
     * @description Muestra u oculta los campos de detalles de subtipo
     * basado en la selecciÛn del usuario.
     */
    function handleTipoProductoChange() {
        // Oculta todos los contenedores de detalles
        if (detallesRopa) detallesRopa.style.display = 'none';
        if (detallesCalzado) detallesCalzado.style.display = 'none';
        if (detallesAccesorios) detallesAccesorios.style.display = 'none';

        // Pone todos los inputs de subtipos como no-requeridos
        document.querySelectorAll('.detalles-subtipo input').forEach(input => input.required = false);

        if (!selectorTipoProducto) return;
        const tipo = selectorTipoProducto.value;

        // Muestra el contenedor relevante y marca sus campos como 'required'
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

    /**
    * @function handleEditarProductoClick
    * @description Obtiene los datos completos de un producto y llena el
    * formulario de "Registrar Producto" para entrar en modo ediciÛn.
    */
    async function handleEditarProductoClick(productoId) {
        try {
            // 1. Obtener los datos completos del producto (incluyendo subtipo)
            const producto = await fetchData(`${API_URL}/api/productos/${productoId}`);
            if (!producto) throw new Error("No se pudieron cargar los datos del producto.");

            // 2. Llenar los campos base
            productoIdEditInput.value = producto.id_producto;
            document.getElementById('producto-nombre').value = producto.nombre;
            document.getElementById('producto-descripcion').value = producto.descripcion || '';
            document.getElementById('producto-precio').value = producto.precio;
            document.getElementById('producto-stock').value = producto.cantidad_stock;
            selectorProveedorProducto.value = producto.id_proveedor;

            // 3. Llenar los campos de subtipo

            // --- °CORRECCI√ìN A—ADIDA AQU√ç! ---
            // Almacena el tipo en el formulario antes de deshabilitar el select
            formNuevoProducto.setAttribute('data-editing-type', producto.tipo_producto);

            selectorTipoProducto.value = producto.tipo_producto;
            handleTipoProductoChange(); // Muestra los campos correctos

            // Deshabilita el selector de tipo, no se puede cambiar el tipo de un producto
            selectorTipoProducto.disabled = true;

            if (producto.tipo_producto === 'ropa' && producto.detalles_subtipo) {
                document.getElementById('ropa-material').value = producto.detalles_subtipo.material;
                document.getElementById('ropa-talla').value = producto.detalles_subtipo.talla;
                document.getElementById('ropa-corte').value = producto.detalles_subtipo.tipo_corte || '';
            } else if (producto.tipo_producto === 'calzado' && producto.detalles_subtipo) {
                document.getElementById('calzado-talla').value = producto.detalles_subtipo.talla_numerica;
                document.getElementById('calzado-suela').value = producto.detalles_subtipo.material_suela;
            } else if (producto.tipo_producto === 'accesorios' && producto.detalles_subtipo) {
                document.getElementById('accesorio-material').value = producto.detalles_subtipo.material;
                document.getElementById('accesorio-dimensiones').value = producto.detalles_subtipo.dimensiones || '';
            }

            // 4. Poner el formulario en "Modo EdiciÛn"

            // Busca la <section> m·s cercana (padre) y luego busca el <h2> dentro de ella.
            formNuevoProducto.closest('section').querySelector('h2').textContent = "Editar Producto";

            formNuevoProducto.querySelector('button[type="submit"]').textContent = "Actualizar Producto";
            btnCancelarEdicionProducto.style.display = 'inline-block'; // Muestra el botÛn de cancelar

            // Scroll para que el usuario vea el formulario
            formNuevoProducto.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            mostrarMensaje(productoMensaje, `Error al cargar producto para editar: ${error.message}`, false);
        }
    }

    /**
    * @function resetFormularioProducto
    * @description Resetea el formulario de producto al estado "Crear".
    */
    function resetFormularioProducto() {
        productoIdEditInput.value = ''; // Limpia el ID oculto
        formNuevoProducto.removeAttribute('data-editing-type');
        formNuevoProducto.reset(); // Limpia todos los campos

        handleTipoProductoChange(); // Oculta los campos de subtipo

        selectorTipoProducto.disabled = false; // Rehabilita el selector de tipo

        // Busca la <section> m·s cercana (padre) y luego busca el <h2> dentro de ella.
        formNuevoProducto.closest('section').querySelector('h2').textContent = "Registrar Nuevo Producto";

        formNuevoProducto.querySelector('button[type="submit"]').textContent = "Registrar Producto";
        btnCancelarEdicionProducto.style.display = 'none'; // Oculta el botÛn de cancelar
    }

    /** Resetea el formulario de direcciÛn al estado "Crear". */
    function resetFormularioDireccion() {
        document.getElementById('id-direccion-edit').value = '';
        formNuevaDireccion.reset(); // Limpia los campos de texto

        // Restaura el ID del cliente (que se borra con reset())
        if (clienteSeleccionadoId) {
            document.getElementById('id-cliente-direccion').value = clienteSeleccionadoId;
        }

        formNuevaDireccion.parentElement.querySelector('h4').textContent = "AÒadir Nueva DirecciÛn";
        formNuevaDireccion.querySelector('button[type="submit"]').textContent = "AÒadir DirecciÛn";
        document.getElementById('btn-cancelar-edicion-direccion').style.display = 'none';
    }

    // --- (AÒade esto al final del archivo, en "InicializaciÛn y AsignaciÛn de Eventos") ---
    const btnCancelarEdicionDireccion = document.getElementById('btn-cancelar-edicion-direccion');
    if (btnCancelarEdicionDireccion) {
        btnCancelarEdicionDireccion.addEventListener('click', resetFormularioDireccion);
    }

    /**
    * @function handleNuevoProductoSubmit
    * @description Maneja el envÌo del formulario.
    * Detecta si est· en modo "Crear" (POST) o "Editar" (PUT)
    * basado en el input oculto 'producto-id-edit'.
    */
    async function handleNuevoProductoSubmit(event) {
        event.preventDefault();
        if (!formNuevoProducto || !productoMensaje) return;

        // Detectar modo
        const editId = productoIdEditInput.value ? parseInt(productoIdEditInput.value) : null;
        const isEditMode = editId !== null;

        // üîß SoluciÛn: forzar tipo de producto incluso si el atributo no existe
        let tipoProducto = formNuevoProducto.getAttribute('data-editing-type') || selectorTipoProducto.value;

        if (!tipoProducto) {
            mostrarMensaje(productoMensaje, "Error: No se detectÛ el tipo de producto.", false);
            console.error("No se encontrÛ tipo_producto en el formulario.");
            return;
        }

        console.log("Tipo de producto detectado:", tipoProducto);

        // 1. Datos comunes
        const payload = {
            nombre: document.getElementById('producto-nombre').value,
            descripcion: document.getElementById('producto-descripcion').value || null,
            precio: parseFloat(document.getElementById('producto-precio').value),
            cantidad_stock: parseInt(document.getElementById('producto-stock').value),
            id_proveedor: parseInt(selectorProveedorProducto.value),
            tipo_producto: tipoProducto,
            detalles_subtipo: {}
        };

        // 2. Subtipos
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
            } else {
                throw new Error(`Tipo de producto no v·lido: ${tipoProducto}`);
            }

            if (!payload.id_proveedor) throw new Error("Debe seleccionar un proveedor.");
            if (payload.precio < 0 || isNaN(payload.precio)) throw new Error("Precio no v·lido.");
            if (payload.cantidad_stock < 0 || isNaN(payload.cantidad_stock)) throw new Error("Stock no v·lido.");

        } catch (error) {
            mostrarMensaje(productoMensaje, `Error al leer datos del formulario: ${error.message}`, false);
            return;
        }

        // 3. Enviar a la API
        const submitButton = formNuevoProducto.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = isEditMode ? 'Actualizando...' : 'Registrando...';

        const method = isEditMode ? 'PUT' : 'POST';
        const endpoint = isEditMode ? `${API_URL}/api/productos/${editId}` : `${API_URL}/api/productos`;

        try {
            const resultado = await fetchData(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const mensajeExito = isEditMode
                ? `Producto "${resultado.nombre}" actualizado!`
                : `Producto "${resultado.nombre}" registrado!`;

            mostrarMensaje(productoMensaje, mensajeExito, true);
            resetFormularioProducto();
            cargarProductos();

        } catch (error) {
            mostrarMensaje(productoMensaje, `Error: ${error.message}`, false);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? 'Actualizar Producto' : 'Registrar Producto';
        }
    }



    // --- Manejadores de Eventos CRUD ---

    /** Maneja el clic en "Ver/AÒadir Direcciones". */
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

    /** Maneja el clic en "Editar DirecciÛn". */
    function handleEditarDireccionClick(event) {
        const button = event.target;
        const dirId = button.dataset.idDir;
        const calle = button.dataset.calle;
        const ciudad = button.dataset.ciudad;
        const cp = button.dataset.cp;

        // Puebla el formulario
        document.getElementById('id-direccion-edit').value = dirId;
        document.getElementById('calle-direccion').value = calle;
        document.getElementById('ciudad-direccion').value = ciudad;
        document.getElementById('cp-direccion').value = cp;

        // Cambia la UI del formulario
        formNuevaDireccion.parentElement.querySelector('h4').textContent = "Editar DirecciÛn";
        formNuevaDireccion.querySelector('button[type="submit"]').textContent = "Actualizar DirecciÛn";
        document.getElementById('btn-cancelar-edicion-direccion').style.display = 'inline-block';
    }



    /** Maneja el clic en "Eliminar Cliente". */
    async function handleDeleteClienteClick(event) {
        const button = event.target;
        const clienteId = parseInt(button.dataset.id);
        const nombreCliente = button.dataset.nombre;

        if (!confirm(`øEst·s seguro de que deseas eliminar al cliente "${nombreCliente}"?`)) {
            return;
        }

        try {
            await fetchData(`${API_URL}/api/clientes/${clienteId}`, {
                method: 'DELETE',
            });
            mostrarMensaje(clienteMensaje, `Cliente "${nombreCliente}" eliminado con Èxito.`, true);
            cargarClientes();
            if (clienteSeleccionadoId === clienteId && direccionesClienteDiv) {
                direccionesClienteDiv.style.display = 'none';
                clienteSeleccionadoId = null;
            }
        } catch (error) {
            mostrarMensaje(clienteMensaje, `Error al eliminar cliente: ${error.message}`, false);
        }
    }

    /** Maneja el clic en "Eliminar DirecciÛn". */
    async function handleDeleteDireccionClick(event) {
        const button = event.target;
        const direccionId = parseInt(button.dataset.idDir);
        const clienteId = parseInt(button.dataset.idCli);

        if (!confirm(`øEst·s seguro de que deseas eliminar esta direcciÛn?`)) {
            return;
        }

        try {
            await fetchData(`${API_URL}/api/clientes/${clienteId}/direcciones/${direccionId}`, {
                method: 'DELETE',
            });
            mostrarMensaje(direccionMensaje, `DirecciÛn eliminada con Èxito.`, true);
            cargarDireccionesCliente(clienteId); // Recarga la lista de direcciones
        } catch (error) {
            mostrarMensaje(direccionMensaje, `Error al eliminar direcciÛn: ${error.message}`, false);
        }
    }


    /** Maneja el clic en "Eliminar Proveedor". */
    async function handleDeleteProveedorClick(event) {
        const button = event.target;
        const proveedorId = parseInt(button.dataset.id);
        const nombreProveedor = button.dataset.nombre;

        if (!confirm(`øEst·s seguro de que deseas eliminar al proveedor "${nombreProveedor}"?`)) {
            return;
        }

        try {
            // Llama al endpoint DELETE
            await fetchData(`${API_URL}/api/proveedores/${proveedorId}`, {
                method: 'DELETE',
            });
            // √âxito (status 204)
            mostrarMensaje(proveedorMensaje, `Proveedor "${nombreProveedor}" eliminado con Èxito.`, true);
            cargarProveedores(); // Recarga la lista de proveedores
            // Opcional: Recargar productos ya que los productos de ese proveedor podrÌan haberse quedado huÈrfanos
            cargarProductos();
        } catch (error) {
            // Muestra el mensaje de error DETALLADO que viene de la API (ej. 409 Conflict)
            mostrarMensaje(proveedorMensaje, `Error al eliminar proveedor: ${error.message}`, false);
        }
    }

    /** Maneja el clic en "Eliminar Producto". */
    async function handleDeleteProductoClick(event) {
        const button = event.target;
        const productoId = parseInt(button.dataset.id);
        const nombreProducto = button.dataset.nombre;

        if (!confirm(`øEst·s seguro de que deseas eliminar el producto "${nombreProducto}"?`)) {
            return;
        }

        try {
            await fetchData(`${API_URL}/api/productos/${productoId}`, {
                method: 'DELETE',
            });
            // Mensaje de Èxito (usaremos el de 'productoMensaje' del form de crear producto)
            mostrarMensaje(productoMensaje, `Producto "${nombreProducto}" eliminado con Èxito.`, true);
            cargarProductos(); // Recarga el cat·logo
        } catch (error) {
            // Mostrar· error 409 si el producto est· en una venta (lo cual es correcto)
            mostrarMensaje(productoMensaje, `Error al eliminar producto: ${error.message}`, false);
        }
    }

    /** Maneja el envÌo del formulario de ediciÛn de cliente/proveedor. */
    async function handleEditarSubmit(event) {
        event.preventDefault();
        // Obtiene la entidad objetivo ('cliente' o 'proveedor') del atributo data-target-entity
        const entityType = formEditarCliente.getAttribute('data-target-entity');

        if (!entityType || !formEditarCliente || !editClienteIdInput || !editClienteMensaje) return;

        // --- PUNTO CR√çTICO 1: Obtenemos el ID del input oculto (reutilizado) ---
        const id = parseInt(editClienteIdInput.value);
        const nombre = editNombreClienteInput.value;
        const telefono = editTelefonoClienteInput.value || null;

        // VerificaciÛn de ID v·lida
        if (isNaN(id) || id <= 0) {
            mostrarMensaje(editClienteMensaje, `Error: ID de ${entityType} no v·lido (${id}).`, false);
            return;
        }

        const submitButton = formEditarCliente.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';

        try {

            // ConstrucciÛn de la URL: /api/{entidad en plural}s/{id}
            let pluralEntity = entityType;
            if (entityType === 'proveedor') pluralEntity = 'proveedores';
            else pluralEntity = `${entityType}s`;

            const endpoint = `${API_URL}/api/${pluralEntity}/${id}`;

            console.log(`[EDIT] Enviando PUT a: ${endpoint}`); // Log de depuraciÛn
            console.log(`[EDIT] Datos enviados:`, { nombre, telefono }); // Log de depuraciÛn

            const actualizado = await fetchData(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, telefono }),
            });

            // LÛgica de UI seg˙n la entidad editada
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

    /** Maneja el envÌo del formulario para crear un nuevo cliente. */
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

    /** Maneja el envÌo del formulario para crear un nuevo proveedor. */
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


    /** * @function handleNuevaDireccionSubmit
     * @description Maneja el envÌo del formulario para A—ADIR o ACTUALIZAR una direcciÛn.
     * (ACTUALIZADO CON L√ìGICA DE ROLES)
     */
    async function handleNuevaDireccionSubmit(event) {
        event.preventDefault();
        if (!formNuevaDireccion || !direccionMensaje) return;

        const direccionEditId = document.getElementById('id-direccion-edit').value;
        const isEditMode = direccionEditId !== '';

        // --- INICIO DE L√ìGICA DE ROLES ---
        let idClienteParaDireccion = null;

        if (userRole === 'admin') {
            // El Admin usa el ID del cliente que seleccionÛ de la lista
            // (Esta variable se guarda cuando el admin hace clic en "Direcciones")
            idClienteParaDireccion = clienteSeleccionadoId;
        } else if (userRole === 'usuario') {
            // El Usuario usa su propio ID
            idClienteParaDireccion = currentUserId;
        }

        if (idClienteParaDireccion === null) {
            mostrarMensaje(direccionMensaje, "Error: No se pudo identificar al cliente. Inicia sesiÛn de nuevo.", false);
            return;
        }
        // --- FIN DE L√ìGICA DE ROLES ---

        const formData = new FormData(formNuevaDireccion);
        const calle = formData.get('calle');
        const ciudad = formData.get('ciudad');
        const codigo_postal = formData.get('codigo_postal');

        const payload = { calle, ciudad, codigo_postal };

        const method = isEditMode ? 'PUT' : 'POST';

        // Usamos la variable idClienteParaDireccion para construir la URL
        const endpoint = isEditMode
            ? `${API_URL}/api/clientes/${idClienteParaDireccion}/direcciones/${direccionEditId}`
            : `${API_URL}/api/clientes/${idClienteParaDireccion}/direcciones`;

        const submitButton = formNuevaDireccion.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = isEditMode ? 'Actualizando...' : 'AÒadiendo...';

        try {
            await fetchData(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            mostrarMensaje(direccionMensaje, isEditMode ? 'DirecciÛn actualizada!' : 'DirecciÛn aÒadida!', true);
            resetFormularioDireccion(); // Limpia el formulario

            // Recarga la lista de direcciones
            cargarDireccionesCliente(idClienteParaDireccion);

        } catch (error) {
            mostrarMensaje(direccionMensaje, `Error: ${error.message}`, false);
        }
        finally {
            submitButton.disabled = false;
            // El texto del botÛn se restaura en resetFormularioDireccion()
        }
    }


    /**
     * @function handleFinalizarCompraClick
     * @description Procesa el evento de clic para finalizar una compra.
     * Valida la entrada (cliente y carrito), construye el payload de la venta,
     * lo envÌa a la API, y maneja la respuesta (Èxito o error) actualizando la UI.
     * * @async
     * @returns {void} - Esta funciÛn no retorna valores, modifica el DOM y el estado de la app.
     */

    async function handleFinalizarCompraClick() {

        if (!btnFinalizarCompra || !compraMensaje) {
            console.error("Componentes crÌticos del carrito no encontrados.");
            return;
        }

        // --- INICIO DE L√ìGICA DE ROLES ---
        let idClienteParaVenta = null;

        if (userRole === 'admin') {
            // El Admin S√ç usa el selector
            const idClienteAdmin = selectorCliente.value;
            if (!idClienteAdmin) {
                mostrarMensaje(compraMensaje, "Como Admin, debe seleccionar un cliente.", false);
                return;
            }
            idClienteParaVenta = idClienteAdmin;

        } else if (userRole === 'usuario') {
            // El Usuario usa su PROPIO ID (guardado en el login)
            if (!currentUserId) {
                mostrarMensaje(compraMensaje, "Error de sesiÛn. Por favor, inicia sesiÛn de nuevo.", false);
                return;
            }
            idClienteParaVenta = currentUserId;

        } else {
            // VisualizaciÛn: mostrar modal de login
            alert("Por favor, inicia sesiÛn para completar tu compra.");
            document.getElementById('modal-login').style.display = 'block';
            return;
        }

        // --- FIN DE L√ìGICA DE ROLES ---

        if (carrito.length === 0) {
            mostrarMensaje(compraMensaje, "El carrito est· vacÌo.", false);
            return;
        }

        // 3. PreparaciÛn del Payload
        const ventaData = {
            id_cliente: parseInt(idClienteParaVenta), // <-- Usa la variable correcta
            detalles: carrito.map(item => ({
                id_producto: item.id_producto,
                cantidad: item.cantidad
            }))
        };

        // 4. GestiÛn de Estado UI
        btnFinalizarCompra.disabled = true;
        btnFinalizarCompra.textContent = 'Procesando...';

        try {
            // 5. PeticiÛn AsÌncrona
            const ventaCreada = await fetchData(`${API_URL}/api/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ventaData),
            });

            // 6. Manejo de √âxito
            mostrarMensaje(compraMensaje, `Venta #${ventaCreada.id_venta} registrada! Total: $${ventaCreada.monto_total.toFixed(2)}`, true);

            carrito = [];

            // Si es admin, limpiamos el selector. Si es usuario, no hace falta.
            if (userRole === 'admin') {
                selectorCliente.value = "";
            }

            renderizarCarrito();
            cargarProductos();

            // Solo el admin necesita recargar esto
            if (userRole === 'admin') {
                cargarHistorialVentas();
                cargarReporteBajoStock();
                cargarReporteVentasCliente();
            } else if (userRole === 'usuario') {
                // Recargar "Mis Compras" para usuarios regulares
                cargarMisCompras();
            }

        } catch (error) {
            // 7. Manejo de Errores
            mostrarMensaje(compraMensaje, `Error: ${error.message}`, false);
        }
        finally {
            // 8. Limpieza
            btnFinalizarCompra.textContent = 'Finalizar Compra';
            renderizarCarrito(); // Esto re-habilitar· el botÛn si a˙n hay items
        }
    }


    // Estado global para el rol (°importante!)
    let userRole = 'visualizacion'; // Rol por defecto
    let currentUserId = null; // ID del usuario logueado


    /**
     * Decodifica un token JWT (Base64Url) a un objeto JSON.
     * Maneja correctamente caracteres UTF-8 y el formato URL-safe.
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
            throw new Error("Token inv·lido");
        }
    }

    /** Maneja el envÌo del formulario de login */
    async function handleLoginSubmit(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const loginMensaje = document.getElementById('login-mensaje');
        const submitButton = document.querySelector('#form-login button[type="submit"]');
        submitButton.disabled = true;

        // El login de FastAPI usa un formato especial: 'x-www-form-urlencoded'
        const formData = new URLSearchParams();
        formData.append('username', email); // FastAPI espera 'username' para el email
        formData.append('password', password);

        try {
            // Nota: NO usamos fetchData aquÌ porque el body no es JSON
            const response = await fetch(`${API_URL}/api/auth/token`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Email o contraseÒa incorrectos.");
            }

            const data = await response.json(); // { access_token: "...", ... }
            localStorage.setItem('authToken', data.access_token);

            // Decodifica el token para obtener el ROL y el ID del usuario
            try {
                const payload = parseJwt(data.access_token);
                userRole = payload.rol || 'usuario';
                currentUserId = payload.id || null;
            } catch (e) {
                console.error("Error al decodificar token:", e);
                userRole = 'usuario'; // Fallback
                currentUserId = null;
            }

            mostrarMensaje(loginMensaje, "°Bienvenido!", true);
            document.getElementById('modal-login').style.display = 'none';
            document.getElementById('form-login').reset();

            // Actualiza toda la UI
            actualizarUIPorRol();

        } catch (error) {
            userRole = 'visualizacion';
            mostrarMensaje(loginMensaje, error.message, false);
        } finally {
            submitButton.disabled = false;
        }
    }

    /** Maneja el envÌo del formulario de registro */
    async function handleRegistroSubmit(event) {
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
            // Usamos fetchData para el registro (es JSON)
            const nuevoUsuario = await fetchData(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            mostrarMensaje(registroMensaje, `°Usuario ${nuevoUsuario.nombre} creado! Ahora puedes iniciar sesiÛn.`, true);
            document.getElementById('modal-registro').style.display = 'none';
            document.getElementById('form-registro').reset();

        } catch (error) {
            mostrarMensaje(registroMensaje, `Error: ${error.message}`, false);
        } finally {
            submitButton.disabled = false;
        }
    }

    /** Cierra la sesiÛn del usuario */
    function handleLogout() {
        localStorage.removeItem('authToken');
        userRole = 'visualizacion';
        currentUserId = null;
        // Llama a actualizarUIPorRol para "limpiar" la p·gina
        actualizarUIPorRol();
        // Recarga la p·gina para un estado 100% limpio (opcional pero recomendado)
        window.location.reload();
    }

    /** * Actualiza la UI basado en el rol.
     * Esta funciÛn es la que OCULTA y MUESTRA secciones.
     */
    async function actualizarUIPorRol() {
        const esAdmin = userRole === 'admin';
        const esUsuario = userRole === 'usuario';
        const esVisualizacion = userRole === 'visualizacion';

        // 1. Botones de login/logout
        document.getElementById('btn-mostrar-login').style.display = esVisualizacion ? 'inline-block' : 'none';
        document.getElementById('btn-mostrar-registro').style.display = esVisualizacion ? 'inline-block' : 'none';
        document.getElementById('btn-logout').style.display = esVisualizacion ? 'none' : 'inline-block';

        // 2. Secciones "admin-only"
        // (Tu HTML ya tiene la clase 'admin-only' en las secciones correctas)
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = esAdmin ? 'block' : 'none';
        });

        // 3. Saludo y Carga de Datos EspecÌficos
        const saludoSpan = document.getElementById('saludo-usuario');
        const selectorCliente = document.getElementById('selector-cliente');
        selectorCliente.innerHTML = '<option value="">Seleccione un cliente...</option>'; // Limpiar
        selectorCliente.style.display = 'none'; // Ocultar por defecto

        if (esAdmin) {
            saludoSpan.textContent = 'Modo Administrador';
            selectorCliente.style.display = 'block'; // Admin ve el selector
            // Admin carga TODOS los datos
            cargarClientes(); // Llena el selector
            cargarProveedores();
            cargarHistorialVentas();
            cargarReporteBajoStock();
            cargarReporteVentasCliente();

        } else if (esUsuario) {
            saludoSpan.textContent = `°Hola, usuario!`;
            document.getElementById('seccion-mis-direcciones').style.display = 'block';
            document.getElementById('nombre-cliente-seleccionado').textContent = "tus direcciones";

            if (currentUserId) {
                document.getElementById('id-cliente-direccion').value = currentUserId;
                cargarDireccionesCliente(currentUserId);
            }

            document.getElementById('seccion-mis-compras').style.display = 'block';
            cargarMisCompras();

        } else { // VisualizaciÛn
            saludoSpan.textContent = 'Modo Visitante';
            document.getElementById('seccion-mis-direcciones').style.display = 'none';
        }

        // 4. Carga de Productos (Todos la necesitan)
        cargarProductos();

        // 5. Carrito
        const btnFinalizar = document.getElementById('btn-finalizar-compra');
        if (esVisualizacion) {
            btnFinalizar.textContent = "Iniciar sesiÛn para comprar";
            btnFinalizar.disabled = false; // Habilitarlo para que puedan hacer click

        } else if (esUsuario) {
            btnFinalizar.textContent = "Finalizar Compra";
            btnFinalizar.disabled = carrito.length === 0;
        } else if (esAdmin) {
            btnFinalizar.textContent = "Finalizar Compra (Admin)";
            btnFinalizar.disabled = carrito.length === 0;
        }
        renderizarCarrito(); // Renderiza el carrito (vacÌo o no)
    }


    // --- InicializaciÛn y AsignaciÛn de Eventos ---

    // Asigna manejadores de eventos a formularios y botones est·ticos.
    if (formNuevoCliente) formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    if (formNuevoProveedor) formNuevoProveedor.addEventListener('submit', handleNuevoProveedorSubmit);
    if (formNuevaDireccion) formNuevaDireccion.addEventListener('submit', handleNuevaDireccionSubmit);
    // btnFinalizarCompra event listener now handled by sales.js initSalesListeners()

    // Formulario de Producto (Admin)
    if (selectorTipoProducto) selectorTipoProducto.addEventListener('change', handleTipoProductoChange);
    if (formNuevoProducto) formNuevoProducto.addEventListener('submit', handleNuevoProductoSubmit);
    if (btnCancelarEdicionProducto) {
        btnCancelarEdicionProducto.addEventListener('click', resetFormularioProducto);
    }

    // Modal de EdiciÛn (Admin)
    if (formEditarCliente) formEditarCliente.addEventListener('submit', handleEditarSubmit);
    if (cerrarModalClienteBtn) cerrarModalClienteBtn.addEventListener('click', ocultarModalEditarCliente);
    if (modalEditarCliente) {
        modalEditarCliente.addEventListener('click', (event) => {
            if (event.target === modalEditarCliente) {
                ocultarModalEditarCliente();
            }
        });
    }

    // Asigna los listeners a los nuevos formularios y botones de Auth
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const btnLogout = document.getElementById('btn-logout');
    const btnShowLogin = document.getElementById('btn-mostrar-login');
    const btnShowRegistro = document.getElementById('btn-mostrar-registro');
    const btnCloseLogin = document.getElementById('cerrar-modal-login');
    const btnCloseRegistro = document.getElementById('cerrar-modal-registro');

    if (formLogin) formLogin.addEventListener('submit', handleLoginSubmit);
    if (formRegistro) formRegistro.addEventListener('submit', handleRegistroSubmit);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // Listeners para mostrar/ocultar modales de auth
    if (btnShowLogin) btnShowLogin.addEventListener('click', () => {
        document.getElementById('modal-login').style.display = 'block';
    });
    if (btnCloseLogin) btnCloseLogin.addEventListener('click', () => {
        document.getElementById('modal-login').style.display = 'none';
    });
    if (btnShowRegistro) btnShowRegistro.addEventListener('click', () => {
        document.getElementById('modal-registro').style.display = 'block';
    });
    if (btnCloseRegistro) btnCloseRegistro.addEventListener('click', () => {
        document.getElementById('modal-registro').style.display = 'none';
    });

    // === Inicializar MÛdulos ===

    // 1. Inicializar Cart DOM
    initCartDOM({
        carritoItemsDiv,
        carritoTotalSpan,
        btnFinalizarCompra
    });

    // 2. Configurar callback de getUserRole para el cart
    setGetUserRoleCallback(getUserRole);

    // 3. Verificar token existente (auth module)
    checkExistingToken();

    // 4. Inicializar event listeners de autenticaciÛn
    initAuthListeners();

    // 5. Inicializar event listeners de ventas
    initSalesListeners();

    // 6. Configurar callback global para actualizarUIPorRol (usado por auth.js)
    window.actualizarUIPorRolCallback = actualizarUIPorRol;

    // 7. Exponer currentUserId globalmente para sales.js (temporal)
    window.currentUserId = currentUserId;

    // 8. Actualizar UI seg˙n rol
    actualizarUIPorRol();

}); // Fin del addEventListener DOMContentLoaded

