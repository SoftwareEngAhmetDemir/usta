from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Translation(Base):
    """A stored AI translation, so pages never call the AI while rendering. Key: sha256(source lang + text)."""

    __tablename__ = "translations"

    source_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    target_lang: Mapped[str] = mapped_column(String(8), primary_key=True)
    text: Mapped[str] = mapped_column(Text)
