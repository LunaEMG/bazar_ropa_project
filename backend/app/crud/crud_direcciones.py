# backend/app/crud/crud_direcciones.py

# Importaciones necesarias
from sqlalchemy.orm import Session
from app.models import Direccion
from app.schemas import DireccionCreate, DireccionUpdate

# --- Funciones CRUD para Direcciones ---

def create_direccion_for_cliente(db: Session, cliente_id: int, direccion: DireccionCreate):
    """Inserta una nueva dirección asociada a un cliente específico."""
    db_direccion = Direccion(
        **direccion.model_dump(),
        id_cliente=cliente_id
    )
    
    try:
        db.add(db_direccion)
        db.commit()
        db.refresh(db_direccion)
        return db_direccion
    except Exception as e:
        db.rollback()
        print(f"Error al crear dirección para cliente {cliente_id}: {e}")
        return None

def get_direcciones_by_cliente(db: Session, cliente_id: int):
    """Obtiene todas las direcciones asociadas a un cliente específico."""
    return db.query(Direccion).filter(Direccion.id_cliente == cliente_id).order_by(Direccion.id_direccion).all()

def get_direccion_by_id(db: Session, direccion_id: int):
    """Obtiene una dirección específica por su 'id_direccion'."""
    return db.query(Direccion).filter(Direccion.id_direccion == direccion_id).first()

def update_direccion(db: Session, cliente_id: int, direccion_id: int, direccion_update: DireccionUpdate):
    """Actualiza una dirección específica perteneciente a un cliente."""
    # Verificamos que sea del cliente
    db_direccion = db.query(Direccion).filter(Direccion.id_direccion == direccion_id, Direccion.id_cliente == cliente_id).first()
    
    if not db_direccion:
        return None
        
    update_data = direccion_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_direccion, key, value)
        
    try:
        db.commit()
        db.refresh(db_direccion)
        return db_direccion
    except Exception as e:
        db.rollback()
        print(f"Error al actualizar dirección {direccion_id}: {e}")
        return None

def delete_direccion(db: Session, cliente_id: int, direccion_id: int):
    """Elimina una dirección específica perteneciente a un cliente."""
    db_direccion = db.query(Direccion).filter(Direccion.id_direccion == direccion_id, Direccion.id_cliente == cliente_id).first()
    
    if not db_direccion:
        return False
        
    try:
        db.delete(db_direccion)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error al eliminar dirección {direccion_id}: {e}")
        return False
