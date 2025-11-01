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

    Args:
        venta_data (VentaCreate): Datos de la venta a crear, incluyendo detalles.

    Returns:
        dict | None: Diccionario con los datos de la venta creada (incluyendo detalles) 
                      o None si ocurre un error.
    """
    conn = get_db_connection()
    if conn is None:
        print("Error crítico: No se pudo establecer conexión con la base de datos.")
        return None

    monto_total_calculado = 0.0

    try:
        # Inicia una transacción
        with conn.cursor() as cur, conn.transaction(): 
            
            # 1. Calcular el monto total a partir de los detalles.
            for detalle in venta_data.detalles:
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

            # 3. Insertar cada registro de detalle en 'detalle_venta'.
            detalles_insertados = []
            for detalle in venta_data.detalles:
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

    except (Exception, psycopg.Error) as error:
        # Rollback automático si ocurre una excepción
        print(f"Error durante la transacción de venta: {error}")
        if conn:
             conn.close()
        return None # Indica que la operación falló.

# --- NUEVA Función Auxiliar ---
def get_detalles_for_venta(cursor, venta_id: int):
    """
    Función auxiliar para obtener los detalles de una venta específica 
    usando un cursor existente.
    """
    cursor.execute(
        "SELECT id_venta, id_producto, cantidad, precio_unitario FROM detalle_venta WHERE id_venta = %s",
        (venta_id,)
    )
    detalles_rows = cursor.fetchall()
    return [row_to_dict(cursor, row) for row in detalles_rows]

# --- NUEVA Función ---
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

# --- NUEVA Función ---
def get_all_ventas():
    """
    Obtiene todas las ventas registradas, incluyendo sus respectivos detalles.
    ADVERTENCIA: Esto puede ser ineficiente (problema N+1) si hay muchas ventas.
    Para producción, se preferiría paginación o un JOIN más complejo.

    Returns:
        List[dict]: Una lista de diccionarios de ventas, cada uno con sus detalles.
    """
    conn = get_db_connection()
    if conn is None:
        return []

    ventas = []
    try:
        with conn.cursor() as cur:
            # 1. Obtener todas las ventas principales
            cur.execute("SELECT id_venta, id_cliente, fecha, monto_total FROM venta ORDER BY fecha DESC")
            ventas_rows = cur.fetchall()
            
            # 2. Para cada venta, obtener sus detalles
            for venta_row in ventas_rows:
                venta = row_to_dict(cur, venta_row)
                venta['detalles'] = get_detalles_for_venta(cur, venta['id_venta'])
                ventas.append(venta)
                
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener todas las ventas: {error}")
    finally:
        if conn:
            conn.close()
            
    return ventas