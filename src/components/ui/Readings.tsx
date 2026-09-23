import type { KanjiData } from '../../types/kanji';
import { RubyText } from './Ruby';
import { kunForm, kunWords, primaryForm } from '../../lib/reading';
import { useGameStore } from '../../store/gameStore';

/**
 * Every reading of a kanji, on two short lines (2026-09-23: 「読みも 複数
 * あるので、それぞれ 表示は されてて ほしい」).
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

  return (
    <div className={`flex flex-col gap-0.5 ${text} leading-[1.9]`}>
      {kanji.kun.length > 0 && (
        <p className="flex items-baseline">
          <span className={label}>くん</span>
          <span className="font-black">
            {hideKanji
              ? kanji.kun.map((r, i) => {
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
      {kanji.on.length > 0 && (
        <p className="flex items-baseline">
          <span className={label}>おん</span>
          <span className="font-black">{kanji.on.join('・')}</span>
        </p>
      )}
    </div>
  );
};

export default Readings;

/**
 * A kanji shown large, as a word: the character with its reading above, and
 * the okurigana after it at a smaller size — 大(おお)きい, where きい is plain
 * kana and should not compete with the character being learned.
 */
export const KanjiWord = ({ kanji, showFurigana = true }: { kanji: KanjiData; showFurigana?: boolean }) => {
  const f = primaryForm(kanji);
  return (
    <span className="whitespace-nowrap">
      <RubyText showFurigana={showFurigana}>{`${kanji.char}(${f.stem})`}</RubyText>
      {f.okuri && <span style={{ fontSize: '0.5em' }}>{f.okuri}</span>}
    </span>
  );
};
