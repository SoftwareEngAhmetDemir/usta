from pathlib import Path

import pytest
from google import genai

from app.ai import factory, gemini
from app.ai.disabled import DisabledLLM
from app.ai.google_free import GoogleFreeTranslator, GoogleFreeTTS
from app.config import Settings


def test_server_starts_without_test_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    """A cloud deploy sets DATABASE_URL and SECRET_KEY only."""
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    settings = Settings(_env_file=None, database_url="mysql+asyncmy://u:p@db/usta", secret_key="k")
    assert settings.test_database_url == ""


def test_without_gemini_only_the_llm_is_off(tmp_path: Path) -> None:
    settings = Settings(gemini_api_key="", vertex_project_id="", chroma_dir=tmp_path / "chroma")
    assert settings.gemini_api_key is None  # `GEMINI_API_KEY=` in .env means no key
    ai = factory.build(settings)
    assert isinstance(ai.llm, DisabledLLM)
    assert isinstance(ai.translator, GoogleFreeTranslator)  # free endpoints: no key or project needed
    assert isinstance(ai.tts, GoogleFreeTTS)
    assert ai.embedder.model_version == settings.embedding_model  # local models still work (loaded on first use)


def test_gemini_client_uses_vertex_or_a_key(monkeypatch: pytest.MonkeyPatch) -> None:
    made: list[dict[str, object]] = []
    monkeypatch.setattr(genai, "Client", lambda **kwargs: made.append(kwargs))
    gemini.client(Settings(gemini_api_key="", vertex_project_id="my-project", vertex_region="europe-west4"))
    vertex = {"vertexai": True, "project": "my-project", "location": "europe-west4"}
    assert made == [{**vertex, "http_options": gemini._RETRY}]  # retries rate limits
    made.clear()
    gemini.client(Settings(gemini_api_key="k", vertex_project_id="my-project"))  # a key wins over Vertex
    assert made == [{"api_key": "k", "http_options": gemini._RETRY}]
