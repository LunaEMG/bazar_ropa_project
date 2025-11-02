# Importaciones necesarias de Pydantic y tipos estándar
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Union
from datetime import date 

# --- Schemas de Producto ---
class ProductoBase(BaseModel):
    """Schema base para Producto, define campos comunes."""
    nombre: str
    descripcion: Optional[str] = None
    precio: float = Field(ge=0) 
    cantidad_stock: int = Field(ge=0) 
    id_proveedor: int

class ProductoUpdate(BaseModel):
    """Schema para actualizar un Producto. Todos los campos son opcionales."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, ge=0) 
    cantidad_stock: Optional[int] = Field(None, ge=0)
    id_proveedor: Optional[int] = None

class Producto(ProductoBase):
    """Schema para leer/retornar un Producto, incluye ID y detalles del subtipo."""
    id_producto: int
    detalles_subtipo: Optional[Any] = None 

    class Config:
        orm_mode = True 

# --- Schemas para Detalles de Subtipos (NUEVO) ---
class RopaDetalles(BaseModel):
    material: str = Field(..., example="Lino")
    tipo_corte: Optional[str] = Field(None, example="Slim Fit")
    talla: str = Field(..., example="M")

class CalzadoDetalles(BaseModel):
    talla_numerica: float = Field(..., example=27.5)
    material_suela: str = Field(..., example="Goma")

class AccesoriosDetalles(BaseModel):
    material: str = Field(..., example="Lana")
    dimensiones: Optional[str] = Field(None, example="180cm x 30cm")

class RopaDetallesUpdate(BaseModel):
    material: Optional[str] = None
    tipo_corte: Optional[str] = None
    talla: Optional[str] = None

class CalzadoDetallesUpdate(BaseModel):
    talla_numerica: Optional[float] = None
    material_suela: Optional[str] = None

class AccesoriosDetallesUpdate(BaseModel):
    material: Optional[str] = None
    dimensiones: Optional[str] = None

# --- Schema para Actualización de Producto (NUEVO) ---
class ProductoUpdateConSubtipo(ProductoUpdate):
    """
    Schema para actualizar un producto. Incluye campos base opcionales
    y detalles de subtipo opcionales.
    """
    tipo_producto: str # Requerido para saber qué tabla de subtipo actualizar
    detalles_subtipo: Optional[Union[RopaDetallesUpdate, CalzadoDetallesUpdate, AccesoriosDetallesUpdate]] = None

# --- Schema para Creación de Producto (NUEVO) ---
class ProductoCreate(ProductoBase):
    """
    Schema para crear un producto. Incluye un campo 'tipo_producto' 
    y un campo de detalles que es una unión de los posibles subtipos.
    """
    tipo_producto: str # "ropa", "calzado", o "accesorios"
    detalles_subtipo: Union[RopaDetalles, CalzadoDetalles, AccesoriosDetalles]

# --- Schemas de Cliente ---
class ClienteBase(BaseModel):
    """Schema base para Cliente."""
    nombre: str
    telefono: Optional[str] = None

class ClienteCreate(ClienteBase):
    """Schema para validar los datos al crear un nuevo Cliente."""
    pass

class ClienteUpdate(BaseModel):
    """Schema para validar los datos al actualizar un Cliente."""
    nombre: Optional[str] = None
    telefono: Optional[str] = None

class Cliente(ClienteBase):
    """Schema para leer/retornar un Cliente."""
    id_cliente: int

    class Config:
        orm_mode = True 

# --- Schemas de Ventas (Actualizados) ---

class DetalleVentaBase(BaseModel):
    """Schema base para un item de detalle de venta."""
    id_producto: int
    cantidad: int = Field(gt=0) 
    precio_unitario: float = Field(ge=0) 

class DetalleVentaCreate(DetalleVentaBase):
    """Schema para validar los datos al crear un nuevo detalle de venta."""
    pass

class DetalleVenta(DetalleVentaBase):
    """Schema para leer/retornar un detalle de venta (incluye ID de venta)."""
    id_venta: int

    class Config:
        orm_mode = True 

class VentaBase(BaseModel):
    """Schema base para Venta."""
    id_cliente: int
    fecha: date 

class VentaCreate(BaseModel):
    """Schema para validar los datos al crear una nueva Venta."""
    id_cliente: int
    detalles: List[DetalleVentaCreate] 

class Venta(VentaBase):
    """Schema para leer/retornar una Venta (incluye campos generados y detalles)."""
    id_venta: int
    monto_total: float

    detalles: List[DetalleVenta] = [] 

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