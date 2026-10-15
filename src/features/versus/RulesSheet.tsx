import { useMemo, useState } from 'react';
import { RubyText } from '../../components/ui/Ruby';
import * as sfx from '../../lib/sfx';
import { charRuby } from '../../lib/reading';
import type { JlptLevel } from '../../types/kanji';
import { LEVELS, STAGE_CHAPTERS, rangeLabel, rulesPool, type RoomRules } from './roomRules';

/**
 * へやの ルール: what the room's maker chooses before the room opens
 * (RoomRulesEditor), and the card both sides see in the room and on the VS
 * screen (RulesCard). roomRules.ts holds the numbers.
 */

const SWITCHES = [
  { key: 'gear', icon: '🗡️', label: '武器(ぶき)・防具(ぼうぐ)', says: 'ぶきの こうげき・たての まもり・よろいの HP' },
  { key: 'level', icon: '⭐', label: 'レベル', says: 'ネクマックスの レベルで HP が ふえます' },
  { key: 'companion', icon: '🤝', label: 'なかま（ガチャの キャラ）', says: 'なかまの わざ。なしなら ネクマックスどうし' },
] as const;

/** A checkbox the size of a finger, in the night look. */
const Check = ({ on }: { on: boolean | 'mixed' }) => (
  <span
    aria-hidden
    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-black"
    style={on ? { background: '#ffd36a', borderColor: '#ffe7b8', color: '#3a2306' } : { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,231,184,0.45)' }}
  >
    {on === 'mixed' ? '−' : on ? '✓' : ''}
  </span>
);

/** The rules as chips: what a room asks, and which of the three switches are on. */
export const RulesCard = ({ rules, showFurigana, compact = false }: { rules: RoomRules; showFurigana: boolean; compact?: boolean }) => (
  <div className={`g-pill-night w-full rounded-xl text-left ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
    <p className={`font-black ${compact ? 'text-[11px]' : 'text-xs'}`}>
      📜 <RubyText showFurigana={showFurigana}>{`へやの ルール ・ 出題(しゅつだい) ${rulesPool(rules).length}字(じ)`}</RubyText>
    </p>
    <p className={`mt-0.5 font-bold opacity-90 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
      📚 <RubyText showFurigana={showFurigana}>{rangeLabel(rules)}</RubyText>
    </p>
    <ul className="mt-1 flex flex-wrap gap-1">
      {SWITCHES.map((s) => (
        <li
          key={s.key}
          className={`rounded-full px-2 py-0.5 font-black ${compact ? 'text-[10px]' : 'text-[11px]'}`}
          style={rules[s.key] ? { background: '#ffd36a', color: '#3a2306' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(244,241,255,0.6)', textDecoration: 'line-through' }}
        >
          {s.icon} <RubyText showFurigana={showFurigana}>{`${s.label} ${rules[s.key] ? 'あり' : 'なし'}`}</RubyText>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * The maker's sheet: the range (レベル and ステージ, narrowed together) and the
 * three switches. 「この ルールで へやを つくる」 opens the room with them.
 */
export const RoomRulesEditor = ({ initial, showFurigana, onCreate, onClose }: { initial: RoomRules; showFurigana: boolean; onCreate: (rules: RoomRules) => void; onClose: () => void }) => {
  const [rules, setRules] = useState<RoomRules>(initial);
  /** The chapter whose episodes are shown to pick one by one. */
  const [open, setOpen] = useState<string | null>(null);
  const pool = useMemo(() => rulesPool(rules), [rules]);
  const chosen = new Set(rules.stages ?? []);

  const toggleLevel = (l: JlptLevel) => {
    sfx.tap();
    setRules((r) => {
      const levels = r.levels.includes(l) ? r.levels.filter((x) => x !== l) : LEVELS.filter((x) => x === l || r.levels.includes(x));
      return levels.length ? { ...r, levels } : r;
    });
  };
  /** Episodes on and off; all of them off again is 「ぜんぶ」. */
  const setStages = (ids: string[], on: boolean) => {
    sfx.tap();
    setRules((r) => {
      const now = new Set(r.stages ?? []);
      for (const id of ids) {
        if (on) now.add(id);
        else now.delete(id);
      }
      return { ...r, stages: now.size ? STAGE_CHAPTERS.flatMap((c) => c.episodes.map((e) => e.id)).filter((id) => now.has(id)) : null };
    });
  };

  return (
    <div className="flex max-h-[min(78dvh,640px)] flex-col">
      <p className="text-lg font-black">
        📜 <RubyText showFurigana={showFurigana}>へやの ルールを きめる</RubyText>
      </p>
      <p className="mt-0.5 text-[11px] opacity-85">
        <RubyText showFurigana={showFurigana}>ともだちにも この ルールが 見(み)えます。</RubyText>
      </p>

      <div className="mt-2 -mx-1 flex-1 overflow-y-auto px-1 text-left">
        <p className="text-xs font-black text-[#ffd36a]">
          <RubyText showFurigana={showFurigana}>出題(しゅつだい)の はんい</RubyText>
        </p>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              role="checkbox"
              aria-checked={rules.levels.includes(l)}
              className="g-pill-night flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-base font-black"
              onClick={() => toggleLevel(l)}
            >
              <Check on={rules.levels.includes(l)} />
              {l}
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] font-black opacity-90">
            <RubyText showFurigana={showFurigana}>ステージで しぼる</RubyText>
          </p>
          <button
            type="button"
            role="checkbox"
            aria-checked={!rules.stages}
            className="flex items-center gap-1 text-[11px] font-black"
            onClick={() => {
              sfx.tap();
              setRules((r) => ({ ...r, stages: null }));
            }}
          >
            <Check on={!rules.stages} />
            <RubyText showFurigana={showFurigana}>ぜんぶ</RubyText>
          </button>
        </div>
        <ul className="mt-1 flex flex-col gap-1">
          {STAGE_CHAPTERS.map((c) => {
            const ids = c.episodes.map((e) => e.id);
            const all = ids.every((id) => chosen.has(id));
            const some = !all && ids.some((id) => chosen.has(id));
            return (
              <li key={c.id} className="g-pill-night rounded-xl px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <button type="button" role="checkbox" aria-checked={all ? true : some ? 'mixed' : false} className="flex flex-1 items-center gap-2 text-left text-xs font-black" onClick={() => setStages(ids, !all)}>
                    <Check on={all || (some && 'mixed')} />
                    <RubyText showFurigana={showFurigana}>{`${c.order}章(しょう) ${c.title}`}</RubyText>
                  </button>
                  <button
                    type="button"
                    aria-expanded={open === c.id}
                    aria-label={`${c.order}章の 話を えらぶ`}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-black"
                    onClick={() => {
                      sfx.tap();
                      setOpen((o) => (o === c.id ? null : c.id));
                    }}
                  >
                    {open === c.id ? '▲' : '▼'}
                  </button>
                </div>
                {open === c.id && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {c.episodes.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        role="checkbox"
                        aria-checked={chosen.has(e.id)}
                        className="rounded-lg px-2 py-1 text-[11px] font-black"
                        style={chosen.has(e.id) ? { background: '#ffd36a', color: '#3a2306' } : { background: 'rgba(255,255,255,0.1)' }}
                        onClick={() => setStages([e.id], !chosen.has(e.id))}
                      >
                        <RubyText showFurigana={showFurigana}>{`${e.order}話(わ) ${e.kanji.map(charRuby).join('')}`}</RubyText>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-xs font-black text-[#ffd36a]">
          <RubyText showFurigana={showFurigana}>つよさの ルール</RubyText>
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {SWITCHES.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                role="checkbox"
                aria-checked={rules[s.key]}
                className="g-pill-night flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left"
                onClick={() => {
                  sfx.tap();
                  setRules((r) => ({ ...r, [s.key]: !r[s.key] }));
                }}
              >
                <Check on={rules[s.key]} />
                <span aria-hidden className="text-xl">
                  {s.icon}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-black">
                    <RubyText showFurigana={showFurigana}>{s.label}</RubyText>
                  </span>
                  <span className="text-[10px] font-bold opacity-80">
                    <RubyText showFurigana={showFurigana}>{s.says}</RubyText>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-2 text-xs font-black tabular-nums" aria-live="polite" style={{ color: pool.length ? '#9be37a' : '#ff9a8a' }}>
        <RubyText showFurigana={showFurigana}>{pool.length ? `${pool.length}字(じ)から 出(で)ます` : '出(で)る 字(じ)が ありません'}</RubyText>
      </p>
      <button type="button" disabled={!pool.length} className="g-btn g-btn-primary g-shine mt-2 w-full !min-h-[52px] disabled:opacity-45" onClick={() => onCreate(rules)}>
        <span className="relative z-10">
          🔑 <RubyText showFurigana={showFurigana}>この ルールで へやを つくる</RubyText>
        </span>
      </button>
      <button type="button" className="mt-2 text-xs font-bold underline opacity-80" onClick={onClose}>
        <RubyText showFurigana={showFurigana}>もどる</RubyText>
      </button>
    </div>
  );
};
