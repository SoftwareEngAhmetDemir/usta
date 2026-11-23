import { Captions, CaptionsOff } from 'lucide-react';
import { useT } from '../../../../i18n';
import { overlayButton } from '../PlayerSettings/overlay';

/** YouTube-style CC button on the player: subtitles on (in the chosen language) or off. */
export function CaptionsButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <button type="button" aria-pressed={on} title={t('Altyazı (CC)')} onClick={onToggle} className={overlayButton}>
      {on ? <Captions className="size-5" aria-hidden="true" /> : <CaptionsOff className="size-5" aria-hidden="true" />}
      <span className="sr-only">{t('Altyazı (CC)')}</span>
    </button>
  );
}
