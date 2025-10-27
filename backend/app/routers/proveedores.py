# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status
from typing import List

# Importa las funciones CRUD y los schemas Pydantic relevantes para proveedores
from app.crud import crud_proveedores
from app.schemas import Proveedor, ProveedorCreate, ProveedorUpdate 

# Crea un router específico para las rutas de proveedores
router = APIRouter()

# --- Endpoint para CREAR un nuevo proveedor ---
@router.post(
    "/api/proveedores", 
    response_model=Proveedor, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo proveedor",
    tags=["Proveedores"] # Agrupa endpoints en la documentación /docs
)
def create_new_proveedor(proveedor: ProveedorCreate):
    """
    Crea un nuevo proveedor en la base de datos.
    Valida los datos de entrada contra el schema ProveedorCreate.
    Retorna el proveedor creado con su ID.
    """
    db_proveedor = crud_proveedores.create_proveedor(proveedor=proveedor)
    if db_proveedor is None:
        # Lanza excepción si la creación falla en la capa CRUD
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al crear el proveedor."
        )
    return db_proveedor

# --- Endpoint para LEER todos los proveedores ---
@router.get(
    "/api/proveedores", 
    response_model=List[Proveedor],
    summary="Obtener lista de proveedores",
    tags=["Proveedores"]
)
def read_proveedores():
    """
    Obtiene una lista de todos los proveedores registrados, ordenados por nombre.
    """
    proveedores = crud_proveedores.get_all_proveedores()
    return proveedores

# --- Endpoint para LEER un proveedor específico por ID ---
@router.get(
    "/api/proveedores/{proveedor_id}", 
    response_model=Proveedor,
    summary="Obtener un proveedor por ID",
    tags=["Proveedores"]
)
def read_proveedor(proveedor_id: int):
    """
    Obtiene los detalles de un proveedor específico usando su 'id_proveedor'.
    Retorna 404 Not Found si el proveedor no existe.
    """
    db_proveedor = crud_proveedores.get_proveedor_by_id(proveedor_id)
    if db_proveedor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
    return db_proveedor

# --- Endpoint para ACTUALIZAR un proveedor existente ---
@router.put(
    "/api/proveedores/{proveedor_id}",
    response_model=Proveedor, # Retorna el proveedor actualizado
    summary="Actualizar un proveedor existente",
    tags=["Proveedores"]
)
def update_existing_proveedor(proveedor_id: int, proveedor_update: ProveedorUpdate):
    """
    Actualiza los datos de un proveedor existente identificado por su 'id_proveedor'.
    Solo modifica los campos proporcionados en el cuerpo de la petición (ProveedorUpdate).
    Retorna los datos del proveedor actualizado o 404 si no se encuentra.
    """
    # Llama a la función CRUD para realizar la actualización
    updated_proveedor = crud_proveedores.update_proveedor(
        proveedor_id=proveedor_id, proveedor_update=proveedor_update
    )
    
    # Si la función CRUD retorna None, el proveedor no fue encontrado
    if updated_proveedor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado para actualizar")
        
    return updated_proveedor

# --- Endpoint para ELIMINAR un proveedor existente ---
@router.delete(
    "/api/proveedores/{proveedor_id}",
    status_code=status.HTTP_204_NO_CONTENT, # Respuesta estándar para eliminación exitosa
    summary="Eliminar un proveedor existente",
    tags=["Proveedores"]
)
def delete_existing_proveedor(proveedor_id: int):
    """
    Elimina un proveedor de la base de datos usando su 'id_proveedor'.
    Retorna 204 No Content si la eliminación es exitosa, o 404 si el proveedor no se encuentra.
    """
    # Llama a la función CRUD para realizar la eliminación
    success = crud_proveedores.delete_proveedor(proveedor_id=proveedor_id)
    
    # Si la función CRUD retorna False, el proveedor no fue encontrado
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado para eliminar")
        
    # Si success es True, FastAPI retorna automáticamente 204 No Content
    # porque no hay un valor de retorno explícito y el status_code está definido.
    return None