import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Arc, LEVEL_OF_ARC } from '../../types/kanji';
import { RubyText } from '../../components/ui/Ruby';
import { BottomTabs, LogoTitle, NexmaxSays } from '../../components/ui/Chrome';
import { useGameStore } from '../../store/gameStore';
import { stagesOfArc } from '../../data/stages';
import PictureBook from '../picturebook/PictureBook';

/**
 * 世界を えらぶ — the three worlds (public/img/design/n5ことばの冒険ワールド選択画面.png).
 * The reference is titled 「N5をえらぶ」, but the three arcs are N5 / N4 / N3,
 * so the title names the worlds and each card carries its own level.
 *
 * Only むかし編 is playable. The other two stay on the page, marked as not
 * ready, so the learner can see where the road goes.
 */

const WORLDS: {
  arc: Arc;
  title: string;
  blurb: string;
  words: string[];
  ready: boolean;
  /** Picture-book scene; the arcs not written yet have none. */
  scene?: string;
  tint: string;
}[] = [
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
    blurb: 'インターネットで 夢(ゆめ)を 信(しん)じた ネクマックス。\nまちの くらしで よく 使(つか)う 字(じ)を 学(まな)ぼう。',
    words: ['学校(がっこう)', '会社(かいしゃ)', '駅(えき)', '仕事(しごと)'],
    ready: false,
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

export const ArcSelect = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const cleared = useGameStore((s) => s.clearedStages);

  return (
    <div className="g-sky pb-28">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-3 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="relative">
          <LogoTitle size={30} sub="ことばを 学(まな)んで 冒険(ぼうけん)しよう！">
            世界(せかい)を えらぶ
          </LogoTitle>
          <div className="absolute -top-1 -right-1">
            <NexmaxSays text="どれに する？" pose="hello" size={48} />
          </div>
        </div>

        {WORLDS.map((w, i) => {
          const total = w.ready ? stagesOfArc(w.arc).length : 10;
          const done = cleared.filter((c) => c.startsWith(w.arc)).length;
          return (
            <motion.section
              key={w.arc}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="g-parchment relative overflow-hidden p-0"
              style={{ opacity: w.ready ? 1 : 0.8 }}
            >
              <div className="relative h-36">
                {w.scene ? (
                  <PictureBook scene={w.scene} />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/70"
                    style={{ background: `linear-gradient(160deg, ${w.tint}cc, ${w.tint}55)` }}
                  >
                    ？
                  </div>
                )}
                <div className="absolute top-2 left-2 rounded-xl border-2 border-[#caa468] bg-[#fdf4dd] px-3 py-0.5 shadow">
                  <h2 className="text-2xl font-black" style={{ color: w.tint }}>
                    <RubyText showFurigana={showFurigana}>{w.title}</RubyText>
                  </h2>
                </div>
                <span className="absolute top-2 right-2 rounded-lg border-2 border-white bg-[#23456e]/85 px-2 py-0.5 text-xs font-black text-white tabular-nums">
                  ♛ {LEVEL_OF_ARC[w.arc]} {done}/{total}
                </span>
              </div>

              <div className="px-3 pt-2 pb-3">
                <p className="text-[13px] leading-[1.95] whitespace-pre-line">
                  <RubyText showFurigana={showFurigana}>{w.blurb}</RubyText>
                </p>
                <p className="mt-1 text-[11px] font-black" style={{ color: 'var(--ink-2)' }}>
                  <RubyText showFurigana={showFurigana}>学(まな)べる ことばの 例(れい)</RubyText>
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  {w.words.map((word) => (
                    <span key={word} className="rounded-md border border-[#caa468] bg-white/80 px-2 text-sm leading-[1.9] font-black">
                      <RubyText showFurigana={showFurigana}>{word}</RubyText>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!w.ready}
                  className="g-btn g-btn-primary mt-2.5 w-full text-base"
                  onClick={() => navigate(`/map/${w.arc}`)}
                >
                  {w.ready ? (
                    <>
                      <span aria-hidden>▶</span>
                      <RubyText showFurigana={showFurigana}>この 世界(せかい)で 冒険(ぼうけん)する</RubyText>
                    </>
                  ) : (
                    <RubyText showFurigana={showFurigana}>じゅんび中(ちゅう)</RubyText>
                  )}
                </button>
              </div>
            </motion.section>
          );
        })}

        <p className="g-wood mx-auto px-4 py-1 text-center text-xs font-black">
          <RubyText showFurigana={showFurigana}>まなぶほど、つよく なる。ことばで 世界(せかい)は つながって いる。</RubyText>
        </p>
      </div>
      <BottomTabs current="story" />
    </div>
  );
};

export default ArcSelect;
