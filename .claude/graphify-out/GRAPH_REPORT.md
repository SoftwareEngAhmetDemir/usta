# Graph Report - usta  (2026-11-23)

## Corpus Check
- 474 files · ~89,669 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .ini 1)

## Summary
- 2386 nodes · 7546 edges · 117 communities (80 shown, 37 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 727 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `82f3d480`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppLayout.tsx
- User
- documents/service.py
- questions/service.py
- auth/router.py
- sqlalchemy
- AppRoutes.tsx
- AIUnavailableError
- api/index.ts
- media.py
- pipeline.py
- handlers.ts
- ask/service.py
- react-router
- api/types.ts
- MachinePage.tsx
- Protocol
- VideoPage.tsx
- package.json
- queue.py
- AppContext
- Video
- machines/router.py
- VideoList.tsx
- startup
- fixtures.ts
- User
- Modules
- fakes.py
- machines/service.py
- db
- @testing-library/react
- interfaces.py
- extract.py
- timeline.py
- Settings
- videos/router.py
- JobQueue
- admin/router.py
- test_admin.py
- ChromaVectorStore
- sqlalchemy_ext_asyncio
- GeminiLLM
- compilerOptions
- build
- tokenize
- main.py
- usta (Usta Hafızası)
- compilerOptions
- Modules
- test_auth_api.py
- Chunk
- dubbing.py
- request
- useAuth
- scripts
- react
- auth/index.ts
- utils.tsx
- auth/service.py
- passwords.py
- RecorderPage.tsx
- useRecorder.ts
- PatronOnly
- ScanPage.tsx
- postJson
- LLMClient
- JobFailedError
- ReplyPage.tsx
- LoginForm.tsx
- Reusable, strictly typed units
- backend.ts
- RecordControls
- MaintenanceFormPage.tsx
- current_user
- validation_error
- rules
- LanguageCode
- useVideoPlayer.ts
- usta.test.tsx
- useQrScanner.ts
- verify.sh
- settings.json
- useCamera.ts
- accept_refinement
- DemoLogin.tsx
- reembed_job
- Database migrations (Alembic)
- FakeXhr
- maintenance.test.tsx
- asyncio
- test_health.py
- get_session
- tsconfig.json
- post-edit.sh
- session-start.sh
- feature/SKILL.md
- ticket/SKILL.md
- dev.sh
- README.md
- usta-backend

## God Nodes (most connected - your core abstractions)
1. `Modules` - 127 edges
2. `AppContext` - 100 edges
3. `@testing-library/react` - 90 edges
4. `Role` - 84 edges
5. `User` - 73 edges
6. `Machine` - 70 edges
7. `react-router` - 63 edges
8. `react` - 54 edges
9. `AIUnavailableError` - 47 edges
10. `Video` - 47 edges

## Surprising Connections (you probably didn't know these)
- `Modules` --references--> `GeminiLLM`  [INFERRED]
  CLAUDE.md → backend/app/ai/gemini.py
- `Modules` --references--> `AIUnavailableError`  [INFERRED]
  CLAUDE.md → backend/app/ai/interfaces.py
- `AI / LLM (backend)` --references--> `AIUnavailableError`  [INFERRED]
  .claude/skills/reusable-component/SKILL.md → backend/app/ai/interfaces.py
- `Modules` --references--> `Transcriber`  [INFERRED]
  CLAUDE.md → backend/app/ai/interfaces.py
- `Modules` --references--> `Embedder`  [INFERRED]
  CLAUDE.md → backend/app/ai/interfaces.py

## Import Cycles
- None detected.

## Communities (117 total, 37 thin omitted)

### Community 0 - "AppLayout.tsx"
Cohesion: 0.05
Nodes (44): AlertList, Language, AppLayout(), NavBar(), NAV, NavItem, filterOptions(), normalize() (+36 more)

### Community 1 - "User"
Cohesion: 0.07
Nodes (17): _font(), machine_url(), _qr(), sticker_sheet(), svg(), create_machine(), get_machine(), lookup() (+9 more)

### Community 2 - "documents/service.py"
Cohesion: 0.07
Nodes (20): lang_name(), Document, DocumentPage, DocumentSummaryText, DocumentType, SummaryStatus, delete_document(), get_document() (+12 more)

### Community 3 - "questions/service.py"
Cohesion: 0.08
Nodes (28): LocalizedText, Question, answer(), ask_usta(), get_question(), inbox(), MachineRef, my_questions() (+20 more)

### Community 4 - "auth/router.py"
Cohesion: 0.09
Nodes (15): LanguageIn, _log_in(), login(), logout(), me(), register(), _set_cookie(), set_language() (+7 more)

### Community 5 - "sqlalchemy"
Cohesion: 0.10
Nodes (11): utcnow(), Base, MaintenanceAttachment, do_run_migrations(), run_async_migrations(), upgrade(), upgrade(), upgrade() (+3 more)

### Community 6 - "AppRoutes.tsx"
Cohesion: 0.10
Nodes (26): AdminMachineList, AdminUser, DocumentDetail, useApi(), AppRoutes(), AsyncView(), PageTitle(), AdminMachinesPage() (+18 more)

### Community 7 - "AIUnavailableError"
Cohesion: 0.09
Nodes (17): DisabledLLM, _FreeEndpoint, GoogleFreeTranslator, GoogleFreeTTS, _mp3_to_wav(), parse_translation(), split_for_speech(), AIUnavailableError (+9 more)

### Community 8 - "api/index.ts"
Cohesion: 0.09
Nodes (26): AnswerSource, AskFeedback, AskResult, LocalizedText, MachineIn, QuestionSent, ActionState, useAction() (+18 more)

### Community 9 - "media.py"
Cohesion: 0.05
Nodes (37): dub_track(), duration(), extract_audio(), gray_frame(), MediaError, mux_dub(), _pgm(), place_clips() (+29 more)

### Community 10 - "pipeline.py"
Cohesion: 0.12
Nodes (23): Snapshot, TranscriptSegment, VideoStep, _audio(), _audio16k(), _clips_dir(), create_steps(), _finished() (+15 more)

### Community 11 - "handlers.ts"
Cohesion: 0.08
Nodes (33): MachineActions, App(), start(), DEMO_LOGINS, forkliftPage(), load(), resetMockDb(), save() (+25 more)

### Community 12 - "ask/service.py"
Cohesion: 0.10
Nodes (17): AskLog, ask_feedback(), ask_machine(), FeedbackIn, answer_question(), Answered, _date(), _describe() (+9 more)

### Community 13 - "react-router"
Cohesion: 0.08
Nodes (29): DocumentSummary, MachineHit, MaintenanceRecord, QaEntry, UstaProfile, ApiState, EmptyState(), Localized() (+21 more)

### Community 14 - "api/types.ts"
Cohesion: 0.12
Nodes (21): AdminMachineRow, AdminStats, Alert, AskIn, Attachment, AuthorizedPerson, ExternalVideoIn, InboxQuestion (+13 more)

### Community 15 - "MachinePage.tsx"
Cohesion: 0.20
Nodes (9): archiveMachine(), machineQrUrl(), machineStickerUrl(), MachineHeader(), m, MachineQr(), UstaList(), highlightFrom() (+1 more)

### Community 16 - "Protocol"
Cohesion: 0.12
Nodes (4): Embedder, Reranker, Transcriber, TTSEngine

### Community 17 - "VideoPage.tsx"
Cohesion: 0.14
Nodes (14): TranscriptSegment, VideoLanguageTrack, MachineTable(), CameraView(), Props, Player(), Props, Props (+6 more)

### Community 18 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.6, devDependencies, jsdom@^28.1.0, oxlint@^1.90.0, @playwright/test@^1.65.1 (+27 more)

### Community 19 - "queue.py"
Cohesion: 0.14
Nodes (6): Job, JobStatus, get_job(), job_out(), job_socket(), JobOut

### Community 20 - "AppContext"
Cohesion: 0.06
Nodes (73): Role, AppContext, get_ctx(), DubbedVersion, FakeAI, docx(), photo(), scanned_pdf() (+65 more)

### Community 21 - "Video"
Cohesion: 0.16
Nodes (19): lang_tr_name(), StepStatus, Video, dubbed_rel(), subtitle_rel(), availability(), detail(), _done() (+11 more)

### Community 22 - "machines/router.py"
Cohesion: 0.09
Nodes (18): ExternalVideoAdmin, require_role(), check(), languages(), LoginIn, Language, forbidden(), not_found() (+10 more)

### Community 23 - "VideoList.tsx"
Cohesion: 0.14
Nodes (15): ExternalVideo, VideoAvailability, VideoSummary, Pill(), PillTone, ExternalVideoItem(), AVAILABILITY, StatusPill() (+7 more)

### Community 24 - "startup"
Cohesion: 0.40
Nodes (3): lifespan(), startup(), _warm_up()

### Community 25 - "fixtures.ts"
Cohesion: 0.10
Nodes (16): app(), NoSocket, show(), adminUsers, alertList, askAnswered, askNotFound, documentDetail (+8 more)

### Community 26 - "User"
Cohesion: 0.08
Nodes (17): MachineAdmin, MaintenanceAdmin, QuestionAdmin, _take_upload(), UserAdmin, User, valid_password(), Machine (+9 more)

### Community 27 - "Modules"
Cohesion: 0.26
Nodes (5): DocumentAdmin, _drop_vectors(), _remove_folder(), VideoAdmin, Owner

### Community 28 - "fakes.py"
Cohesion: 0.13
Nodes (10): TranscriptionResult, _Failing, FakeEmbedder, FakeLLM, FakeReranker, FakeTranscriber, FakeTranslator, FakeTTS (+2 more)

### Community 29 - "machines/service.py"
Cohesion: 0.09
Nodes (23): AuthorizedPerson, PersonRef, has_content(), safe_name(), save_upload(), url(), machine_out(), machine_page() (+15 more)

### Community 30 - "db"
Cohesion: 0.13
Nodes (13): alerts_socket(), ai(), app(), client(), client_as(), make(), ctx(), ctx_of() (+5 more)

### Community 31 - "@testing-library/react"
Cohesion: 0.18
Nodes (7): a, ustas, v, hit, adminMachines, @testing-library/react, @testing-library/user-event

### Community 32 - "interfaces.py"
Cohesion: 0.15
Nodes (8): Translator, _store_summaries(), Translation, languages_in_use(), source_hash(), stored(), translate(), translate_everywhere()

### Community 33 - "extract.py"
Cohesion: 0.06
Nodes (35): ocr_image(), OCRError, _csv(), _decode(), _docx(), extract(), Extracted, _image() (+27 more)

### Community 34 - "timeline.py"
Cohesion: 0.11
Nodes (19): WhisperSegment, Word, FasterWhisperTranscriber, _read_wav(), build_sentence_timeline(), compute_speaking_rate(), format_timestamp(), RateSummary (+11 more)

### Community 35 - "Settings"
Cohesion: 0.09
Nodes (9): client(), _Points, _Queries, _Sentence, _Sentences, Settings, cli_uses_test_db(), test_gemini_client_uses_vertex_or_a_key() (+1 more)

### Community 36 - "videos/router.py"
Cohesion: 0.17
Nodes (12): start(), create_video(), delete_video(), get_video(), prepare_language(), retry_step(), upload_video(), _video() (+4 more)

### Community 38 - "admin/router.py"
Cohesion: 0.13
Nodes (12): admin_machines(), admin_users(), AdminMachineList, AdminMachineRow, AdminStats, AdminUser, _count(), _counts() (+4 more)

### Community 39 - "test_admin.py"
Cohesion: 0.26
Nodes (8): _can_log_in(), test_admin_machines_stats_and_search(), test_admin_users_lists_roles_and_machines(), test_maintenance_records_are_read_only_in_sqladmin(), test_patron_resets_a_password_in_sqladmin(), test_sqladmin_lets_only_patrons_in(), test_sqladmin_login_form_accepts_only_patrons(), test_uploads_need_login_and_stay_inside_the_folder()

### Community 41 - "sqlalchemy_ext_asyncio"
Cohesion: 0.23
Nodes (7): Alert, list_alerts(), mark_read(), alert_list(), AlertList, AlertOut, notify()

### Community 42 - "GeminiLLM"
Cohesion: 0.19
Nodes (6): GeminiLLM, answer_system(), answer_user(), refine_transcript(), search_queries(), summarize()

### Community 43 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 44 - "build"
Cohesion: 0.11
Nodes (4): build(), CrossEncoderReranker, E5Embedder, _identity()

### Community 45 - "tokenize"
Cohesion: 0.21
Nodes (5): BM25, normalize(), tokenize(), test_bm25_finds_the_exact_error_code(), test_tokenize_keeps_codes_whole_and_ignores_case_and_accents()

### Community 46 - "main.py"
Cohesion: 0.07
Nodes (17): AlertHub, main(), run(), get_settings(), make_engine(), make_sessionmaker(), main(), run() (+9 more)

### Community 47 - "usta (Usta Hafızası)"
Cohesion: 0.11
Nodes (14): VectorStore, include_object(), API, Architecture, Commands, Current status (update at the end of each working day), Decisions, Engineering rules (always apply) (+6 more)

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 49 - "Modules"
Cohesion: 0.18
Nodes (13): AIServices, rrf_merge(), Chunk, Candidate, ChunkIn, delete_chunks(), embed_and_store(), hybrid_search() (+5 more)

### Community 50 - "test_auth_api.py"
Cohesion: 0.29
Nodes (11): AuthSession, test_expired_session_is_rejected(), test_login_with_differently_written_phone(), test_login_wrong_password_or_unknown_login_is_401(), test_logout_ends_the_session_on_the_server(), test_me_without_session_is_401(), test_register_as_usta(), test_register_cannot_pick_technician_or_patron() (+3 more)

### Community 51 - "Chunk"
Cohesion: 0.22
Nodes (11): Case, EvalSet, Expected, hit_rank(), matches(), report(), Report, main() (+3 more)

### Community 52 - "dubbing.py"
Cohesion: 0.26
Nodes (12): fit_clip_to_slot(), Placement, plan_dub(), Slot, srt(), _ts(), vtt(), test_a_clip_that_does_not_fit_borrows_from_the_next_pause() (+4 more)

### Community 53 - "request"
Cohesion: 0.23
Nodes (11): Frontend: API calls and hooks (reuse these, don't write new ones), API_BASE, ApiError, errorMessage(), parse(), postForm(), request(), uploadWithProgress() (+3 more)

### Community 54 - "useAuth"
Cohesion: 0.29
Nodes (7): Spinner(), app(), Logout(), me, useAuth(), LoginPage(), RequireAuth()

### Community 55 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, dev:mock, init, lint, preview, test (+4 more)

### Community 56 - "react"
Cohesion: 0.08
Nodes (29): DocumentType, ExternalSource, Machine, PersonRef, Button(), ButtonProps, Field(), DocumentUploadIn (+21 more)

### Community 57 - "auth/index.ts"
Cohesion: 0.20
Nodes (9): RegisterRole, AuthShell(), RegisterForm(), submit(), ROLES, HOME_BY_ROLE, ROLE_LABEL, fromState() (+1 more)

### Community 58 - "utils.tsx"
Cohesion: 0.10
Nodes (19): show(), OkXhr, show(), Xhr, persian, preparing, show(), ME (+11 more)

### Community 59 - "auth/service.py"
Cohesion: 0.20
Nodes (9): authenticate(), create_user(), end_session(), LoginTakenError, set_role(), start_session(), _token_hash(), user_for_token() (+1 more)

### Community 60 - "passwords.py"
Cohesion: 0.36
Nodes (6): hash_password(), _scrypt(), verify_password(), test_garbage_hash_is_rejected_not_raised(), test_hash_verifies_only_the_same_password(), test_same_password_gets_a_different_salt()

### Community 61 - "RecorderPage.tsx"
Cohesion: 0.11
Nodes (14): PipelineStep, Preparation, StepStatus, ProgressBar(), MARK, STATUS_TEXT, StepList(), MachineSelect() (+6 more)

### Community 62 - "useRecorder.ts"
Cohesion: 0.16
Nodes (6): pickType(), FakeRecorder, TYPES, useRecorder(), start(), Clip

### Community 64 - "ScanPage.tsx"
Cohesion: 0.33
Nodes (3): CodeForm(), lookup(), ScanPage()

### Community 65 - "postJson"
Cohesion: 0.54
Nodes (7): postJson(), fetchMe(), login(), logout(), register(), updateLanguage(), AuthProvider()

### Community 67 - "JobFailedError"
Cohesion: 0.33
Nodes (3): JobFailedError, test_jobs_run_in_order_record_progress_and_failures(), known()

### Community 68 - "ReplyPage.tsx"
Cohesion: 0.22
Nodes (10): ReplyIn, ReplyKind, sendAnswer(), KINDS, ReplyForm(), useQuestionIn(), ReplyState, useReply() (+2 more)

### Community 69 - "LoginForm.tsx"
Cohesion: 0.43
Nodes (3): loginError(), LoginForm(), submit()

### Community 70 - "Reusable, strictly typed units"
Cohesion: 0.33
Nodes (5): AI / LLM (backend), Frontend is thin: all complex logic lives in the backend, Frontend: one feature, many small components, Frontend: presentational component, Reusable, strictly typed units

### Community 71 - "backend.ts"
Cohesion: 0.30
Nodes (6): Body, defaults(), Handler, mockBackend(), Routes, @playwright/test

### Community 73 - "MaintenanceFormPage.tsx"
Cohesion: 0.21
Nodes (8): MaintenanceFormOptions, HomeRedirect(), useMe(), createMaintenance(), MaintenanceForm(), MeCard(), MaintenanceFormPage(), save()

### Community 76 - "rules"
Cohesion: 0.20
Nodes (9): plugins, rules, jsx-a11y/media-has-caption, react/exhaustive-deps, react/only-export-components, react/rules-of-hooks, typescript/ban-ts-comment, typescript/no-explicit-any (+1 more)

### Community 77 - "LanguageCode"
Cohesion: 0.51
Nodes (7): LanguageCode, LoginIn, Me, RegisterIn, AuthContext, AuthContextValue, AuthState

### Community 78 - "useVideoPlayer.ts"
Cohesion: 0.36
Nodes (6): VideoDetail, requestLanguage(), retryStep(), preparing(), SubtitleChoice, useVideoPlayer()

### Community 79 - "usta.test.tsx"
Cohesion: 0.25
Nodes (3): FakeSocket, home(), OkXhr

### Community 81 - "useQrScanner.ts"
Cohesion: 0.31
Nodes (6): QrScanner(), cameraError(), Detector, DetectorClass, scanUnavailable(), useQrScanner()

### Community 83 - "verify.sh"
Cohesion: 0.43
Nodes (6): add(), changed_since_start(), has(), py(), reset(), verify.sh script

### Community 86 - "settings.json"
Cohesion: 0.29
Nodes (6): hooks, PostToolUse, Stop, permissions, deny, $schema

### Community 88 - "useCamera.ts"
Cohesion: 0.38
Nodes (5): cameraError(), Facing, stream, track, useCamera()

### Community 89 - "accept_refinement"
Cohesion: 0.53
Nodes (3): accept_refinement(), test_corrections_of_similar_length_are_taken(), test_empty_or_rewritten_corrections_keep_whisper_text()

### Community 95 - "Database migrations (Alembic)"
Cohesion: 0.40
Nodes (4): Changing the schema, Database migrations (Alembic), Deploying to a cloud platform, Platform without a shell (SQL console only)

### Community 99 - "asyncio"
Cohesion: 0.12
Nodes (11): abs_path(), root(), remove_document(), get_upload(), remove_video(), TopicSegment, _mix(), _next_pause() (+3 more)

## Knowledge Gaps
- **1 isolated node(s):** `usta-backend`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 665 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Modules` connect `Modules` to `AppLayout.tsx`, `documents/service.py`, `questions/service.py`, `auth/router.py`, `sqlalchemy`, `AppRoutes.tsx`, `AIUnavailableError`, `api/index.ts`, `media.py`, `pipeline.py`, `ask/service.py`, `Protocol`, `queue.py`, `AppContext`, `Video`, `machines/router.py`, `startup`, `User`, `Modules`, `machines/service.py`, `db`, `interfaces.py`, `extract.py`, `timeline.py`, `Settings`, `videos/router.py`, `JobQueue`, `admin/router.py`, `ChromaVectorStore`, `sqlalchemy_ext_asyncio`, `GeminiLLM`, `build`, `tokenize`, `main.py`, `usta (Usta Hafızası)`, `test_auth_api.py`, `dubbing.py`, `request`, `useAuth`, `auth/index.ts`, `utils.tsx`, `RecorderPage.tsx`, `useRecorder.ts`, `PatronOnly`, `postJson`, `LLMClient`, `JobFailedError`, `ReplyPage.tsx`, `MaintenanceFormPage.tsx`, `useVideoPlayer.ts`, `useQrScanner.ts`, `useCamera.ts`, `accept_refinement`, `asyncio`?**
  _High betweenness centrality (0.475) - this node is a cross-community bridge._
- **Are the 126 inferred relationships involving `Modules` (e.g. with `PatronOnly` and `ChromaVectorStore`) actually correct?**
  _`Modules` has 126 INFERRED edges - model-reasoned connections that need verification._
- **What connects `usta-backend` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppLayout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05359831376091539 - nodes in this community are weakly interconnected._
- **Why does `AppContext` connect `AppContext` to `documents/service.py`, `questions/service.py`, `pipeline.py`, `ask/service.py`, `queue.py`, `machines/router.py`, `startup`, `User`, `db`, `interfaces.py`, `extract.py`, `Settings`, `videos/router.py`, `JobQueue`, `sqlalchemy_ext_asyncio`, `main.py`, `usta (Usta Hafızası)`, `Modules`, `PatronOnly`, `JobFailedError`, `reembed_job`, `asyncio`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 62 inferred relationships involving `AppContext` (e.g. with `mount()` and `alerts_socket()`) actually correct?**
  _`AppContext` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.07293868921775898 - nodes in this community are weakly interconnected._