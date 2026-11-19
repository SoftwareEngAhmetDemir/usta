import type { AnswerSource, LocalizedText } from '../../../../api';
import { Localized } from '../../../../components/Localized';
import { SourceCard } from '../SourceCard';

export function AnswerCard({ answer, sources }: { answer: LocalizedText; sources: AnswerSource[] }) {
  return (
    <section className="card info" aria-label="Cevap">
      <div className="label">Cevap</div>
      <Localized as="p" value={answer} />
      <div className="label">Kaynaklar</div>
      <div className="stack" style={{ marginTop: 6 }}>
        {sources.map((s, i) => <SourceCard key={i} source={s} />)}
      </div>
      <div className="safety-note">Cevap yalnızca bu makinenin kaynaklarından üretildi.</div>
    </section>
  );
}
