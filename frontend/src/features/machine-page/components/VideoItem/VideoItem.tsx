import { Link } from 'react-router';
import type { VideoAvailability, VideoSummary } from '../../../../api';
import type { PillTone } from '../../../../components/Pill';
import { Pill } from '../../../../components/Pill';
import { formatDate, formatDuration } from '../../../../lib/format';
import { useT } from '../../../../i18n';
import type { Translate } from '../../../../i18n';

const AVAILABILITY: Record<VideoAvailability, [PillTone, (lang: string, t: Translate) => string]> = {
  original: ['info', (_, t) => t('Orijinal')],
  dubbed: ['ok', (l, t) => `${l} ${t('dublaj')}`],
  subtitles: ['ok', (l, t) => `${l} ${t('altyazı')}`],
  preparing: ['warn', (_, t) => t('Hazırlanıyor')],
  on_demand: ['warn', (l, t) => `${l}: ${t('istenince hazırlanır')}`],
};

function StatusPill({ video, languageName }: { video: VideoSummary; languageName: string }) {
  const t = useT();
  if (video.status === 'processing') return <Pill tone="warn">{t('İşleniyor')}</Pill>;
  if (video.status === 'failed') return <Pill tone="bad">{t('İşlenemedi')}</Pill>;
  const [tone, label] = AVAILABILITY[video.availability];
  return <Pill tone={tone}>{label(languageName, t)}</Pill>;
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
