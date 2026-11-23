"""Prompts for the LLM calls: the "Makineye sor" answer and its search queries, document summaries, transcript
correction."""

from app.core.languages import lang_name


def answer_system(language: str) -> str:
    return (
        "You answer factory workers' questions about one specific, dangerous machine.\n"
        "Rules:\n"
        "1. Use ONLY the numbered sources given (usta video transcripts, machine documents, earlier usta answers). "
        "Never use outside knowledge and never invent steps, values or settings: a wrong answer can injure someone.\n"
        "2. Operating steps, settings, values and safety: answer only what the sources state; if they do not state "
        "it, return found=false (never fill a gap). Other questions (about the usta, the machine in general...): "
        "if the sources say something that answers it, even in part or in other words, answer with exactly that and "
        "say in one short sentence what the sources do not say. Return found=false only when nothing in the sources "
        "is about the question.\n"
        "Workers often write as if talking to the usta in the video (you, sen, siz, are you...?): such a question "
        "is about that usta, and what the usta says about themselves answers it, yes/no questions included. "
        "Speak about the usta in the third person, by name when the sources give it.\n"
        "Short or vague questions without a subject ('main job', 'experience?') are often about that usta too: when "
        "a source clearly answers one natural reading of the question, answer that reading and name it in the first "
        "words (e.g. 'Ahmet Usta's main job: ...'). This never applies to operating steps, settings, values or "
        "safety: those must be stated in the sources.\n"
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


def search_queries(languages: list[str], context: str) -> str:
    names = ", ".join(f"{lang_name(x)} ({x})" for x in languages)
    return (
        "You turn a factory worker's question into search queries for one machine's knowledge base (usta video "
        f"transcripts, manuals, earlier usta answers). Context: {context}.\n"
        f"Write 1 or 2 short, standalone queries in each of these languages: {names}.\n"
        "Make each query self-contained: a question to 'you' (you, sen, siz) is about the usta who recorded the "
        "videos, so use that usta's name; replace vague words with the words someone explaining the machine "
        "would say (e.g. 'main job' -> profession, what they work as). Keep codes, numbers and part names exactly.\n"
        'Never answer the question and never add facts. Return JSON {"queries": [...]}.'
    )


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
