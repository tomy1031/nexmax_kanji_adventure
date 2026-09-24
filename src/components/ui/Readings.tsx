import type { KanjiData } from '../../types/kanji';
import { RubyText } from './Ruby';
import { exampleWord, kanjiRuby, kunForm, kunReadings, kunWords, onReadings } from '../../lib/reading';
import { parseRuby } from '../../lib/ruby';
import { useGameStore } from '../../store/gameStore';

/**
 * Every reading of a kanji a learner meets, on two short lines (2026-09-23:
 * 「読みも 複数 あるので、それぞれ 表示は されてて ほしい」). Readings no word
 * of this level uses (社 の やしろ) are left out (2026-09-24).
 *
 *   くん  大(おお)きい
 *   おん  ダイ・タイ
 *
 * With `hideKanji` (the battle, where the learner must recall the shape) the
 * kun readings are written in kana, the okurigana in a lighter colour so it
 * is clear which part the kanji covers: おお‹きい›.
 */
export const Readings = ({ kanji, hideKanji = false, size = 'md' }: { kanji: KanjiData; hideKanji?: boolean; size?: 'sm' | 'md' }) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const text = size === 'sm' ? 'text-[12px]' : 'text-[14px]';
  const label = 'mr-1.5 inline-block w-8 shrink-0 rounded bg-[#e9dcc0] text-center text-[10px] font-black leading-5';

  const kun = kunReadings(kanji);
  const on = onReadings(kanji);

  return (
    <div className={`flex flex-col gap-0.5 ${text} leading-[1.9]`}>
      {kun.length > 0 && (
        <p className="flex items-baseline">
          <span className={label}>くん</span>
          <span className="font-black">
            {hideKanji
              ? kun.map((r, i) => {
                  const f = kunForm(r);
                  return (
                    <span key={r}>
                      {i > 0 && '・'}
                      {f.stem}
                      {f.okuri && <span style={{ color: 'var(--ink-3)' }}>{f.okuri}</span>}
                    </span>
                  );
                })
              : kunWords(kanji).map((w, i) => (
                  <span key={w}>
                    {i > 0 && '・'}
                    <RubyText showFurigana={showFurigana}>{w}</RubyText>
                  </span>
                ))}
          </span>
        </p>
      )}
      {on.length > 0 && (
        <p className="flex items-baseline">
          <span className={label}>おん</span>
          <span className="font-black">{on.join('・')}</span>
        </p>
      )}
    </div>
  );
};

export default Readings;

/**
 * A kanji shown large: the character alone, with its reading above it as
 * furigana. Okurigana is never set in the character's place (2026-09-24:
 * 「漢字は 漢字、添え物として 読みがななどが あるのが 大切」).
 */
export const KanjiWord = ({ kanji, showFurigana = true }: { kanji: KanjiData; showFurigana?: boolean }) => (
  <span className="whitespace-nowrap">
    <RubyText showFurigana={showFurigana}>{kanjiRuby(kanji)}</RubyText>
  </span>
);

/**
 * A short word with the character left blank, for the battle (2026-09-24:
 * 「短い 例文の 穴埋めの ような 表示とか、バトルの 時は 良いかも」):
 * 会□ with しゃ above the box. The learner reads the word and writes the
 * missing character; the reading above the box says which one.
 */
export const FillIn = ({ kanji, showFurigana = true }: { kanji: KanjiData; showFurigana?: boolean }) => {
  const word = exampleWord(kanji);
  if (!word) return null;
  return (
    <span className="inline-flex items-end whitespace-nowrap">
      {parseRuby(word).map((seg, i) =>
        seg.text === kanji.char ? (
          <ruby key={i}>
            <span
              className="mx-0.5 inline-block h-[1.15em] w-[1.15em] rounded-md border-2 border-dashed align-[-0.15em]"
              style={{ borderColor: 'var(--ink-2)', background: 'rgba(255,255,255,0.7)' }}
              aria-label="？"
            />
            <rt>{seg.reading}</rt>
          </ruby>
        ) : (
          <RubyText key={i} showFurigana={showFurigana}>
            {seg.reading ? `${seg.text}(${seg.reading})` : seg.text}
          </RubyText>
        ),
      )}
    </span>
  );
};
