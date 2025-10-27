// Espera a que el DOM esté completamente cargado antes de ejecutar el script.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuración ---
    const API_URL = 'https://bazar-ropa-project-lunaemg.onrender.com'; 

    // Referencias a los elementos del DOM.
    const listaDeProductos = document.getElementById('productos-lista');
    const listaDeClientes = document.getElementById('clientes-lista');
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
    // Nuevas referencias para la sección de direcciones
    const direccionesClienteDiv = document.getElementById('direcciones-cliente'); 
    const listaDireccionesCliente = document.getElementById('lista-direcciones-cliente');
    const formNuevaDireccion = document.getElementById('form-nueva-direccion');
    const direccionMensaje = document.getElementById('direccion-mensaje');
    const nombreClienteSeleccionadoSpan = document.getElementById('nombre-cliente-seleccionado');
    const idClienteDireccionInput = document.getElementById('id-cliente-direccion'); // Input oculto

    // --- Estado de la Aplicación ---
    let carrito = []; // Almacena items: { id_producto, nombre, precio, cantidad }
    let clienteSeleccionadoId = null; // Almacena el ID del cliente seleccionado para ver/añadir direcciones

    // --- Funciones Auxiliares ---

    /** Muestra un mensaje temporal (éxito/error) en un elemento específico. */
    function mostrarMensaje(elemento, mensaje, exito = true) {
        if (!elemento) return; 
        elemento.textContent = mensaje;
        elemento.className = exito ? 'mensaje exito visible' : 'mensaje error visible';
        setTimeout(() => {
            if (elemento) { // Verifica si el elemento aún existe
                elemento.textContent = '';
                elemento.className = 'mensaje';
            }
        }, 3500);
    }

    // --- Funciones de Carga de Datos ---

    /** Carga y muestra la lista de productos. */
    function cargarProductos() { /* ... (código existente sin cambios) ... */ 
        if (!listaDeProductos) return;
        listaDeProductos.innerHTML = '<p>Cargando productos...</p>';
        fetch(`${API_URL}/api/productos`)
            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
            .then(productos => {
                listaDeProductos.innerHTML = ''; 
                if (!productos || productos.length === 0) { listaDeProductos.innerHTML = '<p>No hay productos disponibles.</p>'; return; }
                productos.forEach(producto => {
                    const item = document.createElement('div'); item.className = 'producto-item';
                    item.innerHTML = `<h3>${producto.nombre}</h3><p>${producto.descripcion || 'Sin descripción'}</p><p class="precio">$${producto.precio.toFixed(2)}</p><button class="btn-add-carrito" data-id="${producto.id_producto}" data-nombre="${producto.nombre}" data-precio="${producto.precio}">Añadir al Carrito</button>`;
                    const addButton = item.querySelector('.btn-add-carrito'); if (addButton) { addButton.addEventListener('click', handleAddCarritoClick); }
                    listaDeProductos.appendChild(item);
                });
            })
            .catch(error => { console.error('Error al cargar productos:', error); listaDeProductos.innerHTML = `<p style="color: red;">Error al cargar productos: ${error.message}</p>`; });
    }

    /** Carga y muestra la lista de clientes y puebla el selector. */
    function cargarClientes() { /* ... (código existente sin cambios) ... */ 
        if (!listaDeClientes || !selectorCliente) return;
        listaDeClientes.innerHTML = '<p>Cargando clientes...</p>';
        selectorCliente.innerHTML = '<option value="">Seleccione un cliente...</option>'; 
        fetch(`${API_URL}/api/clientes`)
            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
            .then(clientes => {
                listaDeClientes.innerHTML = ''; 
                if (!clientes || clientes.length === 0) { listaDeClientes.innerHTML = '<p>No hay clientes registrados.</p>'; return; }
                const ul = document.createElement('ul');
                clientes.forEach(cliente => {
                    const li = document.createElement('li'); li.innerHTML = `<span>${cliente.nombre}</span> <span>${cliente.telefono || 'Sin teléfono'}</span>`;
                    // Añadir botón/enlace para ver direcciones
                    const btnVerDirecciones = document.createElement('button');
                    btnVerDirecciones.textContent = 'Ver/Añadir Direcciones';
                    btnVerDirecciones.onclick = () => mostrarSeccionDirecciones(cliente.id_cliente, cliente.nombre);
                    li.appendChild(btnVerDirecciones); // Añade el botón al item de la lista
                    ul.appendChild(li);

                    const option = document.createElement('option'); option.value = cliente.id_cliente; option.textContent = cliente.nombre;
                    selectorCliente.appendChild(option);
                });
                listaDeClientes.appendChild(ul);
            })
            .catch(error => { console.error('Error al cargar clientes:', error); listaDeClientes.innerHTML = `<p style="color: red;">Error al cargar clientes: ${error.message}</p>`; });
    }

    /** Carga y muestra la lista de proveedores. */
    function cargarProveedores() { /* ... (código existente sin cambios) ... */ 
        if (!listaDeProveedores) return; 
        listaDeProveedores.innerHTML = '<p>Cargando proveedores...</p>';
        fetch(`${API_URL}/api/proveedores`)
            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
            .then(proveedores => {
                listaDeProveedores.innerHTML = ''; 
                if (!proveedores || proveedores.length === 0) { listaDeProveedores.innerHTML = '<p>No hay proveedores registrados.</p>'; return; }
                const ul = document.createElement('ul');
                proveedores.forEach(proveedor => {
                    const li = document.createElement('li'); li.innerHTML = `<span>${proveedor.nombre}</span> <span>${proveedor.telefono || 'Sin teléfono'}</span>`;
                    ul.appendChild(li);
                });
                listaDeProveedores.appendChild(ul);
            })
            .catch(error => { console.error('Error al cargar proveedores:', error); listaDeProveedores.innerHTML = `<p style="color: red;">Error al cargar proveedores: ${error.message}</p>`; });
    }

    /** NUEVA Función: Carga y muestra las direcciones de un cliente específico. */
    function cargarDireccionesCliente(clienteId) {
        if (!listaDireccionesCliente) return;

        listaDireccionesCliente.innerHTML = '<p>Cargando direcciones...</p>';

        // Llama al nuevo endpoint de la API
        fetch(`${API_URL}/api/clientes/${clienteId}/direcciones`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(direcciones => {
                listaDireccionesCliente.innerHTML = ''; // Limpia mensaje
                if (!direcciones || direcciones.length === 0) {
                    listaDireccionesCliente.innerHTML = '<p>Este cliente no tiene direcciones registradas.</p>';
                    return;
                }
                // Crea una lista ul para las direcciones
                const ul = document.createElement('ul');
                direcciones.forEach(dir => {
                    const li = document.createElement('li');
                    // Muestra los detalles de la dirección
                    li.innerHTML = `
                        <span>${dir.calle}</span>
                        <span>${dir.ciudad}, CP ${dir.codigo_postal}</span>
                        `; 
                        // Aquí podrías añadir botones de editar/eliminar si implementas esas rutas
                    ul.appendChild(li);
                });
                listaDireccionesCliente.appendChild(ul);
            })
            .catch(error => {
                console.error(`Error al cargar direcciones para cliente ${clienteId}:`, error);
                listaDireccionesCliente.innerHTML = `<p style="color: red;">Error al cargar direcciones: ${error.message}</p>`;
            });
    }

    /** NUEVA Función: Muestra la sección de direcciones para un cliente. */
    function mostrarSeccionDirecciones(clienteId, nombreCliente) {
         if (!direccionesClienteDiv || !nombreClienteSeleccionadoSpan || !idClienteDireccionInput) return;
         
         clienteSeleccionadoId = clienteId; // Guarda el ID del cliente actual
         nombreClienteSeleccionadoSpan.textContent = nombreCliente; // Muestra el nombre
         idClienteDireccionInput.value = clienteId; // Pone el ID en el input oculto del formulario
         direccionesClienteDiv.style.display = 'block'; // Hace visible la sección
         cargarDireccionesCliente(clienteId); // Carga las direcciones
    }


    // --- Funciones del Carrito ---
    function renderizarCarrito() { /* ... (código existente sin cambios) ... */ 
        if (!carritoItemsDiv || !carritoTotalSpan || !btnFinalizarCompra) return;
        carritoItemsDiv.innerHTML = ''; 
        let total = 0;
        if (carrito.length === 0) { carritoItemsDiv.innerHTML = '<p>El carrito está vacío.</p>'; btnFinalizarCompra.disabled = true; } 
        else {
            carrito.forEach(item => {
                const itemDiv = document.createElement('div'); itemDiv.className = 'carrito-item'; 
                itemDiv.innerHTML = `<span class="item-nombre">${item.nombre}</span><span class="item-cantidad">x ${item.cantidad}</span><span class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</span><button class="btn-remove-carrito" data-id="${item.id_producto}" style="color: red; background: none; border: none; cursor: pointer;">X</button>`;
                const removeButton = itemDiv.querySelector('.btn-remove-carrito'); if (removeButton) { removeButton.addEventListener('click', handleRemoveCarritoClick); } else { console.error("Error: Botón remover no encontrado:", item); }
                carritoItemsDiv.appendChild(itemDiv); total += item.precio * item.cantidad;
            });
            btnFinalizarCompra.disabled = false; 
        }
        carritoTotalSpan.textContent = total.toFixed(2); 
    }
    function handleAddCarritoClick(event) { /* ... (código existente sin cambios) ... */ 
        const button = event.target; const idProducto = parseInt(button.dataset.id); const nombre = button.dataset.nombre; const precio = parseFloat(button.dataset.precio); 
        const itemExistente = carrito.find(item => item.id_producto === idProducto);
        if (itemExistente) { itemExistente.cantidad++; } else { carrito.push({ id_producto: idProducto, nombre, precio, cantidad: 1 }); }
        renderizarCarrito(); 
    }
    function handleRemoveCarritoClick(event) { /* ... (código existente sin cambios) ... */ 
        const button = event.target; const idProducto = parseInt(button.dataset.id);
        carrito = carrito.filter(item => item.id_producto !== idProducto); renderizarCarrito(); 
    }


    // --- Funciones de Interacción con API ---

    /** Maneja el envío del formulario para crear un nuevo cliente. */
    function handleNuevoClienteSubmit(event) { /* ... (código existente sin cambios) ... */ 
        event.preventDefault(); if (!formNuevoCliente || !clienteMensaje) return;
        const formData = new FormData(formNuevoCliente); const nombre = formData.get('nombre'); const telefono = formData.get('telefono') || null; 
        const submitButton = formNuevoCliente.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Registrando...';
        fetch(`${API_URL}/api/clientes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, telefono }), })
        .then(response => { if (!response.ok) return response.json().then(err => { throw new Error(err.detail || `HTTP error! status: ${response.status}`) }); return response.json(); })
        .then(nuevoCliente => { mostrarMensaje(clienteMensaje, `Cliente "${nuevoCliente.nombre}" registrado!`, true); formNuevoCliente.reset(); cargarClientes(); })
        .catch(error => { console.error('Error al registrar cliente:', error); mostrarMensaje(clienteMensaje, `Error: ${error.message}`, false); })
        .finally(() => { submitButton.disabled = false; submitButton.textContent = 'Registrar Cliente'; });
    }

    /** Maneja el envío del formulario para crear un nuevo proveedor. */
    function handleNuevoProveedorSubmit(event) { /* ... (código existente sin cambios) ... */ 
        event.preventDefault(); if (!formNuevoProveedor || !proveedorMensaje) return; 
        const formData = new FormData(formNuevoProveedor); const nombre = formData.get('nombre'); const telefono = formData.get('telefono') || null; 
        const submitButton = formNuevoProveedor.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Registrando...';
        fetch(`${API_URL}/api/proveedores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nombre, telefono: telefono }), })
        .then(response => { if (!response.ok) { return response.json().then(err => { throw new Error(err.detail || `HTTP error! status: ${response.status}`) }); } return response.json(); })
        .then(nuevoProveedor => { mostrarMensaje(proveedorMensaje, `Proveedor "${nuevoProveedor.nombre}" registrado!`, true); formNuevoProveedor.reset(); cargarProveedores(); })
        .catch(error => { console.error('Error al registrar proveedor:', error); mostrarMensaje(proveedorMensaje, `Error: ${error.message}`, false); })
        .finally(() => { submitButton.disabled = false; submitButton.textContent = 'Registrar Proveedor'; });
    }
    
    /** NUEVA Función: Maneja el envío del formulario para añadir una dirección. */
    function handleNuevaDireccionSubmit(event) {
        event.preventDefault(); // Evita recarga
        if (!formNuevaDireccion || !direccionMensaje || clienteSeleccionadoId === null) return;

        const formData = new FormData(formNuevaDireccion);
        const calle = formData.get('calle');
        const ciudad = formData.get('ciudad');
        const codigo_postal = formData.get('codigo_postal');

        const submitButton = formNuevaDireccion.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Añadiendo...';

        // Llama al endpoint POST /api/clientes/{cliente_id}/direcciones
        fetch(`${API_URL}/api/clientes/${clienteSeleccionadoId}/direcciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calle, ciudad, codigo_postal }), // Envía los datos de la dirección
        })
        .then(response => {
            if (!response.ok) return response.json().then(err => { throw new Error(err.detail || `HTTP error! status: ${response.status}`) });
            return response.json(); 
        })
        .then(nuevaDireccion => {
            mostrarMensaje(direccionMensaje, `Dirección añadida con éxito!`, true);
            formNuevaDireccion.reset(); // Limpia el formulario
            // Recarga solo la lista de direcciones para el cliente actual
            cargarDireccionesCliente(clienteSeleccionadoId); 
        })
        .catch(error => {
            console.error('Error al añadir dirección:', error);
            mostrarMensaje(direccionMensaje, `Error: ${error.message}`, false);
        })
        .finally(() => {
             submitButton.disabled = false;
             submitButton.textContent = 'Añadir Dirección';
        });
    }

    /** Maneja el clic en "Finalizar Compra". */
    function handleFinalizarCompraClick() { /* ... (código existente sin cambios) ... */ 
        if (!selectorCliente || !btnFinalizarCompra || !compraMensaje) return;
        const idClienteSeleccionado = selectorCliente.value;
        if (!idClienteSeleccionado) { mostrarMensaje(compraMensaje, "Seleccione un cliente.", false); return; }
        if (carrito.length === 0) { mostrarMensaje(compraMensaje, "El carrito está vacío.", false); return; }
        const ventaData = { id_cliente: parseInt(idClienteSeleccionado), detalles: carrito.map(item => ({ id_producto: item.id_producto, cantidad: item.cantidad, precio_unitario: item.precio })) };
        btnFinalizarCompra.disabled = true; btnFinalizarCompra.textContent = 'Procesando...';
        fetch(`${API_URL}/api/ventas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ventaData), })
        .then(response => { if (!response.ok) return response.json().then(err => { throw new Error(err.detail || `Error ${response.status}: No se pudo registrar.`); }); return response.json(); })
        .then(ventaCreada => { mostrarMensaje(compraMensaje, `Venta #${ventaCreada.id_venta} registrada! Total: $${ventaCreada.monto_total.toFixed(2)}`, true); carrito = []; renderizarCarrito(); selectorCliente.value = ""; })
        .catch(error => { console.error('Error al finalizar compra:', error); mostrarMensaje(compraMensaje, `Error: ${error.message}`, false); })
        .finally(() => { btnFinalizarCompra.textContent = 'Finalizar Compra'; renderizarCarrito(); });
    }

    // --- Inicialización y Asignación de Eventos ---

    // Carga inicial de datos.
    cargarProductos();
    cargarClientes(); 
    cargarProveedores(); 

    // Asigna manejadores de eventos a los formularios y botones.
    if (formNuevoCliente) formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    if (formNuevoProveedor) formNuevoProveedor.addEventListener('submit', handleNuevoProveedorSubmit);
    // NUEVA asignación para el formulario de direcciones
    if (formNuevaDireccion) formNuevaDireccion.addEventListener('submit', handleNuevaDireccionSubmit); 
    if (btnFinalizarCompra) btnFinalizarCompra.addEventListener('click', handleFinalizarCompraClick);
    
    // Llama inicial para renderizar estado vacío del carrito.
    renderizarCarrito();

}); // Fin del addEventListener DOMContentLoaded