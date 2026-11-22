"""Import every feature's models module here, so Base.metadata (Alembic autogenerate) sees all tables."""

from app.alerts import models as alerts_models
from app.ask import models as ask_models
from app.auth import models as auth_models
from app.documents import models as documents_models
from app.jobs import models as jobs_models
from app.machines import models as machines_models
from app.maintenance import models as maintenance_models
from app.questions import models as questions_models
from app.search import models as search_models
from app.translations import models as translations_models
from app.videos import models as videos_models

__all__ = [
    "alerts_models",
    "ask_models",
    "auth_models",
    "documents_models",
    "jobs_models",
    "machines_models",
    "maintenance_models",
    "questions_models",
    "search_models",
    "translations_models",
    "videos_models",
]
