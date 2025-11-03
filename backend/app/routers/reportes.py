from fastapi import APIRouter, HTTPException, status, Depends 
from typing import List
from psycopg import Connection 

from app.crud import crud_reportes
from app.schemas import ReporteStock, ReporteVentasCliente

# Importa nuestro nuevo 'inyector' de DB
from app.db.database import get_db

router = APIRouter()

@router.get(
    "/api/reportes/bajo-stock", 
    response_model=List[ReporteStock],
    summary="Obtener reporte de productos con bajo stock",
    tags=["Reportes"]
)
def read_reporte_bajo_stock(db: Connection = Depends(get_db)): 
    """Obtiene una lista de productos con stock < 10."""
    reporte = crud_reportes.get_productos_bajo_stock(db=db) 
    return reporte

@router.get(
    "/api/reportes/ventas-cliente", 
    response_model=List[ReporteVentasCliente],
    summary="Obtener reporte de ventas por cliente",
    tags=["Reportes"]
)
def read_reporte_ventas_cliente(db: Connection = Depends(get_db)): 
    """Obtiene un resumen de compras y gasto total por cliente."""
    reporte = crud_reportes.get_ventas_por_cliente(db=db) 
    return reporte