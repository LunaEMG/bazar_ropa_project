# Bazar de Ropa Project

Este es un sistema integral de gestión para un **Bazar de Ropa**, desarrollado como proyecto para la materia de **"Bases de Datos"**. El proyecto combina una base de datos relacional robusta con un backend moderno en FastAPI y un frontend interactivo.

## 🚀 Características Principales

* **Gestión de Inventario Especializado**: Implementación de herencia de tablas (supertipos y subtipos) para manejar distintos tipos de productos como Ropa, Calzado y Accesorios.
* **Sistema de Usuarios y Roles**: Diferenciación entre administradores y clientes, incluyendo autenticación segura y gestión de direcciones.
* **Proceso de Venta Completo**: Registro de transacciones con detalles de venta, cálculo de montos y manejo de stock.
* **Reportes y Analítica**: Vistas SQL integradas para identificar productos con bajo stock y analizar el gasto por cliente.
* **Gestión de Imágenes**: Integración para el almacenamiento y visualización de imágenes de productos a través de una carpeta estática y rutas de carga.

## 🛠️ Tecnologías Utilizadas

### Backend
* **FastAPI**: Framework principal para la construcción de la API REST.
* **SQLAlchemy (ORM)**: Para el mapeo objeto-relacional y la lógica de negocio en Python.
* **Bcrypt & Passlib**: Para el hasheo seguro de contraseñas.
* **Python-jose**: Manejo de tokens JWT para autenticación.

### Base de Datos
* **PostgreSQL**: Motor de base de datos relacional.
* **SQL Estándar**: Definición de esquemas, vistas y restricciones de integridad.

### Frontend
* Interfaz web desarrollada con HTML, CSS y JavaScript.

## 📊 Arquitectura de la Base de Datos

El diseño destaca por el uso de **Especialización/Generalización** para los productos:
1.  **Producto (Supertipo)**: Contiene atributos generales como nombre, precio y stock.
2.  **Ropa, Calzado y Accesorios (Subtipos)**: Extienden a la tabla producto con atributos específicos como material, talla o dimensiones.

Además, incluye vistas predefinidas para reportes:
* `v_productos_bajo_stock`: Alerta de inventario crítico (menos de 10 unidades).
* `v_ventas_por_cliente`: Ranking de clientes por volumen de gasto.

## 🔧 Instalación y Configuración

### Requisitos Previos
* Python 3.9 o superior.
* PostgreSQL.

### Pasos
1.  **Clonar el repositorio**:
    ```bash
    git clone [https://github.com/tu-usuario/bazar_ropa_project.git](https://github.com/tu-usuario/bazar_ropa_project.git)
    cd bazar_ropa_project
    ```

2.  **Configurar el entorno virtual e instalar dependencias**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # En Windows: venv\Scripts\activate
    pip install -r backend/requirements.txt
    ```

3.  **Configurar la Base de Datos**:
    * Crea una base de datos en PostgreSQL.
    * Ejecuta el script `database/schema.sql` para crear las tablas y vistas.
    * (Opcional) Ejecuta `database/seeds.sql` para cargar datos de prueba y resetear las secuencias de IDs.

4.  **Iniciar el servidor**:
    ```bash
    uvicorn app.main:app --reload
    ```
    La API estará disponible en `http://127.0.0.1:8000` y la documentación interactiva en `/docs`.

---
*Este proyecto fue desarrollado con fines educativos para la comprensión de sistemas transaccionales y diseño de bases de datos relacionales.*
