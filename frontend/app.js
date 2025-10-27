// Espera a que el DOM esté completamente cargado.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuración ---
    const API_URL = 'https://bazar-ropa-project-lunaemg.onrender.com'; 
    const listaDeProductos = document.getElementById('productos-lista');
    const listaDeClientes = document.getElementById('clientes-lista');
    const formNuevoCliente = document.getElementById('form-nuevo-cliente');
    const clienteMensaje = document.getElementById('cliente-mensaje');
    const carritoItemsDiv = document.getElementById('carrito-items');
    const carritoTotalSpan = document.getElementById('carrito-total');
    const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');
    const compraMensaje = document.getElementById('compra-mensaje');
    const selectorCliente = document.getElementById('selector-cliente');

    // --- Estado de la Aplicación (Carrito) ---
    let carrito = []; // Array para almacenar los items { id_producto, nombre, precio, cantidad }

    // --- Funciones Auxiliares ---

    /** Muestra un mensaje temporal (éxito/error) en un área específica. */
    function mostrarMensaje(elemento, mensaje, exito = true) {
        elemento.textContent = mensaje;
        elemento.className = exito ? 'mensaje exito visible' : 'mensaje error visible';
        setTimeout(() => {
            elemento.textContent = '';
            elemento.className = 'mensaje';
        }, 3500); // Aumentado a 3.5 segundos
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
                    // Añade el event listener al botón recién creado
                    item.querySelector('.btn-add-carrito').addEventListener('click', handleAddCarritoClick);
                    listaDeProductos.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error al cargar productos:', error);
                listaDeProductos.innerHTML = `<p style="color: red;">Error al cargar productos: ${error.message}</p>`;
            });
    }

    /** Carga y muestra la lista de clientes desde la API y llena el selector. */
    function cargarClientes() {
        if (!listaDeClientes || !selectorCliente) return;

        listaDeClientes.innerHTML = '<p>Cargando clientes...</p>';
        selectorCliente.innerHTML = '<option value="">Seleccione un cliente...</option>'; // Limpia y añade opción por defecto

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
                    // Añade cliente a la lista visible
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${cliente.nombre}</span> <span>${cliente.telefono || 'Sin teléfono'}</span>`;
                    ul.appendChild(li);
                    // Añade cliente como opción en el selector
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

    // --- Funciones del Carrito ---

    /** Actualiza la visualización del carrito en el HTML y el total. */
    function renderizarCarrito() {
        carritoItemsDiv.innerHTML = ''; // Limpia la vista actual
        let total = 0;

        if (carrito.length === 0) {
            carritoItemsDiv.innerHTML = '<p>El carrito está vacío.</p>';
            btnFinalizarCompra.disabled = true; // Deshabilita el botón si no hay items
        } else {
            carrito.forEach(item => {
                const itemDiv = document.createElement('div');
                item.className = 'carrito-item';
                item.innerHTML = `
                    <span class="item-nombre">${item.nombre}</span>
                    <span class="item-cantidad">x ${item.cantidad}</span>
                    <span class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</span>
                    <button class="btn-remove-carrito" data-id="${item.id_producto}" style="color: red; background: none; border: none; cursor: pointer;">X</button> 
                `;
                // Añade event listener al botón de remover
                itemDiv.querySelector('.btn-remove-carrito').addEventListener('click', handleRemoveCarritoClick);
                carritoItemsDiv.appendChild(itemDiv);
                total += item.precio * item.cantidad;
            });
            btnFinalizarCompra.disabled = false; // Habilita el botón si hay items
        }
        carritoTotalSpan.textContent = total.toFixed(2); // Actualiza el total en el HTML
    }

    /** Manejador para el clic en "Añadir al Carrito". */
    function handleAddCarritoClick(event) {
        const button = event.target;
        const idProducto = parseInt(button.dataset.id); // Convierte a número
        const nombre = button.dataset.nombre;
        const precio = parseFloat(button.dataset.precio); // Convierte a número flotante

        // Busca si el producto ya está en el carrito
        const itemExistente = carrito.find(item => item.id_producto === idProducto);

        if (itemExistente) {
            itemExistente.cantidad++; // Si existe, incrementa la cantidad
        } else {
            // Si no existe, lo añade al carrito
            carrito.push({ id_producto: idProducto, nombre, precio, cantidad: 1 });
        }
        
        renderizarCarrito(); // Actualiza la vista del carrito
    }

     /** Manejador para el clic en el botón "X" para remover item del carrito. */
    function handleRemoveCarritoClick(event) {
        const button = event.target;
        const idProducto = parseInt(button.dataset.id);

        // Filtra el carrito, manteniendo todos los items EXCEPTO el que coincide con el ID
        carrito = carrito.filter(item => item.id_producto !== idProducto);

        renderizarCarrito(); // Actualiza la vista del carrito
    }


    // --- Funciones de Interacción con API ---

    /** Maneja el envío del formulario para crear un nuevo cliente. */
    function handleNuevoClienteSubmit(event) {
        event.preventDefault(); 
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
            cargarClientes(); // Recarga la lista Y el selector de clientes
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

    /** Maneja el clic en el botón "Finalizar Compra". */
    function handleFinalizarCompraClick() {
        const idClienteSeleccionado = selectorCliente.value;

        // Validación simple
        if (!idClienteSeleccionado) {
            mostrarMensaje(compraMensaje, "Por favor, seleccione un cliente.", false);
            return;
        }
        if (carrito.length === 0) {
            mostrarMensaje(compraMensaje, "El carrito está vacío.", false);
            return;
        }

        // Prepara los datos para enviar a la API según el schema VentaCreate
        const ventaData = {
            id_cliente: parseInt(idClienteSeleccionado),
            detalles: carrito.map(item => ({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: item.precio // Usa el precio guardado en el carrito
            }))
        };

        // Deshabilita botón durante el proceso
        btnFinalizarCompra.disabled = true;
        btnFinalizarCompra.textContent = 'Procesando...';

        fetch(`${API_URL}/api/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData),
        })
        .then(response => {
             if (!response.ok) {
                // Intenta obtener más detalles del error si la API los envía
                return response.json().then(err => { 
                    throw new Error(err.detail || `Error ${response.status}: No se pudo registrar la venta.`);
                });
            }
            return response.json(); // La API devuelve la venta creada
        })
        .then(ventaCreada => {
            mostrarMensaje(compraMensaje, `Venta #${ventaCreada.id_venta} registrada con éxito! Total: $${ventaCreada.monto_total.toFixed(2)}`, true);
            carrito = []; // Vacía el carrito local
            renderizarCarrito(); // Actualiza la vista del carrito (ahora vacío)
            selectorCliente.value = ""; // Resetea el selector de cliente
        })
        .catch(error => {
            console.error('Error al finalizar compra:', error);
            mostrarMensaje(compraMensaje, `Error: ${error.message}`, false);
        })
        .finally(() => {
            // Vuelve a habilitar el botón
            // (Se re-habilitará automáticamente por renderizarCarrito si el carrito no está vacío)
            if (carrito.length > 0) btnFinalizarCompra.disabled = false; 
            btnFinalizarCompra.textContent = 'Finalizar Compra';
        });
    }

    // --- Inicialización y Asignación de Eventos ---

    // Carga inicial de datos al cargar la página.
    cargarProductos();
    cargarClientes(); // Carga clientes en la lista y en el selector desplegable

    // Asigna el manejador de eventos al formulario de nuevo cliente.
    if (formNuevoCliente) {
        formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    }

    // Asigna el manejador de eventos al botón de finalizar compra.
    if (btnFinalizarCompra) {
        btnFinalizarCompra.addEventListener('click', handleFinalizarCompraClick);
    }

    // Llama a renderizarCarrito una vez al inicio para mostrar "El carrito está vacío."
    renderizarCarrito();

}); // Fin del addEventListener DOMContentLoaded