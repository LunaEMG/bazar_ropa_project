from fastapi import FastAPI
from app.routers import productos # Importa las rutas de productos

# Crea la aplicación FastAPI
app = FastAPI(title="API del Bazar de Ropa")

# Incluye las rutas que definimos en productos.py
app.include_router(productos.router)

# Un endpoint de bienvenida o "health check"
@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido a la API del Bazar de Ropa. Visita /docs para ver la documentación."}