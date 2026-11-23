import { Video } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/ui/card';
import type { ExternalVideo, VideoSummary } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { SectionTitle } from '../../../../components/SectionTitle';
import { ExternalVideoItem } from '../ExternalVideoItem';
import { VideoItem } from '../VideoItem';
import { useT } from '../../../../i18n';

interface Props {
  machineId: number;
  videos: VideoSummary[];
  external: ExternalVideo[];
  languageName: string;
  canRecord: boolean;
}

export function VideoList({ machineId, videos, external, languageName, canRecord }: Props) {
  const t = useT();
  const recordLink = canRecord ? (
    <Button asChild size="small"><Link to={`/record?machine=${machineId}`}><Video aria-hidden="true" />{t('Video çek')}</Link></Button>
  ) : undefined;
  return (
    <section aria-labelledby="videos-title" className="flex flex-col gap-2">
      <SectionTitle id="videos-title" title={t('Videolar')} extra={videos.length + external.length} />
      {videos.length + external.length === 0 ? (
        <EmptyState message={t('Henüz video yok.')} action={recordLink} />
      ) : (
        <>
          <Card className="gap-0">
            {videos.map((v) => <VideoItem key={v.id} video={v} languageName={languageName} />)}
            {external.map((v) => <ExternalVideoItem key={`ext-${v.id}`} video={v} />)}
          </Card>
          {recordLink && <div>{recordLink}</div>}
        </>
      )}
    </section>
  );
}
