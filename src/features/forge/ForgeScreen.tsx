import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSafeBack } from '../../lib/nav';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  GiAnvilImpact,
  GiBackpack,
  GiCardRandom,
  GiFlame,
  GiHexagonalNut,
  GiMetalBar,
  GiMoon,
  GiOpenBook,
  GiPadlock,
  GiStonePile,
  GiSun,
  GiThreeLeaves,
  GiWaterDrop,
} from 'react-icons/gi';
import type { IconType } from 'react-icons';
import { useGameStore } from '../../store/gameStore';
import { ALL_KANJI } from '../../lib/kanjiDb';
import { forgeWeapon, type Weapon } from '../../lib/forge/weapon';
import { Element, ELEMENT_LABEL, elementOf } from '../../lib/forge/elements';
import { charRuby, kanjiRuby } from '../../lib/reading';
import { assetPath } from '../../lib/assetPath';
import { RubyText } from '../../components/ui/Ruby';
import { LogoText } from '../../components/ui/LogoText';
import type { KanjiData } from '../../types/kanji';
import { GameIcon } from '../../components/ui/GameIcon';
import ForgeTutorial from './ForgeTutorial';
import { remainingForChar, FoundVia, discoveryKind, KIND_LABEL } from '../../lib/forge/discovery';
import { REPS_TO_OBTAIN } from '../../types/kanji';
import { Feature, isFeatureUnlocked } from '../../data/unlocks';
import { isForgeOpen, practiceTarget } from '../../data/mojiFlow';
import { useBgm } from '../../lib/bgm';
import { useCompoundsVersion } from '../../data/compounds';

/**
 * The forge — 漢字やさん (the layout example delivered with the parts,
 * art-src/kanjiyasan/00_配置例_漢字やさん.png): the workshop opening onto the
 * city, Nexmax at the anvil, the card of what the chosen kanji make, the
 * chosen kanji, the kanji you own in tabs, and つくる.
 *
 * Pick two or three owned kanji; see what they make before committing. The
 * preview is the teaching surface: it tells the learner *while they are
 * choosing* whether the combination is a real word, and what it means. The
 * card's own rows are too small on a phone for a sentence, so that line sits
 * under the chosen kanji instead.
 *
 * The pictures are made web-sized by scripts/prepare_ui_assets.mjs. The card
 * frame keeps its whole canvas, so the name, stars and rows are placed by
 * fractions of it (measured from the picture).
 */

const art = (name: string) => assetPath(`img/kanjiyasan/${name}.webp`);

const ELEMENT_ICON: Record<Element, IconType> = {
  KA: GiFlame,
  SUI: GiWaterDrop,
  MOKU: GiThreeLeaves,
  KIN: GiMetalBar,
  DO: GiStonePile,
  KOU: GiSun,
  AN: GiMoon,
  MU: GiHexagonalNut,
};

/**
 * The tabs of the example, laid over the elements. 光・空 is named for what
 * is in it (光 is light, sky, time): rain and snow are 水, and a tab called
 * 天気 without them would be wrong.
 */
type Tab = 'all' | 'nature' | 'power' | 'sky' | 'other';
const TABS: { id: Tab; label: string; icon?: IconType; color?: string; elements?: Element[] }[] = [
  { id: 'all', label: '持(も)っている漢字(かんじ)' },
  { id: 'nature', label: '自然(しぜん)', icon: GiThreeLeaves, color: '#6fd27c', elements: [Element.MOKU, Element.SUI, Element.DO] },
  { id: 'power', label: '力(ちから)', icon: GiFlame, color: '#ff7a45', elements: [Element.KA, Element.KIN] },
  { id: 'sky', label: '光(ひかり)・空(そら)', icon: GiSun, color: '#ffd45e', elements: [Element.KOU] },
  { id: 'other', label: 'その他(た)', icon: GiCardRandom, color: '#d9c7a4', elements: [Element.AN, Element.MU] },
];

/** 木(き) → き */
const readingOf = (k: KanjiData) => /\(([^)]*)\)/.exec(kanjiRuby(k))?.[1] ?? '';

// Card frame geometry, in % of the card (measured from card_frame.webp).
const STAR_X = [35.6, 42.8, 50, 57.2, 64.4];

const Star = ({ lit, x }: { lit: boolean; x: number }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden
    className="absolute w-[6.6%] -translate-x-1/2 -translate-y-1/2"
    style={{ left: `${x}%`, top: '61.4%', opacity: lit ? 1 : 0 }}
  >
    <path
      d="M12 2.2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.2l-6 3.3 1.3-6.7-5-4.6 6.8-.8z"
      fill="#ffd24a"
      stroke="#7a4200"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

/** The weapon card: the frame picture, with what the kanji make laid into it. */
const WeaponCard = ({ weapon, showFurigana }: { weapon: Weapon | null; showFurigana: boolean }) => {
  const el = weapon ? ELEMENT_LABEL[weapon.element] : null;
  const ElIcon = weapon ? ELEMENT_ICON[weapon.element] : null;
  return (
    <div className="relative aspect-[2/3] w-full text-[#fff1cf] [container-type:inline-size]">
      {/* Behind the frame's open window: the weapon on a glow of its element. */}
      <div
        className="absolute top-[5%] right-[14%] bottom-[51%] left-[14%] flex items-center justify-center overflow-hidden"
        style={{
          background: el
            ? `radial-gradient(circle at 50% 50%, ${el.color}cc 0%, ${el.color}44 38%, rgba(18,12,24,0.92) 72%)`
            : 'radial-gradient(circle, rgba(70,50,30,0.7) 0%, rgba(18,12,24,0.92) 70%)',
        }}
      >
        {weapon ? (
          <span className="h-[72%] w-[72%] -rotate-12 text-[#fff8e2]">
            <GameIcon name={weapon.icon} className="h-full w-full" />
          </span>
        ) : (
          <span className="text-[26cqw] font-black text-white/25">？</span>
        )}
      </div>
      <img src={art('card_frame')} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none" />

      {/* 名前 */}
      <p className="absolute top-[50.2%] right-[15%] left-[15%] flex h-[7.2%] items-center justify-center gap-[3%] text-[7.6cqw] leading-none font-black whitespace-nowrap">
        {ElIcon && <ElIcon aria-hidden className="h-[1.1em] w-[1.1em] shrink-0" style={{ color: el!.color }} />}
        {weapon ? <RubyText showFurigana={showFurigana}>{weapon.name}</RubyText> : <span className="text-white/40">？？？</span>}
      </p>

      {/* ★ */}
      {STAR_X.map((x, i) => (
        <Star key={x} x={x} lit={weapon ? i < weapon.rarity : false} />
      ))}

      {/* こうげき */}
      <p className="absolute top-[66.2%] right-[14%] left-[25%] flex h-[4.6%] items-center justify-between leading-none">
        <span className="text-[5.8cqw] font-bold text-[#e9cf9a]">こうげき</span>
        <span className="text-[8cqw] font-black tabular-nums">{weapon ? weapon.attack : '—'}</span>
      </p>

      {/* とくせい: the element's icon in the circle the frame keeps empty for it */}
      <span className="absolute top-[73%] left-[12.9%] flex h-[5.4%] w-[8.2%] items-center justify-center">
        {ElIcon && <ElIcon aria-hidden className="h-[70%] w-[70%]" style={{ color: el!.color }} />}
      </span>
      <p className="absolute top-[73.3%] right-[14%] left-[25%] flex h-[4.6%] items-center justify-between leading-none">
        <span className="text-[5.8cqw] font-bold text-[#e9cf9a]">とくせい</span>
        <span className="text-[7cqw] font-black">
          {el ? <RubyText showFurigana={showFurigana}>{`${el.ja}(${el.reading})の 力(ちから)`}</RubyText> : '—'}
        </span>
      </p>

      {/* 言葉なら、その 言葉（意味は カードの 外で 言う） */}
      <div className="absolute top-[80.6%] right-[14%] bottom-[8.8%] left-[14%] flex items-center justify-center text-center leading-tight">
        {weapon?.compound ? (
          <span className="text-[9cqw] font-black text-[#ffd86a]">
            <RubyText showFurigana={showFurigana}>{`${weapon.compound.word}(${weapon.compound.reading})`}</RubyText>
          </span>
        ) : weapon ? (
          <span className="text-[5.8cqw] text-white/60">
            <RubyText showFurigana={showFurigana}>言葉(ことば)では ない</RubyText>
          </span>
        ) : null}
      </div>
    </div>
  );
};

/** One of the chosen kanji (or the result) in the small parchment frame. */
const Slot = ({ children, reading, onClick, label }: { children: ReactNode; reading?: string; onClick?: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    aria-label={label}
    className="relative aspect-square w-full [container-type:inline-size] disabled:cursor-default"
  >
    <img src={art('kanji_frame')} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none" />
    <span className="absolute top-[15%] right-[18%] bottom-[33%] left-[18%] flex items-center justify-center text-[42cqw] leading-none font-black text-[#3b2208]">
      {children}
    </span>
    {reading && (
      <span className="absolute top-[74%] right-[15%] bottom-[14%] left-[15%] flex items-center justify-center text-[15cqw] leading-none font-bold text-[#ffe9b8]">
        {reading}
      </span>
    )}
  </button>
);

const RoundButton = ({ icon: Icon, label, onClick, locked, showFurigana }: { icon: IconType; label: string; onClick: () => void; locked?: boolean; showFurigana: boolean }) => (
  <motion.button
    type="button"
    data-tap
    disabled={locked}
    whileTap={locked ? undefined : { scale: 0.92 }}
    onClick={onClick}
    className="flex w-[11.5%] flex-col items-center gap-0.5 disabled:opacity-60"
  >
    <span
      className="flex aspect-square w-full items-center justify-center rounded-full border-[3px] border-[#d7a24a] text-[#ffe7b0]"
      style={{ background: 'radial-gradient(circle at 50% 35%, #5a3a22 0%, #2a180c 75%)', boxShadow: '0 3px 0 #1a0e05, inset 0 2px 0 rgba(255,220,160,0.25)' }}
    >
      {locked ? <GiPadlock aria-hidden className="h-1/2 w-1/2" /> : <Icon aria-hidden className="h-1/2 w-1/2" />}
    </span>
    <span className="text-[11px] leading-tight font-black whitespace-nowrap text-[#fff1cf] [text-shadow:0_1px_2px_#000]">
      <RubyText showFurigana={showFurigana}>{label}</RubyText>
    </span>
  </motion.button>
);

export const ForgeScreen = () => {
  useBgm('shop');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // もどる goes back where the player came from (08 §3.8): `?back=` when the
  // caller names it (じゅんび, StagePlayer), else history; the map only when
  // the forge was opened directly.
  const backTo = params.get('back');
  const safeBack = useSafeBack();
  const goBack = () => (backTo ? navigate(backTo) : safeBack());
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const weapons = useGameStore((s) => s.weapons);
  const craftWeapon = useGameStore((s) => s.craftWeapon);
  const equipWeapon = useGameStore((s) => s.equipWeapon);
  const sumi = useGameStore((s) => s.sumi);
  const spendSumi = useGameStore((s) => s.spendSumi);
  const tryCost = useGameStore((s) => s.tryCost);
  const foundWords = useGameStore((s) => s.foundWords);
  const recordFound = useGameStore((s) => s.recordFound);
  const recordMiss = useGameStore((s) => s.recordMiss);
  const cleared = useGameStore((s) => s.clearedStages);
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);

  const [slots, setSlots] = useState<KanjiData[]>([]);
  const [made, setMade] = useState<Weapon | null>(null);
  /** Set when the craft just revealed a word for the first time. */
  const [discovered, setDiscovered] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');

  const owned = useMemo(
    () =>
      ALL_KANJI.filter((k) => progress[k.id]?.obtainedAt != null).sort(
        (a, b) => (progress[b.id]!.obtainedAt ?? 0) - (progress[a.id]!.obtainedAt ?? 0),
      ),
    [progress],
  );
  const shown = useMemo(() => {
    const els = TABS.find((t) => t.id === tab)?.elements;
    return els ? owned.filter((k) => els.includes(elementOf(k))) : owned;
  }, [owned, tab]);

  const ownedChars = useMemo(
    () => new Set(ALL_KANJI.filter((k) => (progress[k.id]?.reps ?? 0) >= REPS_TO_OBTAIN).map((k) => k.char)),
    [progress],
  );
  const foundSet = useMemo(() => new Set(Object.keys(foundWords)), [foundWords]);

  // The forge's words beyond the core arrive just after start (data/compounds.ts): read again then.
  const wordsV = useCompoundsVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useMemo(() => (slots.length >= 2 ? forgeWeapon(slots) : null), [slots, wordsV]);
  /** A word already found costs nothing to remake. */
  const previewKnown = preview ? Boolean(foundWords[preview.word]) : false;
  const cost = preview && !previewKnown ? tryCost(slots.length) : 0;
  const canAfford = sumi >= cost;
  const alreadyMade = preview ? weapons.some((w) => w.id === preview.id) : false;
  const canCraft = Boolean(preview) && !alreadyMade && canAfford;

  const toggle = (k: KanjiData) => {
    setMade(null);
    setSlots((s) => {
      const at = s.findIndex((x) => x.id === k.id);
      if (at !== -1) return s.filter((x) => x.id !== k.id);
      if (s.length >= 3) return s;
      return [...s, k];
    });
  };

  const craft = () => {
    if (!preview || alreadyMade || !canAfford) return;
    // Ink is spent on the attempt, not the result: a guess costs the same
    // whether it lands or not, which is what makes thinking first worthwhile.
    if (cost > 0 && !spendSumi(cost)) return;

    const recipe = craftWeapon(slots.map((k) => k.id));
    if (!recipe) return;

    if (preview.compound && !foundWords[preview.word]) {
      recordFound(preview.word, FoundVia.LUCKY);
      setDiscovered(preview.word);
    } else {
      if (!preview.compound) recordMiss(preview.word);
      setDiscovered(null);
    }

    setMade(preview);
    equipWeapon(recipe.id);
  };

  // Two frames to start with; a third, optional one once both are filled.
  const slotCount = slots.length >= 2 ? 3 : 2;
  // ことば図鑑 opens with the forge on the new route (08 §3.8).
  const wordsLocked = !isFeatureUnlocked(Feature.WORDS, cleared) && !isForgeOpen(cleared);
  // An empty forge says where the nearest ★3 is (data/mojiFlow.ts).
  const practice = owned.length === 0 ? practiceTarget(progress, cleared) : null;

  return (
    <div className="relative h-dvh overflow-hidden bg-[#2b1a10] text-[#fff1cf]">
      <picture>
        <source media="(orientation: landscape)" srcSet={art('bg_wide')} />
        <img src={art('bg_tall')} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      </picture>
      <ForgeTutorial />

      <div className="relative mx-auto flex h-full w-[min(100%,56dvh)] flex-col px-[3%] pt-[max(1.2dvh,env(safe-area-inset-top))] pb-[max(1.2dvh,env(safe-area-inset-bottom))]">
        {/* 看板 ---------------------------------------------------------- */}
        <header className="relative mx-auto w-[80%] shrink-0 text-center">
          <div
            className="rounded-[12px] border-[3px] border-[#d9a44c] px-[5%] pt-[1.5%] pb-[0.5%] shadow-[0_6px_16px_rgba(0,0,0,0.55)]"
            style={{ background: 'repeating-linear-gradient(178deg, rgba(255,255,255,0.04) 0 3px, rgba(0,0,0,0.06) 3px 7px), linear-gradient(180deg, #6e4727 0%, #3c2413 100%)' }}
          >
            <h1 className="flex items-center justify-center gap-[3%]">
              <LogoText showFurigana={showFurigana} className="text-[min(8.4vw,4.6dvh)] leading-[1.45]">
                漢字(かんじ)やさん
              </LogoText>
              <GiAnvilImpact aria-hidden className="h-[min(8vw,4.4dvh)] w-[min(8vw,4.4dvh)] shrink-0 text-[#ffe2a0]" />
            </h1>
          </div>
          <p className="mx-auto w-[82%] rounded-b-[10px] border-2 border-t-0 border-[#b8863f] bg-[#2a190c]/95 px-2 py-0.5 text-[12px] leading-[1.9] font-black text-[#ffe9b8]">
            <RubyText showFurigana={showFurigana}>取(と)り戻(もど)した 漢字(かんじ)に 新(あたら)しい 力(ちから)を！</RubyText>
          </p>
        </header>

        {/* ネクマックス・えらんだ 漢字・カード ------------------------------ */}
        <div className="flex min-h-0 flex-1 items-end gap-[2%] pt-[1.5%]">
          <div className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <div className="relative -mb-[4%] min-h-0 flex-1">
              <motion.img
                src={art('nexmax_smith')}
                alt=""
                aria-hidden
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain object-[left_bottom] select-none"
                style={{ willChange: 'transform' }}
                animate={still ? undefined : { rotate: [0, -2.5, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <section
              className="relative z-10 rounded-[14px] border-2 border-[#c8913e] px-[5%] pt-[7%] pb-[4%] shadow-[0_6px_14px_rgba(0,0,0,0.5)]"
              style={{ background: 'linear-gradient(180deg, rgba(62,38,20,0.95) 0%, rgba(30,18,9,0.95) 100%)' }}
            >
              <span className="absolute -top-[0.95em] left-1/2 -translate-x-1/2 rounded-md border border-[#c8913e] bg-[#3a2414] px-2.5 text-[11px] leading-[1.9] font-black whitespace-nowrap text-[#ffe7a8]">
                <RubyText showFurigana={showFurigana}>えらんだ 漢字(かんじ)</RubyText>
              </span>
              <div className="flex items-center gap-[2%]">
                {/* Frames and signs are siblings, so every frame gets the same width. */}
                {Array.from({ length: slotCount }, (_, i) => {
                  const k = slots[i];
                  // The third frame is optional: shown faint until it is used.
                  const optional = i === 2 && !k;
                  return [
                    i > 0 && (
                      <span key={`plus${i}`} aria-hidden className={`shrink-0 text-[14px] font-black text-[#ffd86a] ${optional ? 'opacity-55' : ''}`}>
                        ＋
                      </span>
                    ),
                    <div key={i} className={`min-w-0 flex-1 ${optional ? 'opacity-55' : ''}`}>
                      <Slot
                        label={k ? `${k.char} を はずす` : `${i + 1}つめ`}
                        onClick={k ? () => toggle(k) : undefined}
                        reading={k && showFurigana ? readingOf(k) : undefined}
                      >
                        {k ? k.char : <span className="text-[#3b2208]/30">{optional ? '＋' : '？'}</span>}
                      </Slot>
                    </div>,
                  ];
                })}
                <span aria-hidden className="shrink-0 text-[14px] font-black text-[#ffd86a]">
                  ▶
                </span>
                <div className="min-w-0 flex-1">
                  <Slot label={preview ? preview.plainName : 'できる もの'}>
                    {preview ? (
                      <span className="h-[80%] w-[80%]" style={{ color: ELEMENT_LABEL[preview.element].color }}>
                        <GameIcon name={preview.icon} className="h-full w-full" />
                      </span>
                    ) : (
                      <span className="text-[#3b2208]/30">？</span>
                    )}
                  </Slot>
                </div>
              </div>

              {/* 熟語かどうかを、はっきり 言う */}
              <p className="mt-[3%] text-center text-[11px] leading-[1.9] font-bold [word-break:keep-all]">
                {!preview ? (
                  <RubyText showFurigana={showFurigana}>漢字(かんじ)を 2〜3つ。じゅんばんで ちがう 武器(ぶき)に なります。</RubyText>
                ) : preview.compound ? (
                  <span className="text-[#ffd86a]">
                    <RubyText showFurigana={showFurigana}>本当(ほんとう)に ある 言葉(ことば)！</RubyText>{' '}
                    <RubyText showFurigana={showFurigana}>{`${preview.compound.word}(${preview.compound.reading})`}</RubyText>
                  </span>
                ) : (
                  <RubyText showFurigana={showFurigana}>言葉(ことば)には なりません。作(つく)れますが、弱(よわ)いです。</RubyText>
                )}
              </p>
              {preview && (alreadyMade || !canAfford) && (
                <p className="text-center text-[11px] leading-[1.9] font-bold text-[#ff9f7a] [word-break:keep-all]">
                  {alreadyMade ? (
                    <RubyText showFurigana={showFurigana}>もう 持(も)って います</RubyText>
                  ) : (
                    <RubyText showFurigana={showFurigana}>{`すみが たりません（🖌${cost} 要(い)ります）`}</RubyText>
                  )}
                </p>
              )}
            </section>
          </div>

          <div className="flex w-[48%] shrink-0 flex-col items-end gap-1.5">
            <div className="flex gap-1.5 text-[11px] font-black">
              <span className="rounded-full border border-[#c8913e]/80 bg-black/50 px-2 py-0.5 tabular-nums">
                {owned.length} <RubyText showFurigana={showFurigana}>字(じ)</RubyText>
              </span>
              <span className="rounded-full border border-[#c8913e]/80 bg-black/50 px-2 py-0.5 tabular-nums" title="すみ">
                <span aria-hidden>🖌</span> {sumi}
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={preview?.id ?? 'none'}
                className="w-full"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <WeaponCard weapon={preview} showFurigana={showFurigana} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* 持っている 漢字 ------------------------------------------------ */}
        <div className="mt-[2.5%] shrink-0">
          <div role="tablist" className="flex gap-[1%]">
            {TABS.map((t) => {
              const on = t.id === tab;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.id)}
                  className={`flex min-h-[34px] items-center justify-center gap-0.5 rounded-t-[10px] border-2 border-b-0 px-1 text-[11px] leading-tight font-black whitespace-nowrap ${t.id === 'all' ? 'flex-[1.6]' : 'flex-1'}`}
                  style={{
                    background: on ? 'linear-gradient(180deg, #fbeecd 0%, #e8cf98 100%)' : 'linear-gradient(180deg, #3f2715 0%, #26170b 100%)',
                    borderColor: '#c8913e',
                    color: on ? '#4a2a0c' : '#ffe9b8',
                  }}
                >
                  {Icon && <Icon aria-hidden className="h-[15px] w-[15px] shrink-0" style={{ color: t.color }} />}
                  <RubyText showFurigana={showFurigana}>{t.label}</RubyText>
                </button>
              );
            })}
          </div>
          <div
            className="h-[min(34vw,19dvh)] overflow-y-auto rounded-b-[14px] border-2 border-[#c8913e] p-[2.2%]"
            style={{ background: 'linear-gradient(180deg, rgba(40,24,12,0.95) 0%, rgba(24,14,7,0.95) 100%)' }}
          >
            {owned.length === 0 ? (
              <p className="p-3 text-center text-sm">
                <RubyText showFurigana={showFurigana}>
                  10回(かい) 書(か)いた 漢字(かんじ)（★3）が ここに ならびます。まだ ありません。
                </RubyText>
                {practice && (
                  <button
                    type="button"
                    data-tap
                    className="g-btn g-btn-accent mx-auto mt-2 !min-h-[38px] !px-3 text-xs"
                    onClick={() => navigate(`/moji/${practice.episode}?at=ready`)}
                  >
                    <RubyText showFurigana={showFurigana}>{`✎ 書(か)きに いく（「${charRuby(practice.char)}」あと ${practice.left}回(かい)で ★3）`}</RubyText>
                  </button>
                )}
              </p>
            ) : shown.length === 0 ? (
              <p className="p-3 text-center text-sm text-white/70">
                <RubyText showFurigana={showFurigana}>この なかまの 漢字(かんじ)は まだ ありません。</RubyText>
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-[1.6%]">
                {shown.map((k) => {
                  const at = slots.findIndex((s) => s.id === k.id);
                  const picked = at !== -1;
                  const el = ELEMENT_LABEL[elementOf(k)];
                  // How many words using this character are still unfound —
                  // the "there is more in here" signal that makes a character
                  // worth returning to.
                  const left = remainingForChar(k.char, ownedChars, foundSet);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      data-tap
                      onClick={() => toggle(k)}
                      aria-pressed={picked}
                      aria-label={left > 0 ? `${k.char}（のこり ${left} 語）` : k.char}
                      className="relative flex aspect-square items-center justify-center rounded-[10px] border-2 text-[clamp(16px,5.4vw,26px)] font-black transition-transform [container-type:inline-size] active:scale-95"
                      style={{
                        background: `radial-gradient(circle at 50% 38%, color-mix(in srgb, ${el.color} 30%, #fffdf4) 0%, color-mix(in srgb, ${el.color} 75%, #fff) 55%, color-mix(in srgb, ${el.color} 70%, #1a0f06) 100%)`,
                        borderColor: picked ? '#fff3b0' : '#c8913e',
                        color: `color-mix(in srgb, ${el.color} 38%, #140b04)`,
                        boxShadow: picked ? '0 0 0 2px #ffd24a, 0 0 12px rgba(255,210,90,0.95)' : 'inset 0 -3px 0 rgba(0,0,0,0.22)',
                        textShadow: '0 0 2px #fff, 0 0 5px rgba(255,255,255,0.85)',
                      }}
                    >
                      <RubyText showFurigana={showFurigana}>{kanjiRuby(k)}</RubyText>
                      {picked && (
                        <span className="absolute -top-1.5 -left-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#fff3b0] bg-[#e2453c] text-[11px] leading-none text-white [text-shadow:none]">
                          {at + 1}
                        </span>
                      )}
                      {left > 0 && (
                        <span className="absolute right-[3%] bottom-[3%] rounded-full bg-black/70 px-1 text-[10px] leading-[1.35] text-[#ffd86a] tabular-nums [text-shadow:none]">
                          {left > 9 ? '9+' : left}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* もどる・つくる・図鑑・持ちもの -------------------------------------- */}
        <div className="mt-[2.5%] flex shrink-0 items-center justify-between">
          <motion.button type="button" data-tap whileTap={{ scale: 0.95 }} className="w-[30%]" onClick={goBack}>
            <img src={art('btn_back')} alt="もどる" draggable={false} className="block h-auto w-full select-none" />
          </motion.button>
          <motion.button
            type="button"
            data-tap
            disabled={!canCraft}
            whileTap={canCraft ? { scale: 0.95 } : undefined}
            className="relative w-[44%] disabled:opacity-50 disabled:grayscale"
            onClick={craft}
          >
            <img src={art('btn_make')} alt={cost > 0 ? `ためす（すみ ${cost}）` : 'つくる'} draggable={false} className="block h-auto w-full select-none" />
            {canCraft && cost > 0 && (
              <span className="absolute -top-1 right-[4%] rounded-full border border-[#fff3b0] bg-[#2a190c] px-1.5 text-[11px] leading-[1.5] font-black text-[#ffe9b8]">
                🖌{cost}
              </span>
            )}
          </motion.button>
          <RoundButton icon={GiOpenBook} label="図鑑(ずかん)" locked={wordsLocked} onClick={() => navigate('/words')} showFurigana={showFurigana} />
          <RoundButton icon={GiBackpack} label="持(も)ちもの" onClick={() => navigate('/equip')} showFurigana={showFurigana} />
        </div>
      </div>

      {/* できた --------------------------------------------------------- */}
      <AnimatePresence>
        {made && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-black/70 px-6"
            onClick={() => {
              setMade(null);
              setSlots([]);
            }}
          >
            <p className="rounded-full border-2 border-[#ffd86a] bg-[#3a2414] px-4 text-sm leading-[2] font-black text-[#ffd86a]">
              {discovered ? (
                <RubyText showFurigana={showFurigana}>{KIND_LABEL[discoveryKind(discovered, ownedChars, foundSet)]}</RubyText>
              ) : (
                'できた！'
              )}
            </p>
            <motion.div
              initial={{ scale: 0.8, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              className="w-[min(70vw,300px,34dvh)]"
            >
              <WeaponCard weapon={made} showFurigana={showFurigana} />
            </motion.div>
            <p className="max-w-[300px] text-center text-sm leading-[1.9] font-bold text-[#fff1cf]">
              <RubyText showFurigana={showFurigana}>{made.blurb}</RubyText>
            </p>
            <p className="text-xs text-white/70">
              <RubyText showFurigana={showFurigana}>そうびしました。タップで とじる</RubyText>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgeScreen;
