import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Arc, LEVEL_OF_ARC } from '../../types/kanji';
import { RubyText } from '../../components/ui/Ruby';
import { BottomTabs, LogoTitle } from '../../components/ui/Chrome';
import { useGameStore } from '../../store/gameStore';
import { stagesOfArc } from '../../data/stages';
import { KANA_EPISODES } from '../../data/kana';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { LogoText } from '../../components/ui/LogoText';
import { assetPath } from '../../lib/assetPath';
import PictureBook from '../picturebook/PictureBook';

/**
 * 世界を えらぶ — the three worlds (public/img/design/n5ことばの冒険ワールド選択画面.png).
 * The reference is titled 「N5をえらぶ」, but the three arcs are N5 / N4 / N3,
 * so the title names the worlds and each card carries its own level.
 *
 * 文字が 消えた 町 (08) is the one big card (08 §10.2,「前面に」); the three
 * picture-book worlds are folded under ほかの 物語 as small rows — their
 * content and progress unchanged. 未来編 stays listed, marked じゅんび中.
 */

const WORLDS: {
  arc: Arc;
  title: string;
  blurb: string;
  words: string[];
  ready: boolean;
  /** Shown as あたらしい. */
  fresh?: boolean;
  /** Picture-book scene; the arcs not written yet have none. */
  scene?: string;
  tint: string;
}[] = [
  {
    arc: Arc.MOJI,
    title: '文字(もじ)が 消(き)えた 町(まち)',
    blurb: '町(まち)から 字(じ)が 消(き)えた！\nネクマックスと いっしょに、書(か)いて 取(と)り戻(もど)そう。',
    words: ['名前(なまえ)', '駅(えき)', '時間(じかん)', '店(みせ)'],
    ready: true,
    fresh: true,
    tint: '#d9772b',
  },
  {
    arc: Arc.MUKASHI,
    title: 'むかし編(へん)',
    blurb: 'むかしの 村(むら)で、山(やま)や 川(かわ)と いっしょに 字(じ)を 学(まな)ぼう。\n書(か)いた 字(じ)が きみの 力(ちから)に なる！',
    words: ['山(やま)', '村(むら)', '人(ひと)', '天気(てんき)'],
    ready: true,
    scene: 'mukashi_village',
    tint: '#5a8f3c',
  },
  {
    arc: Arc.GENDAI,
    title: '現代編(げんだいへん)',
    blurb: '夢(ゆめ)を 信(しん)じて 会社(かいしゃ)に 入(はい)った ネクマックス。\n知(し)らない 場所(ばしょ)で、なかまと 言葉(ことば)を 学(まな)ぼう。',
    words: ['会社(かいしゃ)', '仕事(しごと)', '研究(けんきゅう)', '家族(かぞく)'],
    ready: true,
    scene: 'gendai_hall',
    tint: '#2f6fb0',
  },
  {
    arc: Arc.MIRAI,
    title: '未来編(みらいへん)',
    blurb: '家庭用(かていよう)ロボットに なった 時代(じだい)の 話(はなし)。\n新(あたら)しい 世界(せかい)の ことばを 学(まな)ぼう。',
    words: ['世界(せかい)', '夢(ゆめ)', '未来(みらい)', '研究(けんきゅう)'],
    ready: false,
    tint: '#6a4fb0',
  },
];

/** The new route, as the one big card (08 §10.2). */
const MojiHero = ({ showFurigana }: { showFurigana: boolean }) => {
  const navigate = useNavigate();
  const cleared = useGameStore((s) => s.clearedStages);
  const w = WORLDS[0];
  const eps = [...KANA_EPISODES.map((e) => e.id), ...MOJI_EPISODES.map((e) => e.id)];
  const done = eps.filter((id) => cleared.includes(id)).length;
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[22px] border-[3px] border-[#ffd86a] text-white shadow-[0_10px_28px_rgba(20,10,60,0.45)]"
      style={{ background: 'radial-gradient(ellipse at 70% 10%, #3b4aa8 0%, #1c1f52 55%, #0c0d24 100%)' }}
    >
      {/* Letters of light, as in the prologue. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {HERO_LETTERS.map((l) => (
          <span
            key={l.ch}
            className="absolute font-black"
            style={{ left: `${l.x}%`, top: `${l.y}%`, fontSize: l.s, color: '#fff8d6', opacity: 0.55, textShadow: '0 0 12px rgba(255,210,90,0.9)' }}
          >
            {l.ch}
          </span>
        ))}
      </div>
      <img
        src={assetPath('img/chara/cut/hello.webp')}
        alt=""
        aria-hidden
        className="absolute right-1 bottom-24 h-32 w-auto"
      />
      <div className="relative px-4 pt-4 pb-4">
        <span className="rounded-md bg-[#e2453c] px-2 py-0.5 text-[11px] font-black">
          <RubyText showFurigana={showFurigana}>あたらしい ・ みんなの 日本語(にほんご) じゅん</RubyText>
        </span>
        <h2 className="mt-2 text-[30px] leading-[1.5]">
          <LogoText showFurigana={showFurigana}>{w.title}</LogoText>
        </h2>
        <p className="mt-1 w-[68%] text-[13px] leading-[1.95] font-bold whitespace-pre-line text-white/90">
          <RubyText showFurigana={showFurigana}>{w.blurb}</RubyText>
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs font-black">
          <span className="rounded-md bg-white/15 px-2 py-0.5 tabular-nums">♛ N5〜N3 ・ {done}/{eps.length}</span>
          <button type="button" className="underline" onClick={() => navigate('/prologue')} lang="en">
            ▶ Prologue
          </button>
        </div>
        <button type="button" className="g-btn g-btn-primary g-shine mt-3 w-full text-xl" onClick={() => navigate('/map/moji')}>
          <span aria-hidden>▶</span>
          <RubyText showFurigana={showFurigana}>{done ? 'つづける' : 'はじめる'}</RubyText>
        </button>
      </div>
    </motion.section>
  );
};

const HERO_LETTERS = [
  { ch: 'あ', x: 62, y: 8, s: 30 },
  { ch: 'カ', x: 84, y: 20, s: 22 },
  { ch: 'う', x: 74, y: 36, s: 20 },
  { ch: 'ネ', x: 90, y: 4, s: 18 },
  { ch: 'き', x: 52, y: 28, s: 16 },
];

export const ArcSelect = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const cleared = useGameStore((s) => s.clearedStages);
  const [others, setOthers] = useState(false);

  return (
    <div className="isolate relative min-h-dvh pb-28">
      <PictureBook scene="mukashi_meadow" className="!fixed -z-10" still />
      <div className="mx-auto flex max-w-md flex-col gap-4 px-3 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="relative">
          <LogoTitle size={30} sub="ことばを 学(まな)んで 冒険(ぼうけん)しよう！">
            物語(ものがたり)を えらぶ
          </LogoTitle>
        </div>

        <MojiHero showFurigana={showFurigana} />

        {/* The picture-book worlds, kept as they were but tucked away. */}
        <button
          type="button"
          aria-expanded={others}
          className="g-parchment mx-auto flex items-center gap-2 !rounded-full px-4 py-1.5 text-sm font-black"
          onClick={() => setOthers((o) => !o)}
        >
          <RubyText showFurigana={showFurigana}>ほかの 物語(ものがたり)（むかし編(へん)・現代編(げんだいへん)）</RubyText>
          <span aria-hidden>{others ? '▲' : '▼'}</span>
        </button>

        <AnimatePresence initial={false}>
          {others && (
            <motion.ul
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-2"
            >
              {WORLDS.slice(1).map((w) => {
                const total = w.ready ? stagesOfArc(w.arc).length : 10;
                const done = cleared.filter((c) => c.startsWith(w.arc)).length;
                return (
                  <li key={w.arc}>
                    <button
                      type="button"
                      disabled={!w.ready}
                      onClick={() => navigate(`/map/${w.arc}`)}
                      className="g-parchment flex w-full items-center gap-3 !rounded-2xl px-3 py-2 text-left disabled:opacity-60"
                    >
                      <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: w.tint }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-black" style={{ color: w.tint }}>
                          <RubyText showFurigana={showFurigana}>{w.title}</RubyText>
                        </span>
                        <span className="block text-[11px] font-bold" style={{ color: 'var(--ink-2)' }}>
                          {LEVEL_OF_ARC[w.arc]} ・{' '}
                          {w.ready ? `${done}/${total}` : <RubyText showFurigana={showFurigana}>じゅんび中(ちゅう)</RubyText>}
                        </span>
                      </span>
                      {w.ready && <span aria-hidden>▶</span>}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <BottomTabs current="story" />
    </div>
  );
};

export default ArcSelect;
