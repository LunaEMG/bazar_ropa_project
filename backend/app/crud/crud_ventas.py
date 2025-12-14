# backend/app/crud/crud_ventas.py

# Importaciones necesarias
from sqlalchemy.orm import Session
from app.models import Venta, DetalleVenta, Producto, Cliente
from app.schemas import VentaCreate
from datetime import date
from decimal import Decimal

# --- Funciones Auxiliares ---

def _enrich_venta(venta: Venta):
    """
    Popula campos planos que los schemas de Pydantic esperan ('nombre_cliente', 'nombre_producto')
    traídos de las relaciones ORM.
    """
    if not venta:
        return None
        
    # Popular nombre del cliente
    if venta.cliente:
        venta.nombre_cliente = venta.cliente.nombre
    else:
        venta.nombre_cliente = "(Cliente Eliminado)"
        
    # Popular nombre de productos en los detalles
    for detalle in venta.detalles:
        if detalle.producto:
            detalle.nombre_producto = detalle.producto.nombre
        else:
            detalle.nombre_producto = "(Producto Eliminado)"
            
    return venta

# --- Funciones CRUD para Ventas ---

def create_venta(db: Session, venta_data: VentaCreate):
    """
    Crea un nuevo registro de venta y sus detalles asociados en la base de datos.
    Maneja transacción y verificación de stock.
    """
    try:
        total = Decimal(0)
        detalles_entidades = []
        
        # Validar y Bloquear productos (Pessimistic Locking)
        for item in venta_data.detalles:
            # Obtener producto y bloquear fila
            producto = db.query(Producto).filter(Producto.id_producto == item.id_producto).with_for_update().first()
            
            if not producto:
                raise ValueError(f"Producto con ID {item.id_producto} no encontrado.")
            
            if producto.cantidad_stock < item.cantidad:
                raise ValueError(f"Stock insuficiente para '{producto.nombre}'. Solicitados: {item.cantidad}, Disponibles: {producto.cantidad_stock}")
            
            # Calcular subtotal usando precio real de la BD
            precio = producto.precio
            total += Decimal(item.cantidad) * precio
            
            # Descontar stock
            producto.cantidad_stock -= item.cantidad
            
            # Crear entidad de detalle (todavía no insertada)
            nuevo_detalle = DetalleVenta(
                id_producto=producto.id_producto,
                cantidad=item.cantidad,
                precio_unitario=precio
            )
            detalles_entidades.append(nuevo_detalle)
            
        # Crear la venta
        nueva_venta = Venta(
            id_cliente=venta_data.id_cliente,
            fecha=date.today(),
            monto_total=total
        )
        
        # Asociar detalles
        nueva_venta.detalles = detalles_entidades
        
        db.add(nueva_venta)
        db.commit()
        db.refresh(nueva_venta)
        
        return _enrich_venta(nueva_venta)

    except Exception as e:
        db.rollback()
        print(f"Error durante la venta: {e}")
        # Re-lanzar ValueError para que el endpoint pueda retornar 400
        if isinstance(e, ValueError):
            raise e
        return None

def get_venta_by_id(db: Session, venta_id: int):
    """Obtiene una venta específica por su ID."""
    venta = db.query(Venta).filter(Venta.id_venta == venta_id).first()
    return _enrich_venta(venta)

def get_all_ventas(db: Session):
    """Obtiene todas las ventas (histórico)."""
    # Ordenar por fecha desc, id desc
    ventas = db.query(Venta).outerjoin(Cliente).order_by(Venta.fecha.desc(), Venta.id_venta.desc()).all()
    # Enriquecer todas
    return [_enrich_venta(v) for v in ventas]

def get_ventas_by_cliente(db: Session, cliente_id: int):
    """Obtiene las ventas de un cliente específico."""
    ventas = db.query(Venta).filter(Venta.id_cliente == cliente_id).order_by(Venta.fecha.desc(), Venta.id_venta.desc()).all()
    return [_enrich_venta(v) for v in ventas]

def get_venta_by_id(db: Session, venta_id: int):
    """Obtiene una venta específica por ID."""
    venta = db.query(Venta).filter(Venta.id_venta == venta_id).first()
    return _enrich_venta(venta)