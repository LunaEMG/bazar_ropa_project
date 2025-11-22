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
            itemDiv.innerHTML = `
                <span class="item-nombre">${item.nombre}</span>
                <div class="carrito-item-controles">
                    <button class="btn-qty btn-decrease-qty" data-id="${item.id_producto}">-</button>
                    <span class="item-cantidad">x ${item.cantidad}</span>
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
export function handleAddCarritoClick(event) {
    const userRole = getUserRoleCallback();

    if (userRole === 'visualizacion') {
        alert("⚠️ Registrate o inicia sesión para agregar productos al carrito.");
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
    renderizarCarrito();
}

/**
 * Maneja el clic en el botón "-" para reducir cantidad
 */
function handleDecreaseQuantity(event) {
    const idProducto = parseInt(event.target.dataset.id);
    const itemEnCarrito = carrito.find(item => item.id_producto === idProducto);

    if (itemEnCarrito) {
        itemEnCarrito.cantidad--;
        if (itemEnCarrito.cantidad <= 0) {
            carrito = carrito.filter(item => item.id_producto !== idProducto);
        }
    }
    renderizarCarrito();
}

/**
 * Maneja el clic en el botón "+" para aumentar cantidad
 */
function handleIncreaseQuantity(event) {
    const idProducto = parseInt(event.target.dataset.id);
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
    carrito = [];
    renderizarCarrito();
}
