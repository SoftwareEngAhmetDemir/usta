from httpx import AsyncClient


async def test_health_reports_ok_when_database_answers(client: AsyncClient) -> None:
    res = await client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


async def test_routes_live_under_api_prefix(client: AsyncClient) -> None:
    # Vite proxies /api/* to the backend unchanged, so a route without the prefix would be unreachable.
    res = await client.get("/health")
    assert res.status_code == 404
