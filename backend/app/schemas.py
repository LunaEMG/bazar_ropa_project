from pydantic import BaseModel
from typing import Optional

# --- Schemas de Producto ---
class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    cantidad_stock: int
    id_proveedor: int

class Producto(ProductoBase):
    id_producto: int

    class Config:
        # Permite que Pydantic trabaje directamente con objetos de base de datos
        orm_mode = True

# --- Schemas de Cliente ---
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

# --- (Puedes añadir schemas para Venta, Proveedor, etc. aquí más adelante) ---