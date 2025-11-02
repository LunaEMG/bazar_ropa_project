# Importaciones necesarias
from app.db.database import get_db_connection
# Importamos ClienteCreate y ClienteUpdate para validación
from app.schemas import ClienteCreate, ClienteUpdate 
import psycopg

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Clientes ---

# LEER (Read): Obtener todos los clientes (Sin cambios)
def get_all_clientes():
    """Obtiene todos los registros ACTIVOS de la tabla 'cliente'."""
    conn = get_db_connection()
    if conn is None: return []
    with conn.cursor() as cur:
        # Añadir WHERE esta_activo = TRUE
        cur.execute("SELECT id_cliente, nombre, telefono FROM cliente WHERE esta_activo = TRUE ORDER BY nombre")
        clientes_rows = cur.fetchall()
        clientes = [row_to_dict(cur, row) for row in clientes_rows]
    conn.close()
    return clientes

# LEER (Read): Obtener un solo cliente por su ID (Sin cambios)
def get_cliente_by_id(cliente_id: int):
    """Obtiene un cliente específico por su 'id_cliente'."""
    conn = get_db_connection()
    if conn is None: return None
    with conn.cursor() as cur:
        cur.execute("SELECT id_cliente, nombre, telefono FROM cliente WHERE id_cliente = %s", (cliente_id,))
        cliente_row = cur.fetchone()
        cliente = row_to_dict(cur, cliente_row) 
    conn.close()
    return cliente

# CREAR (Create): Añadir un nuevo cliente (Sin cambios)
def create_cliente(cliente: ClienteCreate):
    """Inserta un nuevo cliente en la base de datos."""
    conn = get_db_connection()
    if conn is None: return None
    new_cliente = None
    try:
        with conn.cursor() as cur, conn.transaction():
            cur.execute(
                "INSERT INTO cliente (nombre, telefono) VALUES (%s, %s) RETURNING id_cliente, nombre, telefono",
                (cliente.nombre, cliente.telefono)
            )
            new_cliente_row = cur.fetchone()
            if new_cliente_row: new_cliente = row_to_dict(cur, new_cliente_row)
    except (Exception, psycopg.Error) as error:
        print(f"Error al crear cliente: {error}")
    finally:
        if conn: conn.close()
    return new_cliente

# --- NUEVA Función ---
# ACTUALIZAR (Update): Modificar un cliente existente
def update_cliente(cliente_id: int, cliente_update: ClienteUpdate):
    """
    Actualiza los datos de un cliente existente.
    Solo actualiza los campos proporcionados en cliente_update.
    """
    conn = get_db_connection()
    if conn is None: return None

    # Construye la parte SET de la consulta dinámicamente
    update_fields = []
    update_values = []
    
    # get_object_vars() funciona con Pydantic v1, model_dump() con v2
    update_data = cliente_update.model_dump(exclude_unset=True) # Pydantic v2
    # update_data = cliente_update.dict(exclude_unset=True) # Pydantic v1
    
    for key, value in update_data.items():
        if value is not None: # Asegura no intentar poner NULL si no se envió
            update_fields.append(f"{key} = %s")
            update_values.append(value)

    # Si no hay campos para actualizar, retorna el cliente actual sin cambios
    if not update_fields:
        conn.close()
        return get_cliente_by_id(cliente_id) 

    # Añade el ID del cliente al final de la lista de valores para el WHERE
    update_values.append(cliente_id)

    updated_cliente = None
    try:
        with conn.cursor() as cur, conn.transaction():
            # Construye y ejecuta la consulta UPDATE completa
            query = f"UPDATE cliente SET {', '.join(update_fields)} WHERE id_cliente = %s RETURNING id_cliente, nombre, telefono"
            cur.execute(query, tuple(update_values))
            
            updated_cliente_row = cur.fetchone()
            # Verifica si la actualización afectó a alguna fila (si el ID existía)
            if updated_cliente_row:
                updated_cliente = row_to_dict(cur, updated_cliente_row)
            # Commit automático al salir del 'with transaction'
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar cliente {cliente_id}: {error}")
        # Rollback automático
    finally:
        if conn: conn.close()
            
    return updated_cliente # Retorna el cliente actualizado o None si no se encontró/hubo error


# ELIMINAR (Delete): Borrar un cliente existente
def delete_cliente(cliente_id: int):
    """
    Desactiva un cliente (borrado lógico) en lugar de eliminarlo.
    Retorna:
        1: si la desactivación fue exitosa.
        0: si el cliente no fue encontrado.
       -1: si ocurrió un error genérico de base de datos.
    """
    conn = get_db_connection()
    if conn is None: 
        print("Error: No se pudo conectar a la DB para desactivar cliente.")
        return -1 # Indica error de conexión

    rows_updated_code = 0 # Valor por defecto si no se encuentra
    try:
        with conn.cursor() as cur, conn.transaction():
            # Cambiar DELETE por UPDATE
            cur.execute(
                "UPDATE cliente SET esta_activo = FALSE WHERE id_cliente = %s", 
                (cliente_id,)
            )
            rows_updated_code = cur.rowcount # Será 1 si se actualizó, 0 si no existía

    except (Exception, psycopg.Error) as error:
        print(f"Error SQL al desactivar cliente {cliente_id}: {error}")
        # Rollback automático
        rows_updated_code = -1 # Código para error genérico
    finally:
        if conn: 
            conn.close()

    # Retorna el código numérico resultado de la operación
    return rows_updated_code