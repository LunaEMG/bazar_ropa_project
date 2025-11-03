# Importaciones necesarias

from app.schemas import ProveedorCreate, ProveedorUpdate 
import psycopg
from psycopg import Connection 

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Proveedores ---

def get_all_proveedores(db: Connection): 
    """Obtiene todos los registros de la tabla 'proveedor'."""
    proveedores = []
    try:
        with db.cursor() as cur: 
            cur.execute("SELECT id_proveedor, nombre, telefono FROM proveedor WHERE esta_activo = TRUE ORDER BY nombre")
            proveedores_rows = cur.fetchall()
            proveedores = [row_to_dict(cur, row) for row in proveedores_rows]
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener proveedores: {error}")
            
    return proveedores

def get_proveedor_by_id(db: Connection, proveedor_id: int): 
    """Obtiene un proveedor específico por su 'id_proveedor'."""
    proveedor = None
    try:
        with db.cursor() as cur: 
            cur.execute("SELECT id_proveedor, nombre, telefono FROM proveedor WHERE id_proveedor = %s", (proveedor_id,))
            proveedor_row = cur.fetchone()
            proveedor = row_to_dict(cur, proveedor_row) 
    except (Exception, psycopg.Error) as error:
         print(f"Error al obtener proveedor {proveedor_id}: {error}")
            
    return proveedor

def create_proveedor(db: Connection, proveedor: ProveedorCreate): 
    """Inserta un nuevo proveedor en la base de datos."""
    new_proveedor = None
    try:
        with db.cursor() as cur, db.transaction(): 
            cur.execute(
                "INSERT INTO proveedor (nombre, telefono) VALUES (%s, %s) RETURNING id_proveedor, nombre, telefono",
                (proveedor.nombre, proveedor.telefono)
            )
            new_proveedor_row = cur.fetchone()
            if new_proveedor_row:
                 new_proveedor = row_to_dict(cur, new_proveedor_row)
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al crear proveedor: {error}")
            
    return new_proveedor

def update_proveedor(db: Connection, proveedor_id: int, proveedor_update: ProveedorUpdate): 
    """
    Actualiza los datos de un proveedor existente por ID.
    """
    update_fields = []
    update_values = []
    update_data = proveedor_update.model_dump(exclude_unset=True) 

    if not update_data:
        return get_proveedor_by_id(db=db, proveedor_id=proveedor_id) 

    for key, value in update_data.items():
        update_fields.append(f"{key} = %s")
        update_values.append(value)

    update_values.append(proveedor_id)
    
    updated_proveedor = None
    try:
        with db.cursor() as cur, db.transaction(): 
            query = f"UPDATE proveedor SET {', '.join(update_fields)} WHERE id_proveedor = %s RETURNING id_proveedor, nombre, telefono"
            cur.execute(query, tuple(update_values))
            
            updated_proveedor_row = cur.fetchone()
            if updated_proveedor_row:
                updated_proveedor = row_to_dict(cur, updated_proveedor_row)
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar proveedor {proveedor_id}: {error}")
            
    return updated_proveedor

def delete_proveedor(db: Connection, proveedor_id: int): 
    """
    Desactiva un proveedor (borrado lógico)...
    """
    rows_updated_code = 0
    try:
        with db.cursor() as cur, db.transaction(): 
            cur.execute(
                "UPDATE proveedor SET esta_activo = FALSE WHERE id_proveedor = %s", 
                (proveedor_id,)
            )
            rows_updated_code = cur.rowcount

    except (Exception, psycopg.Error) as error:
        print(f"Error SQL al desactivar proveedor {proveedor_id}: {error}")
        rows_updated_code = -1

    return rows_updated_code