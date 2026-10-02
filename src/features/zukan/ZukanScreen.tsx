import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RubyText } from '../../components/ui/Ruby';
import { KanjiWord } from '../../components/ui/Readings';
import { TopBar } from '../../components/ui/Chrome';
import { NightStreetBackdrop } from '../write/NightStreet';
import { useGameStore } from '../../store/gameStore';
import { HIRAGANA, KATAKANA, ROMAJI } from '../../data/kana';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { isForgeOpen } from '../../data/mojiFlow';
import { useKnownKana } from '../kana/useKnownKana';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { kanjiRuby } from '../../lib/reading';
import { starsOf } from '../../lib/mastery';

/**
 * ずかん — what the player has written back into the town (08 §3.8).
 *
 * Open from the start, so the menu never shows a lock that the new route
 * cannot open. かな: the 92 kana, bright once written three times. 漢字: each
 * chapter's kanji in the book's order — a kanji not written yet shows only
 * its sound, as it does in the story (KanjiBackText); a written one shows
 * itself and its ★. Once 漢字やさん is open, ことば図鑑 (the words found by
 * forging) is one tap away.
 */

type Tab = 'kana' | 'kanji';

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`★${n}`} className="text-[10px] leading-none tracking-tight" style={{ color: '#e8a317' }}>
    {'★'.repeat(n)}
    <span style={{ color: 'rgba(122,82,38,0.3)' }}>{'★'.repeat(3 - n)}</span>
  </span>
);

export const ZukanScreen = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const cleared = useGameStore((s) => s.clearedStages);
  const known = useKnownKana();
  const [tab, setTab] = useState<Tab>('kana');
  const kanaDone = [...HIRAGANA, ...KATAKANA].filter((k) => known.has(k)).length;

  return (
    <div className="isolate relative min-h-dvh pb-8">
      <NightStreetBackdrop />
      <TopBar title="ずかん" />
      <div className="mx-auto flex max-w-md flex-col gap-3 px-3 pt-3">
        <div role="tablist" className="flex gap-2">
          {(
            [
              ['kana', 'かな'],
              ['kanji', '漢字(かんじ)'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`g-btn flex-1 !min-h-[42px] ${tab === id ? 'g-btn-primary' : 'g-btn-ghost'}`}
            >
              <RubyText showFurigana={showFurigana}>{label}</RubyText>
            </button>
          ))}
          {isForgeOpen(cleared) && (
            <button type="button" className="g-btn g-btn-accent flex-1 !min-h-[42px] !px-2 text-sm" onClick={() => navigate('/words')}>
              <RubyText showFurigana={showFurigana}>ことば図鑑(ずかん)</RubyText>
            </button>
          )}
        </div>

        {tab === 'kana' ? (
          <section className="g-parchment p-3">
            <p className="mb-2 text-sm font-black">
              <RubyText showFurigana={showFurigana}>{`書(か)ける かな ${kanaDone} / ${HIRAGANA.length + KATAKANA.length}`}</RubyText>
            </p>
            {[HIRAGANA, KATAKANA].map((set, i) => (
              <div key={i} className="mb-2 grid grid-cols-10 gap-1">
                {set.map((k) => {
                  const on = known.has(k);
                  return (
                    <span
                      key={k}
                      className="flex aspect-square flex-col items-center justify-center rounded-md border text-[17px] leading-none font-black"
                      style={{
                        background: on ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : 'rgba(255,255,255,0.45)',
                        borderColor: on ? '#f2b53a' : 'rgba(122,82,38,0.25)',
                        color: on ? '#3b2208' : 'rgba(59,34,8,0.35)',
                      }}
                    >
                      {k}
                      {!on && <span className="text-[8px] font-bold">{ROMAJI[k]}</span>}
                    </span>
                  );
                })}
              </div>
            ))}
          </section>
        ) : (
          MOJI_CHAPTERS.filter((c) => c.level === 'N5').map((c) => {
            const chars = c.kanji.map((ch) => getKanjiByChar(ch)).filter((k) => k != null);
            const have = chars.filter((k) => (progress[k.id]?.reps ?? 0) >= 3).length;
            return (
              <section key={c.id} className="g-parchment p-3">
                <p className="mb-2 flex items-baseline justify-between gap-2 text-sm font-black">
                  <RubyText showFurigana={showFurigana}>{`${c.order}章(しょう) ${c.title}`}</RubyText>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--ink-2)' }}>
                    {have} / {chars.length}
                  </span>
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {chars.map((k) => {
                    const reps = progress[k.id]?.reps ?? 0;
                    const stars = starsOf(reps);
                    const on = stars > 0;
                    return (
                      <span
                        key={k.id}
                        className="flex aspect-[4/5] flex-col items-center justify-center gap-0.5 rounded-md border text-[19px] leading-[1.5] font-black"
                        style={{
                          background: on ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : 'rgba(255,255,255,0.4)',
                          borderColor: on ? '#f2b53a' : 'rgba(122,82,38,0.25)',
                          borderStyle: on ? 'solid' : 'dashed',
                        }}
                      >
                        {on ? (
                          <KanjiWord kanji={k} showFurigana={showFurigana} />
                        ) : (
                          // Not written yet: only its sound, as in the story.
                          <span className="text-[11px] font-bold" style={{ color: 'rgba(59,34,8,0.5)' }}>
                            {/\(([^)]*)\)/.exec(kanjiRuby(k))?.[1] ?? '？'}
                          </span>
                        )}
                        <Stars n={stars} />
                      </span>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ZukanScreen;
