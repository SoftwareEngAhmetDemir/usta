"""Text out of machine documents, keeping structure: page numbers, headings, and tables as markdown rows (so a part
number stays next to its value). PDF (scanned pages via OCR), DOCX, XLSX, CSV, TXT, photos (OCR).
Blocking: run in a thread. No LLM."""

import csv
import io
import re
import statistics
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path

import pdfplumber
from docx import Document as DocxDocument
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph
from openpyxl import load_workbook
from PIL import Image

from app.ai.ocr import ocr_image
from app.search.chunking import Block

PDF = "application/pdf"
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
CSV = "text/csv"
TXT = "text/plain"
IMAGES = {"image/jpeg", "image/png", "image/webp"}
SUPPORTED = {PDF, DOCX, XLSX, CSV, TXT, *IMAGES}
BY_EXTENSION = {".pdf": PDF, ".docx": DOCX, ".xlsx": XLSX, ".csv": CSV, ".txt": TXT, ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}  # fmt: skip


@dataclass
class Extracted:
    blocks: list[Block]
    page_count: int
    used_ocr: bool = False

    def page_texts(self) -> list[str]:
        """Plain text per page (1..page_count), headings on their own line: the stored pages and the summary input."""
        pages: list[list[str]] = [[] for _ in range(self.page_count)]
        last: list[str] = [""] * self.page_count
        for b in self.blocks:
            i = min(max(b.page, 1), self.page_count) - 1
            if b.heading and b.heading != last[i]:
                pages[i].append(b.heading)
                last[i] = b.heading
            pages[i].append(b.text)
        return ["\n".join(p) for p in pages]


def markdown_table(rows: Sequence[Sequence[str | None]]) -> str:
    """Rows → a markdown table (first row = header); empty rows dropped, "|" in cells escaped."""
    cells = [[" ".join((c or "").split()).replace("|", "/") for c in row] for row in rows]
    cells = [r for r in cells if any(r)]
    if not cells:
        return ""
    width = max(len(r) for r in cells)
    cells = [r + [""] * (width - len(r)) for r in cells]
    lines = ["| " + " | ".join(cells[0]) + " |", "|" + "---|" * width]
    return "\n".join(lines + ["| " + " | ".join(r) + " |" for r in cells[1:]])


def _looks_like_heading(line: str) -> bool:
    words = line.split()
    return (
        0 < len(words) <= 10
        and len(line) <= 80
        and not line.rstrip().endswith((".", ",", ";"))
        and (line.isupper() or bool(re.match(r"^(\d+(\.\d+)*[.),]?\s+)\S", line)) or line.endswith(":"))
    )


def _text_blocks(page: int, text: str, heading: str) -> tuple[list[Block], str]:
    """Plain text → blocks, treating short title-like lines as headings. Returns the last heading."""
    blocks: list[Block] = []
    para: list[str] = []
    for line in [*text.splitlines(), ""]:
        line = line.strip()
        if not line or _looks_like_heading(line):
            if para:
                blocks.append(Block(page, heading, " ".join(para)))
                para = []
            if line:
                heading = line.rstrip(":")
            continue
        para.append(line)
    return blocks, heading


# ---- PDF ----


def _pdf(path: Path, languages: str, tessdata: Path | None) -> Extracted:
    blocks: list[Block] = []
    heading, used_ocr = "", False
    with pdfplumber.open(path) as pdf:
        for number, page in enumerate(pdf.pages, start=1):
            if len(page.chars) < 20:  # no text layer: a scanned page
                image = page.to_image(resolution=200).original
                page_blocks, heading = _text_blocks(number, ocr_image(image, languages, tessdata), heading)
                blocks += page_blocks
                used_ocr = True
                continue
            tables = page.find_tables()
            boxes = [t.bbox for t in tables]
            outside = page.filter(_outside_of(boxes))
            sizes = [c["size"] for c in page.chars]
            body = statistics.median(sizes) if sizes else 0
            lines = outside.extract_text_lines(keep_blank_chars=False)
            para: list[str] = []
            for line in lines:
                text = line["text"].strip()
                size = statistics.mean(c["size"] for c in line["chars"]) if line["chars"] else body
                if text and (size >= body * 1.15 or _looks_like_heading(text)):
                    if para:
                        blocks.append(Block(number, heading, " ".join(para)))
                        para = []
                    heading = text.rstrip(":")
                elif text:
                    para.append(text)
                    if text.endswith((".", "!", "?", ":")) and len(" ".join(para)) > 400:
                        blocks.append(Block(number, heading, " ".join(para)))
                        para = []
            if para:
                blocks.append(Block(number, heading, " ".join(para)))
            for t in tables:
                if table := markdown_table(t.extract()):
                    blocks.append(Block(number, heading, table, is_table=True))
        return Extracted(blocks, len(pdf.pages), used_ocr)


def _outside_of(boxes: list[tuple[float, float, float, float]]) -> Callable[[dict[str, object]], bool]:
    """pdfplumber filter: keep page objects that are not inside any table (tables are extracted separately)."""

    def keep(obj: dict[str, object]) -> bool:
        return not any(_inside(obj, b) for b in boxes)

    return keep


def _inside(obj: dict[str, object], bbox: tuple[float, float, float, float]) -> bool:
    x0, top, x1, bottom = bbox
    ox0, otop, ox1, obottom = (float(str(obj.get(k, 0))) for k in ("x0", "top", "x1", "bottom"))
    return ox0 >= x0 - 1 and ox1 <= x1 + 1 and otop >= top - 1 and obottom <= bottom + 1


# ---- office, text, images ----


def _docx(path: Path) -> Extracted:
    doc = DocxDocument(str(path))
    blocks: list[Block] = []
    heading = ""
    for item in doc.iter_inner_content():
        if isinstance(item, Paragraph):
            text = " ".join(item.text.split())
            style = (item.style.name if item.style is not None else "") or ""
            if text and (style.lower().startswith(("heading", "başlık", "title")) or _looks_like_heading(text)):
                heading = text
            elif text:
                blocks.append(Block(1, heading, text))
        elif isinstance(item, DocxTable) and (
            table := markdown_table([[c.text for c in row.cells] for row in item.rows])
        ):
            blocks.append(Block(1, heading, table, is_table=True))
    return Extracted(blocks, 1)


def _xlsx(path: Path) -> Extracted:
    wb = load_workbook(str(path), read_only=True, data_only=True)
    blocks = []
    for number, sheet in enumerate(wb.worksheets, start=1):
        rows = [["" if v is None else str(v) for v in row] for row in sheet.iter_rows(values_only=True)]
        if table := markdown_table(rows):
            blocks.append(Block(number, sheet.title, table, is_table=True))
    count = len(wb.worksheets)
    wb.close()
    return Extracted(blocks, max(count, 1))


def _decode(data: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1254", "latin-1"):  # cp1254: Turkish Windows files
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def _csv(path: Path) -> Extracted:
    text = _decode(path.read_bytes())
    try:
        dialect: type[csv.Dialect] | csv.Dialect = csv.Sniffer().sniff(text[:4096], delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    table = markdown_table(list(csv.reader(io.StringIO(text), dialect)))
    return Extracted([Block(1, "", table, is_table=True)] if table else [], 1)


def _txt(path: Path) -> Extracted:
    blocks, _ = _text_blocks(1, _decode(path.read_bytes()), "")
    return Extracted(blocks, 1)


def _image(path: Path, languages: str, tessdata: Path | None) -> Extracted:
    with Image.open(path) as img:
        text = ocr_image(img.convert("RGB"), languages, tessdata)
    blocks, _ = _text_blocks(1, text, "")
    return Extracted(blocks, 1, used_ocr=True)


def extract(path: Path, mime_type: str, languages: str, tessdata: Path | None) -> Extracted:
    if mime_type == PDF:
        return _pdf(path, languages, tessdata)
    if mime_type == DOCX:
        return _docx(path)
    if mime_type == XLSX:
        return _xlsx(path)
    if mime_type == CSV:
        return _csv(path)
    if mime_type == TXT:
        return _txt(path)
    if mime_type in IMAGES:
        return _image(path, languages, tessdata)
    raise ValueError(f"unsupported document type {mime_type}")
