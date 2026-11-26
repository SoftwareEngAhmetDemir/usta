from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from pydantic import BaseModel

from app.auth import service
from app.auth.deps import SESSION_COOKIE, CurrentUser
from app.auth.models import User
from app.auth.schemas import LoginIn, Me, RegisterIn
from app.core.languages import LANGUAGES, Language
from app.deps import CtxDep, SessionDep
from app.translations.service import change_language

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_cookie(response: Response, token: str) -> None:
    # httpOnly: JS can't read it. Not `secure`: the app is served over plain http on localhost (Vite proxy).
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=int(service.SESSION_LIFETIME.total_seconds()),
        httponly=True,
        samesite="lax",
        path="/",
    )


async def _log_in(db: SessionDep, response: Response, user: User) -> Me:
    _set_cookie(response, await service.start_session(db, user))
    return Me.model_validate(user)


@router.post("/register", response_model=Me, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, response: Response, db: SessionDep) -> Me:
    """Self sign-up as İşçi or Usta (schemas.SELF_SERVICE_ROLES); Teknisyen/Patron only via the patron."""
    try:
        user = await service.create_user(db, name=body.name, login=body.login, password=body.password, role=body.role)
    except service.LoginTakenError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu telefon/e-posta ile zaten bir hesap var.") from None
    return await _log_in(db, response, user)


@router.post("/login", response_model=Me)
async def login(body: LoginIn, response: Response, db: SessionDep) -> Me:
    user = await service.authenticate(db, body.login, body.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Telefon/e-posta veya şifre hatalı.")
    return await _log_in(db, response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response, db: SessionDep, usta_session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None
) -> None:
    if usta_session:
        await service.end_session(db, usta_session)
    response.delete_cookie(SESSION_COOKIE, path="/")


@router.get("/me", response_model=Me)
async def me(user: CurrentUser) -> Me:
    return Me.model_validate(user)


me_router = APIRouter(tags=["me"])


class LanguageIn(BaseModel):
    language: str


@me_router.get("/languages", response_model=list[Language])
async def languages() -> list[Language]:
    return list(LANGUAGES.values())


@me_router.patch("/me/language", response_model=Me)
async def set_language(body: LanguageIn, user: CurrentUser, db: SessionDep, ctx: CtxDep) -> Me:
    """Content language of the machine pages (KAN-46) and of the UI (`POST /ui-texts`). Earlier questions, answers and
    summaries are translated into it in the background."""
    if body.language not in LANGUAGES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Bu dil desteklenmiyor.")
    await change_language(ctx, db, user, body.language)
    return Me.model_validate(user)
