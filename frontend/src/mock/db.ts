// In-browser fake database for `npm run dev:mock`. Starts from the shared test fixtures.
import type {
  AdminMachineRow, Alert, InboxQuestion, MachinePage, Me, MyQuestion, Role, VideoProcessing,
} from '../api/types';
import * as fx from '../test/fixtures';

/** Demo logins: type one of these names, any password. */
export const DEMO_LOGINS: Record<string, Role> = {
  isci: 'worker',
  usta: 'usta',
  teknisyen: 'technician',
  patron: 'patron',
};

export interface MockDb {
  user: Me | null;
  machines: AdminMachineRow[];
  pages: Record<number, MachinePage>;
  myQuestions: MyQuestion[];
  inbox: InboxQuestion[];
  alerts: Record<Role, Alert[]>;
  uploads: Record<number, VideoProcessing>;
  preparing: Record<string, number>; // `${videoId}:${lang}` -> finished steps
  nextId: number;
  qrTexts?: Record<string, number>; // QR text already on a machine → its id (missing in states saved before)
}

function forkliftPage(): MachinePage {
  return {
    ...fx.machinePage,
    machine: { id: 2, code: 'FL-03', name: 'Forklift 3', type: 'Akülü forklift', model: '1.8 t elektrikli', serial: 'FL18-40211', location: 'Depo · Rampa 1', photo_url: null },
    ustas: [{ id: 9, name: 'Ali Usta' }],
    videos: [],
    external_videos: [],
    documents: [],
    maintenance: [],
    questions: [],
  };
}

export function seed(): MockDb {
  return {
    user: null,
    machines: structuredClone(fx.adminMachines.machines),
    pages: { 1: structuredClone(fx.machinePage), 2: forkliftPage() },
    myQuestions: structuredClone(fx.myQuestions),
    inbox: [structuredClone(fx.inboxQuestion)],
    alerts: { worker: [], usta: structuredClone(fx.alertList.items), technician: [], patron: [] },
    uploads: {},
    preparing: {},
    nextId: 100,
  };
}

const KEY = 'usta-mock-db';

/** Kept in localStorage so a reload keeps the login and what you added. */
export function load(): MockDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* private mode or bad data: start fresh */
  }
  return seed();
}

export function save(db: MockDb): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage unavailable: state lives until reload */
  }
}

export const resetMockDb = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
