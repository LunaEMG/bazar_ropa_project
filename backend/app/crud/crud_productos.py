# Importaciones necesarias
from app.db.database import get_db_connection 
from app.schemas import (
    ProductoUpdate, ProductoCreate, RopaDetalles, CalzadoDetalles, AccesoriosDetalles,
    ProductoUpdateConSubtipo, RopaDetallesUpdate, CalzadoDetallesUpdate, AccesoriosDetallesUpdate
)
import psycopg
from psycopg import Connection 

# --- Función Auxiliar ---
def row_to_dict(cursor, row):
    """Convierte una fila de psycopg (tupla) en un diccionario."""
    if row is None:
        return None
    column_names = [desc[0] for desc in cursor.description]
    return dict(zip(column_names, row))

# --- CREAR (Create): Añadir un nuevo producto ---
def create_producto(db: Connection, producto_data: ProductoCreate): 
    """
    Crea un nuevo producto en la tabla 'producto' y su correspondiente
    registro en la tabla de subtipo (ropa, calzado o accesorios).
    Utiliza una transacción para asegurar la atomicidad.
    """

    new_producto_id = None
    try:
        # Inicia una transacción con 'db'
        with db.cursor() as cur, db.transaction():
            
            # 1. Insertar en la tabla base 'producto'
            cur.execute(
                """
                INSERT INTO producto (nombre, descripcion, precio, cantidad_stock, id_proveedor)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id_producto
                """,
                (
                    producto_data.nombre, 
                    producto_data.descripcion, 
                    producto_data.precio, 
                    producto_data.cantidad_stock, 
                    producto_data.id_proveedor
                )
            )
            
            result = cur.fetchone()
            if result is None:
                raise psycopg.Error("Fallo al insertar en la tabla 'producto'.")
                
            new_producto_id = result[0]
            detalles = producto_data.detalles_subtipo
            
            # 2. Insertar en la tabla de subtipo correspondiente
            if producto_data.tipo_producto == "ropa" and isinstance(detalles, RopaDetalles):
                cur.execute(
                    """
                    INSERT INTO ropa (id_producto, material, tipo_corte, talla)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (new_producto_id, detalles.material, detalles.tipo_corte, detalles.talla)
                )
            elif producto_data.tipo_producto == "calzado" and isinstance(detalles, CalzadoDetalles):
                cur.execute(
                    """
                    INSERT INTO calzado (id_producto, talla_numerica, material_suela)
                    VALUES (%s, %s, %s)
                    """,
                    (new_producto_id, detalles.talla_numerica, detalles.material_suela)
                )
            elif producto_data.tipo_producto == "accesorios" and isinstance(detalles, AccesoriosDetalles):
                cur.execute(
                    """
                    INSERT INTO accesorios (id_producto, material, dimensiones)
                    VALUES (%s, %s, %s)
                    """,
                    (new_producto_id, detalles.material, detalles.dimensiones)
                )
            else:
                raise ValueError(f"Tipo de producto '{producto_data.tipo_producto}' o detalles no válidos.")
            
            # Commit automático
            
    except (Exception, psycopg.Error, ValueError) as error:
        print(f"Error en transacción al crear producto: {error}")
        # Rollback automático
        return None

    if new_producto_id:
        # Pasamos 'db' a la llamada
        return get_producto_by_id(db=db, producto_id=new_producto_id)
    return None

# --- Funciones CRUD para Productos ---

# LEER (Read): Obtener todos los productos
def get_all_productos(db: Connection): 
    """Obtiene todos los productos de la tabla 'producto', determinando su tipo."""
        
    productos = []
    try:
        with db.cursor() as cur: 
            cur.execute("""
                SELECT 
                    p.id_producto, p.nombre, p.descripcion, p.precio, p.cantidad_stock, p.id_proveedor,
                    CASE 
                        WHEN r.id_producto IS NOT NULL THEN 'ropa'
                        WHEN c.id_producto IS NOT NULL THEN 'calzado'
                        WHEN a.id_producto IS NOT NULL THEN 'accesorios'
                        ELSE 'desconocido' 
                    END AS tipo_producto
                FROM producto p
                LEFT JOIN ropa r ON p.id_producto = r.id_producto
                LEFT JOIN calzado c ON p.id_producto = c.id_producto
                LEFT JOIN accesorios a ON p.id_producto = a.id_producto
                WHERE p.esta_activo = TRUE
                ORDER BY p.nombre
            """)
            productos_rows = cur.fetchall()
            productos = [row_to_dict(cur, row) for row in productos_rows]
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener todos los productos: {error}")
            
    return productos

# LEER (Read): Obtener un solo producto por ID
def get_producto_by_id(db: Connection, producto_id: int): 
    """
    Obtiene un producto por su ID, incluyendo...
    """

    producto = None
    tipo_detectado = None

    try:
        with db.cursor() as cur: 
            # 1 Obtener los datos base del producto
            cur.execute("""
                SELECT id_producto, nombre, descripcion, precio, cantidad_stock, id_proveedor
                FROM producto
                WHERE id_producto = %s AND esta_activo = TRUE
            """, (producto_id,))
            row = cur.fetchone()

            if not row:
                return None  

            producto = row_to_dict(cur, row)

            # 2 Buscar en cada subtipo
            cur.execute("SELECT material, tipo_corte, talla FROM ropa WHERE id_producto = %s", (producto_id,))
            r = cur.fetchone()
            if r:
                producto["tipo_producto"] = "ropa"
                producto["detalles_subtipo"] = row_to_dict(cur, r)
                tipo_detectado = "ropa"

            if not tipo_detectado:
                cur.execute("SELECT talla_numerica, material_suela FROM calzado WHERE id_producto = %s", (producto_id,))
                c = cur.fetchone()
                if c:
                    producto["tipo_producto"] = "calzado"
                    producto["detalles_subtipo"] = row_to_dict(cur, c)
                    tipo_detectado = "calzado"

            if not tipo_detectado:
                cur.execute("SELECT material, dimensiones FROM accesorios WHERE id_producto = %s", (producto_id,))
                a = cur.fetchone()
                if a:
                    producto["tipo_producto"] = "accesorios"
                    producto["detalles_subtipo"] = row_to_dict(cur, a)
                    tipo_detectado = "accesorios"

            if not tipo_detectado:
                producto["tipo_producto"] = "desconocido"
                producto["detalles_subtipo"] = None

    except Exception as e:
        print(f" Error en get_producto_by_id({producto_id}): {e}")
        producto = None

    return producto



# ACTUALIZAR (Update): Modificar un producto existente
def update_producto(db: Connection, producto_id: int, producto_update: ProductoUpdateConSubtipo): 
    """
    Actualiza los datos base de un producto en 'producto' y...
    """

    try:
        with db.cursor() as cur, db.transaction(): 
            
            # 1. Actualizar la tabla base 'producto'
            base_data = producto_update.model_dump(
                exclude_unset=True, 
                exclude={"tipo_producto", "detalles_subtipo"}
            )
            
            if base_data:
                update_fields = [f"{key} = %s" for key in base_data]
                update_values = list(base_data.values())
                update_values.append(producto_id)
                
                query = f"""
                    UPDATE producto 
                    SET {', '.join(update_fields)} 
                    WHERE id_producto = %s
                    """
                cur.execute(query, tuple(update_values))

            # 2. Actualizar la tabla de subtipo
            if producto_update.detalles_subtipo:
                subtipo_data = producto_update.detalles_subtipo.model_dump(exclude_unset=True)
                
                if subtipo_data:
                    subtipo_fields = [f"{key} = %s" for key in subtipo_data]
                    subtipo_values = list(subtipo_data.values())
                    subtipo_values.append(producto_id)
                    
                    tabla_subtipo = ""
                    if producto_update.tipo_producto == "ropa":
                        tabla_subtipo = "ropa"
                    elif producto_update.tipo_producto == "calzado":
                        tabla_subtipo = "calzado"
                    elif producto_update.tipo_producto == "accesorios":
                        tabla_subtipo = "accesorios"
                    
                    if tabla_subtipo:
                        subtipo_query = f"""
                            UPDATE {tabla_subtipo}
                            SET {', '.join(subtipo_fields)}
                            WHERE id_producto = %s
                        """
                        cur.execute(subtipo_query, tuple(subtipo_values))
            
            # Commit automático
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar producto {producto_id}: {error}")
        return None
            
    # Retorna el producto actualizado completo (pasando db)
    return get_producto_by_id(db=db, producto_id=producto_id)


# ELIMINAR (Delete): Borrar un producto existente
def delete_producto(db: Connection, producto_id: int): 
    """
    Desactiva un producto (borrado lógico)...
    """

    rows_updated_code = 0
    try:
        with db.cursor() as cur, db.transaction(): 
            
            cur.execute(
                "UPDATE producto SET esta_activo = FALSE WHERE id_producto = %s", 
                (producto_id,)
            )
            rows_updated_code = cur.rowcount
            
    except (Exception, psycopg.Error) as error:
        print(f"Error SQL al desactivar (borrado lógico) producto {producto_id}: {error}")
        rows_updated_code = -1
            
    return rows_updated_code