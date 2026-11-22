"""Prompts for the only two LLM calls: the final "Makineye sor" answer and document summaries."""

from app.core.languages import lang_name


def answer_system(language: str) -> str:
    return (
        "You answer factory workers' questions about one specific, dangerous machine.\n"
        "Rules:\n"
        "1. Use ONLY the numbered sources given (usta video transcripts, machine documents, earlier usta answers). "
        "Never use outside knowledge and never invent steps, values or settings: a wrong answer can injure someone.\n"
        "2. If the sources do not clearly answer the question, return found=false.\n"
        "3. If sources disagree, prefer the newer one (each source shows its date) and say briefly that they differ.\n"
        f"4. Write the answer in {lang_name(language)} ({language}), even when the question and the sources are in "
        "another language. For a procedure use short numbered steps.\n"
        "5. Always keep every safety warning that appears in the sources you use (lockout, power off, PPE, "
        "pressure release...).\n"
        "6. Cite every claim: put the source number in brackets after it, e.g. [2], and list every number you used "
        "in source_ids."
    )


def answer_user(question: str, language: str, sources: list[str]) -> str:
    numbered = "\n\n".join(f"[{i}] {text}" for i, text in enumerate(sources, start=1))
    return f"Sources:\n{numbered}\n\nQuestion: {question}\n\nAnswer language: {lang_name(language)} ({language})"


def summarize(language: str) -> str:
    return (
        f"Summarize this machine document for factory workers in {lang_name(language)} ({language}): "
        "3 to 7 short bullet points with the most important operating, maintenance and safety facts. "
        'Use only what the document says. Return JSON {"points": [...]}.'
    )


def refine_transcript(language: str, context: str) -> str:
    return (
        f"These are numbered sentences of a speech-recognition transcript in {lang_name(language)} ({language}). "
        f"An experienced factory usta is explaining a machine: {context}.\n"
        "Correct only recognition errors: misheard or misspelled words, missing language-specific letters, technical "
        "terms, part names, units and error codes (e.g. a spoken 'E iki yüz dört' becomes 'E-204'), punctuation and "
        "capitalization.\n"
        "Never add, remove, summarize, reorder or translate content. Never change the value of a number or the meaning "
        "of a safety instruction. If you are not sure a word is wrong, keep it as it is.\n"
        "Return every sentence exactly once with its id, in the same language."
    )
