import { Link } from 'react-router';
import type { VideoAvailability, VideoSummary } from '../../../../api';
import type { PillTone } from '../../../../components/Pill';
import { Pill } from '../../../../components/Pill';
import { formatDate, formatDuration } from '../../../../lib/format';

const AVAILABILITY: Record<VideoAvailability, [PillTone, (lang: string) => string]> = {
  original: ['info', () => 'Orijinal'],
  dubbed: ['ok', (l) => `${l} dublaj`],
  subtitles: ['ok', (l) => `${l} altyazı`],
  preparing: ['warn', () => 'Hazırlanıyor'],
  on_demand: ['warn', (l) => `${l}: istenince hazırlanır`],
};

function StatusPill({ video, languageName }: { video: VideoSummary; languageName: string }) {
  if (video.status === 'processing') return <Pill tone="warn">İşleniyor</Pill>;
  if (video.status === 'failed') return <Pill tone="bad">İşlenemedi</Pill>;
  const [tone, label] = AVAILABILITY[video.availability];
  return <Pill tone={tone}>{label(languageName)}</Pill>;
}

export function VideoItem({ video, languageName }: { video: VideoSummary; languageName: string }) {
  const body = (
    <>
      <span className="thumb" aria-hidden="true">
        {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" /> : '▶'}
        <small>{formatDuration(video.duration_sec)}</small>
      </span>
      <span className="grow">
        <span className="strong">{video.title}</span>
        <br />
        <span className="muted">{video.author_name} · {formatDate(video.created_at)}</span>
        <br />
        <StatusPill video={video} languageName={languageName} />
      </span>
    </>
  );
  if (video.status !== 'ready') return <div className="list-item">{body}</div>;
  return <Link className="list-item" to={`/videos/${video.id}`}>{body}</Link>;
}
