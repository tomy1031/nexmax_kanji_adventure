/**
 * Which kanji 『みんなの日本語』 teaches, and after which lesson.
 *
 * Source: the kanji books that go with the 2nd edition —
 * 『みんなの日本語初級Ⅰ 第２版 漢字 英語版』 (units 1–20, kanji 1–220) and
 * 『みんなの日本語初級Ⅱ 第２版 漢字 英語版』 (units 24–50, kanji 221–536) —
 * as listed in the publisher's free practice sheets
 * (https://www.3anet.co.jp/np/resrcs/235800/ and /245800/). The lesson each
 * unit may be studied after is the publisher's own table on the book pages
 * (https://www.3anet.co.jp/np/books/2358/ and /2458/): 「ユニット１ ５課まで」 etc.
 * Units 21–23 teach no new kanji.
 *
 * Only which character comes when is taken from the books (08 §2). Their
 * example sentences, words and pictures are not used.
 */

export interface KanjiUnit {
  /** Unit number in the kanji books. */
  unit: number;
  /** 初級I or 初級II kanji book. */
  book: 'I' | 'II';
  /** The main-text lesson this unit may be studied after. */
  lesson: number;
  /** New kanji, in the book's order. */
  kanji: string;
}

export const KANJI_UNITS: KanjiUnit[] = [
  { unit: 1, book: 'I', lesson: 5, kanji: '日月火水木金土山川田' },
  { unit: 2, book: 'I', lesson: 5, kanji: '一二三四五六七八九十百千万円' },
  { unit: 3, book: 'I', lesson: 5, kanji: '学生先会社員医者本中国人' },
  { unit: 4, book: 'I', lesson: 5, kanji: '今朝昼晩時分半午前後休毎何' },
  { unit: 5, book: 'I', lesson: 5, kanji: '行来校週去年駅電車自転' },
  { unit: 6, book: 'I', lesson: 10, kanji: '高安大小新古青白赤黒' },
  { unit: 7, book: 'I', lesson: 10, kanji: '上下父母子手好主肉魚食飲物' },
  { unit: 8, book: 'I', lesson: 10, kanji: '近間右左外男女犬' },
  { unit: 9, book: 'I', lesson: 10, kanji: '書聞読見話買起帰友達' },
  { unit: 10, book: 'I', lesson: 10, kanji: '茶酒写真紙映画店英語' },
  { unit: 11, book: 'I', lesson: 15, kanji: '送切貸借旅教習勉強花' },
  { unit: 12, book: 'I', lesson: 15, kanji: '歩待立止雨入出売使作' },
  { unit: 13, book: 'I', lesson: 20, kanji: '明暗広多少長短悪重軽早' },
  { unit: 14, book: 'I', lesson: 20, kanji: '便利元気親有名地鉄仕事' },
  { unit: 15, book: 'I', lesson: 20, kanji: '東西南北京夜料理口目足曜' },
  { unit: 16, book: 'I', lesson: 21, kanji: '降思寝終言知動同漢字方' },
  { unit: 17, book: 'I', lesson: 22, kanji: '図館銀町住度服着音楽持' },
  { unit: 18, book: 'I', lesson: 23, kanji: '春夏秋冬道堂建病院体運乗' },
  { unit: 19, book: 'I', lesson: 24, kanji: '家内族兄弟奥姉妹海計' },
  { unit: 20, book: 'I', lesson: 25, kanji: '部屋室窓開閉歌意味天考' },
  { unit: 24, book: 'II', lesson: 25, kanji: '試験問題答耳用始集研究台' },
  { unit: 25, book: 'II', lesson: 25, kanji: '飯場正世界急特県低弱不' },
  { unit: 26, book: 'II', lesson: 26, kanji: '議駐帽横市役所拾捨遅遠歳' },
  { unit: 27, book: 'II', lesson: 27, kanji: '声具鳥夢波末座走登修願階' },
  { unit: 28, book: 'II', lesson: 28, kanji: '形品力熱心経景色眠説選通' },
  { unit: 29, book: 'II', lesson: 29, kanji: '番号袋忘落汚洗付覚調取辺側' },
  { unit: 30, book: 'II', lesson: 30, kanji: '皿隅机引箱置片復予約並連絡' },
  { unit: 31, book: 'II', lesson: 31, kanji: '園飛機将神定顔受決' },
  { unit: 32, book: 'II', lesson: 32, kanji: '星雪空夕済合込冷練勝続遊最際' },
  { unit: 33, book: 'II', lesson: 33, kanji: '席荷危険禁触投吸伝曲戻' },
  { unit: 34, book: 'II', lesson: 34, kanji: '組歯菓甘苦磨浴踊質回次' },
  { unit: 35, book: 'II', lesson: 35, kanji: '葉橋向島港活湯昔涼結婚変換押' },
  { unit: 36, book: 'II', lesson: 36, kanji: '野菜船記泳初別渡過違慣必' },
  { unit: 37, book: 'II', lesson: 37, kanji: '絵寺池石油原輸呼頼注招' },
  { unit: 38, book: 'II', lesson: 38, kanji: '卵村岸工製冊無難速育負散' },
  { unit: 39, book: 'II', lesson: 39, kanji: '震交代複雑狭恥困死倒勢途' },
  { unit: 40, book: 'II', lesson: 40, kanji: '靴都返表発確残数若配以' },
  { unit: 41, book: 'II', lesson: 41, kanji: '祝舞産祖娘息文法宿直替珍' },
  { unit: 42, book: 'II', lesson: 42, kanji: '政治化律両緑欲要包沸払全' },
  { unit: 43, book: 'II', lesson: 43, kanji: '米辞符暑寒暖咲消増迎枚' },
  { unit: 44, book: 'II', lesson: 44, kanji: '頭髪薬洋倍痛厚薄太静泣笑割' },
  { unit: 45, book: 'II', lesson: 45, kanji: '点皆資給賃値段風働念' },
  { unit: 46, book: 'II', lesson: 46, kanji: '彼因係卒業相談乾届焼' },
  { unit: 47, book: 'II', lesson: 47, kanji: '祭科庭報実誌億務怖吹失敗亡' },
  { unit: 48, book: 'II', lesson: 48, kanji: '徒君牛乳柔準備営忙留由' },
  { unit: 49, book: 'II', lesson: 49, kanji: '存様妻首疲勤泊礼張越格' },
  { unit: 50, book: 'II', lesson: 50, kanji: '宅私然式参伺申拝案到優' },
];
