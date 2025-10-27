# Importaciones necesarias
from app.db.database import get_db_connection
# Importamos schemas relevantes para productos
from app.schemas import ProductoUpdate 
import psycopg

# --- Función Auxiliar ---
# (Se mantiene la misma función auxiliar)
def row_to_dict(cursor, row):
    """Convierte una fila de psycopg (tupla) en un diccionario."""
    if row is None:
        return None
    column_names = [desc[0] for desc in cursor.description]
    return dict(zip(column_names, row))

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
            # Hacemos JOINs con las tablas de subtipo para identificar el tipo
            # Usamos LEFT JOIN para incluir productos que podrían no estar (incorrectamente) en ninguna subtipo
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
    Obtiene un producto específico por su 'id_producto', incluyendo 
    los detalles de su tabla de subtipo correspondiente (ropa, calzado, accesorios).
    """
    conn = get_db_connection()
    if conn is None:
        return None 
        
    producto = None
    try:
        with conn.cursor() as cur:
            # Primero, obtener los datos base del producto
            cur.execute("""
                SELECT id_producto, nombre, descripcion, precio, cantidad_stock, id_proveedor 
                FROM producto WHERE id_producto = %s
                """, (producto_id,))
            producto_row = cur.fetchone()

            if producto_row:
                producto = row_to_dict(cur, producto_row)
                
                # Ahora, buscar en las tablas de subtipos
                # Ropa
                cur.execute("SELECT material, tipo_corte, talla FROM ropa WHERE id_producto = %s", (producto_id,))
                ropa_row = cur.fetchone()
                if ropa_row:
                    producto['detalles_subtipo'] = row_to_dict(cur, ropa_row)
                    producto['tipo_producto'] = 'ropa' # Añadir tipo para claridad
                else:
                    # Calzado
                    cur.execute("SELECT talla_numerica, material_suela FROM calzado WHERE id_producto = %s", (producto_id,))
                    calzado_row = cur.fetchone()
                    if calzado_row:
                        producto['detalles_subtipo'] = row_to_dict(cur, calzado_row)
                        producto['tipo_producto'] = 'calzado'
                    else:
                        # Accesorios
                        cur.execute("SELECT material, dimensiones FROM accesorios WHERE id_producto = %s", (producto_id,))
                        accesorios_row = cur.fetchone()
                        if accesorios_row:
                            producto['detalles_subtipo'] = row_to_dict(cur, accesorios_row)
                            producto['tipo_producto'] = 'accesorios'

    except (Exception, psycopg.Error) as error:
         print(f"Error al obtener producto {producto_id}: {error}")
         producto = None # Asegura retornar None en caso de error
    finally:
        if conn:
            conn.close()
            
    return producto

# --- NUEVA Función ---
# ACTUALIZAR (Update): Modificar un producto existente (solo tabla base 'producto')
def update_producto(producto_id: int, producto_update: ProductoUpdate):
    """
    Actualiza los datos base de un producto existente en la tabla 'producto'.
    No modifica los datos específicos de las tablas de subtipo.
    """
    conn = get_db_connection()
    if conn is None: 
        return None

    update_fields = []
    update_values = []
    # Pydantic v2: model_dump | Pydantic v1: dict
    update_data = producto_update.model_dump(exclude_unset=True) 

    if not update_data: # Si no hay datos para actualizar
        conn.close()
        return get_producto_by_id(producto_id) # Retorna el registro actual

    for key, value in update_data.items():
        update_fields.append(f"{key} = %s")
        update_values.append(value)

    update_values.append(producto_id) # ID para la cláusula WHERE
    
    updated_producto_base = None
    try:
        with conn.cursor() as cur, conn.transaction(): 
            query = f"""
                UPDATE producto 
                SET {', '.join(update_fields)} 
                WHERE id_producto = %s 
                RETURNING id_producto, nombre, descripcion, precio, cantidad_stock, id_proveedor
                """
            cur.execute(query, tuple(update_values))
            
            updated_row = cur.fetchone()
            if updated_row:
                # Obtenemos los datos base actualizados
                updated_producto_base = row_to_dict(cur, updated_row)
                # Opcional: Podríamos aquí volver a llamar a get_producto_by_id para retornar 
                # el objeto completo con detalles de subtipo, pero es menos eficiente.
            # Commit automático
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar producto {producto_id}: {error}")
        # Rollback automático
    finally:
        if conn: 
            conn.close()
            
    # Retornamos solo los datos base actualizados o None si falló/no existía
    # Si se necesita el objeto completo, se puede llamar a get_producto_by_id desde el router
    return updated_producto_base 

# --- NUEVA Función ---
# ELIMINAR (Delete): Borrar un producto existente (manejo de herencia)
def delete_producto(producto_id: int):
    """
    Elimina un producto de la tabla 'producto' y su correspondiente
    registro en la tabla de subtipo (ropa, calzado o accesorios).
    Utiliza una transacción para asegurar la atomicidad.

    Returns:
        bool: True si la eliminación fue exitosa, False en caso contrario.
              Puede fallar si el producto está referenciado en 'detalle_venta'.
    """
    conn = get_db_connection()
    if conn is None: 
        return False

    rows_deleted_total = 0
    try:
        with conn.cursor() as cur, conn.transaction(): 
            # 1. Eliminar de la tabla de subtipo (ignorará si no existe en una tabla específica)
            # Como la FK en subtipos tiene ON DELETE CASCADE, podríamos omitir estos DELETEs
            # si confiamos en la cascada, pero hacerlo explícito puede ser más claro.
            cur.execute("DELETE FROM ropa WHERE id_producto = %s", (producto_id,))
            cur.execute("DELETE FROM calzado WHERE id_producto = %s", (producto_id,))
            cur.execute("DELETE FROM accesorios WHERE id_producto = %s", (producto_id,))

            # 2. Eliminar de la tabla principal 'producto'
            cur.execute("DELETE FROM producto WHERE id_producto = %s", (producto_id,))
            rows_deleted_total = cur.rowcount # Verifica si se eliminó de la tabla 'producto'
            
            # Si rowcount es 0, el producto no existía en 'producto', forzamos rollback
            if rows_deleted_total == 0:
                raise psycopg.Error(f"Producto con ID {producto_id} no encontrado en tabla 'producto'.")

            # Commit automático si no hubo excepciones
            
    except psycopg.errors.ForeignKeyViolation as fk_error:
        # Error específico si el producto está siendo referenciado (ej. en detalle_venta)
        print(f"Error de FK al eliminar producto {producto_id}: {fk_error}")
        # Rollback automático
        rows_deleted_total = -2 # Código de error específico para FK
        
    except (Exception, psycopg.Error) as error:
        print(f"Error al eliminar producto {producto_id}: {error}")
        # Rollback automático
        rows_deleted_total = -1 # Código de error genérico
    finally:
        if conn: 
            conn.close()
            
    # Retorna True solo si se eliminó exactamente una fila de la tabla 'producto'
    return rows_deleted_total # Retorna el número directamente (0, 1, -1, -2)