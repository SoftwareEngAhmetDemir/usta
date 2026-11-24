from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Read from backend/.env (see .env.example). Missing required values fail at startup."""

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    database_url: str
    test_database_url: str = ""  # pytest only; a deployed server does not need it
    secret_key: SecretStr
    uploads_dir: Path = Path("../uploads")
    # Address phones open from the QR sticker. Empty = the address the QR/sticker was downloaded from (e.g. the
    # VS Code forwarded https URL); set it when stickers are printed from http://localhost.
    public_url: str = ""

    # Gemini (the final answer + summaries only): an API key (AI Studio) or Vertex AI = a Cloud project + region,
    # signed in with `gcloud auth application-default login`. Without it answers say "not found" and documents get
    # no summary. Translation and dubbing speech use Google's free endpoints and need no setup.
    gemini_api_key: SecretStr | None = None
    vertex_project_id: str = ""
    vertex_region: str = "us-central1"
    gemini_model: str = "gemini-2.5-flash"  # answers, their search rewrites, document summaries, transcript fixes

    # Knowledge pipelines (local models, CPU). Model names are Hugging Face ids; changing EMBEDDING_MODEL makes the
    # startup re-embed every chunk (no re-transcription).
    whisper_model: str = "small"  # faster-whisper size or path: tiny | base | small | medium | large-v3
    whisper_compute_type: str = "int8"
    embedding_model: str = "intfloat/multilingual-e5-base"
    reranker_model: str = "BAAI/bge-reranker-v2-m3"
    chroma_dir: Path = Path(".chroma")  # vector store (persistent, in-process), resolved against backend/
    tessdata_dir: Path | None = Path(".tessdata")  # Tesseract language files; None = the system's
    ocr_languages: str = "tur+eng+ara"

    # Topic segmentation (no LLM, TextTiling over embeddings + shared words): a new topic where the similarity dip
    # is deeper than mean + TOPIC_DEPTH_SD standard deviations; higher = fewer topics.
    topic_depth_sd: float = 0.5
    topic_window: int = 2
    topic_min_sec: float = 20.0
    topic_max_sec: float = 180.0
    snapshot_min_sharpness: float = 15.0  # Laplacian variance below this = blurry frame, skipped

    # "Makineye sor": hybrid search (vector + BM25, RRF) → cross-encoder rerank → confidence gate → LLM.
    ask_candidates: int = 20  # per retriever
    ask_top_k: int = Field(5, ge=1)  # ASK_TOP_K: best reranked chunks sent to the LLM, which picks and cites
    # Best rerank score (0..1) below this = "not found" without calling the LLM. Tuned 2026-11-22 on a live set:
    # unrelated questions scored <= 0.044, correct-but-paraphrased ones 0.09-0.33; the LLM still refuses
    # near-misses above the gate. Re-tune with scripts/eval_retrieval.py on the pilot questions (KAN-76).
    ask_min_score: float = 0.08

    max_upload_mb: int = 1024

    @field_validator("gemini_api_key", mode="before")
    @classmethod
    def _blank_is_none(cls, value: object) -> object:
        """`GEMINI_API_KEY=` (as in .env.example) means no key, not an empty one."""
        return value or None

    @property
    def ai_configured(self) -> bool:
        return self.gemini_api_key is not None or bool(self.vertex_project_id)

    def backend_path(self, path: Path) -> Path:
        return (BACKEND_DIR / path).resolve()

    @property
    def uploads_path(self) -> Path:
        """uploads_dir resolved against backend/, so it does not depend on the working directory."""
        return (BACKEND_DIR / self.uploads_dir).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
