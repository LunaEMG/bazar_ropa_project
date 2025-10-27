# Importaciones necesarias
from app.db.database import get_db_connection
# Importamos DireccionCreate y DireccionUpdate para validación
from app.schemas import DireccionCreate, DireccionUpdate 
import psycopg

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Direcciones ---

# CREAR (Create): Añadir dirección a un cliente (Sin cambios)
def create_direccion_for_cliente(cliente_id: int, direccion: DireccionCreate):
    """Inserta una nueva dirección asociada a un cliente específico."""
    conn = get_db_connection()
    if conn is None: return None
    new_direccion = None
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO direccion (calle, ciudad, codigo_postal, id_cliente) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id_direccion, calle, ciudad, codigo_postal, id_cliente
                """,
                (direccion.calle, direccion.ciudad, direccion.codigo_postal, cliente_id)
            )
            new_direccion_row = cur.fetchone()
            if new_direccion_row: new_direccion = row_to_dict(cur, new_direccion_row)
            conn.commit() 
    except (Exception, psycopg.Error) as error:
        print(f"Error al crear dirección para cliente {cliente_id}: {error}")
        if conn: conn.rollback()
    finally:
        if conn: conn.close()
    return new_direccion

# LEER (Read): Obtener direcciones de un cliente (Sin cambios)
def get_direcciones_by_cliente(cliente_id: int):
    """Obtiene todas las direcciones asociadas a un cliente específico."""
    conn = get_db_connection()
    if conn is None: return []
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
        print(f"Error al obtener direcciones para cliente {cliente_id}: {error}")
    finally:
        if conn: conn.close()
    return direcciones


# ACTUALIZAR (Update): Modificar una dirección existente
def update_direccion(cliente_id: int, direccion_id: int, direccion_update: DireccionUpdate):
    """
    Actualiza una dirección específica perteneciente a un cliente.
    Verifica que la dirección pertenezca al cliente antes de actualizar.
    """
    conn = get_db_connection()
    if conn is None: return None

    update_fields = []
    update_values = []
    # Pydantic v2: model_dump | Pydantic v1: dict
    update_data = direccion_update.model_dump(exclude_unset=True) 

    for key, value in update_data.items():
        if value is not None: 
            update_fields.append(f"{key} = %s")
            update_values.append(value)

    if not update_fields:
        conn.close()
        # Si no hay nada que actualizar, podríamos retornar la dirección actual
        # Necesitaríamos una función get_direccion_by_id(direccion_id)
        return None # O manejarlo de otra forma

    # Añade los IDs para las condiciones WHERE
    update_values.append(direccion_id)
    update_values.append(cliente_id) 

    updated_direccion = None
    try:
        with conn.cursor() as cur, conn.transaction():
            # Construye y ejecuta la consulta UPDATE con doble condición WHERE
            query = f"""
                UPDATE direccion 
                SET {', '.join(update_fields)} 
                WHERE id_direccion = %s AND id_cliente = %s 
                RETURNING id_direccion, calle, ciudad, codigo_postal, id_cliente
            """
            cur.execute(query, tuple(update_values))
            
            updated_direccion_row = cur.fetchone()
            # Verifica si se actualizó una fila (si la dirección existe y pertenece al cliente)
            if updated_direccion_row:
                updated_direccion = row_to_dict(cur, updated_direccion_row)
            # Commit automático
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar dirección {direccion_id} para cliente {cliente_id}: {error}")
        # Rollback automático
    finally:
        if conn: conn.close()
            
    return updated_direccion # Retorna la dirección actualizada o None si no se encontró/error


# ELIMINAR (Delete): Borrar una dirección existente
def delete_direccion(cliente_id: int, direccion_id: int):
    """
    Elimina una dirección específica perteneciente a un cliente.
    Verifica que la dirección pertenezca al cliente antes de eliminar.
    """
    conn = get_db_connection()
    if conn is None: return False

    rows_deleted = 0
    try:
        with conn.cursor() as cur, conn.transaction():
            # Ejecuta DELETE con doble condición WHERE
            cur.execute(
                "DELETE FROM direccion WHERE id_direccion = %s AND id_cliente = %s", 
                (direccion_id, cliente_id)
            )
            rows_deleted = cur.rowcount 
            # Commit automático
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al eliminar dirección {direccion_id} para cliente {cliente_id}: {error}")
        # Rollback automático
    finally:
        if conn: conn.close()
            
    # Retorna True si se eliminó exactamente una fila
    return rows_deleted == 1 


def get_direccion_by_id(direccion_id: int):
    """Obtiene una dirección específica por su 'id_direccion'."""
    conn = get_db_connection()
    if conn is None: return None
    direccion = None
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id_direccion, calle, ciudad, codigo_postal, id_cliente FROM direccion WHERE id_direccion = %s", 
                (direccion_id,)
            )
            direccion_row = cur.fetchone()
            direccion = row_to_dict(cur, direccion_row) 
    except (Exception, psycopg.Error) as error:
         print(f"Error al obtener dirección {direccion_id}: {error}")
    finally:
        if conn: conn.close()
    return direccion