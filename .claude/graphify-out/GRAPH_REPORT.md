# Graph Report - usta  (2026-11-23)

## Corpus Check
- 474 files · ~88,679 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .ini 1)

## Summary
- 2365 nodes · 7538 edges · 118 communities (91 shown, 27 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 771 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b345af48`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppLayout.tsx
- User
- documents/service.py
- questions/service.py
- auth/router.py
- sqlalchemy
- useApi
- AIUnavailableError
- api/index.ts
- media.py
- pipeline.py
- handlers.ts
- ask/service.py
- react-router
- api/types.ts
- MachinePage.tsx
- interfaces.py
- format.ts
- package.json
- context.py
- AppContext
- videos/service.py
- videos/router.py
- react
- main.py
- renderAuthed
- views.py
- Modules
- fakes.py
- maintenance/router.py
- conftest.py
- @testing-library/react
- Role
- extract.py
- timeline.py
- Settings
- upload_video
- chunking.py
- admin/router.py
- topics.py
- test_documents.py
- sqlalchemy_ext_asyncio
- test_machines.py
- compilerOptions
- E5Embedder
- tokenize
- auth/cli.py
- usta (Usta Hafızası)
- compilerOptions
- asyncio
- qr.py
- Chunk
- dubbing.py
- request
- RecorderPage.tsx
- VideoPage.tsx
- Button
- LoginPage.tsx
- utils.tsx
- auth/service.py
- MaintenanceForm.tsx
- Field
- useRecorder.ts
- whisper.py
- test_auth_api.py
- MakeUser
- useAuth
- @testing-library/user-event
- ReplyForm.tsx
- passwords.py
- Job
- backend.ts
- scripts
- MaintenanceSection.tsx
- PatronOnly
- job_socket
- rules
- LanguageCode
- TrackPicker.tsx
- usta.test.tsx
- ScanPage.tsx
- useQrScanner.ts
- ocr_image
- verify.sh
- postJson
- useVideoPlayer.ts
- settings.json
- LoginForm.tsx
- useCamera.ts
- accept_refinement
- test_technician_records_maintenance_with_photo
- Reusable, strictly typed units
- RegisterForm.tsx
- current_user
- create_user
- Database migrations (Alembic)
- FakeXhr
- AuthorizedBadge.tsx
- maintenance.test.tsx
- get_upload
- test_health.py
- alerts_socket
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
2. `Role` - 100 edges
3. `AppContext` - 97 edges
4. `@testing-library/react` - 90 edges
5. `User` - 73 edges
6. `Machine` - 72 edges
7. `react-router` - 63 edges
8. `react` - 54 edges
9. `Video` - 48 edges
10. `@testing-library/user-event` - 44 edges

## Surprising Connections (you probably didn't know these)
- `Modules` --references--> `PatronOnly`  [INFERRED]
  CLAUDE.md → backend/app/admin/views.py
- `Modules` --references--> `ChromaVectorStore`  [INFERRED]
  CLAUDE.md → backend/app/ai/chroma.py
- `Modules` --references--> `GeminiLLM`  [INFERRED]
  CLAUDE.md → backend/app/ai/gemini.py
- `Modules` --references--> `GoogleFreeTranslator`  [INFERRED]
  CLAUDE.md → backend/app/ai/google_free.py
- `Modules` --references--> `GoogleFreeTTS`  [INFERRED]
  CLAUDE.md → backend/app/ai/google_free.py

## Import Cycles
- None detected.

## Communities (118 total, 27 thin omitted)

### Community 0 - "AppLayout.tsx"
Cohesion: 0.06
Nodes (40): Alert, AlertList, Language, AppLayout(), NavBar(), NAV, NavItem, filterOptions() (+32 more)

### Community 1 - "User"
Cohesion: 0.08
Nodes (31): User, ExternalSource, Machine, actions(), can_answer(), is_usta_of(), MachineActions, add_external_video() (+23 more)

### Community 2 - "documents/service.py"
Cohesion: 0.06
Nodes (23): Document, DocumentPage, DocumentSummaryText, DocumentType, SummaryStatus, delete_document(), get_document(), upload_document() (+15 more)

### Community 3 - "questions/service.py"
Cohesion: 0.08
Nodes (29): Question, QuestionStatus, answer(), ask_usta(), get_question(), inbox(), MachineRef, my_questions() (+21 more)

### Community 4 - "auth/router.py"
Cohesion: 0.06
Nodes (23): answer_system(), answer_user(), refine_transcript(), summarize(), LanguageIn, languages(), _log_in(), login() (+15 more)

### Community 5 - "sqlalchemy"
Cohesion: 0.10
Nodes (11): MachineAdmin, utcnow(), Base, MaintenanceAttachment, upgrade(), upgrade(), upgrade(), downgrade() (+3 more)

### Community 6 - "useApi"
Cohesion: 0.11
Nodes (23): AdminMachineList, AdminUser, DocumentDetail, useApi(), AsyncView(), PageTitle(), AdminMachinesPage(), addExternalVideo() (+15 more)

### Community 7 - "AIUnavailableError"
Cohesion: 0.09
Nodes (19): DisabledLLM, build(), GeminiLLM, _FreeEndpoint, GoogleFreeTranslator, GoogleFreeTTS, _mp3_to_wav(), parse_translation() (+11 more)

### Community 8 - "api/index.ts"
Cohesion: 0.10
Nodes (25): AnswerSource, AskFeedback, AskResult, LocalizedText, MachineIn, QuestionSent, ActionState, useAction() (+17 more)

### Community 9 - "media.py"
Cohesion: 0.09
Nodes (20): dub_track(), duration(), extract_audio(), gray_frame(), MediaError, mux_dub(), _pgm(), place_clips() (+12 more)

### Community 10 - "pipeline.py"
Cohesion: 0.13
Nodes (29): notify(), abs_path(), root(), TopicSegment, TranscriptSegment, Video, _audio(), _audio16k() (+21 more)

### Community 11 - "handlers.ts"
Cohesion: 0.09
Nodes (35): MachineActions, Role, VideoDetail, App(), start(), DEMO_LOGINS, forkliftPage(), load() (+27 more)

### Community 12 - "ask/service.py"
Cohesion: 0.09
Nodes (20): Translator, AskLog, answer_question(), Answered, _date(), _describe(), DocumentSource, NotFound (+12 more)

### Community 13 - "react-router"
Cohesion: 0.12
Nodes (19): InboxQuestion, MachineHit, QaEntry, UstaProfile, ApiState, EmptyState(), QaCard(), entry (+11 more)

### Community 14 - "api/types.ts"
Cohesion: 0.08
Nodes (31): AdminMachineRow, AdminStats, AskIn, Attachment, DocumentSummary, DocumentType, ExternalSource, ExternalVideoIn (+23 more)

### Community 15 - "MachinePage.tsx"
Cohesion: 0.09
Nodes (20): ExternalVideo, VideoSummary, archiveMachine(), machineQrUrl(), machineStickerUrl(), ArchiveMachine(), Props, DocumentList() (+12 more)

### Community 16 - "interfaces.py"
Cohesion: 0.06
Nodes (7): ChromaVectorStore, Embedder, LLMClient, Reranker, Transcriber, TTSEngine, VectorHit

### Community 17 - "format.ts"
Cohesion: 0.10
Nodes (19): VideoAvailability, Pill(), PillTone, MachineTable(), AlertList(), AVAILABILITY, StatusPill(), r() (+11 more)

### Community 18 - "package.json"
Cohesion: 0.07
Nodes (34): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.6, devDependencies, jsdom@^28.1.0, oxlint@^1.90.0, @playwright/test@^1.65.1 (+26 more)

### Community 19 - "context.py"
Cohesion: 0.09
Nodes (6): main(), run(), JobQueue, progress(), register_jobs(), reembed_job()

### Community 20 - "AppContext"
Cohesion: 0.20
Nodes (20): AppContext, get_ctx(), DubbedVersion, Snapshot, FakeAI, _audio_tracks(), _max_volume_db(), test_a_language_without_a_voice_gets_subtitles_only() (+12 more)

### Community 21 - "videos/service.py"
Cohesion: 0.12
Nodes (23): lang_dir(), lang_tr_name(), StepStatus, VideoStep, job(), run(), _set(), availability() (+15 more)

### Community 22 - "videos/router.py"
Cohesion: 0.13
Nodes (9): ask_feedback(), ask_machine(), FeedbackIn, require_role(), check(), forbidden(), not_found(), Health (+1 more)

### Community 23 - "react"
Cohesion: 0.15
Nodes (13): AppRoutes(), HomeRedirect(), Localized(), ProgressBar(), useMe(), createMaintenance(), MeCard(), MaintenanceFormPage() (+5 more)

### Community 24 - "main.py"
Cohesion: 0.09
Nodes (7): AlertHub, get_settings(), create_app(), validation_error(), _setup(), test_new_question_is_pushed_to_the_usta_live(), test_socket_without_session_is_refused()

### Community 25 - "renderAuthed"
Cohesion: 0.11
Nodes (16): app(), NoSocket, show(), OkXhr, show(), Xhr, preparing, show() (+8 more)

### Community 26 - "views.py"
Cohesion: 0.10
Nodes (9): ExternalVideoAdmin, MaintenanceAdmin, QuestionAdmin, _take_upload(), UserAdmin, valid_password(), has_content(), ExternalVideo (+1 more)

### Community 27 - "Modules"
Cohesion: 0.10
Nodes (14): DocumentAdmin, _drop_vectors(), _remove_folder(), VideoAdmin, safe_name(), save_upload(), remove_document(), startup() (+6 more)

### Community 28 - "fakes.py"
Cohesion: 0.12
Nodes (10): TranscriptionResult, _Failing, FakeEmbedder, FakeLLM, FakeReranker, FakeTranscriber, FakeTranslator, FakeTTS (+2 more)

### Community 29 - "maintenance/router.py"
Cohesion: 0.14
Nodes (15): AuthorizedPerson, PersonRef, url(), MaintenanceRecord, create_maintenance(), FormMachine, _machine_for_maintenance(), maintenance_form() (+7 more)

### Community 30 - "conftest.py"
Cohesion: 0.13
Nodes (17): make_engine(), lifespan(), ai(), app(), clean_tables(), client(), client_as(), make() (+9 more)

### Community 31 - "@testing-library/react"
Cohesion: 0.14
Nodes (12): show(), adminMachines, adminUsers, askAnswered, documentDetail, inboxQuestion, maintenanceForm, myQuestions (+4 more)

### Community 32 - "Role"
Cohesion: 0.26
Nodes (20): Role, _answered_question(), test_a_question_in_another_language_also_searches_its_machine_translation(), test_a_question_typed_in_another_language_than_the_profile_is_still_translated_for_search(), test_alert_mark_read(), test_an_answer_file_is_indexed_through_the_document_pipeline(), test_answer_needs_content_and_can_carry_a_file(), test_ask_answers_from_an_earlier_usta_answer_with_its_source() (+12 more)

### Community 33 - "extract.py"
Cohesion: 0.16
Nodes (15): _csv(), _decode(), _docx(), extract(), Extracted, _image(), _inside(), _looks_like_heading() (+7 more)

### Community 34 - "timeline.py"
Cohesion: 0.17
Nodes (17): WhisperSegment, Word, build_sentence_timeline(), compute_speaking_rate(), format_timestamp(), RateSummary, Sentence, _sentence() (+9 more)

### Community 35 - "Settings"
Cohesion: 0.09
Nodes (7): client(), _Points, _Sentence, _Sentences, Settings, test_gemini_client_uses_vertex_or_a_key(), test_server_starts_without_test_database_url()

### Community 36 - "upload_video"
Cohesion: 0.15
Nodes (11): create_steps(), start(), create_video(), delete_video(), get_video(), prepare_language(), retry_step(), upload_video() (+3 more)

### Community 37 - "chunking.py"
Cohesion: 0.17
Nodes (17): Block, chunk_document(), chunk_video(), DocChunk, estimate_tokens(), _split_paragraph(), _split_table(), _tail() (+9 more)

### Community 38 - "admin/router.py"
Cohesion: 0.15
Nodes (11): admin_machines(), admin_users(), AdminMachineList, AdminMachineRow, AdminStats, AdminUser, _count(), _counts() (+3 more)

### Community 39 - "topics.py"
Cohesion: 0.18
Nodes (15): _best_split(), depth_scores(), detect_topic_boundaries(), gap_similarities(), _length(), _spans(), TopicSpan, test_boundary_where_meaning_and_words_change() (+7 more)

### Community 40 - "test_documents.py"
Cohesion: 0.25
Nodes (15): docx(), photo(), scanned_pdf(), test_broken_file_gives_an_empty_document_not_a_crash(), test_delete_document_removes_chunks_vectors_and_file(), test_document_upload_rules(), test_document_without_summary_service_is_still_searchable(), test_office_csv_and_text_files() (+7 more)

### Community 41 - "sqlalchemy_ext_asyncio"
Cohesion: 0.15
Nodes (8): Alert, list_alerts(), mark_read(), alert_list(), AlertList, AlertOut, do_run_migrations(), run_async_migrations()

### Community 42 - "test_machines.py"
Cohesion: 0.25
Nodes (15): test_actions_depend_on_role_and_assignment(), test_archived_machine_leaves_lists_but_keeps_its_page(), test_embed_url_only_for_known_players(), test_everything_needs_login(), test_languages_and_switching_content_language(), test_lookup_by_sticker_code(), test_machine_page_404(), test_machine_page_shape_and_empty_sections() (+7 more)

### Community 43 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 44 - "E5Embedder"
Cohesion: 0.13
Nodes (3): CrossEncoderReranker, E5Embedder, _identity()

### Community 45 - "tokenize"
Cohesion: 0.13
Nodes (7): BM25, normalize(), tokenize(), lexical_gap_similarities(), _stems(), test_bm25_finds_the_exact_error_code(), test_tokenize_keeps_codes_whole_and_ignores_case_and_accents()

### Community 46 - "auth/cli.py"
Cohesion: 0.15
Nodes (6): main(), run(), make_sessionmaker(), cli_uses_test_db(), test_create_patron_then_change_role(), test_set_role_for_unknown_login()

### Community 47 - "usta (Usta Hafızası)"
Cohesion: 0.11
Nodes (14): VectorStore, include_object(), API, Architecture, Commands, Current status (update at the end of each working day), Decisions, Engineering rules (always apply) (+6 more)

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 49 - "asyncio"
Cohesion: 0.22
Nodes (8): AIServices, EvalSet, Candidate, hybrid_search(), reembed_stale(), rerank(), _upsert_vectors(), main()

### Community 50 - "qr.py"
Cohesion: 0.15
Nodes (5): _font(), machine_url(), _qr(), sticker_sheet(), svg()

### Community 51 - "Chunk"
Cohesion: 0.24
Nodes (10): Case, Expected, hit_rank(), matches(), report(), Report, Chunk, _chunk() (+2 more)

### Community 52 - "dubbing.py"
Cohesion: 0.26
Nodes (12): fit_clip_to_slot(), Placement, plan_dub(), Slot, srt(), _ts(), vtt(), test_a_clip_that_does_not_fit_borrows_from_the_next_pause() (+4 more)

### Community 53 - "request"
Cohesion: 0.23
Nodes (11): Frontend: API calls and hooks (reuse these, don't write new ones), API_BASE, ApiError, errorMessage(), parse(), postForm(), request(), uploadWithProgress() (+3 more)

### Community 54 - "RecorderPage.tsx"
Cohesion: 0.18
Nodes (9): PipelineStep, StepStatus, MARK, STATUS_TEXT, StepList(), ProcessingPanel(), UploadState, useVideoUpload() (+1 more)

### Community 55 - "VideoPage.tsx"
Cohesion: 0.23
Nodes (7): Preparation, TranscriptSegment, Player(), PreparationCard(), Props, Transcript(), VideoPage()

### Community 56 - "Button"
Cohesion: 0.21
Nodes (6): Button(), ButtonProps, AskForm(), EMPTY, FIELDS, MachineForm()

### Community 57 - "LoginPage.tsx"
Cohesion: 0.25
Nodes (6): AuthShell(), DemoLogin(), USERS, HOME_BY_ROLE, LoginPage(), fromState()

### Community 58 - "utils.tsx"
Cohesion: 0.18
Nodes (9): persian, processing, OtherPage(), chooseFrom(), Json, renderAt(), Routes_, stubQrCamera() (+1 more)

### Community 59 - "auth/service.py"
Cohesion: 0.27
Nodes (8): AuthSession, authenticate(), end_session(), set_role(), start_session(), _token_hash(), user_for_token(), _utcnow()

### Community 60 - "MaintenanceForm.tsx"
Cohesion: 0.20
Nodes (9): AuthorizedPerson, PersonRef, names(), NotFoundCard(), Props, ustas, MaintenanceIn, MaintenanceForm() (+1 more)

### Community 61 - "Field"
Cohesion: 0.23
Nodes (5): Field(), MachineSelect(), Option, Props, SavePanel()

### Community 62 - "useRecorder.ts"
Cohesion: 0.16
Nodes (6): pickType(), FakeRecorder, TYPES, useRecorder(), start(), Clip

### Community 64 - "test_auth_api.py"
Cohesion: 0.33
Nodes (10): test_expired_session_is_rejected(), test_login_with_differently_written_phone(), test_login_wrong_password_or_unknown_login_is_401(), test_logout_ends_the_session_on_the_server(), test_me_without_session_is_401(), test_register_as_usta(), test_register_cannot_pick_technician_or_patron(), test_register_creates_a_worker_and_logs_in() (+2 more)

### Community 65 - "MakeUser"
Cohesion: 0.28
Nodes (8): _can_log_in(), test_admin_machines_stats_and_search(), test_admin_users_lists_roles_and_machines(), test_maintenance_records_are_read_only_in_sqladmin(), test_patron_resets_a_password_in_sqladmin(), test_sqladmin_lets_only_patrons_in(), test_sqladmin_login_form_accepts_only_patrons(), test_uploads_need_login_and_stay_inside_the_folder()

### Community 66 - "useAuth"
Cohesion: 0.29
Nodes (7): Spinner(), app(), Logout(), me, useAuth(), RegisterPage(), RequireAuth()

### Community 67 - "@testing-library/user-event"
Cohesion: 0.18
Nodes (4): a, Props, RecordControls(), @testing-library/user-event

### Community 68 - "ReplyForm.tsx"
Cohesion: 0.24
Nodes (8): ReplyIn, ReplyKind, sendAnswer(), KINDS, ReplyForm(), ReplyState, useReply(), send()

### Community 69 - "passwords.py"
Cohesion: 0.33
Nodes (6): hash_password(), _scrypt(), verify_password(), test_garbage_hash_is_rejected_not_raised(), test_hash_verifies_only_the_same_password(), test_same_password_gets_a_different_salt()

### Community 70 - "Job"
Cohesion: 0.23
Nodes (5): Job, JobStatus, JobFailedError, test_jobs_run_in_order_record_progress_and_failures(), known()

### Community 71 - "backend.ts"
Cohesion: 0.30
Nodes (6): Body, defaults(), Handler, mockBackend(), Routes, @playwright/test

### Community 72 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, dev:mock, init, lint, preview, test (+4 more)

### Community 73 - "MaintenanceSection.tsx"
Cohesion: 0.32
Nodes (5): MaintenanceRecord, MaintenanceTimeline(), Props, MaintenanceSection(), Props

### Community 75 - "job_socket"
Cohesion: 0.22
Nodes (4): get_job(), job_out(), job_socket(), JobOut

### Community 76 - "rules"
Cohesion: 0.20
Nodes (9): plugins, rules, jsx-a11y/media-has-caption, react/exhaustive-deps, react/only-export-components, react/rules-of-hooks, typescript/ban-ts-comment, typescript/no-explicit-any (+1 more)

### Community 77 - "LanguageCode"
Cohesion: 0.51
Nodes (7): LanguageCode, LoginIn, Me, RegisterIn, AuthContext, AuthContextValue, AuthState

### Community 78 - "TrackPicker.tsx"
Cohesion: 0.29
Nodes (7): VideoLanguageTrack, Props, option(), Props, setup(), TrackPicker(), TrackKind

### Community 79 - "usta.test.tsx"
Cohesion: 0.20
Nodes (4): FakeSocket, home(), OkXhr, languages

### Community 80 - "ScanPage.tsx"
Cohesion: 0.33
Nodes (3): CodeForm(), lookup(), ScanPage()

### Community 81 - "useQrScanner.ts"
Cohesion: 0.31
Nodes (6): QrScanner(), cameraError(), Detector, DetectorClass, scanUnavailable(), useQrScanner()

### Community 83 - "verify.sh"
Cohesion: 0.43
Nodes (6): add(), changed_since_start(), has(), py(), reset(), verify.sh script

### Community 84 - "postJson"
Cohesion: 0.54
Nodes (7): postJson(), fetchMe(), login(), logout(), register(), updateLanguage(), AuthProvider()

### Community 85 - "useVideoPlayer.ts"
Cohesion: 0.43
Nodes (5): requestLanguage(), retryStep(), preparing(), SubtitleChoice, useVideoPlayer()

### Community 86 - "settings.json"
Cohesion: 0.29
Nodes (6): hooks, PostToolUse, Stop, permissions, deny, $schema

### Community 87 - "LoginForm.tsx"
Cohesion: 0.43
Nodes (3): loginError(), LoginForm(), submit()

### Community 88 - "useCamera.ts"
Cohesion: 0.38
Nodes (5): cameraError(), Facing, stream, track, useCamera()

### Community 89 - "accept_refinement"
Cohesion: 0.53
Nodes (3): accept_refinement(), test_corrections_of_similar_length_are_taken(), test_empty_or_rewritten_corrections_keep_whisper_text()

### Community 91 - "Reusable, strictly typed units"
Cohesion: 0.33
Nodes (5): AI / LLM (backend), Frontend is thin: all complex logic lives in the backend, Frontend: one feature, many small components, Frontend: presentational component, Reusable, strictly typed units

### Community 92 - "RegisterForm.tsx"
Cohesion: 0.40
Nodes (4): RegisterRole, RegisterForm(), submit(), ROLES

### Community 94 - "create_user"
Cohesion: 0.40
Nodes (3): create_user(), LoginTakenError, make()

### Community 95 - "Database migrations (Alembic)"
Cohesion: 0.40
Nodes (4): Changing the schema, Database migrations (Alembic), Deploying to a cloud platform, Platform without a shell (SQL console only)

## Knowledge Gaps
- **1 isolated node(s):** `usta-backend`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 654 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Modules` connect `Modules` to `AppLayout.tsx`, `User`, `documents/service.py`, `questions/service.py`, `auth/router.py`, `sqlalchemy`, `useApi`, `AIUnavailableError`, `api/index.ts`, `media.py`, `pipeline.py`, `ask/service.py`, `interfaces.py`, `context.py`, `AppContext`, `videos/service.py`, `videos/router.py`, `react`, `main.py`, `renderAuthed`, `maintenance/router.py`, `conftest.py`, `timeline.py`, `Settings`, `upload_video`, `chunking.py`, `E5Embedder`, `tokenize`, `usta (Usta Hafızası)`, `asyncio`, `Chunk`, `dubbing.py`, `request`, `RecorderPage.tsx`, `LoginPage.tsx`, `utils.tsx`, `auth/service.py`, `useRecorder.ts`, `useAuth`, `Job`, `PatronOnly`, `useQrScanner.ts`, `postJson`, `useVideoPlayer.ts`, `useCamera.ts`, `accept_refinement`?**
  _High betweenness centrality (0.477) - this node is a cross-community bridge._
- **Are the 126 inferred relationships involving `Modules` (e.g. with `PatronOnly` and `ChromaVectorStore`) actually correct?**
  _`Modules` has 126 INFERRED edges - model-reasoned connections that need verification._
- **What connects `usta-backend` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppLayout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0609009009009009 - nodes in this community are weakly interconnected._
- **Why does `User` connect `User` to `questions/service.py`, `auth/router.py`, `sqlalchemy`, `pipeline.py`, `ask/service.py`, `AppContext`, `videos/router.py`, `views.py`, `Modules`, `maintenance/router.py`, `conftest.py`, `Role`, `upload_video`, `admin/router.py`, `test_documents.py`, `test_machines.py`, `auth/cli.py`, `auth/service.py`, `test_auth_api.py`, `current_user`, `create_user`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Are the 76 inferred relationships involving `Role` (e.g. with `AdminUser` and `PatronOnly`) actually correct?**
  _`Role` has 76 INFERRED edges - model-reasoned connections that need verification._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.07596153846153846 - nodes in this community are weakly interconnected._