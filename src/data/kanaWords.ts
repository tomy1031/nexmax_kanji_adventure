/**
 * 0章の たたかい「きいて かく」の ことば (docs/design/22 §4): the opponent says
 * a word, the player hears it, sees its meaning in English and a box for each
 * kana with its romaji, and writes it kana by kana; the picture comes out at
 * the end. Each episode's list uses only the kana written by then (base kana
 * only — no voiced or small ones, which are never drilled; ー is filled in).
 * Every episode's list holds each of its own kana at least once, so its
 * opponent can ask them all (kanaWords.test.ts).
 */

export interface KanaWord {
  /** The word in kana; a space parts a short phrase (ほんを よむ), ー is given. */
  kana: string;
  /** Its picture, shown once it is written. */
  emoji: string;
  /** Its meaning, shown from the start. */
  en: string;
}

const w = (kana: string, emoji: string, en: string): KanaWord => ({ kana, emoji, en });

export const KANA_WORDS: Record<string, KanaWord[]> = {
  'kana-1': [w('あお', '🔵', 'blue'), w('うえ', '⬆️', 'up'), w('いえ', '🏠', 'house'), w('あい', '❤️', 'love'), w('いい', '👍', 'good'), w('え', '🖼️', 'picture')],
  'kana-2': [
    w('かお', '😐', 'face'),
    w('えき', '🚉', 'station'),
    w('すし', '🍣', 'sushi'),
    w('かさ', '☂️', 'umbrella'),
    w('いす', '🪑', 'chair'),
    w('こい', '🎏', 'carp'),
    w('せき', '💺', 'seat'),
    w('そこ', '👉', 'there'),
    w('くさ', '🌿', 'grass'),
    w('さけ', '🐟', 'salmon'),
    w('いか', '🦑', 'squid'),
    w('あし', '🦵', 'leg'),
  ],
  'kana-3': [
    w('いぬ', '🐕', 'dog'),
    w('ねこ', '🐈', 'cat'),
    w('て', '✋', 'hand'),
    w('くち', '👄', 'mouth'),
    w('なす', '🍆', 'eggplant'),
    w('たこ', '🐙', 'octopus'),
    w('かに', '🦀', 'crab'),
    w('つき', '🌙', 'moon'),
    w('とけい', '⏰', 'clock'),
    w('さかな', '🐟', 'fish'),
    w('きのこ', '🍄', 'mushroom'),
    w('にく', '🍖', 'meat'),
    w('いと', '🧵', 'thread'),
    w('たて', '🛡️', 'shield'),
    w('つち', '🟫', 'soil'),
    w('ぬの', '🧣', 'cloth'),
    w('なに', '❓', 'what'),
    w('たぬき', '🦝', 'raccoon dog'),
  ],
  'kana-4': [
    w('はな', '🌸', 'flower'),
    w('ほし', '⭐', 'star'),
    w('ふね', '🚢', 'ship'),
    w('め', '👁️', 'eye'),
    w('みみ', '👂', 'ear'),
    w('むし', '🐛', 'bug'),
    w('もも', '🍑', 'peach'),
    w('うみ', '🌊', 'sea'),
    w('へい', '🧱', 'wall'),
    w('ひ', '🔥', 'fire'),
    w('まめ', '🫘', 'bean'),
    w('かみ', '📄', 'paper'),
    w('ほね', '🦴', 'bone'),
    w('くも', '☁️', 'cloud'),
    w('ひめ', '👸', 'princess'),
    w('はま', '🏖️', 'beach'),
    w('ふむ', '👣', 'step on'),
    w('ひも', '🪢', 'string'),
  ],
  'kana-5': [
    w('やま', '⛰️', 'mountain'),
    w('ゆき', '❄️', 'snow'),
    w('よる', '🌃', 'night'),
    w('りす', '🐿️', 'squirrel'),
    w('さる', '🐒', 'monkey'),
    w('はれ', '☀️', 'sunny'),
    w('いろ', '🎨', 'colour'),
    w('わに', '🐊', 'crocodile'),
    w('ほん', '📚', 'book'),
    w('らいおん', '🦁', 'lion'),
    w('みかん', '🍊', 'mandarin'),
    w('くるま', '🚗', 'car'),
    w('とり', '🐦', 'bird'),
    w('さくら', '🌸', 'cherry blossom'),
    w('ほんを よむ', '📖', 'read a book'),
    w('やり', '🔱', 'spear'),
    w('わら', '🌾', 'straw'),
    // Long words, for the hiragana boss (all hiragana are known by now).
    w('かたつむり', '🐌', 'snail'),
    w('ひまわり', '🌻', 'sunflower'),
    w('くつした', '🧦', 'socks'),
    w('ふうせん', '🎈', 'balloon'),
    w('むらさき', '💜', 'purple'),
    w('ろうそく', '🕯️', 'candle'),
    w('やきとり', '🍢', 'grilled chicken'),
    w('ぬりえ', '🖍️', 'colouring book'),
    w('ゆうやけ', '🌇', 'sunset'),
    w('けむり', '💨', 'smoke'),
    w('ねむい', '😪', 'sleepy'),
    w('えほん', '📕', 'picture book'),
  ],
  'kana-6': [w('ココア', '☕', 'cocoa'), w('ケーキ', '🍰', 'cake'), w('キウイ', '🥝', 'kiwi'), w('オーケー', '👌', 'OK'), w('エコ', '♻️', 'eco'), w('カカオ', '🍫', 'cacao'), w('コーク', '🥤', 'coke')],
  'kana-7': [
    w('アイス', '🍨', 'ice cream'),
    w('タクシー', '🚕', 'taxi'),
    w('テスト', '📝', 'test'),
    w('トースト', '🍞', 'toast'),
    w('スキー', '⛷️', 'skiing'),
    w('セーター', '🧶', 'sweater'),
    w('ソース', '🥫', 'sauce'),
    w('チーター', '🐆', 'cheetah'),
    w('スーツ', '👔', 'suit'),
    w('サーカス', '🎪', 'circus'),
  ],
  'kana-8': [
    w('ナイフ', '🔪', 'knife'),
    w('ネクタイ', '👔', 'necktie'),
    w('ノート', '📓', 'notebook'),
    w('ハート', '❤️', 'heart'),
    w('コーヒー', '☕', 'coffee'),
    w('カヌー', '🛶', 'canoe'),
    w('テニス', '🎾', 'tennis'),
    w('ヘア', '💇', 'hair'),
    w('ホース', '🚿', 'hose'),
    w('ハニー', '🍯', 'honey'),
  ],
  'kana-9': [
    w('トマト', '🍅', 'tomato'),
    w('メモ', '🗒️', 'memo'),
    w('ハム', '🥓', 'ham'),
    w('ミニカー', '🏎️', 'toy car'),
    w('マスク', '😷', 'mask'),
    w('タイヤ', '🛞', 'tyre'),
    w('ヨーヨー', '🪀', 'yo-yo'),
    w('ユーモア', '😄', 'humour'),
  ],
  'kana-10': [
    w('ライオン', '🦁', 'lion'),
    w('レモン', '🍋', 'lemon'),
    w('メロン', '🍈', 'melon'),
    w('カメラ', '📷', 'camera'),
    w('ホテル', '🏨', 'hotel'),
    w('ワイン', '🍷', 'wine'),
    w('クリーム', '🍦', 'cream'),
    w('クリスマス', '🎄', 'Christmas'),
    // ヲ is written but almost never read in a word: it comes as itself.
    w('ヲ', '✨', 'wo — a rare letter!'),
    // Long words, for the katakana boss (all katakana are known by now).
    w('オムライス', '🍳', 'omelette rice'),
    w('ヘアスタイル', '💇', 'hairstyle'),
    w('ソフトクリーム', '🍦', 'soft-serve ice cream'),
    w('ユニホーム', '👕', 'uniform'),
    w('コアラ', '🐨', 'koala'),
    w('エアコン', '❄️', 'air conditioner'),
    w('ホームラン', '⚾', 'home run'),
    w('ラーメン', '🍜', 'ramen'),
    w('チキン', '🍗', 'chicken'),
    w('ヒーロー', '🦸', 'hero'),
    w('セロリ', '🥬', 'celery'),
    w('クリスマスツリー', '🎄', 'Christmas tree'),
  ],
};

/** The kana a word asks to be written, in order (spaces and ー are not written). */
export const kanaToWrite = (word: KanaWord): string[] => [...word.kana].filter((c) => c !== ' ' && c !== 'ー');
