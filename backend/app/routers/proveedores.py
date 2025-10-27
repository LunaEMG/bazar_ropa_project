# Importaciones necesarias de FastAPI y tipos
from fastapi import APIRouter, HTTPException, status
from typing import List

# Importa las funciones CRUD y los schemas Pydantic para proveedores
from app.crud import crud_proveedores
from app.schemas import Proveedor, ProveedorCreate

# Crea un router específico para las rutas de proveedores
router = APIRouter()

# --- Endpoint para CREAR un nuevo proveedor ---
@router.post(
    "/api/proveedores", 
    response_model=Proveedor, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo proveedor",
    tags=["Proveedores"] # Agrupa en la documentación /docs
)
def create_new_proveedor(proveedor: ProveedorCreate):
    """
    Crea un nuevo proveedor en la base de datos.
    Valida los datos de entrada contra el schema ProveedorCreate.
    Retorna el proveedor creado con su ID.
    """
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

# --- (Endpoints para actualizar (PUT) y borrar (DELETE) proveedores se añadirían aquí) ---