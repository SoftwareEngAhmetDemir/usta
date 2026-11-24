import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { fakeQr } from './fakeQrScanner';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fakeQr.live = null;
  fakeQr.photo = null;
  fakeQr.torch = false;
  fakeQr.cameras = [];
  fakeQr.switchedTo = [];
  fakeQr.releasedNow = 0;
});
