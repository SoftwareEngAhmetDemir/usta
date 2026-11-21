import pytest
from pydantic import ValidationError

from app.auth.schemas import RegisterIn, normalize_login


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (" 0532 123 45 67 ", "05321234567"),
        ("(0532) 123-45.67", "05321234567"),
        ("+90 532 123 45 67", "+905321234567"),
        (" Ahmet@Firma.COM ", "ahmet@firma.com"),
    ],
)
def test_normalize_login(raw: str, expected: str) -> None:
    assert normalize_login(raw) == expected


def test_register_cleans_name_and_login() -> None:
    body = RegisterIn(name="  Yusuf   Kaya ", login="0532 123 45 67", password="12345678")
    assert body.name == "Yusuf Kaya"
    assert body.login == "05321234567"


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("name", " ", "Adınızı girin."),
        ("login", "abc", "Geçerli bir telefon numarası veya e-posta girin."),
        ("login", "a@b", "Geçerli bir telefon numarası veya e-posta girin."),
        ("password", "1234567", "Şifre en az 8 karakter olmalı."),
    ],
)
def test_register_rejects_bad_input(field: str, value: str, message: str) -> None:
    data = {"name": "Yusuf", "login": "05321234567", "password": "12345678", field: value}
    with pytest.raises(ValidationError, match=message):
        RegisterIn.model_validate(data)
