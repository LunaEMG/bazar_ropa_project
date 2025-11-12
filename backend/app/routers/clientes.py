# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from psycopg import Connection

# Importa las funciones CRUD y los schemas Pydantic para clientes
from app.crud import crud_clientes
from app.schemas import Cliente, ClienteCreate, ClienteUpdate

# Importa nuestro nuevo 'inyector' de DB
from app.db.database import get_db


from app.auth import get_current_admin_user
# (Cliente ya estaba importado en schemas)


# Crea un router específico para las rutas de clientes
router = APIRouter()

# --- Endpoint para CREAR un nuevo cliente ---
@router.post(
    "/api/clientes", 
    response_model=Cliente, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo cliente (Admin)",
    tags=["Clientes"] 
)
def create_new_cliente(
    cliente: ClienteCreate, 
    db: Connection = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """
    Crea un nuevo cliente en la base de datos. (Admin Only)
    Nota: Para registro público, usar /api/auth/register
    ...
    """
    new_cliente = crud_clientes.create_cliente(db=db, cliente=cliente) 
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
def read_clientes(
    db: Connection = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
): 
    """
    Obtiene una lista de todos los clientes registrados. (Admin Only)
    """
    clientes = crud_clientes.get_all_clientes(db=db) 
    return clientes


# --- Endpoint para LEER un cliente específico por ID ---
@router.get(
    "/api/clientes/{cliente_id}", 
    response_model=Cliente,
    summary="Obtener un cliente por ID",
    tags=["Clientes"]
)
def read_cliente(
    cliente_id: int, 
    db: Connection = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
): 
    """
    Obtiene los detalles de un cliente específico. (Admin Only)
    """
    db_cliente = crud_clientes.get_cliente_by_id(db=db, cliente_id=cliente_id) 
    if db_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return db_cliente

# --- Endpoint para ACTUALIZAR un cliente existente ---
@router.put(
    "/api/clientes/{cliente_id}",
    response_model=Cliente,
    summary="Actualizar un cliente existente",
    tags=["Clientes"]
)
def update_existing_cliente(
    cliente_id: int, 
    cliente_update: ClienteUpdate, 
    db: Connection = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
): 
    """
    Actualiza los datos de un cliente existente. (Admin Only)
    """
    updated_cliente = crud_clientes.update_cliente(db=db, cliente_id=cliente_id, cliente_update=cliente_update) 
    if updated_cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado para actualizar")
    return updated_cliente

# --- Endpoint para ELIMINAR un cliente existente (Corregido) ---
@router.delete(
    "/api/clientes/{cliente_id}",
    status_code=status.HTTP_204_NO_CONTENT, 
    summary="Eliminar un cliente existente",
    tags=["Clientes"]
)
def delete_existing_cliente(
    cliente_id: int, 
    db: Connection = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """
    Desactiva un cliente (borrado lógico). (Admin Only)
    """
    delete_result_code = crud_clientes.delete_cliente(db=db, cliente_id=cliente_id)
    
    if delete_result_code == 1:
        return None 
    elif delete_result_code == 0:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado para eliminar")
    else: 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al intentar eliminar el cliente."
        )