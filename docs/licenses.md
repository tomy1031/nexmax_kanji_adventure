# 素材と データの ライセンス

ゲームに 入って いる 外部の データと、その 条件。

| もの | 場所 | 出どころ | 条件 |
| --- | --- | --- | --- |
| 漢字の 書き順 | `public/kanji-data/<漢字>.json` | [animCJK](https://github.com/parsimonhi/animCJK) `graphicsJa.txt`（Arphic フォントと Make Me a Hanzi から） | Arphic Public License |
| かなの 書き順 | `public/kanji-data/<かな>.json` | animCJK `graphicsJaKana.txt`（`scripts/build_kana_strokes.mjs` で 1画に つないだ もの） | Arphic Public License（animCJK の "graphics" ファイルの 条件） |
| 漢字の 読み・意味・画数（`minna` タグの 91字） | `src/data/kanji_master.csv` | [davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data)（KANJIDIC2 由来） | KANJIDIC2: EDRDG、CC BY-SA 4.0 |
| 熟語の 表 | `src/data/compounds.generated.ts` | EDICT2（EDRDG） | CC BY-SA 4.0 |
| JLPT の 語の 一覧 | `scripts/build_*.mjs` の 入力（コミット しない） | [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) | MIT |
| 課ごとの 漢字の 順 | `src/data/minnaKanji.ts` | 『みんなの日本語 第2版 漢字 英語版』（スリーエーネットワーク）の 公開資料 | **どの 課で どの 字か だけを 使う。** 例文・語・絵は 使わない（08 §2） |
