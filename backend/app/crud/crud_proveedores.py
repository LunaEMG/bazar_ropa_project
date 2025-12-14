# backend/app/crud/crud_proveedores.py

# Importaciones necesarias
from sqlalchemy.orm import Session
from app.models import Proveedor
from app.schemas import ProveedorCreate, ProveedorUpdate

# --- Funciones CRUD para Proveedores ---

def get_all_proveedores(db: Session):
    """Obtiene todos los registros de la tabla 'proveedor'."""
    return db.query(Proveedor).filter(Proveedor.esta_activo == True).order_by(Proveedor.nombre).all()

def get_proveedor_by_id(db: Session, proveedor_id: int):
    """Obtiene un proveedor específico por su 'id_proveedor'."""
    return db.query(Proveedor).filter(Proveedor.id_proveedor == proveedor_id).first()

def create_proveedor(db: Session, proveedor: ProveedorCreate):
    """Inserta un nuevo proveedor en la base de datos."""
    db_proveedor = Proveedor(
        nombre=proveedor.nombre,
        telefono=proveedor.telefono
    )
    
    try:
        db.add(db_proveedor)
        db.commit()
        db.refresh(db_proveedor)
        return db_proveedor
    except Exception as e:
        db.rollback()
        print(f"Error al crear proveedor: {e}")
        return None

def update_proveedor(db: Session, proveedor_id: int, proveedor_update: ProveedorUpdate):
    """Actualiza los datos de un proveedor existente por ID."""
    db_proveedor = get_proveedor_by_id(db, proveedor_id)
    if not db_proveedor:
        return None
        
    update_data = proveedor_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_proveedor, key, value)
        
    try:
        db.commit()
        db.refresh(db_proveedor)
        return db_proveedor
    except Exception as e:
        db.rollback()
        print(f"Error al actualizar proveedor {proveedor_id}: {e}")
        return None

def delete_proveedor(db: Session, proveedor_id: int):
    """Desactiva un proveedor (borrado lógico)."""
    db_proveedor = get_proveedor_by_id(db, proveedor_id)
    if not db_proveedor:
        return 0
        
    try:
        db_proveedor.esta_activo = False
        db.commit()
        return 1
    except Exception as e:
        db.rollback()
        print(f"Error SQL al desactivar proveedor {proveedor_id}: {e}")
        return -1