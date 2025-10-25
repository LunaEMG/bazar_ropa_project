// Espera a que todo el contenido del HTML esté completamente cargado y listo
document.addEventListener("DOMContentLoaded", () => {
    
    // --- IMPORTANTE: Reemplaza esta URL con la URL de tu API en Render ---
    // Esta es la dirección donde tu backend (FastAPI) está alojado en internet.
    const API_URL = 'https://bazar-ropa-project-lunaemg.onrender.com'; 

    // Obtiene una referencia al div donde mostraremos los productos
    const listaDeProductos = document.getElementById('productos-lista');

    // Muestra un mensaje inicial mientras se cargan los datos
    listaDeProductos.innerHTML = '<p>Cargando productos...</p>';

    // Hacemos la petición (fetch) a la ruta de tu API que devuelve todos los productos
    fetch(`${API_URL}/api/productos`)
        .then(response => {
            // Primero, verificamos si la respuesta del servidor fue exitosa (código 200-299)
            if (!response.ok) { 
                // Si hubo un error (ej. 404, 500), lanzamos un error para ir al .catch()
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            // Si la respuesta fue exitosa, la convertimos de JSON a un objeto JavaScript
            return response.json(); 
        })
        .then(productos => {
            // Una vez que tenemos la lista de productos (o un array vacío)...
            
            // Limpiamos el mensaje de "Cargando..."
            listaDeProductos.innerHTML = ''; 
            
            // Verificamos si la lista de productos está vacía
            if (!productos || productos.length === 0) {
                listaDeProductos.innerHTML = '<p>No hay productos disponibles en este momento.</p>';
                return; // Terminamos la ejecución aquí si no hay productos
            }

            // Si hay productos, recorremos cada uno de ellos
            productos.forEach(producto => {
                // Creamos un nuevo elemento div para cada producto
                const item = document.createElement('div');
                item.className = 'producto-item'; // Le asignamos la clase CSS para el estilo

                // Creamos el contenido HTML para la tarjeta del producto
                // Usamos plantillas literales (backticks ``) para insertar fácilmente las variables
                // .toFixed(2) asegura que el precio siempre tenga dos decimales
                item.innerHTML = `
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion || 'Sin descripción'}</p> 
                    <p class="precio">$${producto.precio.toFixed(2)}</p>
                `;
                
                // Añadimos la tarjeta del producto al contenedor en el HTML
                listaDeProductos.appendChild(item);
            });
        })
        .catch(error => {
            // Si ocurre cualquier error durante el fetch o el procesamiento...
            console.error('Error detallado al cargar los productos:', error); // Muestra el error en la consola del navegador
            // Mostramos un mensaje de error claro al usuario en la página
            listaDeProductos.innerHTML = `<p style="color: red;">Error al cargar productos: ${error.message}. Por favor, inténtalo más tarde.</p>`;
        });
});