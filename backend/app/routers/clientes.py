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

# --- NUEVO Endpoint para ACTUALIZAR un cliente existente ---
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
    # Llama a la función CRUD para actualizar, pasando el ID y los datos a actualizar
    updated_cliente = crud_clientes.update_cliente(cliente_id=cliente_id, cliente_update=cliente_update)
    
    # Verifica si la actualización fue exitosa (si el cliente existía)
    if updated_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado para actualizar")
        
    return updated_cliente

# --- NUEVO Endpoint para ELIMINAR un cliente existente ---
@router.delete(
    "/api/clientes/{cliente_id}",
    status_code=status.HTTP_204_NO_CONTENT, # Código estándar para eliminación exitosa sin contenido de respuesta
    summary="Eliminar un cliente existente",
    tags=["Clientes"]
)
def delete_existing_cliente(cliente_id: int):
    """
    Elimina un cliente de la base de datos usando su 'id_cliente'.
    Retorna 204 No Content si la eliminación es exitosa, o 404 si el cliente no se encuentra.
    """
    # Llama a la función CRUD para eliminar
    success = crud_clientes.delete_cliente(cliente_id=cliente_id)
    
    # Si la función CRUD retorna False, el cliente no existía
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado para eliminar")
        
    # Si la eliminación fue exitosa (success=True), FastAPI automáticamente
    # retorna la respuesta 204 No Content porque no hay un 'return' explícito
    # y el status_code está definido en el decorador.
    return None # Opcional: return Response(status_code=status.HTTP_204_NO_CONTENT)