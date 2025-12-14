from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from sqlalchemy.orm import Session # Changed from psycopg Connection

from app.crud import crud_productos 
from app.schemas import Producto, ProductoUpdate, ProductoCreate, ProductoUpdateConSubtipo

from app.db.database import get_db

from app.auth import get_current_admin_user
from app.schemas import Cliente

router = APIRouter()

@router.post(
    "/api/productos", 
    response_model=Producto, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un  producto (con subtipo)",
    tags=["Productos"]
)
def create_new_producto(
    producto: ProductoCreate, 
    db: Session = Depends(get_db), # Changed to Session
    admin_user: Cliente = Depends(get_current_admin_user) 
):
    """
    Crea un  producto en la base de datos. (Admin Only)
    ...
    """
    db_producto = crud_productos.create_producto(db=db, producto_data=producto) 
    
    if db_producto is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al crear el producto."
        )
    
    return db_producto

@router.get(
    "/api/productos", 
    response_model=List[Producto],
    summary="Obtener lista de productos",
    tags=["Productos"]
)
def read_productos(db: Session = Depends(get_db)): # Changed to Session
    """
    Obtiene una lista de todos los productos del bazar... (Público)
    """
    productos = crud_productos.get_all_productos(db=db) 
    return productos

# --- Endpoint para LEER un producto específico por ID ---
@router.get(
    "/api/productos/{producto_id}", 
    response_model=Producto,
    summary="Obtener un producto por ID",
    tags=["Productos"]
)
def read_producto(
    producto_id: int, 
    db: Session = Depends(get_db) 
):
    """
    Obtiene los detalles de un producto específico... (Público)
    """
    db_producto = crud_productos.get_producto_by_id(db=db, producto_id=producto_id) 
    if db_producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return db_producto

# ---  Endpoint para ACTUALIZAR un producto existente ---
@router.put(
    "/api/productos/{producto_id}",
    response_model=Producto,
    summary="Actualizar un producto (Base y Subtipo)",
    tags=["Productos"]
)
def update_existing_producto(
    producto_id: int, 
    producto_update: ProductoUpdateConSubtipo,
    db: Session = Depends(get_db), # Changed to Session
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """
    Actualiza los datos de un producto existente... (Admin Only)
    """
    updated_producto = crud_productos.update_producto(
        db=db, 
        producto_id=producto_id, 
        producto_update=producto_update
    )
    
    if updated_producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado o error al actualizar")
    
    return updated_producto

# --- Endpoint DELETE ---
@router.delete(
    "/api/productos/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT, 
    summary="Eliminar un producto existente",
    tags=["Productos"]
)
def delete_existing_producto(
    producto_id: int, 
    db: Session = Depends(get_db), # Changed to Session
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """
    Elimina un producto y su registro asociado... (Admin Only)
    """
    delete_result_code = crud_productos.delete_producto(db=db, producto_id=producto_id) 
    
    if delete_result_code == 1:
        return None 
    elif delete_result_code == 0:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado para eliminar")
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al intentar eliminar el producto."
        )