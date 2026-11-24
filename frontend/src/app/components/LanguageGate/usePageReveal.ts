import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { useUiBusyNow, useUiLoading } from '../../../i18n';

// Texts are sent ~30 ms after a render and data texts follow the data: a page counts as ready only after it has
// been quiet (no texts on the way, no data loading) this long.
const SETTLE_MS = 150;

/** Whether the current page is still waiting to be shown for the first time. Once shown, later texts (a dropdown
 * opened, an answer card) never hide it again; another page (pathname) waits afresh. */
export function usePageReveal() {
  const loading = useUiLoading();
  const busyNow = useUiBusyNow();
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(0);
  const [shownPath, setShownPath] = useState<string | null>(null);
  const waiting = loading || busy > 0;

  useEffect(() => {
    if (waiting || shownPath === pathname) return;
    // Re-check at fire time: texts queued by this render only reach `loading` after their batch is sent, and a
    // slow phone can run both timers in one tick. If busy now, `loading` flips soon and this effect starts again.
    const id = setTimeout(() => { if (!busyNow()) setShownPath(pathname); }, SETTLE_MS);
    return () => clearTimeout(id);
  }, [waiting, pathname, shownPath, busyNow]);

  const add = useCallback(() => {
    setBusy((n) => n + 1);
    return () => setBusy((n) => n - 1);
  }, []);
  const pageBusy = useMemo(() => ({ add }), [add]);
  return { hidden: shownPath !== pathname, pageBusy };
}
