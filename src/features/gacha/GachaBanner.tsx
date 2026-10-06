import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { NexmaxSays } from '../../components/ui/Chrome';
import { assetPath } from '../../lib/assetPath';
import { kanjiOf } from '../../data/charKanji';
import { cardsOf, type Individual } from '../../data/individuals';
import { CLASS_LABEL } from '../../lib/forge/weapon';
import { SKILL_INFO, SKILL_OF, skillEffect } from '../../lib/companionSkill';
import { star5PowerOf } from '../../lib/star5Power';
import { GachaCard } from './GachaCard';
import { useGameStore } from '../../store/gameStore';

/**
 * ピックアップ画面の 部品 (docs/design/18 §5): the banner's star large with
 * their character in gold behind them and the words it makes floating round
 * it, Nexmax waiting below; the plate that says who they are and
 * 「ここが すごい！」; and the comparison of the character's ★3〜★5.
 */

const STAR_COLOR: Record<number, string> = { 3: '#dfe7f4', 4: '#ffd36a', 5: '#ffd36a' };

/** The star of the banner, large, their character in gold behind them. */
export const BannerHero = ({ card, showFurigana, still }: { card: Individual; showFurigana: boolean; still: boolean }) => {
  const k = kanjiOf(card.char);
  const two = k.kanji.length > 1;
  return (
    <div className="relative mx-auto h-[min(46dvh,360px)] w-full max-w-md" aria-hidden>
      <div className="absolute top-[42%] left-[58%] aspect-square w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,214,110,0.55), transparent 65%)' }} />
      {/* Their character in gold, glowing (it is a picture of a character, not one to read off). */}
      <motion.span
        className="absolute top-[2%] left-[3%] leading-none font-black"
        style={{
          fontSize: two ? 84 : 132,
          writingMode: two ? 'vertical-rl' : undefined,
          background: 'linear-gradient(180deg, #fff6c8, #ffd36a 45%, #c98a0c)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextStroke: '2px rgba(107,69,18,0.85)',
          textShadow: '0 0 24px rgba(255,200,90,0.75)',
        }}
        initial={{ scale: still ? 1 : 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {k.kanji}
      </motion.span>
      {/* The words it makes, on slips floating round it. */}
      {k.words.map((w, i) => (
        <motion.span
          key={w}
          className="absolute rounded-md border-2 border-[#c9a45c] bg-[#fff8e6] px-2 py-0.5 text-sm leading-[1.9] font-black text-[#2a1d12] shadow-md"
          style={{ left: `${[3, 24, 5][i]}%`, top: `${[40, 49, 58][i]}%`, rotate: `${[-6, 4, -3][i]}deg` }}
          animate={still ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 2.4 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        >
          <RubyText showFurigana={showFurigana}>{w}</RubyText>
        </motion.span>
      ))}
      <motion.img
        src={assetPath(card.art)}
        alt=""
        className="absolute right-[-4%] bottom-0 h-full w-[68%] object-contain object-bottom"
        initial={{ x: still ? 0 : 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      />
      <div className="absolute bottom-0 left-0">
        <NexmaxSays text="どんな なかまに 出会(であ)えるかな？" pose="hello" size={58} flip />
      </div>
    </div>
  );
};

/** 「ここが すごい！」: what this card does, in plain numbers (docs/design/18 §2). */
export const HereIsGreat = ({ card, showFurigana }: { card: Individual; showFurigana: boolean }) => {
  const kind = SKILL_OF[card.char];
  const info = SKILL_INFO[kind];
  const power = star5PowerOf(card.id);
  // EN (on by default): the same in English under each line — what this friend does, without reading it.
  const english = useGameStore((s) => s.settings.english);
  const items: { icon: string; head: string; body: string; en?: string }[] = [];
  if (power) items.push({ icon: '🌈', head: `★5 だけの ちから「${power.name}」`, body: power.says, en: power.en });
  items.push({ icon: info.icon, head: `わざ「${info.name}」`, body: info.says(skillEffect(kind, card.rarity)), en: info.en(skillEffect(kind, card.rarity)) });
  items.push({ icon: '⚔️', head: 'とくいな 武(ぶ)器(き)', body: `${CLASS_LABEL[card.favours].ja}(${CLASS_LABEL[card.favours].reading})で こうげき ＋${card.bonus}%`, en: `Attack +${card.bonus}% with this weapon.` });
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.head} className="rounded-lg bg-white/10 px-2 py-1 text-left">
          <p className="text-[13px] font-black text-[#ffe9a8]">
            {it.icon} <RubyText showFurigana={showFurigana}>{it.head}</RubyText>
          </p>
          <p className="text-xs leading-[1.85] text-white/90">
            <RubyText showFurigana={showFurigana}>{it.body}</RubyText>
          </p>
          {english && it.en && (
            <p lang="en" className="text-[11px] leading-snug font-bold text-[#cfe3ff]">
              {it.en}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
};

/** The plate under the star: who they are, their character, and 「ここが すごい！」. */
export const BannerInfo = ({ card, label, showFurigana }: { card: Individual; label: string; showFurigana: boolean }) => {
  const k = kanjiOf(card.char);
  return (
    <div
      className="relative mx-auto w-full max-w-md text-center text-white"
      style={{
        borderStyle: 'solid',
        borderWidth: '40px 24px 28px',
        borderImageSource: `url(${assetPath('img/gacha/info_plate.webp')})`,
        borderImageSlice: '120 64 74 64 fill',
        borderImageRepeat: 'stretch',
      }}
    >
      <p className="-mt-3 inline-block rounded-full border border-[#e8c26a] bg-[#2a1a4a] px-3 py-0.5 text-xs font-black text-[#ffe9a8]">
        <RubyText showFurigana={showFurigana}>{label}</RubyText>
      </p>
      <p className="g-outline-text mt-1 font-black">
        <span className="text-sm">
          <RubyText showFurigana={showFurigana}>{`${card.title}：`}</RubyText>
        </span>
        <span className="text-2xl text-[#ffe9a8]">
          <RubyText showFurigana={showFurigana}>{card.shortName}</RubyText>
        </span>
      </p>
      <p aria-label={`★${card.rarity}`} className="text-xl leading-none" style={{ color: STAR_COLOR[card.rarity], textShadow: '0 0 8px rgba(255,180,90,0.8)' }}>
        {'★'.repeat(card.rarity)}
      </p>
      <p className="mt-1 inline-flex items-center gap-2 rounded-lg border border-[#e8c26a] bg-[#fff8e6] px-2 py-0.5 text-[#2a1d12]">
        <span className="text-xs font-bold">
          <RubyText showFurigana={showFurigana}>この 子(こ)の 字(じ)</RubyText>
        </span>
        <span aria-hidden className="text-xl leading-none font-black">
          {k.kanji}
        </span>
        <span className="text-xs font-black">{k.reading}</span>
      </p>
      <p className="mt-1 text-xs leading-[1.9] text-white/85">
        <RubyText showFurigana={showFurigana}>{card.tagline}</RubyText>
      </p>
      <p className="mt-1.5 mb-1 text-sm font-black text-[#ffd36a]">
        <RubyText showFurigana={showFurigana}>ここが すごい！</RubyText>
      </p>
      <HereIsGreat card={card} showFurigana={showFurigana} />
    </div>
  );
};

/** キャラ: the character's cards side by side, ★3 to ★5, and what each does. */
export const CardCompare = ({ card, owned, showFurigana, still, onClose }: { card: Individual; owned: readonly string[]; showFurigana: boolean; still: boolean; onClose: () => void }) => {
  const all = cardsOf(card.char);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        className="flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-2xl border-2 border-[#e8c26a] bg-[#1a1236] p-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="compare-title" className="text-center text-base font-black text-[#ffe9a8]">
          <RubyText showFurigana={showFurigana}>{`${card.shortName}の カード`}</RubyText>
        </h2>
        <div className="mt-2 flex justify-center gap-2">
          {all.map((c) => (
            <div key={c.id} className="flex flex-col items-center">
              <GachaCard card={c} face="front" width={92} showFurigana={showFurigana} still={still} />
              <p className="mt-0.5 text-[10px] text-white/70">
                <RubyText showFurigana={showFurigana}>{owned.includes(c.id) ? 'もって いる' : 'まだ ない'}</RubyText>
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-2">
          {all.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/20 p-2">
              <p className="text-sm font-black">
                <span style={{ color: STAR_COLOR[c.rarity] }}>{'★'.repeat(c.rarity)}</span> <RubyText showFurigana={showFurigana}>{c.name}</RubyText>
              </p>
              <HereIsGreat card={c} showFurigana={showFurigana} />
            </div>
          ))}
        </div>
        <button type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={onClose}>
          <RubyText showFurigana={showFurigana}>とじる</RubyText>
        </button>
      </div>
    </motion.div>
  );
};
