from fastapi import APIRouter, HTTPException, status, Depends 
from typing import List
from sqlalchemy.orm import Session 

from app.crud import crud_reportes
from app.schemas import ReporteStock, ReporteVentasCliente
from app.db.database import get_db
from app.auth import get_current_admin_user
from app.schemas import Cliente 

router = APIRouter()

@router.get(
    "/api/reportes/bajo-stock", 
    response_model=List[ReporteStock],
    summary="Obtener reporte de productos con bajo stock",
    tags=["Reportes"]
)
def read_reporte_bajo_stock(
    db: Session = Depends(get_db), # Changed to Session
    admin_user: Cliente = Depends(get_current_admin_user)
): 
    """Obtiene una lista de productos con stock < 10 (Solo Admin)."""
    reporte = crud_reportes.get_productos_bajo_stock(db=db) 
    return reporte

@router.get(
    "/api/reportes/ventas-cliente", 
    response_model=List[ReporteVentasCliente],
    summary="Obtener reporte de ventas por cliente",
    tags=["Reportes"]
)
def read_reporte_ventas_cliente(
    db: Session = Depends(get_db), # Changed to Session
    admin_user: Cliente = Depends(get_current_admin_user)
): 
    """Obtiene un resumen de compras y gasto total por cliente (Solo Admin)."""
    reporte = crud_reportes.get_ventas_por_cliente(db=db) 
    return reporte