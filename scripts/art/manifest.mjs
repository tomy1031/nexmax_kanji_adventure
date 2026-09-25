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
    refs: NX_REFS,
    style: ['NEXMAX', 'ICON'],
    diff: 'Content: NexMax\'s head and shoulders, big and centered, cheerful smile, a short wooden sword raised beside him, on a round sky-blue background with a soft white glow and a thin golden ring. (Override: the background is NOT white here — it is the sky-blue disc filling the square.)',
    used: 'ホーム画面の アイコン（PWA）。vite.config.ts が icon-192x192.png と icon-512x512.png を 指して いるが、いま ファイルが 無い',
    note: 'import.mjs が 512 と 192 の 2つを 書き出す',
  },
];

export const ASSETS = [...NEXMAX, ...GENDAI, ...MUKASHI_FOLK, ...ENEMIES, ...BG, ...MAPS, ...ICONS];

export const GROUPS = {
  nexmax: 'ネクマックス（表情・ポーズ）',
  gendai: '現代編の 人たち',
  mukashi_folk: 'むかし編の 村人',
  enemy: '敵（ステージの ボス）',
  bg_mukashi: '背景 — むかし編（と タイトル・メニュー）',
  bg_gendai: '背景 — 現代編',
  map: 'ステージ選択の 地図',
  icon: 'アプリの アイコン',
};

/** The full prompt for one entry: shared blocks in order, then its own line. */
export const promptFor = (a) => [...a.style.map((k) => BLOCKS[k]), a.diff].join('\n\n');
