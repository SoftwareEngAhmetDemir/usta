import { Link } from 'react-router';
import type { ExternalVideo, VideoSummary } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { SectionTitle } from '../../../../components/SectionTitle';
import { ExternalVideoItem } from '../ExternalVideoItem';
import { VideoItem } from '../VideoItem';

interface Props {
  machineId: number;
  videos: VideoSummary[];
  external: ExternalVideo[];
  languageName: string;
  canRecord: boolean;
}

export function VideoList({ machineId, videos, external, languageName, canRecord }: Props) {
  const recordLink = canRecord ? <Link className="btn" data-size="small" to={`/record?machine=${machineId}`}>Video çek</Link> : undefined;
  return (
    <section aria-labelledby="videos-title" className="stack">
      <SectionTitle id="videos-title" title="Videolar" extra={videos.length + external.length} />
      <div className="card">
        {videos.length + external.length === 0 ? (
          <EmptyState message="Henüz video yok." action={recordLink} />
        ) : (
          <>
            {videos.map((v) => <VideoItem key={v.id} video={v} languageName={languageName} />)}
            {external.map((v) => <ExternalVideoItem key={`ext-${v.id}`} video={v} />)}
            {recordLink && <div style={{ marginTop: 8 }}>{recordLink}</div>}
          </>
        )}
      </div>
    </section>
  );
}
