# backend/app/crud/crud_clientes.py

# Importaciones necesarias
from app.schemas import ClienteCreate, ClienteUpdate 
import psycopg
from psycopg import Connection 

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- ¡NUEVA IMPORTACIÓN! ---
# (Asegúrate de haber creado el archivo app/auth.py que te pasé)
from app.auth import get_password_hash 

# --- Funciones CRUD para Clientes ---

# LEER (Read): Obtener todos los clientes 
def get_all_clientes(db: Connection): 
    """Obtiene todos los registros ACTIVOS de la tabla 'cliente'."""
    
    with db.cursor() as cur: 
        # Actualiza el SELECT para incluir los nuevos campos
        cur.execute("SELECT id_cliente, nombre, telefono, email, rol FROM cliente WHERE esta_activo = TRUE ORDER BY nombre")
        clientes_rows = cur.fetchall()
        clientes = [row_to_dict(cur, row) for row in clientes_rows]
    
    return clientes

# LEER (Read): Obtener un solo cliente por su ID 
def get_cliente_by_id(db: Connection, cliente_id: int): 
    """Obtiene un cliente específico por su 'id_cliente'."""
    
    with db.cursor() as cur: 
        # Actualiza el SELECT
        cur.execute("SELECT id_cliente, nombre, telefono, email, rol FROM cliente WHERE id_cliente = %s AND esta_activo = TRUE", (cliente_id,))
        cliente_row = cur.fetchone()
        cliente = row_to_dict(cur, cliente_row) 
    
    return cliente

# LEER (Read): Obtener un solo cliente por su EMAIL (para login) 
def get_cliente_by_email(db: Connection, email: str): 
    """Obtiene un cliente específico por su 'email' (para login)."""
    cliente = None
    try:
        with db.cursor() as cur: 
            # Esta función SÍ necesita el hash para verificar la pass
            cur.execute(
                "SELECT id_cliente, nombre, telefono, email, rol, hashed_password FROM cliente WHERE email = %s AND esta_activo = TRUE", 
                (email,)
            )
            cliente_row = cur.fetchone()
            cliente = row_to_dict(cur, cliente_row) 
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener cliente por email: {error}")
    return cliente

# CREAR (Create): Añadir un nuevo cliente 
def create_cliente(db: Connection, cliente: ClienteCreate): 
    """Inserta un nuevo cliente en la base de datos (con contraseña hasheada)."""
    
    # Hashea la contraseña
    hashed_password = get_password_hash(cliente.password)
    
    new_cliente = None
    try:
        with db.cursor() as cur, db.transaction(): 
            cur.execute(
                """
                INSERT INTO cliente (nombre, telefono, email, hashed_password) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id_cliente, nombre, telefono, email, rol
                """,
                # Pasa el hash, no la contraseña en texto plano
                (cliente.nombre, cliente.telefono, cliente.email, hashed_password)
            )
            new_cliente_row = cur.fetchone()
            if new_cliente_row: 
                new_cliente = row_to_dict(cur, new_cliente_row)
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al crear cliente: {error}")
    
    return new_cliente

# ACTUALIZAR (Update): Modificar un cliente existente 
def update_cliente(db: Connection, cliente_id: int, cliente_update: ClienteUpdate): 
    """
    Actualiza los datos de un cliente existente.
    Solo actualiza los campos proporcionados en cliente_update.
    """
    
    update_fields = []
    update_values = []
    
    # Permite actualizar nombre, telefono, email, y rol (desde el schema ClienteUpdate)
    update_data = cliente_update.model_dump(exclude_unset=True) 
    
    for key, value in update_data.items():
        if value is not None: 
            update_fields.append(f"{key} = %s")
            update_values.append(value)

    if not update_fields:
        return get_cliente_by_id(db=db, cliente_id=cliente_id) 

    update_values.append(cliente_id)

    updated_cliente = None
    try:
        with db.cursor() as cur, db.transaction(): 
            # Actualiza el RETURNING para incluir los nuevos campos
            query = f"UPDATE cliente SET {', '.join(update_fields)} WHERE id_cliente = %s RETURNING id_cliente, nombre, telefono, email, rol"
            cur.execute(query, tuple(update_values))
            
            updated_cliente_row = cur.fetchone()
            if updated_cliente_row:
                updated_cliente = row_to_dict(cur, updated_cliente_row)
            
    except (Exception, psycopg.Error) as error:
        print(f"Error al actualizar cliente {cliente_id}: {error}")
   
    return updated_cliente


# ELIMINAR (Delete): Borrar un cliente existente (SIN CAMBIOS)
def delete_cliente(db: Connection, cliente_id: int): 
    """
    Desactiva un cliente (borrado lógico) en lugar de eliminarlo.
    ...
    """
    
    rows_updated_code = 0 
    try:
        with db.cursor() as cur, db.transaction(): 
            cur.execute(
                "UPDATE cliente SET esta_activo = FALSE WHERE id_cliente = %s", 
                (cliente_id,)
            )
            rows_updated_code = cur.rowcount 

    except (Exception, psycopg.Error) as error:
        print(f"Error SQL al desactivar cliente {cliente_id}: {error}")
        rows_updated_code = -1 
    
    return rows_updated_code