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
    """Schema para crear un nuevo Cliente."""
    pass

class Cliente(ClienteBase):
    """Schema para leer un Cliente."""
    id_cliente: int

    class Config:
        orm_mode = True

# --- Schemas de Ventas (Existentes) ---

class DetalleVentaBase(BaseModel):
    """Schema base para un item dentro de una venta."""
    id_producto: int
    cantidad: int = Field(gt=0) 
    precio_unitario: float = Field(ge=0) 

class DetalleVentaCreate(DetalleVentaBase):
    """Schema para crear un detalle de venta."""
    pass

class DetalleVenta(DetalleVentaBase):
    """Schema para leer un detalle de venta."""
    id_venta: int

    class Config:
        orm_mode = True

class VentaBase(BaseModel):
    """Schema base para Venta."""
    id_cliente: int
    fecha: date 

class VentaCreate(BaseModel):
    """Schema para crear una nueva Venta."""
    id_cliente: int
    detalles: List[DetalleVentaCreate] 

class Venta(VentaBase):
    """Schema para leer una Venta."""
    id_venta: int
    monto_total: float
    # detalles: List[DetalleVenta] = [] # Opcional incluir detalles

    class Config:
        orm_mode = True

# --- NUEVOS Schemas para Proveedores ---

class ProveedorBase(BaseModel):
    """Schema base para Proveedor, campos comunes."""
    nombre: str
    telefono: Optional[str] = None

class ProveedorCreate(ProveedorBase):
    """Schema para crear un nuevo Proveedor."""
    pass

class Proveedor(ProveedorBase):
    """Schema para leer un Proveedor (incluye ID)."""
    id_proveedor: int

    class Config:
        orm_mode = True # Permite mapeo directo desde objetos de base de datos