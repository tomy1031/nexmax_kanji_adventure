import { RubyText } from '../../components/ui/Ruby';
import { useNexmaxLevel } from './useNexmaxLevel';
import { ClassBadge } from './NexmaxClass';

/**
 * A slim plate: the クラス (★3, ★4 after 5章's まとめの ボス — a tap tells
 * what each brings), Lv, the bar to the next one, and — at the ceiling —
 * that new kanji are what lift it (the level is capped by the kanji owned).
 */
export const NexmaxLevelPlate = ({ showFurigana }: { showFurigana: boolean }) => {
  const { level, into, need, atCap, kanjiToRaiseCap } = useNexmaxLevel();
  return (
    <div className="g-parchment flex items-center gap-2 px-3 py-1.5" aria-label={`ネクマックス Lv ${level}`}>
      <ClassBadge showFurigana={showFurigana} />
      <span className="shrink-0 rounded-md bg-[#2f8fe0] px-1.5 text-xs leading-[1.8] font-black text-white">Lv {level}</span>
      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-black/10">
        <span className="block h-full rounded-full bg-[#2f8fe0]" style={{ width: `${Math.min(100, (into / need) * 100)}%` }} />
      </span>
      {atCap ? (
        <span className="shrink-0 text-[11px] font-black" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>{`上限(じょうげん)・新(あたら)しい 字(じ) あと ${kanjiToRaiseCap}`}</RubyText>
        </span>
      ) : (
        <span className="shrink-0 text-[11px] font-black tabular-nums" style={{ color: 'var(--ink-2)' }}>
          EXP {into}/{need}
        </span>
      )}
    </div>
  );
};

export default NexmaxLevelPlate;
