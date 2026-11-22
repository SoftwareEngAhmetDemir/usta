// Example data shared by Vitest and Playwright (e2e/fixtures.ts). Shapes follow src/api/types.ts.
import type {
  AdminMachineList, AdminUser, AlertList, AskResult, DocumentDetail, InboxQuestion, Language, MachinePage,
  MaintenanceFormOptions, MaintenanceRecord, Me, MyQuestion, QaEntry, QuestionSent, Role, UstaProfile, VideoDetail,
  VideoProcessing,
} from '../api/types';

const ME: Record<Role, Me> = {
  worker: { id: 10, name: 'Yusuf', role: 'worker', language: 'tr', authorized: false, authorization_note: null },
  usta: { id: 7, name: 'Mehmet Usta', role: 'usta', language: 'tr', authorized: false, authorization_note: null },
  technician: { id: 5, name: 'Emre K.', role: 'technician', language: 'tr', authorized: true, authorization_note: 'Forklift periyodik bakım yetki belgesi · 2027-03' },
  patron: { id: 1, name: 'İşletme Sahibi', role: 'patron', language: 'tr', authorized: false, authorization_note: null },
};
export const me = (role: Role, language = 'tr'): Me => ({ ...ME[role], language });

export const languages: Language[] = [
  { code: 'tr', name: 'Türkçe', dir: 'ltr' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
];

export const maintenanceRecord: MaintenanceRecord = {
  id: 31, machine_id: 1, machine_name: 'Plazma Kesim Makinesi',
  description: 'Torç kablosu kontrol edildi, sarf malzemeler değiştirildi.', created_at: '2026-11-14T09:40:00',
  done_by: { id: 5, name: 'Emre K.', authorized: true, authorization_document_url: '/uploads/certs/emre.pdf' },
  opened_by: { id: 7, name: 'Mehmet Usta' }, attachments: [],
};

export const qaEntry: QaEntry = {
  id: 41, machine_id: 1, machine_name: 'Plazma Kesim Makinesi',
  question: { text: 'Kesime başlamadan önce ne kontrol etmeliyim?', lang: 'tr', dir: 'ltr' },
  answer: { text: 'Hava basıncını (≈6 bar), meme ve elektrotu, toprak pensesini kontrol et.', lang: 'tr', dir: 'ltr' },
  original_question: null, original_answer: null, answer_video_id: null, answer_file_url: null,
  usta: { id: 7, name: 'Mehmet Usta' }, answered_at: '2026-11-08T10:00:00',
};

export const machinePage: MachinePage = {
  machine: { id: 1, code: 'PK-105', name: 'Plazma Kesim Makinesi', type: 'Plazma kesim', model: 'PK-105', serial: 'PK105-22871', location: 'Atölye A · Hat 2', photo_url: null },
  ustas: [{ id: 7, name: 'Mehmet Usta' }, { id: 8, name: 'Hasan Usta' }],
  videos: [
    { id: 1, title: 'Meme ve elektrot değişimi', author_name: 'Mehmet Usta', created_at: '2026-11-12T10:00:00', duration_sec: 252, thumbnail_url: null, status: 'ready', availability: 'original' },
    { id: 2, title: 'Kesim öncesi hava basıncı ayarı', author_name: 'Hasan Usta', created_at: '2026-11-04T10:00:00', duration_sec: 155, thumbnail_url: null, status: 'ready', availability: 'original' },
  ],
  external_videos: [{ id: 1, title: 'Üretici: Sarf malzeme seçimi', url: 'https://www.youtube.com/watch?v=demo', embed_url: null, source: 'manufacturer' }],
  documents: [
    { id: 1, title: 'PK-105 Kullanım Kılavuzu', type: 'user_manual', page_count: 84, summary_status: 'ready', summary_preview: { text: 'Kesimden önce hava basıncı 5,9–6,2 bar olmalı.', lang: 'tr', dir: 'ltr' } },
  ],
  maintenance: [maintenanceRecord],
  questions: [qaEntry],
  actions: { ask: true, record_video: false, upload_document: false, record_maintenance: false, archive: false, qr: false },
};

export const videoDetail: VideoDetail = {
  id: 1, machine_id: 1, machine_name: 'Plazma Kesim Makinesi', title: 'Meme ve elektrot değişimi', author_name: 'Mehmet Usta',
  created_at: '2026-11-12T10:00:00', duration_sec: 252, status: 'ready',
  tracks: [
    { language: 'tr', language_name: 'Türkçe', dir: 'ltr', is_original: true, subtitles: 'ready', subtitle_url: '/uploads/videos/1/tr.vtt', audio: 'ready', stream_url: '/uploads/videos/1/original.mp4' },
    { language: 'en', language_name: 'English', dir: 'ltr', is_original: false, subtitles: 'ready', subtitle_url: '/uploads/videos/1/en.vtt', audio: 'ready', stream_url: '/uploads/videos/1/en.mp4' },
    { language: 'ar', language_name: 'العربية', dir: 'rtl', is_original: false, subtitles: 'none', subtitle_url: null, audio: 'none', stream_url: null },
  ],
  default_subtitle_language: 'tr', default_audio_language: 'tr', preparation: null,
  transcript: [
    { start_sec: 0, end_sec: 14, text: 'Önce makinenin ana şalterini kapatıyoruz ve hava beslemesini kesiyoruz.' },
    { start_sec: 108, end_sec: 150, text: "Elektrotun ucundaki çukur 1,5 milimetreyi geçtiyse elektrotu değiştirin." },
  ],
  transcript_language: 'tr', transcript_dir: 'ltr',
};

export const documentDetail: DocumentDetail = {
  id: 1, machine_id: 1, machine_name: 'Plazma Kesim Makinesi', title: 'PK-105 Kullanım Kılavuzu', type: 'user_manual', page_count: 84,
  file_url: '/uploads/docs/pk105.pdf', mime_type: 'application/pdf', summary_status: 'ready',
  summary: { points: ['Kesimden önce hava basıncı 5,9–6,2 bar olmalı (s. 22).', 'Meme ve elektrot birlikte değiştirilir (s. 37).'], lang: 'tr', dir: 'ltr', language_name: 'Türkçe' },
};

export const askAnswered: AskResult = {
  status: 'answered',
  answer: { text: "Elektrotun ucundaki çukur 1,5 mm'yi geçtiğinde elektrotu değiştirin.", lang: 'tr', dir: 'ltr' },
  sources: [
    { kind: 'video', video_id: 1, title: 'Meme ve elektrot değişimi', usta_name: 'Mehmet Usta', start_sec: 108, end_sec: 152, timestamp_label: '1:48', snapshot_urls: ['/uploads/videos/1/snapshots/t2_0.jpg'] },
    { kind: 'document', document_id: 1, title: 'PK-105 Kullanım Kılavuzu', file_name: 'pk105-kilavuz.pdf', page: 37, section_heading: '7. Bakım' },
    { kind: 'usta_answer', question_id: 41, usta_name: 'Mehmet Usta', answered_at: '2026-11-08T10:00:00' },
  ],
  confidence: 0.91,
  ask_id: 301,
};
export const askNotFound: AskResult = { status: 'not_found', ustas: machinePage.ustas, ask_id: 302 };
export const questionSent: QuestionSent = { id: 51, status: 'open', recipients: machinePage.ustas };

export const myQuestions: MyQuestion[] = [
  { id: 51, machine_id: 1, machine_name: 'Plazma Kesim Makinesi', question: { text: 'Kesimin altında çapak oluşuyor, ne yapmalıyım?', lang: 'tr', dir: 'ltr' }, status: 'open', created_at: '2026-11-19T09:00:00', answer: null, answer_video_id: null, answer_file_url: null, usta: null },
  { id: 41, machine_id: 1, machine_name: 'Plazma Kesim Makinesi', question: qaEntry.question, status: 'answered', created_at: '2026-11-08T09:00:00', answer: qaEntry.answer, answer_video_id: null, answer_file_url: null, usta: qaEntry.usta },
];

export const inboxQuestion: InboxQuestion = {
  id: 51, machine_id: 1, machine_name: 'Plazma Kesim Makinesi',
  question: { text: 'Kesimin altında çapak oluşuyor, ne yapmalıyım?', lang: 'tr', dir: 'ltr' },
  original_question: { text: 'يتكون نتوء تحت القطع، ماذا أفعل؟', lang: 'ar', dir: 'rtl' },
  worker_name: 'Yusuf', worker_language_name: 'العربية', created_at: '2026-11-19T09:00:00',
};

export const ustaProfile: UstaProfile = {
  id: 7, name: 'Mehmet Usta', machines: [{ id: 1, code: 'PK-105', name: 'Plazma Kesim Makinesi' }, { id: 4, code: 'AB-01', name: 'Abkant Pres' }], answered: [qaEntry],
};

export const alertList: AlertList = {
  unread_count: 1,
  items: [{ id: 1, text: 'Yeni soru · Plazma Kesim Makinesi: “Kesimin altında çapak oluşuyor”', created_at: '2026-11-19T09:00:00', read: false, path: '/usta/questions/51' }],
};

export const maintenanceForm: MaintenanceFormOptions = {
  machine: { id: 2, code: 'FL-03', name: 'Forklift 3', model: '1.8 t elektrikli', serial: 'FL18-40211', location: 'Depo · Rampa 1' },
  openers: [{ id: 9, name: 'Ali Usta' }, { id: 7, name: 'Mehmet Usta' }],
};

export const processing: VideoProcessing = {
  id: 9, status: 'processing',
  steps: [
    { key: 'upload', label: 'Yüklendi', status: 'done' },
    { key: 'compress', label: 'Sıkıştırılıyor (H.264)', status: 'running' },
    { key: 'transcribe', label: 'Konuşma metne dönüştürülüyor', status: 'waiting' },
    { key: 'index', label: 'Aramaya ekleniyor', status: 'waiting' },
  ],
};

export const adminMachines: AdminMachineList = {
  stats: { machines: 2, videos: 3, documents: 4, answered_questions: 1, maintenance_records: 3 },
  machines: [
    { id: 1, code: 'PK-105', name: 'Plazma Kesim Makinesi', serial: 'PK105-22871', location: 'Atölye A · Hat 2', ustas: machinePage.ustas, last_maintenance: { date: '2026-11-14T09:40:00', by_name: 'Emre K.' }, video_count: 2, document_count: 3 },
    { id: 2, code: 'FL-03', name: 'Forklift 3', serial: 'FL18-40211', location: 'Depo · Rampa 1', ustas: [{ id: 9, name: 'Ali Usta' }], last_maintenance: null, video_count: 1, document_count: 1 },
  ],
};

export const adminUsers: AdminUser[] = [
  { id: 7, name: 'Mehmet Usta', role: 'usta', authorized: false, authorization_note: null, authorization_document_url: null, machines: [{ id: 1, name: 'Plazma Kesim Makinesi' }] },
  { id: 5, name: 'Emre K.', role: 'technician', authorized: true, authorization_note: 'Forklift periyodik bakım yetki belgesi', authorization_document_url: '/uploads/certs/emre.pdf', machines: [] },
];
