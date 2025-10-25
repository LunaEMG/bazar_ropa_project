# Importaciones necesarias
from app.db.database import get_db_connection
from app.schemas import VentaCreate 
from datetime import date 
import psycopg 

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

def create_venta(venta_data: VentaCreate):
    """
    Crea un registro de venta y sus detalles asociados dentro de una transacción.

    Args:
        venta_data (VentaCreate): Datos de la venta a crear, incluyendo detalles.

    Returns:
        dict | None: Diccionario con los datos de la venta creada (incluyendo detalles) 
                      o None si ocurre un error.
    """
    conn = get_db_connection()
    if conn is None:
        # Loggear o manejar adecuadamente el error de conexión
        print("Error crítico: No se pudo establecer conexión con la base de datos.")
        return None

    monto_total_calculado = 0.0

    try:
        # Inicia una transacción para garantizar la atomicidad.
        with conn.cursor() as cur, conn.transaction(): 
            
            # 1. Calcular el monto total a partir de los detalles recibidos.
            for detalle in venta_data.detalles:
                monto_total_calculado += detalle.cantidad * detalle.precio_unitario

            # 2. Insertar el registro principal en la tabla 'venta'.
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
                 # Si la inserción falla, lanza una excepción para forzar rollback.
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
                    # Si alguna inserción de detalle falla, lanza excepción para rollback.
                    raise psycopg.Error(f"Fallo al insertar detalle para producto ID: {detalle.id_producto}")
                detalles_insertados.append(row_to_dict(cur, new_detalle_row))

            # Al salir exitosamente del bloque 'with conn.transaction()', 
            # la transacción se confirma (COMMIT) automáticamente.

        conn.close()
        # Añade los detalles insertados al diccionario de la venta para retornarlo.
        new_venta_dict['detalles'] = detalles_insertados 
        return new_venta_dict

    except (Exception, psycopg.Error) as error:
        # Cualquier excepción dentro del bloque 'with transaction' causará un ROLLBACK.
        print(f"Error durante la transacción de venta: {error}")
        if conn: # Asegura cerrar la conexión si aún está abierta tras un error.
             conn.close()
        return None # Indica que la operación falló.