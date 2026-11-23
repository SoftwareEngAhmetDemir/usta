import { useEffect, useRef } from 'react';
import type { VideoLanguageTrack } from '../../../../api';

interface Props {
  title: string;
  audio: VideoLanguageTrack; // its stream_url carries the picture + that language's audio
  subtitle: VideoLanguageTrack | null;
  seek: { sec: number; nonce: number }; // a new nonce jumps even to the same second
  onTime: (sec: number) => void;
}

/** Native player: play/pause, progress, time, full screen. Switching audio keeps the position (KAN-56). */
export function Player({ title, audio, subtitle, seek, onTime }: Props) {
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
    <div className="overflow-hidden rounded-xl bg-[#0b1014] shadow-md">
      <video
        ref={ref}
        key={audio.stream_url}
        src={audio.stream_url ?? undefined}
        controls
        playsInline
        preload="metadata"
        aria-label={title}
        className="block aspect-video w-full bg-black"
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
    </div>
  );
}
