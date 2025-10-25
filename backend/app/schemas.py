from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date # Necesario para el campo fecha

# --- Schemas de Producto (Existentes) ---
class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    cantidad_stock: int
    id_proveedor: int

class Producto(ProductoBase):
    id_producto: int

    class Config:
        orm_mode = True

# --- Schemas de Cliente (Existentes) ---
class ClienteBase(BaseModel):
    """Schema base para Cliente, con campos comunes."""
    nombre: str
    telefono: Optional[str] = None

class ClienteCreate(ClienteBase):
    """Schema para crear un nuevo Cliente (no requiere ID)."""
    pass

class Cliente(ClienteBase):
    """Schema para leer un Cliente (incluye ID)."""
    id_cliente: int

    class Config:
        orm_mode = True

# --- NUEVOS Schemas para Ventas ---

class DetalleVentaBase(BaseModel):
    """Schema base para un item dentro de una venta."""
    id_producto: int
    cantidad: int = Field(gt=0) # Asegura que la cantidad sea mayor que 0
    precio_unitario: float = Field(ge=0) # Asegura que el precio no sea negativo

class DetalleVentaCreate(DetalleVentaBase):
    """Schema para crear un detalle de venta (no requiere id_venta)."""
    pass

class DetalleVenta(DetalleVentaBase):
    """Schema para leer un detalle de venta (incluye id_venta)."""
    id_venta: int

    class Config:
        orm_mode = True

class VentaBase(BaseModel):
    """Schema base para Venta."""
    id_cliente: int
    fecha: date # Usamos el tipo 'date' de datetime
    # monto_total se calculará en el backend, no se recibe directamente

class VentaCreate(BaseModel):
    """Schema para crear una nueva Venta. Recibe el id_cliente y la lista de detalles."""
    id_cliente: int
    detalles: List[DetalleVentaCreate] # Una lista de items del carrito

class Venta(VentaBase):
    """Schema para leer una Venta (incluye ID y monto_total calculado)."""
    id_venta: int
    monto_total: float
    # Opcional: Podrías incluir los detalles aquí si quieres devolver la venta completa
    # detalles: List[DetalleVenta] = [] 

    class Config:
        orm_mode = True