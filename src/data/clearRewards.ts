/**
 * ステージクリアの 得 (docs/design/09 §3, 2026-10-03: A・B・C・D 全部).
 *
 *   A 初クリア — experience (lib/level.ts EXP_BOSS_FIRST), the stage's gems
 *     (StageDef.reward) and, on some episodes, a なかま (StageDef.grants).
 *   B かんぺき — the first clear with no mistake (★3) pays once more and puts
 *     a 👑 on the episode's card.
 *   C くりかえし — a replay's experience (EXP_BOSS_REPEAT, capped per day).
 *   D Hard — the first Hard win pays and puts a 👹 on the card (lib/difficulty.ts;
 *     not 🔥, which is the COMBO's and 火's).
 *
 * Gems are shown on the new route only once they have a use — the gacha
 * opens at 1章 4話 (08 §3.8「ジェムの もらった は 使い道が ない うちは 出さない」);
 * they are earned all along.
 */
export const PERFECT_BONUS_GEMS = 20;
export const HARD_BONUS_GEMS = 50;
