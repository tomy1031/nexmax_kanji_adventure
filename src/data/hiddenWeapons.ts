/**
 * かくし武器 — one word in each episode that makes a far stronger weapon than
 * the rest (2026-10-04「それぞれの ステージの 漢字でも、隠し武器のような
 * 形で 強いものが あると いい」).
 *
 * Never hinted: found only by trying. Each is a real word written with the
 * kanji learned up to its episode, at least one of them that episode's own,
 * and one a player is unlikely to make first — a find, not the obvious word.
 */
export const HIDDEN_WEAPONS: Readonly<Record<string, string>> = {
  日月: 'moji-1-1',
  金山: 'moji-1-2',
  三日月: 'moji-1-3',
  七五三: 'moji-1-4',
  八百万: 'moji-1-5',
  会社員: 'moji-1-6',
  日本一: 'moji-1-7',
  朝日: 'moji-1-8',
  一人前: 'moji-1-9',
  万年: 'moji-1-10',
  水車: 'moji-1-11',
  // 2章 ミナトタウン（docs/design/12）
  高校生: 'moji-2-1',
  白黒: 'moji-2-2',
  上手: 'moji-2-3',
  金魚: 'moji-2-4',
  人間: 'moji-2-5',
  大男: 'moji-2-6',
  読書: 'moji-2-7',
  友達: 'moji-2-8',
  手紙: 'moji-2-9',
  物語: 'moji-2-10',
  // 3章 マンプクタウン（docs/design/14）: すぐ 作る 言葉（切手・旅行・花火・大雨・作物）でなく、さがすと 見つかる 言葉
  小切手: 'moji-3-1',
  一人旅: 'moji-3-2',
  火花: 'moji-3-3',
  五月雨: 'moji-3-4',
  大作: 'moji-3-5',
  // 4章 京(みやこ)タウン（docs/design/15）: すぐ 作る 言葉（明日・長時間・元気・地下鉄・東京・料理・日曜日）でなく
  大広間: 'moji-4-1',
  紙一重: 'moji-4-2',
  人気者: 'moji-4-3',
  一大事: 'moji-4-4',
  南南西: 'moji-4-5',
  真夜中: 'moji-4-6',
  五目: 'moji-4-7',
  // 5章 シズカタウン（docs/design/20）: すぐ 作る 言葉（一言・漢字・図書館・音楽・食堂・病院・家族・時計・部屋・意味）でなく
  寝言: 'moji-5-1',
  英知: 'moji-5-2',
  白銀: 'moji-5-3',
  五十音: 'moji-5-4',
  青春: 'moji-5-5',
  運動会: 'moji-5-6',
  水族館: 'moji-5-7',
  北海道: 'moji-5-8',
  八百屋: 'moji-5-9',
  天使: 'moji-5-10',
};

export const isHiddenWeapon = (word: string): boolean => word in HIDDEN_WEAPONS;
