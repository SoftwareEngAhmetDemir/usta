"""Small shapes shared by many features. Mirror the same names in frontend/src/api/types.ts."""

from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, PlainSerializer

Dir = Literal["ltr", "rtl"]


def utcnow() -> datetime:
    """Naive UTC: MySQL DATETIME has no zone, so every timestamp in the DB is UTC."""
    return datetime.now(UTC).replace(tzinfo=None)


# Sent as ISO 8601 with +00:00, so the browser shows it in the phone's local time.
UtcDateTime = Annotated[datetime, PlainSerializer(lambda d: d.replace(tzinfo=UTC).isoformat(), return_type=str)]


class PersonRef(BaseModel):
    id: int
    name: str


class AuthorizedPerson(PersonRef):
    authorized: bool
    authorization_document_url: str | None


class LocalizedText(BaseModel):
    """Text in a known language, so the UI can set lang/dir on it."""

    text: str
    lang: str
    dir: Dir
