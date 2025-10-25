
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from app.routers import productos # Importa las rutas de productos

# Crea la aplicación FastAPI
app = FastAPI(title="API del Bazar de Ropa")

# --- Añade esta configuración de CORS ---
origins = [
    "http://localhost", 
    "http://127.0.0.1",
    "null", # Permite archivos locales
    "*" # Permite todos los orígenes (menos seguro)
    # Cuando tengas la URL de tu frontend en Render, añádela aquí
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- Fin de la configuración de CORS ---


# Incluye las rutas que definimos en productos.py
app.include_router(productos.router)

# Un endpoint de bienvenida o "health check"
@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido a la API del Bazar de Ropa. Visita /docs para ver la documentación."}