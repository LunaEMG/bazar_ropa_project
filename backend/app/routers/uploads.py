from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil
import os
import secrets
from pathlib import Path

router = APIRouter(
    prefix="/api/upload",
    tags=["Uploads"]
)

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Validar extensión
        filename = file.filename
        extension = os.path.splitext(filename)[1].lower()
        if extension not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(status_code=400, detail="Solo se permiten imagenes (.jpg, .png, .webp)")

        # Generar nombre único
        token = secrets.token_hex(4)
        safe_filename = f"{token}_{filename.replace(' ', '_')}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Guardar archivo
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Retornar URL
        # Asumiendo que la API se sirve en root y static está montado en /static
        return {"url": f"/static/uploads/{safe_filename}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo archivo: {str(e)}")
