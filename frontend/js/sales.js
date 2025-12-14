import { fetchData } from './api.js';
import { mostrarMensaje } from './ui.js';
import { getCarrito, clearCarrito, renderizarCarrito } from './cart.js';
import { getUserRole } from './auth.js';

export async function cargarHistorialVentas() {
    const listaVentas = document.getElementById('historial-ventas-lista');
    if (!listaVentas) return;

    try {
        const ventas = await fetchData('/api/ventas');
        listaVentas.innerHTML = '';

        if (!ventas || ventas.length === 0) {
            listaVentas.innerHTML = '<p>No hay ventas registradas.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ventas.forEach(venta => {
            const li = document.createElement('li');
            li.className = 'venta-item';
            li.innerHTML = `
                <div class="venta-header">
                    <span><strong>Venta #${venta.id_venta}</strong></span>
                    <span>Cliente: ${venta.nombre_cliente}</span>
                    <span>Fecha: ${venta.fecha}</span>
                    <span class="venta-total">Total: $${parseFloat(venta.monto_total).toFixed(2)}</span>
                </div>
                ${venta.detalles ? `
                    <div class="venta-detalles">
                        <h4>Detalles:</h4>
                        <ul>
                            ${venta.detalles.map(d => `
                                <li class="detalle-item">
                                    <span>${d.nombre_producto}</span>
                                    <span>x ${d.cantidad}</span>
                                    <span>$${parseFloat(d.precio_unitario).toFixed(2)} c/u</span>
                                    <span>Subtotal: $${(parseFloat(d.cantidad) * parseFloat(d.precio_unitario)).toFixed(2)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            `;
            ul.appendChild(li);
        });
        listaVentas.appendChild(ul);
    } catch (error) {
        listaVentas.innerHTML = `<p>Error al cargar ventas: ${error.message}</p>`;
    }
}

export async function cargarReporteBajoStock() {
    const contenedor = document.getElementById('reporte-bajo-stock');
    if (!contenedor) return;

    try {
        const productos = await fetchData('/api/productos');
        const productosBajoStock = productos.filter(p => p.cantidad_stock < 10);

        if (productosBajoStock.length === 0) {
            contenedor.innerHTML = '<p>✅ Todos los productos tienen stock suficiente.</p>';
            return;
        }

        let html = '<table class="reporte-tabla"><thead><tr><th>Producto</th><th>Stock Actual</th></tr></thead><tbody>';
        productosBajoStock.forEach(p => {
            html += `<tr><td>${p.nombre}</td><td class="numero">${p.cantidad_stock}</td></tr>`;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (error) {
        contenedor.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

export async function cargarReporteVentasCliente() {
    const contenedor = document.getElementById('reporte-ventas-cliente');
    if (!contenedor) return;

    try {
        const ventas = await fetchData('/api/ventas');
        const ventasPorCliente = {};

        ventas.forEach(v => {
            if (!ventasPorCliente[v.nombre_cliente]) {
                ventasPorCliente[v.nombre_cliente] = { total: 0, cantidad: 0 };
            }
            ventasPorCliente[v.nombre_cliente].total += parseFloat(v.monto_total);
            ventasPorCliente[v.nombre_cliente].cantidad++;
        });

        let html = '<table class="reporte-tabla"><thead><tr><th>Cliente</th><th>Compras</th><th>Total Gastado</th></tr></thead><tbody>';
        Object.entries(ventasPorCliente).forEach(([cliente, datos]) => {
            html += `<tr><td>${cliente}</td><td class="numero">${datos.cantidad}</td><td class="numero">$${datos.total.toFixed(2)}</td></tr>`;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (error) {
        contenedor.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

export async function cargarMisCompras() {
    const listaCompras = document.getElementById('mis-compras-lista');
    if (!listaCompras) return;

    try {
        const compras = await fetchData('/api/ventas/mis-compras');
        listaCompras.innerHTML = '';

        if (!compras || compras.length === 0) {
            listaCompras.innerHTML = '<p>No has realizado compras aún.</p>';
            return;
        }

        const ul = document.createElement('ul');
        compras.forEach(compra => {
            const li = document.createElement('li');
            li.className = 'venta-item';
            li.innerHTML = `
                <div class="venta-header">
                    <span><strong>Compra #${compra.id_venta}</strong></span>
                    <span>Fecha: ${compra.fecha}</span>
                    <span class="venta-total">Total: $${parseFloat(compra.monto_total).toFixed(2)}</span>
                </div>
                ${compra.detalles ? `<div class="venta-detalles"><h4>Productos:</h4><ul>
                    ${compra.detalles.map(d => `<li>${d.nombre_producto} - x${d.cantidad} - $${(parseFloat(d.cantidad) * parseFloat(d.precio_unitario)).toFixed(2)}</li>`).join('')}
                </ul></div>` : ''}
            `;
            ul.appendChild(li);
        });
        listaCompras.appendChild(ul);
    } catch (error) {
        listaCompras.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

export async function handleFinalizarCompraClick() {
    const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');
    const compraMensaje = document.getElementById('compra-mensaje');
    const selectorCliente = document.getElementById('selector-cliente');

    if (!btnFinalizarCompra || !compraMensaje) return;

    const userRole = getUserRole();
    const currentUserId = window.currentUserId; // Acceso global temporal

    let idClienteParaVenta = null;

    if (userRole === 'admin') {
        const idClienteAdmin = selectorCliente.value;
        if (!idClienteAdmin) {
            mostrarMensaje(compraMensaje, "Como Admin, debe seleccionar un cliente.", false);
            return;
        }
        idClienteParaVenta = idClienteAdmin;
    } else if (['usuario', 'cliente', 'user'].includes(userRole)) {
        if (!currentUserId) {
            mostrarMensaje(compraMensaje, "Error de sesión. Por favor, inicia sesión de nuevo.", false);
            return;
        }
        idClienteParaVenta = currentUserId;
    } else {
        alert("Por favor, inicia sesión para completar tu compra.");
        document.getElementById('modal-login').style.display = 'block';
        return;
    }

    // Obtener carrito actual (referencia viva)
    const carrito = getCarrito();

    if (carrito.length === 0) {
        mostrarMensaje(compraMensaje, "El carrito está vacío.", false);
        return;
    }

    const ventaData = {
        id_cliente: parseInt(idClienteParaVenta),
        detalles: carrito.map(item => ({
            id_producto: parseInt(item.id_producto),
            cantidad: parseInt(item.cantidad)
        }))
    };
    
    console.log("Enviando venta:", ventaData); // DEBUG

    btnFinalizarCompra.disabled = true;
    btnFinalizarCompra.textContent = 'Procesando...';

    try {
        const ventaCreada = await fetchData('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData),
        });

        mostrarMensaje(compraMensaje, `Pedido realizado, Gracias! Total: $${ventaCreada.monto_total.toFixed(2)}`, true);

        clearCarrito();
        if (userRole === 'admin') {
            selectorCliente.value = "";
            cargarHistorialVentas();
            cargarReporteBajoStock();
            cargarReporteVentasCliente();
        } else {
            // For any other role (cliente, user, usuario)
            cargarMisCompras();
        }

        if (window.cargarProductos) {
            window.cargarProductos(); // Refresh global product list & stock
        } else {
            console.warn("cargarProductos not found globally");
        }
    } catch (error) {
        mostrarMensaje(compraMensaje, `Error: ${error.message}`, false);
    } finally {
        btnFinalizarCompra.textContent = 'Finalizar Compra';
        btnFinalizarCompra.disabled = false;
        renderizarCarrito();
    }
}

export function initSalesListeners() {
    document.getElementById('btn-finalizar-compra')?.addEventListener('click', handleFinalizarCompraClick);
}
