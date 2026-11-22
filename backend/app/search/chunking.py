"""Cutting sources into search chunks. Pure; tests/test_chunking.py.
- Video: one chunk per topic segment; a long topic is split (~400 tokens) with a 1-sentence overlap.
- Document: by heading/paragraph, up to ~500 tokens with a small overlap; tables stay together (split by rows
  with the header repeated when one is too long)."""

from dataclasses import dataclass, field


def estimate_tokens(text: str) -> int:
    """shortcut: ~1.5 subword tokens per word (Turkish words are long); use the embedder's tokenizer if exact
    limits ever matter."""
    return max(1, round(len(text.split()) * 1.5))


# ---- video ----


@dataclass(frozen=True)
class TimedText:
    start: float
    end: float
    text: str


@dataclass(frozen=True)
class VideoChunk:
    start: float
    end: float
    text: str
    topic_index: int


def chunk_video(topics: list[list[TimedText]], max_tokens: int = 400) -> list[VideoChunk]:
    """`topics`: each topic's sentences in order."""
    chunks: list[VideoChunk] = []
    for t, sentences in enumerate(topics):
        piece: list[TimedText] = []
        for s in sentences:
            if piece and estimate_tokens(" ".join(x.text for x in [*piece, s])) > max_tokens:
                chunks.append(_video_chunk(piece, t))
                piece = [piece[-1]]  # 1-sentence overlap
            piece.append(s)
        if piece:  # after a split it holds the overlap sentence plus at least one new one
            chunks.append(_video_chunk(piece, t))
    return chunks


def _video_chunk(sentences: list[TimedText], topic: int) -> VideoChunk:
    return VideoChunk(sentences[0].start, sentences[-1].end, " ".join(s.text for s in sentences), topic)


# ---- documents ----


@dataclass(frozen=True)
class Block:
    """A paragraph or a markdown table from a document, with where it came from."""

    page: int
    heading: str
    text: str
    is_table: bool = False


@dataclass
class DocChunk:
    page: int
    heading: str
    text: str
    parts: list[str] = field(default_factory=list)


def _split_table(block: Block, max_tokens: int) -> list[Block]:
    rows = block.text.splitlines()
    header, body = rows[:2], rows[2:]  # markdown: header row + separator row
    out: list[Block] = []
    current: list[str] = []
    for row in body:
        if current and estimate_tokens("\n".join([*header, *current, row])) > max_tokens:
            out.append(Block(block.page, block.heading, "\n".join([*header, *current]), True))
            current = []
        current.append(row)
    if current or not out:
        out.append(Block(block.page, block.heading, "\n".join([*header, *current]), True))
    return out


def _split_paragraph(block: Block, max_tokens: int) -> list[Block]:
    words = block.text.split()
    size = max(1, int(max_tokens / 1.5))
    return [Block(block.page, block.heading, " ".join(words[i : i + size])) for i in range(0, len(words), size)]


def chunk_document(blocks: list[Block], max_tokens: int = 500, overlap_tokens: int = 50) -> list[DocChunk]:
    """Group consecutive blocks of the same heading and page into chunks of up to `max_tokens` (so long sections
    give ~300-500-token chunks; a short section stays its own chunk); a new heading or page starts a new chunk, so a
    chunk's page is exact. The next chunk of the same section repeats the end of the previous paragraph."""
    pieces: list[Block] = []
    for b in blocks:
        if not b.text.strip():
            continue
        if estimate_tokens(b.text) <= max_tokens:
            pieces.append(b)
        else:
            pieces += _split_table(b, max_tokens) if b.is_table else _split_paragraph(b, max_tokens)

    chunks: list[DocChunk] = []
    for b in pieces:
        last = chunks[-1] if chunks else None
        same_section = last is not None and last.heading == b.heading and last.page == b.page  # exact page citations
        fits = last is not None and estimate_tokens(last.text + "\n" + b.text) <= max_tokens
        if same_section and last is not None and fits:
            last.text += "\n" + b.text
            last.parts.append(b.text)
            continue
        text = b.text
        if same_section and last is not None and not b.is_table and not last.parts[-1].startswith("|"):
            tail = _tail(last.parts[-1], overlap_tokens)
            if tail and estimate_tokens(tail + "\n" + b.text) <= max_tokens:
                text = tail + "\n" + b.text
        chunks.append(DocChunk(b.page, b.heading, text, [b.text]))
    return chunks


def _tail(text: str, tokens: int) -> str:
    words = text.split()
    return " ".join(words[-max(1, int(tokens / 1.5)) :])


def with_heading(chunk: DocChunk) -> str:
    """Text that is embedded and searched: the section heading gives the chunk its context."""
    return f"{chunk.heading}\n{chunk.text}" if chunk.heading else chunk.text
