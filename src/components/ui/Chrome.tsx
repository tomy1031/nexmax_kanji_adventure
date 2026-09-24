import type { ReactNode } from 'react';
import { useMapPath, useSafeBack } from '../../lib/nav';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RubyText } from './Ruby';
import { LogoText } from './LogoText';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import { Feature, isFeatureUnlocked, UNLOCKED_BY } from '../../data/unlocks';
import { GiBackpack, GiCog, GiOpenBook, GiPadlock, GiTreasureMap } from 'react-icons/gi';
import type { IconType } from 'react-icons';

/**
 * Shared screen chrome, after the reference screens in public/img/design/:
 * the blue もどる / ホーム pills, the wooden title plate, Nexmax with a speech
 * bubble, and the four-tab bar at the bottom.
 */

export const PillButton = ({
  children,
  onClick,
  icon,
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: string;
}) => (
  <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={onClick}>
    {icon && <span aria-hidden>{icon}</span>}
    {children}
  </button>
);

/** もどる (left) and ホーム (right), with an optional title plate between. */
export const TopBar = ({ onBack, title }: { onBack?: () => void; title?: string }) => {
  const navigate = useNavigate();
  const safeBack = useSafeBack();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  return (
    <header className="relative z-20 flex w-full items-center justify-between gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))]">
      <PillButton icon="◀" onClick={onBack ?? safeBack}>
        もどる
      </PillButton>
      {title && (
        <div className="g-wood min-w-0 truncate px-3 py-0.5 text-sm font-black">
          <RubyText showFurigana={showFurigana}>{title}</RubyText>
        </div>
      )}
      <PillButton icon="♛" onClick={() => navigate('/')}>
        ホーム
      </PillButton>
    </header>
  );
};

/** The big two-tone logo title of the reference screens. */
export const LogoTitle = ({ children, sub, size = 34 }: { children: string; sub?: string; size?: number }) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="leading-[1.55] whitespace-nowrap" style={{ fontSize: size }}>
        <LogoText showFurigana={showFurigana}>{children}</LogoText>
      </h1>
      {sub && (
        <div className="g-ribbon -mt-1 text-[13px] leading-[1.9]">
          <RubyText showFurigana={showFurigana}>{sub}</RubyText>
        </div>
      )}
    </div>
  );
};

/** Nexmax with a speech bubble. The bubble text is furigana notation. */
export const NexmaxSays = ({
  text,
  pose = 'guide',
  size = 88,
  flip = false,
}: {
  text: string;
  pose?: 'guide' | 'cheer' | 'hello' | 'nexmax' | 'book' | 'build';
  size?: number;
  flip?: boolean;
}) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  return (
    <div className={`flex shrink-0 items-end gap-1 ${flip ? 'flex-row-reverse' : ''}`}>
      <motion.div
        key={text}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-8 w-max max-w-[128px] rounded-2xl border-2 border-[#2f8fe0] bg-white px-3 py-1.5 text-center text-[13px] leading-snug font-black text-[#1b4f8a] shadow-md"
      >
        <RubyText showFurigana={showFurigana}>{text}</RubyText>
      </motion.div>
      <motion.img
        src={assetPath(`img/chara/cut/${pose}.webp`)}
        alt=""
        aria-hidden
        style={{ width: size, filter: 'drop-shadow(0 4px 6px rgba(0,40,90,0.3))' }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

export type TabId = 'story' | 'kanji' | 'items' | 'settings';

/** The four tabs of the reference screens: ストーリー / 漢字ずかん / もちもの / せってい. */
export const BottomTabs = ({ current }: { current: TabId }) => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const cleared = useGameStore((s) => s.clearedStages);
  const tabs: { id: TabId; label: string; icon: IconType; to: string; feature?: Feature }[] = [
    { id: 'story', label: 'ストーリー', icon: GiTreasureMap, to: mapPath },
    { id: 'kanji', label: '漢字(かんじ)ずかん', icon: GiOpenBook, to: '/words', feature: Feature.WORDS },
    // そうび opens from the start: 0話 already hands over the first blade.
    { id: 'items', label: 'そうび', icon: GiBackpack, to: '/equip' },
    { id: 'settings', label: 'せってい', icon: GiCog, to: '/settings' },
  ];
  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-30 flex justify-center px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]"
      style={{
        background:
          'repeating-linear-gradient(178deg, rgba(255,255,255,0.05) 0 3px, rgba(0,0,0,0.05) 3px 7px), linear-gradient(180deg, #8a5a2c 0%, #5e3814 100%)',
        borderTop: '3px solid #c9953f',
        boxShadow: 'inset 0 2px 0 rgba(255,220,160,0.35), 0 -6px 16px rgba(20,10,0,0.35)',
      }}
    >
      <div className="flex w-full max-w-md gap-1.5">
        {tabs.map((t) => {
          const on = t.id === current;
          // One system opens per stage (docs/design/06 §4). A tab that is not
          // open yet stays visible, says when it opens, and does nothing.
          const locked = t.feature ? !isFeatureUnlocked(t.feature, cleared) : false;
          const opensAt = t.feature ? UNLOCKED_BY[t.feature].replace('mukashi-', '') : '';
          const Icon = locked ? GiPadlock : t.icon;
          return (
            <motion.button
              key={t.id}
              type="button"
              disabled={locked}
              whileTap={locked ? undefined : { scale: 0.94 }}
              aria-label={locked ? `${opensAt}わで ひらく` : undefined}
              onClick={() => navigate(t.to)}
              aria-current={on ? 'page' : undefined}
              className="relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-[11px] leading-tight font-black"
              style={{
                background: on
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%), linear-gradient(180deg, #ffd24a 0%, #f59a12 100%)'
                  : 'linear-gradient(180deg, #fff3d6 0%, #ecd3a0 100%)',
                borderColor: on ? '#fff5c4' : '#b88a4a',
                color: on ? '#fff' : '#6b4418',
                boxShadow: on ? '0 0 14px rgba(255,214,90,0.85), 0 3px 0 #a55e00' : '0 3px 0 #4a2c0e',
                textShadow: on ? '0 1px 0 #9a4f00, 1px 0 0 #9a4f00, -1px 0 0 #9a4f00' : 'none',
                opacity: locked ? 0.65 : 1,
                transform: on ? 'translateY(-4px)' : undefined,
              }}
            >
              <Icon aria-hidden size={24} style={{ filter: on ? 'drop-shadow(0 1px 0 #9a4f00)' : undefined }} />
              <RubyText showFurigana={showFurigana}>{locked ? `${opensAt}話(わ)で ひらく` : t.label}</RubyText>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
