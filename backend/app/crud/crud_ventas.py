# Importaciones necesarias
from app.schemas import VentaCreate 
from datetime import date 
import psycopg 
from psycopg import Connection 

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 
# Importamos crud_clientes para obtener el nombre del cliente
from . import crud_clientes

# --- Funciones CRUD para Ventas y Detalle_Venta ---

def create_venta(db: Connection, venta_data: VentaCreate):
    """
    Crea un nuevo registro de venta y sus detalles asociados en la base de datos.
    Utiliza una transacción para asegurar la atomicidad de la operación.
    
    CORREGIDO:
    - Recibe la conexión 'db' del pool (Inyección de Dependencias).
    - Obtiene el precio real desde la BD para evitar manipulación.
    - Descuenta el stock.
    """
    
    # 1. Ya no llamamos a get_db_connection() ni cerramos la conexión.
    
    monto_total_calculado = 0.0
    
    # Lista para guardar los detalles con el precio verificado de la BD
    detalles_con_precio = [] 

    try:
        # Inicia una transacción usando la conexión 'db' recibida
        with db.cursor() as cur, db.transaction(): 
            
            # --- Paso 1 - Verificar stock, OBTENER PRECIO y calcular total ---
            for detalle in venta_data.detalles:
                
                # CORRECCIÓN DE SQL: Añadimos 'precio' al SELECT
                cur.execute(
                    """
                    SELECT nombre, cantidad_stock, precio 
                    FROM producto 
                    WHERE id_producto = %s 
                    FOR UPDATE
                    """,
                    (detalle.id_producto,)
                )
                producto_row = cur.fetchone()
                
                if producto_row is None:
                    # Si el producto no existe, lanza un error que cancelará la transacción.
                    raise ValueError(f"Producto con ID {detalle.id_producto} no encontrado.")
                
                nombre_producto = producto_row[0]
                stock_actual = producto_row[1]
                precio_bd = producto_row[2] # <-- ¡PRECIO OFICIAL DE LA BD!

                # La validación clave:
                if stock_actual < detalle.cantidad:
                    raise ValueError(f"Stock insuficiente para '{nombre_producto}'. Solicitados: {detalle.cantidad}, Disponibles: {stock_actual}")
                
                # CORRECCIÓN DE SEGURIDAD: Usamos precio_bd para el total
                monto_total_calculado += detalle.cantidad * precio_bd
                
                # Guardamos el detalle con el precio correcto para usarlo después
                detalles_con_precio.append({
                    "id_producto": detalle.id_producto,
                    "cantidad": detalle.cantidad,
                    "precio_unitario_bd": precio_bd # Guardamos el precio de la BD
                })

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
            
            # Usamos nuestra lista 'detalles_con_precio' que tiene el precio bueno
            for detalle_seguro in detalles_con_precio:
                
                # --- Actualizar el stock en la BD ---
                cur.execute(
                    "UPDATE producto SET cantidad_stock = cantidad_stock - %s WHERE id_producto = %s",
                    (detalle_seguro["cantidad"], detalle_seguro["id_producto"])
                )

                # Insertar en detalle_venta (usando el precio_unitario_bd)
                cur.execute(
                    """
                    INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) 
                    VALUES (%s, %s, %s, %s)
                    RETURNING id_venta, id_producto, cantidad, precio_unitario 
                    """,
                    (
                        new_venta_id, 
                        detalle_seguro["id_producto"], 
                        detalle_seguro["cantidad"], 
                        detalle_seguro["precio_unitario_bd"] 
                    )
                )
                new_detalle_row = cur.fetchone()
                if new_detalle_row is None:
                    raise psycopg.Error(f"Fallo al insertar detalle para producto ID: {detalle_seguro['id_producto']}")
                detalles_insertados.append(row_to_dict(cur, new_detalle_row))

            # Commit automático al salir del 'with db.transaction()'

        # 3. Ya no cerramos la conexión (conn.close() eliminado)

        # Añade los detalles insertados al diccionario de la venta para retornarlo.
        new_venta_dict['detalles'] = detalles_insertados 
        
        # Obtenemos el nombre del cliente (pasando la 'db')
        cliente_info = crud_clientes.get_cliente_by_id(db=db, cliente_id=new_venta_dict['id_cliente'])
        new_venta_dict['nombre_cliente'] = cliente_info['nombre'] if cliente_info else "(Cliente no encontrado)"
        
        return new_venta_dict

    # --- Capturador de error de stock ---
    except ValueError as e: # Captura el error de "Stock insuficiente"
        print(f"Error de validación en Venta: {e}")
        # La transacción se revierte automáticamente
        # Re-lanza el error para que el router lo atrape
        raise e
    
    except (Exception, psycopg.Error) as error:
        # Rollback automático si ocurre una excepción
        print(f"Error durante la transacción de venta: {error}")
        return None # Indica que la operación falló.


# --- Función Auxiliar ---
def get_detalles_for_venta(cursor, venta_id: int):
    """
    Función auxiliar para obtener los detalles de una venta específica 
    usando un cursor existente. (Esta función no cambia)
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
        LEFT JOIN producto p ON dv.id_producto = p.id_producto 
        WHERE dv.id_venta = %s
        """,
        (venta_id,)
    )
    detalles_rows = cursor.fetchall()
    # Manejo de caso donde el producto fue eliminado (nombre_producto es NULL)
    detalles = []
    for row in detalles_rows:
        detalle_dict = row_to_dict(cursor, row)
        if detalle_dict['nombre_producto'] is None:
            detalle_dict['nombre_producto'] = '(Producto Eliminado)'
        detalles.append(detalle_dict)
    return detalles

# --- Función obtiene venta por ID---
def get_venta_by_id(db: Connection, venta_id: int):
    """
    Obtiene una venta específica por su ID, incluyendo sus detalles.
    """
    
    venta = None
    try:
        with db.cursor() as cur: 
            # 1. Obtener los datos de la venta principal
            cur.execute(
                """
                SELECT v.id_venta, v.id_cliente, v.fecha, v.monto_total,
                       c.nombre AS nombre_cliente
                FROM venta v
                LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
                WHERE v.id_venta = %s
                """,
                (venta_id,)
            )
            venta_row = cur.fetchone()
            
            if venta_row:
                venta = row_to_dict(cur, venta_row)
                # 2. Obtener los detalles asociados
                venta['detalles'] = get_detalles_for_venta(cur, venta_id)
                
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener venta {venta_id}: {error}")
            
    return venta # Retorna la venta (con detalles) o None

def get_all_ventas(db: Connection):
    """
    Obtiene todas las ventas registradas, incluyendo sus respectivos detalles.
    """

    ventas_dict = {} # Usar un diccionario para agrupar
    
    try:
        with db.cursor() as cur:
            # 1. Obtener todas las ventas principales
            cur.execute("""
                SELECT 
                    v.id_venta, v.id_cliente, v.fecha, v.monto_total, 
                    c.nombre AS nombre_cliente
                FROM venta v
                LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
                WHERE c.esta_activo = TRUE OR c.esta_activo IS NULL
                ORDER BY v.fecha DESC, v.id_venta DESC
            """)
            ventas_rows = cur.fetchall()
            
            venta_column_names = [desc[0] for desc in cur.description] 

            # 2. Procesar cada venta y obtener sus detalles
            for venta_row in ventas_rows:
                venta_dict = dict(zip(venta_column_names, venta_row))
                venta_id = venta_dict['id_venta']
                
                # Si el cliente fue eliminado (borrado lógico), c.nombre será NULL
                if venta_dict['nombre_cliente'] is None and venta_dict['id_cliente'] is not None:
                     venta_dict['nombre_cliente'] = '(Cliente Eliminado)'

                venta_dict['detalles'] = get_detalles_for_venta(cur, venta_id)
                
                ventas_dict[venta_id] = venta_dict
                
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener todas las ventas: {error}")
            
    # Convertir el diccionario de ventas de nuevo a una lista
    return list(ventas_dict.values())