import { Play } from 'lucide-react';
import { Link } from 'react-router';
import type { VideoAvailability, VideoSummary } from '../../../../api';
import type { PillTone } from '../../../../components/Pill';
import { ListItem } from '../../../../components/ListItem';
import { Pill } from '../../../../components/Pill';
import { Thumb } from '../../../../components/Thumb';
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
      <Thumb kind="video" wide>
        {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" /> : <Play />}
        <small className="absolute end-1 bottom-1 rounded bg-black/60 px-1 font-mono text-[10px] text-white">{formatDuration(video.duration_sec)}</small>
      </Thumb>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="font-semibold">{video.title}</span>
        <span className="text-sm text-muted-foreground">{video.author_name} · {formatDate(video.created_at)}</span>
        <StatusPill video={video} languageName={languageName} />
      </span>
    </>
  );
  if (video.status !== 'ready') return <ListItem>{body}</ListItem>;
  return <ListItem asChild><Link to={`/videos/${video.id}`}>{body}</Link></ListItem>;
}
