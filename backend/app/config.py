from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Read from backend/.env (see .env.example). Missing required values fail at startup."""

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    database_url: str
    test_database_url: str = ""  # pytest only; a deployed server does not need it
    secret_key: SecretStr
    uploads_dir: Path = Path("../uploads")
    # Address phones open from the QR sticker (the VS Code forwarded-port URL when shared).
    public_url: str = "http://localhost:5173"

    # Gemini (app/ai). Without a key the AI features report "unavailable" instead of guessing.
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    gemini_tts_model: str = "gemini-2.5-flash-preview-tts"
    gemini_tts_voice: str = "Charon"
    # "Makineye sor": a source must be at least this similar to the question, else the answer is "not found".
    ask_min_score: float = 0.6

    max_upload_mb: int = 1024

    @field_validator("gemini_api_key", mode="before")
    @classmethod
    def _blank_is_none(cls, value: object) -> object:
        """`GEMINI_API_KEY=` (as in .env.example) means no key, not an empty one."""
        return value or None

    @property
    def uploads_path(self) -> Path:
        """uploads_dir resolved against backend/, so it does not depend on the working directory."""
        return (BACKEND_DIR / self.uploads_dir).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
