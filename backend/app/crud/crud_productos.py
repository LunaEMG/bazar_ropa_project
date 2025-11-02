# Importaciones necesarias
from app.db.database import get_db_connection
# Importamos schemas relevantes para productos
from app.schemas import (
    ProductoUpdate, ProductoCreate, RopaDetalles, CalzadoDetalles, AccesoriosDetalles,
    ProductoUpdateConSubtipo, RopaDetallesUpdate, CalzadoDetallesUpdate, AccesoriosDetallesUpdate
)
import psycopg

# --- Función Auxiliar ---
# (Se mantiene la misma función auxiliar)
def row_to_dict(cursor, row):
    """Convierte una fila de psycopg (tupla) en un diccionario."""
    if row is None:
        return None
    column_names = [desc[0] for desc in cursor.description]
    return dict(zip(column_names, row))

# --- CREAR (Create): Añadir un nuevo producto (NUEVA FUNCIÓN) ---
def create_producto(producto_data: ProductoCreate):
    """
    Crea un nuevo producto en la tabla 'producto' y su correspondiente
    registro en la tabla de subtipo (ropa, calzado o accesorios).
    Utiliza una transacción para asegurar la atomicidad.
    """
    conn = get_db_connection()
    if conn is None: 
        return None

    new_producto_id = None
    try:
        # Inicia una transacción
        with conn.cursor() as cur, conn.transaction():
            
            # 1. Insertar en la tabla base 'producto' y obtener el ID
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
                
            new_producto_id = result[0] # El ID del nuevo producto
            
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
                # Si el tipo no coincide, forzamos un error para cancelar la transacción
                raise ValueError(f"Tipo de producto '{producto_data.tipo_producto}' o detalles no válidos.")
            
            # Commit automático al salir del 'with transaction'
            
    except (Exception, psycopg.Error, ValueError) as error:
        print(f"Error en transacción al crear producto: {error}")
        # Rollback automático
        if conn: 
            conn.close()
        return None # Indica que la creación falló
    finally:
        if conn: 
            conn.close()

    # Si todo salió bien, obtenemos el producto completo y lo retornamos
    if new_producto_id:
        return get_producto_by_id(new_producto_id)
    return None

# --- Funciones CRUD para Productos ---

# LEER (Read): Obtener todos los productos (Modificada para incluir tipo)
def get_all_productos():
    """Obtiene todos los productos de la tabla 'producto', determinando su tipo."""
    conn = get_db_connection()
    if conn is None:
        return [] 
        
    productos = []
    try:
        with conn.cursor() as cur:
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
                WHERE p.esta_activo = TRUE -- <-- AÑADIR ESTA LÍNEA
                ORDER BY p.nombre
            """)
            productos_rows = cur.fetchall()
            productos = [row_to_dict(cur, row) for row in productos_rows]
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener todos los productos: {error}")
    finally:
        if conn:
            conn.close()
            
    return productos

# LEER (Read): Obtener un solo producto por ID (Modificada para incluir detalles de subtipo)
def get_producto_by_id(producto_id: int):
    """
    Obtiene un producto por su ID, incluyendo:
      - datos base de 'producto'
      - detalles del subtipo correspondiente (ropa, calzado o accesorios)
      - tipo_producto siempre presente
    """
    conn = get_db_connection()
    if conn is None:
        return None

    producto = None
    tipo_detectado = None

    try:
        with conn.cursor() as cur:
            # 1 Obtener los datos base del producto
            cur.execute("""
                SELECT id_producto, nombre, descripcion, precio, cantidad_stock, id_proveedor
                FROM producto
                WHERE id_producto = %s
            """, (producto_id,))
            row = cur.fetchone()

            if not row:
                return None  # No existe el producto

            producto = row_to_dict(cur, row)

            # 2 Buscar en cada subtipo hasta encontrar el correcto
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

            # 3 Si no se encontró tipo, marcar como desconocido
            if not tipo_detectado:
                producto["tipo_producto"] = "desconocido"
                producto["detalles_subtipo"] = None

    except Exception as e:
        print(f" Error en get_producto_by_id({producto_id}): {e}")
        producto = None
    finally:
        if conn:
            conn.close()

    return producto



# ACTUALIZAR (Update): Modificar un producto existente (solo tabla base 'producto')
def update_producto(producto_id: int, producto_update: ProductoUpdateConSubtipo):
    """
    Actualiza los datos base de un producto en 'producto' y, si se proporcionan,
    actualiza también los detalles en la tabla de subtipo correspondiente.
    """
    conn = get_db_connection()
    if conn is None: 
        return None

    try:
        with conn.cursor() as cur, conn.transaction():
            
            # 1. Actualizar la tabla base 'producto'
            base_data = producto_update.model_dump(
                exclude_unset=True, 
                exclude={"tipo_producto", "detalles_subtipo"} # Excluir campos de subtipo
            )
            
            if base_data: # Solo si hay campos base para actualizar
                update_fields = [f"{key} = %s" for key in base_data]
                update_values = list(base_data.values())
                update_values.append(producto_id)
                
                query = f"""
                    UPDATE producto 
                    SET {', '.join(update_fields)} 
                    WHERE id_producto = %s
                    """
                cur.execute(query, tuple(update_values))

            # 2. Actualizar la tabla de subtipo (si se proporcionan detalles)
            if producto_update.detalles_subtipo:
                subtipo_data = producto_update.detalles_subtipo.model_dump(exclude_unset=True)
                
                if subtipo_data: # Solo si hay campos de subtipo para actualizar
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
        if conn: conn.close()
        return None
    finally:
        if conn: conn.close()
            
    # Retorna el producto actualizado completo
    return get_producto_by_id(producto_id)


# ELIMINAR (Delete): Borrar un producto existente (manejo de herencia)
def delete_producto(producto_id: int):
    """
    Desactiva un producto (borrado lógico) en lugar de eliminarlo.
    Ya no elimina de las tablas de subtipo, solo marca como inactivo.

    Returns:
        int: 
            1: si la desactivación fue exitosa (1 fila afectada).
            0: si el producto no fue encontrado (0 filas afectadas).
           -1: si ocurrió un error genérico de base de datos.
    """
    conn = get_db_connection()
    if conn is None: 
        print("Error: No se pudo conectar a la DB para desactivar producto.")
        return -1 # Indica error de conexión

    rows_updated_code = 0 # Valor por defecto si no se encuentra
    try:
        with conn.cursor() as cur, conn.transaction(): 
            
            # NO BORRAMOS DE ROPA/CALZADO/ACCESORIOS
            
            # 2. En lugar de DELETE, hacemos un UPDATE
            cur.execute(
                "UPDATE producto SET esta_activo = FALSE WHERE id_producto = %s", 
                (producto_id,)
            )
            rows_updated_code = cur.rowcount # Será 1 si se actualizó, 0 si no existía
            
            if rows_updated_code == 0:
                 pass # Se retornará 0
            # Commit automático si no hubo excepciones
            
    except (Exception, psycopg.Error) as error:
        print(f"Error SQL al desactivar (borrado lógico) producto {producto_id}: {error}")
        # Rollback automático
        rows_updated_code = -1 # Código para error genérico
    finally:
        if conn: 
            conn.close()
            
    # Retorna el código numérico resultado de la operación (1, 0, o -1)
    return rows_updated_code