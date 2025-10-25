from pydantic import BaseModel
from typing import Optional

# Definimos un "schema" que coincide con la tabla 'producto'
# Pydantic se encarga de la validación de tipos
class Producto(BaseModel):
    id_producto: int
    nombre: str
    descripcion: Optional[str] = None  # str | None también funciona
    precio: float                      # Pydantic convertirá el tipo NUMERIC
    cantidad_stock: int
    id_proveedor: int