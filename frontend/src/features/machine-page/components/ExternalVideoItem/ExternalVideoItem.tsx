import { useState } from 'react';
import type { ExternalVideo } from '../../../../api';
import { EXTERNAL_SOURCE_LABEL } from '../../../../lib/labels';
import { useT } from '../../../../i18n';

/** Outside video (KAN-34): plays embedded when the source allows it, otherwise opens the link. */
export function ExternalVideoItem({ video }: { video: ExternalVideo }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const meta = (
    <span className="grow">
      <span className="strong">{video.title}</span>
      <br />
      <span className="muted">{t('Dış kaynak ·')}{' '}{t(EXTERNAL_SOURCE_LABEL[video.source])}</span>
    </span>
  );
  const thumb = <span className="thumb ext" aria-hidden="true">▶</span>;

  if (!video.embed_url) {
    return <a className="list-item" href={video.url} target="_blank" rel="noreferrer">{thumb}{meta}</a>;
  }
  return (
    <div>
      <button type="button" className="list-item" aria-expanded={playing} onClick={() => setPlaying((p) => !p)}>
        {thumb}{meta}
      </button>
      {playing && (
        <div className="player">
          <iframe src={video.embed_url} title={video.title} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div>
      )}
    </div>
  );
}
