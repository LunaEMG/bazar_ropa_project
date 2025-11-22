# Importaciones de FastAPI y tipos necesarios
from fastapi import APIRouter, HTTPException, status, Depends 
from typing import List 
from psycopg import Connection 

# Importa las funciones CRUD para ventas
from app.crud import crud_ventas 
# Importa los schemas Pydantic para validar entrada y salida
from app.schemas import Venta, VentaCreate 

# Importa nuestro nuevo 'inyector' de DB
from app.db.database import get_db
from app.auth import get_current_user, get_current_admin_user
from app.schemas import Cliente


# Crea un router específico para las rutas de ventas
router = APIRouter()

# --- Endpoint para CREAR una nueva venta ---
@router.post(
    "/api/ventas", 
    response_model=Venta,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar una nueva venta",
    tags=["Ventas"]
)
def create_new_venta(
    venta: VentaCreate, 
    db: Connection = Depends(get_db),
    current_user: Cliente = Depends(get_current_user)
):
    """
    Registra una nueva venta en la base de datos. (Usuario Only)
    El ID del cliente en la venta DEBE coincidir con el usuario logueado.
    """
    
    # --- CHEQUEO DE SEGURIDAD ---
    # Si el usuario NO es admin Y intenta comprar para otro ID, lanzamos error.
    if current_user.rol != 'admin' and venta.id_cliente != current_user.id_cliente:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes realizar una compra para otro cliente."
        )
    # --- FIN DE CHEQUEO ---

    try:
        db_venta = crud_ventas.create_venta(db=db, venta_data=venta) 
        
        if db_venta is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Error interno del servidor al procesar la venta."
            )
            
        return db_venta
    
    except ValueError as e: # Captura el error de "Stock insuficiente"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# --- Endpoint para LEER todas las ventas ---
@router.get(
    "/api/ventas", 
    response_model=List[Venta],
    summary="Obtener historial de ventas",
    tags=["Ventas"]
)
def read_ventas(
    db: Connection = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
): 
    """
    Obtiene una lista de todas las ventas registradas... (Admin Only)
    """
    ventas = crud_ventas.get_all_ventas(db=db) 
    return ventas

# --- Endpoint para LEER historial de compras del usuario ---
@router.get(
    "/api/ventas/mis-compras", 
    response_model=List[Venta],
    summary="Obtener historial de compras propio",
    tags=["Ventas"]
)
def read_mis_ventas(
    db: Connection = Depends(get_db),
    current_user: Cliente = Depends(get_current_user) # <-- Esto asegura que sea el usuario logueado
):
    """
    Obtiene el historial de compras del usuario autenticado.
    """
    ventas = crud_ventas.get_ventas_by_cliente(db=db, cliente_id=current_user.id_cliente)
    return ventas

# --- Endpoint para LEER una venta específica por ID ---
@router.get(
    "/api/ventas/{venta_id}", 
    response_model=Venta,
    summary="Obtener una venta por ID",
    tags=["Ventas"]
)
def read_venta(
    venta_id: int, 
    db: Connection = Depends(get_db),
    admin_user: Cliente = Depends(get_current_admin_user)
):
    """
    Obtiene los detalles de una venta específica... (Admin Only)
    """
    db_venta = crud_ventas.get_venta_by_id(db=db, venta_id=venta_id) 
    if db_venta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    return db_venta