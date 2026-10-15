import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { NaniwaBattleView, type SealView } from '../battle/NaniwaBattleView';
import { KANA_LENIENCY, ROMAJI } from '../../data/kana';
import { kanaToWrite, type KanaWord } from '../../data/kanaWords';
import { KANA_HERO, nextWord, stageOf, wordDamage, type KanaFight, type KanaScript } from '../../data/kanaBattle';
import { sealFloor, strikeSealed } from '../../lib/seals';
import { speak, stopSpeaking } from '../../lib/speech';
import { assetPath } from '../../lib/assetPath';
import { useBgm, playJingle } from '../../lib/bgm';
import * as sfx from '../../lib/sfx';
import { useStill } from '../../hooks/useStill';
import { useGameStore } from '../../store/gameStore';
import { useQuiet } from '../../store/uiStore';
import { RubyText } from '../../components/ui/Ruby';
import type { KanjiData } from '../../types/kanji';
import KanaText from './KanaText';
import type { KanaWeapon } from '../../data/kanaWeapons';
import { useKnownKana } from './useKnownKana';

/**
 * 0章の たたかい「きいて かく」 (docs/design/22 §4, 2026-10-15「ひらがなの時も敵キャラクターを作って
 * 戦わせて。イメージは添付」): the shadow says a word — its sound, its meaning in
 * English, a box for each kana with its romaji, and a ？ where its picture
 * will be. The player writes the kana one by one; each fills its box; the
 * whole word strikes and its picture comes out. Three slips on the board and
 * the shadow strikes back. It holds its kana sealed (lib/seals.ts) and asks
 * them first; it cannot fall before each has been written.
 *
 * On the town's battle stage (NaniwaBattleView), with Nexmax in his ★1 / ★2
 * battle picture. 0章 shows kana only: the names carry romaji until their
 * kana are written, and the lines are pictures and numbers.
 */

const W = 941;
/** A length on the 941-wide design canvas, in the column's container units. */
const cq = (n: number) => `${(n * 100) / W}cqw`;

interface Props {
  fight: KanaFight;
  script: KanaScript;
  /** The place behind (a scene id). */
  field: string;
  /** The kana weapon carried (かなの かじや): its power times every blow, its picture beside Nexmax. */
  weapon?: KanaWeapon | null;
  onWin: () => void;
  onFlee: () => void;
}

/** One written kana of the current word: its slips, and whether the stroke order was looked at. */
interface Written {
  mistakes: number;
  hinted: boolean;
}

/** The kana as the board's target (NaniwaBattleView reads a KanjiData; the panel is ours). */
const asTarget = (kana: string, en: string): KanjiData => ({
  id: `kana_${kana}`,
  char: kana,
  level: 'N5',
  on: [],
  kun: [ROMAJI[kana] ?? ''],
  meanings: [en],
  strokes: 1,
  tags: [],
});

/** The word to write: its picture box, its meaning, and a box for each kana (the written ones filled). */
const WordPanel = ({ word, pos, written, solved, still }: { word: KanaWord; pos: number; written: Written[]; solved: boolean; still: boolean }) => {
  let k = 0;
  // The boxes as big as the strip allows: short words get big boxes.
  const n = [...word.kana].length;
  const cell = n <= 3 ? 96 : n <= 4 ? 84 : n <= 5 ? 70 : n <= 6 ? 60 : 50;
  const cells = [...word.kana].map((c, i) => {
    if (c === ' ') return <span key={i} style={{ width: cq(14) }} />;
    if (c === 'ー')
      return (
        <span key={i} className="flex items-center justify-center rounded-[1cqw] border-[0.3cqw] border-[#b6a08a] bg-[#efe3c6] font-black text-[#24180d]" style={{ width: cq(cell), height: cq(cell * 1.12), fontSize: cq(cell * 0.62) }}>
          ー
        </span>
      );
    const at = k++;
    const done = at < pos || solved;
    const now = at === pos && !solved;
    const slip = written[at]?.mistakes ?? 0;
    return (
      <motion.span
        key={i}
        className="relative flex flex-col items-center justify-center rounded-[1cqw] border-[0.4cqw] font-black"
        style={{
          width: cq(cell),
          height: cq(cell * 1.12),
          background: done ? (slip === 0 ? 'linear-gradient(180deg,#fff8d6,#f2d27a)' : 'linear-gradient(180deg,#fffaf0,#efe3c6)') : 'rgba(255,255,255,0.55)',
          borderColor: now ? '#2f8fe0' : done ? '#c9973f' : '#b6a08a',
          borderStyle: done || now ? 'solid' : 'dashed',
          boxShadow: now ? `0 0 ${cq(16)} rgba(47,143,224,0.75)` : undefined,
        }}
        animate={now && !still ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={now ? { duration: 1.2, repeat: Infinity } : undefined}
      >
        {done ? (
          <span className="leading-none text-[#24180d]" style={{ fontSize: cq(cell * 0.72) }}>
            {c}
          </span>
        ) : (
          <span lang="en" className="leading-none font-black text-[#6b5a48]" style={{ fontSize: cq(cell * 0.36), fontFamily: 'var(--font-body)' }}>
            {ROMAJI[c] ?? c}
          </span>
        )}
      </motion.span>
    );
  });
  return (
    <div className="absolute inset-0 flex items-center gap-[1.6cqw] px-[1.6cqw]" aria-label={solved ? word.kana : word.en}>
      {/* the picture: ？ until the word is written */}
      <div
        className="flex shrink-0 items-center justify-center rounded-[1.4cqw] border-[0.5cqw]"
        style={{ width: cq(140), height: cq(140), background: solved ? 'linear-gradient(180deg,#fff8d6,#f7e3a0)' : 'rgba(255,255,255,0.6)', borderColor: solved ? '#f2c45a' : '#b6a08a' }}
      >
        <AnimatePresence mode="wait">
          {solved ? (
            <motion.span key="pic" style={{ fontSize: cq(84) }} className="leading-none" initial={still ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 12 }}>
              {word.emoji}
            </motion.span>
          ) : (
            <motion.span key="q" className="leading-none font-black text-[#b6a08a]" style={{ fontSize: cq(76) }}>
              ？
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[1cqw]">
        <p lang="en" className="w-full truncate leading-none font-black tracking-wide text-[#173f78] uppercase" style={{ fontSize: cq(word.en.length > 16 ? 26 : word.en.length > 10 ? 32 : 40), fontFamily: 'var(--font-body)' }}>
          {word.en}
        </p>
        <div className="flex items-center gap-[0.8cqw]">{cells}</div>
      </div>
    </div>
  );
};

export const KanaBattle = ({ fight, script, field, weapon = null, onWin, onFlee }: Props) => {
  useBgm('boss');
  useQuiet();
  const still = useStill();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const recordKanaRep = useGameStore((s) => s.recordKanaRep);
  const tipsSeen = useGameStore((s) => s.tipsSeen);
  const markTipSeen = useGameStore((s) => s.markTipSeen);
  const known = useKnownKana();
  const hero = KANA_HERO[script];
  const { foe } = fight;

  const writerRef = useRef<KanjiWriterHandle>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const enemyRef = useRef<HTMLDivElement>(null);
  const heroCtl = useAnimationControls();
  const enemyCtl = useAnimationControls();
  const fieldCtl = useAnimationControls();

  const [myHp, setMyHp] = useState(hero.hp);
  const [foeHp, setFoeHp] = useState(foe.hp);
  const foeHpRef = useRef(foe.hp);
  const myHpRef = useRef(hero.hp);
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [word, setWord] = useState<KanaWord>(() => nextWord(fight, new Set(), null));
  const [pos, setPos] = useState(0);
  const [written, setWritten] = useState<Written[]>([]);
  const [solved, setSolved] = useState(false);
  const [rage, setRage] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [hit, setHit] = useState<{ n: number; damage: number; critical?: boolean } | null>(null);
  const [freed, setFreed] = useState<{ n: number; ruby: string } | null>(null);
  const [end, setEnd] = useState<'won' | 'lost' | null>(null);
  const [tip, setTip] = useState<{ n: number; icons: string; text: string } | null>(null);
  /** Each finished word swings the kana weapon. */
  const [swing, setSwing] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms)), []);
  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      stopSpeaking();
    };
  }, []);

  const letters = kanaToWrite(word);
  const kana = letters[pos] ?? letters[letters.length - 1];
  const say = useCallback((text: string) => {
    setFlash(text);
    setFlashKey((n) => n + 1);
  }, []);

  // Each new word is said aloud (the device's voice), then may be heard again with the speaker key.
  useEffect(() => {
    if (end) return;
    const t = setTimeout(() => speak(word.kana), 500);
    return () => clearTimeout(t);
  }, [word, end]);

  // The first fight of 0章: how it goes, once.
  useEffect(() => {
    if (tipsSeen.includes('kanaListen')) return;
    const t = setTimeout(() => {
      setTip({ n: 1, icons: '🔊 → ✍️ → 💥', text: 'Listen, then write each kana. きいて、かく！' });
      markTipSeen('kanaListen');
    }, 900);
    const off = setTimeout(() => setTip(null), 6000);
    return () => {
      clearTimeout(t);
      clearTimeout(off);
    };
    // Once, at the start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strikeBack = useCallback(() => {
    const next = Math.max(0, myHpRef.current - foe.attack);
    myHpRef.current = next;
    setMyHp(next);
    setRage(0);
    sfx.hurt();
    void enemyCtl.start({ x: [0, -70, 0], transition: { duration: 0.45 } });
    void heroCtl.start({ x: [0, -12, 0], rotate: [0, -6, 0], transition: { duration: 0.4, delay: 0.15 } });
    void fieldCtl.start({ x: [0, -6, 6, -3, 0], transition: { duration: 0.35, delay: 0.2 } });
    say(`💥 −${foe.attack}`);
    if (next === 0) {
      setEnd('lost');
      sfx.lose();
    }
  }, [foe.attack, enemyCtl, heroCtl, fieldCtl, say]);

  const handleMistake = useCallback(() => {
    if (end) return;
    setRage((r) => {
      const n = r + 1;
      if (n >= foe.patience) later(strikeBack, 250);
      return n;
    });
  }, [end, foe.patience, later, strikeBack]);

  const handleComplete = useCallback(
    ({ totalMistakes }: { totalMistakes: number }) => {
      if (end || solved) return;
      if (totalMistakes <= 2) recordKanaRep(kana);
      const mine = { mistakes: totalMistakes, hinted };
      const all = [...written, mine];
      setWritten(all);
      setHinted(false);
      const clean = totalMistakes === 0 && !hinted;
      setCombo((c) => (clean ? c + 1 : 0));
      if (clean) sfx.neon(0.5, combo);
      else sfx.tap();
      // A sealed kana comes out of the shadow.
      let open = opened;
      if (fight.seals.includes(kana) && !opened.has(kana)) {
        open = new Set(opened).add(kana);
        setOpened(open);
        setFreed({ n: Date.now(), ruby: kana });
        sfx.signOn();
      }
      if (pos + 1 < letters.length) {
        setPos(pos + 1);
        return;
      }
      // The word is whole: its picture, its sound — and the blow.
      setSolved(true);
      speak(word.kana);
      const damage = wordDamage(all, weapon?.power ?? 1);
      setSwing((n) => n + 1);
      const floor = sealFloor(foe.hp, fight.seals.length, fight.seals.filter((s) => !open.has(s)).length);
      const struck = strikeSealed(foeHpRef.current, damage, floor);
      sfx.beam();
      void heroCtl.start({ x: [0, 18, 0], scale: [1, 1.08, 1], transition: { duration: 0.5 } });
      later(() => {
        sfx.hit();
        void enemyCtl.start({ x: [0, 16, -10, 0], transition: { duration: 0.45 } });
        foeHpRef.current = struck.hp;
        setFoeHp(struck.hp);
        setHit({ n: Date.now(), damage: struck.dealt, critical: all.every((w) => w.mistakes === 0 && !w.hinted) });
        say(`${word.emoji} ${struck.dealt}${struck.held ? ' 🔒' : ''}`);
        if (struck.hp === 0) {
          setEnd('won');
          if (!playJingle()) sfx.fanfare();
          later(onWin, 2200);
          return;
        }
        later(() => {
          const before = stageOf(fight, opened);
          const after = stageOf(fight, open);
          if (fight.stages.length > 1 && after > before) say(`⭐ ${after + 1} / ${fight.stages.length}`);
          setWord(nextWord(fight, open, word));
          setPos(0);
          setWritten([]);
          setSolved(false);
        }, 1300);
      }, 450);
    },
    [end, solved, recordKanaRep, kana, hinted, written, combo, opened, fight, pos, letters.length, word, weapon, foe.hp, heroCtl, enemyCtl, later, say, onWin],
  );

  // The seals on show: a boss's current stage only (46 do not fit), an episode's all.
  const stage = stageOf(fight, opened);
  const seals: SealView[] = useMemo(
    () => (fight.stages[stage] ?? fight.seals).map((k) => ({ id: k, char: k, open: opened.has(k) })),
    [fight, stage, opened],
  );
  const nameBack = ['ネ', 'ク', 'マ', 'ツ', 'ス'].every((k) => known.has(k));

  return (
    <>
      <NaniwaBattleView
        bossName={foe.name}
        bossLabel={<KanaText known={known}>{foe.name}</KanaText>}
        bossImg={foe.img}
        field={field}
        bossHp={foeHp}
        bossMaxHp={foe.hp}
        playerHp={myHp}
        playerMaxHp={hero.hp}
        rage={rage}
        patience={foe.patience}
        target={asTarget(kana, word.en)}
        targetStars={0}
        showFurigana={showFurigana}
        hpDelay={0}
        heroImg={hero.img}
        heroName={nameBack ? 'ネクマックス' : '？？？'}
        panel={<WordPanel word={word} pos={pos} written={written} solved={solved} still={still} />}
        onSpeak={() => speak(word.kana)}
        renderWriter={(px) =>
          solved || end ? null : (
            <KanjiWriterCanvas
              ref={writerRef}
              key={`${word.kana}-${pos}`}
              char={kana}
              size={px}
              quizMode
              surface="ink"
              leniency={KANA_LENIENCY}
              onMistake={handleMistake}
              onComplete={handleComplete}
            />
          )
        }
        flash={flash}
        flashKey={flashKey}
        tip={tip}
        idle={!flash ? '🔊 → ✍️' : null}
        hit={hit}
        combo={combo}
        comboPct={false}
        still={still}
        heroCtl={heroCtl}
        enemyCtl={enemyCtl}
        fieldCtl={fieldCtl}
        boardRef={boardRef}
        heroRef={heroRef}
        enemyRef={enemyRef}
        onStrokeOrder={() => {
          // Looking costs: this kana counts as hinted, and one slip.
          if (!hinted) {
            setHinted(true);
            handleMistake();
          }
          writerRef.current?.animateStroke();
        }}
        onFlee={onFlee}
        seals={seals}
        freed={freed}
        overlay={
          weapon ? (
            // かなの ぶき: carried beside Nexmax, swung at each finished word.
            <motion.div
              key={swing}
              className="pointer-events-none absolute z-20 flex flex-col items-center"
              style={{ left: '1%', top: '36%', width: '14%' }}
              initial={false}
              animate={swing && !still ? { x: ['0%', '220%', '0%'], y: ['0%', '-160%', '0%'], rotate: [0, 300, 360], scale: [1, 1.3, 1] } : undefined}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <img src={assetPath(weapon.img)} alt="" aria-hidden className="w-full object-contain drop-shadow-[0_0_10px_rgba(255,211,106,0.85)]" />
              <span className="-mt-1 rounded-full bg-black/70 px-1.5 text-[10px] font-black text-[#ffd36a]">×{weapon.power.toFixed(2)}</span>
            </motion.div>
          ) : undefined
        }
      />
      {/* The end: a win runs on into the story; a loss offers another go. */}
      <AnimatePresence>
        {end && (
          <motion.div
            key={end}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/55 px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.img
              src={assetPath(end === 'won' ? hero.img : foe.img)}
              alt=""
              aria-hidden
              className="h-40 w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
              initial={still ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            />
            <p className="text-5xl leading-none">{end === 'won' ? '🎉✨' : '💦'}</p>
            {end === 'lost' && (
              <div className="flex w-full max-w-xs flex-col gap-2">
                <button
                  type="button"
                  className="g-btn g-btn-primary g-shine w-full !min-h-[56px] text-lg"
                  onClick={() => {
                    sfx.tap();
                    myHpRef.current = hero.hp;
                    setMyHp(hero.hp);
                    setRage(0);
                    setEnd(null);
                  }}
                >
                  <span className="relative z-10">
                    🔁 <RubyText showFurigana={showFurigana}>もう いちど</RubyText>
                  </span>
                </button>
                <button type="button" className="g-btn g-btn-night w-full" onClick={onFlee}>
                  <RubyText showFurigana={showFurigana}>もどる</RubyText>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KanaBattle;
