/**
 * @file cart.js
 * @description Gestión del carrito de compras
 */

// Estado del carrito
export let carrito = [];

// Referencias DOM (se inicializan después)
let carritoItemsDiv;
let carritoTotalSpan;
let btnFinalizarCompra;

// Importar getUserRole desde auth (se configurará después para evitar dependencia circular)
let getUserRoleCallback = () => 'visualizacion';

/**
 * Obtiene el carrito actual (referencia viva)
 * @returns {Array} El array del carrito actual
 */
export function getCarrito() {
    return carrito;
}

/**
 * Inicializa las referencias DOM del carrito
 * @param {Object} elements - Elementos DOM necesarios
 */
export function initCartDOM(elements) {
    carritoItemsDiv = elements.carritoItemsDiv;
    carritoTotalSpan = elements.carritoTotalSpan;
    btnFinalizarCompra = elements.btnFinalizarCompra;
}

/**
 * Configura el callback para obtener el rol del usuario
 * @param {Function} callback - Función que retorna el rol del usuario
 */
export function setGetUserRoleCallback(callback) {
    getUserRoleCallback = callback;
}

/**
 * Actualiza la vista del carrito en el HTML y calcula el total
 */
export function renderizarCarrito() {
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
            const imagenHtml = item.imagen_url 
                ? `<img src="${item.imagen_url}" alt="${item.nombre}">` 
                : `<img src="https://via.placeholder.com/48?text=Img" alt="no-img">`;

            itemDiv.innerHTML = `
                <div class="item-info">
                    ${imagenHtml}
                    <span class="item-nombre">${item.nombre}</span>
                </div>
                
                <div class="qty-pill">
                    <button class="btn-qty btn-decrease-qty" data-id="${item.id_producto}">-</button>
                    <span class="item-cantidad">${item.cantidad}</span>
                    <button class="btn-qty btn-increase-qty" data-id="${item.id_producto}">+</button>
                </div>
                
                <span class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</span>
            `;

            // Añadimos listeners a los nuevos botones de cantidad
            itemDiv.querySelector('.btn-decrease-qty').addEventListener('click', handleDecreaseQuantity);
            itemDiv.querySelector('.btn-increase-qty').addEventListener('click', handleIncreaseQuantity);

            carritoItemsDiv.appendChild(itemDiv);
            total += item.precio * item.cantidad;
        });
        btnFinalizarCompra.disabled = false;
    }

    carritoTotalSpan.textContent = total.toFixed(2);
}

/**
 * Maneja el clic en "Añadir al Carrito"
 */
export function handleAddCarritoClick(idProducto, nombre, precio, imagenUrl = null) {
    const userRole = getUserRoleCallback();

    if (userRole === 'visualizacion' || !userRole) {
        alert("⚠️ Registrate o inicia sesión para agregar productos al carrito.");
        const modalLogin = document.getElementById('modal-login');
        if (modalLogin) {
             modalLogin.classList.add('show');
             modalLogin.style.display = '';
        }
        return;
    }

    // Ensure types
    idProducto = parseInt(idProducto);
    precio = parseFloat(precio);

    // Comparación robusta asegurando que ambos IDs sean números
    const itemExistente = carrito.find(item => parseInt(item.id_producto) === idProducto);
    
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ id_producto: idProducto, nombre, precio, cantidad: 1, imagen_url: imagenUrl });
    }
    renderizarCarrito();
    // Auto-open cart? Handled by the inline wrapper in app.js
}

/**
 * Maneja el clic en el botón "-" para reducir cantidad
 */
function handleDecreaseQuantity(event) {
    const idProducto = parseInt(event.currentTarget.dataset.id);
    const itemEnCarrito = carrito.find(item => item.id_producto === idProducto);

    if (itemEnCarrito) {
        itemEnCarrito.cantidad--;
        if (itemEnCarrito.cantidad <= 0) {
            // Usar splice para mutar el array, no crear uno nuevo
            const index = carrito.findIndex(item => item.id_producto === idProducto);
            if (index !== -1) {
                carrito.splice(index, 1);
            }
        }
    }
    renderizarCarrito();
}

/**
 * Maneja el clic en el botón "+" para aumentar cantidad
 */
function handleIncreaseQuantity(event) {
    const idProducto = parseInt(event.currentTarget.dataset.id);
    const itemEnCarrito = carrito.find(item => item.id_producto === idProducto);

    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    }
    renderizarCarrito();
}

/**
 * Limpia el carrito
 */
export function clearCarrito() {
    // Mutar el array en lugar de crear uno nuevo
    carrito.length = 0;
    renderizarCarrito();
}
