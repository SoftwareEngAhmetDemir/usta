import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import AuthSession, Role, User
from app.auth.passwords import DUMMY_HASH, hash_password, verify_password

# Login page promise: "log in once, it stays open on your phone".
SESSION_LIFETIME = timedelta(days=90)


class LoginTakenError(Exception):
    pass


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)  # MySQL DATETIME has no zone; we store UTC


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def create_user(db: AsyncSession, *, name: str, login: str, password: str, role: Role = Role.worker) -> User:
    """`login` must already be normalized (schemas.normalize_login)."""
    user = User(name=name, login=login, password_hash=hash_password(password), role=role)
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise LoginTakenError(login) from e
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, login: str, password: str) -> User | None:
    user = await db.scalar(select(User).where(User.login == login))
    if user is None:
        verify_password(password, DUMMY_HASH)
        return None
    return user if verify_password(password, user.password_hash) else None


async def start_session(db: AsyncSession, user: User) -> str:
    """Returns the raw token for the cookie."""
    token = secrets.token_urlsafe(32)
    db.add(AuthSession(token_hash=_token_hash(token), user_id=user.id, expires_at=_utcnow() + SESSION_LIFETIME))
    await db.commit()
    return token


# shortcut: expired auth_sessions rows are ignored but never deleted; add a periodic purge if the table grows large.
async def user_for_token(db: AsyncSession, token: str) -> User | None:
    row = await db.get(AuthSession, _token_hash(token))
    if row is None or row.expires_at <= _utcnow():
        return None
    return await db.get(User, row.user_id)


async def end_session(db: AsyncSession, token: str) -> None:
    await db.execute(delete(AuthSession).where(AuthSession.token_hash == _token_hash(token)))
    await db.commit()


async def set_role(db: AsyncSession, login: str, role: Role) -> User | None:
    user = await db.scalar(select(User).where(User.login == login))
    if user is None:
        return None
    user.role = role
    await db.commit()
    return user
