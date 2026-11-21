import pytest

from app.ai.protocol import DisabledAI
from app.config import Settings
from app.main import default_ai


def test_server_starts_without_test_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    """A cloud deploy sets DATABASE_URL and SECRET_KEY only."""
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    settings = Settings(_env_file=None, database_url="mysql+asyncmy://u:p@db/usta", secret_key="k")
    assert settings.test_database_url == ""


def test_blank_gemini_key_means_ai_off() -> None:
    settings = Settings(gemini_api_key="")  # as read from `GEMINI_API_KEY=` in .env
    assert settings.gemini_api_key is None
    assert isinstance(default_ai(settings), DisabledAI)
