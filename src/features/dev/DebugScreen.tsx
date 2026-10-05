import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import type { GameState } from '../../store/gameStore';
import { useSafeBack } from '../../lib/nav';
import { stripRuby } from '../../lib/ruby';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { rustLevel } from '../../lib/srs';
import { MASTERY_REPS, MOJI_OWN_REPS, starsOf } from '../../lib/mastery';
import { REPS_TO_OBTAIN } from '../../types/kanji';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { finaleOf } from '../../data/mojiFinale';
import { KANA_EPISODES, KANA_REPS } from '../../data/kana';
import { Feature, FEATURE_INTRO, isFeatureUnlocked, UNLOCKED_BY, UNLOCKED_ON_MOJI } from '../../data/unlocks';
import { INDIVIDUALS } from '../../data/individuals';
import { isVersusConfigured } from '../../lib/versusConfig';
import { clearBefore, clearThrough, parseSave, toggleIn, withMistakes, withReps, withRust } from './debugEdit';

/**
 * デバッグ — sets the save by hand to test a part of the game without
 * playing up to it: what is open, how far the story is, how many times each
 * kanji has been written, the numbers. Reached from せってい (tap
 * 「この ゲームに ついて」 seven times) or #/debug. Not for players, so no
 * furigana (furigana.test.ts skips src/features/dev/).
 *
 * Every edit goes through the edits in debugEdit.ts, which leave the save in
 * a state the game could have reached by playing.
 */

type Tab = 'open' | 'story' | 'kanji' | 'numbers' | 'save';
const TABS: { id: Tab; label: string }[] = [
  { id: 'open', label: 'ひらく' },
  { id: 'story', label: 'お話' },
  { id: 'kanji', label: '字' },
  { id: 'numbers', label: '数値' },
  { id: 'save', label: 'セーブ' },
];

const set = useGameStore.setState;

/** One playable stage of 文字が 消えた 町, in route order. */
interface RouteStage {
  id: string;
  label: string;
  boss: boolean;
}

/** Every chapter's episodes, then its まとめの ボス. */
const MOJI_ROUTE: RouteStage[] = MOJI_CHAPTERS.flatMap((c) => {
  const eps = MOJI_EPISODES.filter((e) => e.chapter === c.id).sort((a, b) => a.order - b.order);
  const fin = finaleOf(c.id);
  return [
    ...eps.map((e) => ({ id: e.id, label: `${c.order}章 ${e.order}話 ${stripRuby(e.title)}`, boss: false })),
    ...(fin && eps.length ? [{ id: fin.id, label: `${c.order}章 ${stripRuby(fin.title)}`, boss: true }] : []),
  ];
});
const MOJI_ROUTE_IDS = MOJI_ROUTE.map((s) => s.id);
const KANA_ROUTE_IDS = KANA_EPISODES.map((e) => e.id);
const stageLabel = (id: string): string =>
  MOJI_ROUTE.find((s) => s.id === id)?.label ?? KANA_EPISODES.find((e) => e.id === id)?.title ?? id;

// ── small parts ────────────────────────────────────────────────────────────

const Section = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
    <h2 className="text-sm font-black text-[#ffd36a]">{title}</h2>
    {note && <p className="mt-0.5 text-xs text-white/60">{note}</p>}
    <div className="mt-2">{children}</div>
  </section>
);

const Btn = ({ children, onClick, on, disabled, danger }: { children: ReactNode; onClick: () => void; on?: boolean; disabled?: boolean; danger?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`min-h-[34px] rounded-lg px-2.5 text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-30 ${
      danger ? 'bg-[#c0392b] text-white' : on ? 'bg-[#ffd36a] text-[#1b1640]' : 'bg-white/10 text-white active:bg-white/20'
    }`}
  >
    {children}
  </button>
);

const Stepper = ({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) => (
  <div className="flex items-center gap-1" role="group" aria-label={label}>
    <Btn onClick={() => onChange(value - 1)} disabled={value <= min}>
      −
    </Btn>
    <span className="w-8 text-center text-base font-black tabular-nums">{value}</span>
    <Btn onClick={() => onChange(value + 1)} disabled={value >= max}>
      ＋
    </Btn>
  </div>
);

/** A number that is saved when the field is left or Enter is pressed. */
const NumberRow = ({ label, value, onSet, steps = [] }: { label: string; value: number; onSet: (n: number) => void; steps?: number[] }) => {
  const commit = (raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n) && n !== value) onSet(Math.max(0, Math.round(n)));
  };
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-24 shrink-0 text-xs font-bold">{label}</span>
      <input
        key={value}
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={value}
        aria-label={label}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-[34px] w-24 min-w-0 rounded-lg border border-white/20 bg-black/30 px-2 text-right text-sm font-bold tabular-nums"
      />
      <div className="flex gap-1 overflow-x-auto">
        {steps.map((s) => (
          <Btn key={s} onClick={() => onSet(Math.max(0, value + s))}>
            {s > 0 ? `+${s}` : s}
          </Btn>
        ))}
      </div>
    </div>
  );
};

// ── ひらく ────────────────────────────────────────────────────────────────

const OpenTab = () => {
  const cleared = useGameStore((s) => s.clearedStages);
  return (
    <Section
      title="ひらく もの"
      note="新ルートの 決まり（data/unlocks.ts）。「開く」は その話まで クリア、「直前まで」は その話の 手前まで クリアに します（開く ところを 見る ため）。"
    >
      <ul className="flex flex-col gap-2">
        {Object.values(Feature).map((f) => {
          const open = isFeatureUnlocked(f, cleared);
          const at = UNLOCKED_ON_MOJI[f];
          return (
            <li key={f} className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
              <span className={`w-12 shrink-0 text-center text-xs font-black ${open ? 'text-[#7be08a]' : 'text-white/40'}`}>{open ? '開いた' : 'まだ'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{stripRuby(FEATURE_INTRO[f].label)}</p>
                <p className="text-[11px] leading-snug text-white/60">{stageLabel(at)}</p>
                <p className="text-[10px] leading-snug text-white/40">
                  むかし編: {UNLOCKED_BY[f]}
                  {f === Feature.VERSUS && !isVersusConfigured && '・中継 未設定'}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Btn onClick={() => set({ clearedStages: clearThrough(cleared, MOJI_ROUTE_IDS, at) })} disabled={open}>
                  開く
                </Btn>
                <Btn onClick={() => set({ clearedStages: clearBefore(cleared, MOJI_ROUTE_IDS, at) })}>直前まで</Btn>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
};

// ── お話 ──────────────────────────────────────────────────────────────────

const StoryTab = () => {
  const s = useGameStore();
  const row = (id: string, label: string, route: readonly string[], extras: boolean) => {
    const done = s.clearedStages.includes(id);
    return (
      <li key={id} className="flex flex-wrap items-center gap-1.5 border-b border-white/5 py-2">
        <span className={`basis-full text-xs font-bold ${done ? '' : 'text-white/50'}`}>{label}</span>
        <Btn on={done} onClick={() => set({ clearedStages: toggleIn(s.clearedStages, id, !done) })}>
          クリア
        </Btn>
        {extras && (
          <>
            <Btn on={s.perfectStages.includes(id)} onClick={() => set({ perfectStages: toggleIn(s.perfectStages, id, !s.perfectStages.includes(id)) })}>
              ★3
            </Btn>
            <Btn on={s.hardStages.includes(id)} onClick={() => set({ hardStages: toggleIn(s.hardStages, id, !s.hardStages.includes(id)) })}>
              むずかしい
            </Btn>
          </>
        )}
        <Btn onClick={() => set({ clearedStages: clearThrough(s.clearedStages, route, id) })}>ここまで</Btn>
      </li>
    );
  };
  const tutorialLabels: Record<keyof GameState['tutorials'], string> = {
    prologue: 'プロローグ',
    stars: '★の ひみつ',
    tools: 'どうぐの 説明',
    forge: '合成の 説明',
    intro: 'むかし編 0話',
    gacha: 'はじめての ガチャ',
    firstWeapon: 'はじめての 武器',
  };
  return (
    <>
      <p className="mt-3 text-xs text-white/60">クリアに しても ごほうび（ジェム・なかま）は 入りません。「数値」で 足して ください。</p>
      <Section title="文字が 消えた 町">
        <div className="mb-1 flex gap-1.5">
          <Btn onClick={() => set({ clearedStages: s.clearedStages.filter((id) => !MOJI_ROUTE_IDS.includes(id)) })}>ぜんぶ 外す</Btn>
        </div>
        <ul>{MOJI_ROUTE.map((st) => row(st.id, st.label, MOJI_ROUTE_IDS, true))}</ul>
      </Section>
      <Section title="0章 かな">
        <div className="mb-1 flex gap-1.5">
          <Btn onClick={() => set({ clearedStages: clearThrough(s.clearedStages, KANA_ROUTE_IDS, KANA_ROUTE_IDS.at(-1)!) })}>ぜんぶ クリア</Btn>
          <Btn onClick={() => set({ clearedStages: s.clearedStages.filter((id) => !KANA_ROUTE_IDS.includes(id)) })}>ぜんぶ 外す</Btn>
        </div>
        <ul>{KANA_EPISODES.map((e) => row(e.id, `${e.order}. ${e.title}`, KANA_ROUTE_IDS, false))}</ul>
      </Section>
      <Section title="見た 説明" note="ON は「もう 見た」。OFF に すると 次に また 出ます。">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(tutorialLabels) as (keyof GameState['tutorials'])[]).map((k) => (
            <Btn key={k} on={s.tutorials[k]} onClick={() => set({ tutorials: { ...s.tutorials, [k]: !s.tutorials[k] } })}>
              {tutorialLabels[k]}
            </Btn>
          ))}
        </div>
      </Section>
      <Section title="はじめかた・いまの 世界">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 text-xs font-bold">はじめかた</span>
          {([['kana', 'かなから'], ['town', '町から'], [null, 'まだ']] as const).map(([v, l]) => (
            <Btn key={String(v)} on={s.startPath === v} onClick={() => set({ startPath: v })}>
              {l}
            </Btn>
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="w-16 text-xs font-bold">世界</span>
          {([['moji', '文字が 消えた 町'], ['mukashi', 'むかし'], ['gendai', '現代']] as const).map(([v, l]) => (
            <Btn key={v} on={s.lastArc === v} onClick={() => set({ lastArc: v })}>
              {l}
            </Btn>
          ))}
        </div>
      </Section>
    </>
  );
};

// ── 字 ─────────────────────────────────────────────────────────────────────

interface Group {
  label: string;
  chars: string[];
}

type Progress = GameState['progress'][string];
type KanjiEdit = (p: Progress | undefined, now: number) => Progress | undefined;

/** Applies one edit to each of these kanji's records; returns the time it used. */
const editKanjiNow = (chars: string[], edit: KanjiEdit): number => {
  const now = Date.now();
  set((s) => {
    const next = { ...s.progress };
    for (const ch of chars) {
      const id = getKanjiByChar(ch)?.id;
      if (!id) continue;
      const p = edit(next[id], now);
      if (p) next[id] = p;
    }
    return { progress: next };
  });
  return now;
};

const KanjiTab = () => {
  const progress = useGameStore((s) => s.progress);
  const kana = useGameStore((s) => s.kana);
  const [chapter, setChapter] = useState<string>('moji-1');
  const [picked, setPicked] = useState<string | null>(null);
  // Read once: rust only needs to be right when the tab is opened or edited.
  const [now, setNow] = useState(() => Date.now());
  const isKana = chapter === 'kana';

  const groups: Group[] = useMemo(() => {
    if (isKana) return KANA_EPISODES.map((e) => ({ label: `${e.order}. ${e.title}`, chars: e.kana }));
    const c = MOJI_CHAPTERS.find((x) => x.id === chapter);
    if (!c) return [];
    const eps = MOJI_EPISODES.filter((e) => e.chapter === c.id).sort((a, b) => a.order - b.order);
    const inEps = new Set(eps.flatMap((e) => e.kanji));
    const rest = c.kanji.filter((k) => !inEps.has(k));
    return [
      ...eps.map((e) => ({ label: `${e.order}話 ${stripRuby(e.title)}`, chars: e.kanji })),
      ...(rest.length ? [{ label: eps.length ? 'まだ 話の ない 字' : `${c.order}章の 字`, chars: rest }] : []),
    ].map((g) => ({ ...g, chars: g.chars.filter((ch) => getKanjiByChar(ch)) }));
  }, [chapter, isKana]);

  const editKanji = (chars: string[], edit: KanjiEdit) => setNow(editKanjiNow(chars, edit));
  const setKana = (chars: string[], n: number) =>
    set((s) => ({ kana: { ...s.kana, ...Object.fromEntries(chars.map((ch) => [ch, Math.max(0, Math.min(KANA_REPS, n))])) } }));

  const repsOf = (ch: string): number => (isKana ? (kana[ch] ?? 0) : (progress[getKanjiByChar(ch)?.id ?? '']?.reps ?? 0));
  const levels = isKana ? [0, KANA_REPS] : [0, ...MASTERY_REPS];
  const pickedData = picked && !isKana ? getKanjiByChar(picked) : undefined;
  const pickedP = pickedData ? progress[pickedData.id] : undefined;

  return (
    <>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        <Btn on={isKana} onClick={() => (setChapter('kana'), setPicked(null))}>
          かな
        </Btn>
        {MOJI_CHAPTERS.map((c) => (
          <Btn key={c.id} on={chapter === c.id} onClick={() => (setChapter(c.id), setPicked(null))}>
            {c.order}章
          </Btn>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-white/60">
        {isKana
          ? `かなは ${KANA_REPS}回で おぼえた ことに なります。`
          : `★1=${MASTERY_REPS[0]}回（新ルートで 持って いる 字）・★2=${MASTERY_REPS[1]}回・★3=${MASTERY_REPS[2]}回（さびる ように なる）。字を 押すと 細かく 変えられます。`}
      </p>
      {groups.map((g) => (
        <Section key={g.label} title={g.label}>
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <span className="mr-1 text-[11px] text-white/60">ぜんぶ</span>
            {levels.map((n) => (
              <Btn key={n} onClick={() => (isKana ? setKana(g.chars, n) : editKanji(g.chars, (p, t) => withReps(p, n, t)))}>
                {n}回
              </Btn>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {g.chars.map((ch) => {
              const reps = repsOf(ch);
              const id = getKanjiByChar(ch)?.id ?? '';
              const rust = isKana ? 0 : rustLevel(progress[id], now);
              const owned = isKana ? reps >= KANA_REPS : reps >= MOJI_OWN_REPS;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setPicked(picked === ch ? null : ch)}
                  className={`relative flex flex-col items-center rounded-lg border-2 py-1 ${picked === ch ? 'border-[#ffd36a]' : 'border-transparent'} ${owned ? 'bg-[#2d6a4f]/70' : reps > 0 ? 'bg-[#6b5a1e]/60' : 'bg-black/30'}`}
                >
                  <span className="text-2xl leading-tight font-black">{ch}</span>
                  <span className="text-[11px] font-bold tabular-nums">{reps}回</span>
                  {!isKana && <span className="text-[10px] leading-none text-[#ffd36a]">{'★'.repeat(starsOf(reps)) || '·'}</span>}
                  {rust > 0 && (
                    <span className="absolute -top-1.5 -right-1 rounded bg-[#8a4b1f] px-1 text-[9px] leading-[14px] font-black text-white">さび</span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>
      ))}

      {picked && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-white/15 bg-[#1b1640]/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black">{picked}</span>
            <div className="min-w-0 flex-1 text-[11px] text-white/70">
              {pickedData ? (
                <>
                  <p className="truncate">
                    {pickedData.on.join('・')} / {pickedData.kun.join('・')}
                  </p>
                  <p className="truncate">{pickedData.meanings.slice(0, 3).join(', ')}</p>
                </>
              ) : (
                <p>かな</p>
              )}
            </div>
            <Btn onClick={() => setPicked(null)}>とじる</Btn>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">書いた 回数</span>
              <Stepper
                label="書いた 回数"
                value={repsOf(picked)}
                min={0}
                max={isKana ? KANA_REPS : REPS_TO_OBTAIN}
                onChange={(n) => (isKana ? setKana([picked], n) : editKanji([picked], (p, t) => withReps(p, n, t)))}
              />
            </div>
            {pickedData && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">まちがい</span>
                <Stepper label="まちがい" value={pickedP?.mistakes ?? 0} min={0} max={999} onChange={(n) => editKanji([picked], (p) => withMistakes(p, n))} />
              </div>
            )}
          </div>
          {pickedData && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold">さび</span>
              {([[0, 'なし'], [0.5, '半分'], [1, 'ぜんぶ']] as const).map(([l, label]) => (
                <Btn
                  key={l}
                  on={pickedP?.obtainedAt != null && Math.abs(rustLevel(pickedP, now) - l) < 0.05}
                  disabled={pickedP?.obtainedAt == null}
                  onClick={() => editKanji([picked], (p, t) => withRust(p, l, t))}
                >
                  {label}
                </Btn>
              ))}
              {pickedP?.obtainedAt == null && <span className="text-[11px] text-white/50">{REPS_TO_OBTAIN}回 書いた 字だけ さびます</span>}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ── 数値 ──────────────────────────────────────────────────────────────────

const NumbersTab = () => {
  const s = useGameStore();
  return (
    <>
      <Section title="おかね・経験値">
        <NumberRow label="ジェム" value={s.gems} onSet={(n) => set({ gems: n })} steps={[100, 1000]} />
        <NumberRow label="すみ" value={s.sumi} onSet={(n) => set({ sumi: n })} steps={[10, 100]} />
        <NumberRow label="経験値" value={s.exp} onSet={(n) => set({ exp: n })} steps={[10, 100]} />
        <NumberRow label="ガチャ 天井" value={s.pityCount} onSet={(n) => set({ pityCount: n })} />
        <NumberRow label="れんぞく 日数" value={s.streak.count} onSet={(n) => set({ streak: { ...s.streak, count: n } })} />
      </Section>
      <Section title="たいせん">
        <NumberRow label="レート" value={s.versus.rating} onSet={(n) => set({ versus: { ...s.versus, rating: n } })} steps={[-100, 100]} />
        <NumberRow label="かち" value={s.versus.wins} onSet={(n) => set({ versus: { ...s.versus, wins: n } })} />
        <NumberRow label="まけ" value={s.versus.losses} onSet={(n) => set({ versus: { ...s.versus, losses: n } })} />
      </Section>
      <Section title="まいにち" note="今日の 数と もらった ごほうびを 0に します。">
        <Btn
          onClick={() => {
            set({ daily: { ...s.daily, date: '' } });
            s.rollDailyIfNeeded();
          }}
        >
          今日を リセット
        </Btn>
        <p className="mt-1.5 text-[11px] text-white/60">
          今日: 書いた {s.daily.repsToday}・手に 入れた {s.daily.obtainedToday}・クリア {s.daily.stagesToday}・ふくしゅう {s.daily.reviewsToday}・もらった {s.daily.claimed.length}
        </p>
      </Section>
      <Section title="なかま" note="押すと 持つ／外す。">
        <div className="flex flex-wrap gap-1.5">
          {INDIVIDUALS.map((ind) => {
            const has = s.individuals.includes(ind.id);
            return (
              <Btn
                key={ind.id}
                on={has}
                onClick={() =>
                  set({
                    individuals: toggleIn(s.individuals, ind.id, !has),
                    activeIndividual: has && s.activeIndividual === ind.id ? null : s.activeIndividual,
                  })
                }
              >
                {stripRuby(ind.shortName)}
              </Btn>
            );
          })}
        </div>
      </Section>
    </>
  );
};

// ── セーブ ────────────────────────────────────────────────────────────────

const dataKeys = (): string[] => {
  const st = useGameStore.getState() as unknown as Record<string, unknown>;
  return Object.keys(st).filter((k) => typeof st[k] !== 'function');
};

const SaveTab = () => {
  const navigate = useNavigate();
  const resetSave = useGameStore((s) => s.resetSave);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(false);
  const dump = () => {
    const st = useGameStore.getState() as unknown as Record<string, unknown>;
    return JSON.stringify(Object.fromEntries(dataKeys().map((k) => [k, st[k]])));
  };
  return (
    <>
      <Section title="セーブを 書き出す" note="いまの セーブを コピーします。不具合の 報告や、あとで もどす ときに。">
        <Btn
          onClick={() =>
            navigator.clipboard.writeText(dump()).then(
              () => setMsg('コピーしました'),
              () => (setText(dump()), setMsg('コピー できないので 下に 出しました')),
            )
          }
        >
          コピー
        </Btn>
      </Section>
      <Section title="セーブを 読み込む" note="書き出した セーブを はりつけて「読み込む」。いまの セーブは 上書き されます。">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          aria-label="セーブ"
          className="w-full rounded-lg border border-white/20 bg-black/30 p-2 font-mono text-[11px]"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <Btn
            disabled={!text.trim()}
            onClick={() => {
              const parsed = parseSave(text, dataKeys());
              if (!parsed) return setMsg('セーブの 形では ありません');
              set(parsed as Partial<GameState>);
              setMsg('読み込みました');
            }}
          >
            読み込む
          </Btn>
        </div>
      </Section>
      {msg && (
        <p role="status" className="mt-2 text-xs font-bold text-[#7be08a]">
          {msg}
        </p>
      )}
      <Section title="はじめから" note="セーブを ぜんぶ 消します。">
        {confirm ? (
          <div className="flex gap-1.5">
            <Btn onClick={() => setConfirm(false)}>やめる</Btn>
            <Btn
              danger
              onClick={() => {
                resetSave();
                navigate('/');
              }}
            >
              本当に 消す
            </Btn>
          </div>
        ) : (
          <Btn onClick={() => setConfirm(true)}>データを 消す</Btn>
        )}
      </Section>
    </>
  );
};

// ── screen ────────────────────────────────────────────────────────────────

export const DebugScreen = () => {
  const back = useSafeBack('/settings');
  const [tab, setTab] = useState<Tab>('kanji');
  return (
    <div className="min-h-dvh bg-[#14122b] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#14122b]/95 px-4 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <Btn onClick={back}>◀ もどる</Btn>
          <h1 className="text-base font-black">🛠 デバッグ</h1>
          <span className="w-16" />
        </div>
        <nav className="mt-2 flex" aria-label="デバッグの 項目">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
              className={`min-h-[40px] flex-1 border-b-2 text-sm font-bold ${tab === t.id ? 'border-[#ffd36a] text-[#ffd36a]' : 'border-transparent text-white/60'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-6">
        <p className="mt-3 rounded-lg bg-[#c0392b]/25 px-3 py-2 text-[11px] text-white/80">テスト用です。変えた 値は すぐ セーブに 入ります。</p>
        {tab === 'open' && <OpenTab />}
        {tab === 'story' && <StoryTab />}
        {tab === 'kanji' && <KanjiTab />}
        {tab === 'numbers' && <NumbersTab />}
        {tab === 'save' && <SaveTab />}
      </main>
    </div>
  );
};

export default DebugScreen;
