/**
 * @file app.js
 * @description Script principal para la interfaz del Bazar de Ropa.
 * Coordina los módulos y maneja CRUD de Productos, Clientes y Proveedores.
 */

// === ES6 Module Imports ===
import { API_URL as CONFIG_API_URL } from './js/config.js';
// Fallback if API_URL is undefined
const API_URL = CONFIG_API_URL || '';

import { showLoading, hideLoading, mostrarMensaje } from './js/ui.js';
import { fetchData } from './js/api.js';
import { initCartDOM, setGetUserRoleCallback, handleAddCarritoClick, renderizarCarrito, carrito } from './js/cart.js';
import { userRole, currentUserId, getUserRole, checkExistingToken, initAuthListeners, handleLogout } from './js/auth.js';
import { cargarHistorialVentas, cargarReporteBajoStock, cargarReporteVentasCliente, cargarMisCompras, initSalesListeners } from './js/sales.js';
import { cargarDireccionesCliente, handleNuevaDireccionSubmit, resetFormularioDireccion } from './js/client_addresses.js';
import './js/admin.js'; // Admin Dashboard Logic

// Espera a que el DOM esté completamente cargado.
document.addEventListener("DOMContentLoaded", () => {

    // --- Referencias a elementos clave del DOM ---
    const listaDeProductos = document.getElementById('productos-lista');
    
    // UI Layers Elements (Drawer, Dropdown)
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-drawer-overlay');
    const btnCloseCart = document.getElementById('btn-close-cart');
    const btnToggleCart = document.getElementById('btn-toggle-cart');
    
    const userDropdown = document.getElementById('user-dropdown');
    const btnUserProfile = document.getElementById('btn-user-profile');
    
    // Modals (New References)
    const modalMisDirecciones = document.getElementById('modal-mis-direcciones');
    const cerrarModalDirecciones = document.getElementById('cerrar-modal-direcciones');
    const modalMisCompras = document.getElementById('modal-mis-compras');
    const cerrarModalCompras = document.getElementById('cerrar-modal-compras');

    // Formularios
    const formNuevoCliente = document.getElementById('form-nuevo-cliente');
    const formNuevoProveedor = document.getElementById('form-nuevo-proveedor');
    const formNuevaDireccion = document.getElementById('form-nueva-direccion');
    const formNuevoProducto = document.getElementById('form-nuevo-producto');
    const formEditarCliente = document.getElementById('form-editar-cliente');

    // Elementos del Carrito (para inicializar módulo)
    const carritoItemsDiv = document.getElementById('carrito-items');
    const carritoTotalSpan = document.getElementById('carrito-total');
    const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');

    // Selectores y Listas
    const selectorTipoProducto = document.getElementById('producto-tipo');

    // Inputs y Modales Generales
    const modalEditarCliente = document.getElementById('modal-editar-cliente');
    const cerrarModalClienteBtn = document.getElementById('cerrar-modal-cliente');
    const btnCancelarEdicionProducto = document.getElementById('btn-cancelar-edicion-producto');

    // Header Elements
    const btnHome = document.getElementById('btn-home');

    // --- Funciones de UI Layering ---

    function openCart() {
        if (cartDrawer) cartDrawer.classList.add('open');
        if (cartOverlay) cartOverlay.style.display = 'block';
    }

    function closeCart() {
        if (cartDrawer) cartDrawer.classList.remove('open');
        if (cartOverlay) cartOverlay.style.display = 'none';
    }

    function toggleUserMenu() {
        if (userDropdown) {
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        }
    }

    function closeUserMenu() {
        if (userDropdown) userDropdown.style.display = 'none';
    }

    // Modal Helpers
    // Modal Helpers
    function openModal(modal) {
        if (modal) {
            modal.classList.add('show');
            modal.style.display = ''; // Clear inline style
        }
        closeUserMenu(); // Close menu if opening a modal from it
    }
    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = ''; // Clear inline style
        }
    }


    // --- Estado Local ---
    let clienteSeleccionadoId = null;

    // --- Funciones de Carga y Renderizado (Productos) ---
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
                        detallesHTML = `<p class="producto-detalle">Talla: ${d.talla || 'N/A'}</p>`;
                    } else if (producto.tipo_producto === 'calzado') {
                         detallesHTML = `<p class="producto-detalle">Talla: ${d.talla_numerica || d.talla || 'N/A'}</p>`;
                    }
                }
                
                // === Renderizado Estilo "Cards" con Imagen ===
                // Fix: Handle Cloudinary (absolute) vs Local (relative) URLs
                const rawUrl = producto.imagen_url || '';
                const cleanUrl = rawUrl.trim();
                const imgUrl = cleanUrl.startsWith('http') 
                    ? cleanUrl 
                    : `${API_URL}${cleanUrl}`;

                const imgContent = producto.imagen_url 
                    ? `<img src="${imgUrl}" alt="${producto.nombre}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : `<span style="color: #999;">Imagen</span>`;

                item.innerHTML = `
                    <div class="producto-image-placeholder">
                        ${imgContent}
                        ${Math.random() > 0.7 ? '<div class="tag-mas-vendido">MÁS VENDIDO</div>' : ''}
                    </div>
                    <div class="producto-info">
                        <h3>${producto.nombre}</h3>
                        <p style="display:none;">${producto.descripcion || ''}</p> <!-- Hidden desc for search -->
                        ${detallesHTML}
                        <p class="precio">$${producto.precio.toFixed(2)}</p>
                        <p class="stock-info" style="font-size: 0.85rem; color: #666; margin-top: 5px;">Stock: <strong>${producto.cantidad_stock}</strong></p>
                        
                        <div class="producto-acciones">
                            <button onclick="window.handleAddCarritoClick(${producto.id_producto}, '${producto.nombre}', ${producto.precio}, '${imgUrl || ''}'); window.openCart();">
                                Agregar al Carrito
                            </button>
                            <!-- Admin buttons removed for Home view -->
                        </div>
                    </div>
                `;
                listaDeProductos.appendChild(item);
            });
        } catch (error) {
            console.error('Error al cargar productos:', error);
            listaDeProductos.innerHTML = '<p>Error al cargar el catálogo.</p>';
        }
    }


    // --- Gestión de UI por Roles (UPDATED) ---
    function actualizarUIPorRol() {
        const saludosSpan = document.getElementById('saludo-usuario');
        const seccionesAdmin = document.querySelectorAll('.admin-only');
        
        // Populate User Dropdown
        if (userDropdown) userDropdown.innerHTML = ''; 

        // Admin Panel Button Logic
        const btnAdminPanel = document.getElementById('btn-admin-panel');
        if (btnAdminPanel) {
            btnAdminPanel.style.display = (userRole === 'admin') ? 'inline-block' : 'none';
            btnAdminPanel.onclick = (e) => {
                e.preventDefault();
                document.getElementById('admin-dashboard-section').style.display = 'block';
                document.querySelector('main.container').style.display = 'none';
                
                // Initialize default tab
                if(window.switchAdminTab) window.switchAdminTab('admin-resumen');
                // Load admin specific data if not loaded
                if(window.cargarDatosAdminResumen) window.cargarDatosAdminResumen();
            };
        }

        if (userRole === 'admin') {
            if (saludosSpan) saludosSpan.textContent = "Admin";
            seccionesAdmin.forEach(el => {
                // Show ONLY if it's inside the cart drawer (Client Selector)
                if (el.closest('.cart-drawer')) {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none'; // Keep other admin sections hidden on Home
                }
            });
            
            // cargarReporteBajoStock(); // Moved to dashboard logic
            
            if (userDropdown) userDropdown.innerHTML += `<li><button id="menu-logout">Cerrar Sesión</button></li>`;
            
            
        } else if (userRole === 'cliente' || userRole === 'user' || userRole === 'usuario') {
             if (saludosSpan) saludosSpan.textContent = "Hola, Cliente";
             seccionesAdmin.forEach(el => el.style.display = 'none');
             
             if (userDropdown) {
                 userDropdown.innerHTML += `
                    <li><button id="menu-orders">Mis Compras</button></li>
                    <li><button id="menu-addresses">Mis Direcciones</button></li>
                    <li style="border-top:1px solid #eee; margin-top:5px; padding-top:5px;"><button id="menu-logout">Cerrar Sesión</button></li>
                `;
             }

             // Pre-load data 
             if (currentUserId) cargarDireccionesCliente(currentUserId);
             cargarMisCompras();

        } else {
            // Visitante
            if (saludosSpan) saludosSpan.textContent = "Modo Visitante";
            seccionesAdmin.forEach(el => el.style.display = 'none');
             
             if (userDropdown) {
                 userDropdown.innerHTML += `
                    <li><button id="menu-login">Iniciar Sesión</button></li>
                    <li><button id="menu-register">Registrarse</button></li>
                `;
             }
        }

        // Attach Listeners to Dynamic Menu Items
        setTimeout(() => { // Timeout to ensure DOM is updated
            const btnLoginMenu = document.getElementById('menu-login');
            if (btnLoginMenu) btnLoginMenu.onclick = () => { openModal(document.getElementById('modal-login')); closeUserMenu(); };

            const btnRegisterMenu = document.getElementById('menu-register');
            if (btnRegisterMenu) btnRegisterMenu.onclick = () => { openModal(document.getElementById('modal-registro')); closeUserMenu(); };

            const btnLogoutMenu = document.getElementById('menu-logout');
            if (btnLogoutMenu) btnLogoutMenu.onclick = () => {
                handleLogout(); // Direct call
                closeUserMenu();
            };

            const btnOrdersMenu = document.getElementById('menu-orders');
            if (btnOrdersMenu) btnOrdersMenu.onclick = () => openModal(modalMisCompras);

            const btnAddressesMenu = document.getElementById('menu-addresses');
            if (btnAddressesMenu) btnAddressesMenu.onclick = () => {
                const hiddenIdInput = document.getElementById('id-cliente-direccion');
                if (hiddenIdInput && currentUserId) hiddenIdInput.value = currentUserId;
                openModal(modalMisDirecciones);
            };
        }, 100);

        // Carga productos para todos
        cargarProductos();
        renderizarCarrito(); // Update cart UI
    }

    // Expose helpers to window for inline onclicks and cross-module access
    window.openCart = openCart;
    window.handleAddCarritoClick = handleAddCarritoClick;
    window.cargarProductos = cargarProductos;

    // --- Inicialización y Listeners ---

    // Toggle Cart
    if (btnToggleCart) btnToggleCart.addEventListener('click', openCart);
    if (btnCloseCart) btnCloseCart.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Toggle User Menu
    if (btnUserProfile) {
        btnUserProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserMenu();
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (userDropdown && userDropdown.style.display === 'block') {
            if (!userDropdown.contains(e.target) && !btnUserProfile.contains(e.target)) {
                closeUserMenu();
            }
        }
    });

    // Close Modals Listeners
    if (cerrarModalDirecciones) cerrarModalDirecciones.onclick = () => closeModal(modalMisDirecciones);
    if (cerrarModalCompras) cerrarModalCompras.onclick = () => closeModal(modalMisCompras);
    
    // Close modals on overlay click
    window.addEventListener('click', (e) => {
        if (e.target === modalMisDirecciones) closeModal(modalMisDirecciones);
        if (e.target === modalMisCompras) closeModal(modalMisCompras);
        if (e.target === document.getElementById('modal-login')) closeModal(document.getElementById('modal-login'));
        if (e.target === document.getElementById('modal-registro')) closeModal(document.getElementById('modal-registro'));
    });
    
    // Form Listeners
    // Admin forms are now handled in admin.js
    if (formNuevaDireccion) formNuevaDireccion.addEventListener('submit', handleNuevaDireccionSubmit);
    
    // if (selectorTipoProducto) selectorTipoProducto.addEventListener('change', handleTipoProductoChange);
    // if (formNuevoProducto) formNuevoProducto.addEventListener('submit', handleNuevoProductoSubmit);
    
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

    // 3. Configurar Callbacks Globales
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

    // Event listener para subida de imágenes
    // Event listener para subida de imágenes
    const fileInput = document.getElementById('file-imagen-producto');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Disable submit button mainly for admin form usage
            const submitBtn = document.querySelector('#form-nuevo-producto button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const formData = new FormData();
            formData.append('file', file);
            
            const status = document.getElementById('upload-status');
            const urlInput = document.getElementById('imagen-producto');

            try {
                if (status) {
                    status.textContent = 'Subiendo imagen... por favor espere';
                    status.style.color = 'blue';
                }

                const response = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Error en la subida');

                const data = await response.json();

                if (data.url.startsWith('http')) {
                    urlInput.value = data.url; 
                } else {
                    urlInput.value = `${API_URL}${data.url}`;
                }
                
                if (status) {
                    status.textContent = '¡Imagen cargada exitosamente!';
                    status.style.color = 'green';
                }
            } catch (error) {
                console.error('Upload error:', error);
                if (status) {
                    status.textContent = 'Error al subir la imagen.';
                    status.style.color = 'red';
                }
            } finally {
                if(submitBtn) submitBtn.disabled = false;
            }
        });
    }

});

// --- Dummy Functions for Missing Imports (if any) to prevent crash during refactor ---
function handleNuevoClienteSubmit(e) { e.preventDefault(); console.log("New Client Submit"); }
function handleNuevoProveedorSubmit(e) { e.preventDefault(); console.log("New Provider Submit"); }

let productoEnEdicionId = null;

function handleTipoProductoChange(e) {
    const tipo = e.target.value;
    document.querySelectorAll('.detalles-subtipo').forEach(el => el.style.display = 'none');
    if (tipo === 'ropa') document.getElementById('detalles-ropa').style.display = 'block';
    if (tipo === 'calzado') document.getElementById('detalles-calzado').style.display = 'block';
    if (tipo === 'accesorios') document.getElementById('detalles-accesorios').style.display = 'block';
}

async function handleNuevoProductoSubmit(e) {
    e.preventDefault();
    const mensaje = document.getElementById('producto-mensaje');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Gather Base Data
    const nombre = document.getElementById('nombre-producto').value;
    const precio = parseFloat(document.getElementById('precio-producto').value);
    const stock = parseInt(document.getElementById('stock-producto').value);
    const imagen_url = document.getElementById('imagen-producto').value;
    const id_proveedor = document.getElementById('producto-proveedor').value;
    const tipo = document.getElementById('producto-tipo').value;

    // Gather Subtype Data
    let detalles = {};
    if (tipo === 'ropa') {
        detalles = {
            material: document.getElementById('ropa-material').value,
            talla: document.getElementById('ropa-talla').value,
            tipo_corte: document.getElementById('ropa-corte').value
        };
    } else if (tipo === 'calzado') {
        detalles = {
            talla_numerica: parseFloat(document.getElementById('calzado-talla').value),
            material_suela: document.getElementById('calzado-suela').value
        };
    } else if (tipo === 'accesorios') {
        detalles = {
            material: document.getElementById('accesorio-material').value,
            dimensiones: document.getElementById('accesorio-dimensiones').value
        };
    }

    const payload = {
        nombre, precio, cantidad_stock: stock, imagen_url, 
        id_proveedor: parseInt(id_proveedor),
        tipo_producto: tipo,
        detalles_subtipo: detalles
    };

    submitBtn.disabled = true;
    try {
        if (productoEnEdicionId) {
             const updatePayload = {
                 ...payload,
                 // For update, we might need slight adjustments depending on schema, but usually same payload works if all fields are present
                 // Removing fields if schema requires partial? No, PUT usually expects full or partial.
             };
             await fetchData(`/api/productos/${productoEnEdicionId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(updatePayload)
             });
             mostrarMensaje(mensaje, "Producto actualizado correctamente", true);
             productoEnEdicionId = null;
             document.querySelector('#form-nuevo-producto button[type="submit"]').textContent = 'Registrar Producto';
             document.getElementById('btn-cancelar-edicion-producto').style.display = 'none';
        } else {
            await fetchData('/api/productos', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            mostrarMensaje(mensaje, "Producto creado correctamente", true);
        }
        
        e.target.reset();
        // Reset subtype visibility
        document.querySelectorAll('.detalles-subtipo').forEach(el => el.style.display = 'none');
        document.getElementById('detalles-ropa').style.display = 'block'; // Default
        cargarProductos();
    } catch (err) {
        mostrarMensaje(mensaje, "Error: " + err.message, false);
    } finally {
        submitBtn.disabled = false;
    }
}

function resetFormularioProducto() { 
    document.getElementById('form-nuevo-producto').reset();
    document.getElementById('producto-mensaje').textContent = '';
    productoEnEdicionId = null;
    document.querySelector('#form-nuevo-producto button[type="submit"]').textContent = 'Registrar Producto';
    document.getElementById('btn-cancelar-edicion-producto').style.display = 'none';
}

window.prepararEdicionProducto = async function(id) {
    try {
        const p = await fetchData(`/api/productos/${id}`);
        // Fill form
        document.getElementById('nombre-producto').value = p.nombre;
        document.getElementById('precio-producto').value = p.precio;
        document.getElementById('stock-producto').value = p.cantidad_stock;
        document.getElementById('imagen-producto').value = p.imagen_url || '';
        document.getElementById('producto-proveedor').value = p.id_proveedor;
        document.getElementById('producto-tipo').value = p.tipo_producto;
        
        // Trigger type change
        const event = new Event('change');
        document.getElementById('producto-tipo').dispatchEvent(event);

        // Fill Subtypes
        if (p.detalles_subtipo) {
             if (p.tipo_producto === 'ropa') {
                document.getElementById('ropa-material').value = p.detalles_subtipo.material;
                document.getElementById('ropa-talla').value = p.detalles_subtipo.talla;
                document.getElementById('ropa-corte').value = p.detalles_subtipo.tipo_corte;
            } else if (p.tipo_producto === 'calzado') {
                document.getElementById('calzado-talla').value = p.detalles_subtipo.talla_numerica;
                document.getElementById('calzado-suela').value = p.detalles_subtipo.material_suela;
            } else if (p.tipo_producto === 'accesorios') {
                document.getElementById('accesorio-material').value = p.detalles_subtipo.material;
                document.getElementById('accesorio-dimensiones').value = p.detalles_subtipo.dimensiones;
            }
        }

        productoEnEdicionId = id;
        document.querySelector('#form-nuevo-producto button[type="submit"]').textContent = 'Actualizar Producto';
        document.getElementById('btn-cancelar-edicion-producto').style.display = 'inline-block';
        
        document.getElementById('form-nuevo-producto').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        console.error(e);
        alert("Error al cargar producto para edición");
    }
};
function handleEditarSubmit(e) { e.preventDefault(); console.log("Edit Submit"); }
function ocultarModalEditarCliente() { document.getElementById('modal-editar-cliente').style.display = 'none'; }