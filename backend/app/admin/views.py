"""SQLAdmin at /admin (KAN-41): the patron creates machines, assigns ustas, sets roles and authorization
documents, and cleans up content. Only patrons get in; the app's session cookie is reused."""

import secrets
import shutil
from pathlib import Path

from pydantic import AnyHttpUrl, TypeAdapter, ValidationError
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.applications import Starlette
from starlette.datastructures import UploadFile
from starlette.requests import Request
from wtforms import FileField, Form, PasswordField

from app.auth import service as auth_service
from app.auth.deps import SESSION_COOKIE
from app.auth.models import Role, User
from app.auth.passwords import hash_password
from app.auth.schemas import normalize_login, valid_password
from app.context import AppContext
from app.core import storage
from app.documents.models import Document
from app.machines.models import ExternalVideo, Machine
from app.machines.service import embed_url
from app.maintenance.models import MaintenanceRecord
from app.questions.models import Question
from app.search.service import Owner, delete_chunks
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


_HTTP_URL = TypeAdapter(AnyHttpUrl)


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
        Machine.qr_text, Machine.ustas, Machine.archived_at,
    ]  # fmt: skip
    form_overrides = {"photo": FileField}
    column_labels = {
        "code": "Kod", "name": "Ad", "type": "Tür", "model": "Model", "serial": "Seri no", "location": "Konum",
        "photo": "Fotoğraf", "ustas": "Ustalar", "archived_at": "Arşivlendi (silerek geri alın)",
        "qr_text": "Makinedeki hazır QR'ın metni (tarayınca bu makine açılır)",
    }  # fmt: skip

    async def on_model_change(
        self, data: dict[str, object], model: Machine, is_created: bool, request: Request
    ) -> None:
        _take_upload(data, "photo", "machines")


class UserAdmin(ModelView, model=User):
    """Accounts are created by sign-up or `python -m app.auth.cli`; here the patron sets roles and authorization,
    and resets a forgotten password (KAN-24)."""

    name, name_plural, icon = "Kullanıcı", "Kullanıcılar", "fa-solid fa-users"
    can_create = False
    column_list = [User.id, User.name, User.login, User.role, User.authorized]
    column_searchable_list = [User.name, User.login]
    column_details_exclude_list = [User.password_hash]
    form_columns = [
        User.name, User.role, User.language, User.authorized, User.authorization_note, User.authorization_document,
    ]  # fmt: skip
    form_overrides = {"authorization_document": FileField}
    column_labels = {
        "name": "Ad", "login": "Telefon / e-posta", "role": "Rol", "language": "Dil", "authorized": "Yetkili",
        "authorization_note": "Yetki notu", "authorization_document": "Yetki belgesi",
    }  # fmt: skip

    async def scaffold_form(self, rules: list[str] | None = None) -> type[Form]:
        form = await super().scaffold_form(rules)
        # Not a column: an empty field keeps the current password (the stored hash is never shown).
        form.new_password = PasswordField("Yeni şifre (boş bırakılırsa değişmez)", render_kw={"class": "form-control"})
        return form

    async def on_model_change(self, data: dict[str, object], model: User, is_created: bool, request: Request) -> None:
        _take_upload(data, "authorization_document", "certs")
        password = data.pop("new_password", None)
        if isinstance(password, str) and password:
            data["password_hash"] = hash_password(valid_password(password))


class ExternalVideoAdmin(ModelView, model=ExternalVideo):
    name, name_plural, icon = "Dış video", "Dış videolar", "fa-brands fa-youtube"
    column_list = [ExternalVideo.id, ExternalVideo.machine, ExternalVideo.title, ExternalVideo.source]
    form_columns = [ExternalVideo.machine, ExternalVideo.title, ExternalVideo.url, ExternalVideo.source]
    column_labels = {"machine": "Makine", "title": "Başlık", "url": "Bağlantı", "source": "Kaynak"}

    async def on_model_change(
        self, data: dict[str, object], model: ExternalVideo, is_created: bool, request: Request
    ) -> None:
        url = str(data.get("url") or "")
        try:
            _HTTP_URL.validate_python(url)  # same rule as the app's form: workers open this link
        except ValidationError:
            raise ValueError("Bağlantı http:// veya https:// ile başlamalı.") from None
        data["embed_url"] = embed_url(url)


_ctx: list[AppContext] = []  # set by mount(): the views need the vector store


async def _drop_vectors(owner: Owner) -> None:
    """Before SQLAdmin deletes a source: its chunk rows cascade, but their vectors live outside MySQL."""
    if _ctx:
        async with _ctx[0].sessionmaker() as db:
            await delete_chunks(db, _ctx[0].ai, owner)
            await db.commit()


def _remove_folder(rel: str) -> None:
    shutil.rmtree(storage.abs_path(rel), ignore_errors=True)


class VideoAdmin(ModelView, model=Video):
    name, name_plural, icon = "Video", "Videolar", "fa-solid fa-video"
    can_create = False
    column_list = [Video.id, Video.title, Video.machine_id, Video.status, Video.language, Video.created_at]
    form_columns = [Video.title]
    column_labels = {
        "title": "Başlık", "machine_id": "Makine no", "status": "Durum", "language": "Dil", "created_at": "Tarih",
    }  # fmt: skip

    async def on_model_delete(self, model: Video, request: Request) -> None:
        await _drop_vectors(Owner(video_id=model.id))

    async def after_model_delete(self, model: Video, request: Request) -> None:
        _remove_folder(video_dir(model.id))


class DocumentAdmin(ModelView, model=Document):
    name, name_plural, icon = "Doküman", "Dokümanlar", "fa-solid fa-file-pdf"
    can_create = False
    column_list = [Document.id, Document.title, Document.type, Document.machine_id, Document.summary_status]
    form_columns = [Document.title, Document.type]
    column_labels = {"title": "Başlık", "type": "Tür", "machine_id": "Makine no", "summary_status": "Özet"}

    async def on_model_delete(self, model: Document, request: Request) -> None:
        await _drop_vectors(Owner(document_id=model.id))

    async def after_model_delete(self, model: Document, request: Request) -> None:
        _remove_folder(f"docs/{model.id}")


class QuestionAdmin(ModelView, model=Question):
    name, name_plural, icon = "Soru", "Sorular", "fa-solid fa-circle-question"
    can_create = can_edit = False
    column_list = [Question.id, Question.machine, Question.text, Question.status, Question.created_at]
    column_labels = {"machine": "Makine", "text": "Soru", "status": "Durum", "created_at": "Tarih"}


class MaintenanceAdmin(ModelView, model=MaintenanceRecord):
    """Read-only (KAN-41): the maintenance history must stay as the technician recorded it."""

    name, name_plural, icon = "Bakım kaydı", "Bakım kayıtları", "fa-solid fa-wrench"
    can_create = can_edit = can_delete = False
    column_list = [MaintenanceRecord.id, MaintenanceRecord.machine, MaintenanceRecord.created_at]
    column_labels = {
        "machine": "Makine", "created_at": "Tarih", "description": "Yapılan iş", "done_by": "Yapan",
        "opened_by": "Açan", "attachments": "Ekler",
    }  # fmt: skip


def mount(app: Starlette, ctx: AppContext, secret_key: str) -> None:
    _ctx[:] = [ctx]
    sessionmaker = ctx.sessionmaker
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
