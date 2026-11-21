"""Create a user or change a user's role from the terminal (e.g. the first Patron).

cd backend
.venv/bin/python -m app.auth.cli create --name "Ahmet Demir" --login 05321234567 --role patron
.venv/bin/python -m app.auth.cli set-role --login 05321234567 --role usta
"""

import argparse
import asyncio
import getpass
import sys

from pydantic import ValidationError

from app.auth import service
from app.auth.models import Role
from app.auth.schemas import RegisterIn, normalize_login
from app.config import get_settings
from app.db import make_engine, make_sessionmaker


async def run(args: argparse.Namespace, password: str | None) -> str:
    engine = make_engine(get_settings().database_url)
    try:
        async with make_sessionmaker(engine)() as db:
            if args.command == "create":
                body = RegisterIn(name=args.name, login=args.login, password=password or "")
                user = await service.create_user(
                    db, name=body.name, login=body.login, password=body.password, role=Role(args.role)
                )
                return f"Created {user.name} ({user.login}) as {user.role}."
            found = await service.set_role(db, normalize_login(args.login), Role(args.role))
            return f"{found.login} is now {found.role}." if found else f"No user with login {args.login}."
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.auth.cli")
    sub = parser.add_subparsers(dest="command", required=True)
    create = sub.add_parser("create", help="create a user (asks for the password)")
    create.add_argument("--name", required=True)
    create.add_argument("--login", required=True, help="phone or e-mail")
    create.add_argument("--role", choices=[r.value for r in Role], default=Role.worker.value)
    set_role = sub.add_parser("set-role", help="change an existing user's role")
    set_role.add_argument("--login", required=True)
    set_role.add_argument("--role", choices=[r.value for r in Role], required=True)
    args = parser.parse_args()

    password = getpass.getpass("Password (min 8 characters): ") if args.command == "create" else None
    try:
        print(asyncio.run(run(args, password)))
    except ValidationError as e:
        sys.exit("; ".join(str(err["msg"]) for err in e.errors()))
    except service.LoginTakenError:
        sys.exit(f"A user with login {args.login} already exists. Use set-role to change their role.")


if __name__ == "__main__":
    main()
