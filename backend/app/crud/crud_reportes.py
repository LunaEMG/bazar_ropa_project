# Importaciones necesarias

import psycopg
from psycopg import Connection 
from .crud_productos import row_to_dict 

def get_productos_bajo_stock(db: Connection): 
    """Obtiene datos de la vista v_productos_bajo_stock."""
    reporte = []
    try:
        with db.cursor() as cur: # <-- Usa db
            cur.execute("SELECT id_producto, nombre, cantidad_stock FROM v_productos_bajo_stock")
            reporte_rows = cur.fetchall()
            reporte = [row_to_dict(cur, row) for row in reporte_rows]
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener reporte bajo stock: {error}")

    return reporte

def get_ventas_por_cliente(db: Connection): 
    """Obtiene datos de la vista v_ventas_por_cliente."""
    reporte = []
    try:
        with db.cursor() as cur: 
            cur.execute("SELECT id_cliente, nombre, total_compras, gasto_total FROM v_ventas_por_cliente")
            reporte_rows = cur.fetchall()
            reporte = [row_to_dict(cur, row) for row in reporte_rows]
    except (Exception, psycopg.Error) as error:
        print(f"Error al obtener reporte ventas por cliente: {error}")
        
    return reporte