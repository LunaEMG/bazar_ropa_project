# Importaciones de FastAPI y tipos necesarios
from fastapi import APIRouter, HTTPException, status
from typing import List 

# Importa las funciones CRUD para ventas
from app.crud import crud_ventas 
# Importa los schemas Pydantic para validar entrada y salida
from app.schemas import Venta, VentaCreate 

# Crea un router específico para las rutas de ventas
router = APIRouter()

# --- Endpoint para CREAR una nueva venta ---
@router.post(
    "/api/ventas", 
    response_model=Venta, # Define el schema de la respuesta exitosa
    status_code=status.HTTP_201_CREATED, # Código HTTP para creación exitosa
    summary="Registrar una nueva venta", # Título corto en la documentación
    tags=["Ventas"] # Agrupa este endpoint bajo "Ventas" en la documentación /docs
)
def create_new_venta(venta: VentaCreate):
    """
    Registra una nueva venta en la base de datos, incluyendo sus detalles.

    Recibe en el cuerpo de la petición:
    - `id_cliente`: ID del cliente que realiza la compra.
    - `detalles`: Una lista de objetos, cada uno con `id_producto`, `cantidad`, y `precio_unitario`.

    Retorna los datos de la venta creada, incluyendo los detalles insertados, 
    o un error HTTP si la operación falla.
    """
    try:
        # Llama a la función CRUD para procesar la creación de la venta
        db_venta = crud_ventas.create_venta(venta_data=venta)
        
        # Si la función CRUD retorna None, indica un error INTERNO
        if db_venta is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Error interno del servidor al procesar la venta."
            )
            
        # Si la creación fue exitosa, retorna los datos de la venta creada
        return db_venta
    
    except ValueError as e: # Captura el error de "Stock insuficiente"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, # 409 Conflict es bueno para esto
            detail=str(e) # Pasa el mensaje de error (ej. "Stock insuficiente...")
        )

# --- Endpoint para LEER todas las ventas ---
@router.get(
    "/api/ventas", 
    response_model=List[Venta], # Retorna una lista de Ventas
    summary="Obtener historial de ventas",
    tags=["Ventas"]
)
def read_ventas():
    """
    Obtiene una lista de todas las ventas registradas, ordenadas por fecha descendente.
    Cada venta incluye sus detalles asociados.
    """
    ventas = crud_ventas.get_all_ventas()
    return ventas

# --- Endpoint para LEER una venta específica por ID ---
@router.get(
    "/api/ventas/{venta_id}", 
    response_model=Venta, # Retorna una sola Venta
    summary="Obtener una venta por ID",
    tags=["Ventas"]
)
def read_venta(venta_id: int):
    """
    Obtiene los detalles de una venta específica usando su 'id_venta',
    incluyendo todos sus items (detalles) asociados.
    Retorna 404 Not Found si la venta no existe.
    """
    db_venta = crud_ventas.get_venta_by_id(venta_id)
    if db_venta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    return db_venta