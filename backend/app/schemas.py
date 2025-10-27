# Importaciones necesarias de Pydantic y tipos estándar
from pydantic import BaseModel, Field
from typing import Optional, List, Any # 'Any' permite flexibilidad para detalles_subtipo
from datetime import date 

# --- Schemas de Producto ---

class ProductoBase(BaseModel):
    """Schema base para Producto, define campos comunes."""
    nombre: str
    descripcion: Optional[str] = None
    precio: float = Field(ge=0) # Validación: precio >= 0
    cantidad_stock: int = Field(ge=0) # Validación: stock >= 0
    id_proveedor: int

class ProductoUpdate(BaseModel):
    """Schema para actualizar un Producto. Todos los campos son opcionales."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, ge=0) # Permite None, pero valida si se proporciona
    cantidad_stock: Optional[int] = Field(None, ge=0)
    id_proveedor: Optional[int] = None
    # Los detalles específicos del subtipo (talla, material_suela, etc.) 
    # se manejarían a través de endpoints específicos si fuera necesario actualizarlos.

class Producto(ProductoBase):
    """Schema para leer/retornar un Producto, incluye ID y opcionalmente detalles del subtipo."""
    id_producto: int
    # Este campo se puede poblar con un diccionario que contenga 
    # los atributos específicos de la tabla de subtipo (ropa, calzado, accesorios).
    detalles_subtipo: Optional[Any] = None 

    class Config:
        # Habilita el mapeo desde objetos ORM o diccionarios que actúan como tal.
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
    """Schema para validar los datos al actualizar un Cliente (campos opcionales)."""
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
    cantidad: int = Field(gt=0) # Validación: cantidad > 0
    precio_unitario: float = Field(ge=0) # Validación: precio >= 0

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
    """Schema para leer/retornar una Venta."""
    id_venta: int
    monto_total: float

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

class ProveedorUpdate(BaseModel):
    """Schema para actualizar un Proveedor (campos opcionales)."""
    nombre: Optional[str] = None
    telefono: Optional[str] = None

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
    pass 

class DireccionUpdate(BaseModel):
    """Schema para actualizar una Direccion (campos opcionales)."""
    calle: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None

class Direccion(DireccionBase):
    """Schema para leer/retornar una Direccion."""
    id_direccion: int
    id_cliente: int 

    class Config:
        orm_mode = True