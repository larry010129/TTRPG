const GAME_CONFIG = {
  "materials": {
    "獸皮碎片": {
      "price": 3,
      "grade": "low"
    },
    "普通骨頭": {
      "price": 2,
      "grade": "low"
    },
    "野草萃取液": {
      "price": 2,
      "grade": "low"
    },
    "粗糙礦石": {
      "price": 3,
      "grade": "low"
    },
    "腐木碎片": {
      "price": 2,
      "grade": "low"
    },
    "精製獸皮": {
      "price": 8,
      "grade": "mid"
    },
    "魔法骨髓": {
      "price": 8,
      "grade": "mid"
    },
    "濃縮草藥精": {
      "price": 7,
      "grade": "mid"
    },
    "精煉礦晶": {
      "price": 10,
      "grade": "mid"
    },
    "古樹樹脂": {
      "price": 8,
      "grade": "mid"
    },
    "熔岩晶核": {
      "price": 12,
      "grade": "mid"
    },
    "蛇女眼淚": {
      "price": 10,
      "grade": "mid"
    },
    "龍族鱗片": {
      "price": 25,
      "grade": "high"
    },
    "星界碎片": {
      "price": 30,
      "grade": "high"
    },
    "深淵核心": {
      "price": 28,
      "grade": "high"
    },
    "時間碎片": {
      "price": 25,
      "grade": "high"
    },
    "暗影精華": {
      "price": 20,
      "grade": "high"
    },
    "霜巨魔之心": {
      "price": 22,
      "grade": "high"
    }
  },
  "recipes": {
    "low": [
      {
        "name": "初級治癒藥水",
        "ingredients": {
          "野草萃取液": 2,
          "普通骨頭": 1
        },
        "resultType": "item",
        "resultLabel": "初級治癒藥水",
        "resultVal": {
          "name": "初級治癒藥水",
          "desc": "使用後回復 8 點生命值",
          "effect": "heal_8"
        }
      },
      {
        "name": "響鈴絆線",
        "ingredients": {
          "獸皮碎片": 2,
          "粗糙礦石": 1
        },
        "resultType": "trap",
        "resultLabel": "響鈴絆線",
        "resultVal": {
          "type": "響鈴絆線",
          "desc": "觸發：給予設置者 $8，踩中者扣除 3 HP，位置暴露跳過下回合",
          "damage": 3,
          "goldTransfer": 8
        }
      },
      {
        "name": "隨機初級道具",
        "ingredients": {
          "腐木碎片": 2,
          "野草萃取液": 1
        },
        "resultType": "random_low",
        "resultLabel": "隨機初級道具",
        "resultVal": null
      }
    ],
    "mid": [
      {
        "name": "中級治癒藥水",
        "ingredients": {
          "濃縮草藥精": 2,
          "魔法骨髓": 1
        },
        "resultType": "item",
        "resultLabel": "中級治癒藥水",
        "resultVal": {
          "name": "中級治癒藥水",
          "desc": "使用後回復 15 點生命值",
          "effect": "heal_15"
        }
      },
      {
        "name": "蛇毒藥劑",
        "ingredients": {
          "蛇女眼淚": 1,
          "精製獸皮": 1,
          "精煉礦晶": 1
        },
        "resultType": "item",
        "resultLabel": "蛇毒藥劑",
        "resultVal": {
          "name": "蛇毒藥劑",
          "desc": "塗於武器，使目標中毒每回合扣1d4，持續3回合",
          "effect": "poison_oil"
        }
      },
      {
        "name": "守護者護甲",
        "ingredients": {
          "精製獸皮": 2,
          "古樹樹脂": 1
        },
        "resultType": "item",
        "resultLabel": "守護者護甲",
        "resultVal": {
          "name": "守護者護甲",
          "desc": "被動：戰鬥中防禦+3，每日一次反彈近戰傷害",
          "effect": "def_3"
        }
      },
      {
        "name": "爆炸符紙",
        "ingredients": {
          "熔岩晶核": 2,
          "粗糙礦石": 2
        },
        "resultType": "trap",
        "resultLabel": "爆炸符紙",
        "resultVal": {
          "type": "爆炸符紙",
          "desc": "觸發：給予設置者 $18，踩中者失去揹包價值最低道具",
          "damage": 6,
          "goldTransfer": 18
        }
      }
    ],
    "high": [
      {
        "name": "龍鱗重甲",
        "ingredients": {
          "龍族鱗片": 2,
          "精煉礦晶": 2
        },
        "resultType": "item",
        "resultLabel": "龍鱗重甲",
        "resultVal": {
          "name": "龍鱗重甲",
          "desc": "被動：AC+5，火焰與毒素免疫，移動-3",
          "effect": "def_5"
        }
      },
      {
        "name": "星界武器",
        "ingredients": {
          "星界碎片": 2,
          "暗影精華": 1
        },
        "resultType": "item",
        "resultLabel": "【覺醒】月影長劍",
        "resultVal": {
          "name": "【覺醒】月影長劍",
          "desc": "被動：戰鬥中傷害大增 (覺醒裝備)",
          "effect": "atk_moon_awakened"
        }
      },
      {
        "name": "時間封印器",
        "ingredients": {
          "時間碎片": 2,
          "深淵核心": 1
        },
        "resultType": "item",
        "resultLabel": "時之沙漏",
        "resultVal": {
          "name": "時之沙漏",
          "desc": "主動：重啟團隊行動回合，或當作免死金牌 (消耗品)",
          "effect": "time_hourglass"
        }
      },
      {
        "name": "終極詛咒石",
        "ingredients": {
          "深淵核心": 1,
          "蛇女眼淚": 2,
          "暗影精華": 1
        },
        "resultType": "trap",
        "resultLabel": "終極詛咒石",
        "resultVal": {
          "type": "【詛咒】隨機陷阱",
          "desc": "觸發：帶有不穩定詛咒效果的隨機陷阱",
          "damage": 10,
          "goldTransfer": 15
        }
      },
      {
        "name": "霜魔護符",
        "ingredients": {
          "霜巨魔之心": 1,
          "魔法骨髓": 2
        },
        "resultType": "item",
        "resultLabel": "【覺醒】守護者護甲",
        "resultVal": {
          "name": "【覺醒】守護者護甲",
          "desc": "被動：防禦加倍且帶冰凍反擊",
          "effect": "def_3_atk_1"
        }
      }
    ]
  },
  "shopItems": [
    {
      "name": "草藥包",
      "icon": "🌿",
      "effect": "消除流血，恢復1點HP",
      "effectKey": "heal_1",
      "price": 5
    },
    {
      "name": "普通火把",
      "icon": "🔦",
      "effect": "燃燒6小時，照亮半徑9公尺範圍",
      "effectKey": "passive",
      "price": 5
    },
    {
      "name": "麻繩 (15公尺)",
      "icon": "🪢",
      "effect": "可承重100公斤，用於攀爬或綑綁",
      "effectKey": "passive",
      "price": 5
    },
    {
      "name": "空白卷軸",
      "icon": "📜",
      "effect": "魔法師可抄錄一個已知法術備用",
      "effectKey": "passive",
      "price": 5
    },
    {
      "name": "燧石與火鐮",
      "icon": "🔥",
      "effect": "在野外生火，可用於觸發特殊場景",
      "effectKey": "passive",
      "price": 5
    },
    {
      "name": "廉價麥酒 (6罐)",
      "icon": "🍺",
      "effect": "提升NPC好感度，可換取情報或折扣",
      "effectKey": "passive",
      "price": 5
    },
    {
      "name": "撬鎖工具組",
      "icon": "🔧",
      "effect": "適用於開啟簡單鎖頭（非魔法鎖）",
      "effectKey": "passive",
      "price": 5
    },
    {
      "name": "聖鹽一袋",
      "icon": "🧂",
      "effect": "驅除低階不死生物，阻擋幽靈",
      "effectKey": "passive",
      "price": 5
    },
    {
      "name": "區域手繪地圖",
      "icon": "🗺️",
      "effect": "涵蓋玩家當前位置周邊三日路程的地圖",
      "effectKey": "passive",
      "price": 5
    },
    {
      "name": "捕獸夾",
      "icon": "🪤",
      "effect": "陷阱：對小型生物造成1d4傷害並固定",
      "effectKey": "trap",
      "isTrap": true,
      "price": 5
    },
    {
      "name": "響鈴絆線",
      "icon": "🪢",
      "effect": "陷阱：踩中者暴露位置，扣費$8並跳過下回合",
      "effectKey": "trap",
      "isTrap": true,
      "price": 5
    },
    {
      "name": "黏液陷阱",
      "icon": "💧",
      "effect": "陷阱：踩中者減速並付設置者$8",
      "effectKey": "trap",
      "isTrap": true,
      "price": 5
    },
    {
      "name": "初級治癒藥水",
      "icon": "🧪",
      "effect": "恢復2d4+2點HP",
      "effectKey": "heal_2d4p2",
      "price": 8
    },
    {
      "name": "皮革臂甲",
      "icon": "🛡️",
      "effect": "護甲值AC+1，永久裝備效果",
      "effectKey": "def_1",
      "price": 8
    },
    {
      "name": "短匕首 (+0)",
      "icon": "🗡️",
      "effect": "基礎傷害1d4，可投擲攻擊（遠程）",
      "effectKey": "passive",
      "price": 8
    },
    {
      "name": "魔法觸媒石",
      "icon": "💎",
      "effect": "作為施法材料替代品，每日充能一次",
      "effectKey": "passive",
      "price": 8
    },
    {
      "name": "箭矢 (20支)",
      "icon": "🏹",
      "effect": "標準木箭，附贈箭囊，供狙獵手使用",
      "effectKey": "passive",
      "price": 8
    },
    {
      "name": "偽裝面具",
      "icon": "🎭",
      "effect": "偽裝技能+2，可用於混入特定群體",
      "effectKey": "passive",
      "price": 8
    },
    {
      "name": "怪物圖鑑 (入門)",
      "icon": "📖",
      "effect": "記錄50種生物弱點，戰鬥速度臨時+2",
      "effectKey": "passive",
      "price": 8
    },
    {
      "name": "輕量帳篷",
      "icon": "⛺",
      "effect": "野外休息時取消「曝露」懲罰，正常回復",
      "effectKey": "passive",
      "price": 8
    },
    {
      "name": "辟邪符咒",
      "icon": "📜",
      "effect": "對術法系攻擊的首次命中傷害減半，用後消失",
      "effectKey": "passive",
      "price": 8
    },
    {
      "name": "法師之手卷軸",
      "icon": "📜",
      "effect": "一次性使用；可遠端操作輕物或觸發機關",
      "effectKey": "passive",
      "price": 8
    },
    {
      "name": "毒刺地板",
      "icon": "⚡",
      "effect": "陷阱：踩中者失去2d4 HP；付設置者$12",
      "effectKey": "trap",
      "isTrap": true,
      "price": 8
    },
    {
      "name": "幻象路牌",
      "icon": "🪧",
      "effect": "陷阱：踩中者下回合移動方向由設置者決定；支付$12",
      "effectKey": "trap",
      "isTrap": true,
      "price": 8
    },
    {
      "name": "中級治癒藥水",
      "icon": "🧪",
      "effect": "恢復4d4+4點HP",
      "effectKey": "heal_4d4p4",
      "price": 10
    },
    {
      "name": "魔法望遠鏡",
      "icon": "🔭",
      "effect": "可視距離延伸至500公尺，可感知魔力",
      "effectKey": "passive",
      "price": 10
    },
    {
      "name": "疾行靴",
      "icon": "👟",
      "effect": "移動速度+3公尺；地形限制減半",
      "effectKey": "passive",
      "price": 10
    },
    {
      "name": "護符：幸運之眼",
      "icon": "👁️",
      "effect": "每天一次，可讓一次失敗的投擲重新擲骰",
      "effectKey": "passive",
      "price": 10
    },
    {
      "name": "探測礦石棒",
      "icon": "🔮",
      "effect": "偵測前方3格內陷阱",
      "effectKey": "detect",
      "price": 10
    },
    {
      "name": "酸液燒瓶",
      "icon": "🧪",
      "effect": "投擲武器，造成2d6酸性傷害且AC-1持續3回合",
      "effectKey": "passive",
      "price": 10
    },
    {
      "name": "暗影斗篷",
      "icon": "🌑",
      "effect": "黑暗環境中潛行技能+3",
      "effectKey": "passive",
      "price": 10
    },
    {
      "name": "通訊水晶 (短程)",
      "icon": "🔮",
      "effect": "有效距離300公尺，每日可使用5次",
      "effectKey": "passive",
      "price": 10
    },
    {
      "name": "銀刃油",
      "icon": "🧴",
      "effect": "塗於武器，對狼人與惡魔類生物傷害×1.5",
      "effectKey": "passive",
      "price": 10
    },
    {
      "name": "魔法信鴿 (單次)",
      "icon": "🐦",
      "effect": "攜帶一封短訊穿越障礙物傳達給指定目標",
      "effectKey": "passive",
      "price": 10
    },
    {
      "name": "流沙機關",
      "icon": "🏜️",
      "effect": "陷阱：踩中者往回D6格；付設置者$18",
      "effectKey": "trap",
      "isTrap": true,
      "price": 10
    },
    {
      "name": "爆炸符紙",
      "icon": "💥",
      "effect": "陷阱：踩中者失去背包最便宜道具；付設置者$18",
      "effectKey": "trap",
      "isTrap": true,
      "price": 10
    },
    {
      "name": "詛咒之石",
      "icon": "💀",
      "effect": "對任意玩家揹包中任意一件道具施加【詛咒】標籤",
      "effectKey": "stone_curse",
      "price": 12
    },
    {
      "name": "標籤刻印石·晝",
      "icon": "☀️",
      "effect": "對地圖上任意一個格子強制套上【晝強】標籤",
      "effectKey": "stone_day",
      "price": 12
    },
    {
      "name": "標籤刻印石·夜",
      "icon": "🌙",
      "effect": "對地圖上任意一個格子強制套上【夜強】標籤",
      "effectKey": "stone_night",
      "price": 12
    },
    {
      "name": "傳送符石 (單程)",
      "icon": "💎",
      "effect": "立即傳送回上次「休息地點」，用後消失",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "雷鳴箭 (5支)",
      "icon": "🏹",
      "effect": "命中時爆炸，對周圍3公尺造成1d6閃電傷害",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "冰凍匕首",
      "icon": "🗡️",
      "effect": "傷害1d6+1；命中時有20%機率施加「緩速」持續1回合",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "古語魔法書",
      "icon": "📖",
      "effect": "包含3個一級法術；魔法師學習後書籍消失",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "蛇毒藥劑",
      "icon": "🧴",
      "effect": "塗於武器使目標中毒，每回合扣1d4 HP，持續3回合",
      "effectKey": "poison_oil",
      "price": 15
    },
    {
      "name": "水中呼吸珠",
      "icon": "🔵",
      "effect": "水下可呼吸30分鐘，一次性使用",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "萬能鑰匙",
      "icon": "🔑",
      "effect": "可開啟任何非魔法鎖頭，耐久100次後失效",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "焰爆卷軸",
      "icon": "🔥",
      "effect": "施放火球術，造成3d6火焰範圍傷害，無限制",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "魔法盾牌符文",
      "icon": "🛡️",
      "effect": "貼附於盾牌，每日一次完全吸收一次傷害",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "亡靈術士典籍",
      "icon": "💀",
      "effect": "包含召喚骷髏兵法術，使用後消失",
      "effectKey": "passive",
      "price": 15
    },
    {
      "name": "覺醒之石",
      "icon": "✨",
      "effect": "對自己揹包中任意一件道具施加【覺醒】標籤",
      "effectKey": "stone_awake",
      "price": 15
    },
    {
      "name": "靈魂枷鎖",
      "icon": "⛓️",
      "effect": "陷阱：踩中者3回合無法使用道具；付設置者$25",
      "effectKey": "trap",
      "isTrap": true,
      "price": 15
    },
    {
      "name": "詛咒鏡像",
      "icon": "🪞",
      "effect": "陷阱：踩中者所有骰子翻轉(1當6)持續2回；付$25",
      "effectKey": "trap",
      "isTrap": true,
      "price": 15
    },
    {
      "name": "標籤解除符",
      "icon": "📜",
      "effect": "移除自己下一場戰鬥格的所有敵人標籤",
      "effectKey": "clear_tags",
      "price": 15
    },
    {
      "name": "日蝕石",
      "icon": "🌑",
      "effect": "強制將當前白天回合切換為晚上，本輪結束後恢復",
      "effectKey": "eclipse",
      "price": 18
    },
    {
      "name": "黎明石",
      "icon": "🌅",
      "effect": "強制將當前晚上切換為白天，本輪結束後恢復",
      "effectKey": "dawn",
      "price": 18
    },
    {
      "name": "力量指環",
      "icon": "💍",
      "effect": "力量屬性+2，不佔裝備欄位",
      "effectKey": "atk_2",
      "price": 25
    },
    {
      "name": "月影長劍",
      "icon": "⚔️",
      "effect": "傷害1d8+2；夜晚時傷害提升為1d8+4",
      "effectKey": "atk_moon",
      "price": 25
    },
    {
      "name": "法師弓",
      "icon": "🏹",
      "effect": "射出箭矢時附帶一個一級法術效果",
      "effectKey": "passive",
      "price": 25
    },
    {
      "name": "守護者護甲",
      "icon": "🛡️",
      "effect": "AC+3；每日一次反彈近戰傷害",
      "effectKey": "def_3",
      "price": 25
    },
    {
      "name": "預言水晶球",
      "icon": "🔮",
      "effect": "每日可向GM詢問一個是非題，GM須誠實回答",
      "effectKey": "passive",
      "price": 25
    },
    {
      "name": "大地之靈壺",
      "icon": "🏺",
      "effect": "恢復8d4+8點HP；附帶解毒與解流血",
      "effectKey": "heal_8d4p8",
      "price": 25
    },
    {
      "name": "鷹眼護目鏡",
      "icon": "🥽",
      "effect": "遠程攻擊射程×1.5；消除黑暗視野懲罰",
      "effectKey": "passive",
      "price": 25
    },
    {
      "name": "死靈法杖",
      "icon": "💀",
      "effect": "施放亡靈系法術時，傷害骰數+1",
      "effectKey": "passive",
      "price": 25
    },
    {
      "name": "迷霧炸彈 (3顆)",
      "icon": "💣",
      "effect": "製造直徑10公尺濃霧，持續3回合",
      "effectKey": "passive",
      "price": 25
    },
    {
      "name": "召喚師契約書",
      "icon": "📜",
      "effect": "與一隻中型生物締結契約作戰直到休息",
      "effectKey": "passive",
      "price": 25
    },
    {
      "name": "神秘商人契約書",
      "icon": "📜",
      "effect": "召喚神秘商人，陳列30件隨機商品",
      "effectKey": "merchant_scroll",
      "price": 25
    },
    {
      "name": "遠程攻擊符文",
      "icon": "🔮",
      "effect": "對最終Boss造成20點提前傷害；限購一次",
      "effectKey": "boss_dmg_20",
      "price": 25
    },
    {
      "name": "混沌刻印石",
      "icon": "🌀",
      "effect": "對地圖上任意一個戰鬥格強制套上【混沌】標籤",
      "effectKey": "stone_chaos",
      "price": 25
    },
    {
      "name": "次元囚籠",
      "icon": "🕸️",
      "effect": "陷阱：踩中者需擲D20>=15才能脫困；付設置者$35",
      "effectKey": "trap",
      "isTrap": true,
      "price": 25
    },
    {
      "name": "記憶侵蝕術",
      "icon": "🧠",
      "effect": "陷阱：踩中者隨機交出一件道具給設置者；付設置者$35",
      "effectKey": "trap",
      "isTrap": true,
      "price": 25
    },
    {
      "name": "封印破壞錘",
      "icon": "🔨",
      "effect": "對最終Boss造成40點提前傷害，且40%機率損毀",
      "effectKey": "boss_dmg_40",
      "price": 25
    },
    {
      "name": "獻祭祭壇卷軸",
      "icon": "📜",
      "effect": "主動獻祭金幣，每$10換算8點Boss提前傷害",
      "effectKey": "boss_sacrifice",
      "price": 25
    },
    {
      "name": "時序護符",
      "icon": "🛡️",
      "effect": "持有者完全免疫所有強制時間切換效果",
      "effectKey": "passive",
      "price": 25
    },
    {
      "name": "命運之輪護符",
      "icon": "🌀",
      "effect": "每局遊戲一次，可將任意一次投擲結果改為自然20",
      "effectKey": "passive",
      "price": 40
    },
    {
      "name": "噬魂之劍",
      "icon": "⚔️",
      "effect": "傷害2d8+3；每次擊殺敵人後回復3點HP",
      "effectKey": "atk_soul",
      "price": 40
    },
    {
      "name": "全知之眼",
      "icon": "👁️",
      "effect": "持有者可感知100公尺內所有生命體的位置",
      "effectKey": "passive",
      "price": 40
    },
    {
      "name": "鳳凰羽翼斗篷",
      "icon": "🦚",
      "effect": "HP歸零時自動觸發：直接恢復50% HP，免死一次",
      "effectKey": "phoenix_cape",
      "price": 40
    },
    {
      "name": "時之沙漏",
      "icon": "⏳",
      "effect": "每日一次，讓整個隊伍重新行動一個回合(或作為免死)",
      "effectKey": "time_hourglass",
      "price": 40
    },
    {
      "name": "次元口袋",
      "icon": "💼",
      "effect": "揹包容量升為無限；但5天後觸發道具消失判定",
      "effectKey": "bag_infinite",
      "price": 40
    },
    {
      "name": "龍鱗重甲",
      "icon": "🐉",
      "effect": "AC+5；獲得火毒免疫；移動速度-3格",
      "effectKey": "def_5",
      "price": 40
    },
    {
      "name": "海神三叉戟",
      "icon": "🔱",
      "effect": "傷害1d10+4；控水，持有者水下無限呼吸",
      "effectKey": "passive",
      "price": 40
    },
    {
      "name": "神明許可狀",
      "icon": "📜",
      "effect": "每日可施放一個三級奇蹟法術",
      "effectKey": "passive",
      "price": 40
    },
    {
      "name": "星界羅盤",
      "icon": "🧭",
      "effect": "持有者永不迷路，指引最短路徑",
      "effectKey": "passive",
      "price": 40
    },
    {
      "name": "神燈",
      "icon": "🏮",
      "effect": "召喚神燈精靈，3次機會購買商品打八折",
      "effectKey": "passive",
      "price": 40
    },
    {
      "name": "時間冰封陣",
      "icon": "❄️",
      "effect": "陷阱：踩中者連續2回合跳過無法行動；付設置者$50",
      "effectKey": "trap",
      "isTrap": true,
      "price": 40
    },
    {
      "name": "靈魂置換咒",
      "icon": "🔄",
      "effect": "陷阱：踩中者與設置者強制交換地圖位置與所有道具；付$50",
      "effectKey": "trap",
      "isTrap": true,
      "price": 40
    }
  ],
  "classes": {
    "戰士": {
      "maxHp": 120,
      "atk": "2d8",
      "def": 10,
      "spd": 3,
      "maxMp": 0,
      "color": "#c04030",
      "desc": "高防禦・高HP・近戰主力",
      "skills": [
        {
          "name": "防禦姿態",
          "desc": "當回合受傷減半，但無法攻擊。可與道具共用。"
        },
        {
          "name": "戰地急救",
          "desc": "使用回復道具時，不消耗戰鬥回合（被動特質）。"
        }
      ]
    },
    "黑魔法師": {
      "maxHp": 70,
      "atk": "4d10",
      "def": 3,
      "spd": 4,
      "maxMp": 20,
      "color": "#6030a0",
      "desc": "高爆發魔法・脆皮・帶吸血",
      "skills": [
        {
          "name": "魔法爆發",
          "desc": "傷害乘2，冷卻3回合，消耗 5 MP。"
        },
        {
          "name": "暗黑汲取",
          "desc": "魔法命中後，將傷害的 10% 回復自身生命（被動）。"
        }
      ]
    },
    "白魔法師": {
      "maxHp": 85,
      "atk": "2d6",
      "def": 5,
      "spd": 4,
      "maxMp": 20,
      "color": "#e0c040",
      "desc": "團隊回復支援",
      "skills": [
        {
          "name": "聖光治癒",
          "desc": "消耗 3 MP，為任意玩家回復 1d8+3 生命。"
        },
        {
          "name": "神聖庇護",
          "desc": "每場限用一次，消耗 8 MP，全體玩家各補 1d6 生命。"
        }
      ]
    },
    "刺客": {
      "maxHp": 80,
      "atk": "3d8",
      "def": 4,
      "spd": 8,
      "maxMp": 0,
      "color": "#304060",
      "desc": "高爆發・先攻優勢・半血吸血",
      "skills": [
        {
          "name": "暗殺",
          "desc": "首回合攻擊傷害 1.5 倍，享有絕對先攻 (Spd 8)（被動）。"
        },
        {
          "name": "嗜血覺醒",
          "desc": "HP 降至 50% 以下時，命中可吸取傷害 15% 的生命（被動）。"
        }
      ]
    },
    "狙獵手": {
      "maxHp": 85,
      "atk": "3d6",
      "def": 5,
      "spd": 6,
      "maxMp": 0,
      "color": "#408030",
      "desc": "遠程精準攻擊・帶穿透蓄力",
      "skills": [
        {
          "name": "連射",
          "desc": "每場戰鬥可施展2次，同一回合內發動兩次攻擊。"
        },
        {
          "name": "精準瞄準",
          "desc": "跳過本回合（蓄力），下回合傷害 2 倍；對標籤怪額外 +1d6。"
        }
      ]
    },
    "火炮海盜": {
      "maxHp": 90,
      "atk": "4d8",
      "def": 6,
      "spd": 4,
      "maxMp": 0,
      "color": "#c07020",
      "desc": "範圍傷害・高風險高報酬",
      "skills": [
        {
          "name": "雙管齊發",
          "desc": "每場戰鬥可施展2次，同回合發動兩次攻擊。"
        },
        {
          "name": "範圍爆破",
          "desc": "對全體敵人造成 2d8 群傷(無視防禦)；每場限3次，20%自傷1d6。"
        }
      ]
    }
  },
  "enemies": {
    "basic": [
      {
        "name": "哥布林斥候",
        "hp": 8,
        "maxHp": 8,
        "atk": "1d4",
        "def": 0,
        "drop": 5,
        "tag": "",
        "special": "先攻；HP<50%逃跑偷走$3"
      },
      {
        "name": "骷髏弓手",
        "hp": 10,
        "maxHp": 10,
        "atk": "1d6",
        "def": 1,
        "drop": 6,
        "tag": "",
        "special": "第一回合攻擊HP最低玩家"
      },
      {
        "name": "沼澤史萊姆",
        "hp": 15,
        "maxHp": 15,
        "atk": "1d4",
        "def": 2,
        "drop": 7,
        "tag": "",
        "special": "被擊中分裂成2隻小史萊姆"
      },
      {
        "name": "野狼群",
        "hp": 18,
        "maxHp": 18,
        "atk": "1d6",
        "def": 0,
        "drop": 8,
        "tag": "",
        "special": "群狼效應：每存活一隻+1傷害"
      },
      {
        "name": "腐化樹精",
        "hp": 20,
        "maxHp": 20,
        "atk": "1d8",
        "def": 3,
        "drop": 10,
        "tag": "",
        "special": "每回合補2HP；單次8+傷能阻止再生"
      }
    ],
    "boss1": [
      {
        "name": "熔岩蜘蛛皇",
        "hp": 45,
        "maxHp": 45,
        "atk": "2d6",
        "def": 4,
        "drop": 25,
        "tag": "",
        "rank": "中級Boss",
        "special": "雙數回合全體噴岩漿1d6；弱點冰×2"
      },
      {
        "name": "石化蛇女妖",
        "hp": 50,
        "maxHp": 50,
        "atk": "2d8",
        "def": 5,
        "drop": 30,
        "tag": "",
        "rank": "中級Boss",
        "special": "每3回合石化凝視；鏡子可反彈，直視減骰"
      },
      {
        "name": "冰霜巨魔",
        "hp": 60,
        "maxHp": 60,
        "atk": "2d10",
        "def": 6,
        "drop": 35,
        "tag": "夜強",
        "rank": "中級Boss",
        "special": "受創30%凍結對手；火屬性雙倍且可解凍"
      },
      {
        "name": "暗影刺客領主",
        "hp": 55,
        "maxHp": 55,
        "atk": "3d6",
        "def": 7,
        "drop": 40,
        "tag": "夜強",
        "rank": "中級Boss",
        "special": "每回合25%完全迴避；摧毀玩家陷阱"
      }
    ],
    "boss2": [
      {
        "name": "時間法師阿克洛斯",
        "hp": 90,
        "maxHp": 90,
        "atk": "3d8",
        "def": 8,
        "drop": 60,
        "tag": "混沌",
        "rank": "史詩級Boss",
        "special": "每3回合全退回2格前；每5回合動兩次；弱雙人同攻"
      },
      {
        "name": "深淵召喚師維爾卡",
        "hp": 100,
        "maxHp": 100,
        "atk": "2d10",
        "def": 9,
        "drop": 75,
        "tag": "",
        "rank": "史詩級Boss",
        "special": "每2回合召怪；吸收血量；召喚物死提供+2攻擊"
      },
      {
        "name": "龍族叛將索拉克斯",
        "hp": 120,
        "maxHp": 120,
        "atk": "4d8",
        "def": 10,
        "drop": 90,
        "tag": "晝強",
        "rank": "史詩級Boss",
        "special": "每4回噴火3d6；血量高防護罩減傷；怒血攻擊兩次"
      }
    ],
    "epic": [
      {
        "name": "永恆魔神帝拉厄爾",
        "hp": 200,
        "maxHp": 200,
        "atk": "4d10",
        "def": 12,
        "drop": 150,
        "tag": "",
        "rank": "史詩級Boss",
        "special": "每回帶10點護盾；強制重骰最差；召喚初級Boss"
      },
      {
        "name": "星界蛻變體歐梅卡",
        "hp": 250,
        "maxHp": 250,
        "atk": "5d8",
        "def": 14,
        "drop": 200,
        "tag": "",
        "rank": "史詩級Boss",
        "special": "屬性切換免疫；全圖星界衝擊；自動高額回血"
      }
    ]
  },
  "finalBoss": {
    "name": "虛空之主・無名者",
    "hp": 666,
    "maxHp": 666,
    "atk": "6d12",
    "def": 15,
    "phases": [
      {
        "name": "第一階段：虛空降臨",
        "hpRange": [
          400,
          666
        ],
        "desc": "全體每回合1d6腐蝕；4回合點數歸1；前5回合無敵需要打破3個錨點"
      },
      {
        "name": "第二階段：混沌具現",
        "hpRange": [
          150,
          399
        ],
        "desc": "召喚兩隻分身(各50HP)提供減傷50%；記憶侵蝕禁道具；抽金幣補血"
      },
      {
        "name": "第三階段：終焉形態",
        "hpRange": [
          0,
          149
        ],
        "desc": "骰子強制降為D10；每2回合集火高血量5d6；殘血40%斬殺；意志檢定"
      }
    ],
    "rank": "final",
    "special": "最終Boss；先抵達者傷害+25%；最後一擊獲得$300+3VP；其他人平分$200+1VP"
  },
  "fateCards": [
    {
      "n": 1,
      "title": "上古詛咒",
      "desc": "詛咒降臨！你的最強道具失去效果，持續2回合。",
      "duration": 0,
      "type": "負面"
    },
    {
      "n": 2,
      "title": "命運眷顧",
      "desc": "命運眷顧！從商店免費抽取一件$15以下道具。",
      "duration": 0,
      "type": "正面"
    },
    {
      "n": 3,
      "title": "地裂風暴",
      "desc": "地震爆發！所有玩家往回移動D4步。",
      "duration": 0,
      "type": "全體負面"
    },
    {
      "n": 4,
      "title": "時光逆流",
      "desc": "時間逆流！你回到本回合起始位置，但獲得$15金幣。",
      "duration": 0,
      "type": "中性"
    },
    {
      "n": 5,
      "title": "黑市交易",
      "desc": "黑市商人現身！可以用$5購買任意一件道具，但有50%機率是假貨（擲D6：1–3為假貨則失效）。",
      "duration": 3,
      "type": "賭注"
    },
    {
      "n": 6,
      "title": "神明試煉",
      "desc": "神明的試煉！擲D20：擲出1–10失去一件道具，11–20獲得一件$10道具。",
      "duration": 0,
      "type": "賭注"
    },
    {
      "n": 7,
      "title": "瘟疫蔓延",
      "desc": "瘟疫蔓延！所有玩家失去$3金幣用於治療費用。",
      "duration": 0,
      "type": "全體負面"
    },
    {
      "n": 8,
      "title": "空間重疊",
      "desc": "命運之輪轉動！交換你與任意一名玩家的地圖位置。",
      "duration": 0,
      "type": "操控"
    },
    {
      "n": 9,
      "title": "古老指引",
      "desc": "古老的預言！系統向你透露前方一個隱藏事件的位置。",
      "duration": 0,
      "type": "情報"
    },
    {
      "n": 10,
      "title": "惡龍陰影",
      "desc": "惡龍的陰影籠罩！下一回合所有玩家不得使用道具。",
      "duration": 0,
      "type": "全體負面"
    },
    {
      "n": 11,
      "title": "女神之吻",
      "desc": "幸運女神的吻！你的下一次骰子投擲結果直接視為最大值。",
      "duration": 5,
      "type": "增益"
    },
    {
      "n": 12,
      "title": "友情考驗",
      "desc": "背叛者！必須將手中一件道具隨機給予另一名玩家。",
      "duration": 0,
      "type": "負面"
    },
    {
      "n": 13,
      "title": "命運抉擇",
      "desc": "命運的十字路口！選擇：前進5格但失去$10，或留在原地獲得$10。",
      "duration": 0,
      "type": "選擇"
    },
    {
      "n": 14,
      "title": "靈魂交換",
      "desc": "靈魂交換！與任意一名玩家交換手中一件道具（雙方各指定一件）。",
      "duration": 0,
      "type": "交換"
    },
    {
      "n": 15,
      "title": "天使降臨",
      "desc": "天使降臨！HP回滿（若未瀕死則改為獲得$8金幣）。",
      "duration": 0,
      "type": "正面"
    },
    {
      "n": 16,
      "title": "惡魔契約",
      "desc": "惡魔的交易！獲得$20金幣，但下次經過商店時必須強制消費（不可跳過）。",
      "duration": 0,
      "type": "中性"
    },
    {
      "n": 17,
      "title": "時光凍結",
      "desc": "時間靜止！你額外獲得一個完整回合（立即行動）。",
      "duration": 0,
      "type": "正面"
    },
    {
      "n": 18,
      "title": "命運捉弄",
      "desc": "命運的玩笑！你與左側玩家互換所有金幣。",
      "duration": 0,
      "type": "中性"
    },
    {
      "n": 19,
      "title": "詛咒解除",
      "desc": "上古詛咒解除！移除你身上所有負面狀態效果，額外前進2格。",
      "duration": 0,
      "type": "正面"
    },
    {
      "n": 20,
      "title": "神器降世",
      "desc": "神器現世！地圖上隨機出現一個限時寶箱格，所有玩家競搶（最先抵達者開啟）。",
      "duration": 0,
      "type": "全體"
    },
    {
      "n": 21,
      "title": "記憶空白",
      "desc": "記憶消除！你忘記地圖路徑，下一回合由其他玩家集體決定你的移動方向。",
      "duration": 0,
      "type": "負面"
    },
    {
      "n": 22,
      "title": "雙重禮物",
      "desc": "命運的禮物！從命運牌堆底部抽取一張，同時執行兩張效果。",
      "duration": 0,
      "type": "特殊"
    },
    {
      "n": 23,
      "title": "終局災難",
      "desc": "大災難！最靠近終點的玩家必須往回移動5格。",
      "duration": 0,
      "type": "負面"
    },
    {
      "n": 24,
      "title": "絕地反擊",
      "desc": "英雄崛起！最落後的玩家立刻前進至第二名玩家的位置。",
      "duration": 0,
      "type": "正面"
    },
    {
      "n": 25,
      "title": "眾神審判",
      "desc": "命運的審判！所有玩家投擲D6，最低者失去$10金幣。",
      "duration": 0,
      "type": "全體負面"
    },
    {
      "n": 26,
      "title": "時光加速",
      "desc": "時光加速！遊戲跳過一輪（所有玩家本輪不行動），但每人各獲得$5金幣。",
      "duration": 0,
      "type": "中性"
    },
    {
      "n": 27,
      "title": "異次元傳送",
      "desc": "神秘傳送！你被隨機傳送至地圖上任意一格。",
      "duration": 0,
      "type": "中性"
    },
    {
      "n": 28,
      "title": "同心之鎖",
      "desc": "命運的鎖鏈！你與另一名玩家被鎖定，接下來2回合必須移動相同步數。",
      "duration": 0,
      "type": "中性"
    },
    {
      "n": 29,
      "title": "終極試煉",
      "desc": "終極試煉！可選擇挑戰特殊Boss戰，勝利獲得$30金幣與一件傳說道具，+2勝利點數。",
      "duration": 0,
      "type": "挑戰"
    },
    {
      "n": 30,
      "title": "時空回溯",
      "desc": "命運重置！所有玩家回到最近一個商店格（金幣與道具保留）。",
      "duration": 0,
      "type": "全體負面"
    },
    {
      "n": 31,
      "title": "命運淬鍊",
      "desc": "你手中一個陷阱等級+1。進行D20挑戰：擲出12–20成功，1–11失敗且該陷阱消失。",
      "duration": 0,
      "type": "陷阱"
    },
    {
      "n": 32,
      "title": "命運腐蝕",
      "desc": "指定任意一名玩家手中一個陷阱等級-1。進行D20判定：10–20成功，1–9失敗且效果反彈到自己。",
      "duration": 0,
      "type": "陷阱"
    },
    {
      "n": 33,
      "title": "雙重強化",
      "desc": "你手中一個陷阱等級+2。進行D20挑戰：16–20成功，1–15失敗且陷阱直接失效消失。",
      "duration": 0,
      "type": "陷阱"
    },
    {
      "n": 34,
      "title": "詛咒之手",
      "desc": "指定任意一名玩家手中一個陷阱等級-2。進行D20挑戰：14–20成功，1–13失敗且目標反獲免費初級陷阱。",
      "duration": 0,
      "type": "陷阱"
    },
    {
      "n": 35,
      "title": "混沌之輪",
      "desc": "命運的輪盤。擲D6決定方向：1–3為+1，4–6為-1。再擲D20：8–20成功，1–7失敗且效果作用於自己。",
      "duration": 0,
      "type": "陷阱"
    },
    {
      "n": 36,
      "title": "命運平衡",
      "desc": "你的一個陷阱+1，同時另一玩家的陷阱也+1。進行D20挑戰：10–20雙方升級，1–9雙方降級。",
      "duration": 0,
      "type": "陷阱"
    },
    {
      "n": 37,
      "title": "命運烙印",
      "desc": "選擇任意一名玩家，強制讓他下一場戰鬥敵人套上【晝夜】標籤。",
      "duration": 3,
      "type": "操控"
    },
    {
      "n": 38,
      "title": "混沌之印",
      "desc": "混沌領域！地圖上所有尚未觸發的Boss格全數強制套上【混沌】標籤，持續到下一個白天回合結束。",
      "duration": 0,
      "type": "全體"
    },
    {
      "n": 39,
      "title": "黑暗覺醒",
      "desc": "擲D20：1–10自己下一場戰鬥敵人套上【夜強】；11–20選擇讓任意其他玩家的敵人套上【夜強】。",
      "duration": 0,
      "type": "操控"
    },
    {
      "n": 40,
      "title": "時代審判",
      "desc": "所有玩家下一場戰鬥的敵人同時套上【晝夜】標籤，無法迴避。",
      "duration": 0,
      "type": "全體負面"
    },
    {
      "n": 41,
      "title": "命運黑夜",
      "desc": "長夜漫漫！所有玩家本輪強制進入夜間規則，本輪結束後恢復正常循環。",
      "duration": 0,
      "type": "時間"
    },
    {
      "n": 42,
      "title": "強制黎明",
      "desc": "白晝重現！無論當前時段，強制將本輪剩餘行動全部改為白天規則進行。",
      "duration": 0,
      "type": "時間"
    },
    {
      "n": 43,
      "title": "混沌時序",
      "desc": "時間線錯亂！擲D20：1–10強制晚上；11–19強制白天；20時間凍結本輪跳過。",
      "duration": 0,
      "type": "時間"
    },
    {
      "n": 44,
      "title": "命運之箭 ★",
      "desc": "對最終Boss射出光箭。擲D12，結果即為對最終Boss造成的提前傷害點數。",
      "duration": 3,
      "type": "Boss"
    },
    {
      "n": 45,
      "title": "世界裂縫 ★",
      "desc": "對最終Boss造成30點提前傷害，但使用者失去$10金幣。",
      "duration": 5,
      "type": "Boss"
    },
    {
      "n": 46,
      "title": "先知預言 ★",
      "desc": "先知的指引。擲D20：1–10造成10點傷害；11–19造成25點傷害；20造成50點傷害並揭露Boss完整HP給使用者。",
      "duration": 4,
      "type": "Boss"
    },
    {
      "n": 47,
      "title": "命運獻祭 ★",
      "desc": "犧牲手中一件道具，依價值折算Boss提前傷：$5=10點、$8=15點、$10=22點、$15=30點、$20–$30=45點、$30–$50=65點。",
      "duration": 3,
      "type": "Boss"
    }
  ],
  "chanceCards": [
    {
      "n": 1,
      "text": "你發現了一個廢棄商人的行囊，獲得$8金幣。",
      "duration": "3回合",
      "type": "財富"
    },
    {
      "n": 2,
      "text": "順風而行！移動步數+3。",
      "duration": "即時使用",
      "type": "移動"
    },
    {
      "n": 3,
      "text": "你找到一張藏寶圖碎片，下次經過寶藏格時獎勵加倍。",
      "duration": "5回合",
      "type": "增益"
    },
    {
      "n": 4,
      "text": "臨時補給站開張！可免費從商店購買一件$5道具。",
      "duration": "3回合",
      "type": "商店"
    },
    {
      "n": 5,
      "text": "你的武器需要保養，跳過下一回合進行維修。",
      "duration": "即時觸發",
      "type": "負面"
    },
    {
      "n": 6,
      "text": "發現捷徑！直接前進至下一個商店格。",
      "duration": "即時使用",
      "type": "移動"
    },
    {
      "n": 7,
      "text": "路遇商隊，可用手中任意一件道具換取$12金幣。",
      "duration": "4回合",
      "type": "交換"
    },
    {
      "n": 8,
      "text": "狩獵成功！獲得$6金幣與一件隨機$5道具。",
      "duration": "即時觸發",
      "type": "財富"
    },
    {
      "n": 9,
      "text": "你喝了一口可疑的泉水，擲D6：1–3回復5HP，4–6中毒失去一回合。",
      "duration": "即時觸發",
      "type": "賭注"
    },
    {
      "n": 10,
      "text": "發現魔法傳送陣！選擇地圖上任意已拜訪過的格子傳送過去。",
      "duration": "即時使用",
      "type": "移動"
    },
    {
      "n": 11,
      "text": "背後偷襲！對右側玩家造成攻擊，他失去$5金幣。",
      "duration": "即時使用",
      "type": "攻擊"
    },
    {
      "n": 12,
      "text": "同伴相助！你可以讓任意一位玩家免費移動3格。",
      "duration": "即時使用",
      "type": "輔助"
    },
    {
      "n": 13,
      "text": "市場情報！查看任意一名玩家的道具欄內容。",
      "duration": "即時使用",
      "type": "情報"
    },
    {
      "n": 14,
      "text": "你拾獲一封神秘信件，下次遇到NPC格時額外獲得一個任務選項。",
      "duration": "5回合",
      "type": "增益"
    },
    {
      "n": 15,
      "text": "天降好運！擲D4，結果×2即為獲得的金幣數。",
      "duration": "即時觸發",
      "type": "財富"
    },
    {
      "n": 16,
      "text": "你發現了一個古老的武器架，可以免費強化手中一件武器道具一級。",
      "duration": "4回合",
      "type": "強化"
    },
    {
      "n": 17,
      "text": "迷路了！擲D6，往回移動該數字步數。",
      "duration": "即時觸發",
      "type": "負面"
    },
    {
      "n": 18,
      "text": "你說服了一個流浪傭兵同行，下一場戰鬥傷害+2。",
      "duration": "5回合",
      "type": "增益"
    },
    {
      "n": 19,
      "text": "大風吹走了你的地圖，下一回合移動步數減半。",
      "duration": "即時觸發",
      "type": "負面"
    },
    {
      "n": 20,
      "text": "你找到一個遺失的錢包，獲得$10金幣。",
      "duration": "即時觸發",
      "type": "財富"
    },
    {
      "n": 21,
      "text": "廉價拍賣會！可以用半價購買商店中任意一件$10以下道具。",
      "duration": "3回合",
      "type": "商店"
    },
    {
      "n": 22,
      "text": "你借到一匹快馬，本回合可再擲一次骰子追加移動。",
      "duration": "即時使用",
      "type": "移動"
    },
    {
      "n": 23,
      "text": "同行的旅人分享了乾糧，所有玩家各回復3HP。",
      "duration": "即時觸發",
      "type": "全體"
    },
    {
      "n": 24,
      "text": "你識破了一個騙局，阻止下一張對你使用的命運牌效果。",
      "duration": "5回合",
      "type": "防禦"
    },
    {
      "n": 25,
      "text": "神秘的行商出現！可花$5購買一件隨機道具（由GM決定）。",
      "duration": "3回合",
      "type": "商店"
    },
    {
      "n": 26,
      "text": "你在廢墟中找到一個魔法符文，可附加於任意一件道具上。",
      "duration": "4回合",
      "type": "強化"
    },
    {
      "n": 27,
      "text": "競速挑戰！與任意一名玩家比擲D20，勝者獲得敗者$8金幣。",
      "duration": "即時使用",
      "type": "賭注"
    },
    {
      "n": 28,
      "text": "你發現了一個隱藏格子，立刻移動至地圖上最近的寶藏格。",
      "duration": "即時使用",
      "type": "移動"
    },
    {
      "n": 29,
      "text": "道具升級！將手中一件$5道具免費升級為$8同類道具。",
      "duration": "4回合",
      "type": "強化"
    },
    {
      "n": 30,
      "text": "英雄時刻！本回合所有骰子投擲結果+2。",
      "duration": "即時使用",
      "type": "增益"
    },
    {
      "n": 31,
      "text": "【影子絲線陷阱】一種無法在商店購買的古老陷阱。踩中者無法察覺，下下回合才顯現——失去最貴的一件道具，支付設置者$40。",
      "duration": "5回合",
      "type": "陷阱"
    },
    {
      "n": 32,
      "text": "【命運封印陣陷阱】踩中者下一張抽到的卡片效果無效化，金幣轉移給設置者$20。",
      "duration": "4回合",
      "type": "陷阱"
    },
    {
      "n": 33,
      "text": "【逆流時沙陷阱】踩中者必須回到他上上回合的位置，支付設置者$30。",
      "duration": "5回合",
      "type": "陷阱"
    },
    {
      "n": 34,
      "text": "【幽靈鎖鏈陷阱】踩中者與設置者被鎖定3回合，每回合踩中者支付設置者$10，共$30。",
      "duration": "5回合",
      "type": "陷阱"
    },
    {
      "n": 35,
      "text": "【神明之眼印記陷阱】踩中者的所有行動在接下來2回合內對所有玩家完全透明，支付設置者$25。",
      "duration": "4回合",
      "type": "陷阱"
    },
    {
      "n": 36,
      "text": "命令的烙印。選擇地圖上任意一個尚未觸發的Boss格或戰鬥格，強制套上【混沌】標籤。",
      "duration": "4回合",
      "type": "操控"
    },
    {
      "n": 37,
      "text": "黎明的詛咒。選擇任意一名玩家，他下一場戰鬥敵人強制套上【晝強】標籤。",
      "duration": "3回合",
      "type": "攻擊"
    },
    {
      "n": 38,
      "text": "暗夜獵手。對自己下一場戰鬥的敵人套上【夜強】標籤，擊敗後獎勵金幣×1.5。",
      "duration": "4回合",
      "type": "增益"
    },
    {
      "n": 39,
      "text": "日蝕之令。強制將當前白天回合變更為晚上，本輪結束後自動恢復。",
      "duration": "即時使用",
      "type": "時間"
    },
    {
      "n": 40,
      "text": "黎明強制令。若當前為晚上，強制提前結束夜晚，立刻進入白天。",
      "duration": "即時使用",
      "type": "時間"
    },
    {
      "n": 41,
      "text": "時光錯亂。擲D6：1–3強制變更為晚上，4–6強制變更為白天。",
      "duration": "即時觸發",
      "type": "時間"
    },
    {
      "n": 42,
      "text": "先鋒斥候的回報 ★。對最終Boss造成15點提前傷害，並揭露Boss目前階段給所有玩家。",
      "duration": "3回合",
      "type": "Boss"
    },
    {
      "n": 43,
      "text": "英雄的遠征 ★。擲D20：1–5無效；6–15造成Boss 20點傷害；16–20造成35點傷害。",
      "duration": "4回合",
      "type": "Boss"
    },
    {
      "n": 44,
      "text": "古代封印的碎裂 ★。對最終Boss造成25點固定提前傷害，無需擲骰。",
      "duration": "5回合",
      "type": "Boss"
    },
    {
      "n": 45,
      "text": "聯合突擊 ★。所有玩家同意後，每位參與玩家各擲D6，總和即為對最終Boss的提前傷害。",
      "duration": "3回合",
      "type": "Boss"
    },
    {
      "n": 46,
      "text": "神秘商人的拜訪 ★。召喚神秘商人，每個價格層級各隨機陳列5件商品，移動前使用。",
      "duration": "4回合",
      "type": "商店"
    },
    {
      "n": 47,
      "text": "神燈精靈的恩賜 ★。召喚神燈精靈，每個層級各5件商品，本次購買一件享有八折優惠，移動前使用。",
      "duration": "3回合",
      "type": "商店"
    }
  ],
  "statusEffects": {
    "poison": {
      "label": "中毒",
      "type": "poison",
      "desc": "每回合失去2HP"
    },
    "frozen": {
      "label": "冰凍",
      "type": "frozen",
      "desc": "跳過下一回合"
    },
    "dying": {
      "label": "瀕死",
      "type": "dying",
      "desc": "每回合失去5%最大HP"
    },
    "skip": {
      "label": "跳回合",
      "type": "skip",
      "desc": "本回合無法行動"
    }
  },
  "dayNightRules": {
    "夜強": {
      "nightBonus": 1.5,
      "dayBonus": 1.0
    },
    "晝強": {
      "nightBonus": 1.0,
      "dayBonus": 1.5
    },
    "混沌": {
      "nightBonus": 1.25,
      "dayBonus": 1.25
    }
  },
  "board": [
    {
      "r": 0,
      "c": 0,
      "type": "start",
      "label": "起點"
    },
    {
      "r": 0,
      "c": 1,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 0,
      "c": 2,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 0,
      "c": 3,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 0,
      "c": 4,
      "type": "chest",
      "label": "寶箱"
    },
    {
      "r": 0,
      "c": 5,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 0,
      "c": 6,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 0,
      "c": 7,
      "type": "shop",
      "label": "商店"
    },
    {
      "r": 1,
      "c": 7,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 2,
      "c": 7,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 3,
      "c": 7,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 4,
      "c": 7,
      "type": "synthesis",
      "label": "合成台"
    },
    {
      "r": 5,
      "c": 7,
      "type": "chest",
      "label": "寶箱"
    },
    {
      "r": 6,
      "c": 7,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 7,
      "c": 7,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 7,
      "c": 6,
      "type": "shop",
      "label": "商店"
    },
    {
      "r": 7,
      "c": 5,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 7,
      "c": 4,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 7,
      "c": 3,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 7,
      "c": 2,
      "type": "synthesis",
      "label": "合成台"
    },
    {
      "r": 7,
      "c": 1,
      "type": "chest",
      "label": "寶箱"
    },
    {
      "r": 7,
      "c": 0,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 6,
      "c": 0,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 5,
      "c": 0,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 4,
      "c": 0,
      "type": "shop",
      "label": "商店"
    },
    {
      "r": 3,
      "c": 0,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 2,
      "c": 0,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 1,
      "c": 0,
      "type": "synthesis",
      "label": "合成台"
    },
    {
      "r": 1,
      "c": 1,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 1,
      "c": 2,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 1,
      "c": 3,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 1,
      "c": 4,
      "type": "chest",
      "label": "寶箱"
    },
    {
      "r": 1,
      "c": 5,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 1,
      "c": 6,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 2,
      "c": 6,
      "type": "shop",
      "label": "商店"
    },
    {
      "r": 3,
      "c": 6,
      "type": "synthesis",
      "label": "合成台"
    },
    {
      "r": 4,
      "c": 6,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 5,
      "c": 6,
      "type": "chest",
      "label": "寶箱"
    },
    {
      "r": 6,
      "c": 6,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 6,
      "c": 5,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 6,
      "c": 4,
      "type": "shop",
      "label": "商店"
    },
    {
      "r": 6,
      "c": 3,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 6,
      "c": 2,
      "type": "synthesis",
      "label": "合成台"
    },
    {
      "r": 6,
      "c": 1,
      "type": "chest",
      "label": "寶箱"
    },
    {
      "r": 5,
      "c": 1,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 4,
      "c": 1,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 3,
      "c": 1,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 2,
      "c": 1,
      "type": "synthesis",
      "label": "合成台"
    },
    {
      "r": 2,
      "c": 2,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 2,
      "c": 3,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 2,
      "c": 4,
      "type": "chest",
      "label": "寶箱"
    },
    {
      "r": 2,
      "c": 5,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 3,
      "c": 5,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 4,
      "c": 5,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 5,
      "c": 5,
      "type": "synthesis",
      "label": "合成台"
    },
    {
      "r": 5,
      "c": 4,
      "type": "shop",
      "label": "商店"
    },
    {
      "r": 5,
      "c": 3,
      "type": "chest",
      "label": "寶箱"
    },
    {
      "r": 5,
      "c": 2,
      "type": "normal",
      "label": "荒野"
    },
    {
      "r": 4,
      "c": 2,
      "type": "battle",
      "label": "戰鬥"
    },
    {
      "r": 3,
      "c": 2,
      "type": "fate",
      "label": "命運"
    },
    {
      "r": 3,
      "c": 3,
      "type": "boss",
      "label": "最終BOSS"
    }
  ],
  "playerColors": [
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#f59e0b"
  ],
  "tileIcons": {
    "start": "fa-flag-checkered",
    "normal": "fa-tree",
    "battle": "fa-hand-fist",
    "chest": "fa-box-open",
    "shop": "fa-store",
    "synthesis": "fa-hammer",
    "boss": "fa-dragon",
    "fate": "fa-question",
    "chance": "fa-exclamation",
    "teleport": "fa-door-open",
    "craft": "fa-hammer",
    "oracle": "fa-eye",
    "spring": "fa-tint",
    "anchor": "fa-link"
  },
  "logIcons": {
    "system": "fa-server",
    "combat": "fa-hand-fist",
    "move": "fa-shoe-prints",
    "trap": "fa-bomb",
    "trap-log": "fa-bomb",
    "shop": "fa-store",
    "craft": "fa-anvil",
    "treasure": "fa-box-open",
    "card": "fa-clone",
    "combat-log": "fa-hand-fist",
    "roll-log": "fa-dice",
    "craft-log": "fa-anvil"
  },
  "diceSides": [
    4,
    6,
    8,
    10,
    12,
    20
  ]
};
