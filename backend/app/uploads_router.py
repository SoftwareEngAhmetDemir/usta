from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.auth.deps import CurrentUser
from app.core import storage
from app.deps import not_found

# Mounted at the root (not /api): Vite proxies /uploads/* here as is. Only logged-in users get files;
# <video>, <img> and the PDF viewer send the session cookie on their own.
router = APIRouter(tags=["uploads"])


@router.get("/uploads/{path:path}")
async def get_upload(path: str, _: CurrentUser) -> FileResponse:
    file = storage.abs_path(path)
    if not file.is_file():
        raise not_found("Dosya")
    return FileResponse(file)  # supports Range requests, so videos can seek
