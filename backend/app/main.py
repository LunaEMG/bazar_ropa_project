# Importaciones principales de FastAPI y middleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

# Importación de los módulos de routers para las diferentes entidades
from app.routers import productos, clientes 

# Inicialización de la aplicación FastAPI
app = FastAPI(title="API del Bazar de Ropa", version="0.1.0")

# --- Configuración de CORS ---
# Define los orígenes permitidos para las peticiones cross-origin.
# Es crucial para permitir que el frontend (en otro dominio/puerto) interactúe con la API.
origins = [
    # URL del frontend desplegado en Render
    "https://bazar-ropa-project-web.onrender.com", 
    
    # Orígenes para desarrollo local (pueden removerse en producción final)
    "http://localhost", 
    "http://127.0.0.1",
    "null", # Necesario para permitir peticiones desde archivos 'file:///'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Orígenes que tienen permiso
    allow_credentials=True,    # Permite cookies/credenciales (si se usaran)
    allow_methods=["*"],       # Permite todos los métodos HTTP (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],       # Permite todas las cabeceras HTTP
)

# --- Inclusión de Routers ---
# Registra los endpoints definidos en los módulos de routers.
# Cada router agrupa rutas relacionadas con una entidad (ej. productos, clientes).
app.include_router(productos.router)
app.include_router(clientes.router) 
# app.include_router(ventas.router) # Ejemplo: Añadir más routers aquí

# --- Endpoint Raíz ---
@app.get("/", tags=["Root"]) # tags agrupa endpoints en la documentación de Swagger UI
def read_root():
    """
    Endpoint raíz de bienvenida. Proporciona un mensaje simple
    e indica dónde encontrar la documentación interactiva.
    """
    return {"mensaje": "Bienvenido a la API del Bazar de Ropa. Visita /docs para la documentación."}