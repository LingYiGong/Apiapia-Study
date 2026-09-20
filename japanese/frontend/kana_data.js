/**
 * 日语假名数据库 (五十音清音、浊音/半浊音、拗音)
 * 包含平假名、片假名、罗马音、分类、行属、笔画数以及常见例词
 */
window.KANA_DATA = [
    // ================= 清音 (46字) =================
    // あ行
    { id: 'k_a', hiragana: 'あ', katakana: 'ア', romaji: 'a', group: 'seion', groupName: '清音五十音', row: 'a', rowName: 'あ行', example: '朝 (あさ)', exampleKata: 'アイス (冰淇淋)', strokesHira: 3, strokesKata: 2 },
    { id: 'k_i', hiragana: 'い', katakana: 'イ', romaji: 'i', group: 'seion', groupName: '清音五十音', row: 'a', rowName: 'あ行', example: '犬 (いぬ)', exampleKata: 'インク (墨水)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_u', hiragana: 'う', katakana: 'ウ', romaji: 'u', group: 'seion', groupName: '清音五十音', row: 'a', rowName: 'あ行', example: '海 (うみ)', exampleKata: 'ウール (羊毛)', strokesHira: 2, strokesKata: 3 },
    { id: 'k_e', hiragana: 'え', katakana: 'エ', romaji: 'e', group: 'seion', groupName: '清音五十音', row: 'a', rowName: 'あ行', example: '駅 (えき)', exampleKata: 'エレベーター (电梯)', strokesHira: 2, strokesKata: 3 },
    { id: 'k_o', hiragana: 'お', katakana: 'オ', romaji: 'o', group: 'seion', groupName: '清音五十音', row: 'a', rowName: 'あ行', example: 'お茶 (おちゃ)', exampleKata: 'オレンジ (橙子)', strokesHira: 3, strokesKata: 3 },

    // か行
    { id: 'k_ka', hiragana: 'か', katakana: 'カ', romaji: 'ka', group: 'seion', groupName: '清音五十音', row: 'ka', rowName: 'か行', example: '傘 (かさ)', exampleKata: 'カメラ (相机)', strokesHira: 3, strokesKata: 2 },
    { id: 'k_ki', hiragana: 'き', katakana: 'キ', romaji: 'ki', group: 'seion', groupName: '清音五十音', row: 'ka', rowName: 'か行', example: '木 (き)', exampleKata: 'キャンプ (野营)', strokesHira: 4, strokesKata: 3 },
    { id: 'k_ku', hiragana: 'く', katakana: 'ク', romaji: 'ku', group: 'seion', groupName: '清音五十音', row: 'ka', rowName: 'か行', example: '車 (くるま)', exampleKata: 'クラス (班级)', strokesHira: 1, strokesKata: 2 },
    { id: 'k_ke', hiragana: 'け', katakana: 'ケ', romaji: 'ke', group: 'seion', groupName: '清音五十音', row: 'ka', rowName: 'か行', example: '今朝 (けさ)', exampleKata: 'ケーキ (蛋糕)', strokesHira: 3, strokesKata: 3 },
    { id: 'k_ko', hiragana: 'こ', katakana: 'コ', romaji: 'ko', group: 'seion', groupName: '清音五十音', row: 'ka', rowName: 'か行', example: '声 (こえ)', exampleKata: 'コーヒー (咖啡)', strokesHira: 2, strokesKata: 2 },

    // さ行
    { id: 'k_sa', hiragana: 'さ', katakana: 'サ', romaji: 'sa', group: 'seion', groupName: '清音五十音', row: 'sa', rowName: 'さ行', example: '桜 (さくら)', exampleKata: 'サラダ (沙拉)', strokesHira: 3, strokesKata: 3 },
    { id: 'k_shi', hiragana: 'し', katakana: 'シ', romaji: 'shi', group: 'seion', groupName: '清音五十音', row: 'sa', rowName: 'さ行', example: '白 (しろ)', exampleKata: 'シャツ (衬衫)', strokesHira: 1, strokesKata: 3 },
    { id: 'k_su', hiragana: 'す', katakana: 'ス', romaji: 'su', group: 'seion', groupName: '清音五十音', row: 'sa', rowName: 'さ行', example: '寿司 (すし)', exampleKata: 'スポーツ (运动)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_se', hiragana: 'せ', katakana: 'セ', romaji: 'se', group: 'seion', groupName: '清音五十音', row: 'sa', rowName: 'さ行', example: '世界 (せかい)', exampleKata: 'セーター (毛衣)', strokesHira: 3, strokesKata: 2 },
    { id: 'k_so', hiragana: 'そ', katakana: 'ソ', romaji: 'so', group: 'seion', groupName: '清音五十音', row: 'sa', rowName: 'さ行', example: '空 (そら)', exampleKata: 'ソファ (沙发)', strokesHira: 1, strokesKata: 2 },

    // た行
    { id: 'k_ta', hiragana: 'た', katakana: 'タ', romaji: 'ta', group: 'seion', groupName: '清音五十音', row: 'ta', rowName: 'た行', example: '卵 (たまご)', exampleKata: 'タクシー (出租车)', strokesHira: 4, strokesKata: 3 },
    { id: 'k_chi', hiragana: 'ち', katakana: 'チ', romaji: 'chi', group: 'seion', groupName: '清音五十音', row: 'ta', rowName: 'た行', example: '地下鉄 (ちかてつ)', exampleKata: 'チーズ (奶酪)', strokesHira: 2, strokesKata: 3 },
    { id: 'k_tsu', hiragana: 'つ', katakana: 'ツ', romaji: 'tsu', group: 'seion', groupName: '清音五十音', row: 'ta', rowName: 'た行', example: '机 (つくえ)', exampleKata: 'ツアー (旅行团)', strokesHira: 1, strokesKata: 3 },
    { id: 'k_te', hiragana: 'て', katakana: 'テ', romaji: 'te', group: 'seion', groupName: '清音五十音', row: 'ta', rowName: 'た行', example: '手 (て)', exampleKata: 'テレビ (电视)', strokesHira: 1, strokesKata: 3 },
    { id: 'k_to', hiragana: 'と', katakana: 'ト', romaji: 'to', group: 'seion', groupName: '清音五十音', row: 'ta', rowName: 'た行', example: '友達 (ともだち)', exampleKata: 'トマト (番茄)', strokesHira: 2, strokesKata: 2 },

    // な行
    { id: 'k_na', hiragana: 'な', katakana: 'ナ', romaji: 'na', group: 'seion', groupName: '清音五十音', row: 'na', rowName: 'な行', example: '夏 (なつ)', exampleKata: 'ナイフ (小刀)', strokesHira: 4, strokesKata: 2 },
    { id: 'k_ni', hiragana: 'に', katakana: 'ニ', romaji: 'ni', group: 'seion', groupName: '清音五十音', row: 'na', rowName: 'な行', example: '肉 (にく)', exampleKata: 'ニュース (新闻)', strokesHira: 3, strokesKata: 2 },
    { id: 'k_nu', hiragana: 'ぬ', katakana: 'ヌ', romaji: 'nu', group: 'seion', groupName: '清音五十音', row: 'na', rowName: 'な行', example: '布 (ぬの)', exampleKata: 'ヌードル (面条)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_ne', hiragana: 'ね', katakana: 'ネ', romaji: 'ne', group: 'seion', groupName: '清音五十音', row: 'na', rowName: 'な行', example: '猫 (ねこ)', exampleKata: 'ネクタイ (领带)', strokesHira: 2, strokesKata: 4 },
    { id: 'k_no', hiragana: 'の', katakana: 'ノ', romaji: 'no', group: 'seion', groupName: '清音五十音', row: 'na', rowName: 'な行', example: '飲み物 (のみもの)', exampleKata: 'ノート (笔记本)', strokesHira: 1, strokesKata: 1 },

    // は行
    { id: 'k_ha', hiragana: 'は', katakana: 'ハ', romaji: 'ha', group: 'seion', groupName: '清音五十音', row: 'ha', rowName: 'は行', example: '花 (はな)', exampleKata: 'ハンカチ (手帕)', strokesHira: 3, strokesKata: 2 },
    { id: 'k_hi', hiragana: 'ひ', katakana: 'ヒ', romaji: 'hi', group: 'seion', groupName: '清音五十音', row: 'ha', rowName: 'は行', example: '光 (ひかり)', exampleKata: 'ヒーター (暖气)', strokesHira: 1, strokesKata: 2 },
    { id: 'k_fu', hiragana: 'ふ', katakana: 'フ', romaji: 'fu', group: 'seion', groupName: '清音五十音', row: 'ha', rowName: 'は行', example: '冬 (ふゆ)', exampleKata: 'フォーク (叉子)', strokesHira: 4, strokesKata: 1 },
    { id: 'k_he', hiragana: 'へ', katakana: 'ヘ', romaji: 'he', group: 'seion', groupName: '清音五十音', row: 'ha', rowName: 'は行', example: '部屋 (へや)', exampleKata: 'ヘルメット (头盔)', strokesHira: 1, strokesKata: 1 },
    { id: 'k_ho', hiragana: 'ほ', katakana: 'ホ', romaji: 'ho', group: 'seion', groupName: '清音五十音', row: 'ha', rowName: 'は行', example: '星 (ほし)', exampleKata: 'ホテル (酒店)', strokesHira: 4, strokesKata: 4 },

    // ま行
    { id: 'k_ma', hiragana: 'ま', katakana: 'マ', romaji: 'ma', group: 'seion', groupName: '清音五十音', row: 'ma', rowName: 'ま行', example: '町 (まち)', exampleKata: 'マスク (口罩)', strokesHira: 3, strokesKata: 2 },
    { id: 'k_mi', hiragana: 'み', katakana: 'ミ', romaji: 'mi', group: 'seion', groupName: '清音五十音', row: 'ma', rowName: 'ま行', example: '水 (みず)', exampleKata: 'ミルク (牛奶)', strokesHira: 2, strokesKata: 3 },
    { id: 'k_mu', hiragana: 'む', katakana: 'ム', romaji: 'mu', group: 'seion', groupName: '清音五十音', row: 'ma', rowName: 'ま行', example: '虫 (むし)', exampleKata: 'ムービー (电影)', strokesHira: 3, strokesKata: 2 },
    { id: 'k_me', hiragana: 'め', katakana: 'メ', romaji: 'me', group: 'seion', groupName: '清音五十音', row: 'ma', rowName: 'ま行', example: '目 (め)', exampleKata: 'メガネ (眼镜)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_mo', hiragana: 'も', katakana: 'モ', romaji: 'mo', group: 'seion', groupName: '清音五十音', row: 'ma', rowName: 'ま行', example: '森 (もり)', exampleKata: 'モデル (模特)', strokesHira: 3, strokesKata: 3 },

    // や行
    { id: 'k_ya', hiragana: 'や', katakana: 'ヤ', romaji: 'ya', group: 'seion', groupName: '清音五十音', row: 'ya', rowName: 'や行', example: '山 (やま)', exampleKata: 'ヤング (年轻人)', strokesHira: 3, strokesKata: 2 },
    { id: 'k_yu', hiragana: 'ゆ', katakana: 'ユ', romaji: 'yu', group: 'seion', groupName: '清音五十音', row: 'ya', rowName: 'や行', example: '雪 (ゆき)', exampleKata: 'ユニフォーム (制服)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_yo', hiragana: 'よ', katakana: 'ヨ', romaji: 'yo', group: 'seion', groupName: '清音五十音', row: 'ya', rowName: 'や行', example: '夜 (よる)', exampleKata: 'ヨーグルト (酸奶)', strokesHira: 2, strokesKata: 3 },

    // ら行
    { id: 'k_ra', hiragana: 'ら', katakana: 'ラ', romaji: 'ra', group: 'seion', groupName: '清音五十音', row: 'ra', rowName: 'ら行', example: '来週 (らいしゅう)', exampleKata: 'ラジオ (收音机)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_ri', hiragana: 'り', katakana: 'リ', romaji: 'ri', group: 'seion', groupName: '清音五十音', row: 'ra', rowName: 'ら行', example: '林檎 (りんご)', exampleKata: 'リーダー (领导)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_ru', hiragana: 'る', katakana: 'ル', romaji: 'ru', group: 'seion', groupName: '清音五十音', row: 'ra', rowName: 'ら行', example: '留守 (るす)', exampleKata: 'ルール (规则)', strokesHira: 1, strokesKata: 2 },
    { id: 'k_re', hiragana: 'れ', katakana: 'レ', romaji: 're', group: 'seion', groupName: '清音五十音', row: 'ra', rowName: 'ら行', example: '歴史 (れきし)', exampleKata: 'レストラン (餐厅)', strokesHira: 2, strokesKata: 1 },
    { id: 'k_ro', hiragana: 'ろ', katakana: 'ロ', romaji: 'ro', group: 'seion', groupName: '清音五十音', row: 'ra', rowName: 'ら行', example: '六 (ろく)', exampleKata: 'ロボット (机器人)', strokesHira: 1, strokesKata: 3 },

    // わ行 & 拨音
    { id: 'k_wa', hiragana: 'わ', katakana: 'ワ', romaji: 'wa', group: 'seion', groupName: '清音五十音', row: 'wa', rowName: 'わ行', example: '私 (わたし)', exampleKata: 'ワイン (葡萄酒)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_wo', hiragana: 'を', katakana: 'ヲ', romaji: 'wo', group: 'seion', groupName: '清音五十音', row: 'wa', rowName: 'わ行', example: '本を読む (宾语助词)', exampleKata: 'ヲタ (爱好者/语素)', strokesHira: 3, strokesKata: 3 },
    { id: 'k_n', hiragana: 'ん', katakana: 'ン', romaji: 'n', group: 'seion', groupName: '清音五十音', row: 'wa', rowName: 'わ行', example: '本 (ほん)', exampleKata: 'パン (面包)', strokesHira: 1, strokesKata: 2 },

    // ================= 浊音与半浊音 (25字) =================
    // が行
    { id: 'k_ga', hiragana: 'が', katakana: 'ガ', romaji: 'ga', group: 'dakuon', groupName: '浊音・半浊音', row: 'ga', rowName: 'が行', example: '外国 (がいこく)', exampleKata: 'ガラス (玻璃)', strokesHira: 5, strokesKata: 4 },
    { id: 'k_gi', hiragana: 'ぎ', katakana: 'ギ', romaji: 'gi', group: 'dakuon', groupName: '浊音・半浊音', row: 'ga', rowName: 'が行', example: '銀行 (ぎんこう)', exampleKata: 'ギター (吉他)', strokesHira: 6, strokesKata: 5 },
    { id: 'k_gu', hiragana: 'ぐ', katakana: 'グ', romaji: 'gu', group: 'dakuon', groupName: '浊音・半浊音', row: 'ga', rowName: 'が行', example: '具合 (ぐあい)', exampleKata: 'グラス (玻璃杯)', strokesHira: 3, strokesKata: 4 },
    { id: 'k_ge', hiragana: 'げ', katakana: 'ゲ', romaji: 'ge', group: 'dakuon', groupName: '浊音・半浊音', row: 'ga', rowName: 'が行', example: '元気 (げんき)', exampleKata: 'ゲーム (游戏)', strokesHira: 5, strokesKata: 5 },
    { id: 'k_go', hiragana: 'ご', katakana: 'ゴ', romaji: 'go', group: 'dakuon', groupName: '浊音・半浊音', row: 'ga', rowName: 'が行', example: '午後 (ごご)', exampleKata: 'ゴルフ (高尔夫)', strokesHira: 4, strokesKata: 4 },

    // ざ行
    { id: 'k_za', hiragana: 'ざ', katakana: 'ザ', romaji: 'za', group: 'dakuon', groupName: '浊音・半浊音', row: 'za', rowName: 'ざ行', example: '雑誌 (ざっし)', exampleKata: 'デザイン (设计)', strokesHira: 5, strokesKata: 5 },
    { id: 'k_ji_z', hiragana: 'じ', katakana: 'ジ', romaji: 'ji', group: 'dakuon', groupName: '浊音・半浊音', row: 'za', rowName: 'ざ行', example: '時間 (じかん)', exampleKata: 'ジュース (果汁)', strokesHira: 3, strokesKata: 5 },
    { id: 'k_zu_z', hiragana: 'ず', katakana: 'ず', romaji: 'zu', group: 'dakuon', groupName: '浊音・半浊音', row: 'za', rowName: 'ざ行', example: '地図 (ちず)', exampleKata: 'ズボン (裤子)', strokesHira: 4, strokesKata: 4 },
    { id: 'k_ze', hiragana: 'ぜ', katakana: 'ゼ', romaji: 'ze', group: 'dakuon', groupName: '浊音・半浊音', row: 'za', rowName: 'ざ行', example: '全部 (ぜんぶ)', exampleKata: 'ゼリー (果冻)', strokesHira: 5, strokesKata: 4 },
    { id: 'k_zo', hiragana: 'ぞ', katakana: 'ゾ', romaji: 'zo', group: 'dakuon', groupName: '浊音・半浊音', row: 'za', rowName: 'ざ行', example: '象 (ぞう)', exampleKata: 'ゾーン (区域)', strokesHira: 3, strokesKata: 4 },

    // だ行
    { id: 'k_da', hiragana: 'だ', katakana: 'ダ', romaji: 'da', group: 'dakuon', groupName: '浊音・半浊音', row: 'da', rowName: 'だ行', example: '大学 (だいがく)', exampleKata: 'ダンス (跳舞)', strokesHira: 6, strokesKata: 5 },
    { id: 'k_ji_d', hiragana: 'ぢ', katakana: 'ヂ', romaji: 'ji', group: 'dakuon', groupName: '浊音・半浊音', row: 'da', rowName: 'だ行', example: '鼻血 (はなぢ)', exampleKata: 'ヂ (同音字/外来语)', strokesHira: 4, strokesKata: 5 },
    { id: 'k_zu_d', hiragana: 'づ', katakana: 'ヅ', romaji: 'zu', group: 'dakuon', groupName: '浊音・半浊音', row: 'da', rowName: 'だ行', example: '続く (つづく)', exampleKata: 'ヅ (同音字/外来语)', strokesHira: 3, strokesKata: 5 },
    { id: 'k_de', hiragana: 'で', katakana: 'デ', romaji: 'de', group: 'dakuon', groupName: '浊音・半浊音', row: 'da', rowName: 'だ行', example: '電話 (でんわ)', exampleKata: 'デパート (百货)', strokesHira: 3, strokesKata: 5 },
    { id: 'k_do', hiragana: 'ど', katakana: 'ド', romaji: 'do', group: 'dakuon', groupName: '浊音・半浊音', row: 'da', rowName: 'だ行', example: '友達 (ともだち)', exampleKata: 'ドア (门)', strokesHira: 4, strokesKata: 4 },

    // ば行
    { id: 'k_ba', hiragana: 'ば', katakana: 'バ', romaji: 'ba', group: 'dakuon', groupName: '浊音・半浊音', row: 'ba', rowName: 'ば行', example: '場所 (ばしょ)', exampleKata: 'バス (巴士)', strokesHira: 5, strokesKata: 4 },
    { id: 'k_bi', hiragana: 'び', katakana: 'ビ', romaji: 'bi', group: 'dakuon', groupName: '浊音・半浊音', row: 'ba', rowName: 'ば行', example: '病院 (びょういん)', exampleKata: 'ビル (大楼)', strokesHira: 3, strokesKata: 4 },
    { id: 'k_bu', hiragana: 'ぶ', katakana: 'ブ', romaji: 'bu', group: 'dakuon', groupName: '浊音・半浊音', row: 'ba', rowName: 'ば行', example: '文化 (ぶんか)', exampleKata: 'ベッド (床)', strokesHira: 6, strokesKata: 3 },
    { id: 'k_be', hiragana: 'べ', katakana: 'ベ', romaji: 'be', group: 'dakuon', groupName: '浊音・半浊音', row: 'ba', rowName: 'ば行', example: '勉強 (べんきょう)', exampleKata: 'ベルト (皮带)', strokesHira: 3, strokesKata: 3 },
    { id: 'k_bo', hiragana: 'ぼ', katakana: 'ボ', romaji: 'bo', group: 'dakuon', groupName: '浊音・半浊音', row: 'ba', rowName: 'ば行', example: '貿易 (ぼうえき)', exampleKata: 'ボーイ (男孩/服务生)', strokesHira: 6, strokesKata: 6 },

    // ぱ行 (半浊音)
    { id: 'k_pa', hiragana: 'ぱ', katakana: 'パ', romaji: 'pa', group: 'dakuon', groupName: '浊音・半浊音', row: 'pa', rowName: 'ぱ行', example: 'ぱっと (一下子)', exampleKata: 'パーティー (宴会)', strokesHira: 4, strokesKata: 3 },
    { id: 'k_pi', hiragana: 'ぴ', katakana: 'ピ', romaji: 'pi', group: 'dakuon', groupName: '浊音・半浊音', row: 'pa', rowName: 'ぱ行', example: 'ぴかぴか (闪闪发亮)', exampleKata: 'ピアノ (钢琴)', strokesHira: 2, strokesKata: 3 },
    { id: 'k_pu', hiragana: 'ぷ', katakana: 'プ', romaji: 'pu', group: 'dakuon', groupName: '浊音・半浊音', row: 'pa', rowName: 'ぱ行', example: 'ぷかぷか (漂浮)', exampleKata: 'プール (游泳池)', strokesHira: 5, strokesKata: 2 },
    { id: 'k_pe', hiragana: 'ぺ', katakana: 'ペ', romaji: 'pe', group: 'dakuon', groupName: '浊音・半浊音', row: 'pa', rowName: 'ぱ行', example: 'ぺこぺこ (肚子饿)', exampleKata: 'ペン (钢笔)', strokesHira: 2, strokesKata: 2 },
    { id: 'k_po', hiragana: 'ぽ', katakana: 'ポ', romaji: 'po', group: 'dakuon', groupName: '浊音・半浊音', row: 'pa', rowName: 'ぱ行', example: 'ぽかぽか (暖洋洋)', exampleKata: 'ポスト (邮箱)', strokesHira: 5, strokesKata: 5 },

    // ================= 常用拗音 (33字) =================
    { id: 'k_kya', hiragana: 'きゃ', katakana: 'キャ', romaji: 'kya', group: 'youon', groupName: '拗音', row: 'kya', rowName: 'きゃ行', example: 'きゃく (客)', exampleKata: 'キャンプ (野营)', strokesHira: 6, strokesKata: 5 },
    { id: 'k_kyu', hiragana: 'きゅ', katakana: 'キュ', romaji: 'kyu', group: 'youon', groupName: '拗音', row: 'kya', rowName: 'きゃ行', example: 'きゅうり (黄瓜)', exampleKata: 'キューブ (方块)', strokesHira: 6, strokesKata: 5 },
    { id: 'k_kyo', hiragana: 'きょ', katakana: 'キョ', romaji: 'kyo', group: 'youon', groupName: '拗音', row: 'kya', rowName: 'きゃ行', example: 'きょう (今日)', exampleKata: 'キロ (公斤)', strokesHira: 6, strokesKata: 6 },

    { id: 'k_sha', hiragana: 'しゃ', katakana: 'シャ', romaji: 'sha', group: 'youon', groupName: '拗音', row: 'sha', rowName: 'しゃ行', example: 'しゃしん (写真)', exampleKata: 'シャワー (淋浴)', strokesHira: 4, strokesKata: 5 },
    { id: 'k_shu', hiragana: 'しゅ', katakana: 'シュ', romaji: 'shu', group: 'youon', groupName: '拗音', row: 'sha', rowName: 'しゃ行', example: 'しゅくだい (宿题)', exampleKata: 'シュークリーム (泡芙)', strokesHira: 3, strokesKata: 5 },
    { id: 'k_sho', hiragana: 'しょ', katakana: 'ショ', romaji: 'sho', group: 'youon', groupName: '拗音', row: 'sha', rowName: 'しゃ行', example: '食堂 (しょくどう)', exampleKata: 'ショップ (商店)', strokesHira: 3, strokesKata: 6 },

    { id: 'k_cha', hiragana: 'ちゃ', katakana: 'チャ', romaji: 'cha', group: 'youon', groupName: '拗音', row: 'cha', rowName: 'ちゃ行', example: 'お茶 (おちゃ)', exampleKata: 'チャンス (机会)', strokesHira: 5, strokesKata: 5 },
    { id: 'k_chu', hiragana: 'ちゅ', katakana: 'チュ', romaji: 'chu', group: 'youon', groupName: '拗音', row: 'cha', rowName: 'ちゃ行', example: '注意 (ちゅうい)', exampleKata: 'チューブ (软管)', strokesHira: 4, strokesKata: 5 },
    { id: 'k_cho', hiragana: 'ちょ', katakana: 'チョ', romaji: 'cho', group: 'youon', groupName: '拗音', row: 'cha', rowName: 'ちゃ行', example: 'ちょっと (稍微)', exampleKata: 'チョコ (巧克力)', strokesHira: 4, strokesKata: 6 },

    { id: 'k_nya', hiragana: 'にゃ', katakana: 'ニャ', romaji: 'nya', group: 'youon', groupName: '拗音', row: 'nya', rowName: 'にゃ行', example: 'にゃんこ (猫咪)', exampleKata: 'ニャー (猫叫声)', strokesHira: 6, strokesKata: 4 },
    { id: 'k_nyu', hiragana: 'にゅ', katakana: 'ニュ', romaji: 'nyu', group: 'youon', groupName: '拗音', row: 'nya', rowName: 'にゃ行', example: '牛乳 (ぎゅうにゅう)', exampleKata: 'ニュース (新闻)', strokesHira: 5, strokesKata: 4 },
    { id: 'k_nyo', hiragana: 'にょ', katakana: 'ニョ', romaji: 'nyo', group: 'youon', groupName: '拗音', row: 'nya', rowName: 'にゃ行', example: 'にょきにょき (长出)', exampleKata: 'ニョッキ (面疙瘩)', strokesHira: 5, strokesKata: 5 },

    { id: 'k_hya', hiragana: 'ひゃ', katakana: 'ヒャ', romaji: 'hya', group: 'youon', groupName: '拗音', row: 'hya', rowName: 'ひゃ行', example: '百 (ひゃく)', exampleKata: 'ヒャッホー (欢呼)', strokesHira: 4, strokesKata: 4 },
    { id: 'k_hyu', hiragana: 'ひゅ', katakana: 'ヒュ', romaji: 'hyu', group: 'youon', groupName: '拗音', row: 'hya', rowName: 'ひゃ行', example: 'ひゅうひゅう (风声)', exampleKata: 'ヒューズ (保险丝)', strokesHira: 3, strokesKata: 4 },
    { id: 'k_hyo', hiragana: 'ひょ', katakana: 'ヒョ', romaji: 'hyo', group: 'youon', groupName: '拗音', row: 'hya', rowName: 'ひゃ行', example: 'ひょうげん (表现)', exampleKata: 'ヒョウ (豹子)', strokesHira: 3, strokesKata: 5 },

    { id: 'k_mya', hiragana: 'みゃ', katakana: 'ミャ', romaji: 'mya', group: 'youon', groupName: '拗音', row: 'mya', rowName: 'みゃ行', example: 'みゃく (脉搏)', exampleKata: 'ミャンマー (缅甸)', strokesHira: 5, strokesKata: 5 },
    { id: 'k_myu', hiragana: 'みゅ', katakana: 'ミュ', romaji: 'myu', group: 'youon', groupName: '拗音', row: 'mya', rowName: 'みゃ行', example: 'みゅーじかる (音乐剧)', exampleKata: 'ミュージカル (音乐剧)', strokesHira: 4, strokesKata: 5 },
    { id: 'k_myo', hiragana: 'みょ', katakana: 'ミョ', romaji: 'myo', group: 'youon', groupName: '拗音', row: 'mya', rowName: 'みゃ行', example: 'みょうにち (明日)', exampleKata: 'ミョウバン (明矾)', strokesHira: 4, strokesKata: 6 },

    { id: 'k_rya', hiragana: 'りゃ', katakana: 'リャ', romaji: 'rya', group: 'youon', groupName: '拗音', row: 'rya', rowName: 'りゃ行', example: 'りゃく (略/简称)', exampleKata: 'リャマ (大羊驼)', strokesHira: 5, strokesKata: 4 },
    { id: 'k_ryu', hiragana: 'りゅ', katakana: 'リュ', romaji: 'ryu', group: 'youon', groupName: '拗音', row: 'rya', rowName: 'りゃ行', example: '留学生 (りゅうがくせい)', exampleKata: 'リュック (双肩包)', strokesHira: 4, strokesKata: 4 },
    { id: 'k_ryo', hiragana: 'りょ', katakana: 'リョ', romaji: 'ryo', group: 'youon', groupName: '拗音', row: 'rya', rowName: 'りゃ行', example: '旅行 (りょこう)', exampleKata: 'リョーマ (龙马)', strokesHira: 4, strokesKata: 5 },

    { id: 'k_gya', hiragana: 'ぎゃ', katakana: 'ギャ', romaji: 'gya', group: 'youon', groupName: '拗音', row: 'gya', rowName: 'ぎゃ行', example: '逆 (ぎゃく)', exampleKata: 'ギャップ (差距)', strokesHira: 9, strokesKata: 7 },
    { id: 'k_gyu', hiragana: 'ぎゅ', katakana: 'ギュ', romaji: 'gyu', group: 'youon', groupName: '拗音', row: 'gya', rowName: 'ぎゃ行', example: '牛乳 (ぎゅうにゅう)', exampleKata: 'ギュッ (紧紧握住)', strokesHira: 8, strokesKata: 7 },
    { id: 'k_gyo', hiragana: 'ぎょ', katakana: 'ギョ', romaji: 'gyo', group: 'youon', groupName: '拗音', row: 'gya', rowName: 'ぎゃ行', example: '魚 (ぎょ)', exampleKata: 'ギョーザ (饺子)', strokesHira: 8, strokesKata: 8 },

    { id: 'k_ja', hiragana: 'じゃ', katakana: 'ジャ', romaji: 'ja', group: 'youon', groupName: '拗音', row: 'ja', rowName: 'じゃ行', example: 'じゃあ (那么)', exampleKata: 'シャツ/ジャム (果酱)', strokesHira: 6, strokesKata: 7 },
    { id: 'k_ju', hiragana: 'じゅ', katakana: 'ジュ', romaji: 'ju', group: 'youon', groupName: '拗音', row: 'ja', rowName: 'じゃ行', example: 'じゅんび (准备)', exampleKata: 'ジュース (果汁)', strokesHira: 5, strokesKata: 7 },
    { id: 'k_jo', hiragana: 'じょ', katakana: 'ジョ', romaji: 'jo', group: 'youon', groupName: '拗音', row: 'ja', rowName: 'じゃ行', example: 'じょせい (女性)', exampleKata: 'ジョギング (慢跑)', strokesHira: 5, strokesKata: 8 },

    { id: 'k_bya', hiragana: 'びゃ', katakana: 'ビャ', romaji: 'bya', group: 'youon', groupName: '拗音', row: 'bya', rowName: 'びゃ行', example: '白夜 (びゃくや)', exampleKata: 'ビャクシン (桧柏)', strokesHira: 6, strokesKata: 6 },
    { id: 'k_byu', hiragana: 'びゅ', katakana: 'ビュ', romaji: 'byu', group: 'youon', groupName: '拗音', row: 'bya', rowName: 'びゃ行', example: 'びゅうびゅう (疾风)', exampleKata: 'ビュッフェ (自助餐)', strokesHira: 5, strokesKata: 6 },
    { id: 'k_byo', hiragana: 'びょ', katakana: 'ビョ', romaji: 'byo', group: 'youon', groupName: '拗音', row: 'bya', rowName: 'びゃ行', example: '病院 (びょういん)', exampleKata: 'ビョーク (歌手名)', strokesHira: 5, strokesKata: 7 },

    { id: 'k_pya', hiragana: 'ぴゃ', katakana: 'ピャ', romaji: 'pya', group: 'youon', groupName: '拗音', row: 'pya', rowName: 'ぴゃ行', example: 'ぴゃっと (敏捷动作)', exampleKata: 'ピャ (擬声語)', strokesHira: 5, strokesKata: 5 },
    { id: 'k_pyu', hiragana: 'ぴゅ', katakana: 'ピュ', romaji: 'pyu', group: 'youon', groupName: '拗音', row: 'pya', rowName: 'ぴゃ行', example: 'ぴゅーぴゅー (笛声)', exampleKata: 'ピューマ (美洲狮)', strokesHira: 4, strokesKata: 5 },
    { id: 'k_pyo', hiragana: 'ぴょ', katakana: 'ピョ', romaji: 'pyo', group: 'youon', groupName: '拗音', row: 'pya', rowName: 'ぴゃ行', example: 'ぴょんぴょん (蹦蹦跳跳)', exampleKata: 'ピョンヤン (平壤)', strokesHira: 4, strokesKata: 6 }
];
