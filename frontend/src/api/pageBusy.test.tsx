import { render } from '@testing-library/react';
import { useMemo, useState } from 'react';
import { expect, it } from 'vitest';
import { mockApi } from '../test/utils';
import { PageBusyContext } from './pageBusy';
import { useApi } from './useApi';

function Data() {
  useApi('/x');
  return null;
}

it('useApi tells the page it is busy until its data has loaded', async () => {
  mockApi({ 'GET /x': { ok: true } });
  const seen: number[] = [];
  function Host() {
    const [busy, setBusy] = useState(0);
    seen.push(busy);
    const value = useMemo(() => ({ add: () => { setBusy((n) => n + 1); return () => setBusy((n) => n - 1); } }), []);
    return <PageBusyContext.Provider value={value}><Data /></PageBusyContext.Provider>;
  }
  render(<Host />);
  await expect.poll(() => seen.at(-1)).toBe(0);
  expect(seen).toContain(1); // busy while loading, then done
});
