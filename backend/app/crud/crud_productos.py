from app.db.database import get_db_connection

# --- Función Auxiliar ---
# Esta función convierte una fila de la base de datos (que es una tupla)
# en un diccionario. Esto facilita enviarlo como JSON a través de la API.
def row_to_dict(cursor, row):
    """Convierte una fila de psycopg (tupla) en un diccionario."""
    if row is None:
        return None
    column_names = [desc[0] for desc in cursor.description]
    return dict(zip(column_names, row))

# --- Funciones CRUD (Create, Read, Update, Delete) ---

# LEER (Read): Obtener todos los productos
def get_all_productos():
    """Obtiene todos los productos de la tabla 'producto'."""
    conn = get_db_connection()
    if conn is None:
        # Si no hay conexión, retorna una lista vacía
        return [] 
        
    with conn.cursor() as cur:
        # 1. Ejecuta la consulta SQL
        cur.execute("SELECT * FROM producto")
        
        # 2. Obtiene todos los resultados
        productos_rows = cur.fetchall()
        
        # 3. Convierte cada fila en un diccionario
        productos = [row_to_dict(cur, row) for row in productos_rows]
        
    # 4. Cierra la conexión y retorna los datos
    conn.close()
    return productos

# LEER (Read): Obtener un solo producto por su ID
def get_producto_by_id(producto_id: int):
    """Obtiene un producto específico por su 'id_producto'."""
    conn = get_db_connection()
    if conn is None:
        return None # Retorna None si falla la conexión
        
    with conn.cursor() as cur:
        # 1. Ejecuta la consulta SQL
        # Se usa %s para pasar el parámetro de forma segura (previene inyección SQL)
        cur.execute("SELECT * FROM producto WHERE id_producto = %s", (producto_id,))
        
        # 2. Obtiene un solo resultado
        producto_row = cur.fetchone()
        
        # 3. Convierte la fila en un diccionario
        producto = row_to_dict(cur, producto_row)
        
    # 4. Cierra la conexión y retorna el producto (o None si no se encontró)
    conn.close()
    return producto