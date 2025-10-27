// Espera a que el DOM esté completamente cargado antes de ejecutar el script.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuración ---
    // URL base de la API desplegada en Render.
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
    // Nuevas referencias para el formulario de proveedor
    const formNuevoProveedor = document.getElementById('form-nuevo-proveedor'); 
    const proveedorMensaje = document.getElementById('proveedor-mensaje'); 

    // --- Estado de la Aplicación (Carrito) ---
    let carrito = []; // Almacena items: { id_producto, nombre, precio, cantidad }

    // --- Funciones Auxiliares ---

    /** Muestra un mensaje temporal (éxito/error) en un elemento específico. */
    function mostrarMensaje(elemento, mensaje, exito = true) {
        if (!elemento) return; 
        elemento.textContent = mensaje;
        elemento.className = exito ? 'mensaje exito visible' : 'mensaje error visible';
        setTimeout(() => {
            elemento.textContent = '';
            elemento.className = 'mensaje';
        }, 3500);
    }

    // --- Funciones de Carga de Datos ---

    /** Carga y muestra la lista de productos desde la API. */
    function cargarProductos() {
        if (!listaDeProductos) return;
        listaDeProductos.innerHTML = '<p>Cargando productos...</p>';

        fetch(`${API_URL}/api/productos`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(productos => {
                listaDeProductos.innerHTML = ''; 
                if (!productos || productos.length === 0) {
                    listaDeProductos.innerHTML = '<p>No hay productos disponibles.</p>';
                    return;
                }
                productos.forEach(producto => {
                    const item = document.createElement('div');
                    item.className = 'producto-item';
                    item.innerHTML = `
                        <h3>${producto.nombre}</h3>
                        <p>${producto.descripcion || 'Sin descripción'}</p>
                        <p class="precio">$${producto.precio.toFixed(2)}</p>
                        <button class="btn-add-carrito" data-id="${producto.id_producto}" data-nombre="${producto.nombre}" data-precio="${producto.precio}">Añadir al Carrito</button>
                    `;
                    const addButton = item.querySelector('.btn-add-carrito');
                    if (addButton) {
                        addButton.addEventListener('click', handleAddCarritoClick);
                    }
                    listaDeProductos.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error al cargar productos:', error);
                listaDeProductos.innerHTML = `<p style="color: red;">Error al cargar productos: ${error.message}</p>`;
            });
    }

    /** Carga y muestra la lista de clientes desde la API y puebla el selector. */
    function cargarClientes() {
        if (!listaDeClientes || !selectorCliente) return;

        listaDeClientes.innerHTML = '<p>Cargando clientes...</p>';
        selectorCliente.innerHTML = '<option value="">Seleccione un cliente...</option>'; 

        fetch(`${API_URL}/api/clientes`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(clientes => {
                listaDeClientes.innerHTML = ''; 
                if (!clientes || clientes.length === 0) {
                    listaDeClientes.innerHTML = '<p>No hay clientes registrados.</p>';
                    return;
                }
                const ul = document.createElement('ul');
                clientes.forEach(cliente => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${cliente.nombre}</span> <span>${cliente.telefono || 'Sin teléfono'}</span>`;
                    ul.appendChild(li);
                    const option = document.createElement('option');
                    option.value = cliente.id_cliente;
                    option.textContent = cliente.nombre;
                    selectorCliente.appendChild(option);
                });
                listaDeClientes.appendChild(ul);
            })
            .catch(error => {
                console.error('Error al cargar clientes:', error);
                listaDeClientes.innerHTML = `<p style="color: red;">Error al cargar clientes: ${error.message}</p>`;
            });
    }

    /** Carga y muestra la lista de proveedores desde la API. */
    function cargarProveedores() {
        if (!listaDeProveedores) return; 

        listaDeProveedores.innerHTML = '<p>Cargando proveedores...</p>';

        fetch(`${API_URL}/api/proveedores`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(proveedores => {
                listaDeProveedores.innerHTML = ''; 
                if (!proveedores || proveedores.length === 0) {
                    listaDeProveedores.innerHTML = '<p>No hay proveedores registrados.</p>';
                    return;
                }
                const ul = document.createElement('ul');
                proveedores.forEach(proveedor => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${proveedor.nombre}</span> <span>${proveedor.telefono || 'Sin teléfono'}</span>`;
                    ul.appendChild(li);
                });
                listaDeProveedores.appendChild(ul);
            })
            .catch(error => {
                console.error('Error al cargar proveedores:', error);
                listaDeProveedores.innerHTML = `<p style="color: red;">Error al cargar proveedores: ${error.message}</p>`;
            });
    }

    // --- Funciones del Carrito ---

    /** Actualiza la vista del carrito en el HTML y calcula el total. */
    function renderizarCarrito() {
        if (!carritoItemsDiv || !carritoTotalSpan || !btnFinalizarCompra) return;

        carritoItemsDiv.innerHTML = ''; 
        let total = 0;

        if (carrito.length === 0) {
            carritoItemsDiv.innerHTML = '<p>El carrito está vacío.</p>';
            btnFinalizarCompra.disabled = true; 
        } else {
            carrito.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'carrito-item'; 

                itemDiv.innerHTML = `
                    <span class="item-nombre">${item.nombre}</span>
                    <span class="item-cantidad">x ${item.cantidad}</span>
                    <span class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</span>
                    <button class="btn-remove-carrito" data-id="${item.id_producto}" style="color: red; background: none; border: none; cursor: pointer;">X</button> 
                `;
                
                const removeButton = itemDiv.querySelector('.btn-remove-carrito');
                if (removeButton) {
                     removeButton.addEventListener('click', handleRemoveCarritoClick);
                } else {
                     console.error("Error: No se encontró el botón de remover para el item:", item); 
                }
                
                carritoItemsDiv.appendChild(itemDiv);
                total += item.precio * item.cantidad;
            });
            btnFinalizarCompra.disabled = false; 
        }
        carritoTotalSpan.textContent = total.toFixed(2); 
    }

    /** Maneja el clic en "Añadir al Carrito". */
    function handleAddCarritoClick(event) {
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
        renderizarCarrito(); 
    }

    /** Maneja el clic en el botón "X" para remover item del carrito. */
    function handleRemoveCarritoClick(event) {
        const button = event.target;
        const idProducto = parseInt(button.dataset.id);
        carrito = carrito.filter(item => item.id_producto !== idProducto);
        renderizarCarrito(); 
    }

    // --- Funciones de Interacción con API ---

    /** Maneja el envío del formulario para crear un nuevo cliente. */
    function handleNuevoClienteSubmit(event) {
        event.preventDefault(); 
        if (!formNuevoCliente || !clienteMensaje) return;

        const formData = new FormData(formNuevoCliente);
        const nombre = formData.get('nombre');
        const telefono = formData.get('telefono') || null; 
        const submitButton = formNuevoCliente.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        fetch(`${API_URL}/api/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono }),
        })
        .then(response => {
            if (!response.ok) return response.json().then(err => { throw new Error(err.detail || `HTTP error! status: ${response.status}`) });
            return response.json(); 
        })
        .then(nuevoCliente => {
            mostrarMensaje(clienteMensaje, `Cliente "${nuevoCliente.nombre}" registrado!`, true);
            formNuevoCliente.reset(); 
            cargarClientes(); // Recarga lista y selector
        })
        .catch(error => {
            console.error('Error al registrar cliente:', error);
            mostrarMensaje(clienteMensaje, `Error: ${error.message}`, false);
        })
        .finally(() => {
             submitButton.disabled = false;
             submitButton.textContent = 'Registrar Cliente';
        });
    }

    /** NUEVA Función: Maneja el envío del formulario para crear un nuevo proveedor. */
    function handleNuevoProveedorSubmit(event) {
        event.preventDefault(); // Evita recarga de página
        if (!formNuevoProveedor || !proveedorMensaje) return; // Verifica si los elementos existen

        const formData = new FormData(formNuevoProveedor);
        const nombre = formData.get('nombre');
        const telefono = formData.get('telefono') || null; // Obtiene datos del formulario

        const submitButton = formNuevoProveedor.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        // Llama al endpoint POST /api/proveedores
        fetch(`${API_URL}/api/proveedores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre: nombre, telefono: telefono }),
        })
        .then(response => {
            // Manejo de respuesta similar al de clientes
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.detail || `HTTP error! status: ${response.status}`) });
            }
            return response.json(); 
        })
        .then(nuevoProveedor => {
            // Muestra mensaje de éxito
            mostrarMensaje(proveedorMensaje, `Proveedor "${nuevoProveedor.nombre}" registrado con éxito!`, true);
            formNuevoProveedor.reset(); // Limpia el formulario
            cargarProveedores(); // Recarga la lista de proveedores
        })
        .catch(error => {
            // Muestra mensaje de error
            console.error('Error al registrar proveedor:', error);
            mostrarMensaje(proveedorMensaje, `Error al registrar: ${error.message}`, false);
        })
        .finally(() => {
             // Rehabilita el botón
             submitButton.disabled = false;
             submitButton.textContent = 'Registrar Proveedor';
        });
    }

    /** Maneja el clic en "Finalizar Compra". */
    function handleFinalizarCompraClick() {
        if (!selectorCliente || !btnFinalizarCompra || !compraMensaje) return;
        // ... (resto de la función sin cambios) ...
        const idClienteSeleccionado = selectorCliente.value;
        if (!idClienteSeleccionado) {
            mostrarMensaje(compraMensaje, "Por favor, seleccione un cliente.", false); return;
        }
        if (carrito.length === 0) {
            mostrarMensaje(compraMensaje, "El carrito está vacío.", false); return;
        }
        const ventaData = {
            id_cliente: parseInt(idClienteSeleccionado),
            detalles: carrito.map(item => ({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: item.precio 
            }))
        };
        btnFinalizarCompra.disabled = true;
        btnFinalizarCompra.textContent = 'Procesando...';
        fetch(`${API_URL}/api/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData),
        })
        .then(response => {
             if (!response.ok) return response.json().then(err => { throw new Error(err.detail || `Error ${response.status}: No se pudo registrar la venta.`); });
            return response.json(); 
        })
        .then(ventaCreada => {
            mostrarMensaje(compraMensaje, `Venta #${ventaCreada.id_venta} registrada! Total: $${ventaCreada.monto_total.toFixed(2)}`, true);
            carrito = []; 
            renderizarCarrito(); 
            selectorCliente.value = ""; 
        })
        .catch(error => {
            console.error('Error al finalizar compra:', error);
            mostrarMensaje(compraMensaje, `Error: ${error.message}`, false);
        })
        .finally(() => {
            btnFinalizarCompra.textContent = 'Finalizar Compra'; 
            renderizarCarrito(); 
        });
    }

    // --- Inicialización y Asignación de Eventos ---

    // Carga inicial de datos.
    cargarProductos();
    cargarClientes(); 
    cargarProveedores(); 

    // Asigna manejadores de eventos a los formularios y botones.
    if (formNuevoCliente) {
        formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    }
    // NUEVA asignación para el formulario de proveedores
    if (formNuevoProveedor) {
        formNuevoProveedor.addEventListener('submit', handleNuevoProveedorSubmit);
    }
    if (btnFinalizarCompra) {
        btnFinalizarCompra.addEventListener('click', handleFinalizarCompraClick);
    }

    // Llama inicial para renderizar estado vacío del carrito.
    renderizarCarrito();

});