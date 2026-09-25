import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Arc, LEVEL_OF_ARC } from '../../types/kanji';
import { RubyText } from '../../components/ui/Ruby';
import { BottomTabs, LogoTitle, NexmaxSays } from '../../components/ui/Chrome';
import { useGameStore } from '../../store/gameStore';
import { stagesOfArc } from '../../data/stages';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import PictureBook from '../picturebook/PictureBook';

/**
 * 世界を えらぶ — the three worlds (public/img/design/n5ことばの冒険ワールド選択画面.png).
 * The reference is titled 「N5をえらぶ」, but the three arcs are N5 / N4 / N3,
 * so the title names the worlds and each card carries its own level.
 *
 * 文字が 消えた 町 (08) sits on top as the new route; the three picture-book
 * worlds below it are kept as they were. 未来編 stays on the page, marked as
 * not ready, so the learner can see where the road goes.
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

export const ArcSelect = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const cleared = useGameStore((s) => s.clearedStages);

  return (
    <div className="isolate relative min-h-dvh pb-28">
      <PictureBook scene="mukashi_meadow" className="!fixed -z-10" />
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
          const total = w.arc === Arc.MOJI ? MOJI_CHAPTERS.length : w.ready ? stagesOfArc(w.arc).length : 10;
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
                    {w.fresh ? <RubyText showFurigana={showFurigana}>字(じ)</RubyText> : '？'}
                  </div>
                )}
                {w.fresh && (
                  <span className="absolute bottom-2 left-2 rounded-lg border-2 border-white bg-[#e2453c] px-2 py-0.5 text-xs font-black text-white shadow">
                    あたらしい
                  </span>
                )}
                <div className="absolute top-2 left-2 rounded-xl border-2 border-[#caa468] bg-[#fdf4dd] px-3 py-0.5 shadow">
                  <h2 className="text-2xl font-black" style={{ color: w.tint }}>
                    <RubyText showFurigana={showFurigana}>{w.title}</RubyText>
                  </h2>
                </div>
                <span className="absolute top-2 right-2 rounded-lg border-2 border-white bg-[#23456e]/85 px-2 py-0.5 text-xs font-black text-white tabular-nums">
                  ♛ {w.arc === Arc.MOJI ? 'N5〜N3' : LEVEL_OF_ARC[w.arc]} {done}/{total}
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
