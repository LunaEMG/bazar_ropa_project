# Importaciones necesarias de Pydantic y tipos estándar
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Union
from datetime import date 

# --- Schemas de Producto ---
class ProductoBase(BaseModel):
    """Schema base para Producto, define campos comunes."""
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None 
    precio: float = Field(ge=0) 
    cantidad_stock: int = Field(ge=0) 
    id_proveedor: int 

class ProductoUpdate(BaseModel):
    """Schema para actualizar un Producto. Todos los campos son opcionales."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None 
    precio: Optional[float] = Field(None, ge=0) 
    cantidad_stock: Optional[int] = Field(None, ge=0)
    id_proveedor: Optional[int] = None

class Producto(ProductoBase): 
    """Schema para leer/retornar un Producto, incluye ID y detalles del subtipo."""
    id_producto: int

    id_proveedor: Optional[int] = None 

    tipo_producto: str
    
    detalles_subtipo: Optional[Any] = None 

    class Config:
        from_attributes = True 

# --- Schemas para Detalles de Subtipos ---
class RopaDetalles(BaseModel):
    material: str = Field(..., example="Lino")
    tipo_corte: Optional[str] = Field(None, example="Slim Fit")
    talla: str = Field(..., example="M")

    class Config:
        from_attributes = True

class CalzadoDetalles(BaseModel):
    talla_numerica: float = Field(..., example=27.5)
    material_suela: str = Field(..., example="Goma")

    class Config:
        from_attributes = True

class AccesoriosDetalles(BaseModel):
    material: str = Field(..., example="Lana")
    dimensiones: Optional[str] = Field(None, example="180cm x 30cm")

    class Config:
        from_attributes = True

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

# --- Schema para Actualización de Producto ---
class ProductoUpdateConSubtipo(ProductoUpdate):
    """
    Schema para actualizar un producto. Incluye campos base opcionales
    y detalles de subtipo opcionales.
    """
    tipo_producto: str 
    detalles_subtipo: Optional[Union[RopaDetallesUpdate, CalzadoDetallesUpdate, AccesoriosDetallesUpdate]] = None

# --- Schema para Creación de Producto ---
class ProductoCreate(ProductoBase):
    """
    Schema para crear un producto. Incluye un campo 'tipo_producto' 
    y un campo de detalles que es una unión de los posibles subtipos.
    """
    # Hereda id_proveedor: int de ProductoBase, por lo que sigue siendo requerido al crear.
    tipo_producto: str 
    detalles_subtipo: Union[RopaDetalles, CalzadoDetalles, AccesoriosDetalles]

# --- Schemas de Cliente ---
class ClienteBase(BaseModel):
    """Schema base para Cliente."""
    nombre: str
    telefono: Optional[str] = None
    email: str 

class ClienteCreate(ClienteBase):
    """Schema para validar los datos al crear un nuevo Cliente."""
    password: str 

class ClienteUpdate(BaseModel):
    """Schema para validar los datos al actualizar un Cliente."""
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[str] = None 

class Cliente(ClienteBase):
    """Schema para leer/retornar un Cliente."""
    id_cliente: int
    rol: str

    class Config:
        from_attributes = True

# --- Schemas de Ventas (Actualizados) ---

class DetalleVentaBase(BaseModel):
    """Schema base para un item de detalle de venta."""
    id_producto: int
    cantidad: int = Field(gt=0) 


class DetalleVentaCreate(BaseModel):
    """Schema para validar los datos al crear un nuevo detalle de venta."""
    id_producto: int
    cantidad: int = Field(gt=0)

class DetalleVenta(DetalleVentaBase):
    """Schema para leer/retornar un detalle de venta (incluye ID de venta)."""
    id_venta: int
    precio_unitario: float = Field(ge=0)
    nombre_producto: Optional[str] = None

    class Config:
        from_attributes = True 

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

    # Sobrescribimos id_cliente para permitir que sea None
    id_cliente: Optional[int] = None 
    nombre_cliente: Optional[str] = None

    detalles: List[DetalleVenta] = [] 

    class Config:
        from_attributes = True 

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
        from_attributes = True 

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
        from_attributes = True 

# --- Schemas de Reportes ---

class ReporteStock(BaseModel):
    """Schema para el reporte de productos con bajo stock."""
    id_producto: int
    nombre: str
    cantidad_stock: int
    
    class Config:
        from_attributes = True 

class ReporteVentasCliente(BaseModel):
    """Schema para el reporte de ventas por cliente."""
    id_cliente: int
    nombre: str
    total_compras: int
    gasto_total: float
    
    class Config:
        from_attributes = True

# --- Schema para autenticacion ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None