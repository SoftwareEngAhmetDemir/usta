# Database migrations (Alembic)

Every table change lives here as a migration in `versions/`, in order. Never create or change tables by hand,
and never edit a migration that has already run somewhere: add a new one.

Run all commands from `backend/`. The database URL comes from `DATABASE_URL` (environment variable or `backend/.env`).

## Deploying to a cloud platform

1. Create an empty MySQL 8 database (utf8mb4) and a user that may create and alter tables in it.
2. Set the app's environment variables on the platform (no `.env` file on the server):
   - `DATABASE_URL=mysql+asyncmy://<user>:<password>@<host>:3306/<db>`
   - `SECRET_KEY` (long random string), `PUBLIC_URL` (the address on the QR stickers), `UPLOADS_DIR` (a persistent disk)
   - optional: `GEMINI_API_KEY`
3. On every deploy, **before** starting the app, run:

   ```bash
   alembic upgrade head
   ```

   It applies only the migrations the database does not have yet (tracked in the `alembic_version` table), so it is
   safe to run every time. Most platforms call this a "release command" or "pre-deploy command".

4. Start the app: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

### Platform without a shell (SQL console only)

Generate plain SQL and run it in the database console:

```bash
alembic upgrade head --sql > schema.sql                     # new, empty database
alembic upgrade <current_revision>:head --sql > update.sql  # existing database; see its alembic_version table
```

## Changing the schema

```bash
alembic revision --autogenerate -m "short description"   # after changing app/<feature>/models.py
alembic upgrade head                                     # apply locally; pytest applies it to usta_test itself
```

Review the generated file before committing: autogenerate can miss renames (it sees drop + add) and data moves.
