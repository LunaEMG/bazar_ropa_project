# Importaciones necesarias
from app.db.database import get_db_connection
# Importamos los schemas para validación
from app.schemas import ProveedorCreate, ProveedorUpdate 
import psycopg

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Proveedores ---

def get_all_proveedores():
    """Obtiene todos los registros de la tabla 'proveedor'."""
    conn = get_db_connection()
    if conn is None:
        # En un entorno real, loggear el error o lanzar excepción
        return []

    proveedores = []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_proveedor, nombre, telefono FROM proveedor ORDER BY nombre")
            proveedores_rows = cur.fetchall()
            proveedores = [row_to_dict(cur, row) for row in proveedores_rows]
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener proveedores: {error}")
    finally:
        if conn:
            conn.close()
            
    return proveedores

def get_proveedor_by_id(proveedor_id: int):
    """Obtiene un proveedor específico por su 'id_proveedor'."""
    conn = get_db_connection()
    if conn is None:
        return None

    proveedor = None
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_proveedor, nombre, telefono FROM proveedor WHERE id_proveedor = %s", (proveedor_id,))
            proveedor_row = cur.fetchone()
            proveedor = row_to_dict(cur, proveedor_row) 
    except (Exception, psycopg.Error) as error:
         print(f"Error al obtener proveedor {proveedor_id}: {error}")
    finally:
        if conn:
            conn.close()
            
    return proveedor

def create_proveedor(proveedor: ProveedorCreate):
    """Inserta un nuevo proveedor en la base de datos."""
    conn = get_db_connection()
    if conn is None:
        return None

    new_proveedor = None
    try:
        # Usar 'with conn.transaction()' es preferible para manejar commit/rollback
        with conn.cursor() as cur: 
            cur.execute(
                "INSERT INTO proveedor (nombre, telefono) VALUES (%s, %s) RETURNING id_proveedor, nombre, telefono",
                (proveedor.nombre, proveedor.telefono)
            )
            new_proveedor_row = cur.fetchone()
            if new_proveedor_row:
                 new_proveedor = row_to_dict(cur, new_proveedor_row)
            conn.commit() # Commit explícito si no se usa 'with transaction'
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al crear proveedor: {error}")
        if conn:
            conn.rollback() # Rollback explícito si no se usa 'with transaction'
    finally:
        if conn:
            conn.close() 
            
    return new_proveedor

def update_proveedor(proveedor_id: int, proveedor_update: ProveedorUpdate):
    """
    Actualiza los datos de un proveedor existente por ID.
    Solo modifica los campos presentes en el objeto proveedor_update.
    """
    conn = get_db_connection()
    if conn is None: 
        return None

    # Construcción dinámica de la cláusula SET
    update_fields = []
    update_values = []
    # Pydantic v2: model_dump | Pydantic v1: dict
    update_data = proveedor_update.model_dump(exclude_unset=True) 

    if not update_data: # Si no hay datos para actualizar
        conn.close()
        return get_proveedor_by_id(proveedor_id) # Retorna el registro actual

    for key, value in update_data.items():
        # Asumiendo que las claves del schema coinciden con los nombres de columna
        update_fields.append(f"{key} = %s")
        update_values.append(value)

    update_values.append(proveedor_id) # Añade el ID para la cláusula WHERE
    
    updated_proveedor = None
    try:
        with conn.cursor() as cur, conn.transaction(): # Manejo de transacción recomendado
            query = f"UPDATE proveedor SET {', '.join(update_fields)} WHERE id_proveedor = %s RETURNING id_proveedor, nombre, telefono"
            cur.execute(query, tuple(update_values))
            
            updated_proveedor_row = cur.fetchone()
            # Si fetchone() retorna None, el ID no existía
            if updated_proveedor_row:
                updated_proveedor = row_to_dict(cur, updated_proveedor_row)
            # Commit automático al salir del 'with transaction'
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar proveedor {proveedor_id}: {error}")
        # Rollback automático
    finally:
        if conn: 
            conn.close()
            
    return updated_proveedor # Retorna None si el ID no se encontró o hubo error

def delete_proveedor(proveedor_id: int):
    """
    Elimina un proveedor de la base de datos usando su ID.

    Returns:
        int: 
            1: si la eliminación fue exitosa (1 fila afectada).
            0: si el proveedor no fue encontrado (0 filas afectadas).
           -1: si ocurrió un error genérico de base de datos.
           -2: si ocurrió un error de violación de clave foránea.
    """
    conn = get_db_connection()
    if conn is None: 
        print("Error: No se pudo conectar a la DB para eliminar proveedor.")
        return -1 # Indica error de conexión

    rows_deleted_code = 0 # Valor por defecto si no se encuentra
    try:
        # Usar transacción para asegurar atomicidad y rollback automático
        with conn.cursor() as cur, conn.transaction(): 
            cur.execute("DELETE FROM proveedor WHERE id_proveedor = %s", (proveedor_id,))
            rows_deleted_code = cur.rowcount # Será 1 si se borró, 0 si no existía
            if rows_deleted_code == 0:
                 # Si no se borró nada, psycopg deshace la transacción implícitamente
                 # pero podemos dejarlo claro para el código de retorno.
                 pass 
            # Commit automático al salir del 'with transaction' si no hubo error

    except psycopg.errors.ForeignKeyViolation as fk_error:
        # Error específico si el proveedor está referenciado (ej. en producto)
        print(f"Error de FK al eliminar proveedor {proveedor_id}: {fk_error}")
        # Rollback automático
        rows_deleted_code = -2 # Código para FK violation
        
    except (Exception, psycopg.Error) as error:
        print(f"Error SQL al eliminar proveedor {proveedor_id}: {error}")
        # Rollback automático
        rows_deleted_code = -1 # Código para error genérico
    finally:
        if conn: 
            conn.close()
            
    # Retorna el código numérico resultado de la operación
    return rows_deleted_code