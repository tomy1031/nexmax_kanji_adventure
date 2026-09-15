import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';

/**
 * Title. The key art already carries the game's promise — 漢字を学んで、武器を
 * ふやして、つよくなろう — so the screen stays out of its way: art, logo, three
 * buttons.
 */
export const TitleScreen = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const hasSave = useGameStore((s) => s.clearedStages.length > 0 || s.weapons.length > 0);

  return (
    <div className="g-stage relative flex flex-col items-center justify-end overflow-hidden">
      <img
        src={assetPath('img/bg/title_keyart.webp')}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* The art is busy at the bottom, where the buttons sit. */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(6,16,34,0.72) 78%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-3 px-6 pb-10"
      >
        <h1 className="g-title text-center text-2xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          <RubyText showFurigana={showFurigana}>
            ネクマックスの 漢字(かんじ)アドベンチャー
          </RubyText>
        </h1>
        <p className="mb-2 text-center text-sm text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          <RubyText showFurigana={showFurigana}>
            漢字(かんじ)を 学(まな)んで、武器(ぶき)を ふやして、つよくなろう！
          </RubyText>
        </p>

        <button type="button" className="g-btn g-btn-primary w-full text-lg" onClick={() => navigate('/map')}>
          {hasSave ? 'つづきから' : 'はじめる'}
        </button>
        <div className="flex w-full gap-2">
          <button type="button" className="g-btn g-btn-ghost flex-1 !bg-white/85" onClick={() => navigate('/collection')}>
            <RubyText showFurigana={showFurigana}>図鑑(ずかん)</RubyText>
          </button>
          <button type="button" className="g-btn g-btn-ghost flex-1 !bg-white/85" onClick={() => navigate('/settings')}>
            せってい
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TitleScreen;
