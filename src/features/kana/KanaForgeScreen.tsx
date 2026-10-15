import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import KanjiWriterCanvas from '../../components/KanjiWriterCanvas';
import { TopBar } from '../../components/ui/Chrome';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useStill } from '../../hooks/useStill';
import { assetPath } from '../../lib/assetPath';
import { useBgm, playJingle } from '../../lib/bgm';
import * as sfx from '../../lib/sfx';
import { speak } from '../../lib/speech';
import { KANA_LENIENCY, ROMAJI } from '../../data/kana';
import { FIRST_KANA_WEAPON, KANA_WEAPONS, canMakeKanaWeapon, getKanaWeapon, weaponKana, type KanaWeapon } from '../../data/kanaWeapons';
import { NANIWA_NEXMAX_STAR1, NANIWA_NEXMAX_STAR2 } from '../../data/scripts/naniwaCast';
import { useGameStore } from '../../store/gameStore';
import KanaText from './KanaText';
import { useKnownKana } from './useKnownKana';

/**
 * かなの かじや (docs/design/22 §5, 2026-10-15「ひらがな、カタカナ編でもひらがな武器を作れるように。
 * 同じようにチュートリアルを。ただし、この武器はひらがな、カタカナの時だけ使える」).
 *
 * A weapon is made by writing its name. The list shows every kana weapon:
 * the ones whose kana are all the player's own can be made (write the name
 * once, kana by kana), the others show which kana are still missing. One is
 * carried into 0章の たたかい (KanaBattle) — never into the town's kanji fights.
 *
 * The first visit (after かな 2話, ?first=1) is the tutorial, like 漢字やさん's
 * first weapon: four cards, one at a time, then the player writes かさ.
 * Everything is kana with romaji, pictures and a line of English: the
 * player cannot read yet.
 */

const TUTORIAL = [
  { icons: '✍️ ☂️', ja: 'ぶきの なまえを かく', en: "Write a weapon's name…" },
  { icons: '☂️ ⚒️ ✨', ja: 'なまえが ぶきに なる', en: '…and the name becomes the weapon.' },
  { icons: '⚔️ 💥', ja: 'かなの たたかいで つよく なる', en: 'It makes your words hit harder in the kana fights.' },
  { icons: '🙅 🏙️', ja: 'かなの はなし だけ', en: 'It only works in the hiragana and katakana chapters — not in the town.' },
] as const;

/** Writing a weapon's name, kana by kana, with the model faintly under each. */
const NameWriter = ({ weapon, onDone, onClose }: { weapon: KanaWeapon; onDone: () => void; onClose: () => void }) => {
  const still = useStill();
  const size = useCanvasSize(260, 0.42, 88, 0);
  const letters = weaponKana(weapon);
  const [pos, setPos] = useState(0);
  const [made, setMade] = useState(false);
  const recordKanaRep = useGameStore((s) => s.recordKanaRep);
  const complete = useCallback(
    ({ totalMistakes }: { totalMistakes: number }) => {
      if (totalMistakes <= 2) recordKanaRep(letters[pos]);
      if (pos + 1 < letters.length) {
        sfx.neon(0.5, pos);
        setPos(pos + 1);
        return;
      }
      setMade(true);
      speak(weapon.name);
      if (!playJingle()) sfx.fanfare();
      onDone();
    },
    [pos, letters, recordKanaRep, weapon.name, onDone],
  );
  let k = 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5" aria-label={weapon.name}>
        {[...weapon.name].map((c, i) => {
          if (c === 'ー')
            return (
              <span key={i} className="flex h-14 w-12 items-center justify-center rounded-lg border-2 border-[#b6a08a] bg-[#efe3c6] text-3xl font-black text-[#24180d]">
                ー
              </span>
            );
          const at = k++;
          const done = at < pos || made;
          return (
            <span
              key={i}
              className="flex h-14 w-12 items-center justify-center rounded-lg border-2 font-black"
              style={{
                background: done ? 'linear-gradient(180deg,#fff8d6,#f2d27a)' : 'rgba(255,255,255,0.7)',
                borderColor: at === pos && !made ? '#2f8fe0' : '#c9973f',
                boxShadow: at === pos && !made ? '0 0 10px rgba(47,143,224,0.7)' : undefined,
              }}
            >
              {done ? (
                <span className="text-3xl text-[#24180d]">{c}</span>
              ) : (
                <span lang="en" className="text-base text-[#6b5a48]">
                  {ROMAJI[c]}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {made ? (
          <motion.div key="made" className="flex flex-col items-center gap-2" initial={still ? false : { scale: 0.3, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
            <img src={assetPath(weapon.img)} alt="" className="h-44 w-44 object-contain drop-shadow-[0_0_24px_rgba(255,211,106,0.8)]" />
            <p className="text-3xl font-black">✨⚒️✨</p>
          </motion.div>
        ) : (
          <motion.div key={pos} className="g-parchment rounded-2xl p-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <KanjiWriterCanvas key={`${weapon.name}-${pos}`} char={letters[pos]} size={size} quizMode showSample surface="paper" leniency={KANA_LENIENCY} onComplete={complete} />
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" className="text-sm font-bold underline opacity-80" onClick={onClose}>
        {made ? '👍 OK' : '✕'}
      </button>
    </div>
  );
};

export const KanaForgeScreen = () => {
  useBgm('shop');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const known = useKnownKana();
  const still = useStill();
  const made = useGameStore((s) => s.kanaWeapons);
  const carried = useGameStore((s) => s.equippedKanaWeapon);
  const makeKanaWeapon = useGameStore((s) => s.makeKanaWeapon);
  const equipKanaWeapon = useGameStore((s) => s.equipKanaWeapon);
  const seenTutorial = useGameStore((s) => s.tutorials.kanaForge);
  const markTutorialSeen = useGameStore((s) => s.markTutorialSeen);
  const cleared = useGameStore((s) => s.clearedStages);
  // The first visit: the four cards, then かさ.
  const [card, setCard] = useState<number | null>(() => (params.get('first') === '1' || !seenTutorial ? 0 : null));
  const [writing, setWriting] = useState<KanaWeapon | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Nexmax as the kana chapters show him: ★2 once the hiragana boss is beaten, else ★1.
  const nexmax = (cleared.includes('kana-boss-1') ? NANIWA_NEXMAX_STAR2 : NANIWA_NEXMAX_STAR1).sprites;
  const next = params.get('next');
  const leave = () => navigate(next ? `/map/moji?new=${next}` : (params.get('back') ?? '/map/moji'));

  const list = useMemo(
    () =>
      KANA_WEAPONS.map((w) => ({
        w,
        have: made.includes(w.name),
        can: canMakeKanaWeapon(w, known),
        missing: weaponKana(w).filter((k) => !known.has(k)),
        mine: carried === w.name,
      })),
    [made, known, carried],
  );
  const first = getKanaWeapon(FIRST_KANA_WEAPON)!;

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden text-[#fff1cf]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#1c120a]">
        <img src={assetPath('img/kanjiyasan/bg_tall.webp')} alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,12,6,0.55) 0%, rgba(20,12,6,0.35) 40%, rgba(12,8,4,0.9) 100%)' }} />
      </div>
      <TopBar onBack={leave} />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-3">
          <img src={assetPath(nexmax.guide)} alt="" aria-hidden className="h-28 w-auto object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]" />
          <div className="mb-3 flex-1">
            <h1 className="text-2xl font-black tracking-wider" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
              ⚒️ <KanaText known={known}>かなの かじや</KanaText>
            </h1>
            <p lang="en" className="text-xs font-bold opacity-85">
              Kana Smithy — write a name, get a weapon. Kana chapters only.
            </p>
            {carried && (
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-sm font-black">
                <img src={assetPath(getKanaWeapon(carried)?.img ?? '')} alt="" className="h-6 w-6 object-contain" />
                <KanaText known={known}>{carried}</KanaText>
                <span className="text-[#ffd36a]">×{getKanaWeapon(carried)?.power.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-2">
          {list.map(({ w, have, can, missing, mine }) => (
            <li key={w.name}>
              <div
                className="flex h-full flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center"
                style={{
                  borderColor: carried === w.name ? '#ffd36a' : have ? '#c9973f' : 'rgba(201,151,63,0.4)',
                  background: carried === w.name ? 'linear-gradient(180deg,rgba(255,211,106,0.25),rgba(40,26,12,0.85))' : 'rgba(40,26,12,0.8)',
                  boxShadow: card != null && w.name === first.name ? '0 0 16px #ffd36a' : undefined,
                }}
              >
                <img
                  src={assetPath(w.img)}
                  alt=""
                  aria-hidden
                  className="h-16 w-16 object-contain"
                  style={{ filter: have ? undefined : can ? 'grayscale(0.4) brightness(0.85)' : 'brightness(0) opacity(0.5)' }}
                />
                <p className="text-lg leading-[1.9] font-black">
                  <KanaText known={known}>{w.name}</KanaText>
                </p>
                <p className="text-[11px] font-bold opacity-80">
                  <span lang="en">{w.en}</span> <span className="text-[#ffd36a]">×{w.power.toFixed(2)}</span>
                </p>
                {have ? (
                  <button
                    type="button"
                    className={`g-btn ${carried === w.name ? 'g-btn-primary' : 'g-btn-night'} !min-h-[34px] w-full !px-2 text-sm`}
                    onClick={() => {
                      sfx.tap();
                      equipKanaWeapon(carried === w.name ? null : w.name);
                    }}
                  >
                    {mine ? '✅' : '🤝'} <KanaText known={known}>{mine ? 'もって いる' : 'もつ'}</KanaText>
                  </button>
                ) : can ? (
                  <button
                    type="button"
                    className="g-btn g-btn-primary g-shine !min-h-[34px] w-full !px-2 text-sm"
                    onClick={() => {
                      sfx.tap();
                      setWriting(w);
                    }}
                  >
                    <span className="relative z-10">
                      ✍️ <KanaText known={known}>かく</KanaText>
                    </span>
                  </button>
                ) : (
                  <p className="text-xs font-bold opacity-75" aria-label={`🔒 ${missing.join('')}`}>
                    🔒 {missing.map((m) => ROMAJI[m]).join(' ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {next && (
          <button type="button" className="g-btn g-btn-primary g-shine mt-1 w-full !min-h-[52px]" onClick={leave}>
            <span className="relative z-10">
              ▶ <KanaText known={known}>つぎへ</KanaText>
            </span>
          </button>
        )}
      </div>

      {/* はじめて: four cards, one at a time, then かさ */}
      <AnimatePresence>
        {card != null && (
          <motion.div key="tutorial" className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 px-4 pb-[max(24px,env(safe-area-inset-bottom))]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div key={card} className="g-novel-night w-full max-w-md rounded-2xl px-4 py-4 text-center" initial={still ? false : { y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="flex items-end justify-center gap-2">
                <img src={assetPath(card === 0 ? nexmax.smile : nexmax.guide)} alt="" aria-hidden className="h-24 w-auto object-contain" />
                {card === 0 && <img src={assetPath(first.img)} alt="" aria-hidden className="mb-2 h-16 w-16 object-contain" />}
              </div>
              {card === 0 && (
                <p className="mt-1 text-lg font-black">
                  <KanaText known={known} mode="mask">
                    かさ！ ぶき！ ☂️⚔️
                  </KanaText>
                </p>
              )}
              <p className="mt-1 text-4xl leading-tight">{TUTORIAL[card].icons}</p>
              <p className="mt-1 text-base leading-[2] font-black">
                <KanaText known={known}>{TUTORIAL[card].ja}</KanaText>
              </p>
              <p lang="en" className="text-xs font-bold opacity-85">
                {TUTORIAL[card].en}
              </p>
              <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
                {TUTORIAL.map((_, i) => (
                  <span key={i} className="h-2 w-2 rounded-full" style={{ background: i <= card ? '#ffd36a' : 'rgba(255,255,255,0.3)' }} />
                ))}
              </div>
              <button
                type="button"
                className="g-btn g-btn-primary g-shine mt-3 w-full !min-h-[48px]"
                onClick={() => {
                  sfx.tap();
                  if (card + 1 < TUTORIAL.length) setCard(card + 1);
                  else {
                    setCard(null);
                    markTutorialSeen('kanaForge');
                    if (!made.includes(first.name) && canMakeKanaWeapon(first, known)) setWriting(first);
                  }
                }}
              >
                <span className="relative z-10">{card + 1 < TUTORIAL.length ? '▶' : '✍️ ☂️'}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* writing a name */}
      <AnimatePresence>
        {writing && (
          <motion.div key="write" className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="g-novel-night w-full max-w-md rounded-2xl px-4 py-4">
              <p className="mb-2 text-center text-sm font-black">
                ✍️ <KanaText known={known}>なまえを かく</KanaText> <span lang="en" className="opacity-80">— write its name</span>
              </p>
              <NameWriter
                weapon={writing}
                onDone={() => {
                  makeKanaWeapon(writing.name);
                  setToast(writing.name);
                }}
                onClose={() => setWriting(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && !writing && (
          <motion.p
            key={toast}
            className="fixed inset-x-0 top-[38%] z-30 mx-auto w-fit rounded-full bg-black/80 px-5 py-2 text-lg font-black"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setToast(null), 1800)}
          >
            ⚒️ <KanaText known={known}>{toast}</KanaText> ✨
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanaForgeScreen;
