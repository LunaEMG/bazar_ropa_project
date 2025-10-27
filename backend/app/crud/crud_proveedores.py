# Importaciones necesarias
from app.db.database import get_db_connection
from app.schemas import ProveedorCreate # Schema para validar datos de creación
import psycopg

# Importación de la función auxiliar para conversión de filas
from .crud_productos import row_to_dict 

# --- Funciones CRUD para Proveedores ---

def get_all_proveedores():
    """Obtiene todos los registros de la tabla 'proveedor'."""
    conn = get_db_connection()
    if conn is None:
        return []

    with conn.cursor() as cur:
        cur.execute("SELECT id_proveedor, nombre, telefono FROM proveedor ORDER BY nombre")
        proveedores_rows = cur.fetchall()
        proveedores = [row_to_dict(cur, row) for row in proveedores_rows]

    conn.close()
    return proveedores

def get_proveedor_by_id(proveedor_id: int):
    """Obtiene un proveedor específico por su 'id_proveedor'."""
    conn = get_db_connection()
    if conn is None:
        return None

    with conn.cursor() as cur:
        cur.execute("SELECT id_proveedor, nombre, telefono FROM proveedor WHERE id_proveedor = %s", (proveedor_id,))
        proveedor_row = cur.fetchone()
        proveedor = row_to_dict(cur, proveedor_row) 

    conn.close()
    return proveedor

def create_proveedor(proveedor: ProveedorCreate):
    """Inserta un nuevo proveedor en la base de datos."""
    conn = get_db_connection()
    if conn is None:
        # Considerar lanzar una excepción específica para errores de conexión
        return None

    new_proveedor = None
    try:
        with conn.cursor() as cur, conn.transaction():
            # Ejecuta la inserción y retorna el registro creado
            cur.execute(
                "INSERT INTO proveedor (nombre, telefono) VALUES (%s, %s) RETURNING id_proveedor, nombre, telefono",
                (proveedor.nombre, proveedor.telefono)
            )
            new_proveedor_row = cur.fetchone()
            if new_proveedor_row:
                 new_proveedor = row_to_dict(cur, new_proveedor_row)
            # La transacción se confirma automáticamente al salir del bloque 'with'
            
    except (Exception, psycopg.Error) as error:
        # Loggear el error específico es recomendable
        print(f"Error al crear proveedor: {error}")
        # El rollback es automático al salir del 'with transaction' con una excepción
    finally:
        if conn:
            conn.close() # Asegura que la conexión se cierre siempre
            
    return new_proveedor