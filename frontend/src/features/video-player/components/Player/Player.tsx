import { useEffect, useRef, type ReactNode } from 'react';
import type { VideoLanguageTrack } from '../../../../api';

interface Props {
  title: string;
  audio: VideoLanguageTrack; // its stream_url carries the picture + that language's audio
  subtitle: VideoLanguageTrack | null;
  seek: { sec: number; nonce: number }; // a new nonce jumps even to the same second
  onTime: (sec: number) => void;
  /** Buttons laid over the top corner of the picture (CC, settings). */
  overlay?: ReactNode;
}

/** Native player: play/pause, progress, time, full screen; language buttons on top. Switching audio keeps the
 * position (KAN-56). */
export function Player({ title, audio, subtitle, seek, onTime, overlay }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const resumeAt = useRef(seek.sec);

  useEffect(() => {
    const el = ref.current;
    if (el) el.currentTime = seek.sec;
  }, [seek]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const track of Array.from(el.textTracks)) {
      track.mode = subtitle && track.language === subtitle.language ? 'showing' : 'disabled';
    }
  }, [subtitle]);

  return (
    <div className="relative rounded-xl bg-[#0b1014] shadow-md">
      <video
        ref={ref}
        key={audio.stream_url}
        src={audio.stream_url ?? undefined}
        controls
        playsInline
        preload="metadata"
        aria-label={title}
        className="block aspect-video w-full rounded-xl bg-black"
        onLoadedMetadata={(e) => {
          e.currentTarget.currentTime = resumeAt.current;
        }}
        onTimeUpdate={(e) => {
          resumeAt.current = e.currentTarget.currentTime;
          onTime(e.currentTarget.currentTime);
        }}
      >
        {subtitle?.subtitle_url && (
          <track key={subtitle.language} kind="subtitles" src={subtitle.subtitle_url} srcLang={subtitle.language} label={subtitle.language_name} default />
        )}
      </video>
      {overlay && <div className="absolute end-2.5 top-2.5 z-10 flex gap-2">{overlay}</div>}
    </div>
  );
}
