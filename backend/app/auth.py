
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from psycopg import Connection
from pydantic import BaseModel

from app.db.database import get_db

# --- Configuración de Seguridad ---
# Carga las variables de entorno (asegúrate de tenerlas en tu .env)
# DEBERÍAS AÑADIR ESTO A TU .env (puedes generar un string aleatorio)
SECRET_KEY = os.getenv("SECRET_KEY", "tu_super_secreto_por_defecto_cambiame")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # El token durará 1 hora

# Contexto para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema de OAuth2: le dice a FastAPI que busque el token en la URL "/api/auth/token"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# --- Schemas Pydantic para Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    rol: Optional[str] = None

# --- Funciones de Utilidad de Contraseña ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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

# --- Dependencia "get_current_user" (El núcleo de la seguridad) ---

# Importamos el schema de Cliente para tipado
from app.schemas import Cliente
# Importamos el CRUD para buscar al usuario en la DB
from app.crud import crud_clientes

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Connection = Depends(get_db)
) -> Cliente:
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodifica el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub") # "sub" es el email que guardamos
        rol: str = payload.get("rol")
        
        if email is None or rol is None:
            raise credentials_exception
        
        token_data = TokenData(email=email, rol=rol)
        
    except JWTError:
        raise credentials_exception
    
    # Busca al usuario en la base de datos
    # Necesitarás crear esta función en crud_clientes.py
    user = crud_clientes.get_cliente_by_email(db, email=token_data.email)
    
    if user is None:
        raise credentials_exception
        
    # Retornamos el modelo Pydantic completo del usuario
    # (Asegúrate que tu schema Cliente incluya 'rol' y 'email')
    return Cliente(**user) # Asume que get_cliente_by_email retorna un dict

# --- Dependencia de Roles (ADMIN) ---
async def get_current_admin_user(current_user: Cliente = Depends(get_current_user)):
    """
    Dependencia que verifica si el usuario actual es un administrador.
    """
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Operación no permitida. Se requiere rol de administrador."
        )
    return current_user