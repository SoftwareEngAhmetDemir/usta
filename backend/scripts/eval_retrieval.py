"""Retrieval hit@5 over question → expected-source pairs, using the real models and index (hybrid search + rerank,
exactly as "Makineye sor" does, without calling the LLM).

Stop ./dev.sh first: the vector store must be opened by one process at a time.

cd backend
.venv/bin/python scripts/eval_retrieval.py scripts/eval_example.json [--k N]  (default ASK_TOP_K)
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

from app.ai import factory
from app.config import get_settings
from app.db import make_engine, make_sessionmaker
from app.search.evaluation import EvalSet, hit_rank, report
from app.search.service import hybrid_search, rerank


async def main(data: EvalSet, k: int) -> None:
    settings = get_settings()
    ai = factory.build(settings)
    engine = make_engine(settings.database_url)
    ranks: list[int | None] = []
    async with make_sessionmaker(engine)() as db:
        for case in data.cases:
            # shortcut: the original question only; the app also searches its machine translation (needs Cloud MT)
            candidates = await hybrid_search(db, ai, data.machine_id, [case.question], settings.ask_candidates)
            top = await rerank(ai, [case.question], candidates, k) if candidates else []
            rank = hit_rank([c.chunk for c in top], case.expect)
            ranks.append(rank)
            best = f"{top[0].rerank:.2f}" if top else "-"
            gate = "pass" if top and top[0].rerank >= settings.ask_min_score else "NOT FOUND"
            print(f"{'HIT ' if rank else 'MISS'} rank={rank or '-'} best={best} gate={gate}  {case.question}")
    await engine.dispose()
    print(report(ranks, k).model_dump_json())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path)
    parser.add_argument("--k", type=int, default=get_settings().ask_top_k)
    args = parser.parse_args()
    if not args.file.exists():
        sys.exit(f"{args.file} not found")
    eval_set = EvalSet.model_validate(json.loads(args.file.read_text(encoding="utf-8")))
    asyncio.run(main(eval_set, args.k))
