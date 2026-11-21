from datetime import UTC, datetime, timedelta

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service
from app.auth.deps import SESSION_COOKIE
from app.auth.models import AuthSession, Role, User

NEW = {"name": "Yusuf Kaya", "login": "0532 123 45 67", "password": "gizli-sifre"}


async def test_register_creates_a_worker_and_logs_in(client: AsyncClient, db: AsyncSession) -> None:
    res = await client.post("/api/auth/register", json=NEW)
    assert res.status_code == 201
    me = res.json()
    assert me == {
        "id": me["id"],
        "name": "Yusuf Kaya",
        "role": "worker",
        "language": "tr",
        "authorized": False,
        "authorization_note": None,
    }
    cookie = res.headers["set-cookie"]
    assert f"{SESSION_COOKIE}=" in cookie and "HttpOnly" in cookie and "SameSite=lax" in cookie
    assert (await client.get("/api/auth/me")).json()["id"] == me["id"]
    user = await db.scalar(select(User).where(User.login == "05321234567"))
    assert user is not None and user.password_hash != NEW["password"]


async def test_register_as_usta(client: AsyncClient) -> None:
    res = await client.post("/api/auth/register", json={**NEW, "role": "usta"})
    assert res.status_code == 201
    assert res.json()["role"] == "usta"
    assert (await client.get("/api/auth/me")).json()["role"] == "usta"


async def test_register_cannot_pick_technician_or_patron(client: AsyncClient, db: AsyncSession) -> None:
    for role in ("technician", "patron", "admin"):
        res = await client.post("/api/auth/register", json={**NEW, "role": role})
        assert res.status_code == 422
        assert res.json() == {"detail": "Kayıtta yalnızca İşçi veya Usta seçilebilir."}
    assert (await db.scalar(select(User))) is None


async def test_register_twice_with_same_login_is_409(client: AsyncClient) -> None:
    await client.post("/api/auth/register", json=NEW)
    res = await client.post("/api/auth/register", json={**NEW, "login": "05321234567"})
    assert res.status_code == 409
    assert res.json() == {"detail": "Bu telefon/e-posta ile zaten bir hesap var."}


async def test_register_validation_error_is_a_turkish_detail(client: AsyncClient) -> None:
    res = await client.post("/api/auth/register", json={**NEW, "password": "kisa"})
    assert res.status_code == 422
    assert res.json() == {"detail": "Şifre en az 8 karakter olmalı."}


async def test_login_with_differently_written_phone(client: AsyncClient, db: AsyncSession) -> None:
    await service.create_user(db, name="Usta Ali", login="05321234567", password="gizli-sifre", role=Role.usta)
    res = await client.post("/api/auth/login", json={"login": "0532-123 45 67", "password": "gizli-sifre"})
    assert res.status_code == 200
    assert res.json()["role"] == "usta"
    assert (await client.get("/api/auth/me")).status_code == 200


async def test_login_wrong_password_or_unknown_login_is_401(client: AsyncClient, db: AsyncSession) -> None:
    await service.create_user(db, name="Ali", login="ali@firma.com", password="gizli-sifre")
    for body in ({"login": "ali@firma.com", "password": "yanlis"}, {"login": "yok@firma.com", "password": "x"}):
        res = await client.post("/api/auth/login", json=body)
        assert res.status_code == 401
        assert res.json() == {"detail": "Telefon/e-posta veya şifre hatalı."}
        assert "set-cookie" not in res.headers


async def test_me_without_session_is_401(client: AsyncClient) -> None:
    res = await client.get("/api/auth/me")
    assert res.status_code == 401
    assert res.json() == {"detail": "Giriş gerekli."}
    client.cookies.set(SESSION_COOKIE, "made-up-token")
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_logout_ends_the_session_on_the_server(client: AsyncClient, db: AsyncSession) -> None:
    await client.post("/api/auth/register", json=NEW)
    token = client.cookies[SESSION_COOKIE]
    res = await client.post("/api/auth/logout")
    assert res.status_code == 204
    assert (await db.scalar(select(AuthSession))) is None
    client.cookies.set(SESSION_COOKIE, token)  # a copied cookie no longer works either
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_expired_session_is_rejected(client: AsyncClient, db: AsyncSession) -> None:
    await client.post("/api/auth/register", json=NEW)
    row = await db.scalar(select(AuthSession))
    assert row is not None
    row.expires_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(minutes=1)  # DATETIME keeps whole seconds
    await db.commit()
    assert (await client.get("/api/auth/me")).status_code == 401
