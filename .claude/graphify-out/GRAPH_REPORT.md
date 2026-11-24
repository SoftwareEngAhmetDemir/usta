# Graph Report - usta  (2026-11-24)

## Corpus Check
- 545 files · ~106,909 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .ini 1)

## Summary
- 2667 nodes · 8974 edges · 114 communities (86 shown, 28 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 810 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56f2b566`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Modules
- machines/router.py
- documents/service.py
- questions/service.py
- auth/router.py
- sqlalchemy
- maintenance.test.tsx
- AIUnavailableError
- VideoItem.tsx
- media.py
- pipeline.py
- auth/index.ts
- translations/service.py
- test_videos.py
- @testing-library/react
- queue.py
- User
- storage.py
- package.json
- PlayerSettings.tsx
- AppContext
- videos/router.py
- pydantic
- Settings
- chunking.py
- MachineTable.tsx
- fixtures.ts
- i18n/index.ts
- fakes.py
- admin/router.py
- useT
- api/index.ts
- videos/service.py
- extract.py
- timeline.py
- topics.py
- LanguageGate.test.tsx
- AlertsProvider.tsx
- react-router
- fixture
- components.json
- alerts/router.py
- transport.ts
- compilerOptions
- build
- tokenize
- test_documents.py
- main.py
- compilerOptions
- LLMClient
- mock/index.ts
- eval_retrieval.py
- Role
- qr.py
- alerts.test.tsx
- scripts
- react
- useVideoUpload.ts
- @testing-library/react
- dubbing.py
- UserLanguage.test.tsx
- Transcript.tsx
- utils.tsx
- test_auth_api.py
- dialog.tsx
- api/types.ts
- auth/service.py
- handlers.ts
- passwords.py
- FakeQrScanner
- public_url
- backend.ts
- Card
- AppLayout.tsx
- views.py
- usta (Usta Hafızası)
- rules
- snapshots.py
- useApi.ts
- ask/service.py
- PatronOnly
- useQrScanner.ts
- timeline.py
- verify.sh
- ocr_image
- whisper.py
- settings.json
- TranscriptionResult
- run
- accept_refinement
- test_technician_records_maintenance_with_photo
- current_user
- test_ui_texts_come_in_the_users_language_and_are_translated_once
- create_user
- test_health.py
- Database migrations (Alembic)
- alerts_socket
- remove_video
- FakeSocket
- tsconfig.json
- post-edit.sh
- session-start.sh
- feature/SKILL.md
- ticket/SKILL.md
- dev.sh
- README.md
- usta-backend

## God Nodes (most connected - your core abstractions)
1. `useT()` - 181 edges
2. `Modules` - 141 edges
3. `@testing-library/react` - 103 edges
4. `AppContext` - 102 edges
5. `Role` - 102 edges
6. `react` - 87 edges
7. `User` - 75 edges
8. `Machine` - 73 edges
9. `Card()` - 73 edges
10. `react-router` - 67 edges

## Surprising Connections (you probably didn't know these)
- `Modules` --references--> `useQrScanner()`  [INFERRED]
  CLAUDE.md → frontend/src/features/scan/hooks/useQrScanner.ts
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

## Communities (114 total, 28 thin omitted)

### Community 0 - "Modules"
Cohesion: 0.13
Nodes (17): AIServices, process(), lifespan(), startup(), _warm_up(), rrf_merge(), Chunk, Candidate (+9 more)

### Community 1 - "machines/router.py"
Cohesion: 0.11
Nodes (16): ExternalSource, add_external_video(), create_machine(), ExternalVideoIn, get_machine(), lookup(), machine_qr(), machine_sticker() (+8 more)

### Community 2 - "documents/service.py"
Cohesion: 0.05
Nodes (29): lang_dir(), url(), Document, DocumentSummaryText, DocumentType, SummaryStatus, delete_document(), get_document() (+21 more)

### Community 3 - "questions/service.py"
Cohesion: 0.07
Nodes (34): localized(), LocalizedText, PersonRef, Question, QuestionStatus, answer(), ask_usta(), get_question() (+26 more)

### Community 4 - "auth/router.py"
Cohesion: 0.07
Nodes (23): answer_system(), answer_user(), refine_transcript(), search_queries(), summarize(), LanguageIn, languages(), _log_in() (+15 more)

### Community 5 - "sqlalchemy"
Cohesion: 0.08
Nodes (14): utcnow(), Base, DocumentPage, MaintenanceAttachment, Snapshot, TopicSegment, upgrade(), upgrade() (+6 more)

### Community 6 - "maintenance.test.tsx"
Cohesion: 0.33
Nodes (3): Xhr, maintenanceForm, maintenanceRecord

### Community 7 - "AIUnavailableError"
Cohesion: 0.09
Nodes (15): DisabledLLM, _FreeEndpoint, GoogleFreeTranslator, _mp3_to_wav(), parse_translation(), split_for_speech(), AIUnavailableError, AnswerDraft (+7 more)

### Community 8 - "VideoItem.tsx"
Cohesion: 0.08
Nodes (28): ExternalVideo, MaintenanceRecord, VideoSummary, ListItem(), Props, MaintenanceTimeline(), Props, Kind (+20 more)

### Community 9 - "media.py"
Cohesion: 0.12
Nodes (17): dub_track(), duration(), extract_audio(), gray_frame(), MediaError, mux_dub(), _pgm(), place_clips() (+9 more)

### Community 10 - "pipeline.py"
Cohesion: 0.19
Nodes (22): Video, _audio(), _audio16k(), _clips_dir(), dubbed_rel(), _finished(), _index(), _mix() (+14 more)

### Community 11 - "auth/index.ts"
Cohesion: 0.05
Nodes (55): AI / LLM (backend), Frontend: API calls and hooks (reuse these, don't write new ones), Frontend is thin: all complex logic lives in the backend, Frontend: one feature, many small components, Frontend: presentational component, Reusable, strictly typed units, ApiError, errorMessage() (+47 more)

### Community 12 - "translations/service.py"
Cohesion: 0.12
Nodes (12): Translator, Translation, translate_ui(), UiTextsIn, UiTextsOut, _framed(), source_hash(), stored() (+4 more)

### Community 13 - "test_videos.py"
Cohesion: 0.18
Nodes (20): abs_path(), root(), DubbedVersion, TranscriptSegment, FakeAI, _audio_tracks(), _max_volume_db(), test_a_language_without_a_voice_gets_subtitles_only() (+12 more)

### Community 14 - "@testing-library/react"
Cohesion: 0.10
Nodes (7): a, show(), ustas, v, hit, @testing-library/react, @testing-library/user-event

### Community 15 - "queue.py"
Cohesion: 0.07
Nodes (11): Job, JobStatus, JobFailedError, JobQueue, progress(), get_job(), job_out(), job_socket() (+3 more)

### Community 16 - "User"
Cohesion: 0.06
Nodes (31): ask_feedback(), ask_machine(), FeedbackIn, require_role(), check(), User, AuthorizedPerson, forbidden() (+23 more)

### Community 17 - "storage.py"
Cohesion: 0.10
Nodes (4): ChromaVectorStore, VectorHit, safe_name(), save_upload()

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (32): devDependencies, jsdom@^28.1.0, oxlint@^1.90.0, tailwindcss@^4.3.5, @tailwindcss/vite@^4.3.5, @testing-library/dom@^10.4.2, @testing-library/jest-dom@^8.0.0, @testing-library/react@^16.3.3 (+24 more)

### Community 19 - "PlayerSettings.tsx"
Cohesion: 0.07
Nodes (40): Language, LanguageCode, Preparation, VideoDetail, VideoLanguageTrack, filterOptions(), normalize(), SearchOption (+32 more)

### Community 20 - "AppContext"
Cohesion: 0.24
Nodes (22): AppContext, _answered_question(), test_a_question_in_another_language_also_searches_its_machine_translation(), test_a_question_typed_in_another_language_than_the_profile_is_still_translated_for_search(), test_a_vague_question_is_found_through_the_llm_search_rewrite(), test_alert_mark_read(), test_an_answer_file_is_indexed_through_the_document_pipeline(), test_answer_needs_content_and_can_carry_a_file() (+14 more)

### Community 21 - "videos/router.py"
Cohesion: 0.16
Nodes (14): start(), create_video(), delete_video(), get_video(), prepare_language(), retry_step(), upload_video(), _video() (+6 more)

### Community 22 - "pydantic"
Cohesion: 0.09
Nodes (18): main(), run(), normalize_login(), get_settings(), make_engine(), make_sessionmaker(), main(), run() (+10 more)

### Community 23 - "Settings"
Cohesion: 0.08
Nodes (14): build(), client(), GeminiLLM, _Points, _Queries, _Sentence, _Sentences, GoogleFreeTTS (+6 more)

### Community 24 - "chunking.py"
Cohesion: 0.19
Nodes (16): Block, chunk_document(), chunk_video(), DocChunk, estimate_tokens(), _split_paragraph(), _split_table(), _tail() (+8 more)

### Community 25 - "MachineTable.tsx"
Cohesion: 0.17
Nodes (15): AuthorizedBadge(), base, Pill(), PillTone, TONE_CLASS, Badge(), badgeVariants, Table() (+7 more)

### Community 26 - "fixtures.ts"
Cohesion: 0.11
Nodes (12): click(), persian, pick(), adminMachines, adminUsers, askAnswered, documentDetail, inboxQuestion (+4 more)

### Community 27 - "i18n/index.ts"
Cohesion: 0.08
Nodes (38): AdminMachineList, AdminMachineRow, DocumentDetail, useApi(), AppRoutes(), HomeRedirect(), AsyncView(), PageTitle() (+30 more)

### Community 28 - "fakes.py"
Cohesion: 0.14
Nodes (8): _Failing, FakeEmbedder, FakeLLM, FakeReranker, FakeTranslator, FakeTTS, silent_wav(), trigram_vector()

### Community 29 - "admin/router.py"
Cohesion: 0.13
Nodes (13): admin_machines(), admin_users(), AdminMachineList, AdminMachineRow, AdminStats, AdminUser, _count(), _counts() (+5 more)

### Community 30 - "useT"
Cohesion: 0.12
Nodes (19): AnswerSource, LocalizedText, ErrorMessage(), StepList(), AskPage(), AnswerCard(), Props, AskForm() (+11 more)

### Community 31 - "api/index.ts"
Cohesion: 0.15
Nodes (10): MachineIn, ActionState, useAction(), sendFeedback(), useFeedback(), createMachine(), NewMachinePage(), lookup() (+2 more)

### Community 32 - "videos/service.py"
Cohesion: 0.17
Nodes (15): lang_tr_name(), StepStatus, VideoStep, create_steps(), reset_for_reprocess(), availability(), _done(), PipelineStepOut (+7 more)

### Community 33 - "extract.py"
Cohesion: 0.15
Nodes (15): _csv(), _decode(), _docx(), extract(), Extracted, _image(), _inside(), _looks_like_heading() (+7 more)

### Community 34 - "timeline.py"
Cohesion: 0.20
Nodes (12): WhisperSegment, Word, FasterWhisperTranscriber, build_sentence_timeline(), _tokens(), segment(), test_arabic_question_mark_and_segments_without_words(), test_format_timestamp() (+4 more)

### Community 35 - "topics.py"
Cohesion: 0.18
Nodes (15): _best_split(), depth_scores(), detect_topic_boundaries(), gap_similarities(), _length(), _spans(), TopicSpan, test_boundary_where_meaning_and_words_change() (+7 more)

### Community 36 - "LanguageGate.test.tsx"
Cohesion: 0.10
Nodes (25): Architecture, LanguageGate(), Props, gate(), Page(), usePageReveal(), PageSkeleton(), Skeleton() (+17 more)

### Community 37 - "AlertsProvider.tsx"
Cohesion: 0.34
Nodes (9): Alert, AlertList, AlertsProvider(), alertSocketUrl(), fetchAlerts(), markAlertRead(), AlertsContext, AlertsContextValue (+1 more)

### Community 38 - "react-router"
Cohesion: 0.09
Nodes (25): AskFeedback, MachineHit, QaEntry, UstaProfile, ApiState, Chip(), Props, CtaLink() (+17 more)

### Community 39 - "fixture"
Cohesion: 0.13
Nodes (13): ai(), app(), client(), client_as(), make(), ctx(), ctx_of(), make_machine() (+5 more)

### Community 40 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 41 - "alerts/router.py"
Cohesion: 0.23
Nodes (7): Alert, list_alerts(), mark_read(), alert_list(), AlertList, AlertOut, notify()

### Community 42 - "transport.ts"
Cohesion: 0.22
Nodes (11): load(), save(), MockResponse, apiPath(), installFetch(), installTransport(), installWebSocket(), MockXhr (+3 more)

### Community 43 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 44 - "build"
Cohesion: 0.13
Nodes (3): CrossEncoderReranker, E5Embedder, _identity()

### Community 45 - "tokenize"
Cohesion: 0.13
Nodes (7): BM25, normalize(), tokenize(), lexical_gap_similarities(), _stems(), test_bm25_finds_the_exact_error_code(), test_tokenize_keeps_codes_whole_and_ignores_case_and_accents()

### Community 46 - "test_documents.py"
Cohesion: 0.25
Nodes (15): docx(), photo(), scanned_pdf(), test_broken_file_gives_an_empty_document_not_a_crash(), test_delete_document_removes_chunks_vectors_and_file(), test_document_upload_rules(), test_document_without_summary_service_is_still_searchable(), test_office_csv_and_text_files() (+7 more)

### Community 47 - "main.py"
Cohesion: 0.10
Nodes (3): AlertHub, validation_error(), reembed_job()

### Community 48 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 49 - "LLMClient"
Cohesion: 0.10
Nodes (5): Embedder, LLMClient, Reranker, Transcriber, TTSEngine

### Community 50 - "mock/index.ts"
Cohesion: 0.36
Nodes (4): App(), start(), DEMO_LOGINS, resetMockDb()

### Community 51 - "eval_retrieval.py"
Cohesion: 0.24
Nodes (10): Case, EvalSet, Expected, hit_rank(), matches(), report(), Report, _chunk() (+2 more)

### Community 52 - "Role"
Cohesion: 0.25
Nodes (16): Role, test_actions_depend_on_role_and_assignment(), test_archived_machine_leaves_lists_but_keeps_its_page(), test_embed_url_only_for_known_players(), test_everything_needs_login(), test_languages_and_switching_content_language(), test_lookup_by_sticker_code(), test_machine_page_404() (+8 more)

### Community 53 - "qr.py"
Cohesion: 0.15
Nodes (5): _font(), machine_url(), _qr(), sticker_sheet(), svg()

### Community 54 - "alerts.test.tsx"
Cohesion: 0.26
Nodes (5): app(), Toast(), AlertBell(), AlertToast(), alert

### Community 55 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, dev:mock, init, lint, preview, test (+4 more)

### Community 56 - "react"
Cohesion: 0.06
Nodes (51): AuthorizedPerson, DocumentType, ExternalSource, Machine, PersonRef, Button(), ButtonProps, VARIANT (+43 more)

### Community 57 - "useVideoUpload.ts"
Cohesion: 0.09
Nodes (13): cameraError(), Facing, stream, track, useCamera(), pickType(), FakeRecorder, TYPES (+5 more)

### Community 58 - "@testing-library/react"
Cohesion: 0.08
Nodes (24): app(), NoSocket, unread, show(), OkXhr, show(), Xhr, FakeSocket (+16 more)

### Community 59 - "dubbing.py"
Cohesion: 0.26
Nodes (12): fit_clip_to_slot(), Placement, plan_dub(), Slot, srt(), _ts(), vtt(), test_a_clip_that_does_not_fit_borrows_from_the_next_pause() (+4 more)

### Community 61 - "Transcript.tsx"
Cohesion: 0.17
Nodes (11): ICON, STATUS_TEXT, Button(), buttonVariants, Collapsible(), CollapsibleContent(), CollapsibleTrigger(), show() (+3 more)

### Community 62 - "utils.tsx"
Cohesion: 0.19
Nodes (8): fakeQr, Result, OtherPage(), Json, renderAt(), Routes_, stubQrCamera(), vitest

### Community 63 - "test_auth_api.py"
Cohesion: 0.29
Nodes (11): AuthSession, test_expired_session_is_rejected(), test_login_with_differently_written_phone(), test_login_wrong_password_or_unknown_login_is_401(), test_logout_ends_the_session_on_the_server(), test_me_without_session_is_401(), test_register_as_usta(), test_register_cannot_pick_technician_or_patron() (+3 more)

### Community 64 - "dialog.tsx"
Cohesion: 0.31
Nodes (10): Dialog(), DialogClose(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogPortal() (+2 more)

### Community 65 - "api/types.ts"
Cohesion: 0.11
Nodes (24): AdminStats, AdminUser, AskIn, Attachment, ExternalVideoIn, InboxQuestion, MachineActions, MachinePage (+16 more)

### Community 66 - "auth/service.py"
Cohesion: 0.27
Nodes (7): authenticate(), end_session(), set_role(), start_session(), _token_hash(), user_for_token(), _utcnow()

### Community 67 - "handlers.ts"
Cohesion: 0.21
Nodes (15): ACTIONS, alert(), ask(), fail(), field(), handle(), MockRequest, now() (+7 more)

### Community 68 - "passwords.py"
Cohesion: 0.36
Nodes (6): hash_password(), _scrypt(), verify_password(), test_garbage_hash_is_rejected_not_raised(), test_hash_verifies_only_the_same_password(), test_same_password_gets_a_different_salt()

### Community 70 - "public_url"
Cohesion: 0.18
Nodes (5): get_ctx(), get_session(), public_url(), _request(), test_qr_url_is_the_address_the_sticker_was_downloaded_from()

### Community 71 - "backend.ts"
Cohesion: 0.27
Nodes (7): Body, defaults(), Handler, mockBackend(), Routes, @playwright/test@^1.65.1, @playwright/test

### Community 72 - "Card"
Cohesion: 0.08
Nodes (25): API_BASE, DocumentSummary, EmptyState(), SectionTitle(), Card(), LABELS, StatsTiles(), archiveMachine() (+17 more)

### Community 73 - "AppLayout.tsx"
Cohesion: 0.21
Nodes (11): AppLayout(), NavBar(), ALERTS, NAV, NavItem, QUESTIONS, RECORD, SCAN (+3 more)

### Community 74 - "views.py"
Cohesion: 0.07
Nodes (24): DocumentAdmin, _drop_vectors(), ExternalVideoAdmin, MachineAdmin, MaintenanceAdmin, QuestionAdmin, _remove_folder(), _take_upload() (+16 more)

### Community 75 - "usta (Usta Hafızası)"
Cohesion: 0.09
Nodes (15): VectorStore, do_run_migrations(), include_object(), run_async_migrations(), API, Commands, Current status (update at the end of each working day), Decisions (+7 more)

### Community 76 - "rules"
Cohesion: 0.20
Nodes (9): plugins, rules, jsx-a11y/media-has-caption, react/exhaustive-deps, react/only-export-components, react/rules-of-hooks, typescript/ban-ts-comment, typescript/no-explicit-any (+1 more)

### Community 77 - "snapshots.py"
Cohesion: 0.25
Nodes (4): extract_snapshots(), _scored(), sharpness(), SnapshotFrame

### Community 78 - "useApi.ts"
Cohesion: 0.24
Nodes (6): PageBusyContext, Data(), usePageBusy(), ApiResult, Poll, Stored

### Community 79 - "ask/service.py"
Cohesion: 0.16
Nodes (13): AskLog, answer_question(), Answered, _date(), _describe(), DocumentSource, NotFound, _retrieved() (+5 more)

### Community 81 - "useQrScanner.ts"
Cohesion: 0.06
Nodes (41): dependencies, barcode-detector@^3.2.4, class-variance-authority@^0.7.1, cn@^0.5.2, lucide-react@^1.78.0, qr-scanner@^1.4.2, radix-ui@^1.8.1, react@^19.3.1 (+33 more)

### Community 82 - "timeline.py"
Cohesion: 0.31
Nodes (5): compute_speaking_rate(), RateSummary, Sentence, _sentence(), transcript_lines()

### Community 83 - "verify.sh"
Cohesion: 0.43
Nodes (6): add(), changed_since_start(), has(), py(), reset(), verify.sh script

### Community 86 - "settings.json"
Cohesion: 0.22
Nodes (8): env, GRAPHIFY_OUT, hooks, PostToolUse, Stop, permissions, deny, $schema

### Community 88 - "run"
Cohesion: 0.33
Nodes (3): job(), run(), _set()

### Community 89 - "accept_refinement"
Cohesion: 0.53
Nodes (3): accept_refinement(), test_corrections_of_similar_length_are_taken(), test_empty_or_rewritten_corrections_keep_whisper_text()

### Community 95 - "Database migrations (Alembic)"
Cohesion: 0.40
Nodes (4): Changing the schema, Database migrations (Alembic), Deploying to a cloud platform, Platform without a shell (SQL console only)

### Community 103 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, files, references

## Knowledge Gaps
- **1 isolated node(s):** `usta-backend`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 735 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Modules` connect `Modules` to `machines/router.py`, `documents/service.py`, `questions/service.py`, `sqlalchemy`, `AIUnavailableError`, `media.py`, `pipeline.py`, `auth/index.ts`, `translations/service.py`, `test_videos.py`, `queue.py`, `User`, `storage.py`, `PlayerSettings.tsx`, `AppContext`, `videos/router.py`, `pydantic`, `Settings`, `chunking.py`, `i18n/index.ts`, `admin/router.py`, `useT`, `api/index.ts`, `videos/service.py`, `timeline.py`, `LanguageGate.test.tsx`, `AlertsProvider.tsx`, `fixture`, `alerts/router.py`, `build`, `tokenize`, `main.py`, `LLMClient`, `useVideoUpload.ts`, `@testing-library/react`, `dubbing.py`, `utils.tsx`, `test_auth_api.py`, `FakeQrScanner`, `public_url`, `AppLayout.tsx`, `views.py`, `usta (Usta Hafızası)`, `useApi.ts`, `ask/service.py`, `PatronOnly`, `useQrScanner.ts`, `timeline.py`, `accept_refinement`, `remove_video`?**
  _High betweenness centrality (0.494) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useT()` (e.g. with `Architecture` and `Modules`) actually correct?**
  _`useT()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `usta-backend` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Modules` be split into smaller, more focused modules?**
  _Cohesion score 0.13109243697478992 - nodes in this community are weakly interconnected._
- **Why does `useT()` connect `useT` to `Modules`, `dialog.tsx`, `LanguageGate.test.tsx`, `react-router`, `VideoItem.tsx`, `AppLayout.tsx`, `Card`, `auth/index.ts`, `PlayerSettings.tsx`, `alerts.test.tsx`, `react`, `MachineTable.tsx`, `i18n/index.ts`, `UserLanguage.test.tsx`, `Transcript.tsx`, `api/index.ts`?**
  _High betweenness centrality (0.255) - this node is a cross-community bridge._
- **Are the 140 inferred relationships involving `Modules` (e.g. with `PatronOnly` and `ChromaVectorStore`) actually correct?**
  _`Modules` has 140 INFERRED edges - model-reasoned connections that need verification._
- **Should `machines/router.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10810810810810811 - nodes in this community are weakly interconnected._