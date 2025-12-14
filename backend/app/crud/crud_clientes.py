# backend/app/crud/crud_clientes.py

# Importaciones necesarias
from sqlalchemy.orm import Session
from app.models import Cliente
from app.schemas import ClienteCreate, ClienteUpdate
from app.auth import get_password_hash

# --- Funciones CRUD para Clientes ---

# LEER (Read): Obtener todos los clientes
def get_all_clientes(db: Session):
    """Obtiene todos los registros ACTIVOS de la tabla 'cliente'."""
    return db.query(Cliente).filter(Cliente.esta_activo == True).order_by(Cliente.id_cliente).all()

# LEER (Read): Obtener un solo cliente por su ID
def get_cliente_by_id(db: Session, cliente_id: int):
    """Obtiene un cliente específico por su 'id_cliente'."""
    return db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.esta_activo == True).first()

# LEER (Read): Obtener un solo cliente por su EMAIL (para login)
def get_cliente_by_email(db: Session, email: str):
    """Obtiene un cliente específico por su 'email' (para login)."""
    # Para login necesitamos la password, que ya viene en el modelo
    return db.query(Cliente).filter(Cliente.email == email, Cliente.esta_activo == True).first()

def get_cliente_by_email_any(db: Session, email: str):
    """Obtiene un cliente por email, ignorando si está activo o no (para validación)."""
    return db.query(Cliente).filter(Cliente.email == email).first()

# CREAR (Create): Añadir un nuevo cliente
def create_cliente(db: Session, cliente: ClienteCreate):
    """Inserta un nuevo cliente en la base de datos (con contraseña hasheada)."""
    hashed_password = get_password_hash(cliente.password)
    
    db_cliente = Cliente(
        nombre=cliente.nombre,
        telefono=cliente.telefono,
        email=cliente.email,
        hashed_password=hashed_password,
        rol="cliente" # Default role
    )
    
    try:
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente) # Obtiene el ID generado
        return db_cliente
    except Exception as e:
        db.rollback()
        print(f"Error al crear cliente: {e}")
        return None

# ACTUALIZAR (Update): Modificar un cliente existente
def update_cliente(db: Session, cliente_id: int, cliente_update: ClienteUpdate):
    """Actualiza los datos de un cliente existente."""
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

# ELIMINAR (Delete): Borrar un cliente existente (SIN CAMBIOS)
def delete_cliente(db: Session, cliente_id: int):
    """Desactiva un cliente (borrado lógico)."""
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
