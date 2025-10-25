# Importaciones principales de FastAPI y middleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

# Importación de los módulos de routers
# Ahora incluimos productos, clientes y el nuevo router de ventas
from app.routers import productos, clientes, ventas 

# Inicialización de la aplicación FastAPI
app = FastAPI(title="API del Bazar de Ropa", version="0.1.0")

# --- Configuración de CORS ---
# Define los orígenes permitidos
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
    allow_origins=origins,
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- Inclusión de Routers ---
# Registra los endpoints definidos en los módulos de routers
app.include_router(productos.router)
app.include_router(clientes.router) 
app.include_router(ventas.router) # <-- Añade esta línea para activar las rutas de ventas

# --- Endpoint Raíz ---
@app.get("/", tags=["Root"]) 
def read_root():
    """
    Endpoint raíz de bienvenida.
    """
    return {"mensaje": "Bienvenido a la API del Bazar de Ropa. Visita /docs para la documentación."}