import { useLocation } from 'react-router';

/** Catch-all route in tests: shows where the app navigated to, and the router state it passed along (if any). */
export function OtherPage() {
  const loc = useLocation();
  return (
    <>
      <p>other page {loc.pathname + loc.search}</p>
      {loc.state != null && <output aria-label="route state">{JSON.stringify(loc.state)}</output>}
    </>
  );
}
