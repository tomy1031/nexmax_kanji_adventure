import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { CLASS_STEPS, type NexmaxClass } from '../../lib/nexmaxClass';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { useStill } from '../../hooks/useStill';
import { useGameStore } from '../../store/gameStore';
import * as sfx from '../../lib/sfx';
import { useNexmaxClass } from './useNexmaxClass';

/**
 * ネクマックスの クラス on the screens (docs/design/21 §3.3): a badge by the
 * level, a card that tells what each class brings, and — once — the card
 * that says he has become ★4. Always 「クラス ★4」, never a bare ★: a kanji's
 * ★1〜3 and a card's ★3〜5 are on the same screens.
 */

/** His picture in a class: ★4 in the class-up form (the story's, img/chara/naniwa/nexmax_star4). */
const PICTURE: Record<NexmaxClass, string> = {
  3: 'img/chara/naniwa/nexmax_normal.webp',
  4: 'img/chara/naniwa/nexmax_star4.webp',
  // ★5 has no picture yet (10章): the ★4 one until it does.
  5: 'img/chara/naniwa/nexmax_star4.webp',
};

/** What each class brings, furigana notation, with its English for EN. */
const STEP_TEXT: Record<NexmaxClass, { when: string; whenEn: string; gives: string; givesEn: string }> = {
  3: { when: 'はじめ', whenEn: 'From the start', gives: '—', givesEn: '' },
  4: {
    when: '5章(しょう)の まとめの ボスに 勝(か)つ',
    whenEn: 'Beat the final boss of chapter 5',
    gives: '👀 見(み)た目(め)・💍 アクセサリ 2つ',
    givesEn: 'A new look · 2 accessories',
  },
  5: {
    when: '10章(しょう)の まとめの ボスに 勝(か)つ',
    whenEn: 'Beat the final boss of chapter 10',
    gives: 'つづきは じゅんび中(ちゅう)',
    givesEn: 'Coming later',
  },
};

/** ★3 in the level's blue, ★4 and up in gold. */
const badgeStyle = (cls: NexmaxClass) =>
  cls >= 4
    ? { background: 'linear-gradient(180deg,#ffe08a,#e8a317)', color: '#5a3500', boxShadow: '0 0 6px rgba(255,200,70,0.7)' }
    : { background: '#1b4f8a', color: '#fff' };

/** The class as a small badge; a tap opens the class card. */
export const ClassBadge = ({ showFurigana }: { showFurigana: boolean }) => {
  const cls = useNexmaxClass();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md px-1.5 text-xs leading-[1.8] font-black whitespace-nowrap active:scale-95"
        style={badgeStyle(cls)}
        aria-label={`クラス ★${cls}`}
      >
        <RubyText showFurigana={showFurigana}>{`クラス ★${cls}`}</RubyText>
      </button>
      {open && <ClassCard cls={cls} showFurigana={showFurigana} onClose={() => setOpen(false)} />}
    </>
  );
};

/** ★3 → ★4 → ★5: when each comes and what it brings, the class now lit. */
export const ClassCard = ({ cls, showFurigana, onClose }: { cls: NexmaxClass; showFurigana: boolean; onClose: () => void }) => {
  const [en, setEn] = useState(() => useGameStore.getState().settings.english);
  const okRef = useEscapeToClose(onClose);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-5"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-card-title"
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="g-parchment max-h-[90dvh] w-full max-w-sm overflow-y-auto px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="class-card-title" className="text-lg leading-[2] font-black" style={{ color: 'var(--accent-2)' }}>
            <RubyText showFurigana={showFurigana}>ネクマックスの クラス</RubyText>
          </h2>
          <button
            type="button"
            aria-pressed={en}
            className="rounded-full border-2 border-[#caa468] bg-white/80 px-2.5 py-0.5 text-[12px] whitespace-nowrap"
            onClick={() => setEn(!en)}
          >
            EN
          </button>
        </div>
        {en && (
          <p lang="en" className="-mt-1 text-[12px] font-bold" style={{ color: '#1b4f8f' }}>
            {`Nexmax's class — now Class ★${cls}`}
          </p>
        )}
        <img src={assetPath(PICTURE[cls])} alt="" aria-hidden className="mx-auto mt-1 h-[120px] w-auto object-contain" />
        <ul className="mt-2 flex flex-col gap-1.5">
          {CLASS_STEPS.map((step) => {
            const t = STEP_TEXT[step.star];
            const now = step.star === cls;
            const reached = step.star <= cls;
            return (
              <li
                key={step.star}
                className="flex items-center gap-2 rounded-xl border-2 px-2 py-1.5"
                style={
                  now
                    ? { borderColor: '#e8a317', background: 'linear-gradient(160deg,#fffbe8,#ffe7a3)' }
                    : { borderColor: 'rgba(202,164,104,0.5)', background: 'rgba(255,255,255,0.5)', opacity: reached ? 1 : 0.75 }
                }
              >
                <span className="shrink-0 rounded-md px-1.5 text-sm leading-[1.8] font-black" style={badgeStyle(step.star)}>
                  {`★${step.star}`}
                </span>
                <span className="min-w-0 flex-1 text-[12px] leading-[1.9] font-bold">
                  <RubyText showFurigana={showFurigana}>{t.when}</RubyText>
                  {en && (
                    <span lang="en" className="block text-[11px] leading-snug" style={{ color: '#1b4f8f' }}>
                      {t.whenEn}
                    </span>
                  )}
                  {step.star > 3 && (
                    <span className="block font-black" style={{ color: '#7a4a26' }}>
                      <RubyText showFurigana={showFurigana}>{t.gives}</RubyText>
                      {en && t.givesEn && (
                        <span lang="en" className="block text-[11px] leading-snug font-bold" style={{ color: '#1b4f8f' }}>
                          {t.givesEn}
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs font-black" style={{ color: now ? '#b0741a' : '#4f9a3c' }}>
                  {now ? 'いま' : reached ? '✓' : ''}
                </span>
              </li>
            );
          })}
        </ul>
        <button ref={okRef} type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={onClose}>
          とじる
        </button>
      </motion.div>
    </motion.div>
  );
};

/**
 * 「★4 クラスアップ！」 — once, the first time the class has gone up
 * (tutorials.classUp): the new picture, what changed in pictures, and the
 * way to もちもの where the second accessory slot waits.
 */
export const ClassUpNotice = ({ showFurigana }: { showFurigana: boolean }) => {
  const cls = useNexmaxClass();
  const seen = useGameStore((s) => s.tutorials.classUp);
  return cls >= 4 && !seen ? <ClassUpCard cls={cls} showFurigana={showFurigana} /> : null;
};

const ClassUpCard = ({ cls, showFurigana }: { cls: NexmaxClass; showFurigana: boolean }) => {
  const markTutorialSeen = useGameStore((s) => s.markTutorialSeen);
  const navigate = useNavigate();
  const still = useStill();
  const [en, setEn] = useState(() => useGameStore.getState().settings.english);
  const close = () => markTutorialSeen('classUp');
  const okRef = useEscapeToClose(close);
  useEffect(() => sfx.fanfare(), []);
  const gains = [
    { icon: '👀', ja: '見(み)た目(め)が かわりました', en: 'A new look' },
    { icon: '💍', ja: 'アクセサリ 1つ ➡️ 2つ', en: 'Accessories: 1 → 2' },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5" onClick={close}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-up-title"
        initial={{ scale: 0.8, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="g-novel-box g-novel-night w-full max-w-xs px-5 py-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="class-up-title" className="flex-1 text-2xl leading-[1.6] font-black" style={{ color: '#ffd36a', textShadow: '0 0 12px rgba(255,190,60,0.7)' }}>
            {`★${cls} クラスアップ！`}
          </h2>
          <button
            type="button"
            aria-pressed={en}
            className="rounded-full border-2 border-[#caa468] bg-white/15 px-2.5 py-0.5 text-[12px] whitespace-nowrap text-[#ffe9c2]"
            onClick={() => setEn(!en)}
          >
            EN
          </button>
        </div>
        {en && (
          <p lang="en" className="text-[12px] font-bold text-[#c9dcff]">
            {`Class up! Nexmax is now Class ★${cls}`}
          </p>
        )}
        <motion.img
          src={assetPath(PICTURE[cls])}
          alt=""
          aria-hidden
          className="mx-auto mt-1 h-[min(200px,26dvh)] w-auto object-contain"
          style={{ filter: 'drop-shadow(0 0 18px rgba(255,200,70,0.65))' }}
          initial={still ? false : { scale: 0.6, rotate: -8 }}
          animate={still ? undefined : { scale: 1, rotate: 0, y: [0, -6, 0] }}
          transition={still ? undefined : { scale: { type: 'spring', stiffness: 220, damping: 12 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
        />
        <ul className="mt-2 flex flex-col gap-1 text-left">
          {gains.map((g) => (
            <li key={g.icon} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1 text-[15px] leading-[2] font-black">
              <span aria-hidden className="text-xl">
                {g.icon}
              </span>
              <span className="min-w-0 flex-1">
                <RubyText showFurigana={showFurigana}>{g.ja}</RubyText>
                {en && (
                  <span lang="en" className="block text-[12px] leading-snug font-bold text-[#c9dcff]">
                    {g.en}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <button
          ref={okRef}
          type="button"
          data-tap
          className="g-btn g-btn-primary mt-3 w-full"
          onClick={() => {
            close();
            navigate('/equip');
          }}
        >
          <RubyText showFurigana={showFurigana}>もちものを 見(み)る</RubyText>
        </button>
        <button type="button" className="mt-2 w-full text-sm font-black text-[#ffe9c2] underline underline-offset-2" onClick={close}>
          とじる
        </button>
      </motion.div>
    </motion.div>
  );
};
