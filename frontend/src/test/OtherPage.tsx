import { useLocation } from 'react-router';

/** Catch-all route in tests: shows where the app navigated to. */
export function OtherPage() {
  const loc = useLocation();
  return <p>other page {loc.pathname + loc.search}</p>;
}
