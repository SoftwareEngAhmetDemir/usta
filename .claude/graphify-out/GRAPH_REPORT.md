# Graph Report - usta  (2026-11-26)

## Corpus Check
- 548 files · ~110,995 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .ini 1)

## Summary
- 2736 nodes · 9022 edges · 130 communities (87 shown, 43 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 778 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a3ac9075`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ask/service.py
- User
- documents/service.py
- questions/service.py
- test_admin.py
- sqlalchemy
- AIUnavailableError
- AIUnavailableError
- VideoItem.tsx
- test_videos.py
- pipeline.py
- auth/index.ts
- translate_ui
- fixtures.ts
- @testing-library/react
- JobQueue
- machines/service.py
- translations/service.py
- package.json
- PlayerSettings.tsx
- AppContext
- videos/router.py
- conftest.py
- Settings
- test_documents.py
- MachineTable.tsx
- card.tsx
- useT
- fakes.py
- admin/router.py
- AdminMachinesPage.tsx
- ask/api.ts
- zxing.ts
- extract.py
- timeline.py
- media.py
- LanguageGate.test.tsx
- AppLayout.tsx
- api/types.ts
- StepList.tsx
- components.json
- evaluation.py
- Modules
- compilerOptions
- build
- whisper.py
- ask_machine
- main.py
- compilerOptions
- LLMClient
- Request
- postJson
- test_machines.py
- scripts
- i18n/index.ts
- handlers.ts
- @testing-library/react
- dubbing.py
- chunking.py
- ScanPage.tsx
- utils.tsx
- auth/service.py
- JobFailedError
- QrScanner.tsx
- lang_name
- useAction
- dependencies
- FakeQrScanner
- test_technician_records_maintenance_with_photo
- backend.ts
- UstaHomePage.tsx
- test_ui_texts_come_in_the_users_language_and_are_translated_once
- views.py
- usta (Usta Hafızası)
- rules
- ApiError
- useApi.ts
- FakeXhr
- useQrScanner.ts
- UserLanguage.test.tsx
- verify.sh
- useVideoPlayer.ts
- settings.json
- Spinner
- accept_refinement
- postJson
- test_alerts_socket.py
- Reusable, strictly typed units
- Database migrations (Alembic)
- ChromaVectorStore
- job
- db
- usta/api.ts
- useCamera.ts
- test_health.py
- tsconfig.json
- post-edit.sh
- session-start.sh
- feature/SKILL.md
- ticket/SKILL.md
- dev.sh
- README.md
- usta-backend
- api/index.ts
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
- `Modules` --references--> `useCamera()`  [INFERRED]
  CLAUDE.md → frontend/src/features/recorder/hooks/useCamera.ts
- `Modules` --references--> `useRecorder()`  [INFERRED]
  CLAUDE.md → frontend/src/features/recorder/hooks/useRecorder.ts
- `Current status (update at the end of each working day)` --references--> `useUiBusyNow()`  [INFERRED]
  CLAUDE.md → frontend/src/i18n/useUiLoading.ts
- `Architecture` --references--> `AppContext`  [INFERRED]
  CLAUDE.md → backend/app/context.py
- `Architecture` --references--> `Localizer`  [INFERRED]
  CLAUDE.md → backend/app/translations/service.py

## Import Cycles
- None detected.

## Communities (130 total, 43 thin omitted)

### Community 0 - "ask/service.py"
Cohesion: 0.27
Nodes (7): Answered, _date(), _describe(), DocumentSource, NotFound, UstaAnswerSource, VideoSource

### Community 1 - "User"
Cohesion: 0.07
Nodes (28): ExternalVideoAdmin, require_role(), check(), forbidden(), not_found(), ExternalSource, ExternalVideo, add_external_video() (+20 more)

### Community 2 - "documents/service.py"
Cohesion: 0.06
Nodes (18): Document, DocumentPage, DocumentSummaryText, DocumentType, SummaryStatus, delete_document(), get_document(), upload_document() (+10 more)

### Community 3 - "questions/service.py"
Cohesion: 0.08
Nodes (31): localized(), LocalizedText, Question, QuestionStatus, answer(), ask_usta(), get_question(), inbox() (+23 more)

### Community 4 - "test_admin.py"
Cohesion: 0.07
Nodes (28): MachineAdmin, LanguageIn, languages(), _log_in(), login(), logout(), me(), register() (+20 more)

### Community 5 - "sqlalchemy"
Cohesion: 0.08
Nodes (17): AskLog, User, utcnow(), Base, Machine, can_answer(), is_usta_of(), MaintenanceAttachment (+9 more)

### Community 6 - "AIUnavailableError"
Cohesion: 0.13
Nodes (7): DisabledLLM, _Points, _Queries, _Sentence, _Sentences, AIUnavailableError, AnswerDraft

### Community 7 - "AIUnavailableError"
Cohesion: 0.12
Nodes (13): _FreeEndpoint, GoogleFreeTranslator, GoogleFreeTTS, _mp3_to_wav(), parse_translation(), split_for_speech(), _mp3(), test_parse_translation_joins_the_pieces() (+5 more)

### Community 8 - "VideoItem.tsx"
Cohesion: 0.07
Nodes (33): DocumentSummary, ExternalVideo, InboxQuestion, VideoAvailability, VideoSummary, EmptyState(), ListItem(), Props (+25 more)

### Community 9 - "test_videos.py"
Cohesion: 0.26
Nodes (16): FakeAI, _audio_tracks(), _max_volume_db(), test_a_language_without_a_voice_gets_subtitles_only(), test_broken_video_fails_cleanly(), test_delete_video_removes_everything_made_from_it(), test_failed_step_shows_and_retry_resumes_there(), test_failed_transcription_keeps_the_video_playable() (+8 more)

### Community 10 - "pipeline.py"
Cohesion: 0.10
Nodes (34): _remove_folder(), abs_path(), root(), DubbedVersion, Snapshot, TopicSegment, TranscriptSegment, Video (+26 more)

### Community 11 - "auth/index.ts"
Cohesion: 0.27
Nodes (11): app(), Logout(), me, AuthShell(), HOME_BY_ROLE, ROLE_LABEL, useAuth(), LoginPage() (+3 more)

### Community 12 - "translate_ui"
Cohesion: 0.25
Nodes (3): translate_ui(), UiTextsIn, UiTextsOut

### Community 13 - "fixtures.ts"
Cohesion: 0.10
Nodes (13): Xhr, click(), persian, pick(), adminMachines, adminUsers, askAnswered, inboxQuestion (+5 more)

### Community 14 - "@testing-library/react"
Cohesion: 0.09
Nodes (9): a, ustas, v, ext, video, hit, react-router, @testing-library/react (+1 more)

### Community 15 - "JobQueue"
Cohesion: 0.08
Nodes (9): Job, JobStatus, JobQueue, progress(), register_jobs(), get_job(), job_out(), job_socket() (+1 more)

### Community 16 - "machines/service.py"
Cohesion: 0.10
Nodes (22): AuthorizedPerson, PersonRef, url(), actions(), MachineActions, machine_out(), machine_page(), MachineOut (+14 more)

### Community 17 - "translations/service.py"
Cohesion: 0.15
Nodes (12): Translator, _store_summaries(), Translation, _framed(), languages_in_use(), source_hash(), stored(), translate() (+4 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (33): devDependencies, jsdom@^28.1.0, oxlint@^1.90.0, @playwright/test@^1.65.1, tailwindcss@^4.3.5, @tailwindcss/vite@^4.3.5, @testing-library/dom@^10.4.2, @testing-library/jest-dom@^8.0.0 (+25 more)

### Community 19 - "PlayerSettings.tsx"
Cohesion: 0.08
Nodes (31): Language, VideoLanguageTrack, filterOptions(), normalize(), SearchOption, options, Props, SearchSelect() (+23 more)

### Community 20 - "AppContext"
Cohesion: 0.25
Nodes (23): Role, AppContext, _answered_question(), test_a_question_in_another_language_also_searches_its_machine_translation(), test_a_question_typed_in_another_language_than_the_profile_is_still_translated_for_search(), test_a_vague_question_is_found_through_the_llm_search_rewrite(), test_alert_mark_read(), test_an_answer_file_is_indexed_through_the_document_pipeline() (+15 more)

### Community 21 - "videos/router.py"
Cohesion: 0.09
Nodes (32): lang_dir(), lang_tr_name(), StepStatus, VideoStep, create_steps(), reset_for_reprocess(), start(), create_video() (+24 more)

### Community 22 - "conftest.py"
Cohesion: 0.13
Nodes (14): ai(), app(), clean_tables(), client(), client_as(), make(), ctx(), ctx_of() (+6 more)

### Community 23 - "Settings"
Cohesion: 0.12
Nodes (8): build(), client(), Settings, test_ask_top_k_comes_from_env_and_must_be_at_least_one(), settings(), test_gemini_client_uses_vertex_or_a_key(), test_server_starts_without_test_database_url(), test_without_gemini_only_the_llm_is_off()

### Community 24 - "test_documents.py"
Cohesion: 0.25
Nodes (15): docx(), photo(), scanned_pdf(), test_broken_file_gives_an_empty_document_not_a_crash(), test_delete_document_removes_chunks_vectors_and_file(), test_document_upload_rules(), test_document_without_summary_service_is_still_searchable(), test_office_csv_and_text_files() (+7 more)

### Community 25 - "MachineTable.tsx"
Cohesion: 0.16
Nodes (16): AuthorizedBadge(), base, Pill(), PillTone, TONE_CLASS, Badge(), badgeVariants, Table() (+8 more)

### Community 26 - "card.tsx"
Cohesion: 0.11
Nodes (11): TranscriptSegment, ProgressBar(), Collapsible(), CollapsibleContent(), CollapsibleTrigger(), Progress(), Props, show() (+3 more)

### Community 27 - "useT"
Cohesion: 0.10
Nodes (41): MachinePage, useApi(), AppRoutes(), AsyncView(), ErrorMessage(), PageTitle(), Card(), stickerPdfUrl() (+33 more)

### Community 28 - "fakes.py"
Cohesion: 0.13
Nodes (10): TranscriptionResult, _Failing, FakeEmbedder, FakeLLM, FakeReranker, FakeTranscriber, FakeTranslator, FakeTTS (+2 more)

### Community 29 - "admin/router.py"
Cohesion: 0.13
Nodes (12): admin_machines(), admin_users(), AdminMachineList, AdminMachineRow, AdminStats, AdminUser, _count(), _counts() (+4 more)

### Community 30 - "AdminMachinesPage.tsx"
Cohesion: 0.09
Nodes (31): AdminMachineRow, DocumentType, ExternalSource, Machine, ICON, Notice(), STYLE, Tone (+23 more)

### Community 31 - "ask/api.ts"
Cohesion: 0.42
Nodes (8): AskResult, QuestionSent, askMachine(), askUsta(), Exchange, useAsk(), ask(), sendToUsta()

### Community 32 - "zxing.ts"
Cohesion: 0.20
Nodes (7): zxing-wasm@3.1.7, CODE_FORMATS, load(), Native, prepare, ZxingDetector, zxing-wasm

### Community 33 - "extract.py"
Cohesion: 0.11
Nodes (18): ocr_image(), OCRError, _csv(), _decode(), _docx(), extract(), Extracted, _image() (+10 more)

### Community 34 - "timeline.py"
Cohesion: 0.17
Nodes (17): WhisperSegment, Word, build_sentence_timeline(), compute_speaking_rate(), format_timestamp(), RateSummary, Sentence, _sentence() (+9 more)

### Community 35 - "media.py"
Cohesion: 0.05
Nodes (37): dub_track(), duration(), extract_audio(), gray_frame(), MediaError, mux_dub(), _pgm(), place_clips() (+29 more)

### Community 36 - "LanguageGate.test.tsx"
Cohesion: 0.15
Nodes (18): gate(), Page(), I18nContext, Translate, UiBusyNowContext, UiLoadingContext, UiReadyContext, I18nProvider() (+10 more)

### Community 37 - "AppLayout.tsx"
Cohesion: 0.07
Nodes (34): Alert, AlertList, AppLayout(), LanguageGate(), Props, usePageReveal(), NavBar(), PageSkeleton() (+26 more)

### Community 38 - "api/types.ts"
Cohesion: 0.08
Nodes (26): AdminMachineList, AdminStats, AdminUser, AnswerSource, AskFeedback, AskIn, Attachment, AuthorizedPerson (+18 more)

### Community 39 - "StepList.tsx"
Cohesion: 0.21
Nodes (8): PipelineStep, StepStatus, ICON, STATUS_TEXT, StepList(), Button(), buttonVariants, PreparationCard()

### Community 40 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 41 - "evaluation.py"
Cohesion: 0.26
Nodes (9): Case, Expected, hit_rank(), matches(), report(), Report, _chunk(), test_hit_rank_matches_video_moments_pages_and_answers() (+1 more)

### Community 42 - "Modules"
Cohesion: 0.09
Nodes (23): _drop_vectors(), AIServices, answer_question(), _retrieved(), _rewritten(), _translated(), process(), remove_document() (+15 more)

### Community 43 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 44 - "build"
Cohesion: 0.13
Nodes (3): CrossEncoderReranker, E5Embedder, _identity()

### Community 46 - "ask_machine"
Cohesion: 0.24
Nodes (3): ask_feedback(), ask_machine(), FeedbackIn

### Community 47 - "main.py"
Cohesion: 0.09
Nodes (10): AlertHub, Alert, list_alerts(), mark_read(), alert_list(), AlertList, AlertOut, notify() (+2 more)

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 49 - "LLMClient"
Cohesion: 0.09
Nodes (5): Embedder, LLMClient, Reranker, Transcriber, TTSEngine

### Community 50 - "Request"
Cohesion: 0.25
Nodes (4): DocumentAdmin, MaintenanceAdmin, QuestionAdmin, VideoAdmin

### Community 51 - "postJson"
Cohesion: 0.54
Nodes (7): postJson(), fetchMe(), login(), logout(), register(), updateLanguage(), AuthProvider()

### Community 52 - "test_machines.py"
Cohesion: 0.06
Nodes (31): get_ctx(), get_session(), public_url(), code_for_qr(), _font(), machine_url(), _qr(), sticker_sheet() (+23 more)

### Community 55 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, dev:mock, init, lint, preview, test (+4 more)

### Community 56 - "i18n/index.ts"
Cohesion: 0.07
Nodes (33): RegisterRole, Button(), ButtonProps, VARIANT, Field(), Alert(), AlertDescription(), alertVariants (+25 more)

### Community 57 - "handlers.ts"
Cohesion: 0.05
Nodes (45): MachineActions, MyQuestion, Role, VideoProcessing, App(), pickType(), RECORDING_BITS, FakeRecorder (+37 more)

### Community 58 - "@testing-library/react"
Cohesion: 0.07
Nodes (23): app(), NoSocket, HomeRedirect(), show(), OkXhr, show(), FakeSocket, home() (+15 more)

### Community 59 - "dubbing.py"
Cohesion: 0.26
Nodes (12): fit_clip_to_slot(), Placement, plan_dub(), Slot, srt(), _ts(), vtt(), test_a_clip_that_does_not_fit_borrows_from_the_next_pause() (+4 more)

### Community 60 - "chunking.py"
Cohesion: 0.10
Nodes (21): chunk_document(), chunk_video(), DocChunk, estimate_tokens(), _split_paragraph(), _split_table(), _tail(), TimedText (+13 more)

### Community 61 - "ScanPage.tsx"
Cohesion: 0.07
Nodes (22): Dialog(), DialogClose(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogPortal() (+14 more)

### Community 62 - "utils.tsx"
Cohesion: 0.11
Nodes (13): show(), renderWithState(), Xhr, fakeQr, Result, processing, OtherPage(), Json (+5 more)

### Community 63 - "auth/service.py"
Cohesion: 0.06
Nodes (30): PatronOnly, alerts_socket(), current_user(), AuthSession, hash_password(), _scrypt(), verify_password(), authenticate() (+22 more)

### Community 64 - "JobFailedError"
Cohesion: 0.33
Nodes (3): JobFailedError, test_jobs_run_in_order_record_progress_and_failures(), known()

### Community 65 - "QrScanner.tsx"
Cohesion: 0.29
Nodes (6): barcode-detector@^3.2.4, HINT, QrScanner(), readPhoto(), installZxing(), barcode-detector

### Community 66 - "lang_name"
Cohesion: 0.21
Nodes (7): GeminiLLM, answer_system(), answer_user(), refine_transcript(), search_queries(), summarize(), lang_name()

### Community 67 - "useAction"
Cohesion: 0.43
Nodes (4): ActionState, useAction(), sendFeedback(), useFeedback()

### Community 68 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, class-variance-authority@^0.7.1, cn@^0.5.2, lucide-react@^1.78.0, qr-scanner@^1.4.2, radix-ui@^1.8.1, react@^19.3.1, react-dom@^19.3.1 (+5 more)

### Community 71 - "backend.ts"
Cohesion: 0.30
Nodes (6): Body, defaults(), Handler, mockBackend(), Routes, @playwright/test

### Community 72 - "UstaHomePage.tsx"
Cohesion: 0.11
Nodes (16): MachineHit, QaEntry, UstaProfile, ApiState, Chip(), Props, CtaLink(), Props (+8 more)

### Community 74 - "views.py"
Cohesion: 0.11
Nodes (6): _take_upload(), UserAdmin, valid_password(), has_content(), safe_name(), save_upload()

### Community 75 - "usta (Usta Hafızası)"
Cohesion: 0.12
Nodes (13): VectorStore, include_object(), API, Commands, Current status (update at the end of each working day), Decisions, Engineering rules (always apply), Jira (+5 more)

### Community 76 - "rules"
Cohesion: 0.20
Nodes (9): plugins, rules, jsx-a11y/media-has-caption, react/exhaustive-deps, react/only-export-components, react/rules-of-hooks, typescript/ban-ts-comment, typescript/no-explicit-any (+1 more)

### Community 77 - "ApiError"
Cohesion: 0.24
Nodes (11): Frontend: API calls and hooks (reuse these, don't write new ones), API_BASE, ApiError, errorMessage(), parse(), postForm(), request(), uploadWithProgress() (+3 more)

### Community 78 - "useApi.ts"
Cohesion: 0.24
Nodes (6): PageBusyContext, Data(), usePageBusy(), ApiResult, Poll, Stored

### Community 81 - "useQrScanner.ts"
Cohesion: 0.21
Nodes (16): CameraInfo, cameraRefused(), currentCamera(), FocusCapabilities, FocusConstraints, keepFocusing(), mainBackCamera(), startCamera() (+8 more)

### Community 83 - "verify.sh"
Cohesion: 0.43
Nodes (6): add(), changed_since_start(), has(), py(), reset(), verify.sh script

### Community 84 - "useVideoPlayer.ts"
Cohesion: 0.31
Nodes (9): Preparation, VideoDetail, requestLanguage(), retryStep(), preparing(), SubtitleChoice, useVideoPlayer(), request() (+1 more)

### Community 86 - "settings.json"
Cohesion: 0.22
Nodes (8): env, GRAPHIFY_OUT, hooks, PostToolUse, Stop, permissions, deny, $schema

### Community 89 - "accept_refinement"
Cohesion: 0.53
Nodes (3): accept_refinement(), test_corrections_of_similar_length_are_taken(), test_empty_or_rewritten_corrections_keep_whisper_text()

### Community 91 - "postJson"
Cohesion: 0.51
Nodes (7): LanguageCode, LoginIn, Me, RegisterIn, AuthContext, AuthContextValue, AuthState

### Community 92 - "test_alerts_socket.py"
Cohesion: 0.12
Nodes (8): mount(), create_app(), lifespan(), validation_error(), _setup(), test_new_question_is_pushed_to_the_usta_live(), test_socket_without_session_is_refused(), Architecture

### Community 93 - "Reusable, strictly typed units"
Cohesion: 0.33
Nodes (5): AI / LLM (backend), Frontend is thin: all complex logic lives in the backend, Frontend: one feature, many small components, Frontend: presentational component, Reusable, strictly typed units

### Community 95 - "Database migrations (Alembic)"
Cohesion: 0.40
Nodes (4): Changing the schema, Database migrations (Alembic), Deploying to a cloud platform, Platform without a shell (SQL console only)

### Community 98 - "db"
Cohesion: 0.12
Nodes (14): main(), run(), get_settings(), make_engine(), make_sessionmaker(), main(), run(), EvalSet (+6 more)

### Community 99 - "usta/api.ts"
Cohesion: 0.39
Nodes (6): ReplyIn, ReplyKind, sendAnswer(), ReplyState, useReply(), send()

### Community 100 - "useCamera.ts"
Cohesion: 0.36
Nodes (6): cameraError(), Facing, HD, stream, track, useCamera()

### Community 103 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, files, references

### Community 121 - "api/index.ts"
Cohesion: 0.16
Nodes (10): MaintenanceRecord, MaintenanceTimeline(), Props, SectionTitle(), machineQrUrl(), machineStickerUrl(), MachineQr(), MaintenanceSection() (+2 more)

## Knowledge Gaps
- **2 isolated node(s):** `HF_HUB_OFFLINE`, `usta-backend`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 775 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Modules` connect `Modules` to `User`, `documents/service.py`, `questions/service.py`, `test_admin.py`, `sqlalchemy`, `AIUnavailableError`, `AIUnavailableError`, `test_videos.py`, `pipeline.py`, `auth/index.ts`, `JobQueue`, `machines/service.py`, `translations/service.py`, `PlayerSettings.tsx`, `AppContext`, `videos/router.py`, `conftest.py`, `Settings`, `useT`, `admin/router.py`, `AdminMachinesPage.tsx`, `ask/api.ts`, `timeline.py`, `media.py`, `LanguageGate.test.tsx`, `AppLayout.tsx`, `build`, `main.py`, `LLMClient`, `postJson`, `test_machines.py`, `handlers.ts`, `@testing-library/react`, `dubbing.py`, `chunking.py`, `ScanPage.tsx`, `utils.tsx`, `auth/service.py`, `JobFailedError`, `QrScanner.tsx`, `lang_name`, `useAction`, `FakeQrScanner`, `views.py`, `usta (Usta Hafızası)`, `ApiError`, `useApi.ts`, `useQrScanner.ts`, `useVideoPlayer.ts`, `accept_refinement`, `ChromaVectorStore`, `useCamera.ts`?**
  _High betweenness centrality (0.470) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useT()` (e.g. with `Architecture` and `Modules`) actually correct?**
  _`useT()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `HF_HUB_OFFLINE`, `usta-backend` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.07393483709273183 - nodes in this community are weakly interconnected._
- **Why does `useT()` connect `useT` to `api/index.ts`, `LanguageGate.test.tsx`, `AppLayout.tsx`, `api/types.ts`, `StepList.tsx`, `UstaHomePage.tsx`, `VideoItem.tsx`, `Modules`, `auth/index.ts`, `UserLanguage.test.tsx`, `PlayerSettings.tsx`, `i18n/index.ts`, `MachineTable.tsx`, `card.tsx`, `Spinner`, `test_alerts_socket.py`, `AdminMachinesPage.tsx`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Are the 142 inferred relationships involving `Modules` (e.g. with `PatronOnly` and `ChromaVectorStore`) actually correct?**
  _`Modules` has 142 INFERRED edges - model-reasoned connections that need verification._
- **Should `documents/service.py` be split into smaller, more focused modules?**
  _Cohesion score 0.062146892655367235 - nodes in this community are weakly interconnected._