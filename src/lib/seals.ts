/**
 * 字の ふういん — the kanji an opponent holds (2026-10-07「強い 武器 作ると
 * あっという間に ひっくり返った 気に なって しまう…今の ままでは 漢字の
 * 練習として できない 部分も 出る」).
 *
 * A town fight is a writing test, so it is never over before the kanji have
 * been written: the opponent keeps each kanji it asks for sealed, asks the
 * sealed ones first, and cannot fall until every one has been written once in
 * this fight. Its HP is cut into one share per kanji and stays above the
 * shares still sealed. A strong weapon still wins sooner — a weak one needs
 * more writes than there are kanji — but no weapon wins with fewer.
 */

/** The HP an opponent keeps while `left` of its `total` kanji are still sealed. */
export const sealFloor = (maxHp: number, total: number, left: number): number =>
  total <= 0 || left <= 0 ? 0 : Math.ceil((maxHp * Math.min(left, total)) / total);

/** A blow against the seals: the HP after it, what it took, and whether a seal held some of it back. */
export const strikeSealed = (hp: number, damage: number, floor: number): { hp: number; dealt: number; held: boolean } => {
  const next = Math.max(Math.min(hp, floor), hp - damage);
  return { hp: next, dealt: hp - next, held: next > Math.max(0, hp - damage) };
};

/** The kanji still to ask for first: the sealed ones not yet written, else every one. */
export const askFrom = <K extends { id: string }>(pool: readonly K[], sealIds: readonly string[], broken: readonly string[]): K[] => {
  const sealed = pool.filter((k) => sealIds.includes(k.id) && !broken.includes(k.id));
  return sealed.length > 0 ? sealed : [...pool];
};
