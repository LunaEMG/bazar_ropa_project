import os
import psycopg
from dotenv import load_dotenv

# Carga las variables del archivo .env (como DATABASE_URL)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Creamos una función simple para obtener una conexión
def get_db_connection():
    try:
        # Intenta conectarse a la base de datos
        conn = psycopg.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None