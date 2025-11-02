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
    const API_URL = 'https://bazar-ropa-project-lunaemg.onrender.com'; //https://bazar-ropa-project-lunaemg.onrender.com

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
                
                const item = document.createElement('div'); 
                item.className = 'producto-item';
                

                // (el innerHTML de la tarjeta ahora tiene 3 botones)
                item.innerHTML = `
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion || 'Sin descripción'}</p>
                    
                    <p style="font-size: 0.9em; color: #555; margin-bottom: 10px;">
                        Disponibles: <strong>${producto.cantidad_stock}</strong>
                    </p>
                    
                    <p class="precio">$${producto.precio.toFixed(2)}</p>
                    
                    <div class="producto-acciones">
                        <button class="btn-accion btn-add-carrito" data-id="${producto.id_producto}" data-nombre="${producto.nombre}" data-precio="${producto.precio}">Añadir</button>
                        
                        <button class="btn-accion btn-editar-producto btn-editar" data-id="${producto.id_producto}">Editar</button>

                        <button class="btn-accion btn-eliminar-producto btn-eliminar" data-id="${producto.id_producto}" data-nombre="${producto.nombre}">Eliminar</button>
                    </div>
                `;
                
                // Listener Añadir
                item.querySelector('.btn-add-carrito').addEventListener('click', handleAddCarritoClick); 

                // --- NUEVO: Listener de Editar ---
                const editButton = item.querySelector('.btn-editar-producto');
                if (editButton) {
                    editButton.addEventListener('click', () => handleEditarProductoClick(producto.id_producto));
                }
                
                // Listener Eliminar
                item.querySelector('.btn-eliminar-producto').addEventListener('click', handleDeleteProductoClick);
                
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
        // Añade el selector del formulario de productos a la comprobación
        if (!listaDeProveedores || !selectorProveedorProducto) return; 
        
        listaDeProveedores.innerHTML = '<p>Cargando proveedores...</p>';
        
        // --- MODIFICADO: Limpia el selector del formulario de productos ---
        selectorProveedorProducto.innerHTML = '<option value="">Seleccione un proveedor...</option>';
        
        try {
            const proveedores = await fetchData(`${API_URL}/api/proveedores`);
            listaDeProveedores.innerHTML = ''; 
            if (!proveedores || proveedores.length === 0) { 
                listaDeProveedores.innerHTML = '<p>No hay proveedores registrados.</p>'; 
                // Asegúrate de que el selector también lo refleje
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
                // --- ASIGNACIÓN DE LISTENERS DE PROVEEDORES (CORRECCIÓN) ---
                li.querySelector('.btn-editar-proveedor').addEventListener('click', handleEditarProveedorClick);
                li.querySelector('.btn-eliminar-proveedor').addEventListener('click', handleDeleteProveedorClick);
                
                ul.appendChild(li);

                // --- MODIFICADO: Añadir al selector del formulario de productos ---
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
                li.className = 'venta-item'; // (Añadiremos este estilo en CSS)
                
                // Formatea la fecha para que sea más legible
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
                    <p>ID Cliente: ${venta.id_cliente}</p>
                    <div class="venta-detalles">
                        <h4>Detalles de la Venta:</h4>
                        <ul>
                `;
                
                // Itera sobre los detalles (productos) de esa venta
                venta.detalles.forEach(detalle => {
                    // NOTA: Tu API de ventas devuelve id_producto, no el nombre.
                    // (Ver nota al final para cómo mejorar esto)
                    ventaHTML += `
                        <li class="detalle-item">
                            <span>(ID Producto: ${detalle.id_producto})</span>
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

    // --- NUEVAS FUNCIONES PARA EL FORMULARIO DE PRODUCTOS ---

    /**
     * @function handleTipoProductoChange
     * @description Muestra u oculta los campos de detalles de subtipo
     * basado en la selección del usuario.
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
* formulario de "Registrar Producto" para entrar en modo edición.
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
        
        // --- ¡CORRECCIÓN AÑADIDA AQUÍ! ---
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

        // 4. Poner el formulario en "Modo Edición"
        
        // Busca la <section> más cercana (padre) y luego busca el <h2> dentro de ella.
        formNuevoProducto.closest('section').querySelector('h2').textContent = "Editar Producto";
        
        formNuevoProducto.querySelector('button[type="submit"]').textContent = "Actualizar Producto";
        btnCancelarEdicionProducto.style.display = 'inline-block'; // Muestra el botón de cancelar
        
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
        
        // Busca la <section> más cercana (padre) y luego busca el <h2> dentro de ella.
        formNuevoProducto.closest('section').querySelector('h2').textContent = "Registrar Nuevo Producto";

        formNuevoProducto.querySelector('button[type="submit"]').textContent = "Registrar Producto";
        btnCancelarEdicionProducto.style.display = 'none'; // Oculta el botón de cancelar
    }



    /**
 * @function handleNuevoProductoSubmit
 * @description Maneja el envío del formulario.
 * Detecta si está en modo "Crear" (POST) o "Editar" (PUT)
 * basado en el input oculto 'producto-id-edit'.
 */
async function handleNuevoProductoSubmit(event) {
    event.preventDefault();
    if (!formNuevoProducto || !productoMensaje) return;

    // Detectar modo
    const editId = productoIdEditInput.value ? parseInt(productoIdEditInput.value) : null;
    const isEditMode = editId !== null;

    // 🔧 Solución: forzar tipo de producto incluso si el atributo no existe
    let tipoProducto = formNuevoProducto.getAttribute('data-editing-type') || selectorTipoProducto.value;

    if (!tipoProducto) {
        mostrarMensaje(productoMensaje, "Error: No se detectó el tipo de producto.", false);
        console.error("No se encontró tipo_producto en el formulario.");
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
            throw new Error(`Tipo de producto no válido: ${tipoProducto}`);
        }

        if (!payload.id_proveedor) throw new Error("Debe seleccionar un proveedor.");
        if (payload.precio < 0 || isNaN(payload.precio)) throw new Error("Precio no válido.");
        if (payload.cantidad_stock < 0 || isNaN(payload.cantidad_stock)) throw new Error("Stock no válido.");

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

    /** Maneja el clic en "Eliminar Producto". */
    async function handleDeleteProductoClick(event) {
        const button = event.target;
        const productoId = parseInt(button.dataset.id);
        const nombreProducto = button.dataset.nombre;

        if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${nombreProducto}"?`)) {
            return; 
        }

        try {
            await fetchData(`${API_URL}/api/productos/${productoId}`, {
                method: 'DELETE',
            });
            // Mensaje de éxito (usaremos el de 'productoMensaje' del form de crear producto)
            mostrarMensaje(productoMensaje, `Producto "${nombreProducto}" eliminado con éxito.`, true);
            cargarProductos(); // Recarga el catálogo
        } catch (error) {
            // Mostrará error 409 si el producto está en una venta (lo cual es correcto)
            mostrarMensaje(productoMensaje, `Error al eliminar producto: ${error.message}`, false); 
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

    /**
     * @function handleFinalizarCompraClick
     * @description Procesa el evento de clic para finalizar una compra.
     * Valida la entrada (cliente y carrito), construye el payload de la venta,
     * lo envía a la API, y maneja la respuesta (éxito o error) actualizando la UI.
     * * @async
     * @returns {void} - Esta función no retorna valores, modifica el DOM y el estado de la app.
     */
    async function handleFinalizarCompraClick() {
        
        // --- 1. Guard Clauses ---
        // Asegura que los elementos críticos del DOM estén presentes antes de operar.
        if (!selectorCliente || !btnFinalizarCompra || !compraMensaje) {
            console.error("Componentes críticos del carrito no encontrados en el DOM.");
            return;
        }

        // --- 2. Validación de Entrada (Input Validation) ---
        const idClienteSeleccionado = selectorCliente.value;
        
        // Valida que se haya seleccionado un cliente.
        if (!idClienteSeleccionado) { 
            mostrarMensaje(compraMensaje, "Seleccione un cliente.", false); 
            return; // Detiene la ejecución si no es válido
        }
        
        // Valida que el carrito no esté vacío.
        if (carrito.length === 0) { 
            mostrarMensaje(compraMensaje, "El carrito está vacío.", false); 
            return; // Detiene la ejecución si no es válido
        }
        
        // --- 3. Preparación del Payload (Data Shaping) ---
        // Mapea el estado del carrito local (Array `carrito`) al formato 
        // requerido por el schema `VentaCreate` de la API (backend).
        const ventaData = { 
            id_cliente: parseInt(idClienteSeleccionado), 
            detalles: carrito.map(item => ({ 
                id_producto: item.id_producto, 
                cantidad: item.cantidad, 
                precio_unitario: item.precio 
            })) 
        };
        
        // --- 4. Gestión de Estado UI (Loading State) ---
        // Deshabilita el botón para prevenir envíos múltiples (doble clic)
        // mientras la petición asíncrona está en curso.
        btnFinalizarCompra.disabled = true; 
        btnFinalizarCompra.textContent = 'Procesando...';
        
        try {
            // --- 5. Petición Asíncrona (API Call) ---
            // Envía la nueva venta al endpoint del backend.
            const ventaCreada = await fetchData(`${API_URL}/api/ventas`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(ventaData), 
            });
            
            // --- 6. Manejo de Éxito (Success Handler) ---
            // La petición fue exitosa (status 201).
            
            // Informa al usuario sobre el éxito.
            mostrarMensaje(compraMensaje, `Venta #${ventaCreada.id_venta} registrada! Total: $${ventaCreada.monto_total.toFixed(2)}`, true); 
            
            // Resetea el estado de la aplicación local tras el éxito.
            carrito = []; // Vacía el array del carrito
            selectorCliente.value = ""; // Limpia el selector de cliente
            
            // Actualiza los componentes de la UI para reflejar el nuevo estado.
            renderizarCarrito(); // Renderiza el carrito (ahora vacío)
            cargarHistorialVentas(); // Refresca la lista de historial de ventas
            cargarProductos(); // Refresca el stock de productos

        } catch (error) { 
            // --- 7. Manejo de Errores (Error Handler) ---
            // La petición `fetchData` lanzó un error (ej. error de red, 500, 409).
            // `fetchData` ya formatea el `error.message` con el detalle de la API.
            mostrarMensaje(compraMensaje, `Error: ${error.message}`, false);
        } 
        finally { 
            // --- 8. Limpieza (Cleanup) ---
            // Este bloque se ejecuta SIEMPRE, tanto en éxito como en error.
            
            // Restaura el texto original del botón.
            btnFinalizarCompra.textContent = 'Finalizar Compra'; 
            
            // Vuelve a llamar a renderizarCarrito():
            // 1. Si la compra fue exitosa: `carrito` está vacío -> renderizarCarrito() mantendrá el botón DESHABILITADO.
            // 2. Si la compra falló: `carrito` AÚN tiene items -> renderizarCarrito() RE-HABILITARÁ el botón.
            renderizarCarrito(); 
        }
    }

    // --- Inicialización y Asignación de Eventos ---

    // Carga inicial de datos.
    cargarProductos();
    cargarClientes(); 
    cargarProveedores(); // Esta función ahora también llena el selector de productos
    cargarHistorialVentas();

    // Asigna manejadores de eventos a formularios y botones estáticos.
    if (formNuevoCliente) formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    if (formNuevoProveedor) formNuevoProveedor.addEventListener('submit', handleNuevoProveedorSubmit);
    if (formNuevaDireccion) formNuevaDireccion.addEventListener('submit', handleNuevaDireccionSubmit); 
    if (btnFinalizarCompra) btnFinalizarCompra.addEventListener('click', handleFinalizarCompraClick);
    
    // --- NUEVOS LISTENERS ---
    if (selectorTipoProducto) selectorTipoProducto.addEventListener('change', handleTipoProductoChange);
    if (formNuevoProducto) formNuevoProducto.addEventListener('submit', handleNuevoProductoSubmit);
    if (btnCancelarEdicionProducto) {
    btnCancelarEdicionProducto.addEventListener('click', resetFormularioProducto);
    }
    
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