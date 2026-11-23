import { seed, type MockDb } from './db';
import { handle } from './handlers';

const call = (db: MockDb, method: string, path: string, body: unknown = null) => handle(db, { method, path, body });

function loggedIn(login: string): MockDb {
  const db = seed();
  expect(call(db, 'POST', '/auth/login', { login, password: 'x' }).status).toBe(200);
  return db;
}

describe('mock backend', () => {
  it('lets an usta add a machine and remove it from the lists (KAN-27)', () => {
    const db = loggedIn('usta');
    const res = call(db, 'POST', '/machines', { code: 'cnc-7', name: 'CNC Torna', type: '', model: '', serial: '', location: '' });
    expect(res.status).toBe(201);
    const { id } = res.body as { id: number };
    expect(call(db, 'GET', '/me/machines').body).toContainEqual({ id, code: 'CNC-7', name: 'CNC Torna' });
    expect(call(db, 'POST', '/machines', { code: 'CNC-7', name: 'x' }).status).toBe(409);
    expect(call(db, 'POST', `/machines/${id}/archive`).status).toBe(204);
    expect(call(db, 'GET', '/me/machines').body).not.toContainEqual({ id, code: 'CNC-7', name: 'CNC Torna' });
    expect(call(loggedIn('isci'), 'POST', '/machines', { code: 'Z', name: 'Z' }).status).toBe(403);
  });

  it('logs in demo users by name and rejects others', () => {
    const db = seed();
    expect(call(db, 'GET', '/auth/me').status).toBe(401);
    expect(call(db, 'POST', '/auth/login', { login: 'kimse' }).status).toBe(401);
    expect(call(db, 'POST', '/auth/login', { login: 'Teknisyen' }).body).toMatchObject({ role: 'technician' });
    expect(call(db, 'POST', '/auth/logout').status).toBe(204);
    expect(db.user).toBeNull();
  });

  it('gives each role its machine page actions', () => {
    expect(call(loggedIn('isci'), 'GET', '/machines/1').body).toMatchObject({ actions: { record_video: false, record_maintenance: false } });
    expect(call(loggedIn('patron'), 'GET', '/machines/2').body).toMatchObject({ actions: { upload_document: true } });
    expect(call(loggedIn('isci'), 'GET', '/machines/99').status).toBe(404);
  });

  it('answers known questions and sends unknown ones to the ustas, who can answer', () => {
    const db = loggedIn('isci');
    expect(call(db, 'POST', '/machines/1/ask', { question: 'Elektrot ne zaman?' }).body).toMatchObject({ status: 'answered' });
    expect(call(db, 'POST', '/machines/1/ask', { question: 'Çapak var' }).body).toMatchObject({ status: 'not_found' });
    const sent = call(db, 'POST', '/machines/1/questions', { question: 'Çapak var' }).body as { id: number };
    expect(db.alerts.usta[0]?.path).toBe(`/usta/questions/${sent.id}`);

    call(db, 'POST', '/auth/login', { login: 'usta' });
    const form = new FormData();
    form.append('text', 'Hızı düşür');
    expect(call(db, 'POST', `/questions/${sent.id}/answer`, form).status).toBe(200);
    expect(db.inbox.some((q) => q.id === sent.id)).toBe(false);
    expect(db.myQuestions.find((q) => q.id === sent.id)).toMatchObject({ status: 'answered', answer: { text: 'Hızı düşür' } });
    expect(db.alerts.worker[0]?.path).toBe('/my-questions');
  });

  it('records maintenance on top of the history with the logged-in technician', () => {
    const db = loggedIn('teknisyen');
    const form = new FormData();
    form.append('description', 'Fren testi');
    form.append('opened_by_id', '9');
    call(db, 'POST', '/machines/2/maintenance', form);
    expect(db.pages[2]?.maintenance[0]).toMatchObject({ description: 'Fren testi', done_by: { name: 'Emre K.', authorized: true }, opened_by: { name: 'Ali Usta' } });
  });

  it('advances video processing and language preparation on each poll', () => {
    const db = loggedIn('usta');
    const form = new FormData();
    form.append('title', 'Yeni video');
    const up = call(db, 'POST', '/machines/1/videos', form).body as { id: number };
    for (let i = 0; i < 3; i++) call(db, 'GET', `/videos/${up.id}/processing`);
    expect(call(db, 'GET', `/videos/${up.id}/processing`).body).toMatchObject({ status: 'ready' });

    call(db, 'PATCH', '/me/language', { language: 'ar' });
    call(db, 'POST', '/videos/1/languages/ar');
    expect((call(db, 'GET', '/videos/1').body as { preparation: unknown }).preparation).not.toBeNull();
    for (let i = 0; i < 5; i++) call(db, 'GET', '/videos/1');
    const alertsBefore = db.alerts.usta.length;
    expect(call(db, 'GET', '/videos/1').body).toMatchObject({ preparation: null, default_audio_language: 'ar' });
    expect(db.alerts.usta).toHaveLength(alertsBefore); // a prepared language sends no notification
  });

  it('searches admin machines by name', () => {
    const body = call(loggedIn('patron'), 'GET', '/admin/machines?q=fork').body as { machines: { name: string }[] };
    expect(body.machines.map((m) => m.name)).toEqual(['Forklift 3']);
  });
});
