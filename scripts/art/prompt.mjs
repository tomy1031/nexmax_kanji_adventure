/**
 * Print the prompt for one picture, ready to paste — or list them, or write
 * the whole document.
 *
 *   node scripts/art/prompt.mjs nx_think        # one entry: where to save, refs, prompt, codex command
 *   node scripts/art/prompt.mjs --list          # every entry, priority first
 *   node scripts/art/prompt.mjs --list A        # only priority A (or a group name: enemy, nexmax, ...)
 *   node scripts/art/prompt.mjs --todo          # entries whose web file does not exist yet
 *   node scripts/art/prompt.mjs --write-all     # write art-src/prompts/<id>.txt for every entry
 *   node scripts/art/prompt.mjs --doc           # rewrite docs/画像素材リスト.md
 *
 * For one entry it also writes art-src/prompts/<id>.txt — the full instruction
 * for Codex, including where to save — so the shell never has to quote it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ASSETS, BLOCKS, GROUPS, promptFor } from './manifest.mjs';

const arg = process.argv[2];
const PRIO = { A: 0, B: 1, C: 2 };
const sorted = [...ASSETS].sort((a, b) => PRIO[a.prio] - PRIO[b.prio]);
const done = (a) => existsSync(`public/${a.out}`);

const SIZE = {
  chara: '1024x1536 縦・白背景 → 切り抜き',
  enemy: '1024x1024・白背景 → 切り抜き',
  bg: '1024x1536 縦・背景あり',
  fg: '1024x1536 縦・透過（無理なら #00FF00）',
  'map-half': '1024x1536 縦（上下 2枚で 1枚の 地図）',
  icon: '1024x1024・背景あり',
};

/** The instruction handed to Codex: save path, one-shot rule, then the prompt verbatim. */
const codexText = (a) => `image-gen-2 で画像を1枚生成してください。
出力サイズ: ${a.kind === 'enemy' || a.kind === 'icon' ? '1024x1024' : '1024x1536'} PNG${a.kind === 'fg' ? '（透過背景）' : ''}。
保存先: art-src/${a.id}.png
添付の参照画像の絵柄・色・形に合わせること。
色ムラ・線のゆれ・大きさを理由に作り直さないこと。ちょうど1回だけ生成して保存する。
プロンプトは以下（逐語使用。要約・翻訳・言い換えをしない）:

${promptFor(a)}
`;

const codexCmd = (a) => {
  const refs = a.refs.map((r) => `-i "${r}"`).join(' ');
  return `codex ${refs} "$(cat art-src/prompts/${a.id}.txt)"`;
};

if (!arg || arg === '--help') {
  console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 13).join('\n'));
} else if (arg === '--list' || arg === '--todo') {
  const filter = process.argv[3];
  const rows = sorted.filter((a) => (arg === '--todo' ? !done(a) : true)).filter((a) => !filter || a.prio === filter || a.group === filter);
  for (const a of rows) console.log(`${a.prio}  ${a.id.padEnd(22)} ${done(a) ? '✔' : ' '}  → public/${a.out}   ${a.used}`);
  console.log(`\n${rows.length} 件`);
} else if (arg === '--write-all') {
  mkdirSync('art-src/prompts', { recursive: true });
  for (const a of ASSETS) writeFileSync(`art-src/prompts/${a.id}.txt`, codexText(a));
  console.log(`wrote ${ASSETS.length} files to art-src/prompts/`);
} else if (arg === '--doc') {
  writeFileSync('docs/画像素材リスト.md', doc());
  console.log('wrote docs/画像素材リスト.md');
} else {
  const a = ASSETS.find((x) => x.id === arg);
  if (!a) {
    console.error(`no entry "${arg}". node scripts/art/prompt.mjs --list で 一覧を 見る`);
    process.exit(1);
  }
  mkdirSync('art-src/prompts', { recursive: true });
  writeFileSync(`art-src/prompts/${a.id}.txt`, codexText(a));
  const missing = a.refs.filter((r) => !existsSync(r));
  console.log(`# ${a.id}  （優先度 ${a.prio}）
使う場所: ${a.used}
生の 保存先: art-src/${a.id}.png
最終の 置き場: public/${a.out}   ← node scripts/art/import.mjs ${a.id} が 作る
大きさ: ${SIZE[a.kind]}
参照画像:
${a.refs.map((r) => `  - ${r}${existsSync(r) ? '' : '   ← まだ 無い（' + (r.startsWith('art-src/ref/') ? 'node scripts/art/refs.mjs で 用意' : '先に その 画像を 撮る') + '）'}`).join('\n')}
${a.note ? `注意: ${a.note}\n` : ''}
---- プロンプト（art-src/prompts/${a.id}.txt に 保存した）----
${promptFor(a)}

---- Codex で 撮る ----
${codexCmd(a)}
${missing.length ? `\n⚠ 参照画像が ${missing.length}枚 足りない。先に 用意してから 撮る。` : ''}`);
}

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

function doc() {
  const byGroup = Object.keys(GROUPS).map((g) => [g, ASSETS.filter((a) => a.group === g)]);
  const count = (p) => ASSETS.filter((a) => a.prio === p).length;
  const fence = (s) => '```text\n' + s + '\n```';

  const entry = (a) => `#### \`${a.id}\` — ${a.used}

| | |
| --- | --- |
| 優先度 | **${a.prio}** |
| 生の 保存先 | \`art-src/${a.id}.png\` |
| 最終の 置き場 | \`public/${a.out}\`${a.kind === 'map-half' ? `（${a.half === 'top' ? '上' : '下'}半分。上下 そろうと 1枚に つながる）` : ''} |
| 大きさ・背景 | ${SIZE[a.kind]} |
| 参照画像 | ${a.refs.map((r) => `\`${r}\``).join('<br>')} |
| プロンプト | ${a.style.map((k) => `［${k}］`).join(' ＋ ')} ＋ 下の 1行 |
${a.note ? `| 注意 | ${a.note} |\n` : ''}
${fence(a.diff)}
`;

  return `# 画像素材リスト（ファイルごと）

> **このファイルは 自動で 書かれて いる。** 直すときは \`scripts/art/manifest.mjs\` を 直して
> \`node scripts/art/prompt.mjs --doc\` を 実行する（手で 書き換えない）。
>
> 規律の 正典は \`docs/skills/画像生成プロンプト.md\`（NexmaxAcademy から 引き継いだ もの）。
> ここは「何を・どこに・どの 順で」を ファイルごとに まとめた 作業表。

ゲームの 見た目で、いま 仮の 絵（切り絵の SVG・アイコン・別の キャラの 流用）で 動いて いる 所を、
生成した 絵に 差し替える ための 一覧。全部で **${ASSETS.length}枚**
（優先度 A: ${count('A')}枚 / B: ${count('B')}枚 / C: ${count('C')}枚）。

---

## 1. 手順（ローカルで 1枚 撮る ごとに）

\`\`\`bash
# 0) はじめに 1回だけ: 参照画像を そろえる（原作漫画の コマ・仮の SVG の PNG 版）
node scripts/art/refs.mjs

# 1) 撮る 1枚を 選んで、プロンプトと コマンドを 出す
node scripts/art/prompt.mjs --todo A        # まだ 無い 優先度 A の 一覧
node scripts/art/prompt.mjs nx_think        # 1枚ぶんの 説明・プロンプト・Codex コマンド

# 2) 表示された コマンドで 撮る（Codex の image-gen-2。参照画像を 必ず 添付する）
codex -i "public/img/chara/nexmax.webp" -i "public/img/chara/build.webp" "$(cat art-src/prompts/nx_think.txt)"
#    → art-src/nx_think.png に 保存される

# 3) §4 の 受入チェックで 見る。1つでも 落ちたら 直さずに 撮り直す

# 4) web 用に 変換して 置き場へ（切り抜き・縮小・webp）
node scripts/art/import.mjs nx_think        # 1枚だけ
node scripts/art/import.mjs                 # art-src に ある 物を 全部

# 5) ゲームに つなぐ（§5）→ 画面で 確かめる → コミット
\`\`\`

- \`art-src/\` は **git に 入れない**（生の PNG は 重い）。コミットするのは \`public/\` の webp だけ。
- ChatGPT などで 撮る ときも 同じ: \`art-src/prompts/<ID>.txt\` の 中身を そのまま 貼り
  （全部 まとめて 書き出すなら \`node scripts/art/prompt.mjs --write-all\`）、
  参照画像を 添付し、出てきた 画像を \`art-src/<ID>.png\` に 保存して 手順4へ。
- **1回の セッションで 1つの グループを まとめて 撮る**（セッションが 変わると 絵の 傾向が 変わる）。
  たとえば 敵 20体は 同じ 会話の 中で 続けて 撮る。

## 2. 撮る 順番（おすすめ）

1. **アプリの アイコン**（\`app_icon\`）— いま ファイルが 無く、ホーム画面に 置くと 絵が 出ない
2. **ネクマックスの 表情**（\`nx_*\` の A）— お話で いちばん 多く 出る。think は 34回、いまは 本を 持った 絵で 代用
3. **敵 20体**（\`enemy_*\`）— バトルは 遊びの 中心なのに、いまは アイコンの 黒い 影
4. **タイトルと メニューの 背景**（\`title_bg\`・\`mukashi_meadow_bg\`）
5. **むかし編の 背景**（\`mukashi_*_bg\`）— 絵本の 画風の 正典が あるので 撮りやすい
6. **現代編の 仲間**（\`sone_* / nara_* / iguchi_*\`）— 同じ 人の 3表情は 続けて 撮る
7. 現代編の 背景 → 手前（fg）→ 地図 → 村人・先輩・おかみさん

## 3. 絶対に 守る こと

1. **画像の 中に 文字を 入れない**（看板・垂れ幕・画面・本・時計の 数字も）。
   このゲームは 字に 必ず ふりがなを 付ける ので、焼き込んだ 字は 読めない 字に なる。
   ロゴ・題名・吹き出しは ゲームの 側で 文字として 重ねる。
2. **参照画像を 必ず 添付する。** 文章だけで 絵柄を 再現しようと しない。
   ネクマックスは \`nexmax.webp\` と \`build.webp\` の 2枚（1枚だけだと 頭が 卵形に なる — Academy の 実例）。
3. **プロンプトの 共通ブロックは 逐語。** 要約・翻訳・言い換えを しない。変えるのは 最後の 1行だけ。
4. **1枚に 差分は 1つ。** ポーズと 持ち物を 同時に 変えない。
5. **受入チェック（§4）に 落ちたら 撮り直す。** 部分修正は 絵柄の 崩れを ためる。
6. **現代編で 暴力を 描かない**（2026-09-23 の 決定）。叩く・つかむ・投げる・竹刀・正座・バケツ は 絵にも 出さない。
   現代編の 敵は **人では なく 気持ち**。人の 姿に しない。
7. **名前の ある 登場人物に 悪い 例を させない。** 先輩は 顔の 無い 影（原作どおり）。
   専務は 実在の 方が モデルなので 描かない（地の 文だけ）。
8. **「タイ」という 国名を プロンプトにも 画像にも 使わない**（運用上の 決まり）。
9. ネクマックスの 胸の Mマークを 隠さない（物語で 光る 装置）。

## 4. 受入チェック（1枚ごと。1つでも 落ちたら 撮り直す）

**ネクマックスが 写って いる もの**
- [ ] 頭が **横長の ヘルメット＋耳の ポッド**（卵形に なって いない）
- [ ] 白い 顔の 画面が 顔の 大部分を しめ、上の まん中に くぼみが ある
- [ ] 胸に 紺の 山形 M が あり、隠れて いない
- [ ] 色が \`#A9D6F5\` 系・ロゴが \`#004F8D\` 系で、よけいな 色が 増えて いない
- [ ] 黒い 手描き線の 太さが そろって いる・指が 崩れて いない・読める 文字が 無い

**現代編の 仲間**
- [ ] 頭の 形が 原作どおり（ソネ＝横に 広い つりがね／おにぎり形・ナラ＝丸に 触角1本・イグーチ＝四角に 触角2本）
- [ ] ネクマックスの 耳・顔の 画面・胸の Mマークが **付いて いない**
- [ ] ジャージに 高い 立ち襟と まん中の ファスナー

**敵**
- [ ] 左を 向いて いる（バトルで 右に 立ち、ネクマックスを 見る）
- [ ] 150px に 縮めても 形が 分かる
- [ ] 血・武器を こちらに 向ける・本気で 怖い 顔 が 無い

**背景**
- [ ] **下 35% が 単純で 低コントラスト**（会話の 箱と ボタンが 載る）
- [ ] 大事な 物が 横幅の まん中 80% に ある（細い スマホで 左右が 切れる）
- [ ] 人・読める 文字が 写って いない
- [ ] むかし編の 絵本の 画風（パステルと 色鉛筆・紙の 目）から 外れて いない
- [ ] fg は まん中と 上半分が **透明**

## 5. 撮った あと ゲームに つなぐ（コード）

\`import.mjs\` が \`public/\` に 置いた あと、つなぐ 場所。ローカルの Claude / Codex に
「画像素材リスト §5 の とおりに つないで」と 頼めば よい。

| グループ | 直す ファイル | 内容 |
| --- | --- | --- |
| ネクマックス | \`src/data/scripts/mukashi.ts\`（\`MUKASHI_CAST\` の \`sprites\`）・\`src/components/ui/Chrome.tsx\`（\`NexmaxSays\`）・\`src/features/title/TitleScreen.tsx\`・\`StageSelect.tsx\`・\`EquipScreen.tsx\`・\`BattleScene.tsx\` | \`img/chara/cut/*.webp\` を \`img/chara/nexmax/<表情>.webp\` に。表情の キー（normal / smile / think / determined / hello / guide / surprise / sad / hurt / glow / sword）を そのまま 使う。タイトルは guide＋剣アイコン を \`sword\` 1枚に |
| 現代編の 人たち | \`src/data/scripts/gendai.ts\`（\`GENDAI_CAST\`） | \`sprites\` を \`{ normal, smile, worry }\` に。先輩は 画像が できたら \`silhouette: true\` を 外す。台本で \`sone:smile\` など 表情を 使い分ける |
| むかし編の 村人 | \`src/data/scripts/mukashi.ts\` | 村長・ハナの \`sprites.normal\` |
| 敵 | \`src/features/battle/EnemyArt.tsx\`・\`src/features/stage/EncounterScreen.tsx\`・\`src/data/stages.ts\`・\`src/data/gendaiStages.ts\` | \`boss\` に 画像の パスを 持たせ、EnemyArt は 画像が あれば それを、無ければ いまの アイコンを 出す。戦いの前の 画面も アイコンを 画像に |
| 背景 | \`src/features/picturebook/scenes.ts\`・\`gendaiScenes.ts\`・\`PictureBook.tsx\` | Layer に 画像の パス（\`src\`）を 足し、各場面の 下の 層を \`bg\`（動かない）と \`fg\`（下を 支点に skewX で ゆらす）に 置きかえる。雨・暗さ・光・イノシシ などの fx は SVG の まま 上に 重ねる |
| 地図 | \`src/features/map/StageSelect.tsx\`・\`mapArt.ts\` | 地図の 絵を 画像に し、道と ステージの 石は いまの SVG を 上に 重ねる（\`mapSvg\` から 道だけを 分ける） |
| アイコン | （無し） | \`public/icon-192x192.png\`・\`public/icon-512x512.png\` を 置けば \`vite.config.ts\` が そのまま 使う |

---

## 6. ファイルごとの 一覧

${byGroup
  .map(
    ([g, list]) => `### ${GROUPS[g]}（${list.length}枚）

| ID | 優先度 | 置き場 | 使う 場所 |
| --- | --- | --- | --- |
${list.map((a) => `| \`${a.id}\` | ${a.prio} | \`public/${a.out}\` | ${a.used} |`).join('\n')}

${list.map(entry).join('\n')}`,
  )
  .join('\n---\n\n')}

---

## 付録: 共通ブロック（逐語）

プロンプトは「ここの ブロックを 表の 順に つなぎ、最後に その 画像の 1行を 足した もの」。
\`node scripts/art/prompt.mjs <ID>\` が 組み立てて 出すので、手で つなぐ 必要は ない。

${Object.entries(BLOCKS)
  .map(([k, v]) => `### ［${k}］\n\n${fence(v)}\n`)
  .join('\n')}
`;
}
