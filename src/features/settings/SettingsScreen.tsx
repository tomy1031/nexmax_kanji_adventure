import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useSafeBack } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { NightStreetBackdrop } from '../write/NightStreet';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { RubyText } from '../../components/ui/Ruby';
import { buildLabel } from '../../lib/appUpdate';

/** Set once the debug screen has been found; it then has a button here. */
const DEBUG_KEY = 'nexmax-debug';
const TAPS_TO_DEBUG = 7;
const debugFound = (): boolean => {
  try {
    return localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Settings, and the credits the asset licences require.
 *
 * Every row also carries a picture and a short English line: this is the
 * screen a player who cannot read Japanese yet opens to make the game
 * readable, and the one place where a wrong tap (データを 消す) cannot be
 * taken back. The story keeps English behind EN; the controls do not.
 */
export const SettingsScreen = () => {
  const navigate = useNavigate();
  const moji = useGameStore((st) => st.lastArc) === 'moji';
  const safeBack = useSafeBack();
  const settings = useGameStore((s) => s.settings);
  // The device asks for less motion (macOS・iOS「視差効果を減らす／動きを減らす」): say so, and let the game play everything anyway.
  const deviceReduced = Boolean(useReducedMotion());
  const setSetting = useGameStore((s) => s.setSetting);
  const resetSave = useGameStore((s) => s.resetSave);
  const showFurigana = settings.furigana;

  const [confirmReset, setConfirmReset] = useState(false);
  // Hidden from players: 「この ゲームに ついて」 tapped seven times opens the debug screen.
  const [aboutTaps, setAboutTaps] = useState(0);
  const [showDebug] = useState(debugFound);
  const tapAbout = () => {
    if (aboutTaps + 1 < TAPS_TO_DEBUG) return setAboutTaps(aboutTaps + 1);
    setAboutTaps(0);
    try {
      localStorage.setItem(DEBUG_KEY, '1');
    } catch {
      // Blocked storage: the screen still opens, the button just does not stay.
    }
    navigate('/debug');
  };

  const toggles = [
    {
      key: 'furigana' as const,
      icon: 'あ',
      label: 'ふりがなを 出(だ)す',
      note: '漢字(かんじ)の 上(うえ)に 読(よ)みかたを 出(だ)します。',
      en: 'Show the reading above each kanji.',
    },
    {
      key: 'english' as const,
      icon: 'EN',
      label: '言葉(ことば)の 意味(いみ)を 英語(えいご)で 出(だ)す',
      note: '図鑑(ずかん)と ストーリーの ことばに、はじめから 英語(えいご)を つけます。',
      en: 'Show English meanings of words from the start.',
    },
    { key: 'muted' as const, icon: '🔇', label: '音(おと)を 消(け)す', note: '', en: 'Mute all sound.' },
    {
      key: 'bgmOff' as const,
      icon: '🎵',
      label: 'BGM（音楽(おんがく)）を 消(け)す',
      note: '効果音(こうかおん)は 鳴(な)ります。',
      en: 'Turn the music off (sound effects stay).',
    },
    {
      key: 'reducedMotion' as const,
      icon: '🌀',
      label: '動(うご)きを 少(すく)なく する',
      note: '画面(がめん)の 動(うご)きが 気(き)に なる ときに。ガチャの 場面(ばめん)は ぜんぶ 出(で)ます。ゆれる・とぶ・回(まわ)る 動(うご)きが ふわっと に なります。',
      en: 'Less movement on screen. Every scene still plays; shaking, flying and spinning become fades.',
    },
  ];
  const fullMotion = useGameStore((s) => s.fullMotion);
  const setFullMotion = useGameStore((s) => s.setFullMotion);
  const en = (text: string) => (
    <span lang="en" className="block text-[11px] leading-snug" style={{ color: 'var(--ink-2)' }}>
      {text}
    </span>
  );

  return (
    <div className="g-stage min-h-dvh pb-8">
      {/* The world being played behind it: the night town on 文字が 消えた 町 (08 §3.8). */}
      {moji ? <NightStreetBackdrop /> : <Backdrop fixed />}
      <header
        className="g-header sticky top-0 z-20 flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3"
      >
        <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={safeBack}>
          <span aria-hidden>◀</span>もどる
        </button>
        <h1 className="g-title text-center text-base leading-tight">
          せってい
          <span lang="en" className="block text-[10px] font-bold opacity-80">
            Settings
          </span>
        </h1>
        {/* The title is the game's front door; ホーム everywhere else leads to the map (08 §3.8). */}
        <button type="button" className="g-btn g-btn-ghost !min-h-[38px] !px-3 text-xs" onClick={() => navigate('/')}>
          <RubyText showFurigana={showFurigana}>タイトルへ</RubyText>
        </button>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        <ul className="flex flex-col gap-2">
          {toggles.map((t) => (
            <li key={t.key} className="g-panel flex items-center gap-3 p-4">
              <span aria-hidden className="w-7 shrink-0 text-center text-xl font-black">
                {t.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <RubyText showFurigana={showFurigana}>{t.label}</RubyText>
                </p>
                {t.note && (
                  <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                    <RubyText showFurigana={showFurigana}>{t.note}</RubyText>
                  </p>
                )}
                {en(t.en)}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[t.key]}
                aria-label={t.label.replace(/\([^)]*\)/g, '')}
                onClick={() => setSetting(t.key, !settings[t.key])}
                className="relative h-8 w-14 shrink-0 rounded-full transition-colors"
                style={{ background: settings[t.key] ? 'var(--accent)' : 'var(--line)' }}
              >
                <span
                  className="absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left]"
                  style={{ left: settings[t.key] ? '28px' : '4px' }}
                />
              </button>
            </li>
          ))}
          {/* Only when the device asks for less motion: otherwise it would change nothing. */}
          {deviceReduced && (
            <li className="g-panel flex items-center gap-3 p-4">
              <span aria-hidden className="w-7 shrink-0 text-center text-xl font-black">
                ✨
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <RubyText showFurigana={showFurigana}>動(うご)きを ぜんぶ 出(だ)す</RubyText>
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                  <RubyText showFurigana={showFurigana}>この 端末(たんまつ)は「動(うご)きを 減(へ)らす」が オンです。オンに すると、ゲームの 動(うご)きを ぜんぶ 出(だ)します。</RubyText>
                </p>
                {en('Your device asks for less motion. Turn this on to play every animation anyway.')}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={fullMotion}
                aria-label="動きを ぜんぶ 出す"
                onClick={() => setFullMotion(!fullMotion)}
                className="relative h-8 w-14 shrink-0 rounded-full transition-colors"
                style={{ background: fullMotion ? 'var(--accent)' : 'var(--line)' }}
              >
                <span className="absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left]" style={{ left: fullMotion ? '28px' : '4px' }} />
              </button>
            </li>
          )}
        </ul>

        {/* クレジット — ライセンス上 必要 ------------------------------- */}
        <div className="g-panel mt-4 p-4 text-xs leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          <p className="g-eyebrow mb-2 select-none" onClick={tapAbout}>
            <RubyText showFurigana={showFurigana}>この ゲームに ついて</RubyText>
          </p>
          <ul className="space-y-1.5">
            <li>
              <RubyText showFurigana={showFurigana}>武器(ぶき)の アイコン:</RubyText>{' '}
              <a href="https://game-icons.net/" target="_blank" rel="noreferrer" className="underline">
                Game Icons
              </a>{' '}
              (CC BY 3.0)
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>熟語(じゅくご)の 辞書(じしょ):</RubyText> EDICT2 — Electronic Dictionary Research &amp;
              Development Group (CC BY-SA 4.0)
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>書(か)きじゅん:</RubyText> hanzi-writer / KanjiVG
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>ネクマックス・絵本(えほん)の 絵(え): 株式会社(かぶしきがいしゃ)ネクストメイク</RubyText>
            </li>
          </ul>
        </div>

        {/* はじめから ---------------------------------------------------- */}
        <div className="g-panel mt-4 p-4">
          <p className="text-sm">
            <RubyText showFurigana={showFurigana}>はじめから やりなおす</RubyText>
            {en('Start over')}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>
              おぼえた 漢字(かんじ)・武器(ぶき)・なかまが ぜんぶ 消(き)えます。もとには もどせません。
            </RubyText>
            {en('Everything you have learned, made and met is deleted. This cannot be undone.')}
          </p>
          {confirmReset ? (
            <div className="mt-3 flex gap-2">
              <button type="button" className="g-btn g-btn-ghost flex-1 !flex-col !gap-0 leading-tight" onClick={() => setConfirmReset(false)}>
                やめる
                <span lang="en" className="text-[10px] font-bold opacity-80">
                  Cancel
                </span>
              </button>
              <button
                type="button"
                className="g-btn flex-1 !flex-col !gap-0 leading-tight"
                style={{ background: 'var(--color-danger)', color: '#fff' }}
                onClick={() => {
                  resetSave();
                  setConfirmReset(false);
                  navigate('/');
                }}
              >
                <RubyText showFurigana={showFurigana}>本当(ほんとう)に 消(け)す</RubyText>
                <span lang="en" className="text-[10px] font-bold opacity-90">
                  Delete everything
                </span>
              </button>
            </div>
          ) : (
            <button type="button" className="g-btn g-btn-ghost mt-3 w-full" onClick={() => setConfirmReset(true)}>
              <RubyText showFurigana={showFurigana}>データを 消(け)す</RubyText>
              <span lang="en" className="ml-1 text-[11px] font-bold opacity-80">
                · Delete data
              </span>
            </button>
          )}
        </div>

        {showDebug && (
          <button type="button" className="g-btn g-btn-ghost mt-4 w-full text-xs" onClick={() => navigate('/debug')}>
            🛠 デバッグ
          </button>
        )}

        {/* Which version this is: the app switches to a new one by itself (components/UpdateWatcher.tsx). */}
        <p className="mt-4 text-center text-[11px]" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>{`バージョン ${buildLabel(__BUILD_TIME__)}`}</RubyText>
        </p>
      </div>
    </div>
  );
};

export default SettingsScreen;
