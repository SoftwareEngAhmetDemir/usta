"""Tesseract OCR for photos of documents and scanned PDF pages (needs the tesseract binary)."""

from pathlib import Path

import pytesseract
from PIL import Image


class OCRError(Exception):
    pass


def ocr_image(image: Image.Image, languages: str, tessdata_dir: Path | None) -> str:
    config = f'--tessdata-dir "{tessdata_dir}"' if tessdata_dir else ""
    try:
        return str(pytesseract.image_to_string(image, lang=languages, config=config))
    except (pytesseract.TesseractError, pytesseract.TesseractNotFoundError) as e:
        raise OCRError(f"Metin okunamadı (OCR): {e}") from e
