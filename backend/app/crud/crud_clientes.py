from app.db.database import get_db_connection
from app.schemas import ClienteCreate # Importa el schema para validar la creación

# --- Función Auxiliar ---
# Importamos la función helper de crud_productos para convertir filas a diccionarios.
# Esto evita repetir código. Si prefieres, puedes copiarla aquí también.
from .crud_productos import row_to_dict

# --- Funciones CRUD para Clientes ---

# LEER (Read): Obtener todos los clientes
def get_all_clientes():
    """Obtiene todos los registros de la tabla 'cliente'."""
    conn = get_db_connection()
    if conn is None:
        return [] # Retorna lista vacía si la conexión falla

    with conn.cursor() as cur:
        cur.execute("SELECT id_cliente, nombre, telefono FROM cliente ORDER BY nombre") # Ordenamos por nombre
        clientes_rows = cur.fetchall()
        clientes = [row_to_dict(cur, row) for row in clientes_rows]

    conn.close()
    return clientes

# LEER (Read): Obtener un solo cliente por su ID
def get_cliente_by_id(cliente_id: int):
    """Obtiene un cliente específico por su 'id_cliente'."""
    conn = get_db_connection()
    if conn is None:
        return None

    with conn.cursor() as cur:
        cur.execute("SELECT id_cliente, nombre, telefono FROM cliente WHERE id_cliente = %s", (cliente_id,))
        cliente_row = cur.fetchone()
        cliente = row_to_dict(cur, cliente_row) # Será None si no se encuentra

    conn.close()
    return cliente

# CREAR (Create): Añadir un nuevo cliente
def create_cliente(cliente: ClienteCreate):
    """Inserta un nuevo cliente en la base de datos."""
    conn = get_db_connection()
    if conn is None:
        return None # O podrías lanzar una excepción

    with conn.cursor() as cur:
        # Ejecuta la inserción y pide a PostgreSQL que devuelva el registro recién creado
        cur.execute(
            "INSERT INTO cliente (nombre, telefono) VALUES (%s, %s) RETURNING id_cliente, nombre, telefono",
            (cliente.nombre, cliente.telefono)
        )
        new_cliente_row = cur.fetchone()

        # Confirma la transacción para que los cambios sean permanentes
        conn.commit()

        new_cliente = row_to_dict(cur, new_cliente_row)

    conn.close()
    return new_cliente

