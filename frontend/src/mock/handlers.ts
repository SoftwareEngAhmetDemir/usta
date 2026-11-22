// Fake FastAPI for `npm run dev:mock`: same paths and shapes as src/api/types.ts, state in MockDb.
import type {
  Alert, AnswerSource, DocumentType, ExternalSource, MachineActions, MachinePage, MaintenanceRecord, Me, PipelineStep,
  QaEntry, Role, VideoDetail,
} from '../api/types';
import * as fx from '../test/fixtures';
import { DEMO_LOGINS, type MockDb } from './db';

export interface MockRequest {
  method: string;
  path: string; // without /api, query included
  body: unknown; // parsed JSON or FormData
}
export interface MockResponse {
  status: number;
  body: unknown;
}

const ok = (body: unknown): MockResponse => ({ status: body === null ? 204 : 200, body });
const fail = (status: number, detail: string): MockResponse => ({ status, body: { detail } });
const now = () => new Date().toISOString();

const ACTIONS: Record<Role, MachineActions> = {
  worker: { ask: true, record_video: false, upload_document: false, record_maintenance: false, archive: false, qr: false },
  usta: { ask: true, record_video: true, upload_document: true, record_maintenance: false, archive: true, qr: true },
  technician: { ask: true, record_video: false, upload_document: false, record_maintenance: true, archive: false, qr: false },
  patron: { ask: true, record_video: true, upload_document: true, record_maintenance: true, archive: true, qr: true },
};
const PREP_LABELS = ['Çeviri', 'Altyazı', 'Ses ayrıştırma', 'Dublaj (ustanın sesiyle)', 'Zamanlama ve miksaj'];
const PROC_LABELS = ['Yüklendi', 'Sıkıştırılıyor (H.264)', 'Konuşma metne dönüştürülüyor', 'Aramaya ekleniyor'];

function field(body: unknown, name: string): string {
  if (body instanceof FormData) return String(body.get(name) ?? '');
  if (body && typeof body === 'object' && name in body) return String((body as Record<string, unknown>)[name] ?? '');
  return '';
}

function steps(labels: string[], done: number): PipelineStep[] {
  return labels.map((label, i) => ({ key: `s${i}`, label, status: i < done ? 'done' : i === done ? 'running' : 'waiting' }));
}

function alert(db: MockDb, role: Role, text: string, path: string): void {
  db.alerts[role].unshift({ id: db.nextId++, text, created_at: now(), read: false, path });
}

function video(db: MockDb, id: number, me: Me): VideoDetail | null {
  const page = Object.values(db.pages).find((p) => p.videos.some((v) => v.id === id));
  const summary = page?.videos.find((v) => v.id === id);
  if (!page || !summary) return null;
  const original = fx.videoDetail.tracks[0]!;
  const doneOf = (lang: string) => db.preparing[`${id}:${lang}`];
  const tracks = fx.videoDetail.tracks.map((t) => {
    const done = doneOf(t.language);
    if (done === undefined) return t;
    if (done < PREP_LABELS.length) return { ...t, subtitles: 'preparing' as const, audio: 'preparing' as const };
    // shortcut: a "prepared" language reuses the original media files; no real files exist in mock mode
    return { ...t, subtitles: 'ready' as const, audio: 'ready' as const, subtitle_url: t.subtitle_url ?? original.subtitle_url, stream_url: t.stream_url ?? original.stream_url };
  });
  const running = tracks.find((t) => t.subtitles === 'preparing');
  const runningDone = running ? (doneOf(running.language) ?? 0) : 0;
  if (running) {
    db.preparing[`${id}:${running.language}`] = runningDone + 1; // each poll finishes one step
    if (runningDone + 1 === PREP_LABELS.length) alert(db, me.role, `“${summary.title}” videosu artık ${running.language_name} hazır.`, `/videos/${id}`);
  }
  const mine = tracks.find((t) => t.language === me.language);
  return {
    ...fx.videoDetail, id, title: summary.title, author_name: summary.author_name, created_at: summary.created_at, duration_sec: summary.duration_sec,
    machine_id: page.machine.id, machine_name: page.machine.name, status: summary.status, tracks,
    default_audio_language: mine?.audio === 'ready' ? me.language : 'tr',
    default_subtitle_language: mine?.subtitles === 'ready' ? me.language : 'tr',
    preparation: running ? { language: running.language, language_name: running.language_name, steps: steps(PREP_LABELS, runningDone) } : null,
  };
}

function ask(page: MachinePage, question: string): unknown {
  const q = question.toLocaleLowerCase('tr');
  const saved = page.questions.find((x) => x.question.text.toLocaleLowerCase('tr') === q && x.answer);
  if (saved?.answer) {
    const src: AnswerSource = { kind: 'usta_answer', question_id: saved.id, usta_name: saved.usta.name, answered_at: saved.answered_at };
    return { status: 'answered', answer: saved.answer, sources: [src], confidence: 0.95, ask_id: Date.now() };
  }
  if (page.machine.id === 1 && /elektrot|meme|basın|bar|hava/.test(q)) return fx.askAnswered;
  return { status: 'not_found', ustas: page.ustas, ask_id: Date.now() };
}

export function handle(db: MockDb, req: MockRequest): MockResponse {
  const { method, body } = req;
  const [pathname = '', search = ''] = req.path.split('?');
  const query = new URLSearchParams(search);
  const p = pathname.split('/').filter(Boolean);
  const id = Number(p[1]);
  const route = `${method} /${p.map((s) => (/^\d+$/.test(s) ? ':id' : s)).join('/')}`;

  if (route === 'POST /auth/login') {
    const role = DEMO_LOGINS[field(body, 'login').toLocaleLowerCase('tr')];
    if (!role) return fail(401, 'Demo: kullanıcı adı isci, usta, teknisyen veya patron olmalı.');
    db.user = fx.me(role);
    return ok(db.user);
  }
  if (route === 'POST /auth/register') {
    const role: Role = field(body, 'role') === 'usta' ? 'usta' : 'worker'; // like the backend: only İşçi or Usta
    db.user = { ...fx.me(role), name: field(body, 'name') };
    return { status: 201, body: db.user };
  }
  if (route === 'GET /languages') return ok(fx.languages);
  const me = db.user;
  if (!me) return fail(401, 'Giriş gerekli.');

  switch (route) {
    case 'GET /auth/me': return ok(me);
    case 'POST /auth/logout': db.user = null; return ok(null);
    case 'PATCH /me/language': db.user = { ...me, language: field(body, 'language') }; return ok(db.user);
    case 'GET /machines/lookup': {
      const code = query.get('code')?.trim() ?? '';
      const link = /\/m\/(\d+)\/?$/.exec(code); // scanned QR URL, like the backend
      const m = db.machines.find((x) => (link ? x.id === Number(link[1]) : x.code === code));
      return m ? ok({ id: m.id }) : fail(404, 'Bu kodla makine bulunamadı.');
    }
    case 'GET /machines': {
      if (me.role !== 'usta' && me.role !== 'patron') return fail(403, 'Bu işlem için yetkiniz yok.');
      const q = (query.get('q') ?? '').trim().toLocaleLowerCase('tr');
      const hits = db.machines.filter((m) => [m.code, m.name, m.serial, m.location].some((t) => t.toLocaleLowerCase('tr').includes(q)));
      return ok(hits.map((m) => ({ id: m.id, code: m.code, name: m.name, location: m.location })));
    }
    case 'POST /machines': {
      if (me.role !== 'usta' && me.role !== 'patron') return fail(403, 'Bu işlem için yetkiniz yok.');
      const code = field(body, 'code').trim().toUpperCase();
      if (db.machines.some((m) => m.code === code)) return fail(409, 'Bu kodla bir makine zaten var.');
      const newId = db.nextId++;
      const machine = { id: newId, code, name: field(body, 'name'), type: field(body, 'type'), model: field(body, 'model'), serial: field(body, 'serial'), location: field(body, 'location'), photo_url: null };
      const ustas = me.role === 'usta' ? [{ id: me.id, name: me.name }] : [];
      db.pages[newId] = { ...fx.machinePage, machine, ustas, videos: [], external_videos: [], documents: [], maintenance: [], questions: [] };
      db.machines.push({ id: newId, code, name: machine.name, serial: machine.serial, location: machine.location, ustas, last_maintenance: null, video_count: 0, document_count: 0 });
      return { status: 201, body: { id: newId } };
    }
    case 'POST /machines/:id/archive': {
      if (!ACTIONS[me.role].archive) return fail(403, 'Bu işlem için yetkiniz yok.');
      db.machines = db.machines.filter((m) => m.id !== id); // page stays: history is kept
      return ok(null);
    }
    case 'GET /machines/:id': {
      const page = db.pages[id];
      return page ? ok({ ...page, actions: ACTIONS[me.role] }) : fail(404, 'Makine bulunamadı.');
    }
    case 'POST /ask/:id/feedback': return ok(null);
    case 'POST /machines/:id/ask': {
      const page = db.pages[id];
      return page ? ok(ask(page, field(body, 'question'))) : fail(404, 'Makine bulunamadı.');
    }
    case 'POST /machines/:id/questions': {
      const page = db.pages[id];
      if (!page) return fail(404, 'Makine bulunamadı.');
      const qid = db.nextId++;
      const text = { text: field(body, 'question'), lang: me.language, dir: me.language === 'ar' ? 'rtl' as const : 'ltr' as const };
      db.myQuestions.unshift({ id: qid, machine_id: id, machine_name: page.machine.name, question: text, status: 'open', created_at: now(), answer: null, answer_video_id: null, answer_file_url: null, usta: null });
      db.inbox.unshift({ id: qid, machine_id: id, machine_name: page.machine.name, question: { ...text, lang: 'tr', dir: 'ltr' }, original_question: null, worker_name: me.name, worker_language_name: fx.languages.find((l) => l.code === me.language)?.name ?? me.language, created_at: now() });
      alert(db, 'usta', `Yeni soru · ${page.machine.name}: “${text.text}”`, `/usta/questions/${qid}`);
      return ok({ id: qid, status: 'open', recipients: page.ustas });
    }
    case 'GET /me/questions': return ok(db.myQuestions);
    case 'GET /me/inbox': return ok(db.inbox);
    case 'GET /questions/:id': {
      const q = db.inbox.find((x) => x.id === id);
      return q ? ok(q) : fail(404, 'Soru bulunamadı veya cevaplandı.');
    }
    case 'POST /questions/:id/answer': {
      const q = db.inbox.find((x) => x.id === id);
      if (!q) return fail(404, 'Soru bulunamadı.');
      const answerText = field(body, 'text') || 'Ustanın video/dosya cevabı';
      const answer = { text: answerText, lang: 'tr', dir: 'ltr' as const };
      db.inbox = db.inbox.filter((x) => x.id !== id);
      db.myQuestions = db.myQuestions.map((x) => (x.id === id ? { ...x, status: 'answered', answer, usta: { id: me.id, name: me.name } } : x));
      const entry: QaEntry = { id, machine_id: q.machine_id, machine_name: q.machine_name, question: q.question, answer, original_question: null, original_answer: null, answer_video_id: null, answer_file_url: null, usta: { id: me.id, name: me.name }, answered_at: now() };
      db.pages[q.machine_id]?.questions.unshift(entry);
      alert(db, 'worker', `${me.name} sorunu cevapladı: “${q.question.text}”`, '/my-questions');
      return ok({ ok: true });
    }
    case 'GET /ustas/:id': {
      const answered = Object.values(db.pages).flatMap((pg) => pg.questions).filter((q) => q.usta.id === id || id === me.id);
      const machines = Object.values(db.pages).filter((pg) => pg.ustas.some((u) => u.id === id)).map((pg) => ({ id: pg.machine.id, code: pg.machine.code, name: pg.machine.name }));
      const name = id === me.id ? me.name : Object.values(db.pages).flatMap((pg) => pg.ustas).find((u) => u.id === id)?.name;
      return name ? ok({ id, name, machines, answered }) : fail(404, 'Usta bulunamadı.');
    }
    case 'GET /me/machines': return ok(db.machines.map((m) => ({ id: m.id, code: m.code, name: m.name })));
    case 'GET /videos/:id': { const v = video(db, id, me); return v ? ok(v) : fail(404, 'Video bulunamadı.'); }
    case 'GET /videos/:id/processing': {
      const up = db.uploads[id];
      if (!up) return fail(404, 'Video bulunamadı.');
      const done = up.steps.filter((s) => s.status === 'done').length + 1;
      up.steps = steps(PROC_LABELS, done);
      if (done >= PROC_LABELS.length) {
        up.status = 'ready';
        Object.values(db.pages).forEach((pg) => pg.videos.forEach((v) => { if (v.id === id) v.status = 'ready'; }));
      }
      return ok(up);
    }
    case 'POST /machines/:id/videos': {
      const page = db.pages[id];
      if (!page) return fail(404, 'Makine bulunamadı.');
      const vid = db.nextId++;
      page.videos.unshift({ id: vid, title: field(body, 'title'), author_name: me.name, created_at: now(), duration_sec: 95, thumbnail_url: null, status: 'processing', availability: 'original' });
      db.uploads[vid] = { id: vid, status: 'processing', steps: steps(PROC_LABELS, 1) };
      return ok(db.uploads[vid]);
    }
    case 'GET /documents/:id': return ok({ ...fx.documentDetail, id, summary: fx.documentDetail.summary });
    case 'GET /machines/:id/maintenance-form': {
      const page = db.pages[id];
      return page ? ok({ machine: page.machine, openers: [...page.ustas, { id: 5, name: 'Emre K.' }] }) : fail(404, 'Makine bulunamadı.');
    }
    case 'POST /machines/:id/maintenance': {
      const page = db.pages[id];
      if (!page) return fail(404, 'Makine bulunamadı.');
      const openerId = Number(field(body, 'opened_by_id'));
      const opener = [...page.ustas, { id: 5, name: 'Emre K.' }].find((u) => u.id === openerId) ?? { id: openerId, name: '?' };
      const rec: MaintenanceRecord = { id: db.nextId++, machine_id: id, machine_name: page.machine.name, description: field(body, 'description'), created_at: now(), done_by: { id: me.id, name: me.name, authorized: me.authorized, authorization_document_url: null }, opened_by: opener, attachments: [] };
      page.maintenance.unshift(rec);
      const row = db.machines.find((m) => m.id === id);
      if (row) row.last_maintenance = { date: rec.created_at, by_name: me.name };
      return ok(rec);
    }
    case 'GET /me/maintenance': return ok(Object.values(db.pages).flatMap((pg) => pg.maintenance).filter((r) => r.done_by.id === me.id));
    case 'GET /alerts': { const items = db.alerts[me.role]; return ok({ unread_count: items.filter((a) => !a.read).length, items }); }
    case 'POST /alerts/:id/read': {
      db.alerts[me.role] = db.alerts[me.role].map((a: Alert) => (a.id === id ? { ...a, read: true } : a));
      const items = db.alerts[me.role];
      return ok({ unread_count: items.filter((a) => !a.read).length, items });
    }
    case 'GET /admin/machines': {
      const q = (query.get('q') ?? '').toLocaleLowerCase('tr');
      const rows = db.machines.filter((m) => m.name.toLocaleLowerCase('tr').includes(q));
      const pages = Object.values(db.pages);
      return ok({ stats: { machines: db.machines.length, videos: pages.reduce((n, pg) => n + pg.videos.length, 0), documents: pages.reduce((n, pg) => n + pg.documents.length, 0), answered_questions: pages.reduce((n, pg) => n + pg.questions.length, 0), maintenance_records: pages.reduce((n, pg) => n + pg.maintenance.length, 0) }, machines: rows });
    }
    case 'GET /admin/users': return ok(fx.adminUsers);
    case 'POST /machines/:id/documents': {
      const page = db.pages[id];
      if (!page) return fail(404, 'Makine bulunamadı.');
      const doc = { id: db.nextId++, title: field(body, 'title'), type: field(body, 'type') as DocumentType, page_count: 1, summary_status: 'preparing' as const, summary_preview: null };
      page.documents.push(doc);
      return ok(doc);
    }
    case 'POST /machines/:id/external-videos': {
      const page = db.pages[id];
      if (!page) return fail(404, 'Makine bulunamadı.');
      const ext = { id: db.nextId++, title: field(body, 'title'), url: field(body, 'url'), embed_url: null, source: field(body, 'source') as ExternalSource };
      page.external_videos.push(ext);
      return ok(ext);
    }
  }

  // /videos/{id}/languages/{lang}[/steps/{step}/retry]: start or retry on-demand preparation (KAN-55)
  if (method === 'POST' && p[0] === 'videos' && p[2] === 'languages' && p[3]) {
    const key = `${id}:${p[3]}`;
    db.preparing[key] = db.preparing[key] ?? 0;
    return ok({ language: p[3], language_name: p[3], steps: steps(PREP_LABELS, db.preparing[key]) });
  }
  return fail(404, `Mock: ${method} ${req.path} yok.`);
}
