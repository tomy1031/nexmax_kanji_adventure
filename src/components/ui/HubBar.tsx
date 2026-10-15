import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from './Ruby';
import { assetPath } from '../../lib/assetPath';
import * as sfx from '../../lib/sfx';
import { markSeen, readSeen } from '../../lib/featureSeen';
import { isVersusConfigured } from '../../lib/versusConfig';
import { Feature, UNLOCKED_ON_MOJI, isFeatureUnlocked } from '../../data/unlocks';
import { getMojiEpisode } from '../../data/mojiEpisodes';
import { getMojiFinale } from '../../data/mojiFinale';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { useGameStore } from '../../store/gameStore';
import { useGachaCall } from './hubBarParts';

/**
 * 下の バー (docs/design/23 §3.2, 2026-10-15「フッターの内容やガチャの表示箇所など、動線があまり使いにくい」):
 * one bar on every hub-level screen, five places, the stage in the middle.
 *
 *   もちもの ・ ガチャ ・ ステージ（ハブ）・ ずかん ・ たいせん
 *
 * A place not open yet is shown locked (grey, a padlock) and says after which
 * episode it opens; a place just opened wears NEW until it is first tapped
 * (lib/featureSeen.ts); the gacha wears its red 「むりょう／チケット／★5／できます」.
 * The icons are pictures without letters (Codex, img/nav/*.webp): the names
 * are drawn here, under them.
 */

type Slot = 'items' | 'gacha' | 'stage' | 'zukan' | 'versus';

interface SlotDef {
  id: Slot;
  icon: string;
  label: string;
  path: string;
  feature?: Feature;
  /** The paths that light this slot as the current one. */
  here: RegExp;
}

const SLOTS: SlotDef[] = [
  { id: 'items', icon: 'img/nav/items.webp', label: 'もちもの', path: '/equip', here: /^\/(equip|forge|kana-forge)/ },
  { id: 'gacha', icon: 'img/nav/gacha.webp', label: 'ガチャ', path: '/gacha', feature: Feature.GACHA, here: /^\/gacha/ },
  { id: 'stage', icon: 'img/nav/stage.webp', label: 'ステージ', path: '/map/moji', here: /^\/(map\/moji|daily|titles)/ },
  { id: 'zukan', icon: 'img/nav/zukan.webp', label: 'ずかん', path: '/zukan', here: /^\/(zukan|words|collection)/ },
  { id: 'versus', icon: 'img/nav/versus.webp', label: 'たいせん', path: '/versus', feature: Feature.VERSUS, here: /^\/versus/ },
];

/** Where an episode id sits, in furigana notation: 「1章(しょう) 4話(わ)」, a boss 「1章(しょう) まとめの ボス」. */
const episodeLabel = (id: string): string => {
  const ep = getMojiEpisode(id);
  if (ep) return `${MOJI_CHAPTERS.find((c) => c.id === ep.chapter)?.order ?? ''}章(しょう) ${ep.order}話(わ)`;
  const f = getMojiFinale(id);
  if (f) return `${MOJI_CHAPTERS.find((c) => c.id === f.chapter)?.order ?? ''}章(しょう) まとめの ボス`;
  return '';
};

/** `onStage`: what ステージ does on the hub itself (close the episode sheet); elsewhere it goes to the hub. */
export const HubBar = ({ className = '', onStage }: { className?: string; onStage?: () => void }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const cleared = useGameStore((s) => s.clearedStages);
  const gachaCall = useGachaCall();
  const [seen, setSeen] = useState(readSeen);
  const [locked, setLocked] = useState<{ n: number; text: string } | null>(null);

  const slots = SLOTS;
  return (
    <nav
      aria-label="メニュー"
      className={`fixed inset-x-0 bottom-0 z-30 ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', background: 'linear-gradient(180deg, #3a2414 0%, #1c1009 100%)', borderTop: '3px solid #c9a052', boxShadow: '0 -6px 18px rgba(0,0,0,0.45)' }}
    >
      <ul className="mx-auto flex h-[76px] w-full max-w-[min(100%,56dvh)] min-w-0 items-end justify-around px-1">
        {slots.map((s) => {
          // A build without the relay (a local copy only): たいせん stays in its place, locked.
          const offline = s.id === 'versus' && !isVersusConfigured;
          const open = !offline && (!s.feature || isFeatureUnlocked(s.feature, cleared));
          const current = s.here.test(pathname);
          const fresh = open && s.feature != null && !seen.includes(s.feature);
          const badge = s.id === 'gacha' && open ? gachaCall : null;
          const big = s.id === 'stage';
          return (
            <li key={s.id} className="relative flex flex-1 justify-center">
              <motion.button
                type="button"
                data-tap
                aria-current={current ? 'page' : undefined}
                aria-label={`${s.label}${open ? '' : '（まだ）'}`}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  if (!open && s.feature) {
                    sfx.tap();
                    setLocked({ n: Date.now(), text: offline ? 'いまは つかえません' : `${episodeLabel(UNLOCKED_ON_MOJI[s.feature])}の あとで ひらきます` });
                    return;
                  }
                  if (s.id === 'stage' && current && onStage) {
                    sfx.tap();
                    onStage();
                    return;
                  }
                  sfx.tap();
                  if (s.feature) {
                    markSeen(s.feature);
                    setSeen(readSeen());
                  }
                  if (!current || pathname !== s.path) navigate(s.path);
                }}
                className="relative flex flex-col items-center"
                style={{ marginTop: big ? -26 : 0 }}
              >
                {current && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{ width: big ? 74 : 56, height: big ? 74 : 56, background: 'radial-gradient(circle, rgba(255,214,110,0.75), rgba(255,180,60,0.2) 60%, transparent 72%)' }}
                  />
                )}
                <img
                  src={assetPath(s.icon)}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="relative object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.55)] select-none"
                  style={{ width: big ? 70 : 50, height: big ? 70 : 50, filter: open ? undefined : 'grayscale(0.9) brightness(0.6)' }}
                />
                {!open && <img src={assetPath('img/nav/lock.webp')} alt="" aria-hidden className="absolute top-[26px] right-[-4px] h-6 w-6 object-contain" />}
                <span
                  className="relative mt-0.5 text-[11px] leading-tight font-black whitespace-nowrap"
                  style={{ color: current ? '#ffd36a' : open ? '#fff1cf' : 'rgba(255,241,207,0.5)', textShadow: '0 1px 2px #000' }}
                >
                  <RubyText showFurigana={showFurigana}>{s.label}</RubyText>
                </span>
                {(badge || fresh) && (
                  <span className="absolute -top-1 right-[-10px] rounded-md bg-[#e2453c] px-1 text-[10px] leading-[1.6] font-black whitespace-nowrap text-white shadow">
                    {badge ?? 'NEW'}
                  </span>
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
      <AnimatePresence>
        {locked && (
          <motion.p
            key={locked.n}
            role="status"
            className="absolute inset-x-0 -top-12 mx-auto w-fit rounded-full border-2 border-[#c9a052] bg-[#1b1640]/95 px-4 py-1 text-sm font-black text-[#ffe7b8]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setLocked((l) => (l?.n === locked.n ? null : l)), 1800)}
          >
            🔒 <RubyText showFurigana={showFurigana}>{locked.text}</RubyText>
          </motion.p>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default HubBar;
