# Importaciones necesarias

from app.schemas import ClienteCreate, ClienteUpdate 
import psycopg
from psycopg import Connection 

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Clientes ---

# LEER (Read): Obtener todos los clientes
def get_all_clientes(db: Connection): 
    """Obtiene todos los registros ACTIVOS de la tabla 'cliente'."""
    
    
    with db.cursor() as cur: 
        cur.execute("SELECT id_cliente, nombre, telefono FROM cliente WHERE esta_activo = TRUE ORDER BY nombre")
        clientes_rows = cur.fetchall()
        clientes = [row_to_dict(cur, row) for row in clientes_rows]
    
    return clientes

# LEER (Read): Obtener un solo cliente por su ID
def get_cliente_by_id(db: Connection, cliente_id: int): 
    """Obtiene un cliente específico por su 'id_cliente'."""
    
    
    with db.cursor() as cur: 
        cur.execute("SELECT id_cliente, nombre, telefono FROM cliente WHERE id_cliente = %s", (cliente_id,))
        cliente_row = cur.fetchone()
        cliente = row_to_dict(cur, cliente_row) 
    
    return cliente

# CREAR (Create): Añadir un nuevo cliente
def create_cliente(db: Connection, cliente: ClienteCreate): 
    """Inserta un nuevo cliente en la base de datos."""
    
    
    new_cliente = None
    try:
        with db.cursor() as cur, db.transaction(): 
            cur.execute(
                "INSERT INTO cliente (nombre, telefono) VALUES (%s, %s) RETURNING id_cliente, nombre, telefono",
                (cliente.nombre, cliente.telefono)
            )
            new_cliente_row = cur.fetchone()
            if new_cliente_row: new_cliente = row_to_dict(cur, new_cliente_row)
            # Commit/Rollback automáticos
    except (Exception, psycopg.Error) as error:
        print(f"Error al crear cliente: {error}")
    
    return new_cliente

# ACTUALIZAR (Update): Modificar un cliente existente
def update_cliente(db: Connection, cliente_id: int, cliente_update: ClienteUpdate): 
    """
    Actualiza los datos de un cliente existente.
    Solo actualiza los campos proporcionados en cliente_update.
    """
    

    # Construye la parte SET de la consulta dinámicamente
    update_fields = []
    update_values = []
    
    update_data = cliente_update.model_dump(exclude_unset=True) 
    
    for key, value in update_data.items():
        if value is not None: 
            update_fields.append(f"{key} = %s")
            update_values.append(value)

    # Si no hay campos para actualizar, retorna el cliente actual sin cambios
    if not update_fields:
        return get_cliente_by_id(db=db, cliente_id=cliente_id) 

    # Añade el ID del cliente al final de la lista de valores para el WHERE
    update_values.append(cliente_id)

    updated_cliente = None
    try:
        with db.cursor() as cur, db.transaction(): 
            # Construye y ejecuta la consulta UPDATE completa
            query = f"UPDATE cliente SET {', '.join(update_fields)} WHERE id_cliente = %s RETURNING id_cliente, nombre, telefono"
            cur.execute(query, tuple(update_values))
            
            updated_cliente_row = cur.fetchone()
            # Verifica si la actualización afectó a alguna fila (si el ID existía)
            if updated_cliente_row:
                updated_cliente = row_to_dict(cur, updated_cliente_row)
            # Commit automático
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar cliente {cliente_id}: {error}")
        # Rollback automático
   
            
    return updated_cliente


# ELIMINAR (Delete): Borrar un cliente existente
def delete_cliente(db: Connection, cliente_id: int): 
    """
    Desactiva un cliente (borrado lógico) en lugar de eliminarlo.
    Retorna:
        1: si la desactivación fue exitosa.
        0: si el cliente no fue encontrado.
       -1: si ocurrió un error genérico de base de datos.
    """
    

    rows_updated_code = 0 # Valor por defecto si no se encuentra
    try:
        with db.cursor() as cur, db.transaction(): 
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
    

    # Retorna el código numérico resultado de la operación
    return rows_updated_code