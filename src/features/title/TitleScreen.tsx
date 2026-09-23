import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import { RubyText } from '../../components/ui/Ruby';
import { GameIcon } from '../../components/ui/GameIcon';
import { useGameStore } from '../../store/gameStore';
import PictureBook from '../picturebook/PictureBook';

/**
 * Title (public/img/design/ネクマックス漢字アドベンチャー.png): the logo, Nexmax
 * with a sword, kanji tiles floating around him, three buttons, and the
 * promise of the game on a scroll — 漢字を まなぶと、ネクマックスは どんどん
 * つよくなる.
 *
 * The old key art has its title and signs painted in, with no furigana, so
 * the screen is built from the picture book instead and every kanji on it
 * carries its reading.
 */

const TILES: { ruby: string; x: string; y: string; color: string; delay: number }[] = [
  { ruby: '学(がく)', x: '10%', y: '26%', color: '#3aa8f0', delay: 0 },
  { ruby: '森(もり)', x: '74%', y: '24%', color: '#4f9a3c', delay: 0.6 },
  { ruby: '水(みず)', x: '8%', y: '44%', color: '#2f7fd6', delay: 1.1 },
  { ruby: '火(ひ)', x: '78%', y: '42%', color: '#e0582b', delay: 0.3 },
];

export const TitleScreen = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const hasSave = useGameStore((s) => s.clearedStages.length > 0 || s.weapons.length > 0);
  // A new player starts in 0話, where the one idea the game rests on —
  // writing a character does something — is shown in a few minutes.
  const seenIntro = useGameStore((s) => s.tutorials.intro);

  return (
    <div className="relative flex h-dvh flex-col items-center overflow-hidden">
      <PictureBook scene="mukashi_village" />

      {/* ロゴ ---------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mt-[max(18px,env(safe-area-inset-top))] flex flex-col items-center text-center"
      >
        <span className="text-3xl" style={{ color: '#2f8fe0', filter: 'drop-shadow(0 2px 0 #fff)' }} aria-hidden>
          ♛
        </span>
        <h1 className="leading-none font-black">
          <span
            className="block text-[34px]"
            style={{ color: '#5cc0ff', WebkitTextStroke: '1.5px #0d3b73', paintOrder: 'stroke fill', filter: 'drop-shadow(0 3px 0 #0d3b73)' }}
          >
            ネクマックスの
          </span>
          <span className="g-logo mt-1 block text-[40px] leading-[1.5]">
            <RubyText showFurigana={showFurigana}>漢字(かんじ)アドベンチャー</RubyText>
          </span>
        </h1>
        <div className="g-parchment mt-1 px-4 py-0.5 text-sm font-black">
          <RubyText showFurigana={showFurigana}>まなぶほど、つよく なる！</RubyText>
        </div>
      </motion.div>

      {/* 字の タイル ----------------------------------------------------- */}
      {TILES.map((t) => (
        <motion.div
          key={t.ruby}
          className="absolute z-10 flex h-16 w-14 items-center justify-center rounded-xl border-[3px] bg-white text-[28px] leading-[1.6] font-black shadow-lg"
          style={{ left: t.x, top: t.y, borderColor: t.color, color: '#2b2b3a' }}
          animate={{ y: [0, -10, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: t.delay }}
        >
          <RubyText showFurigana={showFurigana}>{t.ruby}</RubyText>
        </motion.div>
      ))}

      {/* ネクマックスと 剣 -------------------------------------------------- */}
      <motion.div
        className="relative z-10 mt-4"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={assetPath('img/chara/cut/guide.webp')}
          alt=""
          aria-hidden
          className="h-[24dvh] w-auto"
          style={{ filter: 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 8px 10px rgba(0,0,0,0.3))' }}
        />
        <span
          className="absolute -top-6 left-[4%] -rotate-12"
          style={{ color: '#fff7d6', filter: 'drop-shadow(0 0 10px rgba(255,210,90,0.95)) drop-shadow(0 2px 0 #7a4a26)' }}
        >
          <GameIcon name="GiBroadsword" size={70} />
        </span>
      </motion.div>

      {/* ボタン ---------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 mt-auto flex w-full max-w-sm flex-col items-center gap-2.5 px-8"
      >
        <button
          type="button"
          className="g-btn g-btn-primary w-full !min-h-[60px] text-2xl"
          onClick={() => navigate(seenIntro || hasSave ? '/map/mukashi' : '/tutorial')}
        >
          <span aria-hidden>▶</span>
          {hasSave ? 'つづきから' : 'はじめる'}
        </button>
        <button type="button" className="g-btn g-btn-accent w-full text-lg" onClick={() => navigate('/map')}>
          <span aria-hidden>📖</span>
          <RubyText showFurigana={showFurigana}>世界(せかい)を えらぶ</RubyText>
        </button>
        <button type="button" className="g-btn g-btn-slate w-full text-lg" onClick={() => navigate('/settings')}>
          <span aria-hidden>⚙</span>せってい
        </button>
      </motion.div>

      {/* 巻物: 学ぶと 強くなる ---------------------------------------------- */}
      <div className="g-parchment relative z-10 mx-3 mt-3 mb-[max(12px,env(safe-area-inset-bottom))] w-[calc(100%-24px)] max-w-md px-3 py-2">
        <p className="text-center text-[13px] font-black">
          <RubyText showFurigana={showFurigana}>漢字(かんじ)を まなぶと、ネクマックスは どんどん つよく なる！</RubyText>
        </p>
        <div className="mt-1 flex items-end justify-around">
          {(
            [
              ['nexmax', 'GiWoodStick', 'はじめたころ'],
              ['guide', 'GiBroadsword', 'たくさん まなぶと'],
              ['cheer', 'GiZeusSword', 'もっと まなぶと…！'],
            ] as const
          ).map(([pose, icon, label], i) => (
            <div key={pose} className="flex flex-col items-center">
              <div className="relative">
                <img src={assetPath(`img/chara/cut/${pose}.webp`)} alt="" aria-hidden style={{ height: 44 + i * 6 }} />
                <span className="absolute -top-1 -left-2 -rotate-45" style={{ color: i === 2 ? '#f2a91a' : '#7a5a3a' }}>
                  <GameIcon name={icon} size={18 + i * 4} />
                </span>
              </div>
              <span className="text-[10px] font-bold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TitleScreen;
