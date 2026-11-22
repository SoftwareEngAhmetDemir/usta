import asyncio
import shutil

from sqlalchemy.ext.asyncio import AsyncSession

from app.context import AppContext
from app.core import storage
from app.search.service import Owner, delete_chunks
from app.videos.models import Video
from app.videos.pipeline import video_dir


async def remove_video(ctx: AppContext, db: AsyncSession, video: Video) -> None:
    """Delete a video and everything derived from it. Rows cascade (segments, topics, snapshots, dubbed versions,
    steps, chunks); vectors and files are removed here."""
    await delete_chunks(db, ctx.ai, Owner(video_id=video.id))
    folder = storage.abs_path(video_dir(video.id))
    await db.delete(video)
    await db.commit()
    await asyncio.to_thread(shutil.rmtree, folder, True)
