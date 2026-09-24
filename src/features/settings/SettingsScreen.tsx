import { useState } from 'react';
import { useSafeBack } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { RubyText } from '../../components/ui/Ruby';

/** Settings, and the credits the asset licences require. */
export const SettingsScreen = () => {
  const navigate = useNavigate();
  const safeBack = useSafeBack();
  const settings = useGameStore((s) => s.settings);
  const setSetting = useGameStore((s) => s.setSetting);
  const resetSave = useGameStore((s) => s.resetSave);
  const showFurigana = settings.furigana;

  const [confirmReset, setConfirmReset] = useState(false);

  const toggles = [
    {
      key: 'furigana' as const,
      label: 'ふりがなを 出(だ)す',
      note: '漢字(かんじ)の 上(うえ)に 読(よ)みかたを 出(だ)します。',
    },
    { key: 'muted' as const, label: '音(おと)を 消(け)す', note: '' },
    {
      key: 'reducedMotion' as const,
      label: '動(うご)きを 少(すく)なく する',
      note: '画面(がめん)の 動(うご)きが 気(き)に なる ときに。',
    },
  ];

  return (
    <div className="g-stage min-h-dvh pb-8">
      <Backdrop fixed />
      <header
        className="g-header sticky top-0 z-20 flex items-center justify-between px-4 py-3"
      >
        <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={safeBack}>
          <span aria-hidden>◀</span>もどる
        </button>
        <h1 className="g-title text-base">せってい</h1>
        <span className="w-16" />
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        <ul className="flex flex-col gap-2">
          {toggles.map((t) => (
            <li key={t.key} className="g-panel flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <RubyText showFurigana={showFurigana}>{t.label}</RubyText>
                </p>
                {t.note && (
                  <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                    <RubyText showFurigana={showFurigana}>{t.note}</RubyText>
                  </p>
                )}
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
        </ul>

        {/* クレジット — ライセンス上 必要 ------------------------------- */}
        <div className="g-panel mt-4 p-4 text-xs leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          <p className="g-eyebrow mb-2">
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
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>
              おぼえた 漢字(かんじ)・武器(ぶき)・なかまが ぜんぶ 消(き)えます。もとには もどせません。
            </RubyText>
          </p>
          {confirmReset ? (
            <div className="mt-3 flex gap-2">
              <button type="button" className="g-btn g-btn-ghost flex-1" onClick={() => setConfirmReset(false)}>
                やめる
              </button>
              <button
                type="button"
                className="g-btn flex-1"
                style={{ background: 'var(--color-danger)', color: '#fff' }}
                onClick={() => {
                  resetSave();
                  setConfirmReset(false);
                  navigate('/');
                }}
              >
                <RubyText showFurigana={showFurigana}>本当(ほんとう)に 消(け)す</RubyText>
              </button>
            </div>
          ) : (
            <button type="button" className="g-btn g-btn-ghost mt-3 w-full" onClick={() => setConfirmReset(true)}>
              <RubyText showFurigana={showFurigana}>データを 消(け)す</RubyText>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
