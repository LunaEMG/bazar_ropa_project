# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status, Depends 
from typing import List
from sqlalchemy.orm import Session 

# Importa las funciones CRUD y los schemas Pydantic para proveedores
from app.crud import crud_proveedores
from app.schemas import Proveedor, ProveedorCreate, ProveedorUpdate 

# Importa nuestro nuevo 'inyector' de DB
from app.db.database import get_db
from app.auth import get_current_admin_user
from app.schemas import Cliente 

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
def create_new_proveedor(
    proveedor: ProveedorCreate, 
    db: Session = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """Crea un nuevo proveedor. (Admin Only)"""
    db_proveedor = crud_proveedores.create_proveedor(db=db, proveedor=proveedor) 
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
def read_proveedores(
    db: Session = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
): 
    """Obtiene una lista de todos los proveedores. (Admin Only)"""
    proveedores = crud_proveedores.get_all_proveedores(db=db) 
    return proveedores

# --- Endpoint para LEER un proveedor específico por ID ---
@router.get(
    "/api/proveedores/{proveedor_id}", 
    response_model=Proveedor,
    summary="Obtener un proveedor por ID",
    tags=["Proveedores"]
)
def read_proveedor(
    proveedor_id: int, 
    db: Session = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """Obtiene un proveedor específico. (Admin Only)"""
    db_proveedor = crud_proveedores.get_proveedor_by_id(db=db, proveedor_id=proveedor_id) 
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
def update_existing_proveedor(
    proveedor_id: int, 
    proveedor_update: ProveedorUpdate, 
    db: Session = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """Actualiza datos de un proveedor por ID. (Admin Only)"""
    updated_proveedor = crud_proveedores.update_proveedor(
        db=db, 
        proveedor_id=proveedor_id, 
        proveedor_update=proveedor_update
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
def delete_existing_proveedor(
    proveedor_id: int, 
    db: Session = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """
    Elimina un proveedor por ID. (Admin Only)
    ...
    """
    delete_result_code = crud_proveedores.delete_proveedor(db=db, proveedor_id=proveedor_id) 
    
    if delete_result_code == 1:
        return None 
    elif delete_result_code == 0:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado para eliminar")
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al intentar eliminar el proveedor."
        )