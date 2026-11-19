// Loaded only by `npm run dev:mock` (VITE_MOCK=1); never part of a normal build.
export { installTransport as installMockBackend } from './transport';
export { DEMO_LOGINS, resetMockDb } from './db';
