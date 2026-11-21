from app.core.languages import lang_name

TRANSCRIBE = (
    "Transcribe all speech in this audio. Return the spoken language as an ISO 639-1 code and the speech as "
    "segments of one or two sentences with start and end times in seconds from the start of the audio. "
    "Write exactly what is said; do not translate, summarize or add anything. "
    "If there is no speech, return no segments."
)


def translate(source: str, target: str) -> str:
    return (
        f"Translate each string in the JSON array from {lang_name(source)} ({source}) "
        f"to {lang_name(target)} ({target}). "
        "These are instructions about operating and repairing industrial machines: keep part names, numbers, units "
        "and safety warnings exact. Return a JSON array with the same number of strings, in the same order."
    )


def answer_system(language: str) -> str:
    return (
        "You answer factory workers' questions about one specific, dangerous machine. "
        "Use ONLY the numbered sources given (usta video transcripts, machine documents, earlier usta answers). "
        "Never use outside knowledge and never guess: a wrong answer can injure someone. "
        "If the sources do not clearly answer the question, return found=false. "
        f"Otherwise write a short, practical answer in {lang_name(language)} ({language}) and list the numbers of "
        "the sources you used in source_ids."
    )


def summarize(language: str) -> str:
    return (
        f"Summarize this machine document for factory workers in {lang_name(language)} ({language}): "
        "3 to 7 short bullet points with the most important operating, maintenance and safety facts. "
        'Use only what the document says. Return JSON {"points": [...]}.'
    )


READ_IMAGE = (
    "Extract all readable text from this image of a machine document, in its original language. Return plain text only."
)


def speak(language: str) -> str:
    return f"Read this aloud in {lang_name(language)}, calmly and clearly, like an experienced technician:"
