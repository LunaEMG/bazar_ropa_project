# Importaciones necesarias
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date 

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
        orm_mode = True # Deprecated in Pydantic v2, use from_attributes=True

# --- Schemas de Cliente (Existentes) ---
class ClienteBase(BaseModel):
    """Schema base para Cliente."""
    nombre: str
    telefono: Optional[str] = None

class ClienteCreate(ClienteBase):
    """Schema para la creación de un Cliente."""
    pass

class Cliente(ClienteBase):
    """Schema para la lectura/respuesta de un Cliente."""
    id_cliente: int

    class Config:
        orm_mode = True # Deprecated in Pydantic v2, use from_attributes=True

# --- Schemas de Ventas (Existentes) ---
class DetalleVentaBase(BaseModel):
    """Schema base para un item de detalle de venta."""
    id_producto: int
    cantidad: int = Field(gt=0) 
    precio_unitario: float = Field(ge=0) 

class DetalleVentaCreate(DetalleVentaBase):
    """Schema para la creación de un detalle de venta."""
    pass

class DetalleVenta(DetalleVentaBase):
    """Schema para la lectura/respuesta de un detalle de venta."""
    id_venta: int

    class Config:
        orm_mode = True # Deprecated in Pydantic v2, use from_attributes=True

class VentaBase(BaseModel):
    """Schema base para Venta."""
    id_cliente: int
    fecha: date 

class VentaCreate(BaseModel):
    """Schema para la creación de una Venta."""
    id_cliente: int
    detalles: List[DetalleVentaCreate] 

class Venta(VentaBase):
    """Schema para la lectura/respuesta de una Venta."""
    id_venta: int
    monto_total: float

    class Config:
        orm_mode = True # Deprecated in Pydantic v2, use from_attributes=True

# --- Schemas de Proveedores (Existentes) ---
class ProveedorBase(BaseModel):
    """Schema base para Proveedor."""
    nombre: str
    telefono: Optional[str] = None

class ProveedorCreate(ProveedorBase):
    """Schema para la creación de un Proveedor."""
    pass

class Proveedor(ProveedorBase):
    """Schema para la lectura/respuesta de un Proveedor."""
    id_proveedor: int

    class Config:
        orm_mode = True # Deprecated in Pydantic v2, use from_attributes=True

# --- NUEVOS Schemas para Direcciones ---

class DireccionBase(BaseModel):
    """Schema base para Direccion, campos comunes."""
    calle: str
    ciudad: str
    codigo_postal: str
    # id_cliente se manejará a través de la ruta o contexto, no necesariamente aquí.

class DireccionCreate(DireccionBase):
    """Schema para la creación de una nueva Direccion."""
    # Podría requerir id_cliente si la ruta no lo proporciona contextualmente.
    pass 

class Direccion(DireccionBase):
    """Schema para la lectura/respuesta de una Direccion (incluye IDs)."""
    id_direccion: int
    id_cliente: int # Incluye el ID del cliente al que pertenece

    class Config:
        orm_mode = True # Deprecated in Pydantic v2, use from_attributes=True