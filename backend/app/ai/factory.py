from app.ai.chroma import ChromaVectorStore
from app.ai.disabled import DisabledLLM
from app.ai.gemini import GeminiLLM
from app.ai.google_free import GoogleFreeTranslator, GoogleFreeTTS
from app.ai.interfaces import AIServices, LLMClient
from app.ai.local_models import CrossEncoderReranker, E5Embedder
from app.ai.whisper import FasterWhisperTranscriber
from app.config import Settings


def build(settings: Settings) -> AIServices:
    """The real engines. Local models load on first use, so startup stays fast. Translation and speech use
    Google's free endpoints (no key); Gemini (Vertex AI or a key) only writes answers and summaries."""
    llm: LLMClient = GeminiLLM(settings) if settings.ai_configured else DisabledLLM()
    return AIServices(
        transcriber=FasterWhisperTranscriber(settings.whisper_model, settings.whisper_compute_type),
        embedder=E5Embedder(settings.embedding_model),
        reranker=CrossEncoderReranker(settings.reranker_model),
        vectors=ChromaVectorStore(settings.backend_path(settings.chroma_dir)),
        translator=GoogleFreeTranslator(),
        tts=GoogleFreeTTS(),
        llm=llm,
        ocr_languages=settings.ocr_languages,
        tessdata_dir=settings.backend_path(settings.tessdata_dir) if settings.tessdata_dir else None,
    )
