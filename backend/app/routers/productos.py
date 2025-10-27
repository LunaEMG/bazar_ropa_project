# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status
from typing import List

# Importa las funciones CRUD y los schemas Pydantic para productos
from app.crud import crud_productos
from app.schemas import Producto, ProductoUpdate # <-- Se añade ProductoUpdate

# Crea un router específico para las rutas de productos
router = APIRouter()

# --- Endpoint para LEER todos los productos ---
@router.get(
    "/api/productos", 
    response_model=List[Producto], # Retorna una lista de Productos
    summary="Obtener lista de productos",
    tags=["Productos"] # Agrupa endpoints en la documentación /docs
)
def read_productos():
    """
    Obtiene una lista de todos los productos del bazar, 
    incluyendo una indicación del tipo de producto (ropa, calzado, accesorios).
    """
    productos = crud_productos.get_all_productos()
    return productos

# --- Endpoint para LEER un producto específico por ID ---
@router.get(
    "/api/productos/{producto_id}", 
    response_model=Producto, # Retorna un solo Producto
    summary="Obtener un producto por ID",
    tags=["Productos"]
)
def read_producto(producto_id: int):
    """
    Obtiene los detalles de un producto específico usando su 'id_producto',
    incluyendo los atributos específicos de su subtipo (si existen).
    Retorna 404 Not Found si el producto no existe.
    """
    db_producto = crud_productos.get_producto_by_id(producto_id)
    if db_producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return db_producto

# --- NUEVO Endpoint para ACTUALIZAR un producto existente ---
@router.put(
    "/api/productos/{producto_id}",
    # Retorna solo los datos base actualizados (podría cambiarse a Producto si se refina)
    response_model=Producto, # Ajustar si update_producto retorna el objeto completo
    summary="Actualizar datos base de un producto",
    tags=["Productos"]
)
def update_existing_producto(producto_id: int, producto_update: ProductoUpdate):
    """
    Actualiza los datos base (nombre, descripción, precio, stock, proveedor) 
    de un producto existente por su 'id_producto'.
    NOTA: Esta implementación no actualiza campos específicos de subtipos.
    Retorna los datos base actualizados o 404 si no se encuentra.
    """
    # Llama a la función CRUD para actualizar los datos base
    updated_producto_base = crud_productos.update_producto(
        producto_id=producto_id, producto_update=producto_update
    )
    
    if updated_producto_base is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado para actualizar")
    
    # Opcional: Si se desea retornar el objeto completo tras actualizar, 
    # se podría llamar a get_producto_by_id aquí de nuevo.
    # Por ahora, retornamos los datos base actualizados (requiere ajuste en response_model si cambia).
    # Para cumplir con response_model=Producto, llamamos a get_producto_by_id
    updated_full_producto = crud_productos.get_producto_by_id(producto_id)
    if updated_full_producto is None: # Verificación extra por si acaso
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado tras actualización")
    return updated_full_producto

# --- Endpoint DELETE ---
@router.delete(
    "/api/productos/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT, 
    summary="Eliminar un producto existente",
    tags=["Productos"]
)
def delete_existing_producto(producto_id: int):
    """
    Elimina un producto y su registro asociado en la tabla de subtipo.
    Retorna 204 No Content si la eliminación es exitosa.
    Retorna 404 Not Found si el producto no existe.
    Retorna 409 Conflict si el producto no se puede eliminar debido a referencias 
    en otras tablas (ej. 'detalle_venta').
    """
    # Llama a la función CRUD para eliminar
    delete_result = crud_productos.delete_producto(producto_id=producto_id)
    
    # Analiza el resultado de la función CRUD
    if delete_result == True:
        # Éxito: Retorna 204 No Content (automático)
        return None 
    elif delete_result == -2: # <-- *** NUEVA VERIFICACIÓN *** Código específico para error de FK
        # Error de Clave Foránea: El producto está en uso
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, # 409 Conflict es más apropiado
            detail="No se puede eliminar el producto porque está referenciado en una o más ventas."
        )
    else: # Incluye el caso donde delete_result es False (no encontrado) o -1 (otro error)
        # Error: Producto no encontrado u otro error
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado para eliminar")