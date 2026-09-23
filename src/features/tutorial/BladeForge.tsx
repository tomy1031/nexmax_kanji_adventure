import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KanjiData } from '../../types/kanji';
import { RubyText } from '../../components/ui/Ruby';
import { GameIcon } from '../../components/ui/GameIcon';
import { LogoTitle, NexmaxSays } from '../../components/ui/Chrome';
import { useGameStore } from '../../store/gameStore';
import { forgeSingleBlade, RARITY_LABEL } from '../../lib/forge/weapon';
import { kanjiRuby } from '../../lib/reading';

/**
 * 0話 の 鍛冶場 — turning the first character into the first blade.
 *
 * One kanji goes in, 一(いち)の 太刀(たち) comes out. There is nothing to
 * choose here on purpose: the one idea on this screen is "a character you
 * own becomes a weapon". Choosing which characters to combine is the real
 * forge's job, and it opens after 1話.
 *
 * Layout: public/img/design/漢字合成の魔法工房.png.
 */

interface BladeForgeProps {
  kanji: KanjiData;
  onDone: () => void;
}

export const BladeForge = ({ kanji, onDone }: BladeForgeProps) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const craftWeapon = useGameStore((s) => s.craftWeapon);
  const equipWeapon = useGameStore((s) => s.equipWeapon);
  const equippedId = useGameStore((s) => s.equippedWeapon);
  const [phase, setPhase] = useState<'ready' | 'forging' | 'done'>('ready');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const blade = forgeSingleBlade(kanji);
  const ruby = kanjiRuby(kanji);

  const forge = () => {
    setPhase('forging');
    // Equip it only when it is new or nothing is equipped. A returning
    // player replaying 0話 keeps the weapon they had — the store refuses the
    // duplicate recipe, and 0話's fight is handed the blade directly.
    const made = craftWeapon([kanji.id]);
    if (made || !equippedId) equipWeapon(blade.id);
    timer.current = setTimeout(() => setPhase('done'), 1100);
  };

  return (
    <div className="g-sky relative flex min-h-dvh flex-col items-center overflow-hidden px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6">
      {/* 魔法陣 */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[44%] left-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,240,180,0.9) 0%, rgba(120,210,255,0.45) 35%, rgba(80,160,255,0.12) 60%, transparent 70%)',
          border: '3px dashed rgba(255,255,255,0.6)',
        }}
        animate={{ rotate: 360, scale: phase === 'forging' ? 1.25 : 1 }}
        transition={{ rotate: { duration: 30, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.6 } }}
      />

      <LogoTitle sub="字(じ)の 力(ちから)で 武器(ぶき)を つくろう">漢字(かんじ)を 合成(ごうせい)</LogoTitle>

      <div className="relative z-10 flex min-h-[260px] w-full max-w-sm flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {phase !== 'done' ? (
            <motion.div key="parts" className="flex items-center gap-3" exit={{ opacity: 0, scale: 0.4 }}>
              <motion.div
                className="flex h-32 w-28 items-center justify-center rounded-2xl text-[60px] leading-[1.5] font-black"
                style={{
                  background: 'linear-gradient(160deg,#fffbe8,#ffe7a3)',
                  border: '4px solid #f2b53a',
                  boxShadow: '0 0 24px rgba(255,200,80,0.9)',
                  color: '#4a3220',
                }}
                animate={phase === 'forging' ? { x: 70, scale: 0.5, rotate: 360 } : { y: [0, -6, 0] }}
                transition={phase === 'forging' ? { duration: 0.9 } : { duration: 2, repeat: Infinity }}
              >
                <RubyText showFurigana={showFurigana}>{ruby}</RubyText>
              </motion.div>
              <span className="g-outline-text text-4xl font-black">＋</span>
              <motion.div
                className="flex h-32 w-28 flex-col items-center justify-center gap-1 rounded-2xl border-4 border-dashed border-white/80 bg-white/30 text-center text-sm font-black text-white"
                style={{ textShadow: '0 1px 2px rgba(0,40,90,0.8)' }}
                animate={phase === 'forging' ? { x: -70, scale: 0.5, opacity: 0 } : {}}
                transition={{ duration: 0.9 }}
              >
                <GameIcon name="GiKatana" size={44} />
                <RubyText showFurigana={showFurigana}>刀(かたな)の かた</RubyText>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              className="w-60 rounded-2xl p-1.5"
              style={{ background: 'linear-gradient(160deg,#ffe27a,#c98a1c)', boxShadow: '0 0 40px rgba(255,210,90,0.95)' }}
            >
              <div className="rounded-xl p-3 text-center" style={{ background: 'linear-gradient(180deg,#3a2a4e,#1f1633)' }}>
                <span className="inline-block -rotate-45" style={{ color: '#fff4c9', filter: 'drop-shadow(0 0 10px #ffd24a)' }}>
                  <GameIcon name={blade.icon} size={120} />
                </span>
              </div>
              <div className="mt-1.5 rounded-xl bg-[#fdf4dd] px-3 py-2 text-center" style={{ color: '#4a3220' }}>
                <p className="text-lg font-black">
                  <RubyText showFurigana={showFurigana}>{blade.name}</RubyText>
                </p>
                <p className="text-xs" style={{ color: RARITY_LABEL[blade.rarity].color }}>
                  {RARITY_LABEL[blade.rarity].ja}
                  <span className="ml-2 font-bold" style={{ color: '#4a3220' }}>
                    <RubyText showFurigana={showFurigana}>{`こうげき ${blade.attack}`}</RubyText>
                  </span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  <RubyText showFurigana={showFurigana}>{blade.blurb}</RubyText>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3">
        <NexmaxSays
          pose={phase === 'done' ? 'cheer' : 'guide'}
          text={
            phase === 'done'
              ? 'すごい！ 字(じ)が 刀(かたな)に なった！'
              : `「${ruby}」を 刀(かたな)の かたに 入(い)れよう！`
          }
        />
        {phase === 'done' ? (
          <button type="button" className="g-btn g-btn-primary w-full text-xl" onClick={onDone}>
            <RubyText showFurigana={showFurigana}>そうびして つぎへ</RubyText>
          </button>
        ) : (
          <button
            type="button"
            className="g-btn g-btn-primary w-full text-xl"
            disabled={phase === 'forging'}
            onClick={forge}
          >
            <span aria-hidden>🔨</span>れんせいする
          </button>
        )}
      </div>
    </div>
  );
};

export default BladeForge;
