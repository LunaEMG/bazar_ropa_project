# Importaciones necesarias de Pydantic y tipos estándar
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date 

# --- Schemas de Producto ---

class ProductoBase(BaseModel):
    """Schema base para Producto, define campos comunes."""
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    cantidad_stock: int
    id_proveedor: int

class Producto(ProductoBase):
    """Schema para leer/retornar un Producto, incluye el ID."""
    id_producto: int

    class Config:
        # Habilita el modo ORM para mapear desde objetos de base de datos.
        # En Pydantic V2, usar 'from_attributes = True'.
        orm_mode = True 

# --- Schemas de Cliente ---

class ClienteBase(BaseModel):
    """Schema base para Cliente."""
    nombre: str
    telefono: Optional[str] = None

class ClienteCreate(ClienteBase):
    """Schema para validar los datos al crear un nuevo Cliente."""
    pass

class ClienteUpdate(BaseModel):
    """Schema para validar los datos al actualizar un Cliente. Todos los campos son opcionales."""
    nombre: Optional[str] = None
    telefono: Optional[str] = None

class Cliente(ClienteBase):
    """Schema para leer/retornar un Cliente."""
    id_cliente: int

    class Config:
        orm_mode = True 

# --- Schemas de Ventas ---

class DetalleVentaBase(BaseModel):
    """Schema base para un item de detalle de venta."""
    id_producto: int
    # Validación: cantidad debe ser mayor que 0
    cantidad: int = Field(gt=0) 
    # Validación: precio_unitario debe ser mayor o igual a 0
    precio_unitario: float = Field(ge=0) 

class DetalleVentaCreate(DetalleVentaBase):
    """Schema para validar los datos al crear un nuevo detalle de venta."""
    pass

class DetalleVenta(DetalleVentaBase):
    """Schema para leer/retornar un detalle de venta."""
    id_venta: int

    class Config:
        orm_mode = True 

class VentaBase(BaseModel):
    """Schema base para Venta."""
    id_cliente: int
    fecha: date 

class VentaCreate(BaseModel):
    """Schema para validar los datos al crear una nueva Venta (recibe detalles)."""
    id_cliente: int
    detalles: List[DetalleVentaCreate] # Espera una lista de detalles válidos

class Venta(VentaBase):
    """Schema para leer/retornar una Venta (incluye campos calculados/generados)."""
    id_venta: int
    monto_total: float
    # Opcional: Se podría añadir 'detalles: List[DetalleVenta] = []' si se retorna la venta completa.

    class Config:
        orm_mode = True 

# --- Schemas de Proveedores ---

class ProveedorBase(BaseModel):
    """Schema base para Proveedor."""
    nombre: str
    telefono: Optional[str] = None

class ProveedorCreate(ProveedorBase):
    """Schema para validar los datos al crear un nuevo Proveedor."""
    pass

class Proveedor(ProveedorBase):
    """Schema para leer/retornar un Proveedor."""
    id_proveedor: int

    class Config:
        orm_mode = True 

# --- Schemas de Direcciones ---

class DireccionBase(BaseModel):
    """Schema base para Direccion."""
    calle: str
    ciudad: str
    codigo_postal: str

class DireccionCreate(DireccionBase):
    """Schema para validar los datos al crear una nueva Direccion."""
    # id_cliente se obtiene del path parameter en la ruta, no se incluye aquí.
    pass 

class Direccion(DireccionBase):
    """Schema para leer/retornar una Direccion."""
    id_direccion: int
    id_cliente: int # Incluye el ID del cliente propietario

    class Config:
        orm_mode = True