# Importaciones necesarias
from app.db.database import get_db_connection
from app.schemas import DireccionCreate # Schema para validar datos de entrada
import psycopg

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Direcciones ---

def create_direccion_for_cliente(cliente_id: int, direccion: DireccionCreate):
    """
    Inserta una nueva dirección asociada a un cliente específico.

    Args:
        cliente_id (int): ID del cliente al que pertenece la dirección.
        direccion (DireccionCreate): Datos de la dirección a crear.

    Returns:
        dict | None: Diccionario con los datos de la dirección creada 
                      o None si ocurre un error.
    """
    conn = get_db_connection()
    if conn is None:
        print("Error crítico: No se pudo establecer conexión con la base de datos.")
        return None

    new_direccion = None
    try:
        # La transacción se maneja implícitamente por el cursor context manager
        with conn.cursor() as cur:
            # Ejecuta la inserción incluyendo el id_cliente
            cur.execute(
                """
                INSERT INTO direccion (calle, ciudad, codigo_postal, id_cliente) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id_direccion, calle, ciudad, codigo_postal, id_cliente
                """,
                (direccion.calle, direccion.ciudad, direccion.codigo_postal, cliente_id)
            )
            new_direccion_row = cur.fetchone()
            if new_direccion_row:
                 new_direccion = row_to_dict(cur, new_direccion_row)
            
            # Confirma la transacción explícitamente si no se usa conn.transaction()
            conn.commit() 
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al crear dirección: {error}")
        if conn:
            conn.rollback() # Deshace cambios si hubo error y no se usa 'with transaction'
    finally:
        if conn:
            conn.close() # Asegura el cierre de la conexión
            
    return new_direccion

def get_direcciones_by_cliente(cliente_id: int):
    """
    Obtiene todas las direcciones asociadas a un cliente específico.

    Args:
        cliente_id (int): ID del cliente cuyas direcciones se quieren obtener.

    Returns:
        List[dict]: Lista de diccionarios, cada uno representando una dirección.
                     Retorna lista vacía si no se encuentran direcciones o hay error.
    """
    conn = get_db_connection()
    if conn is None:
        return []

    direcciones = []
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id_direccion, calle, ciudad, codigo_postal, id_cliente 
                FROM direccion 
                WHERE id_cliente = %s 
                ORDER BY id_direccion
                """, 
                (cliente_id,)
            )
            direcciones_rows = cur.fetchall()
            direcciones = [row_to_dict(cur, row) for row in direcciones_rows]
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener direcciones: {error}")
    finally:
        if conn:
            conn.close()
            
    return direcciones

