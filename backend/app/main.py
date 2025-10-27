# Importaciones principales de FastAPI y middleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

# Importación de los módulos de routers para las diferentes entidades
# Se incluye el nuevo router 'direcciones'
from app.routers import productos, clientes, ventas, proveedores, direcciones 

# Inicialización de la aplicación FastAPI
app = FastAPI(title="API del Bazar de Ropa", version="0.1.0")

# --- Configuración de CORS ---
# Define los orígenes permitidos para las peticiones cross-origin.
origins = [
    # URL del frontend desplegado en Render
    "https://bazar-ropa-project-web.onrender.com", 
    # Orígenes para desarrollo local
    "http://localhost", 
    "http://127.0.0.1",
    "null", # Permite peticiones desde 'file:///'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Orígenes permitidos
    allow_credentials=True,    # Soporte para credenciales (cookies, etc.)
    allow_methods=["*"],       # Métodos HTTP permitidos
    allow_headers=["*"],       # Cabeceras HTTP permitidas
)

# --- Inclusión de Routers ---
# Registra los endpoints definidos en cada módulo router.
app.include_router(productos.router)
app.include_router(clientes.router) 
app.include_router(ventas.router) 
app.include_router(proveedores.router) 
app.include_router(direcciones.router) # <-- Se añade el router de direcciones

# --- Endpoint Raíz ---
@app.get("/", tags=["Root"]) 
def read_root():
    """
    Endpoint raíz de la API. Proporciona un mensaje de bienvenida
    e indica la ruta a la documentación interactiva.
    """
    return {"mensaje": "Bienvenido a la API del Bazar de Ropa. Visita /docs para la documentación."}