from fastapi import APIRouter, File, UploadFile, HTTPException
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

# Cargar variables de entorno (por si no se han cargado aún)
load_dotenv()

# Configuración de Cloudinary
# Asegúrate de tener estas variables en tu archivo .env
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

router = APIRouter(
    prefix="/api/upload",
    tags=["Uploads"]
)

@router.post("")
async def upload_image(file: UploadFile = File(...)):
    """
    Sube una imagen a Cloudinary y retorna su URL segura.
    """
    try:
        # Validar extensión
        filename = file.filename
        # Simple validación de extensión
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
             raise HTTPException(status_code=400, detail="Solo se permiten imágenes (.jpg, .png, .webp, .gif)")

        # Subir a Cloudinary
        # 'folder' organiza las imágenes en una carpeta específica en tu Cloudinary
        result = cloudinary.uploader.upload(file.file, folder="bazar_ropa_productos")
        
        # Retornar URL segura
        return {"url": result.get("secure_url")}

    except Exception as e:
        print(f"Error de Cloudinary: {e}")
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")
