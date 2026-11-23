// Mirrors the FastAPI response/request schemas (backend/app/*/schemas.py). Keep both sides in the same change.
// Dates are ISO 8601 strings; durations and timestamps are whole seconds.

export type Role = 'worker' | 'usta' | 'technician' | 'patron';
export type LanguageCode = string; // e.g. 'tr', 'en', 'ar'; the backend owns the supported list

export interface Language {
  code: LanguageCode;
  name: string; // native name: "Türkçe", "English", "العربية"
  tr_name: string; // Turkish name: "Almanca" (language menus search both)
  dir: 'ltr' | 'rtl';
}

/** POST /ui-texts: the UI's Turkish texts in the user's site language (machine-translated once, stored). */
export interface UiTexts {
  language: LanguageCode;
  dir: 'ltr' | 'rtl';
  texts: Record<string, string>; // Turkish text → translation; a missing one stays Turkish
}

export interface Me {
  id: number;
  name: string;
  role: Role;
  language: LanguageCode; // content language of the whole site (header menu)
  language_name: string; // its native name
  authorized: boolean;
  authorization_note: string | null;
}

export interface LoginIn {
  login: string; // phone or e-mail
  password: string;
}

/** Roles anyone may pick at sign-up (backend SELF_SERVICE_ROLES); Teknisyen/Patron are given by the patron. */
export type RegisterRole = Extract<Role, 'worker' | 'usta'>;

/** Self sign-up; the backend creates the account and logs them in. */
export interface RegisterIn extends LoginIn {
  name: string;
  role: RegisterRole;
}

export interface PersonRef {
  id: number;
  name: string;
}

export interface AuthorizedPerson extends PersonRef {
  authorized: boolean;
  authorization_document_url: string | null;
}

/** Text in a known language, so the UI can set lang/dir on it. */
export interface LocalizedText {
  text: string;
  lang: LanguageCode;
  dir: 'ltr' | 'rtl';
}

// ---- machine page (KAN-70) ----

export interface Machine {
  id: number;
  code: string;
  name: string;
  type: string;
  model: string;
  serial: string;
  location: string;
  photo_url: string | null;
}

export type VideoAvailability = 'original' | 'dubbed' | 'subtitles' | 'preparing' | 'on_demand';

export interface VideoSummary {
  id: number;
  title: string;
  author_name: string;
  created_at: string;
  duration_sec: number;
  thumbnail_url: string | null;
  status: 'processing' | 'ready' | 'failed';
  availability: VideoAvailability; // for the viewer's language
}

export type ExternalSource = 'manufacturer' | 'service_company' | 'other';

export interface ExternalVideo {
  id: number;
  title: string;
  url: string;
  embed_url: string | null; // null when the source does not allow embedding
  source: ExternalSource;
}

export type DocumentType = 'user_manual' | 'operating_instructions' | 'catalog' | 'technical_info';
export type SummaryStatus = 'ready' | 'preparing' | 'none';

export interface DocumentSummary {
  id: number;
  title: string;
  type: DocumentType;
  page_count: number;
  summary_status: SummaryStatus;
  summary_preview: LocalizedText | null;
}

export interface Attachment {
  id: number;
  kind: 'photo' | 'video';
  url: string;
}

export interface MaintenanceRecord {
  id: number;
  machine_id: number;
  machine_name: string;
  description: string;
  created_at: string;
  done_by: AuthorizedPerson;
  opened_by: PersonRef;
  attachments: Attachment[];
}

export interface QaEntry {
  id: number;
  machine_id: number;
  machine_name: string;
  question: LocalizedText;
  answer: LocalizedText | null;
  original_question: LocalizedText | null; // set when `question` is a translation
  original_answer: LocalizedText | null;
  answer_video_id: number | null;
  answer_file_url: string | null;
  usta: PersonRef;
  answered_at: string;
}

export interface MachineActions {
  ask: boolean;
  record_video: boolean;
  upload_document: boolean;
  record_maintenance: boolean;
  archive: boolean; // "Makineyi kaldır": the machine's ustas or the patron (KAN-27)
  qr: boolean; // QR image + printable sticker: the machine's ustas or the patron (KAN-29, KAN-30)
}

/** GET /machines?q= : ustas and the patron search every machine (code, name, serial, location). */
export type MachineHit = Pick<Machine, 'id' | 'code' | 'name' | 'location'>;

/** POST /machines → {id}: ustas and the patron add machines; an usta becomes its usta (KAN-27). */
export interface MachineIn {
  code: string;
  name: string;
  type: string;
  model: string;
  serial: string;
  location: string;
}

export interface MachinePage {
  machine: Machine;
  ustas: PersonRef[];
  videos: VideoSummary[];
  external_videos: ExternalVideo[];
  documents: DocumentSummary[];
  maintenance: MaintenanceRecord[]; // newest first
  questions: QaEntry[]; // newest first
  actions: MachineActions;
}

// ---- video player (KAN-38, 50, 55, 56) ----

export type TrackStatus = 'ready' | 'preparing' | 'none' | 'failed' | 'unavailable'; // unavailable: no dubbed voice for that language (subtitles only)
export type StepStatus = 'waiting' | 'running' | 'done' | 'failed';

export interface PipelineStep {
  key: string;
  label: string; // Turkish label from the backend: "Çeviri", "Altyazı", ...
  status: StepStatus;
}

export interface VideoLanguageTrack {
  language: LanguageCode;
  language_name: string;
  language_tr_name: string;
  dir: 'ltr' | 'rtl';
  is_original: boolean;
  subtitles: TrackStatus;
  subtitle_url: string | null; // WebVTT
  audio: TrackStatus;
  stream_url: string | null; // video muxed with this language's audio (original track: the source video)
}

export interface Preparation {
  language: LanguageCode;
  language_name: string;
  steps: PipelineStep[];
}

export interface TranscriptSegment {
  start_sec: number;
  end_sec: number;
  text: string;
}

export interface VideoDetail {
  id: number;
  machine_id: number;
  machine_name: string;
  title: string;
  author_name: string;
  created_at: string;
  duration_sec: number;
  status: 'processing' | 'ready' | 'failed';
  tracks: VideoLanguageTrack[];
  default_subtitle_language: LanguageCode | null;
  default_audio_language: LanguageCode;
  preparation: Preparation | null; // viewer's language being prepared on demand
  transcript: TranscriptSegment[];
  transcript_language: LanguageCode;
  transcript_dir: 'ltr' | 'rtl';
}

export interface VideoProcessing {
  id: number;
  status: 'processing' | 'ready' | 'failed';
  steps: PipelineStep[];
  job_id?: number | null; // on upload: GET /jobs/{id} or WS /ws/jobs/{id} follow the background job
}

// ---- documents (KAN-33, 45) ----

export interface DocumentDetail {
  id: number;
  machine_id: number;
  machine_name: string;
  title: string;
  type: DocumentType;
  page_count: number;
  file_url: string;
  mime_type: string;
  summary_status: SummaryStatus;
  summary: { points: string[]; lang: LanguageCode; dir: 'ltr' | 'rtl'; language_name: string } | null;
}

// ---- ask the machine (KAN-60, 61, 62) ----

export type AnswerSource =
  | {
      kind: 'video';
      video_id: number;
      title: string;
      usta_name: string;
      start_sec: number; // the player opens here
      end_sec: number;
      timestamp_label: string; // "1:05", formatted by the backend
      snapshot_urls: string[]; // keyframes of that part of the video
    }
  | { kind: 'document'; document_id: number; title: string; file_name: string; page: number; section_heading: string | null }
  | { kind: 'usta_answer'; question_id: number; usta_name: string; answered_at: string };

export type AskResult =
  | { status: 'answered'; answer: LocalizedText; sources: AnswerSource[]; confidence: number; ask_id: number }
  | { status: 'not_found'; ustas: PersonRef[]; ask_id: number };

/** POST /ask/{ask_id}/feedback: the worker rates an answer (kept for evaluating search). */
export type AskFeedback = 'helpful' | 'not_helpful';

export interface AskIn {
  question: string;
}

export interface QuestionSent {
  id: number;
  status: 'open';
  recipients: PersonRef[];
}

export interface MyQuestion {
  id: number;
  machine_id: number;
  machine_name: string;
  question: LocalizedText;
  status: 'open' | 'answered';
  created_at: string;
  answer: LocalizedText | null;
  answer_video_id: number | null;
  answer_file_url: string | null;
  usta: PersonRef | null;
}

// ---- usta (KAN-28, 62, 63, 65) ----

export interface InboxQuestion {
  id: number;
  machine_id: number;
  machine_name: string;
  question: LocalizedText; // Turkish for the usta
  original_question: LocalizedText | null; // the worker's own words when translated
  worker_name: string;
  worker_language_name: string;
  created_at: string;
}

export interface UstaProfile {
  id: number;
  name: string;
  machines: Pick<Machine, 'id' | 'code' | 'name'>[];
  answered: QaEntry[];
}

// ---- alerts (KAN-66) ----

export interface Alert {
  id: number;
  text: string;
  created_at: string;
  read: boolean;
  path: string; // screen to open, chosen by the backend
}

export interface AlertList {
  unread_count: number;
  items: Alert[];
}

// ---- maintenance (KAN-39) ----

export interface MaintenanceFormOptions {
  machine: Pick<Machine, 'id' | 'code' | 'name' | 'model' | 'serial' | 'location'>;
  openers: PersonRef[];
}

// ---- admin (KAN-30, 32, 33, 34) ----

export interface AdminStats {
  machines: number;
  videos: number;
  documents: number;
  answered_questions: number;
  maintenance_records: number;
}

export interface AdminMachineRow {
  id: number;
  code: string;
  name: string;
  serial: string;
  location: string;
  ustas: PersonRef[];
  last_maintenance: { date: string; by_name: string } | null;
  video_count: number;
  document_count: number;
}

export interface AdminMachineList {
  stats: AdminStats;
  machines: AdminMachineRow[];
}

export interface AdminUser {
  id: number;
  name: string;
  role: Role;
  authorized: boolean;
  authorization_note: string | null;
  authorization_document_url: string | null;
  machines: PersonRef[];
}

export interface ExternalVideoIn {
  title: string;
  url: string;
  source: ExternalSource;
}
