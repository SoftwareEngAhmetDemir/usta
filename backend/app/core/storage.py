"""Files live under settings.uploads_path; MySQL stores paths relative to it. Served at /uploads/<path>."""

import re
import shutil
from pathlib import Path

from fastapi import HTTPException, status
from starlette.datastructures import UploadFile  # FastAPI's UploadFile is a subclass

from app.config import get_settings

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def root() -> Path:
    return get_settings().uploads_path


def abs_path(rel: str) -> Path:
    """Absolute path of a stored file; refuses anything that escapes the uploads folder."""
    base = root()
    path = (base / rel).resolve()
    if not path.is_relative_to(base):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dosya bulunamadı.")
    return path


def url(rel: str | None) -> str | None:
    return f"/uploads/{rel}" if rel else None


def safe_name(filename: str | None, fallback: str = "file") -> str:
    name = _SAFE.sub("_", Path(filename or "").name).strip("._")
    return name[-120:] or fallback


def save_upload(file: UploadFile, rel_dir: str, name: str | None = None) -> str:
    """Copy an upload to <uploads>/<rel_dir>/<name>; returns the relative path. Enforces max_upload_mb."""
    limit = get_settings().max_upload_mb * 1024 * 1024
    if file.size is not None and file.size > limit:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, f"Dosya en fazla {limit // (1024 * 1024)} MB olabilir.")
    rel = f"{rel_dir}/{name or safe_name(file.filename)}"
    dest = abs_path(rel)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out, length=1024 * 1024)
    return rel


def has_content(file: UploadFile | None) -> bool:
    """Browsers send an empty part for an untouched <input type=file>."""
    return file is not None and bool(file.filename) and file.size != 0
