import re
from typing import Annotated

from pydantic import AfterValidator, BaseModel, BeforeValidator, ConfigDict, Field

from app.auth.models import Role

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_PHONE = re.compile(r"^\+?\d{7,15}$")


def normalize_login(value: str) -> str:
    """E-mail → lower case; phone → digits (and a leading +) only, so '0532 123 45 67' == '05321234567'."""
    value = value.strip()
    if "@" in value:
        return value.lower()
    return re.sub(r"[\s\-().]", "", value)


def _valid_login(value: str) -> str:
    value = normalize_login(value)
    if not (_EMAIL.match(value) if "@" in value else _PHONE.match(value)):
        raise ValueError("Geçerli bir telefon numarası veya e-posta girin.")
    return value


def _valid_name(value: str) -> str:
    value = " ".join(value.split())
    if len(value) < 2:
        raise ValueError("Adınızı girin.")
    return value


def _valid_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Şifre en az 8 karakter olmalı.")
    return value


# Roles anyone may pick at sign-up. Teknisyen and Patron are given only by the patron (cli set-role, SQLAdmin later).
SELF_SERVICE_ROLES = frozenset({Role.worker, Role.usta})


def _self_service_role(value: object) -> object:
    if value not in SELF_SERVICE_ROLES:
        raise ValueError("Kayıtta yalnızca İşçi veya Usta seçilebilir.")
    return value


class LoginIn(BaseModel):
    login: Annotated[str, Field(max_length=255), AfterValidator(normalize_login)]
    password: Annotated[str, Field(max_length=128)]


class RegisterIn(BaseModel):
    name: Annotated[str, Field(max_length=100), AfterValidator(_valid_name)]
    login: Annotated[str, Field(max_length=255), AfterValidator(_valid_login)]
    password: Annotated[str, Field(max_length=128), AfterValidator(_valid_password)]
    role: Annotated[Role, BeforeValidator(_self_service_role)] = Role.worker


class Me(BaseModel):
    """Mirrors `Me` in frontend/src/api/types.ts."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: Role
    language: str
    authorized: bool
    authorization_note: str | None
