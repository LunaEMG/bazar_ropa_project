# backend/app/crud/crud_clientes.py

from sqlalchemy.orm import Session
from app.models import Cliente
from app.schemas import ClienteCreate, ClienteUpdate
from app.auth import get_password_hash

def get_all_clientes(db: Session):
    """Retorna todos los clientes activos ordenados por ID."""
    return db.query(Cliente).filter(Cliente.esta_activo == True).order_by(Cliente.id_cliente).all()

def get_cliente_by_id(db: Session, cliente_id: int):
    """Obtiene un cliente específico por su 'id_cliente'."""
    return db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.esta_activo == True).first()

def get_cliente_by_email(db: Session, email: str):
    """Busca un cliente activo por email."""
    return db.query(Cliente).filter(Cliente.email == email, Cliente.esta_activo == True).first()

def get_cliente_by_email_any(db: Session, email: str):
    """Busca un cliente por email, independientemente de su estado activo."""
    return db.query(Cliente).filter(Cliente.email == email).first()

def create_cliente(db: Session, cliente: ClienteCreate):
    hashed_password = get_password_hash(cliente.password)
    
    db_cliente = Cliente(
        nombre=cliente.nombre,
        telefono=cliente.telefono,
        email=cliente.email,
        hashed_password=hashed_password,
        rol="cliente" 
    )
    
    try:
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente) 
        return db_cliente
    except Exception as e:
        db.rollback()
        print(f"Error al crear cliente: {e}")
        return None

def update_cliente(db: Session, cliente_id: int, cliente_update: ClienteUpdate):
    db_cliente = get_cliente_by_id(db, cliente_id)
    if not db_cliente:
        return None

    update_data = cliente_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_cliente, key, value)
    
    try:
        db.commit()
        db.refresh(db_cliente)
        return db_cliente
    except Exception as e:
        db.rollback()
        print(f"Error al actualizar cliente {cliente_id}: {e}")
        return None

def delete_cliente(db: Session, cliente_id: int):
    """Realiza un borrado lógico (desactivación) de un cliente."""
    db_cliente = get_cliente_by_id(db, cliente_id)
    if not db_cliente:
        return 0
    
    try:
        db_cliente.esta_activo = False
        db.commit()
        return 1
    except Exception as e:
        db.rollback()
        print(f"Error SQL al desactivar cliente {cliente_id}: {e}")
        return -1
