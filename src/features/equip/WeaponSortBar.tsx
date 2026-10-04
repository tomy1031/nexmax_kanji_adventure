import { RubyText } from '../../components/ui/Ruby';
import { WEAPON_SORTS, type WeaponSort } from '../../lib/forge/weaponSort';
import { episodeOfStep } from '../../lib/forge/stage';

/** The row of ならべかた chips above a weapon list. */
export const WeaponSortBar = ({ sort, onSort, showFurigana }: { sort: WeaponSort; onSort: (s: WeaponSort) => void; showFurigana: boolean }) => (
  <div role="radiogroup" aria-label="ならべかた" className="flex flex-wrap gap-1.5">
    {WEAPON_SORTS.map((s) => (
      <button
        key={s.id}
        type="button"
        role="radio"
        aria-checked={sort === s.id}
        className="rounded-full border-2 px-2.5 py-0.5 text-[12px] font-black whitespace-nowrap"
        style={sort === s.id ? { background: '#2f6fb8', borderColor: '#2f6fb8', color: '#fff' } : { background: 'rgba(255,255,255,0.85)', borderColor: '#caa468', color: '#4a3220' }}
        onClick={() => onSort(s.id)}
      >
        <RubyText showFurigana={showFurigana}>{s.label}</RubyText>
      </button>
    ))}
  </div>
);

/** Where a weapon's kanji come from (📍1章3話), and whether it is a かくし武器 — beside its ★. */
export const WeaponTags = ({ w, showFurigana }: { w: { stage?: number; hidden?: boolean }; showFurigana: boolean }) => {
  const ep = episodeOfStep(w.stage ?? 0);
  return (
    <>
      {w.hidden && (
        <span className="ml-1 inline-block rounded-full px-1.5 py-px text-[10px] leading-tight font-black whitespace-nowrap text-white" style={{ background: 'linear-gradient(90deg,#7a3cc4,#c43c8a)' }}>
          🔑かくし
        </span>
      )}
      {ep != null && (
        <span className="ml-1 text-[11px] font-bold" style={{ color: '#4f6478' }}>
          📍<RubyText showFurigana={showFurigana}>{`${ep.chapter}章(しょう)${ep.episode}話(わ)`}</RubyText>
        </span>
      )}
    </>
  );
};
