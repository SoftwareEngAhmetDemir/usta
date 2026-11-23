from typing import Annotated

from fastapi import APIRouter
from pydantic import BaseModel, Field, StringConstraints

from app.auth.deps import CurrentUser
from app.core.languages import lang_dir
from app.core.schemas import Dir
from app.deps import CtxDep, SessionDep
from app.translations.service import ui_texts

router = APIRouter(tags=["translations"])

UiText = Annotated[str, StringConstraints(max_length=500)]


class UiTextsIn(BaseModel):
    texts: list[UiText] = Field(max_length=500)  # the Turkish UI texts a page shows


class UiTextsOut(BaseModel):
    language: str  # the user's site language these are in
    dir: Dir
    texts: dict[str, str]  # Turkish text → translation; a missing one stays Turkish


@router.post("/ui-texts", response_model=UiTextsOut)
async def translate_ui(body: UiTextsIn, user: CurrentUser, db: SessionDep, ctx: CtxDep) -> UiTextsOut:
    """The UI (buttons, menus, messages) in the user's site language, machine-translated once and stored."""
    texts = await ui_texts(db, ctx.ai.translator, body.texts, user.language)
    return UiTextsOut(language=user.language, dir=lang_dir(user.language), texts=texts)
