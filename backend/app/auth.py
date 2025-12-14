import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt  # <--- Usamos bcrypt directamente en lugar de passlib
from sqlalchemy.orm import Session # Changed to Session from psycopg Connection
from pydantic import BaseModel

from app.db.database import get_db

# --- Configuración de Seguridad ---
SECRET_KEY = os.getenv("SECRET_KEY", "tu_super_secreto_por_defecto_cambiame")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 

# (Eliminamos pwd_context de passlib)

# Esquema de OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# --- Schemas Pydantic para Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    rol: Optional[str] = None

# --- Funciones de Utilidad de Contraseña (CORREGIDAS) ---

def verify_password(plain_password, hashed_password):
    """Verifica si la contraseña plana coincide con el hash."""
    # bcrypt necesita bytes, no strings
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    
    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password):
    """Genera un hash bcrypt de la contraseña."""
    if isinstance(password, str):
        password = password.encode('utf-8')
    
    # Generar salt y hash
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    return hashed.decode('utf-8')

# --- Funciones de Token JWT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependencia "get_current_user" ---
# Importamos el schema de Cliente para tipado
from app.schemas import Cliente
# Importamos el CRUD para buscar al usuario en la DB
from app.crud import crud_clientes

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db) # Changed to Session
) -> Cliente:
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodifica el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub") 
        rol: str = payload.get("rol")
        
        if email is None or rol is None:
            raise credentials_exception
        
        token_data = TokenData(email=email, rol=rol)
        
    except JWTError:
        raise credentials_exception
    
    # Busca al usuario en la base de datos
    user = crud_clientes.get_cliente_by_email(db, email=token_data.email)
    # user es un objeto ORM (SQLAlchemy)
    
    if user is None:
        raise credentials_exception
        
    return Cliente.model_validate(user) # Usamos model_validate para Pydantic v2 con objeto ORM

# --- Dependencia de Roles (ADMIN) ---
async def get_current_admin_user(current_user: Cliente = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Operación no permitida. Se requiere rol de administrador."
        )
    return current_user