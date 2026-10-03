/**
 * 画像素材の台帳 — the single source for every picture the game still needs.
 *
 * docs/画像素材リスト.md is written from this file (node scripts/art/prompt.mjs --doc),
 * prompt.mjs prints a ready-to-paste prompt for one entry, and import.mjs
 * turns what was generated into the web files the game loads.
 *
 * Each entry:
 *   id       the name used on the command line and for the raw file
 *            (art-src/<id>.png)
 *   group    which section of the document it belongs to
 *   prio     A = do first (the game looks unfinished without it) / B / C
 *   out      where the web file goes (under public/)
 *   kind     chara | enemy | bg | fg | map-half | icon — decides size and
 *            post-processing in import.mjs (map-half: two raw halves, top and
 *            bottom, are stacked into one tall map)
 *   bgmode   how the raw file separates from its background:
 *            'alpha' (generated transparent) / 'white' (plain white, cut by
 *            flood fill from the edges) / 'green' (#00FF00 chroma key)
 *   refs     reference images to hand to the generator, repo-relative
 *   style    shared prompt block(s), in order (see BLOCKS)
 *   diff     the one line that makes this picture this picture
 *   used     where the game shows it, for wiring it in
 *   note     anything the person generating should know
 */

// ---------------------------------------------------------------------------
// Shared prompt blocks. Copied verbatim into every prompt — never paraphrase.
// ---------------------------------------------------------------------------

export const BLOCKS = {
  // NexmaxAcademy の正典（docs/skills/画像生成プロンプト.md §2）。逐語。
  NEXMAX: `Character: "NexMax", the official robot mascot of NEXT MAKE.
Style: hand-drawn sketchy black outline (slightly rough, warm line, approx 6-8px at 1024px),
flat cel colors with soft minimal shading, cute chibi proportion (big head, about 2 heads tall),
soft drop shadow under feet, plain white background, no readable text anywhere.
Anatomy (must match the reference image exactly):
- Rounded helmet-like head, wider than tall, light sky-blue (#A9D6F5) with soft shading (#7FB8E8).
- Two small rounded ear pods on the sides of the head.
- Large white rounded face-screen covering most of the face, with a soft notch dipping at the top center.
- Two black oval eyes, thin curved eyebrow marks on the helmet above the screen, small gentle smile.
- Small trapezoid torso in the same sky-blue, with the NEXT MAKE chest mark:
  a navy (#004F8D) double-peak "M" logo (two triangular mountain shapes).
- Segmented ball-joint arms with round elbows and mitten hands.
- Short segmented legs with rounded boots.
Mood: friendly, curious, encouraging. Kid-safe, e-learning mascot.
Never: realistic rendering, gradients, extra fingers, readable letters, dark horror tone, angry face.
Game-specific: the navy chest mark must always be visible and unobstructed —
it is a story device that emits light. Never cover it with props, arms, or clothing.`,

  CHARA_OUT: `Output: 1024x1536 portrait PNG, one character, full body head to feet, centered,
generous empty margin on every side, plain pure white (#FFFFFF) background with nothing else on it,
no ground line, no text, no logo, no watermark.`,

  // 現代編の 仲間: 原作漫画（夢を信じたネクマックス #1）の 形を、ネクマックスと 同じ 画風で。
  GENDAI_TEAM: `Style: the same hand-drawn sketchy black outline and flat cel colors as the NexMax reference,
cute chibi proportion about 2 heads tall. These are NexMax's colleagues at the company training camp:
simple rounded robot-like newcomers with NO ear pods, NO face-screen and NO chest logo
(those belong to NexMax only). A plain white face with simple black dot or oval eyes drawn directly on the head.
Outfit: a zip-up track jacket (jersey) with a tall stand-up collar, the zipper running down the center,
matching track pants and simple sneakers. Mood: ordinary, likeable young new employee. Kid-safe.`,

  // むかし編の 村人: 設計参照（山の向こうの生命草.png）の 村長の 絵柄。
  MUKASHI_FOLK: `Style: warm hand-drawn children's picture-book character, sketchy dark-brown outline,
soft colored-pencil and dry-pastel shading, chibi proportion about 2.5 heads tall, rural pre-modern
Japanese farming village, simple kimono clothing in muted natural colors. Kind, gentle faces. Kid-safe.`,

  ENEMY: `Output: 1024x1024 PNG, one creature, centered, facing LEFT in three-quarter view
(it stands on the right of the battle and faces the hero), whole body inside the frame with margin,
plain pure white (#FFFFFF) background, no ground, no text, no logo.
Style: children's picture-book fantasy creature, sketchy dark outline, soft colored-pencil and pastel shading,
rich but soft colors, readable silhouette at small size (it is shown about 150px wide on a phone).
Tone: "cute-spooky" — a little eerie or mischievous, never gory, no blood, no weapons pointed at the viewer,
no realistic animals attacking, nothing that would scare a young child. No human beings.`,

  BG_COMMON: `Output: 1024x1536 portrait PNG (the game is played on a phone held upright).
No characters, no people, no animals unless stated, no readable text anywhere (no signs, no letters,
no numbers, no kanji), no logo, no watermark, no UI.
Composition for a phone game: the main subject sits in the upper 60%; the bottom 35% is calm, simple,
low-contrast ground (a dialogue box and buttons are laid over it). Keep everything important inside
the central 80% of the width (the sides may be cropped on narrow phones). Horizon placed high.
Single consistent light source.`,

  BG_MUKASHI: `Style: soft hand-painted children's picture-book illustration, dry pastel and colored-pencil
texture on visible paper grain, warm gentle palette, soft edges, no hard outlines on scenery, no digital gloss.
Rural pre-modern Japanese countryside. Match the look of the reference picture-book page exactly.`,

  // 現代編も 同じ 絵本の 画風で（編ごとに 画風を 変えない。世界が ひとつに 見える）。
  BG_GENDAI: `Style: the same soft hand-painted picture-book technique as the reference (dry pastel and
colored pencil on paper grain), but the setting is present-day Japan. Gentle, slightly nostalgic palette.
Modern objects drawn simply and softly, never photo-real. No brand names, no readable screens.`,

  // 文字が 消えた 町（ナニワタウン）: the look of the delivered title / battle / stage-select art.
  // Reference works are never named here (constraints 2026-09-30).
  BG_NANIWA: `Style: polished Japanese anime background art in exactly the look of the reference image:
richly detailed, painterly, warm cinematic lighting with soft glow. Setting: Naniwa Town — a fictional
riverside port town inspired by Osaka, with a gentle steampunk touch: brass fittings, pipes, gears and
rivets, wood and leather details, glass-paned lanterns. Palette: deep indigo-violet sky and blue shadows
against warm amber and orange lamplight. Every signboard, screen, board and tag is BLANK — an empty dark
panel or frame — with no letters, numbers, symbols or logos anywhere. No real place names, no brands.`,

  // The town's creatures, drawn like the delivered Mojikui (art-src/battle/04_敵_モジクイ.png).
  CREATURE_NANIWA: `Output: 1024x1536 portrait PNG, one creature, full body, centered with a wide margin on every
side, plain pure white (#FFFFFF) background, no ground, no shadow on the ground, no text, no logo.
Style: polished Japanese anime game art in exactly the look of the reference creature: inky black-violet body
with soft purple highlights, glowing amber eyes, scraps of cream-colored paper talismans with brush strokes on
them (abstract strokes only — no real readable characters), curling wisps of black ink smoke. Mischievous and
"cute-spooky", never gory, nothing that would scare a young child. Facing LEFT in three-quarter view.`,

  FG_LAYER: `Output: 1024x1536 portrait PNG with a FULLY TRANSPARENT background (alpha).
Draw ONLY the foreground framing elements described below, hugging the bottom edge and the left and right edges,
leaving the middle and the whole upper half completely empty and transparent.
These elements will sway gently in the wind in the game, so draw them as whole shapes (no cut-off leaves in the middle).
If transparency is impossible, use a flat pure green (#00FF00) background instead, with no green in the drawing itself.`,

  MAP_HALF: `Output: 1024x1536 portrait PNG. This is ONE HALF of a tall vertical world map that the player scrolls
upward through; the other half continues it seamlessly. Bird's-eye three-quarter view, picture-book style.
Do NOT draw any road, path, trail, bridge line or route markers — the game draws its own winding road and
stage stones on top. Leave a clear open strip down the middle third of the width for that road.
No text, no labels, no people.`,

  // ナニワタウンの ネクマックス: タイトル・ステージせんたくで 渡された つやの ある 絵と 同じ 姿。
  NEXMAX_PAINTED: `Character: the small robot from the reference image, drawn exactly as there — polished Japanese anime
game art with soft glossy shading and a clean dark outline. Anatomy (must match the reference): a rounded light
sky-blue helmet head wider than tall with two round ear pods, a big white face-screen with two large black oval
eyes with white highlights, small curved eyebrow marks, a small mouth; a sky-blue body with the navy double-peak
"M" mark on the chest; segmented ball-joint arms with round mitten hands; short legs with rounded boots; a small
brown leather satchel on a strap across his body. Cute, about 2 heads tall. Kid-friendly and warm.
The navy chest mark must always be visible and unobstructed — never covered by the arms, the strap or the bag.
Never: realistic rendering, extra fingers, readable letters, angry or scary face.`,

  // ナニワタウンの 町の 人: public/img/chara/types の ロボットを そのまま、表情と しぐさだけ 変える。
  FOLK_PAINTED: `Character: exactly the robot in the reference image — the same body shape, colors, antenna,
accessories and outfit, the same glossy 3D-like Japanese anime game rendering with soft shading. Only the pose and
the expression on the face-screen change, as described below. Kid-friendly, expressive and easy to read at a small
size. No readable letters or numbers anywhere (any paper, card or tag is blank).`,

  // 町の 人を 人に（2026-10-03「町の 人は ネクマックスタイプで なくても 良い」）: なかまの ロボットと 見分ける。
  // 参照の ロボットは 画風・色・持ち物の ため。人の 姿は diff の Who で 決める。
  HUMAN_PAINTED: `Character: a HUMAN townsperson of a cozy harbor town — NOT a robot: no antenna, no helmet, no
face-screen, no ear pods, no mechanical joints, a real human face with hair. Draw in the same polished, glossy
3D-like Japanese anime game rendering as the reference image: soft shading, clean dark outline, bright saturated
colors, so the person can stand beside the robots of the reference without looking out of place. Cute chibi
proportion about 2.5 heads tall, big expressive eyes, rosy cheeks, friendly. Kid-friendly and easy to read at a
small size. The reference is for the rendering style, the main colors and the props only. No readable letters or
numbers anywhere (any paper, card, sign or tag is blank).`,

  // 同じ 人の 2枚目（表情ちがい）: 1枚目を 参照に する。
  HUMAN_SAME: `Character: exactly the person in the reference image — the same face, hair, age, body, clothes, colors and
props, the same glossy 3D-like Japanese anime game rendering with soft shading and a clean dark outline. Only the pose
and the expression change, as described below. No readable letters or numbers anywhere (any paper, card or tag is blank).`,
  // なかまの ★4・★5（11 §4.1）: 同じ ロボットが 着がえる。体・頭・顔・色は 変えない。
  CARD_ROBOT: `Character: exactly the robot in the reference image — the same body shape, head, face-screen, antenna,
ear pods and main body colors, the same glossy 3D-like Japanese anime game rendering with soft shading and a clean dark
outline. It is now dressed up as described below: only the outfit, the props and the pose change, the robot underneath
does not. Full body, a lively, confident pose, a happy face on the screen. Kid-friendly. No readable letters or numbers
anywhere (any paper, card, sign or tag is blank).`,

  // 町の なかまの ★4・★5: 同じ 人が 着がえる。
  CARD_TOWN: `Character: exactly the person in the reference image — the same face, hair, age and body, the same glossy
3D-like Japanese anime game rendering with soft shading and a clean dark outline. They are now dressed up as described
below: only the outfit, the props and the pose change. Full body, a cheerful pose. Kid-friendly. No readable letters
or numbers anywhere.`,

  // ★5 だけ: 衣装を 豪華に。光は 絵に 入れない（白い 背景の 切り抜きを こわさない。光は 画面で 足す）。
  CARD_STAR5: `This is the rarest version of the character: make the outfit grand and ornate, with gold trim and fine
details, and the pose dramatic and heroic. No glow, aura or light effects in the picture — keep the plain pure white
background right up to the character's outline.`,

  // 武器を ロボットに 積む（11 §6）: ネクマックスの 背中・腕に つける メカの 武器。ロボットは 描かない。
  WEAPON: `One robot-mounted weapon part for the small sky-blue robot in the reference image — draw ONLY the weapon,
not the robot, no hands, no person. A chunky, cute, toy-like mecha weapon in the same polished, glossy 3D-like Japanese
anime game rendering as the reference, soft shading and a clean dark outline. Its plating matches the robot: light
sky-blue (#A9D6F5) and white with navy (#004F8D) accents and rounded edges, a round mounting joint at its base (where it
clips onto the robot's back or arm), and a small round glass core set into it, glowing faintly white (where the written
letter's light goes). Shown alone, diagonal, floating, centered. Output: 1024x1024 PNG, plain pure white (#FFFFFF)
background with nothing else on it, no shadow on the ground, no text, no letters, no logo.`,

  WEAPON_GOLD: `This is the legendary version: the plating is gold and white with ornate engraved trim and a few small
gems, the glass core glows warm gold. Still no glow or light effects outside the weapon itself — keep the plain white
background right up to its outline.`,

  ICON: `Output: 1024x1024 PNG. App icon for a kids' kanji learning game. Keep all important shapes inside the
central 80% circle (the edges are cropped into a circle or rounded square on phones). Bold, simple, readable at 48px.
No text, no letters, no kanji.`,
};

// ---------------------------------------------------------------------------
// ネクマックス
// ---------------------------------------------------------------------------

const NX_REFS = ['public/img/chara/nexmax.webp', 'public/img/chara/build.webp'];
const nx = (id, prio, diff, used, note) => ({
  id: `nx_${id}`,
  group: 'nexmax',
  prio,
  out: `img/chara/nexmax/${id}.webp`,
  kind: 'chara',
  bgmode: 'white',
  refs: NX_REFS,
  style: ['NEXMAX', 'CHARA_OUT'],
  diff,
  used,
  note,
});

const NEXMAX = [
  nx('normal', 'A', 'Pose: standing relaxed, arms at sides, calm friendly smile.', 'お話の 立ち絵（nexmax:normal）、バトルの HP 札、地図の 左上', 'いまは 原画を 切り抜いた 物。表情差分と 絵柄を そろえる ために 撮り直す'),
  nx('smile', 'A', 'Pose: standing, both hands lightly clasped in front, bright happy smile, eyes curved into arcs.', 'お話（nexmax:smile・15回）、結果画面', 'いまは cheer（ポンポンを 持った 絵）で 代用'),
  nx('think', 'A', 'Pose: standing, one mitten hand near the side of the face-screen, eyes looking up and to the side, mouth a small flat line.', 'お話（nexmax:think・34回。いちばん 多い）', 'いまは book（本を 持った 絵）で 代用'),
  nx('determined', 'A', 'Pose: standing squarely, both fists closed at chest height, eyebrows angled inward with resolve, mouth set firm.', 'お話（nexmax:determined・18回）', 'いまは build（工具を 持った 絵）で 代用'),
  nx('hello', 'B', 'Pose: standing, one arm raised high waving hello, the other at the side, open cheerful smile.', 'お話（nexmax:hello）', ''),
  nx('guide', 'A', 'Pose: standing, pointing forward and slightly up with one mitten hand, the other hand on the hip, confident friendly smile.', 'ステージ選択の 案内・そうび画面の 中央・Nexmax の 吹き出し', ''),
  nx('sword', 'A', 'Prop: holding a simple short wooden practice sword raised high in the right hand, the left hand in a small fist, brave cheerful smile, one foot forward. The sword never covers the chest mark.', 'タイトル画面の 主役・「たたかい開始！」', 'いまは guide に 剣の アイコンを 重ねて いる'),
  nx('surprise', 'B', 'Pose: standing, both arms raised slightly, eyes wide and round, small open mouth.', 'お話（おどろく 場面）', ''),
  nx('sad', 'B', 'Pose: standing, shoulders lowered, arms hanging, eyes looking down, small downturned mouth.', '負けた ときの 結果画面・お話', ''),
  nx('hurt', 'B', 'Pose: kneeling on one knee, one hand on the ground, scuffs and small dirt smudges on the body, eyes squeezed shut.', 'むかし編 4話（イノシシと ハチに やられる 場面）', '絵本の 4ページ目（public/img/bg/mukashi_wildpath.webp）も 参照に 足す'),
  nx('glow', 'B', 'Prop: the navy chest mark emitting a bright warm orange-gold light that spills outward, head tilted slightly back, eyes closed peacefully.', 'むかし編 5話（胸の 光で 異空間の 入口を 開く）', '絵本の 5ページ目（public/img/bg/mukashi_portal.webp）も 参照に 足す'),
];

// ---------------------------------------------------------------------------
// 現代編の 人たち
// ---------------------------------------------------------------------------

const MANGA_REF = 'art-src/ref/manga_1_5.jpg';
const team = (who, look, expr, exprDiff, prio) => ({
  id: `${who}_${expr}`,
  group: 'gendai',
  prio,
  out: `img/chara/gendai/${who}_${expr}.webp`,
  kind: 'chara',
  bgmode: 'white',
  refs: [MANGA_REF, `art-src/ref/${who}.png`, 'public/img/chara/nexmax.webp'],
  style: ['GENDAI_TEAM', 'CHARA_OUT'],
  diff: `${look}\n${exprDiff}`,
  used: `現代編の お話（${who}:${expr}）`,
  note: expr === 'normal' ? 'いまは SVG の 仮の 絵（2026-09-24）。これが できたら 同じ 人の smile / worry も 同じ セッションで 撮る' : '',
});
const SONE = 'Who: "Sone", from Okinawa, easygoing. Head shape: a wide rounded bell / rice-ball shape (rounded top, broad flat bottom), slightly wider than tall. Heavy straight upper eyelids across round eyes (a relaxed, sleepy look), short slanted eyebrow strokes high on the head. Track jacket color: sunny yellow.';
const NARA = 'Who: "Nara". Head shape: a round ball, slightly wider than tall, with ONE thin curved antenna on top. Small upright oval eyes. Track jacket color: fresh green.';
const IGUCHI = 'Who: "Iguchi". Head shape: a rounded square box, wider than tall, with TWO thin antennae on top (plain lines, no balls on the tips). Small black oval eyes, thin eyebrows. Track jacket color: soft pink.';
const EXPR = {
  normal: 'Expression: calm friendly face, arms relaxed at sides.',
  smile: 'Expression: big happy open smile, one hand giving a thumbs-up.',
  worry: 'Expression: worried, eyebrows tilted up in the middle, small wavy mouth, one hand scratching the back of the head, a small sweat drop.',
};

const GENDAI = [
  ...['normal', 'smile', 'worry'].map((e) => team('sone', SONE, e, EXPR[e], e === 'normal' ? 'A' : 'B')),
  ...['normal', 'smile', 'worry'].map((e) => team('nara', NARA, e, EXPR[e], e === 'normal' ? 'A' : 'B')),
  ...['normal', 'smile', 'worry'].map((e) => team('iguchi', IGUCHI, e, EXPR[e], e === 'normal' ? 'A' : 'B')),
  {
    id: 'senpai_tri',
    group: 'gendai',
    prio: 'B',
    out: 'img/chara/gendai/senpai_tri.webp',
    kind: 'chara',
    bgmode: 'white',
    refs: ['art-src/ref/manga_4_03.jpg', 'art-src/ref/manga_4_05.jpg'],
    style: ['GENDAI_TEAM', 'CHARA_OUT'],
    diff: 'Who: a strict senior trainer with NO face: the head is a tall rounded black shape filled solid black, with a single small white triangle mark in the middle where a face would be, and a white headband (hachimaki) tied around the head with the knot on the side. White track jacket with a tall collar. Arms crossed. Stern, imposing presence but not violent, holding nothing.',
    used: '現代編の「影の 先輩」（senpai:normal・17回）',
    note: '原作の 先輩は 顔が 黒く 塗られて いる（▲の 印）。いまは タイプ別 ロボットを 黒い 影に して 代用。これが できたら 影の フィルター（silhouette: true）を 外す',
  },
  {
    id: 'senpai_bar',
    group: 'gendai',
    prio: 'C',
    out: 'img/chara/gendai/senpai_bar.webp',
    kind: 'chara',
    bgmode: 'white',
    refs: ['art-src/ref/manga_4_03.jpg', 'art-src/ref/manga_4_05.jpg'],
    style: ['GENDAI_TEAM', 'CHARA_OUT'],
    diff: 'Who: a second strict senior trainer with NO face: a broad square-ish head filled solid black, with a single small white horizontal bar mark where a face would be, a white headband (hachimaki). Bigger, bulkier build in a white track jacket. One hand raised with the palm open, announcing something. Stern but not violent, holding nothing.',
    used: '現代編 10話（スポーツ大会の 説明を する 先輩）',
    note: '原作 #4 の ▭ の 先輩。いまは 1人の 影で 両方を 兼ねて いる',
  },
  {
    id: 'okami',
    group: 'gendai',
    prio: 'C',
    out: 'img/chara/gendai/okami.webp',
    kind: 'chara',
    bgmode: 'white',
    refs: ['public/img/chara/nexmax.webp'],
    style: ['GENDAI_TEAM', 'CHARA_OUT'],
    diff: 'Who: the landlady of the training-camp inn: a middle-aged robot-like woman with a round plain white face and simple eyes, hair tied up in a bun, a dark kimono with a white kappogi apron. Expression: tired and gloomy, eyes half closed, hands folded in front — she knows the training is hard.',
    used: '現代編 3話（研修所の おかみさん）',
    note: '',
  },
];

// ---------------------------------------------------------------------------
// むかし編の 村人
// ---------------------------------------------------------------------------

const MUKASHI_FOLK = [
  {
    id: 'sonchou_normal',
    group: 'mukashi_folk',
    prio: 'B',
    out: 'img/chara/mukashi/sonchou_normal.webp',
    kind: 'chara',
    bgmode: 'white',
    refs: ['public/img/design/山の向こうの生命草.png', 'public/img/bg/mukashi_village.webp'],
    style: ['MUKASHI_FOLK', 'CHARA_OUT'],
    diff: 'Who: the village chief, a very old kind man with a smooth tall egg-shaped bald head, fluffy white eyebrows, a small white beard, a round red nose, wearing a dark-red haori over a grey kimono, holding a crooked wooden walking staff. Expression: worried but gentle, eyes half closed, one hand open as if asking a favor.',
    used: 'むかし編 2話（sonchou:normal）',
    note: '設計参照 山の向こうの生命草.png の 村長を 正典に する。いまは タイプ別 ロボット（ISTJ）で 代用',
  },
  {
    id: 'hana_normal',
    group: 'mukashi_folk',
    prio: 'B',
    out: 'img/chara/mukashi/hana_normal.webp',
    kind: 'chara',
    bgmode: 'white',
    refs: ['public/img/design/山の向こうの生命草.png', 'public/img/bg/mukashi_village.webp'],
    style: ['MUKASHI_FOLK', 'CHARA_OUT'],
    diff: 'Who: "Hana", a cheerful village girl of about ten who teaches letters at the wooden schoolhouse, black hair in two short pigtails tied with red cloth, a simple blue-and-white patterned kimono with sleeves tied back, straw sandals, a small straw basket on one arm. Expression: warm teasing smile.',
    used: 'むかし編 1話（hana:normal）・8話の 回想',
    note: 'いまは タイプ別 ロボット（ISFJ_f）で 代用',
  },
];

// ---------------------------------------------------------------------------
// 敵（ボス）— ステージ ごとに 1体
// ---------------------------------------------------------------------------

const enemy = (stage, name, diff, prio, note = '') => ({
  id: `enemy_${stage.replace('-', '')}`,
  group: 'enemy',
  prio,
  out: `img/enemy/${stage}.webp`,
  kind: 'enemy',
  bgmode: 'white',
  refs: stage.startsWith('mukashi') ? ['public/img/bg/mukashi_village.webp', 'public/img/design/森の漢字バトル画面.png'] : ['public/img/design/森の漢字バトル画面.png'],
  style: ['ENEMY'],
  diff,
  used: `${stage} の ボス「${name}」（戦いの前・バトル）`,
  note,
});

const ENEMIES = [
  enemy('mukashi-1', '田んぼの かかし', 'Creature: a living straw scarecrow that guards a rice field, a battered straw hat, a patched blue work kimono, a round sackcloth face with two button eyes and a stitched mischievous grin, arms stretched along its wooden cross pole, bits of straw flying off it.', 'A'),
  enemy('mukashi-2', '見えない やまい', 'Creature: an invisible sickness given a shape — a translucent purple-grey mist spirit, a soft floating cloud with sleepy droopy eyes and a wavering mouth, tiny glowing spores drifting around it. Semi-transparent, eerie but soft.', 'A'),
  enemy('mukashi-3', '川の ぬし', 'Creature: the guardian of the mountain river — a big water serpent with a whiskered catfish-like face, its long body made of flowing clear blue water and smooth river stones, rising out of a splash. Fierce but noble, not evil.', 'A'),
  enemy('mukashi-4', '巨大バチ', 'Creature: a giant bee with a round fuzzy orange-and-black body, big shiny compound eyes, comically angry eyebrows, buzzing translucent wings, a stinger visible but nothing dripping.', 'A', 'いまは 絵本の 切り絵（bee）で 描いて いる。これが できたら 画像に 替える'),
  enemy('mukashi-5', '異空間の かげ', 'Creature: a shadow from another dimension — a tall dark-purple silhouette with long wispy arms, two glowing violet eyes, its lower body dissolving into swirling particles of void and stars.', 'A'),
  enemy('mukashi-6', '森の ぬし', 'Creature: the ancient guardian of the forest — a walking tree spirit with a stern but kind face in its bark, a beard of moss, antler-like branches with fresh leaves, thick roots for feet.', 'A'),
  enemy('mukashi-7', 'つるつるの みき', 'Creature: a living piece of an impossibly smooth giant tree trunk, its shiny slippery bark reflecting light, a grumpy face in the wood, no branches at all, a few patches of moss sliding off, stubby root feet.', 'A'),
  enemy('mukashi-8', 'きざみを けす 風', 'Creature: a whirlwind spirit that erases carvings — a swirling cone of pale golden wind with two sly narrow eyes, carrying leaves and curly wood shavings around it.', 'A'),
  enemy('mukashi-9', '空の まもりて', 'Creature: the guardian of the sky above the clouds — a majestic white-and-gold eastern dragon coiled among clouds, glowing calm eyes, a mane like soft cloud. Noble and powerful, not evil.', 'A'),
  enemy('mukashi-10', '生命草の ぬし', 'Creature: the master of the Life Leaf at the top of the great tree — a large flowering vine spirit with a bulb-like body, a crown of softly luminous green leaves and one big blooming flower, curling vines for arms, a gentle green glow.', 'A'),
  // 現代編: 敵は 人では なく 気持ち（docs/design/07 §4）。暴力を 描かない。
  enemy('gendai-1', 'きんちょう', 'Creature: nervousness given a shape — a small trembling pale-pink round blob with a big heart shape pounding inside it, wobbly outline, sweat drops flying off, wide nervous eyes.', 'A', '現代編の 敵は 人では なく 気持ち。人の 姿に しない'),
  enemy('gendai-2', 'ながい 道のり', 'Creature: "the long road" — a long winding road ribbon coiled like a lazy snake, dashed center lines along its body, its head a round blank road-sign (no text) with tired half-closed eyes.', 'A'),
  enemy('gendai-3', '暗い 森の しずけさ', 'Creature: the silence of the dark forest — a quiet dark green-grey fog wisp with two hollow round eyes, pine needles caught in its misty body, drifting slowly.', 'A'),
  enemy('gendai-4', 'せまる 時計', 'Creature: the approaching clock — a round wall clock creature with small legs, its two clock hands used as arms, anxious impatient eyes on the clock face, NO numerals (use simple dots instead of numbers), little motion lines of ticking.', 'A'),
  enemy('gendai-5', 'こわい 声', 'Creature: the scary voice — a black megaphone-shaped shadow floating in the air, jagged white sound-wave shapes bursting from its mouth, no face except one small white triangle mark. No person, no hands, no violence.', 'A', '原作の 先輩の ▲ の 印を 借りる。人の 姿に しない'),
  enemy('gendai-6', 'ひとりぼっちの きもち', 'Creature: loneliness — a small grey rain cloud with a sad face, rain falling only on itself, a tiny cracked heart floating inside the cloud.', 'A'),
  enemy('gendai-7', 'なかまわれ', 'Creature: a falling-out between friends — one flame spirit split down the middle into two halves, orange and red, turned away from each other and glaring sideways.', 'A'),
  enemy('gendai-8', 'あきらめたい 気持ち', 'Creature: the wish to give up — a heavy slumping figure made of dull blue cracked glass, head hanging, faint light glowing from the cracks.', 'A'),
  enemy('gendai-9', 'プレッシャー', 'Creature: pressure — a huge dark iron weight with stern eyes, a harsh golden spotlight shining down on it from above and a microphone stand bending under it.', 'A'),
  enemy('gendai-10', 'つきない つかれ', 'Creature: endless tiredness — a sand-colored dust creature shaped like a worn running shoe, droopy eyes, big sweat drops, a long trail of dust behind it.', 'A'),
];

// ---------------------------------------------------------------------------
// 背景（場面）— 1場面に 2枚: bg（奥・動かない）と fg（手前・ゆれる、透過）
// ---------------------------------------------------------------------------

const scene = (sceneId, prio, arc, bgDiff, fgDiff, ref, note = '') => [
  {
    id: `${sceneId}_bg`,
    group: `bg_${arc}`,
    prio,
    out: `img/scenes/${sceneId}/bg.webp`,
    kind: 'bg',
    bgmode: 'none',
    refs: ref ? [ref] : arc === 'mukashi' ? ['public/img/bg/mukashi_village.webp'] : ['public/img/bg/mukashi_village.webp'],
    style: ['BG_COMMON', arc === 'mukashi' ? 'BG_MUKASHI' : 'BG_GENDAI'],
    diff: `Scene: ${bgDiff}`,
    used: `場面 ${sceneId}（お話・バトルの 上半分・戦いの前）`,
    note,
  },
  {
    id: `${sceneId}_fg`,
    group: `bg_${arc}`,
    prio: prio === 'A' ? 'B' : 'C',
    out: `img/scenes/${sceneId}/fg.webp`,
    kind: 'fg',
    bgmode: 'alpha',
    refs: [`art-src/${sceneId}_bg.png`],
    style: ['FG_LAYER', arc === 'mukashi' ? 'BG_MUKASHI' : 'BG_GENDAI'],
    diff: `Foreground elements: ${fgDiff} Match the colors and lighting of the reference background exactly.`,
    used: `場面 ${sceneId} の 手前（風で ゆれる）`,
    note: 'bg を 撮った あと、その bg を 参照に して 撮る',
  },
];

const BG = [
  ...scene('title', 'A', 'mukashi', 'a wide fantasy picture-book world seen from a grassy hilltop at morning: a farming valley with thatched-roof houses and golden rice fields below, a green mountain in the middle distance, and far away an impossibly tall great tree rising into the clouds. The upper 45% is bright open sky with soft sunbeams and small clouds — kept empty for the game logo.', 'tall grass, wildflowers and a few mossy rocks along the bottom edge, leafy branches reaching in from the top-left and top-right corners.', 'public/img/bg/title_keyart.webp', 'タイトル画面の 背景。ロゴは 画像に 入れない（文字で 重ねる。ふりがなの ため）'),
  ...scene('mukashi_meadow', 'A', 'mukashi', 'a gentle green meadow of rolling hills under a clear sky, distant soft blue mountains, scattered wildflowers, one lone tree on a far hill.', 'tufts of grass and small wildflowers along the bottom edge, a leafy bush at the left and right edges.', 'public/img/bg/mukashi_village.webp', 'メニュー画面（合成・図鑑・毎日・せってい など）の 後ろ'),
  ...scene('mukashi_village', 'A', 'mukashi', 'the farming village of the picture book: a wide valley in bright midday sun, thatched-roof houses, pale-gold rice fields, a dirt path winding between them, green hills and blue mountains behind. The same place as the reference page but with NO people and NO text.', 'leafy green bushes framing the bottom-left and bottom-right corners.', 'public/img/bg/mukashi_village.webp', 'むかし編 1・2話。絵本の 1ページ目の 文字と 人の 無い 版'),
  ...scene('mukashi_mountain', 'A', 'mukashi', 'a steep green mountain seen from its foot, a clear mountain river running down from it, dark storm clouds gathering over the far ridge while blue sky still holds on the left.', 'tall pine trees at the left and right edges, river-bank grass along the bottom.', 'public/img/bg/mukashi_mountain.webp', 'むかし編 3話（雨の fx は プログラムで 重ねる）'),
  ...scene('mukashi_wildpath', 'A', 'mukashi', 'a dry exposed ridge path of brown earth and sparse scrub, green slopes falling away on both sides, harsh afternoon light.', 'dry scrub grass and a few stones along the bottom edge.', 'public/img/bg/mukashi_wildpath.webp', 'むかし編 4話（イノシシと ハチは プログラムで 重ねる）'),
  ...scene('mukashi_portal', 'A', 'mukashi', 'a shaded forest clearing at the foot of a thick old tree, soft dappled light, the air at center-right left empty (a glowing portal is added by the game).', 'ferns and roots along the bottom edge, dark tree trunks at the left and right edges.', 'public/img/bg/mukashi_portal.webp', 'むかし編 5話。光の 入口は プログラムで 重ねるので 描かない'),
  ...scene('mukashi_forest', 'A', 'mukashi', 'a deep green forest interior, tall straight trunks, dappled light on mossy ground, a faint path leading forward.', 'tree trunks and ferns at the left and right edges.', 'public/img/bg/mukashi_forest.webp', 'むかし編 6話'),
  ...scene('mukashi_greattree', 'A', 'mukashi', 'looking up at an impossibly vast smooth tree trunk that fills the frame and vanishes into white cloud, no branches within reach, a small mossy clearing at the base.', 'moss, ferns and big roots along the bottom edge.', 'public/img/bg/mukashi_greattree.webp', 'むかし編 7・8話'),
  ...scene('mukashi_cloudsea', 'A', 'mukashi', 'above a sea of white clouds at sunrise, the top of the giant tree trunk rising at one side, the tiny village visible through a gap in the clouds far below.', 'a soft bank of white cloud along the bottom edge.', 'public/img/bg/mukashi_greattree.webp', 'むかし編 9話'),
  ...scene('mukashi_treetop', 'A', 'mukashi', 'the crown of the giant tree above the clouds: broad green leaves and thick branches catching golden sunrise light, a sea of white cloud below, the center left clear (the Life Leaf is added by the game).', 'big broad leaves at the bottom-left and bottom-right corners.', 'public/img/bg/mukashi_greattree.webp', 'むかし編 10話。生命草は プログラムで 重ねる'),
  ...scene('gendai_hall', 'B', 'gendai', 'a ceremony room rented in a first-class hotel: a stage with a wooden podium and a plain dark-red backdrop with NO writing, rows of chairs seen from behind, warm spotlights.', 'the backs of the front row of chairs along the bottom edge.', null, '現代編 1・9話（入社式）。垂れ幕に 文字を 入れない'),
  ...scene('gendai_bus', 'B', 'gendai', 'inside a coach bus looking forward over the rows of seat backs through the big windshield: a highway leading toward a large Mt Fuji, late afternoon light.', 'the tops of seat backs along the bottom edge.', null, '現代編 2話'),
  ...scene('gendai_forest', 'B', 'gendai', 'a lone two-storey training-center building with lit windows, surrounded on all sides by a dense dark sea of trees at the foot of Mt Fuji, dusk, a gloomy quiet mood.', 'dark pine trees at the left and right edges, undergrowth along the bottom.', null, '現代編 3話（樹海の 研修所）'),
  ...scene('gendai_dining', 'B', 'gendai', 'a plain institutional dining hall, long wooden tables and benches, a round wall clock with NO numerals (dots only), dim tense evening light.', 'the edge of a long table along the bottom.', null, '現代編 4・5話。先輩の 影と 時計の 針は プログラムで 重ねる'),
  ...scene('gendai_room', 'B', 'gendai', 'a small Japanese tatami room at night, futons laid out, a paper lamp, a window showing the moon over dark trees.', 'the edge of a futon and a pillow along the bottom.', null, '現代編 6話（自己紹介）'),
  ...scene('gendai_lake', 'B', 'gendai', 'a calm lake at dawn with Mt Fuji and its reflection, pink-orange sky, mist on the water, a grassy shore in the foreground.', 'reeds and shore grass along the bottom edge.', null, '現代編 7話'),
  ...scene('gendai_city', 'B', 'gendai', 'a city street in Osaka on a clear morning: modest office buildings, a crosswalk, a few street trees; NO signboards with text, no people.', 'leafy street-tree branches at the left and right edges.', null, '現代編 8・9話（春の 桜は プログラムで 重ねる）'),
  ...scene('gendai_office', 'B', 'gendai', 'a bright interview room: a long desk with two empty chairs behind it, a large window showing a city skyline, a potted plant.', 'the near edge of the desk along the bottom.', null, '現代編 8話（面接）'),
  ...scene('gendai_ground', 'B', 'gendai', 'a dirt sports ground at a training camp, two long straight white lines drawn across the ground about 25 meters apart, Mt Fuji and dark forest behind, bright afternoon.', 'dry grass along the bottom edge.', null, '現代編 10話（シャトルラン）'),
];

// ---------------------------------------------------------------------------
// 0章「はじまりの 空港」（08 §3.7）— ナニワタウンへ 向かう 前の 空港。
// 1話の 展望デッキは 渡された 素材（public/img/stageselect/bg_tall.webp）を そのまま 使う。
// ---------------------------------------------------------------------------

const naniwa = (id, desc, used) => ({
  id,
  group: 'bg_naniwa',
  prio: 'A',
  out: `img/naniwa/${id}.webp`,
  kind: 'bg',
  bgmode: 'none',
  refs: ['public/img/stageselect/bg_tall.webp'],
  style: ['BG_COMMON', 'BG_NANIWA'],
  diff: `Scene: ${desc}`,
  used,
  note: '絵本の 場面（scenes.ts の photo）として 使う',
});

const CREATURES = [
  {
    id: 'mojikui_kid',
    group: 'enemy',
    prio: 'A',
    out: 'img/battle/mojikui_kid.webp',
    kind: 'chara',
    bgmode: 'white',
    refs: ['art-src/battle/04_敵_モジクイ.png'],
    style: ['CREATURE_NANIWA'],
    diff: 'Creature: a YOUNG Mojikui, the letter-eater\'s little one — a small round blob of ink shadow about the size of a cat, big round glowing amber eyes and a cheeky grin, one crumpled paper talisman worn like a tiny hat, two or three small paper slips stuck to its body, short stubby ink tendrils, a few ink droplets floating around it. Clearly smaller, rounder and sillier than the reference, but obviously the same kind of creature.',
    used: '1章 1話の あいて「モジクイの こども」（出会いの お話・たたかい）',
    note: '白い 背景を import.mjs が 切り抜く',
  },

  ...[
    ['mojikui_clock', 'the Mojikui gnawing on a big round brass clock face held in its inky claws, clock hands sticking out of its grinning mouth, a few loose brass numerals-free dial pieces and gear crumbs floating around; same size and shape as the reference.', '1章 3話の あいて（時計を かじる モジクイ）'],
    ['mojikui_gear', 'the Mojikui tangled in brass gears and springs, several small gears stuck in its inky body like armour, chewing a small blank metal number plate, a wrench-shaped tendril; same size and shape as the reference.', '1章 4話の あいて（歯車の モジクイ）'],
    ['mojikui_price', 'the Mojikui covered in blank paper price tags on strings and a few gold coins stuck to it, stuffing a stack of blank price tags into its mouth, coins spilling; same size and shape as the reference.', '1章 5話の あいて（値札の モジクイ）'],
    // 1章 12話 まとめの ボス（10 §3）
    ['mojikui_boss', 'the GREAT Mojikui, the grown-up letter-eater at the heart of its nest: much bigger, taller and grander than the reference, a towering swirl of black-violet ink smoke with two huge glowing amber eyes and a wide grin, a crown of crumpled blank paper talismans, long tendrils clutching blank trophies of everything it ate in the town — a calendar page, a wooden name plate, a brass clock hand, a price tag, a bus-stop sign, an open book — and a ribbon of tiny golden letter-motes being slurped into its mouth. Imposing but kid-friendly, never gory.', '1章 12話 まとめの ボス「大モジクイ」'],
    // 1章 6〜11話（10 §4）
    ['mojikui_nametag', 'the Mojikui wearing a long necklace of blank wooden name plates on strings and a little cape stitched from blank name badges, chewing one name plate with a smug grin, a few blank badges floating around; same size and shape as the reference.', '1章 6話の あいて（名札の モジクイ）'],
    ['mojikui_book', 'the Mojikui with an open book held up to its wide grinning mouth, slurping the pages, a few blank pages fluttering around it, a stack of books with blank covers tucked under one inky arm; same size and shape as the reference.', '1章 7話の あいて（本の モジクイ）'],
    ['mojikui_clocktower', 'a BIGGER Mojikui with a huge round stopped clock-tower dial (blank, no numerals) set into its chest, two long ornate brass clock hands rising from its head like horns, a brass pendulum swinging from its tail, its inky body half deep night-blue with tiny stars and half dawn-orange; noticeably larger and grander than the reference.', '1章 8話の あいて（時計台の モジクイ）'],
    ['mojikui_signboard', 'the Mojikui hiding behind a big blank wooden shop signboard held like a shield, a blank hanging open/closed board around its neck, a half-lowered metal shop shutter for a jaw, a loaf of bread in one tendril; same size and shape as the reference.', '1章 9話の あいて（看板の モジクイ）'],
    ['mojikui_bus', 'the Mojikui gripping a big brass bus steering wheel, two round bus headlights glowing on its body, a bent bus-stop pole with a blank round sign as a staff, small rubber wheels under its inky skirt, a torn blank bus timetable in its mouth; same size and shape as the reference.', '1章 10話の あいて（バスの モジクイ）'],
    ['mojikui_station', 'the Mojikui coiled around a blank station name board, curls of train track and sleepers for tendrils, a small station clock (blank dial) on its head like a hat, puffs of steam, blank paper train tickets swirling around; same size and shape as the reference.', '1章 11話の あいて（駅の モジクイ）'],
  ].map(([id, diff, used]) => ({
    id,
    group: 'enemy',
    prio: 'A',
    out: `img/battle/${id}.webp`,
    kind: 'chara',
    bgmode: 'white',
    refs: ['art-src/battle/04_敵_モジクイ.png'],
    style: ['CREATURE_NANIWA'],
    diff: `Creature: ${diff}`,
    used,
    note: '白い 背景を import.mjs が 切り抜く',
  })),
];

const NANIWA = [
  naniwa('naniwa_sky_garden', 'the rooftop garden of a grand airport terminal at sunset: in the middle an old cherry tree with bare branches (no blossoms, no leaves) in a round brass-edged planter, stone paving, brass railings and glass-paned lanterns, planters with small shrubs; a few small BLANK wooden signboards hang from the branches; beyond the railing the airport apron with parked jets and, far across the bay, a town skyline with a red Ferris wheel.', 'かな編 2話（屋上の 庭・顔の ない 桜の 木）'),
  naniwa('naniwa_lounge', 'inside a quiet airport departure lounge at dusk: rows of brass-and-leather waiting seats, a huge arched window wall showing a jet at the gate under an orange sunset sky, warm hanging lanterns, on the left wall a board covered in small BLANK name tags (lost and found), a polished floor reflecting the light. Empty and slightly melancholic.', 'かな編 3話（待合・名前の ない 犬）'),
  naniwa('naniwa_walkway', 'a long glass-roofed connecting walkway from the airport terminal toward the train station, at dusk, seen looking down its length: a moving walkway, simple arrow shapes on the floor (no letters), brass ribs holding the glass, hanging lanterns; through the glass on the right, the sea, a long bridge, and a town on a high hill across the bay with warm lights.', 'かな編 4話（駅への 連絡通路・黒い 煙）'),
  naniwa('naniwa_runway_night', 'the airport apron and runway at night after every light has gone out: deep indigo sky with NO stars at all, dark silhouettes of parked jets and a control tower, rows of unlit runway lamps, only a faint warm glow from a few distant windows; calm dark ground in the foreground.', 'かな編 5話（灯りの 消えた 夜の 滑走路。星は お話で 戻る）'),
  naniwa('naniwa_station', 'the airport train station platform in the early morning: a brass-and-glass steampunk station roof with gears and pipes, a sleek BLUE train waiting on one side and a RED train on the other, ticket machines and gates in the background whose screens and signs are all blank, soft dawn light from the open end of the platform, hanging lanterns.', 'かな編 6〜8話（空港の 駅・切符・青い 電車と 赤い 電車）'),
  naniwa('naniwa_town_station', 'inside the main station of Naniwa Town on the morning the train arrives: a grand steampunk concourse with brass pillars, a glass roof and hanging lanterns; on the wall a huge station calendar board with a row of seven EMPTY dark panels, and above it a big round clock with no numerals (dots only); a blue train at a platform on one side. No people.', '1章 1話「きえた カレンダー」（町の 駅・空っぽの カレンダー）'),
  naniwa('naniwa_station_square', 'the square in front of Naniwa Town station in the morning: a large town-map board in a brass frame showing only simple drawn shapes (a mountain, a river, rice fields — no letters at all), shopfronts with BLANK signboards, lanterns and a few street trees, and beyond the rooftops a green mountain rising behind the town. No people.', '1章 2話「山田さん」（駅前の 広場・町の 地図）'),
  naniwa('naniwa_ropeway', 'a ropeway (aerial tramway) station at the foot of the green mountain behind the town, in the golden afternoon: a steampunk brass-and-glass station hall with a huge cable wheel and gears, a red gondola stopped on the cable at the platform, the cable climbing up the mountain behind; on the back wall a large timetable board with a single row of FIVE EMPTY dark rectangular panels side by side (their numbers eaten), a big round clock with no numerals above it; lanterns, a ticket window with a blank sign. No people.', '1章 3話「山の ロープウェー」（時刻表の 一〜五が 消えた）'),
  naniwa('naniwa_factory', 'inside a robot workshop-factory on the mountain top at dusk: brass gears, pipes, chains and conveyor belts, warm lamps; a long workbench where a row of small round friendly robots sit slumped asleep with their eyes closed (no faces drawn on screens, just closed-eye lines), tools lying still, a big stopped gear wall; large windows showing the town far below and the sea. Quiet and still, as if everything has stopped.', '1章 4話「なかまの ロボット」（番号を 食べられて 眠った ロボット）'),
  naniwa('naniwa_market', 'a covered market street at the foot of the mountain in the evening: rows of stalls under striped awnings with fruit, vegetables, fish, bread and small toys, steampunk brass lanterns and hanging bulbs, a big blank signboard over the street; every price tag and card on the goods is BLANK (small empty white cards). No people. Warm, lively colours but oddly quiet.', '1章 5話「いくらですか」（値札が 消えた 市場）'),
  // 1章 12話 まとめの ボス（10 §2）: 巣と、灯りが 戻った 町。
  naniwa('naniwa_nest', 'the Mojikui nest deep in the tunnel beyond the station: a vast underground cavern of old brick arches and abandoned rail tracks, heaped with piles of eaten BLANK signboards, name plates, clock faces, price tags, bus-stop signs and books; purple-black ink mist pooling on the ground; thousands of tiny golden letter-motes trapped inside floating ink bubbles, glowing faintly; far away at the end of the tunnel a small warm glimmer of daylight. Spooky but kid-friendly. No people.', '1章 12話 まとめの ボス（モジクイの 巣）'),
  naniwa('naniwa_lights_back', 'Naniwa Town at dawn seen from the hill above the station, every light back on: thousands of warm windows, lanterns and shop signs glowing along the streets, the clock tower, the school and the market all lit, the red Ferris wheel by the bay; the sky turning gold and pink; far across the sea, on the horizon, another town wrapped in a thick soft white mist, only a few rooftops and a tall tower showing through. Hopeful and calm. No people.', '1章 12話 クリア（町の 灯りが ぜんぶ 戻り、遠くの 町に 霧）'),
  // 1章 6〜11話（10 §2）: 字は 絵の 上に 掛かる 札（scenes.ts の boardRows）で 灯る。
  naniwa('naniwa_school', 'a small Japanese-language school in a converted brick-and-brass townhouse on a quiet morning street: the entrance hall seen through wide-open doors, a big BLANK blackboard, rows of small wooden desks, a shoe rack, and by the door a wooden board of little BLANK name plates hanging on hooks; potted plants, glass lanterns, soft morning sunlight. No people.', '1章 6話「はじめまして」（名札が 消えた 日本語学校）'),
  naniwa('naniwa_clinic', 'the waiting room of a small, friendly town clinic next to the school, late morning: a reception counter with a blank sign, a doctor\'s door with a blank brass name plate, a tall wooden bookshelf full of books with BLANK spines, a big world-map poster showing only continents (no letters), cushioned benches, potted plants, a simple heart symbol on the wall (no cross). Clean, calm mint-green and cream walls with warm lamps. No people.', '1章 7話「びょういんの 本」（医者の 札と 本の 字が 消えた）'),
  naniwa('naniwa_clocktower', 'the town square at the moment night should turn into morning, in front of a tall steampunk brick-and-brass clock tower: a huge round clock face whose numerals have been eaten (a BLANK dial, the hands stopped), gears showing through the glass, the sky split between deep starry night and a faint dawn glow that cannot arrive, unlit lanterns, cobblestones, pigeons asleep on the ledges, a blank brass plaque at the base. No people.', '1章 8話「とまった 時計台」（文字盤が 食べられ 朝が 来ない）'),
  naniwa('naniwa_shopstreet', 'a covered shopping arcade of Naniwa Town at mid-morning: a bakery, a flower shop, a small cafe and a bookshop under a glass arcade roof with brass ribs; every shop\'s shutter half-lowered, every opening-hours board, hanging open/closed sign and signboard BLANK; hanging lanterns and little pennant flags without letters. Bright day but strangely quiet. No people.', '1章 9話「お店は 休み？」（営業時間の 札が 消えた 商店街）'),
  naniwa('naniwa_bus_stop', 'a bus stop in front of the school gate on a tree-lined street in the golden afternoon: a round-fronted steampunk town bus (cream and teal, brass trim) stopped at the curb with its destination display BLANK, a bus-stop pole with a blank round sign and a blank timetable panel, the school gate and building behind with a blank calendar board on the wall, autumn trees with orange leaves. No people.', '1章 10話「学校へ 行く」（予定表と 行き先が 消えた）'),
  naniwa('naniwa_station_deep', 'the far end of Naniwa Town\'s main station at dusk: a long platform running toward a dark tunnel mouth from which purple-black ink mist seeps along the tracks; a stopped train with BLANK destination boards, a bicycle parking rack with a row of bicycles, the station name board BLANK, lanterns flickering; mysterious and a little spooky but kid-friendly. No people.', '1章 11話「でんしゃが 動かない」（駅の 名前・電車・自転車の 字が 消えた。奥は モジクイの 巣）'),
  naniwa('naniwa_train', 'inside a blue commuter train crossing a long bridge over the bay at sunrise: rows of seats on both sides, brass handrails and hanging straps, big windows showing the sea and, straight ahead, a town on a high hill with a red Ferris wheel catching the morning light.', 'かな編 9話（海を わたる 青い 電車）'),
  {
    ...naniwa('naniwa_last_car', 'the last car of the blue commuter train on the bridge over the bay at sunset, the connecting door thrown open: inside, the whole car has become a swirling whirlpool of tiny glowing golden motes of light and blank cream paper slips spinning in a vortex between the brass handrails and hanging straps; at the center of the whirlpool the ink-shadow creature from the second reference image (black-violet ink smoke, glowing amber eyes, paper talismans) slurps a long ribbon of golden motes into its mouth like noodles; the windows on both sides show the sea glowing orange. Exciting but kid-friendly.', 'かな編 10話（最後の 車両・字の 渦）'),
    refs: ['art-src/naniwa_train.png', 'art-src/battle/04_敵_モジクイ.png'],
  },
];

// ---------------------------------------------------------------------------
// ナニワタウンの ネクマックス — 新ルート（かな編・1章〜）の 立ち絵。むかし編の 平たい 絵（img/chara/cut）は そのまま。
// ---------------------------------------------------------------------------

const NX_PAINTED = 'art-src/titlesozai/01_ネクマックス_キャラクター.png';
const nxPainted = (pose, diff, used) => ({
  id: `nexmax_naniwa_${pose}`,
  group: 'nexmax_naniwa',
  prio: 'A',
  out: `img/chara/naniwa/nexmax_${pose}.webp`,
  kind: 'chara',
  bgmode: 'white',
  refs: [NX_PAINTED],
  style: ['NEXMAX_PAINTED', 'CHARA_OUT'],
  diff: `Pose and expression: ${diff}`,
  used,
  note: '白い 背景を import.mjs が 切り抜く',
});

const NEXMAX_NANIWA = [
  nxPainted('normal', 'standing relaxed and friendly, arms loosely at his sides, a gentle smile, looking at the viewer.', 'ふだん'),
  nxPainted('smile', 'overjoyed, both arms raised high in a cheer, eyes happily curved, mouth open in a big smile, a little hop.', 'よろこぶ・ほめる'),
  nxPainted('think', 'worried and puzzled: one mitten hand at his chin, the other arm hugging his body, eyebrows tilted up anxiously, a small wobbly mouth, head slightly tilted.', 'こまる・かなしい・ふしぎ（「たすけて」「……😢」）'),
  nxPainted('determined', 'determined and ready: leaning forward, both fists clenched in front of his chest (not covering the chest mark), brows set, a confident grin; the chest mark glowing with a warm amber light.', 'いそぐ・がんばる（「かく！」「いそいで！」）'),
  nxPainted('guide', 'guiding: one arm stretched out pointing up and to the side with his mitten hand, the other hand on his hip, a cheerful encouraging smile, looking toward where he points.', 'あんない（「うえ！👆」「かいて！」）'),
  nxPainted('hello', 'greeting: waving one hand high above his head, the other hand at his side, a bright friendly smile.', 'あいさつ'),
];

// ---------------------------------------------------------------------------
// 町の 人の 表情 — 字が 消えて 困る 顔と、戻って よろこぶ 顔（2026-10-02「もっと 文字が なくて
// みんな 困って いる 表情に したり 工夫が 欲しい」）。元の 絵は public/img/chara/types。
// ---------------------------------------------------------------------------

const folk = (id, type, diff, used) => ({
  id: `folk_${id}`,
  group: 'folk_naniwa',
  prio: 'A',
  out: `img/chara/naniwa/folk_${id}.webp`,
  kind: 'chara',
  bgmode: 'white',
  refs: [`public/img/chara/types/${type}.webp`],
  style: ['FOLK_PAINTED', 'CHARA_OUT'],
  diff: `Pose and expression: ${diff}`,
  used,
  note: '白い 背景を import.mjs が 切り抜く',
});

/**
 * 町の 人は 人（2026-10-03）。ロボットの なかま（types の 16体）と 見分けが つく ように、
 * 七ばん（工場の ロボット）だけ ロボットの まま。1人 2枚の ときは 1枚目（よろこぶ 顔）を
 * 先に 作り、2枚目は それを 参照に して 同じ 人に する。
 */
const PEOPLE = {
  traveler: { ref: 'ESTP', who: 'a cheerful young man in his twenties, a backpacker: messy short brown hair, sunglasses pushed up on his head, an orange hoodie, khaki cargo shorts, sneakers, a small yellow rolling suitcase' },
  girl: { ref: 'ISFP_f', who: 'a little girl about seven years old: a short black bob with a yellow star hair clip, a yellow raincoat over a white dress, red rain boots' },
  kiosk: { ref: 'ISFJ_f', who: 'a friendly young woman in her twenties who works at the airport kiosk: brown hair in a low bun, a light-blue cap and a light-blue apron over a white shirt' },
  staff: { ref: 'ISTJ', who: 'a polite middle-aged station clerk: neat short black hair, a navy station uniform with a peaked cap and white gloves' },
  announcer: { ref: 'ESTJ', who: 'an energetic young station guide in his twenties: short spiky black hair, a navy uniform vest over a white shirt, a red armband, a megaphone' },
  ropeway: { ref: 'ISTP', who: 'a sturdy ropeway mechanic in his thirties: a twisted towel headband, a grey work jumpsuit with rolled-up sleeves, a tool belt, a wrench' },
  vendor: { ref: 'ESFP', who: 'a lively market vendor in his fifties: a round friendly face, short grey hair under a red-and-white twisted headband, a red festival happi coat over a white T-shirt, a green apron' },
  teacher: { ref: 'ISTJ_f', who: 'a kind language-school teacher in her thirties: black hair in a neat bun, round glasses, a navy blazer over a light-blue blouse, a long grey skirt' },
  office: { ref: 'ESFJ', who: 'an office worker man in his thirties: neat side-parted black hair, a grey suit with a blue tie, a slim brown leather briefcase' },
  doctor: { ref: 'INTP_f', who: 'a cheerful doctor in her forties: a short brown bob, a white lab coat over a green top, a stethoscope around her neck' },
  rin: { ref: 'INFP_f', who: 'Rin, a 16-year-old exchange student: long straight black hair in a high ponytail with a pink scrunchie, a pink knit scarf, a cream cardigan over a white blouse, a pink pleated skirt, a small pink backpack' },
  keeper: { ref: 'ENTJ', who: 'an elderly clock-tower keeper: a white walrus moustache, small round spectacles, a brown bowler hat, a dark-green waistcoat with a gold pocket-watch chain, brown trousers' },
  baker: { ref: 'ENFJ_f', who: 'a warm bakery owner in her thirties: wavy orange hair under a tall white baker\'s hat, a white baker\'s jacket and a pink apron with a little flour on it' },
  driver: { ref: 'ENTP', who: 'a cheerful bus driver in his forties: a navy driver\'s cap, a light-blue short-sleeved uniform shirt with a navy tie, white gloves, a neat short beard' },
  yamada: { ref: 'ESFJ_f', who: 'Yamada-san, a gentle woman in her forties who lives in the town: short wavy brown hair with a pink cherry-blossom hairpin, a sky-blue cardigan over a white blouse, a navy pleated skirt, a small pink rosette pinned on the cardigan' },
};

/** `first`: the person's first picture, drawn from the robot's style; the other one copies it. */
const human = (person, mood, first, diff, used) => {
  const p = PEOPLE[person];
  return {
    id: `folk_${person}_${mood}`,
    group: 'folk_naniwa',
    prio: 'A',
    out: `img/chara/naniwa/folk_${person}_${mood}.webp`,
    kind: 'chara',
    bgmode: 'white',
    refs: first === mood ? [`public/img/chara/types/${p.ref}.webp`] : [`art-src/folk_${person}_${first}.png`],
    style: first === mood ? ['HUMAN_PAINTED', 'CHARA_OUT'] : ['HUMAN_SAME', 'CHARA_OUT'],
    diff: first === mood ? `Who: ${p.who}.\nPose and expression: ${diff}` : `Pose and expression: ${diff}`,
    used,
    note: first === mood ? '白い 背景を import.mjs が 切り抜く' : `folk_${person}_${first} の あとに 作る（それを 参照）。白い 背景を 切り抜く`,
  };
};

const FOLK = [
  human('yamada', 'happy', 'happy', 'overjoyed: both hands clasped beside her cheek, eyes closed in a big happy smile, a few small sparkles around her.', '1章 2話 山田さん（名前が 戻った）'),
  human('yamada', 'sad', 'happy', 'worried and sad: both hands pressed to her cheeks, eyes looking down with a small tear, a wobbly little frown.', '1章 2話 山田さん（名前の 漢字が 消えた）'),
  human('girl', 'happy', 'happy', 'overjoyed: hugging a small fluffy white puppy (a cute real dog) in her arms, eyes closed in a big smile.', 'かな編 3話 犬が 戻った 女の子'),
  human('girl', 'sad', 'happy', 'sad and worried: holding an empty red dog collar with a small blank tag in both hands against her chest, teary eyes, looking down. No dog in the picture.', 'かな編 3話 犬を さがす 女の子'),
  human('kiosk', 'happy', 'happy', 'cheerful: holding out two steaming mugs of cocoa toward the viewer with a big smile.', 'かな編 7話 売店の 人（ココア）'),
  human('kiosk', 'trouble', 'happy', 'puzzled and troubled: holding a tray with a cup in one hand, scratching her head with the other, staring at a blank menu card in confusion, a sweat drop by her head.', 'かな編 7話 売店の 人（品書きが 消えた）'),
  human('staff', 'happy', 'happy', 'relieved: holding his clipboard to his chest, the other hand raised in a cheerful salute, a big smile.', 'かな編 7・8話 駅員（切符が 出た・ゲートが 開いた）'),
  human('staff', 'trouble', 'happy', 'troubled: staring at his blank clipboard with a confused frown, his other hand on top of his cap, a sweat drop.', 'かな編 7・8話 駅員（切符の 機械が 読めない）'),
  human('announcer', 'trouble', 'trouble', 'confused: the megaphone lowered at his side, the other hand raised palm-up in a shrug, eyebrows raised, mouth open as if saying "huh?".', '1章 1話 駅の 案内係（きょうは 何曜日？）'),
  human('ropeway', 'happy', 'happy', 'happy: holding out a small stamp card (blank squares, no letters) toward the viewer with a big smile, the wrench raised in the other hand.', '1章 3話 ロープウェーの 係（スタンプカードを くれる）'),
  human('ropeway', 'trouble', 'happy', 'troubled: wrench in one hand, scratching his head with the other, looking at a blank timetable card with a worried frown, a sweat drop.', '1章 3話 ロープウェーの 係（時刻表が 読めない）'),
  folk('worker_sleep', 'ISTJ', 'fast asleep sitting slumped: eyes closed as two curved lines, head drooping, clipboard slipping from his hands, a small "z" bubble shape (no letters, just a curl).', '1章 4話 眠った 工場の ロボット（七ばん。ロボットの まま）'),
  folk('worker_awake', 'ISTJ', 'just woken up and delighted: standing straight, one hand saluting, clipboard under the other arm, bright eyes, a big smile, a few sparkles.', '1章 4話 起きた ロボット（なかまに なる。ロボットの まま）'),
  human('vendor', 'happy', 'happy', 'happy: holding a basket of fruit and a gold coin, winking with a big smile, confetti sparkles.', '1章 5話 市場の 店の 人（値札が 戻った）'),
  human('vendor', 'trouble', 'happy', 'troubled: holding up a blank price tag in one hand and an apple in the other, puzzled, mouth open as if saying "how much?", a sweat drop.', '1章 5話 市場の 店の 人（値札が 読めない）'),
  human('traveler', 'happy', 'happy', 'relieved and happy: one hand on his rolling suitcase, the other giving a thumbs-up, a big grin, eyes bright.', 'かな編 4話 旅行者（道が わかった）'),
  human('traveler', 'trouble', 'happy', 'lost: pulling the small rolling suitcase, looking around anxiously with one hand shading his eyes, a worried frown.', 'かな編 1話 空港の 旅行者（行き先が 読めない）'),
  // 1章 6〜10話（10 §2）
  human('teacher', 'happy', 'happy', 'cheerful: one hand raised as if greeting a class, the other hugging a clipboard, a warm big smile.', '1章 6・10話 先生（名前が 戻った）'),
  human('teacher', 'trouble', 'happy', 'puzzled: holding a blank wooden name plate in one hand and staring at it, the other hand touching her glasses, a worried frown and a sweat drop.', '1章 6話 日本語学校の 先生（名札が 消えた）'),
  human('office', 'happy', 'happy', 'happy: bowing politely with a friendly smile, holding out a blank business card with both hands, the briefcase at his feet.', '1章 6話 会社員（はじめまして）'),
  human('office', 'trouble', 'happy', 'troubled: the briefcase in one hand and a blank business card in the other, looking at the card with a confused frown, a sweat drop.', '1章 6話 会社員（夜に 日本語を 習う。名札が 消えた）'),
  human('doctor', 'happy', 'happy', 'cheerful: giving a thumbs-up and holding a small blank medicine bottle, a big reassuring smile.', '1章 7話 お医者さん（ネクマックスが 直る）'),
  human('doctor', 'trouble', 'happy', 'troubled: holding an open book whose pages are blank, a magnifying glass held up to it, a puzzled frown and a sweat drop.', '1章 7話 お医者さん（本の 字が 消えた）'),
  human('rin', 'happy', 'happy', 'delighted: hugging a thick book with a blank cover to her chest, eyes closed in a big smile, a few sparkles.', '1章 7・10話 リンさん（本が 読めた・学校へ 行く）'),
  human('rin', 'trouble', 'happy', 'looking for a book: a blank notebook held to her chest, looking around anxiously with one hand raised to her brow, a worried little frown.', '1章 7話 留学生の リンさん（本を さがす）'),
  human('keeper', 'happy', 'happy', 'happy: holding his round pocket watch up proudly, the other hand pointing up at the sky, a big smile, a few sparkles like morning light.', '1章 8話 時計台の 係（町に 朝が 来た）'),
  human('keeper', 'trouble', 'happy', 'dismayed: holding up the pocket watch whose face is blank, staring at it in shock, the other hand on top of his hat.', '1章 8話 時計台の 係（朝が 来ない）'),
  human('baker', 'happy', 'happy', 'happy: holding out a tray of fresh bread rolls toward the viewer with a big smile, a few sparkles.', '1章 9話 パンやの 人（店が 開いた）'),
  human('baker', 'trouble', 'happy', 'troubled: holding a blank hanging open/closed board in both hands, tilting her head in confusion, a sweat drop.', '1章 9話 パンやの 人（店が 開いて いるか わからない）'),
  human('driver', 'happy', 'happy', 'happy: giving a big thumbs-up with a wide grin, the other hand waving people aboard.', '1章 10話 バスの 運転手（バスが 動く）'),
  human('driver', 'trouble', 'happy', 'troubled: holding a blank folded route map, scratching his head under the cap with a confused frown, a sweat drop.', '1章 10話 バスの 運転手（行き先が 読めない）'),
];

// ---------------------------------------------------------------------------
// プロローグ — タイトルの すぐ あと。字が 生きる 国・灯る 町・字を 食べる 影・投げられる ネクマックス
// （data/scripts/prologue.ts の visual ごとに 1枚）。ナニワタウンの 絵と 同じ 画風。
// ---------------------------------------------------------------------------


const MOJIKUI_REF = 'art-src/battle/04_敵_モジクイ.png';
const prologue = (id, desc, refs) => ({
  ...naniwa(id, desc, `プロローグ（PrologueScreen.tsx の ${id.replace('prologue_', '')}）`),
  group: 'bg_prologue',
  out: `img/prologue/${id}.webp`,
  refs: refs ?? ['public/img/stageselect/bg_tall.webp'],
  note: 'プロローグの 1枚絵。下 35% に 語りの 文字が 乗る',
});

const PROLOGUE_ART = [
  prologue('prologue_sky', 'a vast deep indigo-violet night sky high above a calm sea, filled with hundreds of tiny warm golden motes of light drifting upward like fireflies or embers (only soft dots and small glowing curls — never shapes of letters), a thin crescent moon, soft violet clouds lit from below; at the very bottom, far away, a port town on a hill by the sea glowing with warm amber lights along the coast. Keep the upper two-thirds open and calm.'),
  prologue('prologue_town', 'Naniwa Town at night seen from slightly above: a port town climbing a hill by the sea, packed with warm-glowing signboards, lanterns and lit windows — every signboard is a softly glowing BLANK panel of amber light; a station with a big round clock that has no numerals, a red Ferris wheel, steampunk brass rooftops, chimneys and pipes, tiny golden motes of light floating up from the signs, the bay reflecting all the lights. Lively, warm and magical.'),
  prologue('prologue_guard', 'on a brass rooftop of the town at night, seen from behind and slightly to the side: the small sky-blue robot from the first reference image (glossy rounded helmet head with ear pods, a small brown backpack) stands bravely with his arms spread, facing an enormous creature of black-violet ink smoke that fills the sky in front of him — two huge glowing amber eyes, torn cream paper talismans with abstract brush strokes swirling around it (from the second reference). A warm light glows from the robot\'s chest and spills around him. The town below has gone dark, its signboards empty black holes.', [NX_PAINTED, MOJIKUI_REF]),
  prologue('prologue_fall', 'night over the wide bay: a bright falling star with a long glowing golden tail streaks across the sky from a dark town on a hill (upper left) down toward the lights of a big airport on the far shore (lower right); in the bright head of the star, small but clearly visible, the sky-blue robot from the reference image curled up and tumbling. Calm sea reflecting the streak, a distant control tower and rows of runway lights.', [NX_PAINTED, 'public/img/stageselect/bg_night.webp']),
];

const PROLOGUE_EATEN = [
  prologue('prologue_eaten', 'the SAME port town on the hill at night as in the first reference image, the same composition, but its lights have been eaten: every signboard is a dark empty hole, windows black, lanterns out, only cold blue moonlight; above the town looms an enormous creature of black-violet ink smoke (like the second reference, but huge) filling the upper sky, two huge glowing amber eyes, torn cream paper talismans with abstract brush strokes swirling into it, thin streams of tiny golden motes of light being pulled up into its wide mouth. Ominous but not gory — suitable for children.', ['art-src/prologue_town.png', MOJIKUI_REF]),
];

// ---------------------------------------------------------------------------
// 地図 — 1枚の 縦長を 上下 2枚に 分けて 撮り、import.mjs が つなぐ
// ---------------------------------------------------------------------------

const MAPS = [
  { id: 'map_mukashi_bottom', half: 'bottom', arc: 'mukashi', diff: 'Bottom half of the むかし-arc world map: at the very bottom a small farming village with thatched houses and rice fields, above it meadows, a river crossing with stones, and patches of forest; at the top edge the land starts rising toward mountains (continues into the top half).' },
  { id: 'map_mukashi_top', half: 'top', arc: 'mukashi', diff: 'Top half of the むかし-arc world map: continuing from rolling foothills at the bottom edge, a green mountain, then a vast smooth tree trunk rising into a sea of clouds, and at the very top the leafy crown of the giant tree in golden light.' },
  { id: 'map_gendai_bottom', half: 'bottom', arc: 'gendai', diff: 'Bottom half of the 現代-arc world map: at the very bottom an Osaka city block with a hotel and office buildings, above it a highway leaving the city toward green countryside; at the top edge the land turns to dark forest (continues into the top half).' },
  { id: 'map_gendai_top', half: 'top', arc: 'gendai', diff: 'Top half of the 現代-arc world map: continuing from dark sea-of-trees forest at the bottom edge, a lone training-center building in the forest, a small lake, and a dirt sports ground, with a large Mt Fuji at the very top against the sky.' },
].map((m) => ({
  id: m.id,
  group: 'map',
  prio: 'B',
  out: `img/map/${m.arc}.webp`,
  half: m.half,
  kind: 'map-half',
  bgmode: 'none',
  refs: m.arc === 'mukashi' ? ['public/img/bg/mukashi_village.webp', 'public/img/design/むかし編_村のたのみステージ選択.png'] : ['public/img/design/むかし編_村のたのみステージ選択.png'],
  style: ['MAP_HALF', m.arc === 'mukashi' ? 'BG_MUKASHI' : 'BG_GENDAI'],
  diff: m.diff,
  used: `ステージ選択の 地図（${m.arc}）`,
  note: m.half === 'top' ? 'bottom を 撮った あと、それを 参照に 足して 撮る（つなぎ目を そろえる）。import.mjs が 上下を つないで img/map/' + m.arc + '.webp を 作る' : '',
}));

// ---------------------------------------------------------------------------
// アプリの アイコン
// ---------------------------------------------------------------------------

const ICONS = [
  {
    id: 'app_icon',
    group: 'icon',
    prio: 'A',
    out: 'icon-512x512.png',
    kind: 'icon',
    bgmode: 'none',
    refs: ['art-src/titlesozai/01_ネクマックス_キャラクター.png'],
    style: ['ICON'],
    diff: `Content: the robot from the reference image — exactly his look: glossy rounded light sky-blue helmet head
with ear pods, a big white face-screen with two black oval eyes and a small happy open smile, the navy double-peak
"M" mark on the chest — shown from the chest up, big and centered, cheerful, one mitten hand raised in a little wave.
Style: polished Japanese anime game art like the reference, soft glossy shading, clean dark outline so he reads at 48px.
Background: fills the whole square edge to edge — a deep indigo-violet night (#1b1f4a to #2c2a6b) with a large warm
amber-orange glowing round lantern light behind his head like a halo, a thin brass gear ring around that glow,
a few tiny warm sparkles. High contrast: the sky-blue robot pops against the indigo and amber.`,
    used: 'ホーム画面の アイコン（PWA）・favicon・apple-touch-icon。vite.config.ts と index.html が 指す',
    note: 'import.mjs が 512・192・180（apple-touch-icon）・48（favicon）を 書き出す',
  },
];

// ---------------------------------------------------------------------------
// なかまの カード ★4・★5（11 §4.1）。★3 は 今の 絵（ロボット: types、町の 人: folk_*_happy）。
// ---------------------------------------------------------------------------

const card = (char, rarity, outfit, used) => {
  const town = !/^[EI][NS][FT][JP]$/.test(char);
  return {
    id: `card_${char}_${rarity}`,
    group: 'companion_cards',
    prio: 'A',
    out: `img/chara/cards/${char}-${rarity}.webp`,
    kind: 'chara',
    bgmode: 'white',
    refs: [town ? `art-src/folk_${char}_happy.png` : `public/img/chara/types/${char}.webp`],
    style: [town ? 'CARD_TOWN' : 'CARD_ROBOT', ...(rarity === 5 ? ['CARD_STAR5'] : []), 'CHARA_OUT'],
    diff: `Outfit and pose: ${outfit}`,
    used,
    note: town ? `町の 人の 絵（folk_${char}_happy）を 先に 作る。白い 背景を 切り抜く` : '白い 背景を import.mjs が 切り抜く',
  };
};

const CARDS = [
  card('ISTJ', 4, "a station master's outfit: a navy station-master jacket with gold buttons, a peaked cap with a gold band, white gloves, holding up a small signal lantern.", '★4 えきちょうの まじめ'),
  card('ISFJ', 4, "a nurse's outfit: a light-pink nurse uniform and a nurse cap with a small heart, holding a first-aid kit with a heart on it.", '★4 ナースの みまもり'),
  card('ESTP', 4, "a sprinter's outfit: a red running vest with a blank race bib (no numbers), running shorts and a sweatband, in a dynamic running pose.", '★4 ランナーの スタート'),
  card('ESTJ', 4, 'a student-council outfit: a navy school blazer with a red tie and an armband, a clipboard under one arm, pointing forward.', '★4 せいとかいの まとめ'),
  card('ESFJ', 4, 'a café outfit: a brown barista apron over a white shirt and a small bow tie, holding a tray with a latte and a slice of strawberry cake.', '★4 カフェの おせわ'),
  card('INTP', 4, "a scientist's outfit: a white lab coat, round goggles pushed up on the head, holding a bubbling round flask.", '★4 はかせの なぜなぜ'),
  card('ENTP', 4, "an inventor's outfit: brown work overalls with pockets full of little gadgets, a light-bulb gadget glowing above the head on a spring, holding a screwdriver.", '★4 はつめいかの アイデア'),
  card('INFJ', 4, 'a library-committee outfit: a cream knit vest over a shirt and round reading glasses, hugging a stack of books with blank covers.', '★4 としょいいんの おもいやり'),
  card('INFP', 4, "a painter's outfit: a red beret and a paint-splashed smock, holding a palette and a brush.", '★4 えかきの ゆめ'),
  card('ENFP', 4, "an explorer's outfit: a khaki safari hat and vest, binoculars around the neck, a coil of rope, holding up a treasure map with no writing.", '★4 たんけんかの わくわく'),
  card('ISTP', 4, "a mechanic's outfit: an orange jumpsuit, a tool belt full of tools, welding goggles on the head, holding a big wrench over the shoulder.", '★4 メカニックの どうぐ'),
  card('ISFP', 4, 'a summer-festival outfit: a colorful floral yukata with an obi sash, holding a round paper fan and a little bag with a goldfish.', '★4 ゆかたの デザイン'),
  card('ESFP', 4, 'a stage-idol outfit: a sparkly frilly stage costume and a headset microphone, holding a glow stick up high, winking.', '★4 アイドルの もりあげ'),
  card('ISTJ', 5, 'ornate red-and-gold samurai armor with a crested helmet, a sheathed katana at the side, a firm heroic stance.', '★5 さむらいの まじめ'),
  card('ESTP', 5, 'a rocket-hero suit in red and gold with rocket boosters on the back, flying upward with one fist raised.', '★5 ロケットの スタート'),
  card('ENFP', 5, 'a grand festival outfit: a red-and-gold happi coat and a twisted headband, carrying a small portable shrine float on the shoulder, festival lanterns hanging from it.', '★5 まつりの わくわく'),
  card('INTJ', 5, "a master detective's outfit: a long caped coat and a deerstalker hat in deep green with gold trim, holding a big magnifying glass, a confident look.", '★5 たんていの よそう'),
  card('ENTJ', 5, "a ship captain's outfit: a white-and-gold captain's uniform with epaulettes and a captain's hat, holding a brass telescope, one foot on a small ship's wheel.", '★5 せんちょうの あんない'),
  card('ENFJ', 5, 'a neon cheerleader outfit in bright pink and cyan with light-up pom-poms, jumping in a star pose.', '★5 ネオンの おうえん'),
  card('rin', 4, 'a summer-festival yukata with a cherry-blossom pattern and a red obi, hair up with a flower ornament, holding a lit sparkler.', '★4 ゆかたの リンさん'),
  card('yamada', 4, 'a navy yukata with a fireworks pattern, holding a round paper fan and waving.', '★4 はなびの 山田さん'),
  card('teacher', 4, 'a calligraphy outfit: a dark-blue hakama and a white top with tied-back sleeves, holding a giant calligraphy brush.', '★4 しょどうの 先生'),
  card('doctor', 4, 'the white coat with a pink cherry-blossom scarf, holding a bouquet of cherry blossoms, the stethoscope around the neck.', '★4 さくらの お医者さん'),
  card('baker', 4, "a Christmas baker's outfit: a red-and-white baker's jacket and a Santa hat, holding a tray of decorated cookies and a wreath-shaped bread.", '★4 クリスマスの パンやさん'),
  card('keeper', 4, "an astronomer's outfit: a deep-blue starry cape and a pointed star hat, holding a brass telescope.", '★4 ほしぞらの とけいだいの 人'),
  card('rin', 5, 'a grand festival dancer outfit: an ornate red-and-gold kimono with long flowing sleeves, holding two paper lanterns, dancing.', '★5 まつりの リンさん'),
  card('keeper', 5, 'a time wizard outfit: a long midnight-blue robe with golden clock-gear patterns, a staff topped with an hourglass, a ring of small golden gears floating around him.', '★5 じかんの まほうつかい'),
];

// ---------------------------------------------------------------------------
// 武器（11 §6）: 8つの 形 × ふつう・金。戦いで ネクマックスの 背中に 積む。
// ---------------------------------------------------------------------------

const weapon = (cls, gold, shape) => ({
  id: `weapon_${cls.toLowerCase()}${gold ? '_gold' : ''}`,
  group: 'weapons',
  prio: 'A',
  out: `img/weapons/${cls.toLowerCase()}${gold ? '_gold' : ''}.webp`,
  kind: 'prop',
  bgmode: 'white',
  refs: ['public/img/battle/nexmax_brush.webp'],
  style: ['WEAPON', ...(gold ? ['WEAPON_GOLD'] : [])],
  diff: `The weapon: ${shape}`,
  used: `${cls}（${gold ? '★5 の 金' : '★1〜4'}）。戦いで ネクマックスに 積む・もちもの`,
  note: '白い 背景を import.mjs が 切り抜く（prop）',
});

const WEAPON_SHAPES = {
  SWORD: 'a mecha sword — a broad straight blade with a light-blue energy edge and a chunky hilt with the mounting joint.',
  AXE: 'a mecha battle axe — a big crescent axe head on a short thick haft.',
  SPEAR: 'a mecha lance — a long shaft ending in a drill-like spiral spearhead.',
  BOW: 'a mecha bow — a curved bow with a glowing energy string and the mounting joint at the grip.',
  STAFF: 'a mecha staff — a slim staff topped with a ring that holds a floating round orb.',
  HAMMER: 'a mecha hammer — a big round-ended hammer head with two little thrusters on its back, on a short handle.',
  DAGGER: 'a pair of mecha daggers — two short curved blades crossed over each other, joined at one mounting joint.',
  SHIELD: 'a mecha shield — a rounded kite shield with a small cannon-like emitter in its center.',
};

const WEAPONS = Object.entries(WEAPON_SHAPES).flatMap(([cls, shape]) => [weapon(cls, false, shape), weapon(cls, true, shape)]);

export const ASSETS = [...NEXMAX, ...GENDAI, ...MUKASHI_FOLK, ...ENEMIES, ...CREATURES, ...BG, ...NANIWA, ...NEXMAX_NANIWA, ...FOLK, ...PROLOGUE_ART, ...PROLOGUE_EATEN, ...MAPS, ...ICONS, ...CARDS, ...WEAPONS];

export const GROUPS = {
  nexmax: 'ネクマックス（表情・ポーズ）',
  gendai: '現代編の 人たち',
  mukashi_folk: 'むかし編の 村人',
  enemy: '敵（ステージの ボス）',
  bg_mukashi: '背景 — むかし編（と タイトル・メニュー）',
  bg_gendai: '背景 — 現代編',
  bg_naniwa: '背景 — 0章「はじまりの 空港」（ナニワタウン）',
  bg_prologue: 'プロローグの 1枚絵',
  nexmax_naniwa: 'ナニワタウンの ネクマックス（新ルートの 立ち絵）',
  folk_naniwa: '町の 人の 表情（困る・よろこぶ）',
  companion_cards: 'なかまの カード ★4・★5',
  weapons: '武器（ネクマックスに 積む）',
  map: 'ステージ選択の 地図',
  icon: 'アプリの アイコン',
};

/** The full prompt for one entry: shared blocks in order, then its own line. */
export const promptFor = (a) => [...a.style.map((k) => BLOCKS[k]), a.diff].join('\n\n');
