from fastapi import APIRouter, HTTPException
from typing import List
from app.crud import crud_productos
from app.schemas import Producto # Importa el "schema" que definimos

# Creamos un "router", que es como un mini-servidor para los productos
router = APIRouter()

# --- Endpoint 1: Obtener TODOS los productos ---
@router.get("/api/productos", response_model=List[Producto])
def read_productos():
    """
    Obtiene una lista de todos los productos del bazar.
    """
    return crud_productos.get_all_productos()

# --- Endpoint 2: Obtener UN producto por su ID ---
@router.get("/api/productos/{producto_id}", response_model=Producto)
def read_producto(producto_id: int):
    """
    Obtiene un producto específico por su id_producto.
    """
    db_producto = crud_productos.get_producto_by_id(producto_id)
    
    # Si la función CRUD no encontró nada, retorna un error 404
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    return db_producto