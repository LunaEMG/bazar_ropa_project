# Importaciones necesarias
from app.db.database import get_db_connection
from app.schemas import VentaCreate 
from datetime import date 
import psycopg 

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Ventas y Detalle_Venta ---

def create_venta(venta_data: VentaCreate):
    """
    Crea un nuevo registro de venta y sus detalles asociados en la base de datos.
    Utiliza una transacción para asegurar la atomicidad de la operación.
    
    NUEVO: Ahora también verifica el stock y lo descuenta.
    """
    conn = get_db_connection()
    if conn is None:
        print("Error crítico: No se pudo establecer conexión con la base de datos.")
        return None

    monto_total_calculado = 0.0

    try:
        # Inicia una transacción
        with conn.cursor() as cur, conn.transaction(): 
            
            # --- Paso 1 - Verificar stock y calcular total ---
            # Hacemos esto ANTES de insertar la venta.
            for detalle in venta_data.detalles:
                # Bloquea la fila del producto para evitar que dos ventas
                # compren el mismo item al mismo tiempo (evita "race conditions").
                cur.execute(
                    "SELECT nombre, cantidad_stock FROM producto WHERE id_producto = %s FOR UPDATE",
                    (detalle.id_producto,)
                )
                producto_row = cur.fetchone()
                
                if producto_row is None:
                    # Si el producto no existe, lanza un error que cancelará la transacción.
                    raise ValueError(f"Producto con ID {detalle.id_producto} no encontrado.")
                
                nombre_producto = producto_row[0]
                stock_actual = producto_row[1]

                # La validación clave:
                if stock_actual < detalle.cantidad:
                    raise ValueError(f"Stock insuficiente para '{nombre_producto}'. Solicitados: {detalle.cantidad}, Disponibles: {stock_actual}")
                
                # Si hay stock, sumamos al total
                monto_total_calculado += detalle.cantidad * detalle.precio_unitario

            # 2. Insertar en la tabla 'venta'.
            cur.execute(
                """
                INSERT INTO venta (id_cliente, fecha, monto_total) 
                VALUES (%s, %s, %s) 
                RETURNING id_venta, id_cliente, fecha, monto_total
                """,
                (venta_data.id_cliente, date.today(), monto_total_calculado)
            )
            new_venta_row = cur.fetchone()
            if new_venta_row is None:
                 raise psycopg.Error("Fallo al insertar en la tabla 'venta'.") 
            
            new_venta_dict = row_to_dict(cur, new_venta_row)
            new_venta_id = new_venta_dict['id_venta']

            # --- Paso 3 - Insertar detalles y ACTUALIZAR stock ---
            detalles_insertados = []
            for detalle in venta_data.detalles:
                
                # --- Actualizar el stock en la BD ---
                cur.execute(
                    "UPDATE producto SET cantidad_stock = cantidad_stock - %s WHERE id_producto = %s",
                    (detalle.cantidad, detalle.id_producto)
                )
                # --- FIN DE ACTUALIZACIÓN ---

                # Insertar en detalle_venta (como antes)
                cur.execute(
                    """
                    INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) 
                    VALUES (%s, %s, %s, %s)
                    RETURNING id_venta, id_producto, cantidad, precio_unitario 
                    """,
                    (new_venta_id, detalle.id_producto, detalle.cantidad, detalle.precio_unitario)
                )
                new_detalle_row = cur.fetchone()
                if new_detalle_row is None:
                    raise psycopg.Error(f"Fallo al insertar detalle para producto ID: {detalle.id_producto}")
                detalles_insertados.append(row_to_dict(cur, new_detalle_row))

            # Commit automático al salir del 'with conn.transaction()'

        conn.close()
        # Añade los detalles insertados al diccionario de la venta para retornarlo.
        new_venta_dict['detalles'] = detalles_insertados 
        return new_venta_dict

    # --- Capturador de error de stock ---
    except ValueError as e: # Captura el error de "Stock insuficiente"
        print(f"Error de validación en Venta: {e}")
        if conn:
             conn.close() # La transacción se revierte automáticamente
        # Re-lanza el error para que el router lo atrape
        raise e
    
    except (Exception, psycopg.Error) as error:
        # Rollback automático si ocurre una excepción
        print(f"Error durante la transacción de venta: {error}")
        if conn:
             conn.close()
        return None # Indica que la operación falló.


# --- Función Auxiliar ---
def get_detalles_for_venta(cursor, venta_id: int):
    """
    Función auxiliar para obtener los detalles de una venta específica 
    usando un cursor existente.
    """
    cursor.execute(
        """
        SELECT 
            dv.id_venta, 
            dv.id_producto, 
            dv.cantidad, 
            dv.precio_unitario,
            p.nombre AS nombre_producto
        FROM detalle_venta dv
        JOIN producto p ON dv.id_producto = p.id_producto 
        WHERE dv.id_venta = %s
        """,
        (venta_id,)
    )
    detalles_rows = cursor.fetchall()
    return [row_to_dict(cursor, row) for row in detalles_rows]

# --- Función obtiene venta por ID---
def get_venta_by_id(venta_id: int):
    """
    Obtiene una venta específica por su ID, incluyendo sus detalles.

    Args:
        venta_id (int): El ID de la venta a buscar.

    Returns:
        dict | None: Un diccionario de la venta con sus detalles, o None si no se encuentra.
    """
    conn = get_db_connection()
    if conn is None:
        return None
    
    venta = None
    try:
        with conn.cursor() as cur:
            # 1. Obtener los datos de la venta principal
            cur.execute(
                "SELECT id_venta, id_cliente, fecha, monto_total FROM venta WHERE id_venta = %s",
                (venta_id,)
            )
            venta_row = cur.fetchone()
            
            if venta_row:
                venta = row_to_dict(cur, venta_row)
                # 2. Obtener los detalles asociados
                venta['detalles'] = get_detalles_for_venta(cur, venta_id)
                
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener venta {venta_id}: {error}")
    finally:
        if conn:
            conn.close()
            
    return venta # Retorna la venta (con detalles) o None

def get_all_ventas():
    """
    Obtiene todas las ventas registradas, incluyendo sus respectivos detalles.
    """
    conn = get_db_connection()
    if conn is None:
        return []

    ventas_dict = {} # Usar un diccionario para agrupar
    
    try:
        with conn.cursor() as cur:
            # 1. Obtener todas las ventas principales
            cur.execute("SELECT id_venta, id_cliente, fecha, monto_total FROM venta ORDER BY fecha DESC")
            ventas_rows = cur.fetchall()
            
            # Guardamos los nombres de columna de 'venta' ANTES de hacer más consultas
            venta_column_names = [desc[0] for desc in cur.description] 

            # 2. Procesar cada venta y obtener sus detalles
            for venta_row in ventas_rows:
                # Convertir la fila de venta a diccionario USANDO los nombres de columna guardados
                venta_dict = dict(zip(venta_column_names, venta_row))
                venta_id = venta_dict['id_venta']
                
                # Obtener los detalles para esta venta (esto reutiliza el cursor 'cur')
                venta_dict['detalles'] = get_detalles_for_venta(cur, venta_id)
                
                ventas_dict[venta_id] = venta_dict
                
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener todas las ventas: {error}")
    finally:
        if conn:
            conn.close()
            
    # Convertir el diccionario de ventas de nuevo a una lista
    return list(ventas_dict.values())