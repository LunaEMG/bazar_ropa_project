# Importaciones necesarias

from app.schemas import DireccionCreate, DireccionUpdate 
import psycopg
from psycopg import Connection 

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Direcciones ---

def create_direccion_for_cliente(db: Connection, cliente_id: int, direccion: DireccionCreate): 
    """Inserta una nueva dirección asociada a un cliente específico."""
    new_direccion = None
    try:
        with db.cursor() as cur, db.transaction(): 
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
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al crear dirección para cliente {cliente_id}: {error}")
        
    return new_direccion

def get_direcciones_by_cliente(db: Connection, cliente_id: int): 
    """Obtiene todas las direcciones asociadas a un cliente específico."""
    direcciones = []
    try:
        with db.cursor() as cur: 
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
        
    return direcciones

def update_direccion(db: Connection, cliente_id: int, direccion_id: int, direccion_update: DireccionUpdate): 
    """
    Actualiza una dirección específica perteneciente a un cliente.
    """
    update_fields = []
    update_values = []
    update_data = direccion_update.model_dump(exclude_unset=True) 

    for key, value in update_data.items():
        if value is not None: 
            update_fields.append(f"{key} = %s")
            update_values.append(value)

    if not update_fields:
        return get_direccion_by_id(db=db, direccion_id=direccion_id) 

    update_values.append(direccion_id)
    update_values.append(cliente_id) 

    updated_direccion = None
    try:
        with db.cursor() as cur, db.transaction(): 
            query = f"""
                UPDATE direccion 
                SET {', '.join(update_fields)} 
                WHERE id_direccion = %s AND id_cliente = %s 
                RETURNING id_direccion, calle, ciudad, codigo_postal, id_cliente
            """
            cur.execute(query, tuple(update_values))
            
            updated_direccion_row = cur.fetchone()
            if updated_direccion_row:
                updated_direccion = row_to_dict(cur, updated_direccion_row)
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar dirección {direccion_id} para cliente {cliente_id}: {error}")
     
    return updated_direccion

def delete_direccion(db: Connection, cliente_id: int, direccion_id: int): 
    """
    Elimina una dirección específica perteneciente a un cliente.
    """
    rows_deleted = 0
    try:
        with db.cursor() as cur, db.transaction(): 
            cur.execute(
                "DELETE FROM direccion WHERE id_direccion = %s AND id_cliente = %s", 
                (direccion_id, cliente_id)
            )
            rows_deleted = cur.rowcount 
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al eliminar dirección {direccion_id} para cliente {cliente_id}: {error}")       
    return rows_deleted == 1 


def get_direccion_by_id(db: Connection, direccion_id: int): 
    """Obtiene una dirección específica por su 'id_direccion'."""
    direccion = None
    try:
        with db.cursor() as cur: 
            cur.execute(
                "SELECT id_direccion, calle, ciudad, codigo_postal, id_cliente FROM direccion WHERE id_direccion = %s", 
                (direccion_id,)
            )
            direccion_row = cur.fetchone()
            direccion = row_to_dict(cur, direccion_row) 
    except (Exception, psycopg.Error) as error:
         print(f"Error al obtener dirección {direccion_id}: {error}")
   
    return direccion