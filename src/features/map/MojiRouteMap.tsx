import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { MOJI_CHAPTERS, isChapterReady } from '../../data/mojiRoute';
import { KANA_EPISODES, isKanaEpisodeUnlocked, type KanaEpisode } from '../../data/kana';
import KanaText from '../kana/KanaText';
import { useKnownKana } from '../kana/useKnownKana';
import { MOJI_EPISODES, episodesOf, isMojiEpisodeUnlocked } from '../../data/mojiEpisodes';
import KanjiBackText from '../moji/KanjiBackText';
import { useOwnedKanji } from '../moji/useOwnedKanji';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { kanjiRuby } from '../../lib/reading';
import { MASTERY_REPS, starsOf } from '../../lib/mastery';
import { assetPath } from '../../lib/assetPath';
import { getKanaEpisode } from '../../data/kana';
import { getMojiEpisode } from '../../data/mojiEpisodes';
import { continuePath, episodePath, nextUp } from '../../data/mojiFlow';
import { useBgm } from '../../lib/bgm';
import { preloadImages } from '../../lib/preload';
import { episodeArt } from '../../data/episodeArt';

/**
 * ステージせんたく — 文字が 消えた 町の 入口 (08 §3.7).
 *
 * Laid out after the delivered example (art-src/stageselect/00_配置例_ステージせんたく.png,
 * 941 × 1672) from its parts (public/img/stageselect/, scripts/prepare_ui_assets.mjs):
 * the airport at sunset; the sign 「ステージせんたく / はじまりの 空港」; the line
 * 「ことばの 翼で、新しい 世界へ 飛び立とう！」; the way-out sign to the town on
 * the left and the departures board on the right; Nexmax setting off; the old
 * map with five cards — ひらがな・カタカナ (0章), N5, N4 and N3 (both
 * 準備中) — and the menu along the bottom.
 *
 * A card opens its episodes on a sheet over the map: the list the old chapter
 * table had (✓, NEW, ★). The cards' stars are drawn into the art; the ones not
 * earned yet are covered in grey. The two boards the example shows have no
 * picture of their own, so they are drawn here; the way-out sign names the
 * town ナニワタウン (the example says 大阪, before the town had its name).
 *
 * Every place is the example's own pixel on its 941-wide canvas, in container
 * units: the sky, sign and Nexmax hang from the top, the map, cards and menu
 * stand on the bottom, and a taller phone gets more deck in between.
 */

const W = 941;
const cq = (px: number) => `${(px / W) * 100}cqw`;
/** A box hanging from the top, in the example's pixels. */
const fromTop = (x: number, y: number, w: number, h?: number): CSSProperties => ({ left: cq(x), top: cq(y), width: cq(w), height: h == null ? undefined : cq(h) });
/** The bottom group starts at the example's y = 767 (the top of the first card). */
const BOTTOM_Y = 767;
const BOTTOM_H = 1672 - BOTTOM_Y;
const fromBottom = (x: number, y: number, w: number, h?: number): CSSProperties => fromTop(x, y - BOTTOM_Y, w, h);

const art = (name: string) => assetPath(`img/stageselect/${name}.webp`);
const MINCHO = { fontFamily: 'var(--font-mincho)' } as const;
const OUTLINE = '0 0 2px #1a0d04, 0 0 2px #1a0d04, 0 1px 3px #1a0d04, 0 0 8px rgba(26,13,4,0.8)';

type GroupId = 'hiragana' | 'katakana' | 'n5' | 'n4' | 'n3';

/** Card art (1536 × 1024 canvas): where it stands, and the centres of its three stars (canvas pixels). */
const CARDS: { id: GroupId; img: string; x: number; y: number; stars?: { cx: number[]; cy: number; size: number }; locked?: boolean }[] = [
  { id: 'hiragana', img: 'card_hiragana', x: 47, y: 787, stars: { cx: [578, 745, 915], cy: 840, size: 150 } },
  { id: 'katakana', img: 'card_katakana', x: 486, y: 792, stars: { cx: [610, 760, 905], cy: 865, size: 135 } },
  { id: 'n5', img: 'card_n5', x: 279, y: 1039, stars: { cx: [610, 762, 915], cy: 840, size: 135 } },
  { id: 'n4', img: 'card_n4', x: 15, y: 1225, locked: true },
  { id: 'n3', img: 'card_n3', x: 498, y: 1242, locked: true },
];
const CARD_W = 407;
const CARD_H = (CARD_W * 1024) / 1536;

const HIRAGANA_EPS = KANA_EPISODES.filter((e) => e.script === 'hiragana');
const KATAKANA_EPS = KANA_EPISODES.filter((e) => e.script === 'katakana');
const N5_CHAPTERS = MOJI_CHAPTERS.filter((c) => c.level === 'N5');
const N5_KANJI = N5_CHAPTERS.flatMap((c) => c.kanji);

/** Stars for a share done: one per third, the third only when all is done. */
const thirds = (done: number, total: number): number => (total > 0 && done >= total ? 3 : Math.min(2, Math.floor((3 * done) / Math.max(1, total))));

/** A star not earned yet, laid over the gold one drawn into the card. */
const GreyStar = ({ style }: { style: CSSProperties }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 ? 23 : 47;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(52 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="absolute -translate-x-1/2 -translate-y-1/2" style={style}>
      <defs>
        <linearGradient id="ss-grey" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#e7dfd2" />
          <stop offset="0.55" stopColor="#b3aa9c" />
          <stop offset="1" stopColor="#7f776b" />
        </linearGradient>
      </defs>
      <polygon points={pts} fill="url(#ss-grey)" stroke="#2e1c0c" strokeWidth="5" strokeLinejoin="round" />
      <polygon points={pts} fill="none" stroke="#fff6e6" strokeOpacity="0.35" strokeWidth="1.5" strokeLinejoin="round" transform="translate(50 52) scale(0.8) translate(-50 -52)" />
    </svg>
  );
};

/** The departures board the example has on the right. */
const DeparturesBoard = ({ showFurigana }: { showFurigana: boolean }) => (
  <div
    aria-hidden
    className="absolute flex flex-col rounded-[1cqw] border-[0.5cqw] border-[#b8863f] bg-[#0f1430]/95 px-[1.6cqw] py-[1.2cqw] text-[#f4f1ff]"
    style={{ ...fromTop(790, 112, 190, 300), boxShadow: '0 0 0 0.3cqw #3a250f, 0 1cqw 3cqw rgba(0,0,0,0.6)' }}
  >
    <p className="flex items-center gap-[1cqw] border-b border-white/25 pb-[0.4cqw] leading-[1.6] font-bold" style={{ fontSize: cq(20) }}>
      <span className="text-[#7fb2ff]">✈</span>
      <RubyText showFurigana={showFurigana}>行(い)き先(さき)</RubyText>
    </p>
    {['東京(とうきょう)', '札幌(さっぽろ)', '福岡(ふくおか)', 'ソウル', '台北(たいぺい)', 'シンガポール'].map((city) => (
      <p key={city} className="flex flex-1 items-center gap-[1.2cqw] leading-[1.6] whitespace-nowrap" style={{ fontSize: cq(18) }}>
        <span className="flex aspect-square items-center justify-center rounded-[0.4cqw] bg-[#1f4fb8] leading-none text-white" style={{ width: cq(28), fontSize: cq(16) }}>
          ✈
        </span>
        <RubyText showFurigana={showFurigana}>{city}</RubyText>
      </p>
    ))}
  </div>
);

/** The way-out sign the example has on the left: to the town. */
const TownSign = () => (
  <div aria-hidden className="absolute" style={{ ...fromTop(26, 250, 300, 205), perspective: cq(900) }}>
    <div
      className="flex h-full w-full items-center gap-[2cqw] rounded-[0.8cqw] border-[0.5cqw] border-[#8a6128] bg-[#121218]/95 px-[2.6cqw]"
      style={{ transform: 'rotateY(14deg)', transformOrigin: 'left center', boxShadow: '0 1cqw 3cqw rgba(0,0,0,0.6)' }}
    >
      <span className="flex aspect-square shrink-0 items-center justify-center rounded-[1cqw] border-[0.5cqw] border-white text-white" style={{ width: cq(74), fontSize: cq(48) }}>
        ✈
      </span>
      <span className="flex flex-col leading-[1.15] font-bold whitespace-nowrap text-white">
        <span style={{ fontSize: cq(34) }}>ナニワ</span>
        <span style={{ fontSize: cq(34) }}>タウン</span>
        <span className="mt-[0.8cqw] tracking-[0.06em]" style={{ fontSize: cq(14) }}>
          NANIWA TOWN
        </span>
      </span>
      <span className="ml-auto self-end pb-[1cqw] font-black text-[#f6c544]" style={{ fontSize: cq(50) }}>
        →
      </span>
    </div>
  </div>
);

/** One episode of 0章 on a sheet. */
const KanaEpisodeButton = ({ ep, known, cleared, fresh, onOpen }: { ep: KanaEpisode; known: ReadonlySet<string>; cleared: readonly string[]; fresh: string | null; onOpen: () => void }) => {
  const open = isKanaEpisodeUnlocked(ep, cleared);
  const done = cleared.includes(ep.id);
  return (
    <button
      type="button"
      data-tap
      disabled={!open}
      onClick={onOpen}
      className="relative w-full rounded-xl border-2 px-2 py-1.5 text-left disabled:opacity-50"
      style={{
        borderColor: fresh === ep.id ? '#e2453c' : done ? '#4f9a3c' : '#caa468',
        background: done ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : 'rgba(255,255,255,0.88)',
      }}
    >
      {fresh === ep.id && <span className="absolute -top-2 -right-1 rounded bg-[#e2453c] px-1 text-[10px] font-black text-white">NEW</span>}
      <span className="block text-xs font-black" style={{ color: 'var(--ink-2)' }}>
        {ep.order}. {ep.kana[0]}〜{ep.kana[ep.kana.length - 1]} {done ? '✓' : open ? '' : '🔒'}
      </span>
      <span className="block text-sm leading-[2] font-black">
        <KanaText known={known} mode="mask">
          {ep.title}
        </KanaText>
      </span>
      <span className="block text-[11px] font-bold" style={{ color: 'var(--ink-2)' }} lang="en">
        {ep.en}
      </span>
    </button>
  );
};

const readingOf = (ch: string): string => {
  const k = getKanjiByChar(ch);
  return k ? (kanjiRuby(k).match(/\((.+)\)/)?.[1] ?? ch) : ch;
};

export const MojiRouteMap = () => {
  useBgm('town');
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const setLastArc = useGameStore((s) => s.setLastArc);
  const cleared = useGameStore((s) => s.clearedStages);
  const progress = useGameStore((s) => s.progress);
  const streak = useGameStore((s) => s.streak);
  const known = useKnownKana();
  const owned = useOwnedKanji();
  const [params] = useSearchParams();
  const fresh = params.get('new');
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);
  // This screen is "home": つづきから, もどる and the end of every episode come back here.
  useEffect(() => setLastArc('moji'), [setLastArc]);

  const starsOfEpisode = (chars: string[]) => chars.reduce((n, ch) => n + starsOf(progress[getKanjiByChar(ch)?.id ?? '']?.reps ?? 0), 0);
  const groupOf = (episodeId: string): GroupId | null =>
    HIRAGANA_EPS.some((e) => e.id === episodeId) ? 'hiragana' : KATAKANA_EPS.some((e) => e.id === episodeId) ? 'katakana' : MOJI_EPISODES.some((e) => e.id === episodeId) ? 'n5' : null;

  // Arriving from つぎの 話へ (?new=): its sheet is already open.
  const [sheet, setSheet] = useState<GroupId | null>(() => (fresh ? groupOf(fresh) : null));
  const [record, setRecord] = useState(false);
  const [locked, setLocked] = useState<string | null>(null);
  useEffect(() => {
    if (!locked) return;
    const t = setTimeout(() => setLocked(null), 1800);
    return () => clearTimeout(t);
  }, [locked]);

  const cardStars: Record<GroupId, number> = useMemo(
    () => ({
      hiragana: thirds(HIRAGANA_EPS.filter((e) => cleared.includes(e.id)).length, HIRAGANA_EPS.length),
      katakana: thirds(KATAKANA_EPS.filter((e) => cleared.includes(e.id)).length, KATAKANA_EPS.length),
      n5: thirds(N5_KANJI.filter((c) => owned.has(c)).length, N5_KANJI.length),
      n4: 0,
      n3: 0,
    }),
    [cleared, owned],
  );

  /** つづき: the episode to play next (data/mojiFlow.ts), and its card, which gets the glow. */
  const startPath = useGameStore((s) => s.startPath);
  const next = nextUp(cleared, startPath);
  // The episode the つづき bubble points at: fetch its pictures while the player looks at the map.
  useEffect(() => {
    if (next) preloadImages(episodeArt(next));
  }, [next]);
  const nextGroup: GroupId = next ? (groupOf(next) ?? 'n5') : 'n5';
  const nextKana = next ? getKanaEpisode(next) : undefined;
  const nextMoji = next ? getMojiEpisode(next) : undefined;
  const playNext = () => {
    const to = continuePath(cleared, startPath, progress);
    if (to) navigate(to);
    else setSheet('n5');
  };

  const MENU: { label: string; cx: number; w: number; onClick: () => void }[] = [
    { label: 'ステージせんたく', cx: 14.2, w: 22, onClick: () => setSheet(null) },
    { label: 'もちもの', cx: 33.6, w: 16, onClick: () => navigate('/equip') },
    { label: 'ずかん', cx: 50, w: 16, onClick: () => navigate('/zukan') },
    { label: 'せいせき', cx: 68.4, w: 16, onClick: () => setRecord(true) },
    { label: 'せってい', cx: 86.4, w: 16, onClick: () => navigate('/settings') },
  ];

  const sheetTitle: Record<GroupId, ReactNode> = {
    hiragana: <KanaText known={known}>ひらがな</KanaText>,
    katakana: <KanaText known={known}>カタカナ</KanaText>,
    n5: <RubyText showFurigana={showFurigana}>N5 日本語(にほんご)の きほん</RubyText>,
    n4: 'N4',
    n3: 'N3',
  };

  const kanaTotal = KANA_EPISODES.reduce((n, e) => n + e.kana.length, 0);
  const masters = Object.values(progress).filter((p) => (p?.reps ?? 0) >= MASTERY_REPS[2]).length;
  const episodesCleared = [...KANA_EPISODES, ...MOJI_EPISODES].filter((e) => cleared.includes(e.id)).length;

  return (
    <div className="relative h-dvh overflow-hidden bg-[#1a1030]">
      {/* Wider than the column (PCs, tablets): the airport, soft, across the window. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-cover bg-center [@media(min-aspect-ratio:3/5)]:block"
        style={{ backgroundImage: `url(${art('bg_wide')})` }}
      />

      <div className="relative mx-auto h-full w-[min(100%,56dvh)] overflow-hidden [container-type:inline-size]">
        {/* 空港（夕方） — its city sits behind Nexmax, as in the example */}
        <img src={art('bg_tall')} alt="" aria-hidden className="absolute inset-x-0 w-full" style={{ top: cq(-170), aspectRatio: '941 / 1672' }} />

        {/* 上: 看板・案内・ネクマックス ------------------------------------------ */}
        <div className="absolute inset-x-0 top-[env(safe-area-inset-top)]">
          <DeparturesBoard showFurigana={showFurigana} />
          <TownSign />
          <h1 className="absolute" style={fromTop(160, 2, 620)}>
            <img src={art('sign')} alt="ステージせんたく　はじまりの空港" className="block h-auto w-full" />
          </h1>
          <p
            className="absolute text-center leading-[1.75] font-extrabold text-white"
            style={{ ...fromTop(336, 296, 330), ...MINCHO, fontSize: cq(26), textShadow: OUTLINE }}
          >
            <RubyText showFurigana={showFurigana}>ことばの翼(つばさ)で、</RubyText>
            <br />
            <RubyText showFurigana={showFurigana}>新(あたら)しい世界(せかい)へ飛(と)び立(た)とう！</RubyText>
          </p>
          <motion.img
            src={art('nexmax_travel')}
            alt=""
            aria-hidden
            className="absolute"
            style={{ ...fromTop(232, 430, 266), willChange: 'transform' }}
            animate={still ? undefined : { y: ['0%', '-1.5%', '0%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* つづき — Nexmax says where we go next; a tap plays it (08 §3.8) */}
          {!sheet && (
            <motion.button
              type="button"
              data-tap
              onClick={playNext}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute flex items-center gap-[1.6cqw] rounded-[2cqw] border-[0.4cqw] border-[#d4a04a] bg-[#fffaf0]/95 text-left text-[#2a1a0c]"
              style={{ ...fromTop(500, 548, 400), padding: `${cq(12)} ${cq(18)}`, boxShadow: '0 1cqw 3cqw rgba(0,0,0,0.45)' }}
            >
              <span aria-hidden className="absolute top-[38%] -left-[3.4%] h-0 w-0 border-y-[1.6cqw] border-r-[2.4cqw] border-y-transparent border-r-[#d4a04a]" />
              <span className="min-w-0 flex-1 leading-[1.6]">
                <span className="block font-black whitespace-nowrap" style={{ fontSize: cq(20), color: '#b0741a' }}>
                  <RubyText showFurigana={showFurigana}>
                    {nextKana
                      ? `つぎの 話(はなし) ・ かな ${nextKana.order}`
                      : nextMoji
                        ? `つぎの 話(はなし) ・ ${MOJI_CHAPTERS.find((c) => c.id === nextMoji.chapter)?.order ?? 1}章(しょう) ${nextMoji.order}話(わ)`
                        : 'つづきは じゅんび中(ちゅう)'}
                  </RubyText>
                </span>
                <span className="block truncate font-black" style={{ fontSize: cq(28) }}>
                  {nextKana ? (
                    <KanaText known={known} mode="mask">
                      {nextKana.title}
                    </KanaText>
                  ) : nextMoji ? (
                    <KanjiBackText owned={owned}>{nextMoji.title}</KanjiBackText>
                  ) : (
                    <RubyText showFurigana={showFurigana}>★を ふやそう</RubyText>
                  )}
                </span>
              </span>
              <span aria-hidden className="shrink-0 font-black text-[#e2453c]" style={{ fontSize: cq(34) }}>
                ▶
              </span>
            </motion.button>
          )}
        </div>

        {/* 下: 地図・カード・メニュー --------------------------------------------- */}
        <div className="absolute inset-x-0 bottom-[env(safe-area-inset-bottom)]" style={{ height: cq(BOTTOM_H) }}>
          <img src={art('map')} alt="" aria-hidden className="absolute" style={fromBottom(0, 790, 941, 882)} />

          {CARDS.map((c) => {
            const next = c.id === nextGroup && !sheet;
            return (
              <motion.button
                key={c.id}
                type="button"
                data-tap
                aria-label={c.locked ? `${c.id.toUpperCase()} じゅんびちゅう` : c.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => (c.locked ? setLocked('じゅんびちゅう') : setSheet(c.id))}
                className="absolute"
                style={fromBottom(c.x, c.y, CARD_W, CARD_H)}
              >
                {next && !still && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-[6%_4%_4%_4%] rounded-[8%]"
                    style={{ background: 'radial-gradient(ellipse closest-side, rgba(255,214,110,0.75), rgba(255,170,60,0.25) 60%, transparent)', willChange: 'opacity' }}
                    animate={{ opacity: [0.2, 0.9, 0.2] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <img src={art(c.img)} alt="" draggable={false} className="relative block h-full w-full select-none" />
                {c.stars?.cx.map((x, i) =>
                  i < cardStars[c.id] ? null : (
                    <GreyStar key={x} style={{ left: `${(x / 1536) * 100}%`, top: `${(c.stars!.cy / 1024) * 100}%`, width: `${(c.stars!.size / 1536) * 100}%` }} />
                  ),
                )}
              </motion.button>
            );
          })}

          {/* メニュー */}
          <div className="absolute" style={{ ...fromBottom(26, 1484, 890), aspectRatio: '1300 / 272' }}>
            <img src={art('menu')} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none" />
            {MENU.map((m) => (
              <button
                key={m.label}
                type="button"
                data-tap
                aria-label={m.label}
                aria-current={m.label === 'ステージせんたく' ? 'page' : undefined}
                onClick={m.onClick}
                className="absolute top-0 h-full -translate-x-1/2"
                style={{ left: `${m.cx}%`, width: `${m.w}%` }}
              >
              </button>
            ))}
          </div>

          {/* 話の 一覧 — over the map */}
          <AnimatePresence>
            {sheet && (
              <motion.section
                key={sheet}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                className="g-parchment absolute flex flex-col overflow-hidden !border-[#b8863f] px-3 pt-2 pb-3"
                style={{ ...fromBottom(24, 780, 893, 700), boxShadow: '0 1cqw 4cqw rgba(0,0,0,0.6)' }}
              >
                <div className="flex shrink-0 items-center justify-between gap-2">
                  <h2 className="text-xl leading-[2] font-black" style={{ color: 'var(--accent-2)' }}>
                    {sheet === 'n5' ? null : <RubyText showFurigana={showFurigana}>0章(しょう) はじまりの 空港(くうこう)</RubyText>} {sheetTitle[sheet]}
                  </h2>
                  <button type="button" data-tap onClick={() => setSheet(null)} className="g-btn g-btn-ghost !min-h-[36px] shrink-0 !px-3 text-sm">
                    ✕ <RubyText showFurigana={showFurigana}>とじる</RubyText>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {sheet === 'hiragana' || sheet === 'katakana' ? (
                    <>
                      <p className="mb-2 text-xs font-bold" style={{ color: 'var(--ink-2)' }} lang="en">
                        {sheet === 'hiragana'
                          ? 'The airport, the evening you land — before the train to Naniwa Town. Optional: if you can read kana, Chapter 1 does not need it.'
                          : 'The airport station, at dawn — the train to Naniwa Town.'}
                      </p>
                      <ol className="grid grid-cols-2 gap-2">
                        {(sheet === 'hiragana' ? HIRAGANA_EPS : KATAKANA_EPS).map((ep) => (
                          <li key={ep.id}>
                            <KanaEpisodeButton ep={ep} known={known} cleared={cleared} fresh={fresh} onOpen={() => navigate(`/kana/${ep.id}`)} />
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <ol className="flex flex-col gap-2">
                      {N5_CHAPTERS.map((c) => {
                        const ready = isChapterReady(c);
                        return (
                          <li key={c.id} className="rounded-xl border-2 border-[#caa468] bg-white/80 px-3 py-2" style={{ opacity: ready ? 1 : 0.8 }}>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-black">
                                <RubyText showFurigana={showFurigana}>{`${c.order}章(しょう) ${c.title}`}</RubyText>
                              </span>
                              <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: 'var(--ink-2)' }}>
                                <RubyText showFurigana={showFurigana}>{`${c.lessons.from}〜${c.lessons.to}課(か)`}</RubyText>
                              </span>
                            </div>
                            <p className="text-[13px] leading-[1.95]">
                              <RubyText showFurigana={showFurigana}>{c.summary}</RubyText>
                            </p>
                            {ready ? (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {episodesOf(c.id).map((ep) => {
                                  const open = isMojiEpisodeUnlocked(ep, cleared);
                                  const done = cleared.includes(ep.id);
                                  const stars = starsOfEpisode(ep.kanji);
                                  const max = ep.kanji.length * 3;
                                  return (
                                    <button
                                      key={ep.id}
                                      type="button"
                                      data-tap
                                      disabled={!open}
                                      onClick={() => navigate(episodePath(ep.id, cleared))}
                                      className="relative rounded-xl border-2 px-2 py-1.5 text-left disabled:opacity-50"
                                      style={{
                                        borderColor: fresh === ep.id ? '#e2453c' : done ? '#4f9a3c' : '#caa468',
                                        background: done ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : '#fff',
                                      }}
                                    >
                                      {fresh === ep.id && <span className="absolute -top-2 -right-1 rounded bg-[#e2453c] px-1 text-[10px] font-black text-white">NEW</span>}
                                      <span className="block text-xs font-black" style={{ color: 'var(--ink-2)' }}>
                                        <RubyText showFurigana={showFurigana}>{`${ep.order}話(わ) ${done ? '✓' : open ? '' : '🔒'}`}</RubyText>
                                      </span>
                                      <span className="block text-sm leading-[2] font-black">
                                        <KanjiBackText owned={owned}>{ep.title}</KanjiBackText>
                                      </span>
                                      <span className="block text-base font-black tracking-wider">
                                        <KanjiBackText owned={owned}>{ep.kanji.map((k) => `${k}(${readingOf(k)})`).join(' ')}</KanjiBackText>
                                      </span>
                                      <span className="mt-0.5 flex items-center gap-1 text-xs font-black tabular-nums" style={{ color: '#c98a0c' }}>
                                        ★ {stars}/{max}
                                        <span className="ml-auto h-1.5 w-12 overflow-hidden rounded-full bg-black/10">
                                          <span className="block h-full rounded-full bg-[#f2b53a]" style={{ width: `${(stars / max) * 100}%` }} />
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-xs font-black" style={{ color: 'var(--ink-3)' }}>
                                <RubyText showFurigana={showFurigana}>じゅんび中(ちゅう)</RubyText>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <div className="mt-3 flex items-center justify-center gap-4 text-sm font-black">
                    <button type="button" className="rounded-full border-2 border-[#caa468] bg-white/70 px-4 py-1" onClick={() => navigate('/prologue')} lang="en">
                      ▶ Prologue
                    </button>
                    {/* The picture-book worlds are closing (2026-09-30): kept reachable, but only as a quiet link. */}
                    <button type="button" className="px-2 py-1 text-[11px] font-bold text-[#5a4630]/70 underline underline-offset-2" onClick={() => navigate('/map')}>
                      <RubyText showFurigana={showFurigana}>ほかの 物語(ものがたり)</RubyText>
                    </button>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* じゅんびちゅう／まだ ひらいて いない */}
        <AnimatePresence>
          {locked && (
            <motion.p
              key={locked}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-[38%] mx-auto w-fit rounded-full border-2 border-[#d4a04a] bg-[#140c06]/90 px-4 py-1.5 text-sm font-black text-[#fff1cf]"
            >
              <RubyText showFurigana={showFurigana}>{locked}</RubyText>
            </motion.p>
          )}
        </AnimatePresence>

        {/* せいせき */}
        <AnimatePresence>
          {record && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 px-6"
              onClick={() => setRecord(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="g-parchment w-full max-w-sm px-5 py-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-center text-xl leading-[2] font-black" style={{ color: 'var(--accent-2)' }}>
                  せいせき
                </h2>
                <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm font-bold">
                  {(
                    [
                      ['書(か)ける かな', `${known.size} / ${kanaTotal}`],
                      ['手(て)に 入(い)れた 漢字(かんじ)（★1）', `${owned.size}`],
                      ['漢字(かんじ)マスター（★3）', `${masters}`],
                      ['クリアした 話(はなし)', `${episodesCleared} / ${KANA_EPISODES.length + MOJI_EPISODES.length}`],
                      ['毎日(まいにち) つづけた 日(ひ)', `${streak.count}`],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt>
                        <RubyText showFurigana={showFurigana}>{label}</RubyText>
                      </dt>
                      <dd className="text-right tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <button type="button" data-tap className="g-btn g-btn-primary mt-4 w-full" onClick={() => setRecord(false)}>
                  <RubyText showFurigana={showFurigana}>とじる</RubyText>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MojiRouteMap;
