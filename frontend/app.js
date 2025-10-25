// Espera a que el DOM esté completamente cargado antes de ejecutar el script.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuración ---
    // URL base de la API desplegada en Render.
    const API_URL = 'https://bazar-ropa-project-lunaemg.onrender.com'; 

    // Referencias a los elementos del DOM donde mostraremos los datos.
    const listaDeProductos = document.getElementById('productos-lista');
    const listaDeClientes = document.getElementById('clientes-lista');
    const formNuevoCliente = document.getElementById('form-nuevo-cliente');
    const clienteMensaje = document.getElementById('cliente-mensaje');

    // --- Funciones ---

    /**
     * Muestra un mensaje temporal en el área designada.
     * @param {string} mensaje - El texto a mostrar.
     * @param {boolean} exito - True si es un mensaje de éxito, false si es de error.
     */
    function mostrarMensajeCliente(mensaje, exito = true) {
        clienteMensaje.textContent = mensaje;
        clienteMensaje.className = exito ? 'mensaje exito' : 'mensaje error'; // Aplica clase CSS
        // Oculta el mensaje después de 3 segundos
        setTimeout(() => {
            clienteMensaje.textContent = '';
            clienteMensaje.className = 'mensaje';
        }, 3000);
    }

    /**
     * Carga y muestra la lista de productos desde la API.
     */
    function cargarProductos() {
        if (!listaDeProductos) return; // Si el elemento no existe, no hace nada

        listaDeProductos.innerHTML = '<p>Cargando productos...</p>';

        fetch(`${API_URL}/api/productos`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(productos => {
                listaDeProductos.innerHTML = ''; // Limpia el mensaje de carga
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
                    `;
                    listaDeProductos.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error al cargar productos:', error);
                listaDeProductos.innerHTML = `<p style="color: red;">Error al cargar productos: ${error.message}</p>`;
            });
    }

    /**
     * Carga y muestra la lista de clientes desde la API.
     */
    function cargarClientes() {
        if (!listaDeClientes) return; // Si el elemento no existe, no hace nada

        listaDeClientes.innerHTML = '<p>Cargando clientes...</p>';

        fetch(`${API_URL}/api/clientes`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(clientes => {
                listaDeClientes.innerHTML = ''; // Limpia el mensaje de carga
                if (!clientes || clientes.length === 0) {
                    listaDeClientes.innerHTML = '<p>No hay clientes registrados.</p>';
                    return;
                }
                const ul = document.createElement('ul');
                clientes.forEach(cliente => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${cliente.nombre}</span> <span>${cliente.telefono || 'Sin teléfono'}</span>`;
                    ul.appendChild(li);
                });
                listaDeClientes.appendChild(ul);
            })
            .catch(error => {
                console.error('Error al cargar clientes:', error);
                listaDeClientes.innerHTML = `<p style="color: red;">Error al cargar clientes: ${error.message}</p>`;
            });
    }

    /**
     * Maneja el envío del formulario para crear un nuevo cliente.
     * @param {Event} event - El evento de envío del formulario.
     */
    function handleNuevoClienteSubmit(event) {
        event.preventDefault(); // Evita que la página se recargue

        const formData = new FormData(formNuevoCliente);
        const nombre = formData.get('nombre');
        const telefono = formData.get('telefono') || null; // Enviar null si está vacío

        // Deshabilita el botón mientras se envía para evitar doble click
        const submitButton = formNuevoCliente.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        fetch(`${API_URL}/api/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre: nombre, telefono: telefono }),
        })
        .then(response => {
            if (!response.ok) {
                // Si el servidor devuelve un error, intenta leer el detalle
                return response.json().then(err => { throw new Error(err.detail || `HTTP error! status: ${response.status}`) });
            }
            return response.json(); // Convierte la respuesta exitosa a JSON
        })
        .then(nuevoCliente => {
            mostrarMensajeCliente(`Cliente "${nuevoCliente.nombre}" registrado con éxito!`, true);
            formNuevoCliente.reset(); // Limpia el formulario
            cargarClientes(); // Recarga la lista de clientes para mostrar el nuevo
        })
        .catch(error => {
            console.error('Error al registrar cliente:', error);
            mostrarMensajeCliente(`Error al registrar: ${error.message}`, false);
        })
        .finally(() => {
             // Vuelve a habilitar el botón y restaura su texto
             submitButton.disabled = false;
             submitButton.textContent = 'Registrar Cliente';
        });
    }

    // --- Inicialización ---

    // Llama a las funciones para cargar los datos iniciales cuando la página carga.
    cargarProductos();
    cargarClientes();

    // Añade el 'escuchador' de eventos al formulario de nuevo cliente.
    if (formNuevoCliente) {
        formNuevoCliente.addEventListener('submit', handleNuevoClienteSubmit);
    }

}); // Fin del addEventListener DOMContentLoaded