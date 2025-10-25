from fastapi import APIRouter, HTTPException
from typing import List
from app.crud import crud_clientes # Importa las funciones de base de datos para clientes
from app.schemas import Cliente, ClienteCreate # Importa los schemas Pydantic

# Crea un router específico para las rutas de clientes
router = APIRouter()

# --- Endpoint para CREAR un nuevo cliente ---
@router.post("/api/clientes", response_model=Cliente, status_code=201)
def create_new_cliente(cliente: ClienteCreate):
    """
    Crea un nuevo cliente en la base de datos.
    Recibe los datos del cliente en el cuerpo de la petición (validados por ClienteCreate).
    Retorna el cliente recién creado con su ID asignado.
    """
    # Llama a la función CRUD para insertar en la base de datos
    new_cliente = crud_clientes.create_cliente(cliente=cliente)
    if new_cliente is None:
        # Manejo de error si la creación falla (ej. problema de conexión)
        raise HTTPException(status_code=500, detail="Error al crear el cliente")
    return new_cliente

# --- Endpoint para LEER todos los clientes ---
@router.get("/api/clientes", response_model=List[Cliente])
def read_clientes():
    """
    Obtiene una lista de todos los clientes registrados.
    """
    # Llama a la función CRUD para obtener todos los clientes
    clientes = crud_clientes.get_all_clientes()
    return clientes

# --- Endpoint para LEER un cliente específico por ID ---
@router.get("/api/clientes/{cliente_id}", response_model=Cliente)
def read_cliente(cliente_id: int):
    """
    Obtiene los detalles de un cliente específico usando su 'id_cliente'.
    """
    # Llama a la función CRUD para buscar el cliente por ID
    db_cliente = crud_clientes.get_cliente_by_id(cliente_id)
    
    # Si la función CRUD retorna None, significa que el cliente no fue encontrado
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    return db_cliente