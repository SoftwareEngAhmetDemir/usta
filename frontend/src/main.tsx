import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './index.css';

async function start() {
  // `npm run dev:mock`: fake backend + demo users in the browser, so every screen works without FastAPI.
  if (import.meta.env.VITE_MOCK === '1') (await import('./mock')).installMockBackend();
  const root = document.getElementById('root');
  if (!root) throw new Error('#root missing in index.html');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
