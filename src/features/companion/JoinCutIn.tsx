import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { LogoText } from '../../components/ui/LogoText';
import { assetPath } from '../../lib/assetPath';
import * as sfx from '../../lib/sfx';
import { playJingle } from '../../lib/bgm';
import { getIndividual } from '../../data/individuals';
import { linesFor } from '../../data/companionLines';
import { SKILL_INFO, SKILL_OF } from '../../lib/companionSkill';
import { useCompanionFx } from '../../store/companionFx';
import { useGameStore } from '../../store/gameStore';
import { useStill } from '../../hooks/useStill';

/**
 * 「いっしょに 行きます！」 (2026-10-15「どの仲間を使っているか分かりやすく（当たった時の特別感の
 * 演出含めて）」): the companion just taken along steps in across the screen —
 * rays in its rarity's colour (★3 silver, ★4 gold, ★5 rainbow), its picture
 * sweeping in, its name and stars on a band, its わざ, and its first line. A
 * tap, or a moment, closes it. Mounted once (App); takeAlong() shows it. At the
 * start of a town fight a shorter one says 「いっしょに たたかいます！」 (MojiEpisodeScreen).
 */

const RAYS: Record<number, string> = {
  3: 'repeating-conic-gradient(rgba(200,214,235,0.35) 0deg 9deg, transparent 9deg 22deg)',
  4: 'repeating-conic-gradient(rgba(255,214,110,0.45) 0deg 9deg, transparent 9deg 22deg)',
  5: 'repeating-conic-gradient(rgba(255,120,190,0.42) 0deg 7deg, rgba(120,220,255,0.38) 7deg 14deg, rgba(255,230,120,0.4) 14deg 21deg, transparent 21deg 30deg)',
};
const BAND: Record<number, string> = {
  3: 'linear-gradient(90deg, #5b6b86, #a9b8cf, #5b6b86)',
  4: 'linear-gradient(90deg, #8a4b12, #f2c45a, #8a4b12)',
  5: 'linear-gradient(90deg, #d0567a, #ffd36a, #6ad0ff, #b07aff, #d0567a)',
};

export const JoinCutIn = () => {
  const join = useCompanionFx((s) => s.join);
  const clear = useCompanionFx((s) => s.clearJoin);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const still = useStill();
  const card = join ? getIndividual(join.id) : undefined;

  useEffect(() => {
    if (!join || !card) return;
    sfx.skill();
    if (!join.fight && card.rarity === 5 && !playJingle()) sfx.fanfare();
    const t = setTimeout(clear, join.fight ? 1500 : still ? 1800 : 2800);
    return () => clearTimeout(t);
  }, [join, card, clear, still]);

  const kind = card ? SKILL_OF[card.char] : undefined;
  const info = kind ? SKILL_INFO[kind] : undefined;
  return (
    <AnimatePresence>
      {join && card && (
        <motion.div
          key={join.n}
          role="status"
          aria-label={`${card.shortName}が いっしょに 行きます`}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-[#0b0820]/80 px-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clear}
        >
          {!still && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2"
              style={{ background: RAYS[card.rarity], maskImage: 'radial-gradient(circle, black 8%, transparent 55%)' }}
              initial={{ rotate: 0, scale: 0.6 }}
              animate={{ rotate: 90, scale: 1 }}
              transition={{ rotate: { duration: 18, ease: 'linear' }, scale: { duration: 0.5 } }}
            />
          )}
          {/* the band across, with the name */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-[58%] h-[64px]"
            style={{ background: BAND[card.rarity], boxShadow: '0 0 24px rgba(0,0,0,0.5)' }}
            initial={still ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          />
          <motion.img
            src={assetPath(card.art)}
            alt=""
            aria-hidden
            className="relative z-10 h-[46dvh] max-h-[380px] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
            initial={still ? false : { x: 260, opacity: 0, rotate: 8, scale: 1.1 }}
            animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          />
          <motion.div
            className="relative z-10 -mt-6 flex flex-col items-center"
            initial={still ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-2xl leading-none tracking-tight" style={{ color: card.rarity === 5 ? '#ffb3d6' : '#ffd36a', textShadow: '0 2px 4px #000' }}>
              {'★'.repeat(card.rarity)}
            </p>
            <p className="g-outline-text mt-1 text-2xl font-black text-white">
              <RubyText showFurigana={showFurigana}>{card.name}</RubyText>
            </p>
            <div className="mt-2" style={{ fontSize: 30, lineHeight: 1.4 }}>
              <LogoText showFurigana={showFurigana} shine={!still}>
                {join.fight ? 'いっしょに たたかいます！' : 'いっしょに 行(い)きます！'}
              </LogoText>
            </div>
            {info && !join.fight && (
              <p className="mt-2 rounded-full bg-black/55 px-3 py-1 text-sm font-black text-[#ffe7b8]">
                {info.icon} <RubyText showFurigana={showFurigana}>{`わざ「${info.name}」`}</RubyText>
              </p>
            )}
            {!join.fight && (
              <p className="mt-2 max-w-xs rounded-2xl bg-[#fffaf0] px-4 py-2 text-base leading-[1.9] font-black text-[#2a1a0c] shadow-lg">
                <RubyText showFurigana={showFurigana}>{`「${linesFor(card).start}」`}</RubyText>
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JoinCutIn;
