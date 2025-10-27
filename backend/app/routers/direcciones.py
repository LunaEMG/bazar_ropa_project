# Importaciones necesarias de FastAPI y tipos
from fastapi import APIRouter, HTTPException, status, Path
from typing import List

# Importa las funciones CRUD y los schemas Pydantic para direcciones y clientes
from app.crud import crud_direcciones, crud_clientes 
from app.schemas import Direccion, DireccionCreate

# Crea un router específico para las rutas de direcciones
# Usamos un prefijo y etiquetas para agruparlas en la documentación
router = APIRouter(
    prefix="/api/clientes/{cliente_id}", # Prefijo común para estas rutas
    tags=["Direcciones"] # Agrupa en la documentación /docs
)

# --- Endpoint para CREAR una nueva dirección para un cliente ---
@router.post(
    "/direcciones", # La ruta completa será /api/clientes/{cliente_id}/direcciones
    response_model=Direccion, 
    status_code=status.HTTP_201_CREATED,
    summary="Añadir una nueva dirección a un cliente"
)
def create_direccion_for_existing_cliente(
    *, # Asegura que los parámetros siguientes sean solo por nombre
    cliente_id: int = Path(..., title="ID del Cliente", ge=1), # Obtiene el ID de la URL y valida > 0
    direccion: DireccionCreate # Obtiene los datos de la dirección del cuerpo de la petición
):
    """
    Crea una nueva dirección y la asocia a un cliente existente.

    Verifica primero si el cliente existe.
    """
    # Verifica si el cliente existe antes de añadir la dirección
    db_cliente = crud_clientes.get_cliente_by_id(cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        
    # Llama a la función CRUD para crear la dirección asociada al cliente
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
    
    Verifica primero si el cliente existe.
    """
    # Verifica si el cliente existe
    db_cliente = crud_clientes.get_cliente_by_id(cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        
    # Llama a la función CRUD para obtener las direcciones del cliente
    direcciones = crud_direcciones.get_direcciones_by_cliente(cliente_id=cliente_id)
    # No es necesario verificar si la lista está vacía, retornar [] es válido
    return direcciones

