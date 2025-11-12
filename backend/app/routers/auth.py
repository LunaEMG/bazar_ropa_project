

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from psycopg import Connection
from datetime import timedelta

from app.db.database import get_db
from app.crud import crud_clientes
from app.schemas import Cliente, ClienteCreate, Token
from app.auth import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.post(
    "/api/auth/token", 
    response_model=Token,
    tags=["Autenticación"]
)
async def login_for_access_token(
    db: Connection = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Endpoint de Login. Recibe email (en 'username') y contraseña.
    """
    user = crud_clientes.get_cliente_by_email(db, email=form_data.username)
    
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Crea el token con el email (sub) y el rol
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email'], "rol": user['rol']}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post(
    "/api/auth/register", 
    response_model=Cliente, 
    status_code=status.HTTP_201_CREATED,
    tags=["Autenticación"]
)
def register_new_user(
    cliente: ClienteCreate, 
    db: Connection = Depends(get_db)
):
    """
    Endpoint de Registro.
    """
    db_user = crud_clientes.get_cliente_by_email(db, email=cliente.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado."
        )
    
    new_user = crud_clientes.create_cliente(db=db, cliente=cliente)
    if new_user is None:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error al crear el usuario."
        )
    return new_user