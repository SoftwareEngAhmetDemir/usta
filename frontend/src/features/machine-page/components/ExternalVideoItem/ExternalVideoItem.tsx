import { ExternalLink, Play } from 'lucide-react';
import { useState } from 'react';
import type { ExternalVideo } from '../../../../api';
import { ListItem } from '../../../../components/ListItem';
import { Thumb } from '../../../../components/Thumb';
import { EXTERNAL_SOURCE_LABEL } from '../../../../lib/labels';
import { useT } from '../../../../i18n';

/** Outside video (KAN-34): plays embedded when the source allows it, otherwise opens the link. */
export function ExternalVideoItem({ video }: { video: ExternalVideo }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const meta = (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="font-semibold">{video.title}</span>
      <span className="text-sm text-muted-foreground">{t('Dış kaynak ·')} {t(EXTERNAL_SOURCE_LABEL[video.source])}</span>
    </span>
  );
  const thumb = <Thumb kind="external" wide><Play /></Thumb>;

  if (!video.embed_url) {
    return (
      <ListItem asChild>
        <a href={video.url} target="_blank" rel="noreferrer">{thumb}{meta}<ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></a>
      </ListItem>
    );
  }
  return (
    <div className="border-t first:border-t-0">
      <ListItem asChild className="border-t-0">
        <button type="button" aria-expanded={playing} onClick={() => setPlaying((p) => !p)}>{thumb}{meta}</button>
      </ListItem>
      {playing && (
        <div className="mb-3 overflow-hidden rounded-xl bg-black">
          <iframe className="block aspect-video w-full border-0" src={video.embed_url} title={video.title} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div>
      )}
    </div>
  );
}
