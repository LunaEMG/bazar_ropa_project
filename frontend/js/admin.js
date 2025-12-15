
import { fetchData, deleteData } from "./api.js";
import { API_URL as CONFIG_API_URL } from "./config.js";
const API_URL = CONFIG_API_URL || '';
import { mostrarMensaje, showGlobalNotification } from "./ui.js";

export function switchAdminTab(tabId) {
  document
    .querySelectorAll(".admin-tab-content")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".admin-nav-item")
    .forEach((el) => el.classList.remove("active"));

  document.getElementById(tabId)?.classList.add("active");
  const navBtn = document.querySelector(`button[data-tab="${tabId}"]`);
  if (navBtn) navBtn.classList.add("active");

  if (tabId === "admin-resumen") cargarDatosAdminResumen();
  if (tabId === "admin-productos") cargarProductosAdmin();
  if (tabId === "admin-usuarios") cargarUsuarios();
  if (tabId === "admin-proveedores") cargarProveedoresAdmin();
  if (tabId === "admin-ventas") cargarHistorialVentasGlobal();
}

let usersCache = {};

// --- 1. RESUMEN ---
export async function cargarDatosAdminResumen() {
  try {
    const [ventasData, usuariosData, stockData, topClientesData] =
      await Promise.all([
        fetchData("/api/ventas"),
        fetchData("/api/clientes"),
        fetchData("/api/reportes/bajo-stock"),
        fetchData("/api/reportes/ventas-cliente"),
      ]);
    usuariosData.forEach((u) => (usersCache[u.id_cliente] = u.nombre));

    const totalVentas = ventasData.reduce((acc, v) => acc + v.monto_total, 0);
    document.getElementById(
      "stat-total-ventas"
    ).textContent = `$${totalVentas.toFixed(2)}`;
    document.getElementById("stat-total-usuarios").textContent =
      usuariosData.length;
    document.getElementById("stat-stock-bajo").textContent = stockData.length;

    const stockContainer = document.getElementById("general-view-stock");
    if (stockData.length === 0) {
      stockContainer.innerHTML =
        '<div style="padding: 20px; text-align: center; color: #888;">Todo el stock está en orden.</div>';
    } else {
      stockContainer.innerHTML = `
                <table class="admin-table">
                    <thead><tr><th>Producto</th><th>Stock</th></tr></thead>
                    <tbody>
                        ${stockData
                          .map(
                            (s) => `
                            <tr>
                                <td>${s.nombre}</td>
                                <td style="color: red; font-weight: bold;">${s.cantidad_stock}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            `;
    }

    const clientsContainer = document.getElementById("general-view-clientes");
    if (topClientesData.length === 0) {
      clientsContainer.innerHTML =
        '<div style="padding: 20px; text-align: center; color: #888;">No hay datos de compras recientes.</div>';
    } else {
      clientsContainer.innerHTML = `
                <table class="admin-table">
                    <thead><tr><th>Cliente</th><th>Compras</th><th>Total</th></tr></thead>
                    <tbody>
                        ${topClientesData
                          .slice(0, 5)
                          .map(
                            (c) => `
                            <tr>
                                <td>${c.nombre}</td>
                                <td>${c.total_compras}</td>
                                <td>$${c.gasto_total.toFixed(2)}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            `;
    }
  } catch (e) {
    console.error("Error stats:", e);
  }
}

// --- 2. PRODUCTOS ---
export async function cargarProductosAdmin() {
  const tbody = document.getElementById("lista-productos-admin-body");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

  try {
    const productos = await fetchData("/api/productos");
    const alertList = document.getElementById("admin-stock-alert-list");
    if (alertList) alertList.innerHTML = "";

    const lowStock = productos.filter((p) => p.cantidad_stock < 10);
    if (lowStock.length > 0 && alertList) {
      alertList.innerHTML = `<div class="alert-banner">Hay ${lowStock.length} productos con bajo stock. Verificar inventario.</div>`;
    }

    if (productos.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5">No hay productos registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = productos.map(p => {
             const rawUrl = p.imagen_url || '';
             const cleanUrl = rawUrl.trim();
             const imgUrl = cleanUrl.startsWith('http')
                    ? cleanUrl
                    : `${API_URL}${cleanUrl}`;
             return `
            <tr>
                <td><img src="${p.imagen_url ? imgUrl : 'https://via.placeholder.com/50'}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
                <td>
                    <b>${p.nombre}</b><br>
                    <small style="color: #777;">${p.tipo_producto}</small>
                </td>
                <td>$${p.precio.toFixed(2)}</td>
                <td style="${p.cantidad_stock < 10 ? 'color: red; font-weight: bold;' : ''}">${p.cantidad_stock}</td>
                <td>
                    <button class="btn-sm btn-secondary" onclick="window.abrirModalProducto(${p.id_producto})">Editar</button>
                    <button class="btn-sm btn-danger" onclick="window.eliminarProducto(${p.id_producto})">Eliminar</button>
                </td>
            </tr>
        `}).join('');
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="error">Error: ${error.message}</td></tr>`;
  }
}

export async function eliminarProducto(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;
  try {
    await deleteData(`/api/productos/${id}`);
    showGlobalNotification("Producto eliminado");
    cargarProductosAdmin();
  } catch (error) {
    alert("Error al eliminar: " + error.message);
  }
}

// --- 3. USUARIOS ---
export async function cargarUsuarios() {
  const div = document.getElementById("admin-users-list");
  div.innerHTML = "<p>Cargando usuarios...</p>";
  try {
    const usuarios = await fetchData("/api/clientes");
    if (usuarios.length === 0) {
      div.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
        `;
    html += usuarios
      .map(
        (u) => `
            <tr>
                <td>#${u.id_cliente}</td>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td>${u.es_admin ? "Admin" : "Cliente"}</td> <!-- Mock -->
                <td>
                     <button class="btn-sm btn-secondary" onclick="window.abrirModalUsuario(${
                       u.id_cliente
                     }, '${u.nombre}', '${u.email}', '${
          u.telefono || ""
        }')">Editar</button>
                     <button class="btn-sm btn-danger" onclick="window.eliminarUsuario(${
                       u.id_cliente
                     })">Eliminar</button>
                </td>
            </tr>
        `
      )
      .join("");
    html += "</tbody></table>";
    div.innerHTML = html;
  } catch (error) {
    div.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

export async function eliminarUsuario(id) {
  if (!confirm("¿Eliminar usuario?")) return;
  try {
    await deleteData(`/api/clientes/${id}`);
    showGlobalNotification("Usuario eliminado");
    cargarUsuarios();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// --- 4. PROVEEDORES ---
export async function cargarProveedoresAdmin() {
  const div = document.getElementById("lista-proveedores-admin");
  div.innerHTML = "<p>Cargando proveedores...</p>";
  try {
    const provs = await fetchData("/api/proveedores");
    if (provs.length === 0) {
      div.innerHTML = "<p>No hay proveedores registrados.</p>";
      return;
    }

    div.innerHTML = provs
      .map(
        (p) => `
            <div class="card-proveedor" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: white;">
                <h3>${p.nombre}</h3>
                <p>📞 ${p.telefono || "Sin teléfono"}</p>
                <div style="margin-top: 10px;">
                    <button class="btn-sm btn-secondary" onclick="window.showModalNuevoProveedor(${
                      p.id_proveedor
                    }, '${p.nombre}', '${p.telefono || ""}')">Editar</button>
                    <button class="btn-sm btn-danger" onclick="window.eliminarProveedor(${
                      p.id_proveedor
                    })">Eliminar</button>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    div.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

export async function eliminarProveedor(id) {
  if (!confirm("¿Eliminar proveedor?")) return;
  try {
    await deleteData(`/api/proveedores/${id}`);
    showGlobalNotification("Proveedor eliminado");
    cargarProveedoresAdmin();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// --- 5. VENTAS ---
export async function cargarHistorialVentasGlobal() {
  const list = document.getElementById("admin-ventas-list");
  list.innerHTML = "Cargando ventas...";
  try {
    const ventas = await fetchData("/api/ventas");
    if (Object.keys(usersCache).length === 0) {
      try {
        const users = await fetchData("/api/clientes");
        users.forEach((u) => (usersCache[u.id_cliente] = u.nombre));
      } catch (e) {}
    }

    let html = `<table class="admin-table">
                <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Detalles</th></tr></thead><tbody>`;
    ventas.forEach((v) => {
      const clienteNombre =
        usersCache[v.id_cliente] || `Cliente #${v.id_cliente}`;
      html += `<tr>
                <td>#${v.id_venta}</td>
                <td>${new Date(v.fecha).toLocaleDateString()}</td>
                <td>${v.id_cliente ? clienteNombre : "Visitante"}</td>
                <td>$${v.monto_total.toFixed(2)}</td>
                <td><button class="btn-sm" onclick="window.abrirModalDetalleVenta(${
                  v.id_venta
                })">Ver</button></td>
            </tr>`;
    });
    html += "</tbody></table>";
    list.innerHTML = html;
  } catch (e) {
    list.innerHTML = `<p class="error">Error: ${e.message}</p>`;
  }
}

// --- MODALS & FORMS ---

// Helper: Product Type
export function handleTipoProductoChange(e) {
  const target = e?.target || document.getElementById("producto-tipo");
  if (!target) return;
  const tipo = target.value;
  document
    .querySelectorAll(".detalles-subtipo")
    .forEach((el) => (el.style.display = "none"));
  if (tipo === "ropa")
    document.getElementById("detalles-ropa").style.display = "block";
  if (tipo === "calzado")
    document.getElementById("detalles-calzado").style.display = "block";
  if (tipo === "accesorios")
    document.getElementById("detalles-accesorios").style.display = "block";
}

// Helper: Load Suppliers for Select
export async function cargarProveedoresSelect() {
  const select = document.getElementById("producto-proveedor");
  if (!select) return;
  select.innerHTML = '<option value="">Cargando...</option>';
  try {
    const provs = await fetchData("/api/proveedores");
    select.innerHTML = '<option value="">Seleccione Proveedor</option>';
    provs.forEach((p) => {
      select.innerHTML += `<option value="${p.id_proveedor}">${p.nombre}</option>`;
    });
  } catch (e) {
    select.innerHTML = '<option value="">Error cargando</option>';
  }
}

// Helper: Open Modal with Animation
function showModal(modal) {
  if (!modal) return;
  modal.style.display = "flex";
  // Small delay to allow display change before adding class for transition (if any)
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);
}

function hideModal(modal) {
  if (!modal) return;
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300); // Wait for transition
}

// Open Product Modal
export function abrirModalProducto(id = null) {
  const modal = document.getElementById("modal-admin-producto");
  const form = document.getElementById("form-nuevo-producto");
  const title = document.getElementById("form-producto-titulo");
  const idInput = document.getElementById("producto-id-edit");

  form.reset();
  document.getElementById("upload-status").textContent = "Solo admin";

  if (id) {
    title.textContent = "Editar Producto";
    idInput.value = id;
    fetchData(`/api/productos/${id}`).then((p) => {
      document.getElementById("producto-tipo").value = p.tipo_producto;
      handleTipoProductoChange();

      document.getElementById("nombre-producto").value = p.nombre;
      document.getElementById("descripcion-producto").value =
        p.descripcion || "";
      document.getElementById("precio-producto").value = p.precio;
      document.getElementById("stock-producto").value = p.cantidad_stock;
      document.getElementById("imagen-producto").value = p.imagen_url || "";

      if (p.detalles_subtipo) {
        if (p.tipo_producto === "ropa") {
          document.getElementById("ropa-material").value =
            p.detalles_subtipo.material || "";
          document.getElementById("ropa-talla").value =
            p.detalles_subtipo.talla || "";
          document.getElementById("ropa-corte").value =
            p.detalles_subtipo.tipo_corte || "";
        } else if (p.tipo_producto === "calzado") {
          document.getElementById("calzado-talla").value =
            p.detalles_subtipo.talla || "";
          document.getElementById("calzado-suela").value =
            p.detalles_subtipo.material_suela || "";
        } else if (p.tipo_producto === "accesorios") {
          document.getElementById("accesorio-material").value =
            p.detalles_subtipo.material || "";
          document.getElementById("accesorio-dimensiones").value =
            p.detalles_subtipo.dimensiones || "";
        }
      }
      cargarProveedoresSelect().then(() => {
        if (p.id_proveedor)
          document.getElementById("producto-proveedor").value = p.id_proveedor;
      });
    });
  } else {
    title.textContent = "Registrar Nuevo Producto";
    idInput.value = "";
    handleTipoProductoChange();
    cargarProveedoresSelect();
  }
  showModal(modal);
}

// HANDLER: Product Submit
async function handleProductoSubmit(e) {
  e.preventDefault();
  const mensaje = document.getElementById("producto-mensaje");
  const id = document.getElementById("producto-id-edit").value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  const basicData = {
    nombre: document.getElementById("nombre-producto").value,
    precio: parseFloat(document.getElementById("precio-producto").value),
    cantidad_stock: parseInt(document.getElementById("stock-producto").value),
    imagen_url: document.getElementById("imagen-producto").value,
    id_proveedor:
      parseInt(document.getElementById("producto-proveedor").value) || null,
    tipo_producto: document.getElementById("producto-tipo").value,
    descripcion: document.getElementById("descripcion-producto").value,
  };

  let detalles = {};
  if (basicData.tipo_producto === "ropa") {
    detalles = {
      material: document.getElementById("ropa-material").value,
      talla: document.getElementById("ropa-talla").value,
      tipo_corte: document.getElementById("ropa-corte").value,
    };
  } else if (basicData.tipo_producto === "calzado") {
    detalles = {
      talla_numerica: parseFloat(
        document.getElementById("calzado-talla").value
      ),
      material_suela: document.getElementById("calzado-suela").value,
    };
  } else if (basicData.tipo_producto === "accesorios") {
    detalles = {
      material: document.getElementById("accesorio-material").value,
      dimensiones: document.getElementById("accesorio-dimensiones").value,
    };
  }
  basicData.detalles_subtipo = detalles;

  submitBtn.disabled = true;
  try {
    if (id) {
      await fetchData(`/api/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basicData),
      });
      showGlobalNotification("Producto actualizado exitosamente");
    } else {
      await fetchData("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basicData),
      });
      showGlobalNotification("Producto creado exitosamente");
    }
    hideModal(document.getElementById("modal-admin-producto"));
    cargarProductosAdmin();
  } catch (err) {
    mostrarMensaje(mensaje, "Error: " + err.message, false);
  } finally {
    submitBtn.disabled = false;
  }
}

// Open Provider Modal
export function showModalNuevoProveedor(id = null, nombre = "", telefono = "") {
  const modal = document.getElementById("modal-admin-proveedor");
  const form = document.getElementById("form-nuevo-proveedor");
  const title = form.querySelector("h3");

  form.reset();
  form.dataset.editId = id || "";

  if (id) {
    title.textContent = "Editar Proveedor";
    document.getElementById("nombre-proveedor").value = nombre;
    document.getElementById("telefono-proveedor").value = telefono;
  } else {
    title.textContent = "Registrar Nuevo Proveedor";
  }
  showModal(modal);
}

// HANDLER: Provider Submit
async function handleProveedorSubmit(e) {
  e.preventDefault();
  const id = e.target.dataset.editId;
  const nombre = document.getElementById("nombre-proveedor").value;
  const telefono = document.getElementById("telefono-proveedor").value;

  try {
    if (id) {
      await fetchData(`/api/proveedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono }),
      });
      showGlobalNotification("Proveedor actualizado exitosamente");
    } else {
      await fetchData("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono }),
      });
      showGlobalNotification("Proveedor creado exitosamente");
    }
    hideModal(document.getElementById("modal-admin-proveedor"));
    cargarProveedoresAdmin();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// Open User Modal
// Open User Modal
export function abrirModalUsuario(
  id = null,
  nombre = "",
  email = "",
  telefono = ""
) {
  const modal = document.getElementById("modal-admin-usuario");
  const title = modal.querySelector("h3");
  const form = document.getElementById("form-nuevo-cliente");
  const submitBtn = form.querySelector('button[type="submit"]');
  const passInput = document.getElementById("password-cliente");

  form.reset();
  form.dataset.editId = id || "";

  if (id) {
    title.textContent = "Editar Usuario";
    submitBtn.textContent = "Guardar Cambios";

    document.getElementById("nombre-cliente").value = nombre;
    document.getElementById("email-cliente").value = email;
    document.getElementById("telefono-cliente").value = telefono;

    // Hide and unrequire password for edit
    if (passInput) {
      passInput.parentElement.style.display = "none";
      passInput.removeAttribute("required");
    }
  } else {
    title.textContent = "Registrar Nuevo Usuario";
    submitBtn.textContent = "Registrar Usuario";

    // Show and require password for new
    if (passInput) {
      passInput.parentElement.style.display = "block";
      passInput.setAttribute("required", "true");
    }
  }
  showModal(modal);
}

// HANDLER: User Submit
async function handleUsuarioSubmit(e) {
  e.preventDefault();
  const id = e.target.dataset.editId;
  const nombre = document.getElementById("nombre-cliente").value;
  const email = document.getElementById("email-cliente").value;
  const telefono = document.getElementById("telefono-cliente").value;
  // Password only needed for new users
  const password = document.getElementById("password-cliente").value;

  try {
    if (id) {
      // Update Existing (No password change supported here)
      await fetchData(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, telefono }),
      });
      showGlobalNotification("Usuario actualizado exitosamente");
    } else {
      // Create New
      await fetchData("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, telefono }),
      });
      showGlobalNotification("Usuario creado exitosamente");
    }
    hideModal(document.getElementById("modal-admin-usuario"));
    cargarUsuarios();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// --- 6. DETALLE VENTA ---
export async function abrirModalDetalleVenta(id) {
  const modal = document.getElementById("modal-detalle-venta");
  if (!modal) return;

  // Reset contents
  document.getElementById("detalle-venta-items").innerHTML =
    '<tr><td colspan="4">Cargando...</td></tr>';
  document.getElementById("detalle-venta-id").textContent = id;
  document.getElementById("detalle-venta-fecha").textContent = "";
  document.getElementById("detalle-venta-cliente").textContent = "";
  document.getElementById("detalle-venta-total-final").textContent = "";

  showModal(modal);

  try {
    const venta = await fetchData(`/api/ventas/${id}`);

    // Header Info
    document.getElementById("detalle-venta-fecha").textContent = new Date(
      venta.fecha
    ).toLocaleString();
    document.getElementById("detalle-venta-cliente").textContent =
      venta.nombre_cliente || "Desconocido";

    // Items
    let htmlItems = "";
    if (venta.detalles && venta.detalles.length > 0) {
      htmlItems = venta.detalles
        .map((d) => {
          const subtotal = d.cantidad * d.precio_unitario;
          return `
                <tr>
                    <td>${d.nombre_producto || "Producto Eliminado"}</td>
                    <td style="text-align: center;">${d.cantidad}</td>
                    <td style="text-align: right;">$${d.precio_unitario.toFixed(
                      2
                    )}</td>
                    <td style="text-align: right;">$${subtotal.toFixed(2)}</td>
                </tr>`;
        })
        .join("");
    } else {
      htmlItems =
        '<tr><td colspan="4" style="text-align:center;">Sin detalles disponibles</td></tr>';
    }

    document.getElementById("detalle-venta-items").innerHTML = htmlItems;
    document.getElementById(
      "detalle-venta-total-final"
    ).textContent = `$${venta.monto_total.toFixed(2)}`;
  } catch (e) {
    console.error(e);
    alert("Error al cargar detalles de la venta: " + (e.message || e));
    hideModal(modal);
  }
}

// --- DOM Ready Setup ---
document.addEventListener("DOMContentLoaded", () => {
  // Modal Closers
  document
    .getElementById("cerrar-modal-admin-producto")
    ?.addEventListener("click", () =>
      hideModal(document.getElementById("modal-admin-producto"))
    );
  document
    .getElementById("cerrar-modal-admin-proveedor")
    ?.addEventListener("click", () =>
      hideModal(document.getElementById("modal-admin-proveedor"))
    );
  document
    .getElementById("cerrar-modal-admin-usuario")
    ?.addEventListener("click", () =>
      hideModal(document.getElementById("modal-admin-usuario"))
    );
  document
    .getElementById("cerrar-modal-detalle-venta")
    ?.addEventListener("click", () =>
      hideModal(document.getElementById("modal-detalle-venta"))
    );

  // Forms
  document
    .getElementById("form-nuevo-producto")
    ?.addEventListener("submit", handleProductoSubmit);
  document
    .getElementById("form-nuevo-proveedor")
    ?.addEventListener("submit", handleProveedorSubmit);
  document
    .getElementById("form-nuevo-cliente")
    ?.addEventListener("submit", handleUsuarioSubmit);

  // Upload Handler
  document
    .getElementById("file-imagen-producto")
    ?.addEventListener("change", handleUploadImage);
});

// --- HANDLER: Upload Image ---
async function handleUploadImage(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const statusSmall = document.getElementById("upload-status");
  const urlInput = document.getElementById("imagen-producto");

  statusSmall.textContent = "Subiendo...";
  statusSmall.style.color = "blue";

  try {
    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Error subiendo imagen");

    const data = await response.json();

    if (data.url.startsWith("http")) {
      urlInput.value = data.url;
    } else {
      urlInput.value = `${API_URL}${data.url}`;
    }

    statusSmall.textContent = "¡Subida exitosa!";
    statusSmall.style.color = "green";
  } catch (error) {
    console.error(error);
    statusSmall.textContent = "Error al subir.";
    statusSmall.style.color = "red";
  }
}

// Expose to Global
window.switchAdminTab = switchAdminTab;
window.cargarDatosAdminResumen = cargarDatosAdminResumen;
window.cargarProductosAdmin = cargarProductosAdmin;
window.eliminarProducto = eliminarProducto;
window.abrirModalProducto = abrirModalProducto;
window.abrirModalUsuario = abrirModalUsuario;
window.eliminarUsuario = eliminarUsuario;
window.showModalNuevoProveedor = showModalNuevoProveedor;
window.eliminarProveedor = eliminarProveedor;
window.cargarProveedoresAdmin = cargarProveedoresAdmin;
window.cargarHistorialVentasGlobal = cargarHistorialVentasGlobal;
window.handleTipoProductoChange = handleTipoProductoChange;
window.cargarProveedoresSelect = cargarProveedoresSelect;
window.abrirModalDetalleVenta = abrirModalDetalleVenta;
