# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status, Path
from typing import List

# Importa las funciones CRUD y los schemas Pydantic relevantes
from app.crud import crud_direcciones, crud_clientes 
from app.schemas import Direccion, DireccionCreate, DireccionUpdate # <-- Se añade DireccionUpdate

# Crea un router específico para las rutas de direcciones, anidado bajo clientes
router = APIRouter(
    prefix="/api/clientes/{cliente_id}", # Prefijo común para estas rutas
    tags=["Direcciones"] # Agrupa endpoints en la documentación /docs
)

# --- Endpoint para CREAR una nueva dirección para un cliente ---
@router.post(
    "/direcciones", 
    response_model=Direccion, 
    status_code=status.HTTP_201_CREATED,
    summary="Añadir una nueva dirección a un cliente"
)
def create_direccion_for_existing_cliente(
    *, 
    cliente_id: int = Path(..., title="ID del Cliente", ge=1), 
    direccion: DireccionCreate 
):
    """
    Crea una nueva dirección asociada a un cliente existente.
    Verifica la existencia del cliente antes de la creación.
    """
    db_cliente = crud_clientes.get_cliente_by_id(cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        
    db_direccion = crud_direcciones.create_direccion_for_cliente(
        cliente_id=cliente_id, 
        direccion=direccion
    )
    if db_direccion is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al crear la dirección."
        )
    return db_direccion

# --- Endpoint para LEER todas las direcciones de un cliente ---
@router.get(
    "/direcciones", 
    response_model=List[Direccion],
    summary="Obtener las direcciones de un cliente específico"
)
def read_direcciones_for_cliente(
    *,
    cliente_id: int = Path(..., title="ID del Cliente", ge=1)
):
    """
    Obtiene una lista de todas las direcciones asociadas a un cliente específico.
    Verifica la existencia del cliente.
    """
    db_cliente = crud_clientes.get_cliente_by_id(cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        
    direcciones = crud_direcciones.get_direcciones_by_cliente(cliente_id=cliente_id)
    return direcciones

# --- NUEVO Endpoint para ACTUALIZAR una dirección específica ---
@router.put(
    "/direcciones/{direccion_id}", # Ruta incluye ID de dirección
    response_model=Direccion,
    summary="Actualizar una dirección específica de un cliente"
)
def update_existing_direccion(
    *,
    cliente_id: int = Path(..., title="ID del Cliente", ge=1),
    direccion_id: int = Path(..., title="ID de la Dirección", ge=1), # Obtiene ID de dirección de la URL
    direccion_update: DireccionUpdate # Datos para actualizar en el cuerpo
):
    """
    Actualiza una dirección existente, verificando que pertenezca al cliente especificado.
    Solo actualiza los campos proporcionados en el cuerpo de la petición.
    Retorna 404 si el cliente o la dirección (asociada a ese cliente) no existen.
    """
    # Verifica si el cliente existe (redundante si se confía en la FK, pero bueno para claridad)
    db_cliente = crud_clientes.get_cliente_by_id(cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    # Llama a la función CRUD para actualizar, pasando ambos IDs
    updated_direccion = crud_direcciones.update_direccion(
        cliente_id=cliente_id, 
        direccion_id=direccion_id, 
        direccion_update=direccion_update
    )
    
    # Si la función CRUD retorna None, la dirección no existía o no pertenecía al cliente
    if updated_direccion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dirección no encontrada para este cliente")
        
    return updated_direccion

# --- NUEVO Endpoint para ELIMINAR una dirección específica ---
@router.delete(
    "/direcciones/{direccion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una dirección específica de un cliente"
)
def delete_existing_direccion(
    *,
    cliente_id: int = Path(..., title="ID del Cliente", ge=1),
    direccion_id: int = Path(..., title="ID de la Dirección", ge=1)
):
    """
    Elimina una dirección específica, verificando que pertenezca al cliente especificado.
    Retorna 204 No Content en caso de éxito, o 404 si el cliente o la dirección no existen.
    """
    # Verifica si el cliente existe
    db_cliente = crud_clientes.get_cliente_by_id(cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    # Llama a la función CRUD para eliminar, pasando ambos IDs
    success = crud_direcciones.delete_direccion(cliente_id=cliente_id, direccion_id=direccion_id)
    
    # Si la función CRUD retorna False, la dirección no existía o no pertenecía al cliente
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dirección no encontrada para este cliente")
        
    # En caso de éxito (success=True), retorna automáticamente 204 No Content
    return None