# backend/app/crud/crud_reportes.py

# Importaciones necesarias
from sqlalchemy.orm import Session
from sqlalchemy import text

def get_productos_bajo_stock(db: Session): 
    """Obtiene datos de la vista v_productos_bajo_stock."""
    try:
        # Usamos text() para consultar la vista existente
        statement = text("SELECT id_producto, nombre, cantidad_stock FROM v_productos_bajo_stock")
        result = db.execute(statement)
        # Convertir a lista de diccionarios (usando _mapping)
        return [row._mapping for row in result]
    except Exception as e:
        print(f"Error al obtener reporte bajo stock: {e}")
        return []

def get_ventas_por_cliente(db: Session): 
    """Obtiene datos de la vista v_ventas_por_cliente."""
    try:
        statement = text("SELECT id_cliente, nombre, total_compras, gasto_total FROM v_ventas_por_cliente")
        result = db.execute(statement)
        return [row._mapping for row in result]
    except Exception as e:
        print(f"Error al obtener reporte ventas por cliente: {e}")
        return []