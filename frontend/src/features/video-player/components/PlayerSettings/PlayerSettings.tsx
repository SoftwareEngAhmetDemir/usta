import { AudioLines, ChevronRight, Settings, Subtitles } from 'lucide-react';
import { useEffect, useState, type FocusEvent, type ReactNode } from 'react';
import type { LanguageCode, VideoLanguageTrack } from '../../../../api';
import { useT } from '../../../../i18n';
import type { TrackKind } from '../../hooks/useVideoPlayer';
import { LanguageList } from '../LanguageList';
import { OFF, menuOptions } from './trackOptions';
import { overlayButton } from './overlay';

interface Props {
  tracks: VideoLanguageTrack[];
  audio: LanguageCode | null;
  subtitle: LanguageCode | null; // null = off
  onAudio: (lang: LanguageCode) => void;
  onSubtitle: (lang: LanguageCode | 'off') => void;
  onRequest: (lang: LanguageCode, kind: TrackKind) => void;
}

type View = 'closed' | 'main' | TrackKind;

/** YouTube-style gear on the player: "Altyazılar" and "Ses dili", each a searchable language list. Picking a language
 * that isn't ready yet asks for it (KAN-50, KAN-55, KAN-56). */
export function PlayerSettings({ tracks, audio, subtitle, onAudio, onSubtitle, onRequest }: Props) {
  const t = useT();
  const [view, setView] = useState<View>('closed');
  useEffect(() => {
    if (view === 'closed') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setView('closed'); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view]);
  const options = { subtitles: menuOptions(tracks, 'subtitles', t), audio: menuOptions(tracks, 'audio', t) };
  const current = { subtitles: subtitle ?? OFF, audio: audio ?? '' };
  const title = { subtitles: t('Altyazılar'), audio: t('Ses dili') };
  const labelOf = (kind: TrackKind) => options[kind].find((o) => o.value === current[kind])?.label ?? '—';

  function pick(kind: TrackKind, value: string) {
    setView('closed');
    if (kind === 'subtitles' && value === OFF) return onSubtitle(OFF);
    const track = tracks.find((x) => x.language === value);
    if (track && track[kind] !== 'ready') return onRequest(value, kind);
    return kind === 'audio' ? onAudio(value) : onSubtitle(value);
  }
  const onBlur = (e: FocusEvent<HTMLDivElement>) => { if (!e.currentTarget.contains(e.relatedTarget)) setView('closed'); };
  const row = (kind: TrackKind, icon: ReactNode) => (
    <button type="button" onClick={() => setView(kind)} className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-start hover:bg-white/10">
      {icon}
      <span className="flex-1 font-medium">{title[kind]}</span>
      <span className="max-w-[45%] truncate text-sm text-white/65">{labelOf(kind)}</span>
      <ChevronRight className="size-4 shrink-0 text-white/50 rtl:rotate-180" aria-hidden="true" />
    </button>
  );

  return (
    <div className="relative" onBlur={onBlur}>
      <button type="button" aria-expanded={view !== 'closed'} title={t('Video ayarları')} onClick={() => setView(view === 'closed' ? 'main' : 'closed')} className={overlayButton}>
        <Settings className="size-5 transition-transform group-aria-expanded:rotate-45" aria-hidden="true" />
        <span className="sr-only">{t('Video ayarları')}</span>
      </button>
      {view !== 'closed' && (
        <dialog open aria-label={t('Video ayarları')} className="absolute start-auto end-0 top-12 z-30 m-0 border-0 w-72 max-w-[85vw] rounded-xl bg-black/85 p-2 text-white shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95">
          {view === 'main' && (
            <>
              {row('subtitles', <Subtitles className="size-5 shrink-0" aria-hidden="true" />)}
              {row('audio', <AudioLines className="size-5 shrink-0" aria-hidden="true" />)}
            </>
          )}
          {view !== 'main' && (
            <LanguageList title={title[view]} options={options[view]} value={current[view]} onPick={(v) => pick(view, v)} onBack={() => setView('main')} />
          )}
        </dialog>
      )}
    </div>
  );
}
