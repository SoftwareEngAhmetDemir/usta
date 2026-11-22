from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.auth.deps import CurrentUser
from app.core import storage
from app.deps import CtxDep, SessionDep, forbidden, not_found
from app.documents import service
from app.documents.models import Document, DocumentType, SummaryStatus
from app.machines.models import Machine
from app.machines.permissions import actions

router = APIRouter(tags=["documents"])


@router.get("/documents/{document_id}", response_model=service.DocumentDetail)
async def get_document(document_id: int, user: CurrentUser, db: SessionDep) -> service.DocumentDetail:
    doc = await db.get(Document, document_id)
    if doc is None:
        raise not_found("Doküman")
    machine = await db.get(Machine, doc.machine_id)
    found = (await service.summaries(db, [doc.id], user.language)).get(doc.id)
    return service.detail_out(doc, machine.name if machine else "", found)


@router.post("/machines/{machine_id}/documents", response_model=service.DocumentSummaryOut)
async def upload_document(
    machine_id: int,
    type: Annotated[DocumentType, Form()],
    title: Annotated[str, Form(min_length=1, max_length=200)],
    file: Annotated[UploadFile, File()],
    user: CurrentUser,
    db: SessionDep,
    ctx: CtxDep,
) -> service.DocumentSummaryOut:
    """KAN-33: the patron or the machine's usta uploads a PDF or photo of a document; text extraction + summary
    run in the background."""
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    if not actions(user, machine).upload_document:
        raise forbidden()
    mime = file.content_type or ""
    if mime not in service.ALLOWED_TYPES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "Yalnızca PDF veya fotoğraf (JPG, PNG) yüklenebilir."
        )
    doc = Document(
        machine_id=machine.id, title=title.strip(), type=type, file="", mime_type=mime, uploaded_by_id=user.id,
        summary_status=SummaryStatus.preparing,
    )  # fmt: skip
    db.add(doc)
    await db.flush()
    ext = Path(file.filename or "").suffix.lower()[:6] or (".pdf" if mime == "application/pdf" else ".jpg")
    doc.file = storage.save_upload(file, f"docs/{doc.id}", f"document{ext}")
    await db.commit()
    ctx.jobs.spawn(service.process(ctx, doc.id), name=f"document-{doc.id}")
    return service.summary_out(doc, None)
