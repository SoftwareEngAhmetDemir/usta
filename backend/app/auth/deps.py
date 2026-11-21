from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status

from app.auth import service
from app.auth.models import Role, User
from app.deps import SessionDep, forbidden

SESSION_COOKIE = "usta_session"


async def current_user(
    db: SessionDep, usta_session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None
) -> User:
    user = await service.user_for_token(db, usta_session) if usta_session else None
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Giriş gerekli.")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def require_role(*roles: Role) -> Callable[[User], Awaitable[User]]:
    """Dependency: the logged-in user, or 403 unless they have one of `roles`."""

    async def check(user: CurrentUser) -> User:
        if user.role not in roles:
            raise forbidden()
        return user

    return check


PatronUser = Annotated[User, Depends(require_role(Role.patron))]
