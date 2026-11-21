import argparse

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import cli
from app.auth.models import Role, User
from app.config import Settings, get_settings


@pytest.fixture(autouse=True)
def cli_uses_test_db(monkeypatch: pytest.MonkeyPatch) -> None:
    test_settings: Settings = get_settings().model_copy(update={"database_url": get_settings().test_database_url})
    monkeypatch.setattr(cli, "get_settings", lambda: test_settings)


async def test_create_patron_then_change_role(db: AsyncSession) -> None:
    args = argparse.Namespace(command="create", name="Ahmet", login="0532 000 00 00", role="patron")
    assert await cli.run(args, "patron-sifre") == "Created Ahmet (05320000000) as patron."

    args = argparse.Namespace(command="set-role", login="0532-000-00-00", role="usta")
    assert await cli.run(args, None) == "05320000000 is now usta."
    user = await db.scalar(select(User))
    assert user is not None and user.role is Role.usta


async def test_set_role_for_unknown_login() -> None:
    args = argparse.Namespace(command="set-role", login="05329999999", role="usta")
    assert await cli.run(args, None) == "No user with login 05329999999."
