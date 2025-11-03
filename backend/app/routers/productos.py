# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status, Depends # <-- Añadido Depends
from typing import List
from psycopg import Connection # <-- Añadido Connection

# Importa las funciones CRUD y los schemas Pydantic para productos
from app.crud import crud_productos
from app.schemas import Producto, ProductoUpdate, ProductoCreate, ProductoUpdateConSubtipo

# Importa nuestro nuevo 'inyector' de DB
from app.db.database import get_db

# Crea un router específico para las rutas de productos
router = APIRouter()

# --- NUEVO Endpoint para CREAR un producto (con herencia) ---
@router.post(
    "/api/productos", 
    response_model=Producto, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo producto (con subtipo)",
    tags=["Productos"]
)
def create_new_producto(
    producto: ProductoCreate, 
    db: Connection = Depends(get_db) 
):
    """
    Crea un nuevo producto en la base de datos.
    ...
    """
    db_producto = crud_productos.create_producto(db=db, producto_data=producto) 
    
    if db_producto is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al crear el producto."
        )
    
    return db_producto


# --- Endpoint para LEER todos los productos ---
@router.get(
    "/api/productos", 
    response_model=List[Producto],
    summary="Obtener lista de productos",
    tags=["Productos"]
)
def read_productos(db: Connection = Depends(get_db)): 
    """
    Obtiene una lista de todos los productos del bazar...
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
    db: Connection = Depends(get_db) 
):
    """
    Obtiene los detalles de un producto específico usando su 'id_producto'...
    """
    db_producto = crud_productos.get_producto_by_id(db=db, producto_id=producto_id) 
    if db_producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return db_producto

# --- NUEVO Endpoint para ACTUALIZAR un producto existente ---
@router.put(
    "/api/productos/{producto_id}",
    response_model=Producto,
    summary="Actualizar un producto (Base y Subtipo)",
    tags=["Productos"]
)
def update_existing_producto(
    producto_id: int, 
    producto_update: ProductoUpdateConSubtipo,
    db: Connection = Depends(get_db) 
):
    """
    Actualiza los datos de un producto existente...
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
    db: Connection = Depends(get_db)
):
    """
    Elimina un producto y su registro asociado en la tabla de subtipo.
    ...
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