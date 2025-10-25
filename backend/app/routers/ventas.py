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
    # Llama a la función CRUD para procesar la creación de la venta
    db_venta = crud_ventas.create_venta(venta_data=venta)
    
    # Si la función CRUD retorna None, indica un error durante la transacción
    if db_venta is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al procesar la venta."
        )
        
    # Si la creación fue exitosa, retorna los datos de la venta creada
    return db_venta

# --- (Endpoints para LEER ventas (GET /api/ventas, GET /api/ventas/{id}) se añadirían aquí) ---