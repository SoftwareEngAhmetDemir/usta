# Graph Report - usta  (2026-11-24)

## Corpus Check
- 548 files · ~110,015 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .ini 1)

## Summary
- 2729 nodes · 9010 edges · 120 communities (78 shown, 42 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 778 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ae29929`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Modules
- add_external_video
- documents/service.py
- questions/service.py
- auth/router.py
- sqlalchemy
- Xhr
- AIUnavailableError
- VideoItem.tsx
- media.py
- pipeline.py
- auth/index.ts
- translate_ui
- snapshots.py
- @testing-library/react
- queue.py
- machines/service.py
- translations/service.py
- package.json
- PlayerSettings.tsx
- AppContext
- videos/router.py
- conftest.py
- Settings
- test_auth_api.py
- MachineTable.tsx
- VideoPage.test.tsx
- useT
- fakes.py
- admin/router.py
- DocumentUploadForm.tsx
- ask/api.ts
- zxing.ts
- extract.py
- timeline.py
- topics.py
- LanguageGate.test.tsx
- AlertsProvider.tsx
- api/types.ts
- _read_wav
- components.json
- vite.config.ts
- AlertBell.tsx
- compilerOptions
- build
- OkXhr
- Xhr
- alerts/router.py
- compilerOptions
- interfaces.py
- OkXhr
- eval_retrieval.py
- test_machines.py
- scripts
- react
- handlers.ts
- @testing-library/react
- dubbing.py
- UserLanguage.test.tsx
- cn
- utils.tsx
- auth/service.py
- dependencies
- FakeQrScanner
- backend.ts
- Card
- AppLayout.tsx
- views.py
- usta (Usta Hafızası)
- rules
- postJson
- useApi.ts
- ScanPage.tsx
- verify.sh
- MakeUser
- settings.json
- accept_refinement
- useVideoPlayer.ts
- ask_machine
- test_health.py
- Database migrations (Alembic)
- uploadWithProgress
- useCamera.ts
- Reusable, strictly typed units
- tsconfig.json
- post-edit.sh
- session-start.sh
- feature/SKILL.md
- ticket/SKILL.md
- dev.sh
- README.md
- usta-backend
- FakeSocket
- api/index.ts
- User

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
- `Modules` --references--> `createMachine()`  [INFERRED]
  CLAUDE.md → frontend/src/features/machine-new/api.ts
- `Stack & layout` --references--> `VectorStore`  [INFERRED]
  CLAUDE.md → backend/app/ai/interfaces.py
- `Current status (update at the end of each working day)` --references--> `useUiBusyNow()`  [INFERRED]
  CLAUDE.md → frontend/src/i18n/useUiLoading.ts
- `Architecture` --references--> `AppContext`  [INFERRED]
  CLAUDE.md → backend/app/context.py
- `Architecture` --references--> `create_app()`  [INFERRED]
  CLAUDE.md → backend/app/main.py

## Import Cycles
- None detected.

## Communities (120 total, 42 thin omitted)

### Community 0 - "Modules"
Cohesion: 0.07
Nodes (32): AIServices, AskLog, answer_question(), Answered, _date(), _describe(), DocumentSource, NotFound (+24 more)

### Community 1 - "add_external_video"
Cohesion: 0.09
Nodes (16): add_external_video(), code_for_qr(), create_machine(), ExternalVideoIn, get_machine(), lookup(), machine_qr(), machine_sticker() (+8 more)

### Community 2 - "documents/service.py"
Cohesion: 0.06
Nodes (27): lang_dir(), Document, DocumentPage, DocumentSummaryText, DocumentType, SummaryStatus, detail_out(), DocumentDetail (+19 more)

### Community 3 - "questions/service.py"
Cohesion: 0.07
Nodes (34): notify(), localized(), LocalizedText, Question, QuestionStatus, answer(), ask_usta(), get_question() (+26 more)

### Community 4 - "auth/router.py"
Cohesion: 0.06
Nodes (24): answer_system(), answer_user(), refine_transcript(), search_queries(), summarize(), LanguageIn, languages(), _log_in() (+16 more)

### Community 5 - "sqlalchemy"
Cohesion: 0.08
Nodes (13): utcnow(), Base, MaintenanceAttachment, DubbedVersion, do_run_migrations(), run_async_migrations(), upgrade(), upgrade() (+5 more)

### Community 7 - "AIUnavailableError"
Cohesion: 0.09
Nodes (15): DisabledLLM, _FreeEndpoint, GoogleFreeTranslator, _mp3_to_wav(), parse_translation(), split_for_speech(), AIUnavailableError, AnswerDraft (+7 more)

### Community 8 - "VideoItem.tsx"
Cohesion: 0.08
Nodes (29): ExternalVideo, TranscriptSegment, VideoAvailability, VideoSummary, ListItem(), Props, Kind, KIND (+21 more)

### Community 9 - "media.py"
Cohesion: 0.16
Nodes (12): dub_track(), duration(), extract_audio(), MediaError, mux_dub(), place_clips(), retime(), _run() (+4 more)

### Community 10 - "pipeline.py"
Cohesion: 0.12
Nodes (30): abs_path(), root(), TopicSegment, TranscriptSegment, Video, _audio(), _audio16k(), _clips_dir() (+22 more)

### Community 11 - "auth/index.ts"
Cohesion: 0.24
Nodes (7): HomeRedirect(), AuthShell(), HOME_BY_ROLE, ROLE_LABEL, LoginPage(), fromState(), RegisterPage()

### Community 12 - "translate_ui"
Cohesion: 0.25
Nodes (3): translate_ui(), UiTextsIn, UiTextsOut

### Community 13 - "snapshots.py"
Cohesion: 0.15
Nodes (8): gray_frame(), _pgm(), extract_snapshots(), _scored(), sharpness(), SnapshotFrame, test_pgm_parsing(), test_sharp_edges_score_higher_than_blur()

### Community 14 - "@testing-library/react"
Cohesion: 0.07
Nodes (13): a, alert, show(), ustas, v, ext, video, hit (+5 more)

### Community 15 - "queue.py"
Cohesion: 0.05
Nodes (12): Job, JobStatus, JobFailedError, JobQueue, progress(), get_job(), job_out(), job_socket() (+4 more)

### Community 16 - "machines/service.py"
Cohesion: 0.12
Nodes (13): AuthorizedPerson, PersonRef, url(), create_maintenance(), FormMachine, maintenance_form(), MaintenanceFormOptions, my_maintenance() (+5 more)

### Community 17 - "translations/service.py"
Cohesion: 0.20
Nodes (9): Translator, Translation, _framed(), source_hash(), stored(), translate(), ui_texts(), _unframed() (+1 more)

### Community 18 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, jsdom@^28.1.0, oxlint@^1.90.0, @playwright/test@^1.65.1, tailwindcss@^4.3.5, @testing-library/dom@^10.4.2, @testing-library/jest-dom@^8.0.0, @testing-library/react@^16.3.3 (+19 more)

### Community 19 - "PlayerSettings.tsx"
Cohesion: 0.08
Nodes (28): VideoLanguageTrack, filterOptions(), normalize(), SearchOption, options, Props, SearchSelect(), options (+20 more)

### Community 20 - "AppContext"
Cohesion: 0.08
Nodes (59): Role, AppContext, Snapshot, FakeAI, docx(), photo(), scanned_pdf(), test_broken_file_gives_an_empty_document_not_a_crash() (+51 more)

### Community 21 - "videos/router.py"
Cohesion: 0.10
Nodes (31): lang_tr_name(), StepStatus, VideoStep, create_steps(), reset_for_reprocess(), start(), create_video(), delete_video() (+23 more)

### Community 22 - "conftest.py"
Cohesion: 0.06
Nodes (31): main(), run(), get_settings(), make_engine(), make_sessionmaker(), main(), run(), register_jobs() (+23 more)

### Community 23 - "Settings"
Cohesion: 0.07
Nodes (15): build(), client(), GeminiLLM, _Points, _Queries, _Sentence, _Sentences, GoogleFreeTTS (+7 more)

### Community 24 - "test_auth_api.py"
Cohesion: 0.28
Nodes (11): create_user(), test_expired_session_is_rejected(), test_login_with_differently_written_phone(), test_login_wrong_password_or_unknown_login_is_401(), test_logout_ends_the_session_on_the_server(), test_me_without_session_is_401(), test_register_as_usta(), test_register_cannot_pick_technician_or_patron() (+3 more)

### Community 25 - "MachineTable.tsx"
Cohesion: 0.26
Nodes (11): Pill(), PillTone, TONE_CLASS, Table(), TableBody(), TableCell(), TableHead(), TableHeader() (+3 more)

### Community 26 - "VideoPage.test.tsx"
Cohesion: 0.22
Nodes (8): click(), persian, pick(), openSettings(), pickFrom(), preparing, show(), videoDetail

### Community 27 - "useT"
Cohesion: 0.11
Nodes (33): AdminMachineRow, DocumentDetail, useApi(), AppRoutes(), AsyncView(), PageTitle(), AdminMachinesPage(), addExternalVideo() (+25 more)

### Community 28 - "fakes.py"
Cohesion: 0.12
Nodes (9): _Failing, FakeEmbedder, FakeLLM, FakeReranker, FakeTranscriber, FakeTranslator, FakeTTS, silent_wav() (+1 more)

### Community 29 - "admin/router.py"
Cohesion: 0.12
Nodes (13): admin_machines(), admin_users(), AdminMachineList, AdminMachineRow, AdminStats, AdminUser, _count(), _counts() (+5 more)

### Community 30 - "DocumentUploadForm.tsx"
Cohesion: 0.09
Nodes (31): DocumentType, ExternalSource, Machine, ErrorMessage(), ICON, Notice(), STYLE, Tone (+23 more)

### Community 31 - "ask/api.ts"
Cohesion: 0.22
Nodes (12): AskResult, QuestionSent, ActionState, useAction(), askMachine(), askUsta(), sendFeedback(), Exchange (+4 more)

### Community 32 - "zxing.ts"
Cohesion: 0.25
Nodes (6): zxing-wasm@3.1.7, load(), Native, prepare, ZxingDetector, zxing-wasm

### Community 33 - "extract.py"
Cohesion: 0.07
Nodes (33): ocr_image(), OCRError, _csv(), _decode(), _docx(), extract(), Extracted, _image() (+25 more)

### Community 34 - "timeline.py"
Cohesion: 0.17
Nodes (17): WhisperSegment, Word, build_sentence_timeline(), compute_speaking_rate(), format_timestamp(), RateSummary, Sentence, _sentence() (+9 more)

### Community 35 - "topics.py"
Cohesion: 0.10
Nodes (20): normalize(), tokenize(), _best_split(), depth_scores(), detect_topic_boundaries(), gap_similarities(), _length(), lexical_gap_similarities() (+12 more)

### Community 36 - "LanguageGate.test.tsx"
Cohesion: 0.11
Nodes (24): LanguageGate(), Props, gate(), Page(), usePageReveal(), PageSkeleton(), Skeleton(), I18nContext (+16 more)

### Community 37 - "AlertsProvider.tsx"
Cohesion: 0.18
Nodes (16): Alert, AlertList, app(), FakeSocket, Toast(), unread, AlertsPage(), AlertsProvider() (+8 more)

### Community 38 - "api/types.ts"
Cohesion: 0.06
Nodes (37): AdminMachineList, AdminUser, AnswerSource, AskFeedback, AskIn, Attachment, ExternalVideoIn, LocalizedText (+29 more)

### Community 40 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 41 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.5, vite@^8.3.6, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 43 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 44 - "build"
Cohesion: 0.13
Nodes (3): CrossEncoderReranker, E5Embedder, _identity()

### Community 47 - "alerts/router.py"
Cohesion: 0.14
Nodes (7): AlertHub, Alert, list_alerts(), mark_read(), alert_list(), AlertList, AlertOut

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 49 - "interfaces.py"
Cohesion: 0.06
Nodes (10): ChromaVectorStore, Embedder, Reranker, Transcriber, TranscriptionResult, TTSEngine, VectorHit, VectorStore (+2 more)

### Community 51 - "eval_retrieval.py"
Cohesion: 0.22
Nodes (11): Case, EvalSet, Expected, hit_rank(), matches(), report(), Report, main() (+3 more)

### Community 52 - "test_machines.py"
Cohesion: 0.06
Nodes (31): get_ctx(), get_session(), public_url(), code_for_qr(), _font(), machine_url(), _qr(), sticker_sheet() (+23 more)

### Community 55 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, dev:mock, init, lint, preview, test (+4 more)

### Community 56 - "react"
Cohesion: 0.09
Nodes (29): errorMessage(), AuthorizedPerson, PersonRef, Button(), Field(), Input(), Label(), Textarea() (+21 more)

### Community 57 - "handlers.ts"
Cohesion: 0.05
Nodes (46): MachineActions, MyQuestion, PipelineStep, Role, VideoDetail, VideoProcessing, App(), pickType() (+38 more)

### Community 58 - "@testing-library/react"
Cohesion: 0.12
Nodes (23): app(), NoSocket, show(), show(), home(), adminUsers, alertList, askNotFound (+15 more)

### Community 59 - "dubbing.py"
Cohesion: 0.26
Nodes (12): fit_clip_to_slot(), Placement, plan_dub(), Slot, srt(), _ts(), vtt(), test_a_clip_that_does_not_fit_borrows_from_the_next_pause() (+4 more)

### Community 61 - "cn"
Cohesion: 0.13
Nodes (14): StepStatus, ButtonProps, VARIANT, ProgressBar(), ICON, STATUS_TEXT, Badge(), badgeVariants (+6 more)

### Community 62 - "utils.tsx"
Cohesion: 0.12
Nodes (13): app(), Logout(), me, RequireAuth(), renderWithState(), fakeQr, Result, OtherPage() (+5 more)

### Community 63 - "auth/service.py"
Cohesion: 0.07
Nodes (19): mount(), PatronOnly, alerts_socket(), current_user(), AuthSession, hash_password(), _scrypt(), verify_password() (+11 more)

### Community 68 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, barcode-detector@^3.2.4, class-variance-authority@^0.7.1, cn@^0.5.2, lucide-react@^1.78.0, qr-scanner@^1.4.2, radix-ui@^1.8.1, react@^19.3.1 (+7 more)

### Community 71 - "backend.ts"
Cohesion: 0.30
Nodes (6): Body, defaults(), Handler, mockBackend(), Routes, @playwright/test

### Community 72 - "Card"
Cohesion: 0.07
Nodes (30): API_BASE, DocumentSummary, InboxQuestion, UstaProfile, EmptyState(), QaCard(), SectionTitle(), Card() (+22 more)

### Community 73 - "AppLayout.tsx"
Cohesion: 0.16
Nodes (16): Language, AppLayout(), NavBar(), ALERTS, NAV, NavItem, QUESTIONS, RECORD (+8 more)

### Community 74 - "views.py"
Cohesion: 0.08
Nodes (14): DocumentAdmin, _drop_vectors(), MachineAdmin, MaintenanceAdmin, QuestionAdmin, _remove_folder(), _take_upload(), UserAdmin (+6 more)

### Community 75 - "usta (Usta Hafızası)"
Cohesion: 0.14
Nodes (12): include_object(), API, Architecture, Commands, Current status (update at the end of each working day), Engineering rules (always apply), Jira, Maintaining this file (+4 more)

### Community 76 - "rules"
Cohesion: 0.20
Nodes (9): plugins, rules, jsx-a11y/media-has-caption, react/exhaustive-deps, react/only-export-components, react/rules-of-hooks, typescript/ban-ts-comment, typescript/no-explicit-any (+1 more)

### Community 77 - "postJson"
Cohesion: 0.29
Nodes (12): Frontend: API calls and hooks (reuse these, don't write new ones), ApiError, parse(), postForm(), postJson(), request(), fetchMe(), login() (+4 more)

### Community 78 - "useApi.ts"
Cohesion: 0.24
Nodes (6): PageBusyContext, Data(), usePageBusy(), ApiResult, Poll, Stored

### Community 81 - "ScanPage.tsx"
Cohesion: 0.05
Nodes (42): Dialog(), DialogClose(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogPortal() (+34 more)

### Community 83 - "verify.sh"
Cohesion: 0.43
Nodes (6): add(), changed_since_start(), has(), py(), reset(), verify.sh script

### Community 85 - "MakeUser"
Cohesion: 0.22
Nodes (11): ExternalVideoAdmin, ExternalVideo, _can_log_in(), test_admin_machines_stats_and_search(), test_admin_users_lists_roles_and_machines(), test_maintenance_records_are_read_only_in_sqladmin(), test_outside_video_link_in_sqladmin_must_be_http(), test_patron_resets_a_password_in_sqladmin() (+3 more)

### Community 86 - "settings.json"
Cohesion: 0.22
Nodes (8): env, GRAPHIFY_OUT, hooks, PostToolUse, Stop, permissions, deny, $schema

### Community 89 - "accept_refinement"
Cohesion: 0.53
Nodes (3): accept_refinement(), test_corrections_of_similar_length_are_taken(), test_empty_or_rewritten_corrections_keep_whisper_text()

### Community 91 - "useVideoPlayer.ts"
Cohesion: 0.22
Nodes (15): LanguageCode, LoginIn, Me, Preparation, RegisterIn, AuthContext, AuthContextValue, AuthState (+7 more)

### Community 93 - "ask_machine"
Cohesion: 0.24
Nodes (3): ask_feedback(), ask_machine(), FeedbackIn

### Community 95 - "Database migrations (Alembic)"
Cohesion: 0.40
Nodes (4): Changing the schema, Database migrations (Alembic), Deploying to a cloud platform, Platform without a shell (SQL console only)

### Community 99 - "uploadWithProgress"
Cohesion: 0.17
Nodes (8): FakeXhr, uploadWithProgress(), ReplyIn, ReplyKind, sendAnswer(), ReplyState, useReply(), send()

### Community 100 - "useCamera.ts"
Cohesion: 0.38
Nodes (5): cameraError(), Facing, stream, track, useCamera()

### Community 102 - "Reusable, strictly typed units"
Cohesion: 0.33
Nodes (5): AI / LLM (backend), Frontend is thin: all complex logic lives in the backend, Frontend: one feature, many small components, Frontend: presentational component, Reusable, strictly typed units

### Community 103 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, files, references

### Community 121 - "api/index.ts"
Cohesion: 0.11
Nodes (14): AdminStats, MaintenanceRecord, AuthorizedBadge(), base, CtaLink(), Props, MaintenanceTimeline(), Props (+6 more)

### Community 122 - "User"
Cohesion: 0.08
Nodes (21): require_role(), check(), User, forbidden(), not_found(), delete_document(), get_document(), upload_document() (+13 more)

## Knowledge Gaps
- **1 isolated node(s):** `usta-backend`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 772 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Modules` connect `Modules` to `documents/service.py`, `questions/service.py`, `auth/router.py`, `sqlalchemy`, `AIUnavailableError`, `media.py`, `pipeline.py`, `auth/index.ts`, `queue.py`, `machines/service.py`, `translations/service.py`, `AppContext`, `videos/router.py`, `conftest.py`, `Settings`, `useT`, `admin/router.py`, `DocumentUploadForm.tsx`, `ask/api.ts`, `extract.py`, `timeline.py`, `topics.py`, `LanguageGate.test.tsx`, `AlertsProvider.tsx`, `build`, `alerts/router.py`, `interfaces.py`, `test_machines.py`, `react`, `handlers.ts`, `@testing-library/react`, `dubbing.py`, `utils.tsx`, `auth/service.py`, `FakeQrScanner`, `AppLayout.tsx`, `views.py`, `usta (Usta Hafızası)`, `postJson`, `useApi.ts`, `ScanPage.tsx`, `accept_refinement`, `useVideoPlayer.ts`, `uploadWithProgress`, `useCamera.ts`, `User`?**
  _High betweenness centrality (0.508) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useT()` (e.g. with `Architecture` and `Modules`) actually correct?**
  _`useT()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `usta-backend` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Modules` be split into smaller, more focused modules?**
  _Cohesion score 0.07086247086247087 - nodes in this community are weakly interconnected._
- **Why does `useT()` connect `useT` to `Modules`, `LanguageGate.test.tsx`, `AlertsProvider.tsx`, `api/types.ts`, `Card`, `AppLayout.tsx`, `VideoItem.tsx`, `usta (Usta Hafızası)`, `AlertBell.tsx`, `auth/index.ts`, `PlayerSettings.tsx`, `MachineTable.tsx`, `react`, `api/index.ts`, `UserLanguage.test.tsx`, `cn`, `DocumentUploadForm.tsx`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Are the 142 inferred relationships involving `Modules` (e.g. with `PatronOnly` and `ChromaVectorStore`) actually correct?**
  _`Modules` has 142 INFERRED edges - model-reasoned connections that need verification._
- **Should `add_external_video` be split into smaller, more focused modules?**
  _Cohesion score 0.09206349206349207 - nodes in this community are weakly interconnected._