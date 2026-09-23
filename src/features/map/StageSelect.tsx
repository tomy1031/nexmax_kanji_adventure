import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { stagesOfArc, isStageUnlocked, type StageDef } from '../../data/stages';
import { Arc } from '../../types/kanji';
import { RubyText } from '../../components/ui/Ruby';
import { BottomTabs } from '../../components/ui/Chrome';
import GearHint from '../../components/ui/GearHint';
import { assetPath } from '../../lib/assetPath';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { kanjiRuby } from '../../lib/reading';
import { toDataUrl } from '../picturebook/paper';
import PictureBook from '../picturebook/PictureBook';
import { useGameStore } from '../../store/gameStore';
import { isVersusConfigured } from '../../lib/supabaseClient';
import { Feature, FEATURE_INTRO, isFeatureUnlocked } from '../../data/unlocks';
import { MAP_H, MAP_W, NODE_POS, mapSvg } from './mapArt';

/**
 * むかし編 ステージ選択 (public/img/design/むかし編_村のたのみステージ選択.png).
 *
 * One climb, bottom to top: 0話 at the village gate, 10話 at the top of the
 * great tree. Tapping a stone opens its card at the bottom, and the card
 * offers the two ways in (2026-09-23): 漢字(かんじ)れんしゅう, or
 * ストーリー（バトル）.
 *
 * Locked stages stay visible with their title hidden — the learner can see
 * how far the road goes without being told what happens next.
 */

const MAP_URL = toDataUrl(mapSvg());

type Choice = { kind: 'intro' } | { kind: 'stage'; stage: StageDef };

export const StageSelect = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cleared = useGameStore((s) => s.clearedStages);
  const gems = useGameStore((s) => s.gems);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const seenIntro = useGameStore((s) => s.tutorials.intro);

  const stages = stagesOfArc(Arc.MUKASHI);
  const owned = Object.values(progress).filter((p) => p.obtainedAt != null).length;

  // What is selected at first: the stage named in the URL, else the next
  // stage to play, else 0話 for someone who has not seen it.
  const initial = useMemo<Choice>(() => {
    const named = stages.find((s) => s.id === params.get('stage'));
    if (named) return { kind: 'stage', stage: named };
    if (!seenIntro && !cleared.length) return { kind: 'intro' };
    const next = stages.find((s) => isStageUnlocked(s, cleared) && !cleared.includes(s.id));
    return { kind: 'stage', stage: next ?? stages[stages.length - 1] };
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [pick, setPick] = useState<Choice>(initial);

  // Bring the selected stone into view on arrival.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = initial.kind === 'intro' ? 0 : initial.stage.order;
    const mapHeight = (el.scrollWidth / MAP_W) * MAP_H;
    const y = (NODE_POS[idx][1] / MAP_H) * mapHeight;
    el.scrollTop = Math.max(0, y - el.clientHeight * 0.4);
  }, [initial]);

  const extras = (
    [
      { f: Feature.FORGE, icon: '⚒' },
      { f: Feature.DAILY, icon: '✓' },
      { f: Feature.GACHA, icon: '◆' },
      ...(isVersusConfigured ? [{ f: Feature.VERSUS, icon: '⚔' }] : []),
    ] as const
  ).filter(({ f }) => isFeatureUnlocked(f, cleared));

  const nodeButton = (idx: number, label: string, title: string, unlocked: boolean, done: boolean, onPick: () => void, selected: boolean) => {
    const [x, y] = NODE_POS[idx];
    return (
      <div
        key={idx}
        className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
        style={{ left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%`, flexDirection: x > 200 ? 'row' : 'row-reverse' }}
      >
        <motion.button
          type="button"
          disabled={!unlocked}
          onClick={onPick}
          aria-pressed={selected}
          aria-label={unlocked ? label : `${label} まだ ひらいて いません`}
          className="relative flex h-14 w-14 items-center justify-center rounded-full text-lg font-black"
          style={{
            background: unlocked
              ? 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e8e2d4 45%, #b9ad97 100%)'
              : 'radial-gradient(circle at 35% 30%, #d6d6d6 0%, #9a9a9a 100%)',
            border: selected ? '4px solid #ffd24a' : '3px solid #fffaf0',
            boxShadow: selected ? '0 0 18px rgba(255,210,90,0.95), 0 4px 0 #7a6a50' : '0 4px 0 #7a6a50',
            color: '#4a3220',
          }}
          animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={selected ? { duration: 1.4, repeat: Infinity } : undefined}
        >
          {unlocked ? label.split('-').pop() : '🔒'}
          {done && (
            <span className="absolute -top-2 -right-1 text-base" style={{ color: '#f2a91a', textShadow: '0 1px 0 #7a4a00' }} aria-hidden>
              ★
            </span>
          )}
        </motion.button>
        <div className="g-wood max-w-[140px] truncate px-2 py-0.5 text-[11px] leading-snug font-black">
          <span className="mr-1 tabular-nums">{label}</span>
          {unlocked ? <RubyText showFurigana={showFurigana}>{title}</RubyText> : '？？？'}
        </div>
        {selected && (
          <motion.img
            src={assetPath('img/chara/cut/guide.webp')}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -top-14 h-14 w-auto"
            style={{ [x > 200 ? 'left' : 'right']: -8 }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
      </div>
    );
  };

  const stage = pick.kind === 'stage' ? pick.stage : null;
  const stageKanji = stage ? stage.kanji.map((c) => getKanjiByChar(c)).filter((k) => k != null) : [];
  const ownedHere = stageKanji.filter((k) => progress[k.id]?.obtainedAt != null).length;

  return (
    <div className="relative h-dvh overflow-hidden bg-[#bfe6fb]">
      {/* 上: ステータス ---------------------------------------------------- */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center gap-1.5 px-2 pt-[max(8px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate('/map')}
          className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-[#bfe6fb]"
          aria-label="せかいを えらぶ"
        >
          <img src={assetPath('img/chara/cut/nexmax.webp')} alt="" className="h-full w-full object-contain" />
        </button>
        <span className="flex h-8 items-center gap-1 rounded-full border-2 border-white bg-[#23456e]/85 px-2.5 text-sm font-black text-white">
          <span style={{ color: '#ffd24a' }}>◆</span>
          <span className="tabular-nums">{gems}</span>
        </span>
        <span className="flex h-8 items-center gap-1 rounded-full border-2 border-white bg-[#23456e]/85 px-2.5 text-sm font-black text-white">
          <RubyText showFurigana={showFurigana}>字(じ)</RubyText>
          <span className="tabular-nums">{owned}</span>
        </span>
        <span className="ml-auto flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-full border-2 border-white bg-[#23456e]/85 px-2.5 text-xs font-black text-white">
          <span style={{ color: '#8fd0ff' }}>♛</span>N5
          <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/25">
            <span className="block h-full rounded-full bg-[#5cc0ff]" style={{ width: `${(cleared.filter((c) => c.startsWith('mukashi')).length / stages.length) * 100}%` }} />
          </span>
          <span className="tabular-nums">
            {cleared.filter((c) => c.startsWith('mukashi')).length}/{stages.length}
          </span>
        </span>
      </header>

      {/* 地図（縦に スクロール） -------------------------------------------- */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto overscroll-contain pb-[250px]">
        <div className="relative mx-auto w-full max-w-md" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
          <img src={MAP_URL} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none" />

          <div className="g-parchment absolute top-16 left-3 z-20 px-3 py-2">
            <p className="text-2xl leading-tight font-black">
              <RubyText showFurigana={showFurigana}>むかし編(へん)</RubyText>
            </p>
            <p className="g-wood mt-1 px-2 text-xs font-black">
              <RubyText showFurigana={showFurigana}>ステージ選択(せんたく)</RubyText>
            </p>
            <p className="mt-1 text-[11px] leading-snug font-bold">
              <RubyText showFurigana={showFurigana}>漢字(かんじ)の 力(ちから)で 村(むら)を たすけよう</RubyText>
            </p>
          </div>

          {nodeButton(0, '0', 'はじめの 一歩(いっぽ)', true, seenIntro, () => setPick({ kind: 'intro' }), pick.kind === 'intro')}
          {stages.map((s) =>
            nodeButton(
              s.order,
              `1-${s.order}`,
              s.title,
              isStageUnlocked(s, cleared),
              cleared.includes(s.id),
              () => setPick({ kind: 'stage', stage: s }),
              pick.kind === 'stage' && pick.stage.id === s.id,
            ),
          )}
        </div>
      </div>

      {/* ひらいた 機能（右の 丸ボタン） ----------------------------------- */}
      {extras.length > 0 && (
        <div className="absolute top-16 right-2 z-30 flex flex-col gap-2">
          {extras.map(({ f, icon }) => (
            <button
              key={f}
              type="button"
              onClick={() => navigate(FEATURE_INTRO[f].to)}
              className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-white text-[10px] leading-tight font-black text-white"
              style={{ background: 'linear-gradient(180deg,#5cc0ff,#1d6fc4)', boxShadow: '0 3px 0 #15529a' }}
            >
              <span aria-hidden className="text-base leading-none">
                {icon}
              </span>
              <RubyText showFurigana={showFurigana}>{FEATURE_INTRO[f].label}</RubyText>
            </button>
          ))}
        </div>
      )}

      {/* 下: えらんだ ステージ -------------------------------------------- */}
      <div className="absolute inset-x-0 bottom-[74px] z-30 px-2.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={pick.kind === 'intro' ? 'intro' : pick.stage.id}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="g-parchment mx-auto max-w-md p-2.5"
          >
            <div className="flex gap-2.5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow">
                <PictureBook scene={stage?.bg ?? 'mukashi_village'} fx={stage ? [] : ['stones']} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base leading-snug font-black">
                  <span className="mr-1.5 tabular-nums">{stage ? `1-${stage.order}` : '0'}</span>
                  <RubyText showFurigana={showFurigana}>{stage ? stage.title : 'はじめの 一歩(いっぽ)'}</RubyText>
                  {stage && cleared.includes(stage.id) && (
                    <span className="ml-1" style={{ color: '#f2a91a' }}>
                      ★
                    </span>
                  )}
                </p>
                <p className="line-clamp-3 text-[12px] leading-[1.9] whitespace-pre-line" style={{ color: 'var(--ink-2)' }}>
                  <RubyText showFurigana={showFurigana}>
                    {stage
                      ? stage.summary
                      : '村(むら)の 入口(いりぐち)を ふさぐ 石(いし)。\n字(じ)を 書(か)いて、石(いし)を 切(き)って みよう。'}
                  </RubyText>
                </p>
              </div>
            </div>

            {stage && (
              <div className="mt-1.5">
                <p className="text-[11px] font-black">
                  <RubyText showFurigana={showFurigana}>{`出(で)て くる 漢字(かんじ)（持(も)っている ${ownedHere} / ${stageKanji.length}）`}</RubyText>
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {stageKanji.map((k) => {
                    const have = progress[k.id]?.obtainedAt != null;
                    return (
                      <span
                        key={k.id}
                        className="flex min-w-[34px] items-center justify-center rounded-md border px-1 text-[17px] leading-[1.75] font-black"
                        style={{
                          background: have ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : '#fffaf0',
                          borderColor: have ? '#f2b53a' : 'rgba(122,82,38,0.3)',
                        }}
                      >
                        <RubyText showFurigana={showFurigana}>{kanjiRuby(k)}</RubyText>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {stage && (
              <div className="mt-1.5">
                <GearHint stageId={stage.id} />
              </div>
            )}

            <div className="mt-2 flex gap-2">
              {stage ? (
                <>
                  <button
                    type="button"
                    className="g-btn g-btn-accent flex-1 !px-2 text-[13px] leading-tight whitespace-nowrap"
                    onClick={() => navigate(`/stage/${stage.id}?mode=practice`)}
                  >
                    <span aria-hidden>✎</span>
                    <RubyText showFurigana={showFurigana}>漢字(かんじ)れんしゅう</RubyText>
                  </button>
                  <button
                    type="button"
                    className="g-btn g-btn-primary flex-[1.25] !px-2 text-[13px] leading-tight whitespace-nowrap"
                    onClick={() => navigate(`/stage/${stage.id}?mode=story`)}
                  >
                    <span aria-hidden>▶</span>
                    <RubyText showFurigana={showFurigana}>ストーリー（バトル）</RubyText>
                  </button>
                </>
              ) : (
                <button type="button" className="g-btn g-btn-primary flex-1 text-lg" onClick={() => navigate('/tutorial')}>
                  <span aria-hidden>▶</span>スタート
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomTabs current="story" />
    </div>
  );
};

export default StageSelect;
