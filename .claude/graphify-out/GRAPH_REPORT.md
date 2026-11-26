# Graph Report - usta  (2026-11-26)

## Corpus Check
- 563 files · ~116,483 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .ini 1)

## Summary
- 2881 nodes · 9132 edges · 166 communities (91 shown, 75 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 643 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1faaff05`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- i18n.py
- main.py
- conftest.py
- questions/service.py
- AppContext
- sqlalchemy
- AIUnavailableError
- jobs/router.py
- api/index.ts
- pipeline.py
- topics.py
- User
- @testing-library/react
- Card
- auth/index.ts
- SessionDep
- AIUnavailableError
- package.json
- PlayerSettings.tsx
- Role
- chunking.py
- VideoItem.tsx
- Settings
- cn
- fixture
- AppRoutes.tsx
- fakes.py
- VideoPage.tsx
- create_video
- ask/api.ts
- zxing.ts
- extract.py
- timeline.py
- media.py
- LanguageGate.test.tsx
- UsersPage.tsx
- useT
- videos/service.py
- components.json
- evaluation.py
- Modules
- compilerOptions
- build
- RecorderPage.tsx
- test_auth_api.py
- alerts/router.py
- compilerOptions
- LLMClient
- DeleteContentDialog.tsx
- MachinePage.tsx
- test_machines.py
- passwords.py
- scripts
- i18n/index.ts
- api/types.ts
- fixtures.ts
- dubbing.py
- hybrid_search
- NewMachinePage.tsx
- utils.tsx
- auth/service.py
- run
- ask/service.py
- lang_name
- VideoPage.test.tsx
- dependencies
- FakeQrScanner
- db.ts
- backend.ts
- alerts.test.tsx
- ScanPage.tsx
- Request
- usta (Usta Hafızası)
- rules
- MachineTable.tsx
- useApi.ts
- ApiError
- useQrScanner.ts
- ocr_image
- verify.sh
- useVideoPlayer.ts
- db
- settings.json
- current_user
- test_ui_texts_come_in_the_users_language_and_are_translated_once
- accept_refinement
- translate_ui
- views.py
- Database migrations (Alembic)
- InboxList.tsx
- AppLayout.tsx
- LanguageCode
- OkXhr
- useCamera.ts
- job
- Xhr
- tsconfig.json
- post-edit.sh
- session-start.sh
- feature/SKILL.md
- ticket/SKILL.md
- dev.sh
- README.md
- usta-backend
- FakeSocket
- questions/service.py
- OkXhr
- Xhr
- validation_error
- lucide-react

## God Nodes (most connected - your core abstractions)
1. `useT()` - 161 edges
2. `Modules` - 150 edges
3. `@testing-library/react` - 108 edges
4. `AppContext` - 104 edges
5. `react` - 89 edges
6. `Card()` - 73 edges
7. `react-router` - 73 edges
8. `User` - 71 edges
9. `lucide-react` - 69 edges
10. `Role` - 59 edges

## Surprising Connections (you probably didn't know these)
- `Modules` --references--> `PatronOnly`  [INFERRED]
  CLAUDE.md → backend/app/admin/views.py
- `Modules` --references--> `_Localized`  [INFERRED]
  CLAUDE.md → backend/app/admin/views.py
- `Modules` --references--> `GoogleFreeTranslator`  [INFERRED]
  CLAUDE.md → backend/app/ai/google_free.py
- `Modules` --references--> `GoogleFreeTTS`  [INFERRED]
  CLAUDE.md → backend/app/ai/google_free.py
- `Current status (update at the end of each working day)` --references--> `useUiBusyNow()`  [INFERRED]
  CLAUDE.md → frontend/src/i18n/useUiLoading.ts

## Import Cycles
- None detected.

## Communities (166 total, 75 thin omitted)

### Community 0 - "i18n.py"
Cohesion: 0.07
Nodes (14): current_language(), _finalize(), _gettext(), incomplete(), install(), _msgids(), _ngettext(), register() (+6 more)

### Community 1 - "main.py"
Cohesion: 0.07
Nodes (17): require_role(), check(), Language, forbidden(), not_found(), delete_document(), get_document(), upload_document() (+9 more)

### Community 2 - "conftest.py"
Cohesion: 0.07
Nodes (21): main(), run(), LoginIn, Me, normalize_login(), RegisterIn, _valid_login(), get_settings() (+13 more)

### Community 3 - "questions/service.py"
Cohesion: 0.07
Nodes (26): url(), Question, answer(), ask_usta(), get_question(), inbox(), MachineRef, my_questions() (+18 more)

### Community 4 - "AppContext"
Cohesion: 0.25
Nodes (17): AppContext, FakeAI, _audio_tracks(), _max_volume_db(), test_a_language_without_a_voice_gets_subtitles_only(), test_broken_video_fails_cleanly(), test_delete_video_removes_everything_made_from_it(), test_failed_step_shows_and_retry_resumes_there() (+9 more)

### Community 5 - "sqlalchemy"
Cohesion: 0.07
Nodes (18): _count(), _counts(), _last_maintenance(), utcnow(), Base, DocumentPage, ExternalVideo, MaintenanceAttachment (+10 more)

### Community 6 - "AIUnavailableError"
Cohesion: 0.09
Nodes (17): _FreeEndpoint, GoogleFreeTranslator, GoogleFreeTTS, _mp3_to_wav(), parse_translation(), split_for_speech(), _mp3(), _no_sleep() (+9 more)

### Community 7 - "jobs/router.py"
Cohesion: 0.12
Nodes (7): Job, JobStatus, progress(), get_job(), job_out(), job_socket(), JobOut

### Community 8 - "api/index.ts"
Cohesion: 0.10
Nodes (18): AnswerSource, LocalizedText, QaEntry, ErrorMessage(), Localized(), QaCard(), entry, Spinner() (+10 more)

### Community 10 - "pipeline.py"
Cohesion: 0.11
Nodes (31): _remove_folder(), abs_path(), root(), DubbedVersion, Snapshot, TopicSegment, TranscriptSegment, Video (+23 more)

### Community 11 - "topics.py"
Cohesion: 0.13
Nodes (17): _best_split(), depth_scores(), detect_topic_boundaries(), gap_similarities(), _length(), lexical_gap_similarities(), _spans(), _stems() (+9 more)

### Community 12 - "User"
Cohesion: 0.09
Nodes (27): User, AuthorizedPerson, PersonRef, actions(), can_answer(), is_usta_of(), MachineActions, _qr_machine() (+19 more)

### Community 13 - "@testing-library/react"
Cohesion: 0.08
Nodes (13): a, alert, show(), ustas, v, ext, video, hit (+5 more)

### Community 14 - "Card"
Cohesion: 0.08
Nodes (19): MaintenanceRecord, MaintenanceTimeline(), Props, SectionTitle(), Card(), machineQrUrl(), machineStickerUrl(), Props (+11 more)

### Community 15 - "auth/index.ts"
Cohesion: 0.21
Nodes (12): HomeRedirect(), app(), Logout(), me, AuthShell(), HOME_BY_ROLE, ROLE_LABEL, useAuth() (+4 more)

### Community 16 - "SessionDep"
Cohesion: 0.06
Nodes (30): admin_machines(), admin_users(), AdminMachineList, AdminMachineRow, AdminStats, AdminUser, LastMaintenance, sticker_pdf() (+22 more)

### Community 17 - "AIUnavailableError"
Cohesion: 0.15
Nodes (6): DisabledLLM, _Points, _Queries, _Sentence, _Sentences, AIUnavailableError

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (33): devDependencies, jsdom@^28.1.0, oxlint@^1.90.0, @playwright/test@^1.65.1, tailwindcss@^4.3.5, @tailwindcss/vite@^4.3.5, @testing-library/dom@^10.4.2, @testing-library/jest-dom@^8.0.0 (+25 more)

### Community 19 - "PlayerSettings.tsx"
Cohesion: 0.10
Nodes (26): VideoLanguageTrack, filterOptions(), normalize(), SearchOption, options, Props, SearchSelect(), options (+18 more)

### Community 20 - "Role"
Cohesion: 0.18
Nodes (25): AnswerDraft, Role, test_maintenance_rules(), test_technician_records_maintenance_with_photo(), _answered_question(), test_a_question_in_another_language_also_searches_its_machine_translation(), test_a_question_typed_in_another_language_than_the_profile_is_still_translated_for_search(), test_a_vague_question_is_found_through_the_llm_search_rewrite() (+17 more)

### Community 21 - "chunking.py"
Cohesion: 0.18
Nodes (15): Block, chunk_document(), chunk_video(), DocChunk, estimate_tokens(), _split_paragraph(), _split_table(), _tail() (+7 more)

### Community 22 - "VideoItem.tsx"
Cohesion: 0.08
Nodes (15): DocumentSummary, DocumentItem(), Props, doc, r(), DocumentList(), doc, Props (+7 more)

### Community 23 - "Settings"
Cohesion: 0.12
Nodes (8): build(), client(), Settings, test_ask_top_k_comes_from_env_and_must_be_at_least_one(), settings(), test_gemini_client_uses_vertex_or_a_key(), test_server_starts_without_test_database_url(), test_without_gemini_only_the_llm_is_off()

### Community 25 - "cn"
Cohesion: 0.16
Nodes (14): AuthorizedPerson, PersonRef, AuthorizedBadge(), base, Pill(), PillTone, TONE_CLASS, Badge() (+6 more)

### Community 26 - "fixture"
Cohesion: 0.15
Nodes (12): lifespan(), ai(), app(), client(), client_as(), make(), ctx(), ctx_of() (+4 more)

### Community 27 - "AppRoutes.tsx"
Cohesion: 0.15
Nodes (22): AdminMachineList, useApi(), AppRoutes(), AsyncView(), PageTitle(), AdminMachinesPage(), addExternalVideo(), qrImageUrl() (+14 more)

### Community 28 - "fakes.py"
Cohesion: 0.07
Nodes (10): ChromaVectorStore, VectorHit, _Failing, FakeEmbedder, FakeLLM, FakeReranker, FakeTranslator, FakeTTS (+2 more)

### Community 29 - "VideoPage.tsx"
Cohesion: 0.16
Nodes (9): Collapsible(), CollapsibleContent(), CollapsibleTrigger(), CaptionsButton(), Player(), show(), Transcript(), VideoPage() (+1 more)

### Community 30 - "create_video"
Cohesion: 0.12
Nodes (12): safe_name(), save_upload(), create_steps(), start(), create_video(), delete_video(), get_video(), prepare_language() (+4 more)

### Community 31 - "ask/api.ts"
Cohesion: 0.19
Nodes (14): AskFeedback, AskResult, QuestionSent, ActionState, useAction(), askMachine(), askUsta(), sendFeedback() (+6 more)

### Community 32 - "zxing.ts"
Cohesion: 0.17
Nodes (9): barcode-detector@^3.2.4, zxing-wasm@3.1.7, CODE_FORMATS, load(), Native, prepare, ZxingDetector, barcode-detector (+1 more)

### Community 33 - "extract.py"
Cohesion: 0.16
Nodes (15): _csv(), _decode(), _docx(), extract(), Extracted, _image(), _inside(), _looks_like_heading() (+7 more)

### Community 34 - "timeline.py"
Cohesion: 0.09
Nodes (21): TranscriptionResult, WhisperSegment, Word, FasterWhisperTranscriber, _read_wav(), build_sentence_timeline(), compute_speaking_rate(), format_timestamp() (+13 more)

### Community 35 - "media.py"
Cohesion: 0.09
Nodes (20): dub_track(), duration(), extract_audio(), gray_frame(), MediaError, mux_dub(), _pgm(), place_clips() (+12 more)

### Community 36 - "LanguageGate.test.tsx"
Cohesion: 0.11
Nodes (24): LanguageGate(), Props, gate(), Page(), usePageReveal(), PageSkeleton(), Skeleton(), I18nContext (+16 more)

### Community 37 - "UsersPage.tsx"
Cohesion: 0.17
Nodes (6): Props, RoleTabs(), TAB_ROLES, TabRole, isTabRole(), UsersPage()

### Community 38 - "useT"
Cohesion: 0.12
Nodes (15): DocumentDetail, ICON, STATUS_TEXT, StepList(), Button(), buttonVariants, LABELS, StatsTiles() (+7 more)

### Community 39 - "videos/service.py"
Cohesion: 0.16
Nodes (22): lang_dir(), lang_tr_name(), StepStatus, VideoStatus, VideoStep, availability(), detail(), _done() (+14 more)

### Community 40 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 41 - "evaluation.py"
Cohesion: 0.22
Nodes (11): Case, EvalSet, Expected, hit_rank(), matches(), report(), Report, main() (+3 more)

### Community 42 - "Modules"
Cohesion: 0.10
Nodes (21): AIServices, process(), remove_document(), startup(), _warm_up(), after_answer(), translate_question(), rrf_merge() (+13 more)

### Community 43 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 44 - "build"
Cohesion: 0.13
Nodes (3): CrossEncoderReranker, E5Embedder, _identity()

### Community 45 - "RecorderPage.tsx"
Cohesion: 0.23
Nodes (6): ProgressBar(), Progress(), CameraView(), Props, useVideoUpload(), RecorderPage()

### Community 46 - "test_auth_api.py"
Cohesion: 0.29
Nodes (11): AuthSession, test_expired_session_is_rejected(), test_login_with_differently_written_phone(), test_login_wrong_password_or_unknown_login_is_401(), test_logout_ends_the_session_on_the_server(), test_me_without_session_is_401(), test_register_as_usta(), test_register_cannot_pick_technician_or_patron() (+3 more)

### Community 47 - "alerts/router.py"
Cohesion: 0.14
Nodes (8): AlertHub, Alert, list_alerts(), mark_read(), alert_list(), AlertList, AlertOut, notify()

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 49 - "LLMClient"
Cohesion: 0.09
Nodes (5): Embedder, LLMClient, Reranker, Transcriber, TTSEngine

### Community 50 - "DeleteContentDialog.tsx"
Cohesion: 0.21
Nodes (16): Dialog(), DialogClose(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogPortal() (+8 more)

### Community 51 - "MachinePage.tsx"
Cohesion: 0.13
Nodes (6): archiveMachine(), deleteContent(), deleteOrGone(), useDeleteContent(), highlightFrom(), MachinePage()

### Community 52 - "test_machines.py"
Cohesion: 0.05
Nodes (46): get_ctx(), get_session(), public_url(), code_for_qr(), _font(), machine_url(), _qr(), sticker_sheet() (+38 more)

### Community 54 - "passwords.py"
Cohesion: 0.36
Nodes (6): hash_password(), _scrypt(), verify_password(), test_garbage_hash_is_rejected_not_raised(), test_hash_verifies_only_the_same_password(), test_same_password_gets_a_different_salt()

### Community 55 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, dev:mock, init, lint, preview, test (+4 more)

### Community 56 - "i18n/index.ts"
Cohesion: 0.06
Nodes (50): AdminMachineRow, DocumentType, ExternalSource, Machine, Button(), ButtonProps, VARIANT, Field() (+42 more)

### Community 57 - "api/types.ts"
Cohesion: 0.08
Nodes (41): AdminStats, AdminUser, AskIn, Attachment, ExternalVideoIn, InboxQuestion, MachineActions, MachineIn (+33 more)

### Community 58 - "fixtures.ts"
Cohesion: 0.10
Nodes (24): app(), NoSocket, Hello(), show(), show(), home(), adminUsers, alertList (+16 more)

### Community 59 - "dubbing.py"
Cohesion: 0.24
Nodes (12): fit_clip_to_slot(), Placement, plan_dub(), Slot, srt(), _ts(), vtt(), test_a_clip_that_does_not_fit_borrows_from_the_next_pause() (+4 more)

### Community 60 - "hybrid_search"
Cohesion: 0.20
Nodes (6): BM25, normalize(), tokenize(), test_bm25_finds_the_exact_error_code(), test_rrf_merge(), test_tokenize_keeps_codes_whole_and_ignores_case_and_accents()

### Community 61 - "NewMachinePage.tsx"
Cohesion: 0.17
Nodes (7): codeForQr(), createMachine(), NewMachineFrom, newMachineState(), readNewMachineFrom(), useQrCode(), NewMachinePage()

### Community 62 - "utils.tsx"
Cohesion: 0.14
Nodes (10): renderWithState(), target, fakeQr, Result, OtherPage(), Json, renderAt(), Routes_ (+2 more)

### Community 63 - "auth/service.py"
Cohesion: 0.19
Nodes (10): authenticate(), create_user(), end_session(), LoginTakenError, set_role(), start_session(), _token_hash(), user_for_token() (+2 more)

### Community 64 - "run"
Cohesion: 0.16
Nodes (6): JobFailedError, job(), run(), _set(), test_jobs_run_in_order_record_progress_and_failures(), known()

### Community 65 - "ask/service.py"
Cohesion: 0.09
Nodes (17): AskLog, ask_feedback(), ask_machine(), FeedbackIn, answer_question(), Answered, _date(), _describe() (+9 more)

### Community 66 - "lang_name"
Cohesion: 0.18
Nodes (7): GeminiLLM, answer_system(), answer_user(), refine_transcript(), search_queries(), summarize(), lang_name()

### Community 67 - "VideoPage.test.tsx"
Cohesion: 0.22
Nodes (8): click(), persian, pick(), openSettings(), pickFrom(), preparing, show(), videoDetail

### Community 68 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, class-variance-authority@^0.7.1, cn@^0.5.2, lucide-react@^1.78.0, qr-scanner@^1.4.2, radix-ui@^1.8.1, react@^19.3.1, react-dom@^19.3.1 (+5 more)

### Community 70 - "db.ts"
Cohesion: 0.14
Nodes (15): App(), start(), DEMO_LOGINS, load(), resetMockDb(), save(), MockResponse, apiPath() (+7 more)

### Community 71 - "backend.ts"
Cohesion: 0.30
Nodes (6): Body, defaults(), Handler, mockBackend(), Routes, @playwright/test

### Community 72 - "alerts.test.tsx"
Cohesion: 0.15
Nodes (17): Alert, AlertList, app(), FakeSocket, Toast(), unread, AlertsPage(), AlertsProvider() (+9 more)

### Community 73 - "ScanPage.tsx"
Cohesion: 0.18
Nodes (4): target, lookup(), noMachine(), ScanPage()

### Community 75 - "usta (Usta Hafızası)"
Cohesion: 0.11
Nodes (14): VectorStore, include_object(), API, Architecture, Commands, Current status (update at the end of each working day), Decisions, Engineering rules (always apply) (+6 more)

### Community 76 - "rules"
Cohesion: 0.20
Nodes (9): plugins, rules, jsx-a11y/media-has-caption, react/exhaustive-deps, react/only-export-components, react/rules-of-hooks, typescript/ban-ts-comment, typescript/no-explicit-any (+1 more)

### Community 77 - "MachineTable.tsx"
Cohesion: 0.38
Nodes (8): Table(), TableBody(), TableCell(), TableHead(), TableHeader(), TableRow(), MachineTable(), UserTable()

### Community 78 - "useApi.ts"
Cohesion: 0.24
Nodes (6): PageBusyContext, Data(), usePageBusy(), ApiResult, Poll, Stored

### Community 79 - "ApiError"
Cohesion: 0.05
Nodes (31): AI / LLM (backend), Frontend: API calls and hooks (reuse these, don't write new ones), Frontend is thin: all complex logic lives in the backend, Frontend: one feature, many small components, Frontend: presentational component, Reusable, strictly typed units, API_BASE, ApiError (+23 more)

### Community 81 - "useQrScanner.ts"
Cohesion: 0.16
Nodes (20): CameraInfo, cameraRefused(), currentCamera(), FocusCapabilities, FocusConstraints, keepFocusing(), mainBackCamera(), startCamera() (+12 more)

### Community 83 - "verify.sh"
Cohesion: 0.43
Nodes (6): add(), changed_since_start(), has(), py(), reset(), verify.sh script

### Community 84 - "useVideoPlayer.ts"
Cohesion: 0.31
Nodes (9): Preparation, VideoDetail, requestLanguage(), retryStep(), preparing(), SubtitleChoice, useVideoPlayer(), request() (+1 more)

### Community 85 - "db"
Cohesion: 0.15
Nodes (4): PatronOnly, alerts_socket(), reembed_job(), db()

### Community 86 - "settings.json"
Cohesion: 0.22
Nodes (8): env, GRAPHIFY_OUT, hooks, PostToolUse, Stop, permissions, deny, $schema

### Community 89 - "accept_refinement"
Cohesion: 0.53
Nodes (3): accept_refinement(), test_corrections_of_similar_length_are_taken(), test_empty_or_rewritten_corrections_keep_whisper_text()

### Community 93 - "translate_ui"
Cohesion: 0.25
Nodes (3): translate_ui(), UiTextsIn, UiTextsOut

### Community 94 - "views.py"
Cohesion: 0.07
Nodes (21): ExternalVideoAdmin, MachineAdmin, _take_upload(), UserAdmin, valid_password(), has_content(), embed_url(), _can_log_in() (+13 more)

### Community 95 - "Database migrations (Alembic)"
Cohesion: 0.40
Nodes (4): Changing the schema, Database migrations (Alembic), Deploying to a cloud platform, Platform without a shell (SQL console only)

### Community 96 - "InboxList.tsx"
Cohesion: 0.13
Nodes (15): ExternalVideo, EmptyState(), ListItem(), Props, Kind, KIND, Thumb(), AlertList() (+7 more)

### Community 97 - "AppLayout.tsx"
Cohesion: 0.14
Nodes (17): Language, LanguageCode, AppLayout(), NavBar(), UserLanguage(), ALERTS, NAV, NavItem (+9 more)

### Community 98 - "LanguageCode"
Cohesion: 0.30
Nodes (13): postJson(), LoginIn, Me, RegisterIn, fetchMe(), login(), logout(), register() (+5 more)

### Community 100 - "useCamera.ts"
Cohesion: 0.36
Nodes (6): cameraError(), Facing, HD, stream, track, useCamera()

### Community 103 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, files, references

### Community 137 - "questions/service.py"
Cohesion: 0.05
Nodes (37): _same_placeholders(), use_language(), Translator, localized(), LocalizedText, make_sessionmaker(), Document, DocumentSummaryText (+29 more)

### Community 161 - "lucide-react"
Cohesion: 0.10
Nodes (17): MachineHit, UstaProfile, ApiState, Chip(), Props, CtaLink(), Props, Feedback() (+9 more)

## Knowledge Gaps
- **2 isolated node(s):** `HF_HUB_OFFLINE`, `usta-backend`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 862 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **75 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Modules` connect `Modules` to `i18n.py`, `main.py`, `conftest.py`, `questions/service.py`, `AppContext`, `sqlalchemy`, `AIUnavailableError`, `jobs/router.py`, `api/index.ts`, `questions/service.py`, `pipeline.py`, `User`, `auth/index.ts`, `AIUnavailableError`, `chunking.py`, `Settings`, `fixture`, `AppRoutes.tsx`, `fakes.py`, `create_video`, `ask/api.ts`, `timeline.py`, `media.py`, `LanguageGate.test.tsx`, `useT`, `videos/service.py`, `build`, `RecorderPage.tsx`, `test_auth_api.py`, `alerts/router.py`, `LLMClient`, `MachinePage.tsx`, `test_machines.py`, `fixtures.ts`, `dubbing.py`, `hybrid_search`, `NewMachinePage.tsx`, `utils.tsx`, `run`, `ask/service.py`, `lang_name`, `FakeQrScanner`, `alerts.test.tsx`, `usta (Usta Hafızası)`, `useApi.ts`, `ApiError`, `useQrScanner.ts`, `useVideoPlayer.ts`, `db`, `accept_refinement`, `views.py`, `AppLayout.tsx`, `LanguageCode`, `useCamera.ts`?**
  _High betweenness centrality (0.479) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useT()` (e.g. with `Architecture` and `Modules`) actually correct?**
  _`useT()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `HF_HUB_OFFLINE`, `usta-backend` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `i18n.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07357357357357357 - nodes in this community are weakly interconnected._
- **Why does `useT()` connect `useT` to `InboxList.tsx`, `AppLayout.tsx`, `lucide-react`, `LanguageGate.test.tsx`, `api/index.ts`, `alerts.test.tsx`, `Modules`, `usta (Usta Hafızası)`, `MachineTable.tsx`, `Card`, `auth/index.ts`, `RecorderPage.tsx`, `PlayerSettings.tsx`, `i18n/index.ts`, `cn`, `fixtures.ts`, `AppRoutes.tsx`, `VideoPage.tsx`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Are the 149 inferred relationships involving `Modules` (e.g. with `translate_text()` and `use_language()`) actually correct?**
  _`Modules` has 149 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06885245901639345 - nodes in this community are weakly interconnected._