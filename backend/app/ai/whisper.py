"""faster-whisper (CTranslate2, CPU int8): transcription with word timestamps and VAD (factory audio is noisy)."""

import threading
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel
from numpy.typing import NDArray

from app.ai.interfaces import TranscriptionResult, WhisperSegment, Word

# Whisper's own hallucination guard: a segment that is probably silence and also low-confidence is dropped.
NO_SPEECH_PROB, LOW_LOGPROB = 0.6, -1.0


def _read_wav(path: Path) -> NDArray[np.float32]:
    """The pipeline's 16 kHz mono 16-bit WAV as float samples. Decoding it ourselves avoids faster-whisper's PyAV
    decoder (faster-whisper 1.2.1 passes an argument newer PyAV releases removed)."""
    with wave.open(str(path)) as w:
        if (w.getframerate(), w.getnchannels(), w.getsampwidth()) != (16_000, 1, 2):
            raise ValueError("expected 16 kHz mono 16-bit WAV")
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    return pcm.astype(np.float32) / 32768.0


class FasterWhisperTranscriber:
    def __init__(self, model: str, compute_type: str = "int8") -> None:
        self._name, self._compute_type = model, compute_type
        self._model: WhisperModel | None = None
        self._lock = threading.Lock()

    def _load(self) -> WhisperModel:
        with self._lock:
            if self._model is None:
                self._model = WhisperModel(self._name, device="cpu", compute_type=self._compute_type)
            return self._model

    def transcribe(self, audio: Path, language_hint: str | None) -> TranscriptionResult:
        segments, info = self._load().transcribe(
            _read_wav(audio),
            language=language_hint,  # None = detect
            vad_filter=True,
            word_timestamps=True,
            beam_size=5,
            condition_on_previous_text=False,  # stops one misheard phrase from repeating through the video
        )
        out = [
            WhisperSegment(
                start=s.start,
                end=s.end,
                text=s.text.strip(),
                avg_logprob=s.avg_logprob,
                words=[Word(start=w.start, end=w.end, text=w.word, probability=w.probability) for w in s.words or []],
            )
            for s in segments
            if s.text.strip() and not (s.no_speech_prob > NO_SPEECH_PROB and s.avg_logprob < LOW_LOGPROB)
        ]
        return TranscriptionResult(language=info.language, segments=out)
