# Importaciones necesarias de FastAPI, tipos y estado HTTP
from fastapi import APIRouter, HTTPException, status
from typing import List

# Importa las funciones CRUD y los schemas Pydantic para productos
from app.crud import crud_productos
from app.schemas import Producto, ProductoUpdate, ProductoCreate, ProductoUpdateConSubtipo

# Crea un router específico para las rutas de productos
router = APIRouter()

# --- NUEVO Endpoint para CREAR un producto (con herencia) ---
@router.post(
    "/api/productos", 
    response_model=Producto, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo producto (con subtipo)",
    tags=["Productos"]
)
def create_new_producto(producto: ProductoCreate):
    """
    Crea un nuevo producto en la base de datos.
    
    Recibe los datos base y un objeto `detalles_subtipo` que debe
    coincidir con el `tipo_producto` ("ropa", "calzado", "accesorios").
    
    Inserta en `producto` y en la tabla de subtipo correspondiente
    dentro de una transacción.
    """
    db_producto = crud_productos.create_producto(producto_data=producto)
    
    if db_producto is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al crear el producto."
        )
    
    return db_producto


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
    response_model=Producto,
    summary="Actualizar un producto (Base y Subtipo)",
    tags=["Productos"]
)

def update_existing_producto(producto_id: int, producto_update: ProductoUpdateConSubtipo): # <-- Schema cambiado
    """
    Actualiza los datos de un producto existente, incluyendo sus
    detalles de subtipo.
    
    El campo 'tipo_producto' debe coincidir con el tipo existente del producto.
    """
    updated_producto = crud_productos.update_producto(
        producto_id=producto_id, producto_update=producto_update
    )
    
    if updated_producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado o error al actualizar")
    
    return updated_producto

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
    Retorna 500 Internal Server Error para otros errores de base de datos.
    """
    # Llama a la función CRUD para eliminar, ahora retorna 1, 0, -1, o -2
    delete_result_code = crud_productos.delete_producto(producto_id=producto_id)
    
    # Analiza el código de resultado devuelto por la función CRUD
    if delete_result_code == 1:
        # Éxito (1 fila eliminada): Retorna 204 No Content (automático)
        return None 
    elif delete_result_code == 0:
        # No encontrado (0 filas eliminadas)
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado para eliminar")
    else: # Incluye el caso -1 (otro error SQL) o cualquier otro inesperado
        # Error genérico del servidor
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del servidor al intentar eliminar el producto."
        )