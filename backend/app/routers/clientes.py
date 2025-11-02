# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status
from typing import List

# Importa las funciones CRUD y los schemas Pydantic para clientes
from app.crud import crud_clientes
from app.schemas import Cliente, ClienteCreate, ClienteUpdate

# Crea un router específico para las rutas de clientes
router = APIRouter()

# --- Endpoint para CREAR un nuevo cliente ---
@router.post(
    "/api/clientes", 
    response_model=Cliente, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo cliente",
    tags=["Clientes"] # Agrupa endpoints en la documentación /docs
)
def create_new_cliente(cliente: ClienteCreate):
    """
    Crea un nuevo cliente en la base de datos.
    Valida los datos de entrada contra el schema ClienteCreate.
    Retorna el cliente creado con su ID asignado.
    """
    new_cliente = crud_clientes.create_cliente(cliente=cliente)
    if new_cliente is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al crear el cliente."
        )
    return new_cliente

# --- Endpoint para LEER todos los clientes ---
@router.get(
    "/api/clientes", 
    response_model=List[Cliente],
    summary="Obtener lista de clientes",
    tags=["Clientes"]
)
def read_clientes():
    """
    Obtiene una lista de todos los clientes registrados, ordenados por nombre.
    """
    clientes = crud_clientes.get_all_clientes()
    return clientes

# --- Endpoint para LEER un cliente específico por ID ---
@router.get(
    "/api/clientes/{cliente_id}", 
    response_model=Cliente,
    summary="Obtener un cliente por ID",
    tags=["Clientes"]
)
def read_cliente(cliente_id: int):
    """
    Obtiene los detalles de un cliente específico usando su 'id_cliente'.
    Retorna 404 Not Found si el cliente no existe.
    """
    db_cliente = crud_clientes.get_cliente_by_id(cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return db_cliente

# --- Endpoint para ACTUALIZAR un cliente existente ---
@router.put(
    "/api/clientes/{cliente_id}",
    response_model=Cliente,
    summary="Actualizar un cliente existente",
    tags=["Clientes"]
)
def update_existing_cliente(cliente_id: int, cliente_update: ClienteUpdate):
    """
    Actualiza los datos de un cliente existente identificado por su 'id_cliente'.
    Solo actualiza los campos proporcionados en el cuerpo de la petición.
    Retorna los datos del cliente actualizado o 404 si no se encuentra.
    """
    updated_cliente = crud_clientes.update_cliente(cliente_id=cliente_id, cliente_update=cliente_update)
    if updated_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado para actualizar")
    return updated_cliente

# --- Endpoint para ELIMINAR un cliente existente (Corregido) ---
@router.delete(
    "/api/clientes/{cliente_id}",
    status_code=status.HTTP_204_NO_CONTENT, 
    summary="Eliminar un cliente existente",
    tags=["Clientes"]
)
def delete_existing_cliente(cliente_id: int):
    """
    Desactiva un cliente (borrado lógico) usando su 'id_cliente'.
    Retorna 204 No Content si la desactivación es exitosa.
    Retorna 404 Not Found si el cliente no existe.
    Retorna 500 Internal Server Error para otros errores de base de datos.
    """
    
    # Llama a la función CRUD para eliminar, ahora retorna 1, 0, -1, o -2
    delete_result_code = crud_clientes.delete_cliente(cliente_id=cliente_id)
    
    if delete_result_code == 1:
        # Éxito
        return None 
    elif delete_result_code == 0:
        # No encontrado
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado para eliminar")
    else: # -1 o cualquier otro error
        # Error genérico
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al intentar eliminar el cliente."
        )