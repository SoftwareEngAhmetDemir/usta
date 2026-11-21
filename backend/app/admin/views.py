"""SQLAdmin at /admin (KAN-41): the patron creates machines, assigns ustas, sets roles and authorization
documents, and cleans up content. Only patrons get in; the app's session cookie is reused."""

import secrets
import shutil
from pathlib import Path

from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.applications import Starlette
from starlette.datastructures import UploadFile
from starlette.requests import Request
from wtforms import FileField

from app.auth import service as auth_service
from app.auth.deps import SESSION_COOKIE
from app.auth.models import Role, User
from app.auth.schemas import normalize_login
from app.core import storage
from app.documents.models import Document
from app.machines.models import ExternalVideo, Machine
from app.machines.service import embed_url
from app.maintenance.models import MaintenanceRecord
from app.questions.models import Question
from app.videos.models import Video
from app.videos.pipeline import video_dir


class PatronOnly(AuthenticationBackend):
    def __init__(self, secret_key: str, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        super().__init__(secret_key=secret_key)
        self._sessionmaker = sessionmaker

    async def login(self, request: Request) -> bool:
        form = await request.form()
        login, password = str(form.get("username") or ""), str(form.get("password") or "")
        async with self._sessionmaker() as db:
            user = await auth_service.authenticate(db, normalize_login(login), password)
            if user is None or user.role != Role.patron:
                return False
            request.session[SESSION_COOKIE] = await auth_service.start_session(db, user)
        return True

    async def logout(self, request: Request) -> bool:
        token = request.session.pop(SESSION_COOKIE, None)
        if isinstance(token, str):
            async with self._sessionmaker() as db:
                await auth_service.end_session(db, token)
        return True

    async def authenticate(self, request: Request) -> bool:
        """A patron logged into the app gets straight in; otherwise SQLAdmin shows its login form."""
        token = request.cookies.get(SESSION_COOKIE) or request.session.get(SESSION_COOKIE)
        if not isinstance(token, str):
            return False
        async with self._sessionmaker() as db:
            user = await auth_service.user_for_token(db, token)
        return user is not None and user.role == Role.patron


def _take_upload(data: dict[str, object], key: str, folder: str) -> None:
    """Turn the uploaded file in form field `key` into a stored path; no file chosen keeps the current one."""
    file = data.get(key)
    if isinstance(file, UploadFile) and storage.has_content(file):
        ext = Path(file.filename or "").suffix.lower()[:6]
        data[key] = storage.save_upload(file, folder, f"{secrets.token_hex(8)}{ext}")
    else:
        data.pop(key, None)


class MachineAdmin(ModelView, model=Machine):
    name, name_plural, icon = "Makine", "Makineler", "fa-solid fa-gears"
    column_list = [Machine.id, Machine.code, Machine.name, Machine.location, Machine.ustas]
    column_searchable_list = [Machine.code, Machine.name, Machine.serial, Machine.location]
    form_columns = [
        Machine.code, Machine.name, Machine.type, Machine.model, Machine.serial, Machine.location, Machine.photo,
        Machine.ustas, Machine.archived_at,
    ]  # fmt: skip
    form_overrides = {"photo": FileField}
    column_labels = {
        "code": "Kod", "name": "Ad", "type": "Tür", "model": "Model", "serial": "Seri no", "location": "Konum",
        "photo": "Fotoğraf", "ustas": "Ustalar", "archived_at": "Arşivlendi (silerek geri alın)",
    }  # fmt: skip

    async def on_model_change(
        self, data: dict[str, object], model: Machine, is_created: bool, request: Request
    ) -> None:
        _take_upload(data, "photo", "machines")


class UserAdmin(ModelView, model=User):
    """Accounts are created by sign-up or `python -m app.auth.cli`; here the patron sets roles and authorization."""

    name, name_plural, icon = "Kullanıcı", "Kullanıcılar", "fa-solid fa-users"
    can_create = False
    column_list = [User.id, User.name, User.login, User.role, User.authorized]
    column_searchable_list = [User.name, User.login]
    form_columns = [
        User.name, User.role, User.language, User.authorized, User.authorization_note, User.authorization_document,
    ]  # fmt: skip
    form_overrides = {"authorization_document": FileField}
    column_labels = {
        "name": "Ad", "login": "Telefon / e-posta", "role": "Rol", "language": "Dil", "authorized": "Yetkili",
        "authorization_note": "Yetki notu", "authorization_document": "Yetki belgesi",
    }  # fmt: skip

    async def on_model_change(self, data: dict[str, object], model: User, is_created: bool, request: Request) -> None:
        _take_upload(data, "authorization_document", "certs")


class ExternalVideoAdmin(ModelView, model=ExternalVideo):
    name, name_plural, icon = "Dış video", "Dış videolar", "fa-brands fa-youtube"
    column_list = [ExternalVideo.id, ExternalVideo.machine, ExternalVideo.title, ExternalVideo.source]
    form_columns = [ExternalVideo.machine, ExternalVideo.title, ExternalVideo.url, ExternalVideo.source]

    async def on_model_change(
        self, data: dict[str, object], model: ExternalVideo, is_created: bool, request: Request
    ) -> None:
        data["embed_url"] = embed_url(str(data.get("url") or ""))


def _remove_folder(rel: str) -> None:
    shutil.rmtree(storage.abs_path(rel), ignore_errors=True)


class VideoAdmin(ModelView, model=Video):
    name, name_plural, icon = "Video", "Videolar", "fa-solid fa-video"
    can_create = False
    column_list = [Video.id, Video.title, Video.machine_id, Video.status, Video.language, Video.created_at]
    form_columns = [Video.title]

    async def after_model_delete(self, model: Video, request: Request) -> None:
        _remove_folder(video_dir(model.id))


class DocumentAdmin(ModelView, model=Document):
    name, name_plural, icon = "Doküman", "Dokümanlar", "fa-solid fa-file-pdf"
    can_create = False
    column_list = [Document.id, Document.title, Document.type, Document.machine_id, Document.summary_status]
    form_columns = [Document.title, Document.type]

    async def after_model_delete(self, model: Document, request: Request) -> None:
        _remove_folder(f"docs/{model.id}")


class QuestionAdmin(ModelView, model=Question):
    name, name_plural, icon = "Soru", "Sorular", "fa-solid fa-circle-question"
    can_create = can_edit = False
    column_list = [Question.id, Question.machine, Question.text, Question.status, Question.created_at]


class MaintenanceAdmin(ModelView, model=MaintenanceRecord):
    name, name_plural, icon = "Bakım kaydı", "Bakım kayıtları", "fa-solid fa-wrench"
    can_create = False
    column_list = [MaintenanceRecord.id, MaintenanceRecord.machine, MaintenanceRecord.created_at]
    form_columns = [MaintenanceRecord.description]


def mount(app: Starlette, sessionmaker: async_sessionmaker[AsyncSession], secret_key: str) -> None:
    admin = Admin(
        app,
        session_maker=sessionmaker,
        base_url="/admin",
        title="Usta Hafızası · Yönetim",
        authentication_backend=PatronOnly(secret_key, sessionmaker),
    )
    for view in (
        MachineAdmin,
        UserAdmin,
        ExternalVideoAdmin,
        VideoAdmin,
        DocumentAdmin,
        QuestionAdmin,
        MaintenanceAdmin,
    ):
        admin.add_view(view)
