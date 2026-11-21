"""QR stickers (KAN-29/30). The QR holds the machine page URL, so any phone camera opens it."""

import io
from collections.abc import Sequence
from pathlib import Path

from reportlab.graphics import renderPDF, renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas

from app.machines.models import Machine

# Helvetica has no ı/ş/ğ; use a TTF that does when the system has one.
_FONT_FILES = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def machine_url(public_url: str, machine_id: int) -> str:
    return f"{public_url.rstrip('/')}/m/{machine_id}"


def _qr(data: str, size: float) -> Drawing:
    widget = QrCodeWidget(data, barLevel="M")
    x1, y1, x2, y2 = widget.getBounds()
    drawing = Drawing(size, size, transform=[size / (x2 - x1), 0, 0, size / (y2 - y1), 0, 0])
    drawing.add(widget)
    return drawing


def svg(data: str) -> bytes:
    return str(renderSVG.drawToString(_qr(data, 240))).encode()


def _font() -> str:
    for path in _FONT_FILES:
        if Path(path).exists():
            if "StickerFont" not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont("StickerFont", path))
            return "StickerFont"
    return "Helvetica"


def sticker_sheet(machines: Sequence[Machine], public_url: str) -> bytes:
    """A4 pages of 3 x 4 stickers: QR, machine name, code (typed on the scan page if the QR is damaged)."""
    buf = io.BytesIO()
    canvas = Canvas(buf, pagesize=A4)
    canvas.setTitle("Usta Hafızası QR etiketleri")
    font = _font()
    cols, rows = 3, 4
    cell_w, cell_h = (A4[0] - 20 * mm) / cols, (A4[1] - 20 * mm) / rows
    for i, machine in enumerate(machines):
        if i and i % (cols * rows) == 0:
            canvas.showPage()
        col, row = i % cols, (i // cols) % rows
        x = 10 * mm + col * cell_w
        y = A4[1] - 10 * mm - (row + 1) * cell_h
        canvas.rect(x + 2 * mm, y + 2 * mm, cell_w - 4 * mm, cell_h - 4 * mm)
        qr_size = min(cell_w, cell_h) - 26 * mm
        renderPDF.draw(
            _qr(machine_url(public_url, machine.id), qr_size), canvas, x + (cell_w - qr_size) / 2, y + 16 * mm
        )
        canvas.setFont(font, 10)
        canvas.drawCentredString(x + cell_w / 2, y + 10 * mm, machine.name[:40])
        canvas.setFont(font, 12)
        canvas.drawCentredString(x + cell_w / 2, y + 5 * mm, machine.code)
    if not machines:
        canvas.setFont(font, 12)
        canvas.drawString(20 * mm, A4[1] - 30 * mm, "Henüz makine yok.")
    canvas.save()
    return buf.getvalue()
