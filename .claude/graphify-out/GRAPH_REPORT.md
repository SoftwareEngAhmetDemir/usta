# Graph Report - usta  (2026-11-25)

## Corpus Check
- 548 files · ~110,446 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .ini 1)

## Summary
- 2733 nodes · 9018 edges · 134 communities (87 shown, 47 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 778 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63c76d19`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ask/service.py
- User
- documents/service.py
- questions/service.py
- Me
- sqlalchemy
- Xhr
- AIUnavailableError
- VideoItem.tsx
- api/types.ts
- pipeline.py
- auth/index.ts
- translate_ui
- AppContext
- @testing-library/react
- queue.py
- videos/service.py
- translations/service.py
- package.json
- PlayerSettings.tsx
- AppContext
- videos/router.py
- conftest.py
- Settings
- test_auth_api.py
- MachineTable.tsx
- VideoPage.tsx
- useT
- fakes.py
- admin/router.py
- RecorderPage.tsx
- ask/api.ts
- zxing.ts
- extract.py
- timeline.py
- media.py
- LanguageGate.test.tsx
- AlertsProvider.tsx
- api/index.ts
- search/service.py
- components.json
- vite.config.ts
- process
- compilerOptions
- build
- OkXhr
- Xhr
- alerts/router.py
- compilerOptions
- LLMClient
- OkXhr
- eval_retrieval.py
- test_machines.py
- scripts
- react
- handlers.ts
- @testing-library/react
- dubbing.py
- chunking.py
- NewMachinePage.tsx
- ScanPage.test.tsx
- auth/service.py
- VideoStep
- ScanPage.tsx
- lang_name
- Chip
- dependencies
- FakeQrScanner
- PlayerSettings.tsx
- backend.ts
- Card
- AppLayout.tsx
- views.py
- usta (Usta Hafızası)
- rules
- ApiError
- useApi.ts
- dialog.tsx
- useQrScanner.ts
- package.json
- verify.sh
- useVideoPlayer.ts
- gemini.py
- settings.json
- ocr_image
- LanguageMenu.tsx
- accept_refinement
- asyncio
- postJson
- validation_error
- test_ui_texts_come_in_the_users_language_and_are_translated_once
- Database migrations (Alembic)
- save_upload
- usta/api.ts
- useCamera.ts
- tsconfig.json
- post-edit.sh
- session-start.sh
- feature/SKILL.md
- ticket/SKILL.md
- dev.sh
- README.md
- usta-backend
- FakeSocket
- AuthorizedBadge.tsx
- get_upload

## God Nodes (most connected - your core abstractions)
1. `useT()` - 173 edges
2. `Modules` - 143 edges
3. `@testing-library/react` - 103 edges
4. `AppContext` - 102 edges
5. `Role` - 90 edges
6. `react` - 88 edges
7. `User` - 74 edges
8. `Card()` - 73 edges
9. `react-router` - 68 edges
10. `lucide-react` - 66 edges

## Surprising Connections (you probably didn't know these)
- `Modules` --references--> `installZxing()`  [INFERRED]
  CLAUDE.md → frontend/src/features/scan/zxing.ts
- `Current status (update at the end of each working day)` --references--> `useUiBusyNow()`  [INFERRED]
  CLAUDE.md → frontend/src/i18n/useUiLoading.ts
- `Architecture` --references--> `AppContext`  [INFERRED]
  CLAUDE.md → backend/app/context.py
- `Architecture` --references--> `create_app()`  [INFERRED]
  CLAUDE.md → backend/app/main.py
- `Architecture` --references--> `Localizer`  [INFERRED]
  CLAUDE.md → backend/app/translations/service.py

## Import Cycles
- None detected.

## Communities (134 total, 47 thin omitted)

### Community 0 - "ask/service.py"
Cohesion: 0.11
Nodes (14): AskLog, ask_feedback(), ask_machine(), FeedbackIn, answer_question(), Answered, _date(), _describe() (+6 more)

### Community 1 - "User"
Cohesion: 0.05
Nodes (48): require_role(), check(), User, AuthorizedPerson, PersonRef, url(), forbidden(), Machine (+40 more)

### Community 2 - "documents/service.py"
Cohesion: 0.10
Nodes (14): DocumentSummaryText, DocumentType, SummaryStatus, delete_document(), get_document(), upload_document(), detail_out(), DocumentDetail (+6 more)

### Community 3 - "questions/service.py"
Cohesion: 0.06
Nodes (36): notify(), localized(), LocalizedText, Question, QuestionStatus, answer(), ask_usta(), get_question() (+28 more)

### Community 4 - "Me"
Cohesion: 0.11
Nodes (10): LanguageIn, _log_in(), login(), logout(), me(), register(), _set_cookie(), set_language() (+2 more)

### Community 5 - "sqlalchemy"
Cohesion: 0.08
Nodes (13): utcnow(), Base, DocumentPage, MaintenanceAttachment, do_run_migrations(), run_async_migrations(), upgrade(), upgrade() (+5 more)

### Community 7 - "AIUnavailableError"
Cohesion: 0.09
Nodes (15): DisabledLLM, _mp3_to_wav(), parse_translation(), split_for_speech(), AIUnavailableError, AnswerDraft, _mp3(), test_parse_translation_joins_the_pieces() (+7 more)

### Community 8 - "VideoItem.tsx"
Cohesion: 0.08
Nodes (28): DocumentSummary, VideoAvailability, VideoSummary, ListItem(), Props, Kind, KIND, Thumb() (+20 more)

### Community 9 - "api/types.ts"
Cohesion: 0.08
Nodes (30): API_BASE, AdminMachineList, AdminMachineRow, AdminUser, AskIn, Attachment, DocumentType, ExternalSource (+22 more)

### Community 10 - "pipeline.py"
Cohesion: 0.10
Nodes (34): _drop_vectors(), _remove_folder(), VideoAdmin, abs_path(), root(), Owner, remove_video(), Snapshot (+26 more)

### Community 11 - "auth/index.ts"
Cohesion: 0.20
Nodes (12): Spinner(), app(), Logout(), me, AuthShell(), HOME_BY_ROLE, ROLE_LABEL, useAuth() (+4 more)

### Community 12 - "translate_ui"
Cohesion: 0.25
Nodes (3): translate_ui(), UiTextsIn, UiTextsOut

### Community 13 - "AppContext"
Cohesion: 0.24
Nodes (18): AppContext, DubbedVersion, FakeAI, _audio_tracks(), _max_volume_db(), test_a_language_without_a_voice_gets_subtitles_only(), test_broken_video_fails_cleanly(), test_delete_video_removes_everything_made_from_it() (+10 more)

### Community 14 - "@testing-library/react"
Cohesion: 0.06
Nodes (14): a, ustas, v, ext, video, hit, click(), persian (+6 more)

### Community 15 - "queue.py"
Cohesion: 0.06
Nodes (14): AlertHub, languages(), Language, not_found(), Health, health(), Job, JobStatus (+6 more)

### Community 16 - "videos/service.py"
Cohesion: 0.17
Nodes (19): lang_dir(), lang_tr_name(), StepStatus, availability(), detail(), _done(), PipelineStepOut, preparation() (+11 more)

### Community 17 - "translations/service.py"
Cohesion: 0.17
Nodes (10): Translator, Translation, _framed(), languages_in_use(), source_hash(), stored(), translate(), ui_texts() (+2 more)

### Community 18 - "package.json"
Cohesion: 0.13
Nodes (15): devDependencies, jsdom@^28.1.0, oxlint@^1.90.0, @playwright/test@^1.65.1, tailwindcss@^4.3.5, @testing-library/jest-dom@^8.0.0, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.13 (+7 more)

### Community 19 - "PlayerSettings.tsx"
Cohesion: 0.17
Nodes (15): filterOptions(), normalize(), SearchOption, options, Props, SearchSelect(), options, setup() (+7 more)

### Community 20 - "AppContext"
Cohesion: 0.06
Nodes (52): Role, _font(), machine_url(), _qr(), sticker_sheet(), svg(), _can_log_in(), test_admin_machines_stats_and_search() (+44 more)

### Community 21 - "videos/router.py"
Cohesion: 0.16
Nodes (11): create_steps(), start(), create_video(), delete_video(), get_video(), prepare_language(), retry_step(), upload_video() (+3 more)

### Community 22 - "conftest.py"
Cohesion: 0.06
Nodes (36): main(), run(), normalize_login(), RegisterIn, _valid_login(), get_settings(), make_engine(), make_sessionmaker() (+28 more)

### Community 23 - "Settings"
Cohesion: 0.09
Nodes (13): build(), client(), _FreeEndpoint, GoogleFreeTranslator, GoogleFreeTTS, CrossEncoderReranker, Settings, cli_uses_test_db() (+5 more)

### Community 24 - "test_auth_api.py"
Cohesion: 0.33
Nodes (10): test_expired_session_is_rejected(), test_login_with_differently_written_phone(), test_login_wrong_password_or_unknown_login_is_401(), test_logout_ends_the_session_on_the_server(), test_me_without_session_is_401(), test_register_as_usta(), test_register_cannot_pick_technician_or_patron(), test_register_creates_a_worker_and_logs_in() (+2 more)

### Community 25 - "MachineTable.tsx"
Cohesion: 0.24
Nodes (11): Pill(), PillTone, TONE_CLASS, Table(), TableBody(), TableCell(), TableHead(), TableHeader() (+3 more)

### Community 26 - "VideoPage.tsx"
Cohesion: 0.16
Nodes (11): TranscriptSegment, Collapsible(), CollapsibleContent(), CollapsibleTrigger(), CaptionsButton(), Player(), PreparationCard(), Props (+3 more)

### Community 27 - "useT"
Cohesion: 0.10
Nodes (31): DocumentDetail, useApi(), AppRoutes(), HomeRedirect(), UserLanguage(), AsyncView(), PageTitle(), ProgressBar() (+23 more)

### Community 28 - "fakes.py"
Cohesion: 0.08
Nodes (12): ChromaVectorStore, TranscriptionResult, VectorHit, _Failing, FakeEmbedder, FakeLLM, FakeReranker, FakeTranscriber (+4 more)

### Community 29 - "admin/router.py"
Cohesion: 0.12
Nodes (13): admin_machines(), admin_users(), AdminMachineList, AdminMachineRow, AdminStats, AdminUser, _count(), _counts() (+5 more)

### Community 30 - "RecorderPage.tsx"
Cohesion: 0.17
Nodes (11): ICON, Notice(), STYLE, Tone, StepList(), AlertTitle(), SummaryCard(), MachineSelect() (+3 more)

### Community 31 - "ask/api.ts"
Cohesion: 0.22
Nodes (12): AskResult, QuestionSent, ActionState, useAction(), askMachine(), askUsta(), sendFeedback(), Exchange (+4 more)

### Community 32 - "zxing.ts"
Cohesion: 0.25
Nodes (5): CODE_FORMATS, load(), Native, prepare, ZxingDetector

### Community 33 - "extract.py"
Cohesion: 0.15
Nodes (16): _csv(), _decode(), _docx(), extract(), Extracted, _image(), _inside(), _looks_like_heading() (+8 more)

### Community 34 - "timeline.py"
Cohesion: 0.10
Nodes (19): WhisperSegment, Word, FasterWhisperTranscriber, _read_wav(), build_sentence_timeline(), compute_speaking_rate(), format_timestamp(), RateSummary (+11 more)

### Community 35 - "media.py"
Cohesion: 0.05
Nodes (37): dub_track(), duration(), extract_audio(), gray_frame(), MediaError, mux_dub(), _pgm(), place_clips() (+29 more)

### Community 36 - "LanguageGate.test.tsx"
Cohesion: 0.10
Nodes (25): Architecture, LanguageGate(), Props, gate(), Page(), usePageReveal(), PageSkeleton(), Skeleton() (+17 more)

### Community 37 - "AlertsProvider.tsx"
Cohesion: 0.14
Nodes (17): Alert, AlertList, app(), FakeSocket, Toast(), unread, AlertsProvider(), alertSocketUrl() (+9 more)

### Community 38 - "api/index.ts"
Cohesion: 0.11
Nodes (18): AnswerSource, AskFeedback, LocalizedText, PipelineStep, QaEntry, StepStatus, ErrorMessage(), Localized() (+10 more)

### Community 39 - "search/service.py"
Cohesion: 0.16
Nodes (9): BM25, normalize(), rrf_merge(), tokenize(), Candidate, hybrid_search(), test_bm25_finds_the_exact_error_code(), test_rrf_merge() (+1 more)

### Community 40 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 41 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.5, vite@^8.3.6, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 42 - "process"
Cohesion: 0.12
Nodes (9): AIServices, job(), process(), ChunkIn, delete_chunks(), embed_and_store(), _owned(), reembed_stale() (+1 more)

### Community 43 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 47 - "alerts/router.py"
Cohesion: 0.20
Nodes (7): Alert, alerts_socket(), list_alerts(), mark_read(), alert_list(), AlertList, AlertOut

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 49 - "LLMClient"
Cohesion: 0.09
Nodes (5): Embedder, LLMClient, Reranker, Transcriber, TTSEngine

### Community 51 - "eval_retrieval.py"
Cohesion: 0.19
Nodes (13): Case, EvalSet, Expected, hit_rank(), matches(), report(), Report, Chunk (+5 more)

### Community 52 - "test_machines.py"
Cohesion: 0.10
Nodes (26): get_ctx(), get_session(), public_url(), code_for_qr(), _request(), test_a_gs1_data_matrix_on_a_box_works_like_a_qr(), test_a_qr_belongs_to_one_machine(), test_actions_depend_on_role_and_assignment() (+18 more)

### Community 55 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, dev:mock, init, lint, preview, test (+4 more)

### Community 56 - "react"
Cohesion: 0.07
Nodes (37): PersonRef, Button(), ButtonProps, VARIANT, Field(), Alert(), AlertDescription(), alertVariants (+29 more)

### Community 57 - "handlers.ts"
Cohesion: 0.05
Nodes (44): MachineActions, MyQuestion, VideoProcessing, App(), pickType(), FakeRecorder, TYPES, useRecorder() (+36 more)

### Community 58 - "@testing-library/react"
Cohesion: 0.09
Nodes (35): app(), NoSocket, Hello(), show(), show(), renderWithState(), show(), home() (+27 more)

### Community 59 - "dubbing.py"
Cohesion: 0.14
Nodes (15): _translated(), fit_clip_to_slot(), Placement, plan_dub(), Slot, srt(), _ts(), vtt() (+7 more)

### Community 60 - "chunking.py"
Cohesion: 0.18
Nodes (14): chunk_document(), chunk_video(), DocChunk, estimate_tokens(), _split_paragraph(), _split_table(), _tail(), TimedText (+6 more)

### Community 61 - "NewMachinePage.tsx"
Cohesion: 0.17
Nodes (7): codeForQr(), createMachine(), NewMachineFrom, newMachineState(), readNewMachineFrom(), useQrCode(), NewMachinePage()

### Community 62 - "ScanPage.test.tsx"
Cohesion: 0.36
Nodes (4): fakeQr, Result, stubQrCamera(), vitest

### Community 63 - "auth/service.py"
Cohesion: 0.11
Nodes (18): current_user(), AuthSession, hash_password(), _scrypt(), verify_password(), authenticate(), create_user(), end_session() (+10 more)

### Community 64 - "VideoStep"
Cohesion: 0.13
Nodes (8): JobFailedError, VideoStep, job(), reset_for_reprocess(), run(), _set(), test_jobs_run_in_order_record_progress_and_failures(), known()

### Community 65 - "ScanPage.tsx"
Cohesion: 0.15
Nodes (5): HINT, QrScanner(), lookup(), noMachine(), ScanPage()

### Community 66 - "lang_name"
Cohesion: 0.21
Nodes (7): GeminiLLM, answer_system(), answer_user(), refine_transcript(), search_queries(), summarize(), lang_name()

### Community 67 - "Chip"
Cohesion: 0.21
Nodes (9): MachineHit, ApiState, Chip(), Props, DemoLogin(), USERS, Props, RecordControls() (+1 more)

### Community 68 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, barcode-detector@^3.2.4, class-variance-authority@^0.7.1, cn@^0.5.2, lucide-react@^1.78.0, qr-scanner@^1.4.2, radix-ui@^1.8.1, react@^19.3.1 (+9 more)

### Community 70 - "PlayerSettings.tsx"
Cohesion: 0.21
Nodes (11): VideoLanguageTrack, Props, overlayButton, PlayerSettings(), Props, setup(), View, menuOptions() (+3 more)

### Community 71 - "backend.ts"
Cohesion: 0.30
Nodes (6): Body, defaults(), Handler, mockBackend(), Routes, @playwright/test

### Community 72 - "Card"
Cohesion: 0.08
Nodes (32): AdminStats, InboxQuestion, UstaProfile, CtaLink(), Props, EmptyState(), QaCard(), SectionTitle() (+24 more)

### Community 73 - "AppLayout.tsx"
Cohesion: 0.20
Nodes (11): Role, AppLayout(), NavBar(), ALERTS, NAV, NavItem, QUESTIONS, RECORD (+3 more)

### Community 74 - "views.py"
Cohesion: 0.07
Nodes (16): DocumentAdmin, ExternalVideoAdmin, MachineAdmin, MaintenanceAdmin, mount(), PatronOnly, QuestionAdmin, _take_upload() (+8 more)

### Community 75 - "usta (Usta Hafızası)"
Cohesion: 0.11
Nodes (13): VectorStore, include_object(), API, Commands, Current status (update at the end of each working day), Decisions, Engineering rules (always apply), Jira (+5 more)

### Community 76 - "rules"
Cohesion: 0.20
Nodes (9): plugins, rules, jsx-a11y/media-has-caption, react/exhaustive-deps, react/only-export-components, react/rules-of-hooks, typescript/ban-ts-comment, typescript/no-explicit-any (+1 more)

### Community 77 - "ApiError"
Cohesion: 0.12
Nodes (16): AI / LLM (backend), Frontend: API calls and hooks (reuse these, don't write new ones), Frontend is thin: all complex logic lives in the backend, Frontend: one feature, many small components, Frontend: presentational component, Reusable, strictly typed units, ApiError, errorMessage() (+8 more)

### Community 78 - "useApi.ts"
Cohesion: 0.24
Nodes (6): PageBusyContext, Data(), usePageBusy(), ApiResult, Poll, Stored

### Community 79 - "dialog.tsx"
Cohesion: 0.25
Nodes (12): Dialog(), DialogClose(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogPortal() (+4 more)

### Community 81 - "useQrScanner.ts"
Cohesion: 0.19
Nodes (18): CameraInfo, cameraRefused(), currentCamera(), FocusCapabilities, FocusConstraints, keepFocusing(), mainBackCamera(), startCamera() (+10 more)

### Community 82 - "package.json"
Cohesion: 0.15
Nodes (12): @testing-library/dom@^10.4.2, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@~7.0.2, name, private, type, version (+4 more)

### Community 83 - "verify.sh"
Cohesion: 0.43
Nodes (6): add(), changed_since_start(), has(), py(), reset(), verify.sh script

### Community 84 - "useVideoPlayer.ts"
Cohesion: 0.31
Nodes (9): Preparation, VideoDetail, requestLanguage(), retryStep(), preparing(), SubtitleChoice, useVideoPlayer(), request() (+1 more)

### Community 85 - "gemini.py"
Cohesion: 0.27
Nodes (4): _Points, _Queries, _Sentence, _Sentences

### Community 86 - "settings.json"
Cohesion: 0.22
Nodes (8): env, GRAPHIFY_OUT, hooks, PostToolUse, Stop, permissions, deny, $schema

### Community 88 - "LanguageMenu.tsx"
Cohesion: 0.47
Nodes (4): Language, LanguageMenu(), Props, languageOption()

### Community 89 - "accept_refinement"
Cohesion: 0.53
Nodes (3): accept_refinement(), test_corrections_of_similar_length_are_taken(), test_empty_or_rewritten_corrections_keep_whisper_text()

### Community 90 - "asyncio"
Cohesion: 0.33
Nodes (3): remove_document(), startup(), _warm_up()

### Community 91 - "postJson"
Cohesion: 0.29
Nodes (14): postJson(), LanguageCode, LoginIn, Me, RegisterIn, fetchMe(), login(), logout() (+6 more)

### Community 95 - "Database migrations (Alembic)"
Cohesion: 0.40
Nodes (4): Changing the schema, Database migrations (Alembic), Deploying to a cloud platform, Platform without a shell (SQL console only)

### Community 99 - "usta/api.ts"
Cohesion: 0.39
Nodes (6): ReplyIn, ReplyKind, sendAnswer(), ReplyState, useReply(), send()

### Community 100 - "useCamera.ts"
Cohesion: 0.38
Nodes (5): cameraError(), Facing, stream, track, useCamera()

### Community 103 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, files, references

### Community 121 - "AuthorizedBadge.tsx"
Cohesion: 0.15
Nodes (11): AuthorizedPerson, MaintenanceRecord, AuthorizedBadge(), base, MaintenanceTimeline(), Props, Badge(), badgeVariants (+3 more)

## Knowledge Gaps
- **1 isolated node(s):** `usta-backend`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 774 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Modules` connect `dubbing.py` to `ask/service.py`, `User`, `documents/service.py`, `questions/service.py`, `sqlalchemy`, `AIUnavailableError`, `pipeline.py`, `auth/index.ts`, `AppContext`, `queue.py`, `translations/service.py`, `videos/router.py`, `conftest.py`, `Settings`, `useT`, `fakes.py`, `admin/router.py`, `ask/api.ts`, `timeline.py`, `media.py`, `LanguageGate.test.tsx`, `AlertsProvider.tsx`, `search/service.py`, `process`, `build`, `LLMClient`, `eval_retrieval.py`, `test_machines.py`, `handlers.ts`, `@testing-library/react`, `chunking.py`, `NewMachinePage.tsx`, `ScanPage.test.tsx`, `auth/service.py`, `VideoStep`, `lang_name`, `FakeQrScanner`, `Card`, `AppLayout.tsx`, `views.py`, `usta (Usta Hafızası)`, `ApiError`, `useApi.ts`, `useQrScanner.ts`, `useVideoPlayer.ts`, `LanguageMenu.tsx`, `accept_refinement`, `asyncio`, `postJson`, `save_upload`, `useCamera.ts`?**
  _High betweenness centrality (0.480) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useT()` (e.g. with `Architecture` and `Modules`) actually correct?**
  _`useT()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `usta-backend` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ask/service.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11264367816091954 - nodes in this community are weakly interconnected._
- **Why does `useT()` connect `Card` to `VideoItem.tsx`, `api/types.ts`, `auth/index.ts`, `PlayerSettings.tsx`, `MachineTable.tsx`, `VideoPage.tsx`, `useT`, `RecorderPage.tsx`, `LanguageGate.test.tsx`, `AlertsProvider.tsx`, `api/index.ts`, `react`, `@testing-library/react`, `dubbing.py`, `Chip`, `PlayerSettings.tsx`, `AppLayout.tsx`, `LanguageMenu.tsx`, `AuthorizedBadge.tsx`?**
  _High betweenness centrality (0.255) - this node is a cross-community bridge._
- **Are the 142 inferred relationships involving `Modules` (e.g. with `PatronOnly` and `ChromaVectorStore`) actually correct?**
  _`Modules` has 142 INFERRED edges - model-reasoned connections that need verification._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.05112347969490827 - nodes in this community are weakly interconnected._