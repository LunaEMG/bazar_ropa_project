# backend/app/crud/crud_productos.py

# Importaciones necesarias
from sqlalchemy.orm import Session
from app.models import Producto, Ropa, Calzado, Accesorios
from app.schemas import (
    ProductoUpdate, ProductoCreate, RopaDetalles, CalzadoDetalles, AccesoriosDetalles,
    ProductoUpdateConSubtipo, RopaDetallesUpdate, CalzadoDetallesUpdate, AccesoriosDetallesUpdate
)

# --- CREAR (Create): Añadir un nuevo producto ---
def create_producto(db: Session, producto_data: ProductoCreate):
    """
    Crea un nuevo producto en la tabla 'producto' y su correspondiente
    registro en la tabla de subtipo (ropa, calzado o accesorios).
    """

    # 1. Crear instancia base
    db_producto = Producto(
        nombre=producto_data.nombre,
        descripcion=producto_data.descripcion,
        precio=producto_data.precio,
        cantidad_stock=producto_data.cantidad_stock,
        id_proveedor=producto_data.id_proveedor,
        imagen_url=producto_data.imagen_url
    )

    detalles = producto_data.detalles_subtipo

    # 2. Crear instancia de subtipo y asociar (SQLAlchemy manejará las FKs al hacer flush)
    # Nota: Asociamos directamente a la relación del modelo
    try:
        if producto_data.tipo_producto == "ropa" and isinstance(detalles, RopaDetalles):
            db_ropa = Ropa(
                material=detalles.material,
                tipo_corte=detalles.tipo_corte,
                talla=detalles.talla
            )
            # Asociación: esto establece id_producto en Ropa igual al de Producto
            db_producto.ropa_detalle = db_ropa
            
        elif producto_data.tipo_producto == "calzado" and isinstance(detalles, CalzadoDetalles):
            db_calzado = Calzado(
                talla_numerica=detalles.talla_numerica,
                material_suela=detalles.material_suela
            )
            db_producto.calzado_detalle = db_calzado
            
        elif producto_data.tipo_producto == "accesorios" and isinstance(detalles, AccesoriosDetalles):
            db_accesorios = Accesorios(
                material=detalles.material,
                dimensiones=detalles.dimensiones
            )
            db_producto.accesorios_detalle = db_accesorios
        else:
            raise ValueError(f"Tipo de producto '{producto_data.tipo_producto}' o detalles no válidos.")

        db.add(db_producto)
        db.commit()
        db.refresh(db_producto)
        
        # Para retornar el esquema correcto, necesitamos popular los campos dinámicos
        return _enrich_producto(db_producto)

    except Exception as e:
        db.rollback()
        print(f"Error al crear producto: {e}")
        return None

# --- Funciones CRUD para Productos ---

def _enrich_producto(db_producto: Producto):
    """
    Helper para añadir 'tipo_producto' y 'detalles_subtipo' al objeto 
    antes de pasarlo a Pydantic (ya que Pydantic from_attributes los buscará).
    """
    if not db_producto:
        return None
        
    # Detectamos el tipo basado en qué relación secundaria existe
    if db_producto.ropa_detalle:
        db_producto.tipo_producto = "ropa"
        db_producto.detalles_subtipo = RopaDetalles.model_validate(db_producto.ropa_detalle)
    elif db_producto.calzado_detalle:
        db_producto.tipo_producto = "calzado"
        db_producto.detalles_subtipo = CalzadoDetalles.model_validate(db_producto.calzado_detalle)
    elif db_producto.accesorios_detalle:
        db_producto.tipo_producto = "accesorios"
        db_producto.detalles_subtipo = AccesoriosDetalles.model_validate(db_producto.accesorios_detalle)
    else:
        db_producto.tipo_producto = "desconocido"
        db_producto.detalles_subtipo = None
    
    return db_producto

# LEER (Read): Obtener todos los productos
def get_all_productos(db: Session):
    """Obtiene todos los productos de la tabla 'producto', determinando su tipo."""
    productos = db.query(Producto).filter(Producto.esta_activo == True).order_by(Producto.nombre).all()
    # Enriquecer cada uno
    # Nota: Esto podría optimizarse con joinedload, pero para simplicidad lo hacemos así,
    # el Lazy Loading de SQLAlchemy traerá los detalles cuando se accedan en _enrich_producto.
    return [_enrich_producto(p) for p in productos]

# LEER (Read): Obtener un solo producto por ID
def get_producto_by_id(db: Session, producto_id: int):
    """Obtiene un producto por su ID, con detalles."""
    producto = db.query(Producto).filter(Producto.id_producto == producto_id, Producto.esta_activo == True).first()
    return _enrich_producto(producto)

# ACTUALIZAR (Update)
def update_producto(db: Session, producto_id: int, producto_update: ProductoUpdateConSubtipo):
    """Actualiza producto y subtipo."""
    db_producto = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if not db_producto:
        return None

    # 1. Actualizar base
    base_data = producto_update.model_dump(
        exclude_unset=True, 
        exclude={"tipo_producto", "detalles_subtipo"}
    )
    for key, value in base_data.items():
        setattr(db_producto, key, value)

    # 2. Actualizar subtipo
    if producto_update.detalles_subtipo:
        subtipo_data = producto_update.detalles_subtipo.model_dump(exclude_unset=True)
        
        # Identificar qué relacion usar
        modelo_subtipo = None
        if producto_update.tipo_producto == "ropa":
             if not db_producto.ropa_detalle: # Si no existía (raro), crearlo? No debería pasar si la DB es consistente.
                  pass 
             modelo_subtipo = db_producto.ropa_detalle
        elif producto_update.tipo_producto == "calzado":
             modelo_subtipo = db_producto.calzado_detalle
        elif producto_update.tipo_producto == "accesorios":
             modelo_subtipo = db_producto.accesorios_detalle
        
        if modelo_subtipo:
            for key, value in subtipo_data.items():
                setattr(modelo_subtipo, key, value)
    
    try:
        db.commit()
        db.refresh(db_producto)
        return _enrich_producto(db_producto)
    except Exception as e:
        db.rollback()
        print(f"Error al actualizar producto: {e}")
        return None

# ELIMINAR (Delete): Borrar un producto existente
def delete_producto(db: Session, producto_id: int):
    """Desactiva un producto (borrado lógico)."""
    db_producto = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if not db_producto:
        return 0
    
    try:
        db_producto.esta_activo = False
        db.commit()
        return 1
    except Exception as e:
        db.rollback()
        print(f"Error SQL al desactivar producto {producto_id}: {e}")
        return -1