import os
import psycopg
from psycopg.pool import ConnectionPool
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    pool = ConnectionPool(
        conninfo=DATABASE_URL,
        min_size=2,  # Mínimo de conexiones abiertas
        max_size=10, # Máximo de conexiones en el pool
        open=True    # Intenta abrir las conexiones 'min_size' de inmediato
    )
    print("Pool de conexiones creado exitosamente.")
except Exception as e:
    print(f"Error fatal al crear el pool de conexiones: {e}")
    pool = None # La app no podrá funcionar

def get_db():
    """
    Esta función es un 'generador' que FastAPI usará.
    Saca una conexión del pool y la 'inyecta' en el endpoint.
    """
    if pool is None:
        raise Exception("El pool de conexiones no está disponible.")
        
    try:
        # Saca una conexión del pool
        with pool.connection() as conn:
            yield conn 
        # Al salir del 'with', la conexión se devuelve automáticamente al pool
        
    except Exception as e:
        print(f"Error al obtener conexión del pool: {e}")
        raise
