# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status
from typing import List

# Importa las funciones CRUD y los schemas Pydantic para proveedores
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
    tags=["Proveedores"] 
)
def create_new_proveedor(proveedor: ProveedorCreate):
    """Crea un nuevo proveedor."""
    db_proveedor = crud_proveedores.create_proveedor(proveedor=proveedor)
    if db_proveedor is None:
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
    """Obtiene una lista de todos los proveedores."""
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
    """Obtiene un proveedor específico."""
    db_proveedor = crud_proveedores.get_proveedor_by_id(proveedor_id)
    if db_proveedor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
    return db_proveedor

# --- Endpoint para ACTUALIZAR un proveedor existente ---
@router.put(
    "/api/proveedores/{proveedor_id}",
    response_model=Proveedor, 
    summary="Actualizar un proveedor existente",
    tags=["Proveedores"]
)
def update_existing_proveedor(proveedor_id: int, proveedor_update: ProveedorUpdate):
    """Actualiza datos de un proveedor por ID."""
    updated_proveedor = crud_proveedores.update_proveedor(
        proveedor_id=proveedor_id, proveedor_update=proveedor_update
    )
    if updated_proveedor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado para actualizar")
    return updated_proveedor

# --- Endpoint para ELIMINAR un proveedor existente (Corregido) ---
@router.delete(
    "/api/proveedores/{proveedor_id}",
    status_code=status.HTTP_204_NO_CONTENT, 
    summary="Eliminar un proveedor existente",
    tags=["Proveedores"]
)
def delete_existing_proveedor(proveedor_id: int):
    """
    Elimina un proveedor por ID.
    Retorna 204 No Content (éxito), 404 Not Found, 
    409 Conflict (si tiene productos asociados), o 500 Internal Server Error.
    """
    # Llama a la función CRUD que ahora retorna un código numérico
    delete_result_code = crud_proveedores.delete_proveedor(proveedor_id=proveedor_id)
    
    # *** LÓGICA CORREGIDA PARA INTERPRETAR LOS CÓDIGOS ***
    if delete_result_code == 1:
        # Éxito (1 fila eliminada): Retorna 204 No Content (automático)
        return None 
    elif delete_result_code == -2: 
        # Error de Clave Foránea (-2)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, # 409 Conflict
            detail="No se puede eliminar el proveedor porque tiene productos asociados." 
        )
    elif delete_result_code == 0:
        # No encontrado (0 filas eliminadas)
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado para eliminar")
    else: # Incluye el caso -1 (otro error SQL) o cualquier otro inesperado
        # Error genérico del servidor
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al intentar eliminar el proveedor."
        )