"""SQLAdmin at /admin (KAN-41): the patron creates machines, assigns ustas, sets roles and authorization
documents, and cleans up content. Only patrons get in; the app's session cookie is reused. Shown in the patron's
site language (`i18n`), switched from the top bar like the app's 🌐 menu."""

import secrets
import shutil
from pathlib import Path

from pydantic import AnyHttpUrl, TypeAdapter, ValidationError
from sqladmin import Admin, ModelView
from sqladmin._types import MODEL_ATTR  # the type of ModelView.column_labels keys
from sqladmin.authentication import AuthenticationBackend
from starlette.applications import Starlette
from starlette.datastructures import UploadFile
from starlette.requests import Request
from wtforms import FileField, Form, PasswordField
from wtforms.fields.core import UnboundField

from app.admin import i18n
from app.auth import service as auth_service
from app.auth.deps import SESSION_COOKIE
from app.auth.models import Role, User
from app.auth.passwords import hash_password
from app.auth.schemas import normalize_login, valid_password
from app.context import AppContext
from app.core import storage
from app.core.languages import LANGUAGES
from app.documents.models import Document
from app.machines.models import ExternalVideo, Machine
from app.machines.service import embed_url
from app.maintenance.models import MaintenanceRecord
from app.questions.models import Question
from app.search.service import Owner, delete_chunks
from app.translations.service import change_language
from app.videos.models import Video
from app.videos.pipeline import video_dir


class PatronOnly(AuthenticationBackend):
    def __init__(self, secret_key: str, ctx: AppContext) -> None:
        super().__init__(secret_key=secret_key)
        self._ctx = ctx
        self._sessionmaker = ctx.sessionmaker

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
        """A patron logged into the app gets straight in; otherwise SQLAdmin shows its login form. Runs before every
        page, so it also applies a language picked in the top bar (`?lang=`, saved like the app's 🌐 menu) and loads
        the page texts in the patron's language."""
        token = request.cookies.get(SESSION_COOKIE) or request.session.get(SESSION_COOKIE)
        if not isinstance(token, str):
            return False
        async with self._sessionmaker() as db:
            user = await auth_service.user_for_token(db, token)
            if user is None or user.role != Role.patron:
                return False
            picked = request.query_params.get("lang")
            if picked in LANGUAGES and picked != user.language:
                await change_language(self._ctx, db, user, picked)
            await i18n.use_language(db, self._ctx.ai.translator, user.language)
        return True


class _Localized(ModelView):
    """Form labels and the search hint in the patron's language (other labels go through the templates)."""

    async def scaffold_form(self, rules: list[str] | None = None) -> type[Form]:
        form = await super().scaffold_form(rules)  # a new class per request: safe to change
        for field in vars(form).values():
            if isinstance(field, UnboundField) and isinstance(label := field.kwargs.get("label"), str):
                field.kwargs["label"] = i18n.translate_text(label)
        return form

    def search_placeholder(self) -> str:
        return ", ".join(i18n.translate_text(p) for p in super().search_placeholder().split(", "))


_HTTP_URL = TypeAdapter(AnyHttpUrl)


def _take_upload(data: dict[str, object], key: str, folder: str) -> None:
    """Turn the uploaded file in form field `key` into a stored path; no file chosen keeps the current one."""
    file = data.get(key)
    if isinstance(file, UploadFile) and storage.has_content(file):
        ext = Path(file.filename or "").suffix.lower()[:6]
        data[key] = storage.save_upload(file, folder, f"{secrets.token_hex(8)}{ext}")
    else:
        data.pop(key, None)


# Every column a list, details page or form can show has a label (a missing one showed its raw name, untranslated).
COMMON_LABELS: dict[MODEL_ATTR, str] = {"id": "No", "created_at": "Tarih", "machine_id": "Makine no"}


class MachineAdmin(_Localized, model=Machine):
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
        "qr_text": "Makinedeki hazır QR'ın metni (tarayınca bu makine açılır)", **COMMON_LABELS,
    }  # fmt: skip

    async def on_model_change(
        self, data: dict[str, object], model: Machine, is_created: bool, request: Request
    ) -> None:
        _take_upload(data, "photo", "machines")


RESET_LABEL = "Yeni şifre (boş bırakılırsa değişmez)"
BAD_LINK = "Bağlantı http:// veya https:// ile başlamalı."


class UserAdmin(_Localized, model=User):
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
        "authorization_note": "Yetki notu", "authorization_document": "Yetki belgesi", **COMMON_LABELS,
    }  # fmt: skip

    async def scaffold_form(self, rules: list[str] | None = None) -> type[Form]:
        form = await super().scaffold_form(rules)
        # Not a column: an empty field keeps the current password (the stored hash is never shown).
        label = i18n.translate_text(RESET_LABEL)
        form.new_password = PasswordField(label, render_kw={"class": "form-control"})
        return form

    async def on_model_change(self, data: dict[str, object], model: User, is_created: bool, request: Request) -> None:
        _take_upload(data, "authorization_document", "certs")
        password = data.pop("new_password", None)
        if isinstance(password, str) and password:
            data["password_hash"] = hash_password(valid_password(password))


class ExternalVideoAdmin(_Localized, model=ExternalVideo):
    name, name_plural, icon = "Dış video", "Dış videolar", "fa-brands fa-youtube"
    column_list = [ExternalVideo.id, ExternalVideo.machine, ExternalVideo.title, ExternalVideo.source]
    form_columns = [ExternalVideo.machine, ExternalVideo.title, ExternalVideo.url, ExternalVideo.source]
    column_labels = {
        "machine": "Makine", "title": "Başlık", "url": "Bağlantı", "source": "Kaynak",
        "embed_url": "Gömülü oynatıcı bağlantısı", **COMMON_LABELS,
    }  # fmt: skip

    async def on_model_change(
        self, data: dict[str, object], model: ExternalVideo, is_created: bool, request: Request
    ) -> None:
        url = str(data.get("url") or "")
        try:
            _HTTP_URL.validate_python(url)  # same rule as the app's form: workers open this link
        except ValidationError:
            raise ValueError(BAD_LINK) from None
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


class VideoAdmin(_Localized, model=Video):
    name, name_plural, icon = "Video", "Videolar", "fa-solid fa-video"
    can_create = False
    column_list = [Video.id, Video.title, Video.machine_id, Video.status, Video.language, Video.created_at]
    form_columns = [Video.title]
    column_labels = {
        "title": "Başlık", "status": "Durum", "language": "Dil", "author": "Kaydeden", "author_id": "Kaydeden no",
        "original": "Orijinal dosya", "stream": "Oynatılan dosya", "thumbnail": "Küçük resim",
        "duration_sec": "Süre (sn)", "language_hint": "Seçilen konuşma dili", "speaking_rate": "Konuşma hızı",
        **COMMON_LABELS,
    }  # fmt: skip

    async def on_model_delete(self, model: Video, request: Request) -> None:
        await _drop_vectors(Owner(video_id=model.id))

    async def after_model_delete(self, model: Video, request: Request) -> None:
        _remove_folder(video_dir(model.id))


class DocumentAdmin(_Localized, model=Document):
    name, name_plural, icon = "Doküman", "Dokümanlar", "fa-solid fa-file-pdf"
    can_create = False
    column_list = [Document.id, Document.title, Document.type, Document.machine_id, Document.summary_status]
    form_columns = [Document.title, Document.type]
    column_labels = {
        "title": "Başlık", "type": "Tür", "summary_status": "Özet", "file": "Dosya", "file_name": "Dosya adı",
        "language": "Dil", "mime_type": "Dosya biçimi", "page_count": "Sayfa sayısı", "uploaded_by_id": "Yükleyen no",
        **COMMON_LABELS,
    }  # fmt: skip

    async def on_model_delete(self, model: Document, request: Request) -> None:
        await _drop_vectors(Owner(document_id=model.id))

    async def after_model_delete(self, model: Document, request: Request) -> None:
        _remove_folder(f"docs/{model.id}")


class QuestionAdmin(_Localized, model=Question):
    name, name_plural, icon = "Soru", "Sorular", "fa-solid fa-circle-question"
    can_create = can_edit = False
    column_list = [Question.id, Question.machine, Question.text, Question.status, Question.created_at]
    column_labels = {
        "machine": "Makine", "text": "Soru", "status": "Durum", "language": "Dil", "asked_by": "Soran",
        "asked_by_id": "Soran no", "answered_by": "Cevaplayan", "answered_by_id": "Cevaplayan no",
        "answer_text": "Cevap", "answer_language": "Cevabın dili", "answer_video_id": "Cevap videosu no",
        "answer_file": "Cevap dosyası", "answered_at": "Cevap tarihi", **COMMON_LABELS,
    }  # fmt: skip


class MaintenanceAdmin(_Localized, model=MaintenanceRecord):
    """Read-only (KAN-41): the maintenance history must stay as the technician recorded it."""

    name, name_plural, icon = "Bakım kaydı", "Bakım kayıtları", "fa-solid fa-wrench"
    can_create = can_edit = can_delete = False
    column_list = [MaintenanceRecord.id, MaintenanceRecord.machine, MaintenanceRecord.created_at]
    column_labels = {
        "machine": "Makine", "description": "Yapılan iş", "done_by": "Yapan", "done_by_id": "Yapan no",
        "opened_by": "Açan", "opened_by_id": "Açan no", "attachments": "Ekler", **COMMON_LABELS,
    }  # fmt: skip


VIEWS: tuple[type[_Localized], ...] = (
    MachineAdmin, UserAdmin, ExternalVideoAdmin, VideoAdmin, DocumentAdmin, QuestionAdmin, MaintenanceAdmin,
)  # fmt: skip
TITLE = "Usta Hafızası · Yönetim"


def mount(app: Starlette, ctx: AppContext, secret_key: str) -> None:
    _ctx[:] = [ctx]
    admin = Admin(
        app,
        session_maker=ctx.sessionmaker,
        base_url="/admin",
        title=TITLE,
        authentication_backend=PatronOnly(secret_key, ctx),
        templates_dir=str(Path(__file__).parent / "templates"),  # sqladmin/layout.html: the language picker
    )
    i18n.install(admin.templates.env)
    i18n.register([RESET_LABEL, BAD_LINK])  # not TITLE: the product name stays as it is, like the app's header
    for view in VIEWS:
        i18n.register([view.name, view.name_plural, *(view.column_labels or {}).values()])
        admin.add_view(view)
