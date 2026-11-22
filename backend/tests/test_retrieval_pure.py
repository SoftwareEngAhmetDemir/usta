from app.search.chunking import Block, TimedText, chunk_document, chunk_video, estimate_tokens
from app.search.keyword import BM25, normalize, rrf_merge, tokenize


def test_tokenize_keeps_codes_whole_and_ignores_case_and_accents() -> None:
    assert tokenize("Hata kodu E-204!") == ["hata", "kodu", "e-204", "e", "204"]
    assert tokenize("PK-105 basınç 6.2 bar") == ["pk-105", "pk", "105", "basinc", "6.2", "6", "2", "bar"]
    assert normalize("İŞLEM ÇIKIŞ") == "islem cikis"


def test_bm25_finds_the_exact_error_code() -> None:
    docs = [
        tokenize(t)
        for t in ("Basınç sensörü arızası E-204 verir.", "Nozul her 8 saatte değişir.", "E-301 aşırı ısınma")
    ]
    scores = BM25(docs).scores(tokenize("E-204 ne demek?"))
    assert scores[0] > scores[2] > scores[1] == 0.0


def test_rrf_merge() -> None:
    merged = rrf_merge([[1, 2, 3], [3, 1]], k=60)
    assert [i for i, _ in merged] == [1, 3, 2]  # in both lists, near the top
    assert merged[0][1] == 1 / 61 + 1 / 62
    assert rrf_merge([]) == []


def test_video_topic_is_one_chunk_or_split_with_one_sentence_overlap() -> None:
    short = [[TimedText(0, 5, "Kısa bir konu.")], [TimedText(30, 40, "Başka konu.")]]
    assert [(c.start, c.end, c.topic_index) for c in chunk_video(short)] == [(0, 5, 0), (30, 40, 1)]
    sentence = " ".join(["kelime"] * 100)  # ~150 tokens
    long_topic = [[TimedText(i * 10, i * 10 + 9, f"{i} {sentence}") for i in range(5)]]
    chunks = chunk_video(long_topic, max_tokens=400)
    assert [c.text.split()[0] for c in chunks] == ["0", "1", "2", "3"]  # 2 sentences each, 1 repeated
    assert chunks[1].start == 10 and chunks[1].end == 29
    assert all(estimate_tokens(c.text) <= 400 for c in chunks)


def test_document_chunks_follow_headings_pages_and_keep_tables_whole() -> None:
    para = " ".join(["metin"] * 150)  # ~225 tokens
    table = "| Parça | Kod |\n|---|---|\n" + "\n".join(f"| Parça {i} | PK-{i} |" for i in range(100))
    blocks = [
        Block(1, "Kurulum", para), Block(1, "Kurulum", "Hava 6 bar."), Block(1, "Bakım", "Nozul 8 saatte."),
        Block(2, "Bakım", "Elektrot 200 saatte."), Block(2, "Parçalar", table, is_table=True),
    ]  # fmt: skip
    chunks = chunk_document(blocks, max_tokens=500)
    assert [(c.page, c.heading) for c in chunks[:4]] == [(1, "Kurulum"), (1, "Bakım"), (2, "Bakım"), (2, "Parçalar")]
    assert chunks[0].text == para + "\nHava 6 bar."
    tables = [c for c in chunks if c.heading == "Parçalar"]
    assert len(tables) > 1 and all(c.text.startswith("| Parça | Kod |\n|---|---|") for c in tables)
    assert all(estimate_tokens(c.text) <= 500 for c in chunks)


def test_long_section_is_split_with_overlap() -> None:
    paras = [Block(1, "Uzun", f"Paragraf {i} " + " ".join(["metin"] * 200)) for i in range(3)]
    chunks = chunk_document(paras, max_tokens=500, overlap_tokens=30)
    assert len(chunks) == 3
    assert chunks[1].text.endswith(paras[1].text) and chunks[1].text != paras[1].text  # starts with the overlap
