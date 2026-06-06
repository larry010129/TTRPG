/* ==========================================================================
   TTRPG Game Engine — Lord of the Void Complete Implementation
   Runs entirely in the browser (no server)
   ========================================================================== */

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

function isConsumableEffect(effect) {
    return effect === "detect" || effect === "revive" || effect === "trap" ||
        (effect && effect.startsWith("heal")) || effect === "eclipse" || effect === "dawn" ||
        effect === "stone_curse" || effect === "stone_awake" || effect === "stone_day" ||
        effect === "stone_night" || effect === "stone_chaos" || effect === "clear_tags" ||
        effect === "boss_dmg_20" || effect === "boss_dmg_40" || effect === "boss_sacrifice" ||
        effect === "fireball" || effect === "poison_oil";
}

function calcHealAmount(effect, engine, player) {
    if (effect === "heal_1") return 1;
    if (effect === "heal_5") return 5;
    if (effect === "heal_8") return 8;
    if (effect === "heal_15") return 15;
    if (effect === "heal_2d4p2") return engine.rollDice("2d4", true) + 2;
    if (effect === "heal_4d4p4") return engine.rollDice("4d4", true) + 4;
    if (effect === "heal_8d4p8") return engine.rollDice("8d4", true) + 8;
    if (effect === "heal_pct10") return Math.max(1, Math.floor(player.maxHp * 0.1));
    return 0;
}

class TTRPGEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.players = [];
        this.activePlayerIndex = 0;
        this.turnCount = 1;
        this.traps = []; 
        this.boss = this._defaultBoss();
        this.turnState = "setup"; 
        this.activeCombat = null; 
        this.activeFate = null; 
        this.logMessages = [];
        this.gmMode = false;
        this.currentOccupiedTrapTile = null;
        this.day = 1;
        this.isDay = true;
        this.roundInDay = 0;
        
        // Expanded spec properties
        this.board = [];
        this.mapSettings = null;
        this.deathShopItems = [];
        this.activeAuction = null;
        this.mysteriousShopActive = false;
        this.teleportBet = null; // { dice, guess }
        this.activeChoice = null; // for cards choices
        this.currentShop = null; // { sl, items, specialType, freePicksRemaining, turn, tileIndex }
    }

    _defaultBoss() {
        return {
            name: "虛空之主・無名者",
            hp: 666,
            maxHp: 666,
            atk: "6d12",
            def: 15,
            phases: [
                { name: "第一階段：虛空降臨", hpRange: [400, 666] },
                { name: "第二階段：混沌具現", hpRange: [150, 399] },
                { name: "第三階段：終焉形態", hpRange: [0, 149] }
            ],
            dealtDamagePlayers: [],
            anchorsDestroyed: 0,
            roundsImmuneRemaining: 5,
            clones: []
        };
    }

    addLog(text, logType = "system") {
        this.logMessages.push({ text, type: logType, turn: this.turnCount });
    }

    get_state_dict() {
        return this.getStateDict();
    }

    startGame(playersConfig, mapSettings = null) {
        this.mapSettings = mapSettings || {
            version: "standard",
            difficulty: "normal",
            terrains: ["森林", "沼澤", "雪山", "火山"],
            endType: "castle"
        };
        
        const version = this.mapSettings.version || "standard";
        const difficulty = this.mapSettings.difficulty || "normal";
        const totalCells = (version === "standard") ? 90 : 120;
        
        // 1. Generate path grid coordinate Winding serpent trail (10 columns)
        const board = [];
        for (let i = 0; i < totalCells; i++) {
            const r = Math.floor(i / 10);
            const c = (r % 2 === 0) ? (i % 10) : (9 - (i % 10));
            board.push({ r, c, type: "normal", label: "", idx: i });
        }
        
        // Dynamic counts based on difficulty
        let battleCount = (version === "standard") ? 18 : 26;
        let chanceCount = (version === "standard") ? 11 : 14;
        let fateCount = (version === "standard") ? 11 : 14;
        let shopCount = (version === "standard") ? 8 : 12;
        let chestCount = (version === "standard") ? 6 : 8;
        let teleportCount = (version === "standard") ? 3 : 5;
        let synthesisCount = (version === "standard") ? 3 : 3;
        let oracleCount = (version === "standard") ? 2 : 2;
        let springCount = (version === "standard") ? 1 : 1;
        let normalCount = 0;
        
        if (difficulty === "easy") {
            battleCount = Math.max(5, battleCount - 5);
            chestCount += 2;
            teleportCount += 1;
        } else if (difficulty === "hard") {
            battleCount += 6;
            chestCount = Math.max(1, chestCount - 3);
        }
        
        // Remainder goes to normal cells to guarantee exactly totalCells - 2 elements
        normalCount = (totalCells - 2) - (battleCount + chanceCount + fateCount + shopCount + chestCount + teleportCount + synthesisCount + oracleCount + springCount);
        if (normalCount < 0) normalCount = 0;

        let types = [
            ...Array(normalCount).fill("normal"),
            ...Array(battleCount).fill("battle"),
            ...Array(chanceCount).fill("chance"),
            ...Array(fateCount).fill("fate"),
            ...Array(shopCount).fill("shop"),
            ...Array(chestCount).fill("chest"),
            ...Array(teleportCount).fill("teleport"),
            ...Array(synthesisCount).fill("synthesis"),
            ...Array(oracleCount).fill("oracle"),
            ...Array(springCount).fill("spring")
        ];
        
        // Shuffle types
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        
        // Assign types & labels to board
        board[0].type = "start";
        board[0].label = "起點";
        board[0].terrain = "新手村周邊";
        board[totalCells - 1].type = "boss";
        board[totalCells - 1].label = "最終BOSS";
        board[totalCells - 1].terrain = "最終要塞";
        
        // Dynamic intermediate terrains mapping
        const selected = (this.mapSettings.terrains && this.mapSettings.terrains.length > 0)
            ? this.mapSettings.terrains
            : ["森林", "沼澤", "雪山", "火山"];
        
        const intermediateTerrains = [];
        for (let j = 0; j < 4; j++) {
            intermediateTerrains.push(selected[j % selected.length]);
        }

        let teleCount = 0;
        for (let i = 1; i < totalCells - 1; i++) {
            const t = types[i - 1];
            board[i].type = t;
            
            let terrain = "新手村周邊";
            if (i >= 5 * (totalCells / 6)) terrain = "最終要塞";
            else if (i >= 4 * (totalCells / 6)) terrain = intermediateTerrains[3];
            else if (i >= 3 * (totalCells / 6)) terrain = intermediateTerrains[2];
            else if (i >= 2 * (totalCells / 6)) terrain = intermediateTerrains[1];
            else if (i >= 1 * (totalCells / 6)) terrain = intermediateTerrains[0];
            
            board[i].terrain = terrain;
            
            let label = "荒野";
            if (t === "battle") label = terrain + "戰鬥";
            else if (t === "chance") label = "機會";
            else if (t === "fate") label = "命運";
            else if (t === "shop") label = terrain + "商店";
            else if (t === "chest") label = terrain + "寶箱";
            else if (t === "teleport") {
                teleCount++;
                label = "傳送點" + teleCount;
                let dist = 10;
                if (teleCount % 2 === 1) dist = 12 + teleCount * 3;
                else dist = -(8 + teleCount * 2);
                board[i].teleportDist = dist;
            }
            else if (t === "synthesis") label = "合成台";
            else if (t === "oracle") label = "先知格";
            else if (t === "spring") label = "魔力泉";
            
            board[i].label = label;
        }
        
        // Inject 3 Void Anchor tiles in the "最終要塞" terrain before the final boss
        const fortressStart = Math.floor(5 * (totalCells / 6));
        const fortressEnd = totalCells - 2;
        const anchorIndices = [];
        let attempts = 0;
        while (anchorIndices.length < 3 && attempts < 100) {
            attempts++;
            const idx = Math.floor(Math.random() * (fortressEnd - fortressStart + 1)) + fortressStart;
            if (!anchorIndices.includes(idx)) {
                anchorIndices.push(idx);
            }
        }
        if (anchorIndices.length < 3) {
            anchorIndices.push(totalCells - 4, totalCells - 3, totalCells - 2);
        }
        anchorIndices.forEach(idx => {
            board[idx].type = "anchor";
            board[idx].label = "虛空錨點";
        });

        this.board = board;
        
        // Initialize players
        const classDb = GAME_CONFIG.classes;
        this.players = playersConfig.map((config, i) => {
            let className = config.class || "戰士";
            if (!classDb[className]) className = "戰士";
            const pClass = classDb[className];
            return {
                id: i + 1,
                name: config.name || `冒險者 ${i + 1}`,
                color: config.color || GAME_CONFIG.playerColors[i],
                class: className,
                isAI: config.isAI || false,
                hp: pClass.maxHp,
                maxHp: pClass.maxHp,
                mp: pClass.maxMp || 0,
                maxMp: pClass.maxMp || 0,
                atk: pClass.atk,
                def: pClass.def,
                spd: pClass.spd,
                coins: 20,
                victoryPoints: 0,
                inventory: [],
                materials: Object.fromEntries(Object.keys(GAME_CONFIG.materials).map(m => [m, 0])),
                position: 0,
                isDead: false,
                isDying: false,
                reviveFailCount: 0,
                activeTrapsCount: 0,
                damageBuff: false,
                heldCards: [],
                skillsCooldowns: {},
                // Skill / stance statuses
                defenseStance: false,
                magicBurst: false,
                aiming: false,
                doubleShot: false,
                doubleBarrel: false,
                pierceCharge: false,
                phoenixTriggered: false,
                bagExpiryTurns: 0,
                hasInfiniteBag: false,
                bleedingStopped: false,
                reviveThresholdModifier: 0
            };
        });

        this.activePlayerIndex = 0;
        this.turnCount = 1;
        this.day = 1;
        this.isDay = true;
        this.roundInDay = 1;
        this.traps = [];
        this.boss = this._defaultBoss();
        this.turnState = "roll";
        this.activeCombat = null;
        this.activeFate = null;
        this.logMessages = [];
        this.deathShopItems = [];
        this.activeAuction = null;
        this.mysteriousShopActive = false;
        this.teleportBet = null;
        this.activeChoice = null;
        
        this.addLog(`冒險開始！輪到 ${this.getActivePlayer().name} 的回合。請擲骰移動！`, "system");
        return this.getStateDict();
    }

    getActivePlayer() {
        return this.players[this.activePlayerIndex];
    }

    rollMove() {
        if (this.turnState !== "roll") return { error: "狀態錯誤，無法移動" };

        const activePlayer = this.getActivePlayer();
        
        // If dying, cannot move. Must do revival roll.
        if (activePlayer.isDying) {
            return { error: "處於瀕死狀態，請點擊進行復活判定！" };
        }

        let steps = randInt(1, 6);
        
        // Check cards / items modifiers
        if (activePlayer.tempMoveBonus) {
            steps += activePlayer.tempMoveBonus;
            activePlayer.tempMoveBonus = 0;
        }
        if (activePlayer.tempMoveHalf) {
            steps = Math.max(1, Math.floor(steps / 2));
            activePlayer.tempMoveHalf = false;
        }

        const startPos = activePlayer.position;
        let newPos = startPos + steps;

        if (newPos >= this.board.length - 1) {
            newPos = this.board.length - 1;
        }

        activePlayer.position = newPos;
        this.addLog(
            `${activePlayer.name} 擲出了 D6 = ${steps}，移動至第 ${newPos} 格。【${this.board[newPos].label}】`,
            "roll-log"
        );

        // Check Trap triggers
        const trapIndex = this.traps.findIndex(
            t => t.tileIndex === newPos && t.ownerIndex !== this.activePlayerIndex
        );

        if (trapIndex !== -1) {
            this.triggerTrap(trapIndex);
        } else {
            this.resolveTileAction(newPos);
        }

        return this.getStateDict();
    }

    triggerTrap(trapIndex) {
        const activePlayer = this.getActivePlayer();
        const trap = this.traps[trapIndex];
        const owner = this.players[trap.ownerIndex];

        this.addLog(`【陷阱觸發】${activePlayer.name} 踩中了 ${owner.name} 的 ${trap.type}！`, "trap-log");
        
        // Calculate trap damage & gold transfer
        activePlayer.hp -= trap.damage;
        this.addLog(`${activePlayer.name} 扣除 ${trap.damage} HP (剩餘 HP: ${activePlayer.hp})。`, "trap-log");

        const coinsToPay = Math.min(activePlayer.coins, trap.goldTransfer);
        activePlayer.coins -= coinsToPay;
        owner.coins += coinsToPay;
        this.addLog(`${activePlayer.name} 支付 $${coinsToPay} 給 ${owner.name}。`, "trap-log");

        owner.victoryPoints += 1;
        this.addLog(`${owner.name} 成功觸發陷阱，獲得 +1 勝利點數！`, "trap-log");

        // Special trap effects
        if (trap.type === "響鈴絆線") {
            activePlayer.skipTurns = 1;
            this.addLog(`${activePlayer.name} 暴露了行蹤，下回合將跳過行動。`, "trap-log");
        } else if (trap.type === "黏液陷阱") {
            activePlayer.tempMoveHalf = true;
            this.addLog(`${activePlayer.name} 黏液纏身，下回合移動步數減半。`, "trap-log");
        } else if (trap.type === "靈魂枷鎖") {
            activePlayer.lockItemsTurns = 3;
            this.addLog(`${activePlayer.name} 靈魂被枷鎖束縛，3 回合內無法使用任何道具。`, "trap-log");
        } else if (trap.type === "詛詛鏡像" || trap.type === "詛咒鏡像") {
            activePlayer.mirrorDiceTurns = 2;
            this.addLog(`${activePlayer.name} 受到鏡像詛咒，接下來 2 回合所有擲骰結果將會顛倒！`, "trap-log");
        } else if (trap.type === "時間冰封陣") {
            activePlayer.skipTurns = 2;
            this.addLog(`${activePlayer.name} 被冰封，連續 2 回合無法行動！`, "trap-log");
        } else if (trap.type === "靈魂置換咒") {
            // Swap positions and items
            const oldPos = activePlayer.position;
            activePlayer.position = owner.position;
            owner.position = oldPos;
            
            const oldInv = [...activePlayer.inventory];
            activePlayer.inventory = [...owner.inventory];
            owner.inventory = oldInv;
            this.addLog(`🔄 ${activePlayer.name} 與 ${owner.name} 強制交換了地圖位置與所有道具！`, "trap-log");
        }

        this.traps.splice(trapIndex, 1);
        owner.activeTrapsCount = Math.max(0, owner.activeTrapsCount - 1);

        if (activePlayer.hp <= 0) {
            this.handlePlayerDeath();
        } else {
            this.turnState = "action";
        }
    }

    rollDice(diceStr, isPlayerRoll = false) {
        const parts = String(diceStr).toLowerCase().split("d");
        if (parts.length !== 2) return 0;
        const count = parseInt(parts[0], 10);
        let sides = parseInt(parts[1], 10);
        if (isNaN(count) || isNaN(sides)) return 0;
        
        const p = this.getActivePlayer();
        if (isPlayerRoll && p && p.fateDeletedTurns > 0) {
            return count; // force each die to be 1
        }
        
        if (isPlayerRoll && this.boss && this.boss.hp < 150 && sides > 10) {
            sides = 10;
        }
        
        let total = 0;
        for (let i = 0; i < count; i++) {
            let roll = randInt(1, sides);
            // Check if player has mirror dice effect
            if (p && p.mirrorDiceTurns > 0 && sides === 6) {
                roll = 7 - roll; // inverse D6
            }
            total += roll;
        }
        return total;
    }

    resolveTileAction(tileIndex) {
        const activePlayer = this.getActivePlayer();
        const tile = this.board[tileIndex];

        switch (tile.type) {
            case "start":
                activePlayer.coins += 5;
                this.addLog(`安全區：${activePlayer.name} 回到起點，獲得 $5 金幣。`, "system");
                this.turnState = "action";
                break;
            case "normal":
                this.currentOccupiedTrapTile = tileIndex;
                this.turnState = "action";
                break;
            case "battle": {
                // Determine monster tier by region
                let pool, rank;
                if (tile.terrain === "最終要塞") {
                    pool = GAME_CONFIG.enemies.boss2 || [];
                    rank = "史詩級怪物";
                } else if (tile.terrain === "火山" || tile.terrain === "雪山") {
                    pool = GAME_CONFIG.enemies.boss2 || [];
                    rank = "高級怪物";
                } else if (tile.terrain === "沼澤" || tile.terrain === "森林") {
                    pool = GAME_CONFIG.enemies.boss1 || [];
                    rank = "中級怪物";
                } else {
                    pool = GAME_CONFIG.enemies.basic || [];
                    rank = "初級怪物";
                }
                
                const template = choice(pool);
                this.setupCombat(template, rank);
                break;
            }
            case "chest":
                this.resolveChestEncounter();
                this.turnState = "action";
                break;
            case "shop":
                this.addLog(`來到${tile.terrain}商店！可以進行交易。`, "system");
                this.turnState = "action";
                break;
            case "synthesis":
                this.addLog("來到合成台格子！可使用初級合成台。", "system");
                this.turnState = "action";
                break;
            case "fate":
                this.resolveFateDraw();
                break;
            case "chance":
                this.resolveChanceDraw();
                break;
            case "boss":
                this.resolveBossEncounter();
                break;
            case "teleport":
                this.addLog("踏入傳送點！準備進行傳送判定。您可以選擇開啟傳送賭注！", "system");
                this.turnState = "teleport";
                break;
            case "oracle":
                // Oracle: +10-$25 gold
                const gold = randInt(10, 25);
                activePlayer.coins += gold;
                this.addLog(`🔮 踩上先知之格！完成遠征任務，獲得 $${gold} 金幣！`, "system");
                this.turnState = "action";
                break;
            case "spring":
                // Spring: recovers magic
                if (activePlayer.maxMp > 0) {
                    const mpRestore = activePlayer.class === "白魔法師" ? 8 : 6;
                    activePlayer.mp = Math.min(activePlayer.maxMp, activePlayer.mp + mpRestore);
                    this.addLog(`💧 踏入魔力泉！法師魔力充能恢復了 ${mpRestore} 點！`, "system");
                } else {
                    this.addLog("💧 踏入魔力泉！但您不是魔法職業，沒有任何效果。", "system");
                }
                this.turnState = "action";
                break;
            case "anchor":
                this.currentOccupiedTrapTile = tileIndex;
                if (!tile.destroyed) {
                    tile.destroyed = true;
                    tile.label = "已摧毀的錨點";
                    this.boss.anchorsDestroyed = (this.boss.anchorsDestroyed || 0) + 1;
                    this.addLog(`⚡ 【虛空錨點】${activePlayer.name} 踏上了虛空錨點，成功將其摧毀！ (目前已摧毀: ${this.boss.anchorsDestroyed}/3)`, "system");
                    if (this.boss.anchorsDestroyed >= 3) {
                        this.boss.roundsImmuneRemaining = 0;
                        this.addLog(`💥 虛空錨點全部被摧毀！虛空之主的傷害免疫屏障完全碎裂了！`, "system");
                    }
                } else {
                    this.addLog(`${activePlayer.name} 經過了已被摧毀的虛空錨點。`, "system");
                }
                this.turnState = "action";
                break;
        }
    }

    setupCombat(template, rank) {
        const monsters = [];
        
        if (template.name === "野狼群") {
            // wolves contain 3 distinct units
            monsters.push(
                { name: "野狼 A", hp: 6, maxHp: 6, atk: "1d6", def: 0 },
                { name: "野狼 B", hp: 6, maxHp: 6, atk: "1d6", def: 0 },
                { name: "野狼 C", hp: 6, maxHp: 6, atk: "1d6", def: 0 }
            );
        } else {
            monsters.push({
                name: template.name,
                hp: template.hp,
                maxHp: template.maxHp,
                atk: template.atk,
                def: template.def,
                tag: template.tag || "",
                special: template.special || "",
                rank: rank,
                drop: template.drop || (rank === "高級怪物" ? 15 : (rank === "中級怪物" ? 10 : 5))
            });
        }

        this.activeCombat = {
            monsters: monsters,
            monsterTemplate: template,
            rank: rank,
            combat_logs: [`戰鬥開始！${this.getActivePlayer().name} 面對 ${template.name}。`],
            combatRound: 1,
            invitedAllies: [] // list of { playerIndex, actionType, rollVal }
        };
        this.turnState = "combat";
        this.addLog(`【遭遇戰鬥】面對 ${template.name} (${rank})！`, "combat-log");
        
        // Assassin First Round Passive
        const p = this.getActivePlayer();
        if (p.class === "刺客") {
            this.activeCombat.combat_logs.push(`🗡️ 刺客特性觸發！「暗殺」將在首回合造成 1.5 倍傷害，並享有先攻優勢。`);
        }
    }

    resolveChestEncounter() {
        const activePlayer = this.getActivePlayer();
        const chestRoll = randInt(1, 6); // D6 as spec §1.7
        
        const lowMats = Object.keys(MATERIALS).filter(k => MATERIALS[k].grade === "low");
        const midMats = Object.keys(MATERIALS).filter(k => MATERIALS[k].grade === "mid");
        const highMats = Object.keys(MATERIALS).filter(k => MATERIALS[k].grade === "high");

        let chestName = "低等寶箱";
        let gold = randInt(5, 15);
        let rewardMats = [];
        let rewardItem = null;

        if (chestRoll <= 2) {
            // Low chest
            chestName = "低等寶箱";
            rewardMats.push(choice(lowMats));
            // Small chance of cursed item
            if (Math.random() < 0.25) {
                rewardItem = { name: "【詛咒】普通火把", desc: "這是一個被詛咒的火把", effect: "passive", cursed: true };
            }
        } else if (chestRoll <= 4) {
            // Mid chest
            chestName = "中等寶箱";
            gold = randInt(15, 30);
            rewardMats.push(choice(midMats));
            if (Math.random() < 0.4) {
                // Random item
                const allItems = [];
                Object.values(SHOP_ITEMS_BY_TIER).forEach(arr => allItems.push(...arr));
                const it = choice(allItems);
                rewardItem = { name: it.name, desc: it.effect, effect: it.effectKey };
            }
        } else {
            // High chest
            chestName = "高等寶箱";
            gold = randInt(30, 60);
            rewardMats.push(choice(highMats));
            // Guaranteed item / Awakened item
            const awakeningStoneItems = ["初級治癒藥水", "中級治癒藥水", "皮革臂甲", "守護者護甲", "力量指環", "月影長劍"];
            const baseItemName = choice(awakeningStoneItems);
            const it = this._findShopItem(baseItemName);
            rewardItem = { name: "【覺醒】" + it.name, desc: "[覺醒效果] " + it.effect, effect: it.effectKey, awakened: true };
        }

        activePlayer.coins += gold;
        rewardMats.forEach(m => activePlayer.materials[m] = (activePlayer.materials[m] || 0) + 1);
        if (rewardItem) {
            activePlayer.inventory.push(rewardItem);
        }

        this.addLog(`【開箱】D6 擲出 ${chestRoll}！打開了【${chestName}】，獲得 $${gold} 金幣，素材：${rewardMats.join(", ")} ${rewardItem ? "，以及道具：" + rewardItem.name : ""}。`, "treasure");
    }

    _findShopItem(name) {
        for (const items of Object.values(SHOP_ITEMS_BY_TIER)) {
            const found = items.find(it => it.name === name);
            if (found) return found;
        }
        return { name: "草藥包", price: 5, effectKey: "heal_1" };
    }

    resolveFateDraw() {
        const activePlayer = this.getActivePlayer();
        // Read fate cards from configuration
        const card = choice(GAME_CONFIG.fateCards);
        this.activeFate = {
            card,
            has_challenge: ["trap_upgrade", "trap_downgrade", "ultimate_trial", "混沌之輪", "命運平衡"].includes(card.title) || card.desc.includes("D20"),
            challenge_rolled: false,
            challenge_success: false,
            result_msg: ""
        };
        this.turnState = "fate";
        this.addLog(`【抽取命運】${activePlayer.name} 抽取了命運卡【${card.title}】`, "card");
    }

    resolveChanceDraw() {
        const activePlayer = this.getActivePlayer();
        const card = choice(GAME_CONFIG.chanceCards);
        this.activeFate = {
            card,
            isChance: true,
            has_challenge: card.text.includes("D20") || card.text.includes("D6"),
            challenge_rolled: false,
            challenge_success: false,
            result_msg: ""
        };
        this.turnState = "fate";
        this.addLog(`【抽取機會】${activePlayer.name} 抽取了機會卡【No.${card.n}】`, "card");
    }

    resolveBossEncounter() {
        const activePlayer = this.getActivePlayer();
        
        // Final Boss logic
        const isFirst = !this.players.some(p => p.damageBuff);
        if (isFirst) {
            activePlayer.damageBuff = true;
            activePlayer.victoryPoints += 3;
            this.addLog(`👑 ${activePlayer.name} 首位抵達最終 BOSS 巢穴！對 BOSS 的全面傷害提升 (+25%)，並獲得 +3 勝利點數！`, "system");
        }

        const monsters = [{
            name: this.boss.name,
            hp: this.boss.hp,
            maxHp: this.boss.maxHp,
            atk: this.boss.atk,
            def: this.boss.def,
            rank: "最終首領"
        }];

        this.activeCombat = {
            monsters: monsters,
            monsterTemplate: { name: this.boss.name },
            rank: "最終首領",
            combat_logs: [`決戰開始！${activePlayer.name} 直面虛空之主！`],
            combatRound: 1,
            invitedAllies: []
        };
        this.turnState = "combat";
        
        // Phase immunity anchor checks
        if (this.boss.hp > 400 && this.boss.roundsImmuneRemaining > 0) {
            this.activeCombat.combat_logs.push(`🛡️ 虛空之主處於【前 5 回合傷害免疫】！必須在戰鬥中點擊摧毀 3 個虛空錨點才能解除免疫。`);
        }
    }

    handlePlayerDeath() {
        const activePlayer = this.getActivePlayer();
        this.addLog(`💀 ${activePlayer.name} HP 降為 0，進入瀕死掙扎狀態！`, "system");
        
        // Check Phoenix斗篷
        const pCapeIndex = activePlayer.inventory.findIndex(it => it.effect === "phoenix_cape");
        if (pCapeIndex !== -1) {
            activePlayer.inventory.splice(pCapeIndex, 1);
            activePlayer.hp = Math.floor(activePlayer.maxHp * 0.5);
            activePlayer.isDying = false;
            activePlayer.reviveFailCount = 0;
            this.addLog(`🦚 ${activePlayer.name} 的【鳳凰羽翼斗篷】自動觸發！消耗斗篷直接復活並恢復 50% HP！`, "system");
            this.turnState = "action";
            return;
        }

        // Check時之沙漏 (hourglass)
        const hourglassIndex = activePlayer.inventory.findIndex(it => it.effect === "time_hourglass");
        if (hourglassIndex !== -1) {
            activePlayer.inventory.splice(hourglassIndex, 1);
            activePlayer.hp = 10;
            activePlayer.isDying = false;
            activePlayer.reviveFailCount = 0;
            this.addLog(`⏳ ${activePlayer.name} 消耗了【時之沙漏】作為免死金牌，原地恢復 10 HP！`, "system");
            this.turnState = "action";
            return;
        }

        activePlayer.hp = 0;
        activePlayer.isDying = true;
        activePlayer.reviveFailCount = 0;
        activePlayer.bleedingStopped = false;
        activePlayer.reviveThresholdModifier = 0;
        
        this.turnState = "action"; // let them struggle in their next turn
    }

    triggerPermanentDeath(player) {
        player.isDead = true;
        player.isDying = false;
        player.hp = 0;
        this.addLog(`💀 殘酷的命運！${player.name} 連續 3 次判定失敗或失血過多，不幸永久死亡出局！`, "system");
        
        // Put their gold & items into Death Shop / Auction
        const deadIndex = this.players.indexOf(player);
        this.addLog(`💰 ${player.name} 持有的 $${player.coins} 金幣與道具已轉移至死亡商店。`, "system");
        
        // Items & Cards processing
        const toAuction = [];
        const toShop = [];
        
        if (player.coins > 0) {
            toAuction.push({
                title: `${player.name} 的金幣袋`,
                text: `打開獲得 $${player.coins} 金幣。`,
                isGoldBag: true,
                goldAmount: player.coins,
                price: Math.max(1, Math.floor(player.coins * 0.8)) // starting bid at 80% face value
            });
        }
        
        player.inventory.forEach(item => {
            toShop.push(item);
        });
        
        // Move cards to auction
        player.heldCards.forEach(c => {
            toAuction.push(c);
        });
        
        const oldCoins = player.coins;
        player.coins = 0;
        player.inventory = [];
        player.heldCards = [];
        
        // Populate death shop items with mark-up (basePrice + randInt(2, 5))
        toShop.forEach(it => {
            const basePrice = it.price || 10;
            const markupPrice = basePrice + randInt(2, 5);
            this.deathShopItems.push({
                ...it,
                price: markupPrice,
                originalPrice: basePrice
            });
        });
        
        // Auction cards & gold bag
        if (toAuction.length > 0) {
            this.startNextCardAuction(toAuction);
        }
        
        // Check game over
        const living = this.players.filter(p => !p.isDead);
        if (living.length === 0) {
            this.triggerGameOver("所有玩家皆已永久死亡！");
        } else if (living.length === 1 && this.players.length > 1) {
            this.triggerGameOver(`${living[0].name} 為唯一活下來的倖存者！`);
        }
    }

    startNextCardAuction(auctionList) {
        if (!auctionList || auctionList.length === 0) return;
        const card = auctionList.shift();
        this.activeAuction = {
            card: card,
            list: auctionList,
            currentBidderIndex: (this.activePlayerIndex + 1) % this.players.length,
            highestBid: 0,
            highestBidderIndex: -1,
            passCount: 0,
            initialBidder: (this.activePlayerIndex + 1) % this.players.length
        };
        // Ensure bidder is alive
        while (this.players[this.activeAuction.currentBidderIndex].isDead) {
            this.activeAuction.currentBidderIndex = (this.activeAuction.currentBidderIndex + 1) % this.players.length;
        }
        this.addLog(`🔨 【死亡拍賣】開始拍賣死亡玩家的卡片【${card.title || card.text.slice(0,12)}】！起標價 $1。`, "system");
    }

    bidAuction(pass, amount = 0) {
        if (!this.activeAuction) return { error: "目前無拍賣活動" };
        const bidder = this.players[this.activeAuction.currentBidderIndex];
        
        if (pass) {
            this.addLog(`${bidder.name} 選擇了棄標。`, "system");
            this.activeAuction.passCount++;
        } else {
            if (amount <= this.activeAuction.highestBid) {
                return { error: `出價必須高於當前最高標價 $${this.activeAuction.highestBid}` };
            }
            if (bidder.coins < amount) {
                return { error: `金幣不足，您只有 $${bidder.coins}` };
            }
            this.activeAuction.highestBid = amount;
            this.activeAuction.highestBidderIndex = this.activeAuction.currentBidderIndex;
            this.addLog(`🔥 ${bidder.name} 出價 $${amount}！`, "system");
            this.activeAuction.passCount = 0; // reset passes
        }

        // Loop to next living bidder
        do {
            this.activeAuction.currentBidderIndex = (this.activeAuction.currentBidderIndex + 1) % this.players.length;
        } while (this.players[this.activeAuction.currentBidderIndex].isDead);

        // Check if auction ends: everyone passed since the highest bid, or everyone passed initially
        const activeBidders = this.players.filter(p => !p.isDead).length;
        if (this.activeAuction.passCount >= activeBidders) {
            // End auction
            const card = this.activeAuction.card;
            const nextList = this.activeAuction.list;
            
            if (this.activeAuction.highestBidderIndex !== -1) {
                const winner = this.players[this.activeAuction.highestBidderIndex];
                winner.coins -= this.activeAuction.highestBid;
                if (card.isGoldBag) {
                    winner.coins += card.goldAmount;
                    this.addLog(`🏆 拍賣結束！【${card.title}】由 ${winner.name} 以 $${this.activeAuction.highestBid} 得標，獲得了 $${card.goldAmount} 金幣！`, "system");
                } else {
                    winner.heldCards.push(card);
                    this.addLog(`🏆 拍賣結束！【${card.title || card.text.slice(0, 10)}】由 ${winner.name} 以 $${this.activeAuction.highestBid} 得標！`, "system");
                }
            } else {
                if (card.isGoldBag) {
                    this.deathShopItems.push({
                        name: card.title,
                        desc: card.text,
                        price: card.goldAmount,
                        isGoldBag: true,
                        goldAmount: card.goldAmount
                    });
                    this.addLog(`🛒 無人出標，【${card.title}】進入死亡商店，定價為 $${card.goldAmount}。`, "system");
                } else {
                    // Nobody bid, card goes to death shop with rolled price
                    const d20 = randInt(1, 20);
                    let price = randInt(1, 10);
                    if (d20 >= 16) price = randInt(21, 30);
                    else if (d20 >= 9) price = randInt(11, 20);
                    
                    card.price = price;
                    this.deathShopItems.push({
                        name: card.title || "命運卡",
                        desc: card.desc || card.text,
                        price: price,
                        isCard: true,
                        cardData: card
                    });
                    this.addLog(`🛒 無人出標，卡片流標進入死亡商店，定價為 $${price}。`, "system");
                }
            }
            
            this.activeAuction = null;
            if (nextList.length > 0) {
                this.startNextCardAuction(nextList);
            }
        }
        return this.getStateDict();
    }

    checkPlayersHp() {
        this.players.forEach(p => {
            if (!p.isDead && !p.isDying && p.hp <= 0) {
                p.hp = 0;
                p.isDying = true;
                p.reviveFailCount = 0;
                p.bleedingStopped = false;
                p.reviveThresholdModifier = 0;
                this.addLog(`💀 ${p.name} 生命力耗盡，進入瀕死狀態！`, "system");
                
                // Check Phoenix cape immediately
                const pCapeIndex = p.inventory.findIndex(it => it.effect === "phoenix_cape" || it.effectKey === "phoenix_cape");
                if (pCapeIndex !== -1) {
                    p.inventory.splice(pCapeIndex, 1);
                    p.hp = Math.floor(p.maxHp * 0.5);
                    p.isDying = false;
                    this.addLog(`🦚 ${p.name} 的【鳳凰羽翼斗篷】自動觸發！消耗斗篷直接復活並恢復 50% HP！`, "system");
                }
            }
        });
    }

    syncInventory(player) {
        if (!player.nextPocketId) {
            player.nextPocketId = 1;
        }
        player.inventory.forEach(item => {
            if (!item.pocketId) {
                item.pocketId = player.nextPocketId++;
            }
        });
        
        // Update pocket status
        const hasPocket = player.inventory.some(i => i.name === "次元口袋" || i.effect === "bag_infinite");
        if (hasPocket) {
            if (!player.pocketAcquiredDay) {
                player.pocketAcquiredDay = this.day;
            }
        } else {
            player.pocketAcquiredDay = null;
        }
    }

    combatAttack(targetIndex = 0) {
        if (this.turnState !== "combat" || !this.activeCombat) return { error: "目前不在戰鬥中" };

        const activePlayer = this.getActivePlayer();
        const monsters = this.activeCombat.monsters.filter(m => m.hp > 0);
        
        if (monsters.length === 0) {
            this.resolveCombatWin();
            return this.getStateDict();
        }

        const target = monsters[targetIndex] || monsters[0];
        const isBoss = target.name === this.boss.name;

        // 1. Phase 1 Damage Immunity check
        if (isBoss && this.boss.hp >= 400 && this.boss.roundsImmuneRemaining > 0) {
            this.activeCombat.combat_logs.push(`🛡️ 虛空之主免疫了本次攻擊！ (請摧毀地圖上的 3 個錨點或等待 ${this.boss.roundsImmuneRemaining} 回合)`);
            
            // Skip damage but monsters still counter-attack
            this.activeCombat.invitedAllies = []; // reset assists
        } else {
            // 2. Phase 2 Clone summoning trigger
            if (isBoss && this.boss.hp < 400 && this.boss.hp >= 150 && !this.boss.clonesSummoned) {
                this.boss.clonesSummoned = true;
                this.activeCombat.monsters.push(
                    { name: "虛空分身 A", hp: 50, maxHp: 50, atk: "1d6", def: 2, rank: "最終首領分身" },
                    { name: "虛空分身 B", hp: 50, maxHp: 50, atk: "1d6", def: 2, rank: "最終首領分身" }
                );
                this.activeCombat.combat_logs.push(`🔮 虛空之主進入第二階段「混沌具現」！召喚了兩個虛空分身 (各 50 HP)！分身存活時，Boss受到的所有傷害減少 50%！`);
                // Re-evaluate monsters list
                return this.getStateDict();
            }

            let extraAtk = 0;
            let damageReduction = 0;

            // Inventory passives
            activePlayer.inventory.forEach(item => {
                const eff = item.effect || "";
                if (eff.startsWith("atk_")) {
                    if (eff === "atk_moon" && !this.isDay) extraAtk += 4;
                    else extraAtk += parseInt(eff.split("_")[1], 10);
                } else if (eff.startsWith("def_")) {
                    if (eff === "def_3_atk_1") { damageReduction += 3; extraAtk += 1; }
                    else damageReduction += parseInt(eff.split("_")[1], 10);
                }
            });

            // 6 Classes Trait / Skill Modifier on Attack
            let isDoubleShotActive = activePlayer.doubleShot || activePlayer.doubleBarrel;
            let attackRounds = isDoubleShotActive ? 2 : 1;
            
            let finalDmgThisAction = 0;

            for (let round = 1; round <= attackRounds; round++) {
                let finalDmg = 0;
                let logMsg = "";
                
                if (activePlayer.defenseStance) {
                    logMsg = `🛡️ ${activePlayer.name} 處於防禦姿態，本輪無法進行任何攻擊！`;
                    this.activeCombat.combat_logs.push(logMsg);
                    continue;
                }

                if (activePlayer.aiming) {
                    // Snipe Aim check
                    activePlayer.aiming = false; // consume charge
                    let rawDmg = this.rollDice(activePlayer.atk, true) + extraAtk;
                    let multiplier = 2.0;
                    let addDmg = 0;
                    
                    if (target.tag === "晝強" || target.tag === "夜強") {
                        addDmg = this.rollDice("1d6", true);
                    }
                    finalDmg = Math.floor(rawDmg * multiplier) + addDmg;
                    logMsg = `🎯 蓄力精準瞄準射擊！對 ${target.name} 造成了 ${finalDmg} 點傷害！ (含雙倍蓄力 + ${addDmg} 標籤追傷)`;
                } else {
                    let dice = activePlayer.atk;
                    let rawDmg = this.rollDice(dice, true);
                    
                    // Black Mage Magic Burst
                    let isBurst = activePlayer.magicBurst && activePlayer.mp >= 5;
                    if (isBurst) {
                        activePlayer.mp -= 5;
                        activePlayer.magicBurst = false;
                        rawDmg *= 2;
                        this.activeCombat.combat_logs.push(`🔮 黑魔法師消耗 5 MP 施放「魔法爆發」！傷害翻倍！`);
                    }
                    
                    // Assassin first round boost
                    if (activePlayer.class === "刺客" && this.activeCombat.combatRound === 1) {
                        rawDmg = Math.floor(rawDmg * 1.5);
                    }

                    // Final boss dmg buff (+25%)
                    if (activePlayer.damageBuff && isBoss) {
                        rawDmg = Math.floor(rawDmg * 1.25);
                    }

                    finalDmg = rawDmg + extraAtk;
                    logMsg = `⚔️ ${activePlayer.name} 對 ${target.name} 造成了 ${finalDmg} 點傷害！`;
                }

                // If Final Boss has clones alive, reduce damage by 50%
                if (isBoss) {
                    const clonesAlive = this.activeCombat.monsters.some(m => m.name.includes("分身") && m.hp > 0);
                    if (clonesAlive) {
                        finalDmg = Math.floor(finalDmg * 0.5);
                        logMsg += ` (因虛空分身存活減傷 50% -> 實際造成 ${finalDmg} 傷害)`;
                    }
                }

                // Apply damage
                target.hp = Math.max(0, target.hp - finalDmg);
                finalDmgThisAction += finalDmg;
                this.activeCombat.combat_logs.push(logMsg);
                
                // Black Mage / Assassin lifesteal passives
                if (activePlayer.class === "黑魔法師") {
                    const heal = Math.max(1, Math.floor(finalDmg * 0.1));
                    activePlayer.hp = Math.min(activePlayer.maxHp, activePlayer.hp + heal);
                    this.activeCombat.combat_logs.push(`🩸 暗黑汲取：回復 ${heal} HP。`);
                } else if (activePlayer.class === "刺客" && activePlayer.hp < activePlayer.maxHp * 0.5) {
                    const heal = Math.max(1, Math.floor(finalDmg * 0.15));
                    activePlayer.hp = Math.min(activePlayer.maxHp, activePlayer.hp + heal);
                    this.activeCombat.combat_logs.push(`🩸 嗜血覺醒：回復 ${heal} HP。`);
                }

                // Sniper Pierce Splash Damage
                if (activePlayer.class === "狙獵手" && monsters.length > 1) {
                    const splash = Math.floor(finalDmg * 0.5);
                    monsters.forEach(m => {
                        if (m !== target && m.hp > 0) {
                            m.hp = Math.max(0, m.hp - splash);
                            this.activeCombat.combat_logs.push(`🏹 穿透射擊：對 ${m.name} 濺射造成 ${splash} 點傷害。`);
                        }
                    });
                }

                // Check target death
                if (target.hp <= 0) {
                    if (target.name === "沼澤史萊姆") {
                        this.activeCombat.combat_logs.push(`🦠 沼澤史萊姆遭到重擊分裂了！`);
                        const index = this.activeCombat.monsters.indexOf(target);
                        this.activeCombat.monsters.splice(index, 1);
                        this.activeCombat.monsters.push(
                            { name: "小史萊姆 A", hp: 5, maxHp: 5, atk: "1d2", def: 0, drop: 2 },
                            { name: "小史萊姆 B", hp: 5, maxHp: 5, atk: "1d2", def: 0, drop: 2 }
                        );
                    }
                    break; 
                }
            }

            // Sync boss HP if Boss was target
            if (isBoss) {
                this.boss.hp = target.hp;
                if (!this.boss.dealtDamagePlayers.includes(activePlayer.id)) {
                    this.boss.dealtDamagePlayers.push(activePlayer.id);
                }

                // Phase 3 Final Judgment Trigger (HP <= 50)
                if (this.boss.hp <= 50 && !this.boss.judgmentTriggered) {
                    this.boss.judgmentTriggered = true;
                    this.activeCombat.combat_logs.push(`🔥 【最後審判】虛空之主殘血引爆虛空能量！所有存活玩家受到最大生命值 40% 的不可迴避傷害！`);
                    this.players.forEach(p => {
                        if (!p.isDead && !p.isDying) {
                            const dmg = Math.floor(p.maxHp * 0.4);
                            p.hp = Math.max(0, p.hp - dmg);
                        }
                    });
                    this.checkPlayersHp();
                }
            }

            // Reset double shot
            activePlayer.doubleShot = false;
            activePlayer.doubleBarrel = false;

            // Check Goblin escape
            if (target.name === "哥布林斥候" && target.hp > 0 && target.hp < 4) {
                activePlayer.coins = Math.max(0, activePlayer.coins - 3);
                this.activeCombat.combat_logs.push(`🏃 哥布林斥候低於 50% 生命！臨陣逃脫並偷走了你 $3 金幣！`);
                target.hp = 0;
            }

            // Check if all monsters dead
            const currentMonsters = this.activeCombat.monsters.filter(m => m.hp > 0);
            if (currentMonsters.length === 0) {
                this.resolveCombatWin();
                return this.getStateDict();
            }

            // Allies Assist Actions processing
            let totalAllyDmg = 0;
            this.activeCombat.invitedAllies.forEach(assist => {
                const ally = this.players[assist.playerIndex];
                let rawAllyDmg = 0;
                let scale = 0.25;
                
                if (assist.actionType === "attack") {
                    rawAllyDmg = this.rollDice(ally.atk, true);
                    scale = 0.25;
                } else if (assist.actionType === "skill") {
                    rawAllyDmg = this.rollDice(ally.atk, true) * 1.5;
                    scale = 0.35;
                } else if (assist.actionType === "heal") {
                    rawAllyDmg = this.rollDice("1d8", true) + 3;
                    scale = 1.00;
                    activePlayer.hp = Math.min(activePlayer.maxHp, activePlayer.hp + rawAllyDmg);
                    this.activeCombat.combat_logs.push(`✨ 盟友 ${ally.name} 施放聖光治癒協助！為你回復 ${rawAllyDmg} HP。`);
                    return;
                } else if (assist.actionType === "item") {
                    rawAllyDmg = 15;
                    scale = 0.50;
                }
                
                // Final Boss has 100% allied scaling
                if (isBoss) {
                    scale = 1.00;
                }
                
                let finalAllyDmg = Math.floor(rawAllyDmg * scale);
                // Also apply clone 50% reduction for assists if target is Boss
                if (isBoss) {
                    const clonesAlive = this.activeCombat.monsters.some(m => m.name.includes("分身") && m.hp > 0);
                    if (clonesAlive) {
                        finalAllyDmg = Math.floor(finalAllyDmg * 0.5);
                    }
                }
                totalAllyDmg += finalAllyDmg;
                
                this.activeCombat.combat_logs.push(`🤝 盟友 ${ally.name} 進行協助 (${assist.actionType})，造成 ${finalAllyDmg} 點折算傷害！`);
            });
            
            this.activeCombat.invitedAllies = []; // Reset assists
            
            if (totalAllyDmg > 0) {
                const currentTarget = currentMonsters[0];
                currentTarget.hp = Math.max(0, currentTarget.hp - totalAllyDmg);
                if (currentTarget.name === this.boss.name) this.boss.hp = currentTarget.hp;
                
                if (currentTarget.hp <= 0) {
                    const nextLiving = this.activeCombat.monsters.filter(m => m.hp > 0);
                    if (nextLiving.length === 0) {
                        this.resolveCombatWin();
                        return this.getStateDict();
                    }
                }
            }
        }

        // Monsters turn to attack back
        const currentLiving = this.activeCombat.monsters.filter(m => m.hp > 0);
        
        // Group Synergy for Wolves
        let wolfSynergyBonus = 0;
        if (this.activeCombat.monsterTemplate.name === "野狼群") {
            wolfSynergyBonus = currentLiving.length;
        }

        currentLiving.forEach(m => {
            let mRoll = this.rollDice(m.atk || "1d6") + wolfSynergyBonus;
            let tag = m.tag || "";
            let mult = 1.0;
            
            if (tag === "日強" && this.isDay) mult = 1.5;
            if (tag === "夜強" && !this.isDay) mult = 1.5;
            if (tag === "日弱" && this.isDay) mult = 0.5;
            if (tag === "夜弱" && !this.isDay) mult = 0.5;
            
            let finalMDmg = Math.max(1, Math.floor(mRoll * mult) - damageReduction);
            
            // Warrior defense stance
            if (activePlayer.defenseStance) {
                finalMDmg = Math.max(1, Math.floor(finalMDmg * 0.5));
            }

            activePlayer.hp = Math.max(0, activePlayer.hp - finalMDmg);
            this.activeCombat.combat_logs.push(`💥 ${m.name} 對你造成了 ${finalMDmg} 點傷害！ (防禦減免後)`);
        });

        // Regen for Tree
        if (this.activeCombat.monsterTemplate.name === "腐化樹精" && currentLiving[0].hp > 0) {
            // Check if player dealt >= 8 damage in this turn
            if (finalDmgThisAction < 8) {
                currentLiving[0].hp = Math.min(20, currentLiving[0].hp + 2);
                this.activeCombat.combat_logs.push(`🌿 腐化樹精的自然再生：回復了 2 HP。`);
            } else {
                this.activeCombat.combat_logs.push(`🌿 腐化樹精遭到重創，本回合再生中斷。`);
            }
        }

        // Final Boss round-end triggers
        if (this.activeCombat.monsterTemplate.name === this.boss.name) {
            const rNum = this.activeCombat.combatRound;
            
            // Decrement Boss roundsImmuneRemaining
            if (this.boss.roundsImmuneRemaining > 0) {
                this.boss.roundsImmuneRemaining--;
                if (this.boss.roundsImmuneRemaining === 0) {
                    this.activeCombat.combat_logs.push(`💥 虛空之主的免疫防護回合已過，屏障自動消失！`);
                }
            }

            // Phase 1 triggers (HP 666 - 400)
            if (this.boss.hp >= 400) {
                // 虛空侵蝕 (1d6 AoE)
                const dmg = this.rollDice("1d6", true);
                this.players.forEach(p => {
                    if (!p.isDead && !p.isDying) {
                        p.hp = Math.max(0, p.hp - dmg);
                        this.activeCombat.combat_logs.push(`⚠️ 虛空侵蝕：${p.name} 受到 ${dmg} 點腐蝕傷害！`);
                    }
                });
                
                // 命運抹除 (every 4 rounds)
                if (rNum % 4 === 0) {
                    const living = this.players.filter(p => !p.isDead && !p.isDying);
                    if (living.length) {
                        const rp = choice(living);
                        rp.fateDeletedTurns = 1;
                        this.activeCombat.combat_logs.push(`⚠️ 命運抹除：${rp.name} 被虛空吞噬運氣，下回合所有骰子結果將強制歸 1！`);
                    }
                }
            }
            
            // Phase 2 triggers (HP 399 - 150)
            else if (this.boss.hp >= 150 && this.boss.hp < 400) {
                // 星界連結 (1d8 AoE)
                const dmg = this.rollDice("1d8", true);
                this.players.forEach(p => {
                    if (!p.isDead && !p.isDying) {
                        p.hp = Math.max(0, p.hp - dmg);
                        this.activeCombat.combat_logs.push(`⚠️ 星界連結：歐梅卡共鳴對 ${p.name} 造成 ${dmg} 點傷害！`);
                    }
                });

                // 記憶侵蝕 (every 3 rounds)
                if (rNum % 3 === 0) {
                    const living = this.players.filter(p => !p.isDead && !p.isDying);
                    if (living.length) {
                        const rp = choice(living);
                        rp.memoryErodedTurns = 1;
                        this.activeCombat.combat_logs.push(`⚠️ 記憶侵蝕：${rp.name} 下回合遭到封印，無法使用任何道具！`);
                    }
                }

                // 命運逆轉 (every 4 rounds)
                if (rNum % 4 === 0) {
                    let totalCoins = 0;
                    this.players.forEach(p => { if (!p.isDead) totalCoins += p.coins; });
                    const transfer = Math.floor(totalCoins * 0.1);
                    if (transfer > 0) {
                        this.players.forEach(p => {
                            if (!p.isDead) {
                                const share = Math.floor(p.coins * 0.1);
                                p.coins = Math.max(0, p.coins - share);
                            }
                        });
                        this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + transfer);
                        const targetMonster = this.activeCombat.monsters.find(m => m.name === this.boss.name);
                        if (targetMonster) targetMonster.hp = this.boss.hp;
                        this.activeCombat.combat_logs.push(`⚠️ 命運逆轉：吸取全體玩家 10% 金幣共 $${transfer}，轉化為虛空之主生命值！`);
                    }
                }
            }
            
            // Phase 3 triggers (HP < 150)
            else {
                // 虛空爆發 (every 2 rounds to highest HP)
                if (rNum % 2 === 0) {
                    const living = this.players.filter(p => !p.isDead && !p.isDying);
                    if (living.length) {
                        living.sort((a, b) => b.hp - a.hp);
                        const targetPlayer = living[0];
                        const dmg = this.rollDice("5d6", true);
                        targetPlayer.hp = Math.max(0, targetPlayer.hp - dmg);
                        this.activeCombat.combat_logs.push(`⚠️ 虛空爆發：射線集中轟擊生命最高的 ${targetPlayer.name}，造成 ${dmg} 點致命傷害！`);
                    }
                }

                // 意志試煉 (every round)
                this.players.forEach(p => {
                    if (!p.isDead && !p.isDying) {
                        const roll = randInt(1, 20);
                        if (roll <= 8) {
                            p.skipTurns = 1;
                            this.activeCombat.combat_logs.push(`⚠️ 意志試煉：${p.name} 擲出 D20 = ${roll} 判定失敗！下回合無法行動。`);
                        } else {
                            this.activeCombat.combat_logs.push(`😌 意志試煉：${p.name} 擲出 D20 = ${roll} 順利通過。`);
                        }
                    }
                });
            }
            
            this.checkPlayersHp();
        }

        // Decrement debuffs if round ends
        if (activePlayer.fateDeletedTurns > 0) activePlayer.fateDeletedTurns--;
        if (activePlayer.memoryErodedTurns > 0) activePlayer.memoryErodedTurns--;

        this.activeCombat.combatRound++;
        
        if (activePlayer.hp <= 0) {
            this.activeCombat = null;
            this.handlePlayerDeath();
        }

        return this.getStateDict();
    }

    resolveCombatWin() {
        const activePlayer = this.getActivePlayer();
        const monster = this.activeCombat.monsterTemplate;

        this.addLog(`【戰鬥獲勝】${activePlayer.name} 擊敗了 ${monster.name}！`, "combat");

        if (monster.name === this.boss.name) {
            activePlayer.victoryPoints += 3;
            this.addLog(`${activePlayer.name} 獲得最後一擊加成，+3 勝利點數！`, "combat");
            
            this.players.forEach(p => {
                if (this.boss.dealtDamagePlayers.includes(p.id) && p.id !== activePlayer.id) {
                    p.victoryPoints += 1;
                    this.addLog(`${p.name} 曾參與擊殺最終 Boss，獲得 +1 勝利點數！`, "combat");
                }
            });
            
            this.activeCombat = null;
            this.triggerGameOver("最終首領已被擊敗！");
        } else {
            let matGrade = "low";
            if (this.activeCombat.rank === "高級怪物" || this.activeCombat.rank === "史詩級怪物") {
                matGrade = "high";
            } else if (this.activeCombat.rank === "中級怪物") {
                matGrade = "mid";
            }

            const matsPool = Object.keys(GAME_CONFIG.materials).filter(k => GAME_CONFIG.materials[k].grade === matGrade);
            let dropMat = null;
            if (matsPool.length) {
                dropMat = choice(matsPool);
                activePlayer.materials[dropMat] += 1;
            }

            let gold = monster.drop || 5;
            if (!this.isDay && monster.tag === "夜強") {
                gold = Math.floor(gold * 1.5);
            }
            activePlayer.coins += gold;

            const vp = matGrade === "high" ? 2 : 1;
            activePlayer.victoryPoints += vp;

            this.addLog(`戰利品：獲得 $${gold} 金幣，素材【${dropMat || "無"}】與 +${vp} 勝利點數！`, "combat");
            
            // Remove active states
            activePlayer.defenseStance = false;
            activePlayer.doubleShot = false;
            activePlayer.doubleBarrel = false;
            activePlayer.aiming = false;

            this.activeCombat = null;
            this.turnState = "action";
        }
    }

    combatFlee() {
        if (this.turnState !== "combat" || !this.activeCombat) return { error: "不在戰鬥中" };
        const activePlayer = this.getActivePlayer();
        const rollVal = randInt(1, 6);

        if (rollVal >= 4) {
            this.addLog(`${activePlayer.name} 擲出 D6 = ${rollVal}，成功逃離戰鬥！退回前一格。`, "system");
            activePlayer.position = Math.max(0, activePlayer.position - 1);
            this.activeCombat = null;
            this.turnState = "action";
        } else {
            this.activeCombat.combat_logs.push(`🏃 逃跑判定失敗！(擲出 D6 = ${rollVal}，小於 4)`);
            // Enemy attacks free
            const currentLiving = this.activeCombat.monsters.filter(m => m.hp > 0);
            currentLiving.forEach(m => {
                let mRoll = this.rollDice(m.atk || "1d6");
                activePlayer.hp = Math.max(0, activePlayer.hp - mRoll);
                this.activeCombat.combat_logs.push(`💥 ${m.name} 趁機襲擊，對你造成 ${mRoll} 點傷害！`);
            });
            if (activePlayer.hp <= 0) {
                this.activeCombat = null;
                this.handlePlayerDeath();
            }
        }
        return this.getStateDict();
    }

    inviteAlly(allyPlayerIndex, actionType) {
        if (this.turnState !== "combat" || !this.activeCombat) return { error: "目前不在戰鬥中" };
        const activePlayer = this.getActivePlayer();
        const ally = this.players[allyPlayerIndex];
        
        if (allyPlayerIndex === this.activePlayerIndex) {
            return { error: "不能邀請自己輔助" };
        }
        if (ally.isDead || ally.isDying) {
            return { error: "盟友無法進行輔助" };
        }
        if (this.activeCombat.invitedAllies.some(a => a.playerIndex === allyPlayerIndex)) {
            return { error: "該盟友已進行過輔助" };
        }

        // Record assist action
        this.activeCombat.invitedAllies.push({
            playerIndex: allyPlayerIndex,
            actionType: actionType
        });
        
        this.addLog(`${ally.name} 接受邀請，準備以「${actionType}」輔助主場戰鬥！`, "combat");
        return this.getStateDict();
    }

    rollRevival() {
        const activePlayer = this.getActivePlayer();
        if (!activePlayer.isDying) return { error: "角色並未處於瀕死狀態" };

        // 1. Bleeding check: loses 5% max HP
        const bleedingDmg = Math.max(1, Math.floor(activePlayer.maxHp * 0.05));
        activePlayer.hp = 0; // HP is kept at 0 while dying, but check二次歸零 logic or cumulative bleeding HP
        
        // 2. Roll D20 revival
        const threshold = 11 - (activePlayer.reviveThresholdModifier || 0);
        const rollVal = randInt(1, 20);
        
        let success = false;
        if (rollVal === 20) {
            // Perfect revival
            activePlayer.hp = Math.floor(activePlayer.maxHp * 0.3);
            activePlayer.isDying = false;
            activePlayer.reviveFailCount = 0;
            this.addLog(`🌟 完美復活！${activePlayer.name} 擲出 D20 = 20！生命值恢復至 30%，本回合可立即行動！`, "system");
            this.turnState = "roll"; // allowed to move
        } else if (rollVal >= threshold) {
            // Success
            activePlayer.hp = Math.floor(activePlayer.maxHp * 0.2);
            activePlayer.isDying = false;
            activePlayer.reviveFailCount = 0;
            this.addLog(`💖 復活成功！${activePlayer.name} 擲出 D20 = ${rollVal} (門檻 ${threshold})，生命值恢復至 20%，本回合休息。`, "system");
            this.turnState = "action"; // skip move but can end turn
        } else {
            // Failure
            activePlayer.reviveFailCount++;
            this.addLog(`🩹 復活失敗！${activePlayer.name} 擲出 D20 = ${rollVal} (連續失敗次數: ${activePlayer.reviveFailCount}/3)。`, "system");
            
            if (activePlayer.reviveFailCount >= 3) {
                this.triggerPermanentDeath(activePlayer);
            } else {
                this.turnState = "action"; // skip and wait next turn
            }
        }
        return this.getStateDict();
    }

    useDyingItem(itemIndex) {
        const activePlayer = this.getActivePlayer();
        if (!activePlayer.isDying) return { error: "角色並非處於瀕死狀態" };
        if (itemIndex < 0 || itemIndex >= activePlayer.inventory.length) return { error: "無效道具索引" };

        const item = activePlayer.inventory[itemIndex];
        
        if (item.name.includes("急救繃帶")) {
            activePlayer.bleedingStopped = true;
            activePlayer.inventory.splice(itemIndex, 1);
            this.addLog(`${activePlayer.name} 使用了【${item.name}】！停止了瀕死流血扣血效果。`, "system");
        } else if (item.name.includes("生命之泉水")) {
            activePlayer.bleedingStopped = true;
            activePlayer.hp = Math.floor(activePlayer.maxHp * 0.1);
            activePlayer.inventory.splice(itemIndex, 1);
            this.addLog(`${activePlayer.name} 使用了【${item.name}】！停止流血並恢復 10% HP。`, "system");
        } else if (item.name.includes("死亡抗拒符")) {
            activePlayer.reviveThresholdModifier = 5; // door is 6+
            activePlayer.inventory.splice(itemIndex, 1);
            this.addLog(`${activePlayer.name} 使用了【${item.name}】！復活判定門檻降至 D20 >= 6！`, "system");
        } else {
            return { error: "該道具無法在瀕死狀態使用" };
        }
        return this.getStateDict();
    }

    placeTeleportBet(diceType, guessedNumber) {
        if (this.turnState !== "teleport") return { error: "當前無法下注" };
        const allowed = [4, 6, 8, 10, 12, 20];
        if (!allowed.includes(diceType)) return { error: "不合法的骰子類型" };
        if (guessedNumber < 1 || guessedNumber > diceType) return { error: "猜測數字超出範圍" };
        
        this.teleportBet = { dice: diceType, guess: guessedNumber };
        this.addLog(`🎲 ${this.getActivePlayer().name} 啟動了傳送賭注：指定使用 D${diceType}，猜測數字 ${guessedNumber}！`, "system");
        return this.getStateDict();
    }

    rollTeleport() {
        if (this.turnState !== "teleport") return { error: "狀態錯誤，無法傳送" };
        const activePlayer = this.getActivePlayer();
        const tile = this.board[activePlayer.position];
        const dist = tile.teleportDist || 10;
        const isLong = Math.abs(dist) > 20;

        // Resolve Bet first
        let betSuccess = false;
        if (this.teleportBet) {
            const betRoll = randInt(1, this.teleportBet.dice);
            betSuccess = (betRoll === this.teleportBet.guess);
            
            this.addLog(`🎰 賭注擲骰：D${this.teleportBet.dice} 擲出了 ${betRoll}。猜測數字為 ${this.teleportBet.guess}。`, "system");
            
            if (betSuccess) {
                this.addLog(`🎉 賭注成功！獲得超棒獎勵！`, "system");
                this.applyBetReward(this.teleportBet.dice, activePlayer);
            } else {
                this.addLog(`😢 賭注失敗！受到懲罰！`, "system");
                this.applyBetPenalty(this.teleportBet.dice, activePlayer);
            }
            this.teleportBet = null; // consume
        }

        const d20 = randInt(1, 20);
        let targetPos = activePlayer.position + dist;
        targetPos = Math.max(0, Math.min(this.board.length - 1, targetPos));

        this.addLog(`🔮 傳送判定：D20 擲出了 ${d20}！ (${isLong ? "長程傳送" : "短程傳送"})`, "system");

        if (!isLong) {
            // Short range
            if (d20 === 1) {
                this.triggerUnstableTeleport(6);
            } else if (d20 <= 8) {
                const dmg = randInt(1, 4);
                activePlayer.hp = Math.max(1, activePlayer.hp - dmg);
                activePlayer.position = targetPos;
                this.addLog(`勉強成功！傳送至第 ${targetPos} 格，但損失了 ${dmg} HP。`, "system");
                this.turnState = "action";
            } else if (d20 <= 16) {
                activePlayer.position = targetPos;
                this.addLog(`順利傳送！抵達第 ${targetPos} 格。`, "system");
                this.turnState = "action";
            } else if (d20 <= 19) {
                const bonus = randInt(1, 4);
                activePlayer.position = Math.min(this.board.length - 1, targetPos + bonus);
                this.addLog(`優質傳送！抵達第 ${targetPos} 格，且額外前進了 ${bonus} 格。`, "system");
                this.turnState = "action";
            } else {
                const bonus = randInt(1, 4);
                activePlayer.position = Math.min(this.board.length - 1, targetPos + bonus);
                // random $5 item
                const lowItems = GAME_CONFIG.shopItems.filter(it => it.price === 5);
                const item = choice(lowItems);
                activePlayer.inventory.push({ name: item.name, desc: item.effect, effect: item.effectKey });
                this.addLog(`完美傳送！抵達第 ${targetPos} 格，額外前進 ${bonus} 格，並獲得免費隨機道具：${item.name}！`, "system");
                this.turnState = "action";
            }
        } else {
            // Long range
            if (d20 === 1) {
                this.triggerUnstableTeleport(8);
            } else if (d20 <= 6) {
                activePlayer.skipTurns = 1;
                this.addLog(`傳送失敗！留在原地且下回合將跳過行動。`, "system");
                this.turnState = "action";
            } else if (d20 <= 10) {
                this.addLog(`傳送無效！本回合強制結束，沒有任何事發生。`, "system");
                this.turnState = "action";
            } else if (d20 <= 14) {
                const dmg = randInt(1, 6);
                activePlayer.hp = Math.max(1, activePlayer.hp - dmg);
                activePlayer.position = targetPos;
                activePlayer.skipTurns = 1;
                this.addLog(`勉強成功！傳送至第 ${targetPos} 格，損失 ${dmg} HP 且下回合跳過行動。`, "system");
                this.turnState = "action";
            } else if (d20 <= 18) {
                activePlayer.position = targetPos;
                this.addLog(`正常成功！順利傳送至第 ${targetPos} 格。`, "system");
                this.turnState = "action";
            } else if (d20 === 19) {
                const bonus = randInt(1, 6);
                activePlayer.position = Math.min(this.board.length - 1, targetPos + bonus);
                this.addLog(`優質成功！抵達第 ${targetPos} 格，額外前進 ${bonus} 格。`, "system");
                this.turnState = "action";
            } else {
                const bonus = randInt(1, 6);
                activePlayer.position = Math.min(this.board.length - 1, targetPos + bonus);
                const midItems = GAME_CONFIG.shopItems.filter(it => it.price === 10);
                const item = choice(midItems);
                activePlayer.inventory.push({ name: item.name, desc: item.effect, effect: item.effectKey });
                this.addLog(`完美傳送！抵達第 ${targetPos} 格，額外前進 ${bonus} 格，並獲得隨機道具：${item.name}！`, "system");
                this.turnState = "action";
            }
        }
        return this.getStateDict();
    }

    triggerUnstableTeleport(sides) {
        const activePlayer = this.getActivePlayer();
        const roll = randInt(1, 6);
        this.addLog(`⚠️ 傳送通道不穩定！額外擲 D6 判定後果：擲出 ${roll}`, "system");
        
        if (roll <= 2) {
            // Severe
            const target = randInt(0, this.board.length - 1);
            const hpLoss = randInt(1, 8);
            activePlayer.position = target;
            activePlayer.hp = Math.max(1, activePlayer.hp - hpLoss);
            activePlayer.skipTurns = 1;
            this.addLog(`😱 嚴重不穩定！隨機被扯入第 ${target} 格，失去 ${hpLoss} HP 且下回合跳過行動。`, "system");
        } else if (roll <= 4) {
            // Mid
            const hpLoss = randInt(1, 4);
            activePlayer.hp = Math.max(1, activePlayer.hp - hpLoss);
            // find nearest teleport pad
            let nearestIdx = 0;
            let minDist = 999;
            this.board.forEach((cell, idx) => {
                if (cell.type === "teleport" && idx !== activePlayer.position) {
                    const dist = Math.abs(idx - activePlayer.position);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestIdx = idx;
                    }
                }
            });
            activePlayer.position = nearestIdx;
            this.addLog(`😨 中度不穩定！傳送至最近傳送點 (第 ${nearestIdx} 格)，損失 ${hpLoss} HP。`, "system");
        } else {
            // Light
            this.addLog(`😌 輕微不穩定！傳送陣能量崩解，留在原地，本回合行動結束。`, "system");
        }
        this.turnState = "action";
    }

    applyBetReward(dice, player) {
        const allShop = GAME_CONFIG.shopItems;
        if (dice === 4) {
            player.tempMoveBonus = 2;
            this.addLog(`🎁 獎勵：下回合移動加 2 格。`, "system");
        } else if (dice === 6) {
            player.coins += 5;
            this.addLog(`🎁 獎勵：獲得 $5 金幣。`, "system");
        } else if (dice === 8) {
            player.coins += 8;
            this.addLog(`🎁 獎勵：獲得 $8 金幣。`, "system");
        } else if (dice === 10) {
            const items = allShop.filter(i => i.price === 10);
            const it = choice(items);
            player.inventory.push({ name: it.name, desc: it.effect, effect: it.effectKey });
            this.addLog(`🎁 獎勵：獲得隨機 $10 道具【${it.name}】！`, "system");
        } else if (dice === 12) {
            const items = allShop.filter(i => i.price === 15);
            const it = choice(items);
            player.inventory.push({ name: it.name, desc: it.effect, effect: it.effectKey });
            this.addLog(`🎁 獎勵：獲得隨機 $15 道具【${it.name}】！`, "system");
        } else if (dice === 20) {
            const items = allShop.filter(i => i.price >= 20 && i.price <= 30);
            const it = choice(items);
            player.inventory.push({ name: it.name, desc: it.effect, effect: it.effectKey });
            this.addLog(`🎁 獎勵：獲得珍貴道具【${it.name}】！`, "system");
        }
    }

    applyBetPenalty(dice, player) {
        if (dice === 4) {
            player.tempMoveHalf = true;
            this.addLog(`🚫 懲罰：下回合移動減慢。`, "system");
        } else if (dice === 6) {
            player.coins = Math.max(0, player.coins - 3);
            this.addLog(`🚫 懲罰：失去 $3 金幣。`, "system");
        } else if (dice === 8) {
            player.coins = Math.max(0, player.coins - 5);
            player.position = Math.max(0, player.position - 1);
            this.addLog(`🚫 懲罰：失去 $5 金幣且往回退一格。`, "system");
        } else if (dice === 10) {
            player.coins = Math.max(0, player.coins - 8);
            player.skipTurns = 1;
            this.addLog(`🚫 懲罰：失去 $8 金幣且下回合跳過。`, "system");
        } else if (dice === 12) {
            player.coins = Math.max(0, player.coins - 10);
            player.skipTurns = 1;
            player.tempMoveHalf = true;
            this.addLog(`🚫 懲罰：失去 $10 金幣、跳回合且移動力減半。`, "system");
        } else if (dice === 20) {
            player.coins = Math.max(0, player.coins - 15);
            player.skipTurns = 2;
            player.position = Math.max(0, player.position - 2);
            this.addLog(`🚫 懲罰：失去 $15 金幣、跳過 2 回合且往回退兩格。`, "system");
        }
    }

    getShopInventory(tileIndex, customSL = null) {
        const tile = this.board[tileIndex];
        let sl = customSL;
        
        if (!sl) {
            const terrain = tile.terrain || "新手村周邊";
            const roll = randInt(1, 100);
            
            if (terrain === "新手村周邊") {
                sl = roll <= 85 ? 1 : 2;
            } else if (terrain === "森林" || terrain === "沼澤") {
                sl = roll <= 20 ? 1 : (roll <= 80 ? 2 : 3);
            } else if (terrain === "雪山" || terrain === "火山") {
                sl = roll <= 5 ? 1 : (roll <= 25 ? 2 : (roll <= 90 ? 3 : 4));
            } else {
                // fortress
                sl = roll <= 2 ? 1 : (roll <= 10 ? 2 : (roll <= 40 ? 5 : 6));
            }
        }

        const itemsPool = GAME_CONFIG.shopItems;
        const result = [];
        
        const getItems = (price, count) => {
            const sub = itemsPool.filter(i => i.price === price);
            for (let i = 0; i < count && sub.length; i++) {
                const idx = randInt(0, sub.length - 1);
                result.push({ ...sub[idx] });
                sub.splice(idx, 1);
            }
        };

        // Populate items based on SL level
        if (sl === 1) {
            getItems(5, 4); getItems(8, 1);
        } else if (sl === 2) {
            getItems(5, 3); getItems(8, 1); getItems(10, 1);
        } else if (sl === 3) {
            getItems(5, 4); getItems(8, 2); getItems(10, 1); getItems(15, 1);
        } else if (sl === 4) {
            getItems(5, 3); getItems(8, 3); getItems(10, 2); getItems(15, 2);
        } else if (sl === 5) {
            getItems(5, 4); getItems(8, 3); getItems(10, 3); getItems(15, 1); getItems(25, 1);
        } else if (sl === 6) {
            getItems(5, 3); getItems(8, 3); getItems(10, 3); getItems(15, 3); getItems(25, 1); getItems(40, 1);
        }

        return { sl, items: result };
    }

    applyAwakening(itemIndex, stoneIndex = null) {
        const p = this.getActivePlayer();
        if (itemIndex < 0 || itemIndex >= p.inventory.length) return { error: "無效道具索引" };
        const item = p.inventory[itemIndex];
        
        if (item.cursed) {
            return { error: "無法覺醒已被詛咒的道具！" };
        }
        item.awakened = true;
        item.name = "【覺醒】" + item.name.replace("【覺醒】", "");
        item.desc = "[覺醒強化]" + item.desc;
        
        if (stoneIndex !== null && stoneIndex >= 0 && stoneIndex < p.inventory.length) {
            p.inventory.splice(stoneIndex, 1);
        }
        
        this.addLog(`${p.name} 施放覺醒之石，成功覺醒了【${item.name}】！`, "system");
        return this.getStateDict();
    }

    applyCurse(targetPlayerIndex, itemIndex, stoneIndex = null) {
        const p = this.getActivePlayer();
        const target = this.players[targetPlayerIndex];
        if (itemIndex < 0 || itemIndex >= target.inventory.length) return { error: "無效道具索引" };
        const item = target.inventory[itemIndex];

        if (item.awakened) {
            return { error: "無法對已覺醒的道具施加詛咒！" };
        }
        item.cursed = true;
        item.name = "【詛咒】" + item.name.replace("【詛咒】", "");
        item.desc = "[詛咒削弱]" + item.desc;
        
        if (stoneIndex !== null && stoneIndex >= 0 && stoneIndex < p.inventory.length) {
            p.inventory.splice(stoneIndex, 1);
        }
        
        this.addLog(`${p.name} 對 ${target.name} 的道具【${item.name}】施加了邪惡的詛咒！`, "system");
        return this.getStateDict();
    }

    // Toggle Warrior Defense Stance
    toggleDefenseStance() {
        const p = this.getActivePlayer();
        if (p.class !== "戰士") return { error: "只有戰士能進入防禦姿態" };
        p.defenseStance = !p.defenseStance;
        this.addLog(`${p.name} ${p.defenseStance ? "進入" : "解除了"}防禦姿態。`, "system");
        return this.getStateDict();
    }

    // Toggle Black Mage Magic Burst
    toggleMagicBurst() {
        const p = this.getActivePlayer();
        if (p.class !== "黑魔法師") return { error: "只有黑魔法師能使用魔法爆發" };
        if (p.mp < 5) return { error: "魔力不足 5 MP，無法開啟魔法爆發" };
        p.magicBurst = !p.magicBurst;
        this.addLog(`${p.name} ${p.magicBurst ? "開啟" : "關閉"}了魔法爆發預備。`, "system");
        return this.getStateDict();
    }

    // White Mage Holy Cure
    holyCure(targetIndex) {
        const p = this.getActivePlayer();
        if (p.class !== "白魔法師") return { error: "只有白魔法師能施放聖光治癒" };
        if (p.mp < 3) return { error: "魔力不足 3 MP" };
        const target = this.players[targetIndex];
        if (target.isDead) return { error: "無法治療已死亡的玩家" };

        p.mp -= 3;
        const heal = this.rollDice("1d8", true) + 3;
        target.hp = Math.min(target.maxHp, target.hp + heal);
        
        this.addLog(`✨ ${p.name} 消耗 3 MP 施放「聖光治癒」，回復了 ${target.name} ${heal} HP！`, "system");
        return this.getStateDict();
    }

    // White Mage Divine Shield
    divineShield() {
        const p = this.getActivePlayer();
        if (p.class !== "白魔法師") return { error: "只有白魔法師能施放神聖庇護" };
        if (p.mp < 8) return { error: "魔力不足 8 MP" };
        
        p.mp -= 8;
        this.players.forEach(player => {
            if (!player.isDead) {
                const heal = this.rollDice("1d6", true);
                player.hp = Math.min(player.maxHp, player.hp + heal);
                this.addLog(`✨ ${player.name} 獲得神聖庇護，回復了 ${heal} HP。`, "system");
            }
        });
        return this.getStateDict();
    }

    // Sniper Double Shot
    toggleDoubleShot() {
        const p = this.getActivePlayer();
        if (p.class !== "狙獵手") return { error: "只有狙獵手可宣告連射" };
        p.doubleShot = !p.doubleShot;
        this.addLog(`${p.name} ${p.doubleShot ? "宣告" : "取消"}了連射姿態。`, "system");
        return this.getStateDict();
    }

    // Sniper Aim
    toggleAiming() {
        const p = this.getActivePlayer();
        if (p.class !== "狙獵手") return { error: "只有狙獵手可使用精準瞄準" };
        p.aiming = !p.aiming;
        this.addLog(`${p.name} ${p.aiming ? "開始" : "取消"}蓄力精準瞄準。`, "system");
        return this.getStateDict();
    }

    // Pirate Blast
    pirateBlast() {
        const p = this.getActivePlayer();
        if (p.class !== "火炮海盜") return { error: "只有火炮海盜能使用範圍爆破" };
        if (this.turnState !== "combat" || !this.activeCombat) return { error: "必須在戰鬥中使用" };

        const dmg = this.rollDice("2d8", true);
        this.activeCombat.monsters.forEach(m => {
            if (m.hp > 0) {
                m.hp = Math.max(0, m.hp - dmg);
                this.activeCombat.combat_logs.push(`💥 範圍爆破對 ${m.name} 造成了 ${dmg} 群傷！ (無視防禦)`);
                if (m.name === this.boss.name) this.boss.hp = m.hp;
            }
        });

        // 20% self-damage check
        if (Math.random() < 0.20) {
            const selfDmg = this.rollDice("1d6", true);
            p.hp = Math.max(0, p.hp - selfDmg);
            this.activeCombat.combat_logs.push(`⚠️ 爆破反噬！${p.name} 自己也受到了 ${selfDmg} 點自傷！`);
        }

        // Check if combat won
        const living = this.activeCombat.monsters.filter(m => m.hp > 0);
        if (living.length === 0) {
            this.resolveCombatWin();
        }
        return this.getStateDict();
    }

    // Pirate Double Barrel
    toggleDoubleBarrel() {
        const p = this.getActivePlayer();
        if (p.class !== "火炮海盜") return { error: "只有火炮海盜能使用雙管齊發" };
        p.doubleBarrel = !p.doubleBarrel;
        this.addLog(`${p.name} ${p.doubleBarrel ? "預備" : "取消"}了雙管齊發攻擊。`, "system");
        return this.getStateDict();
    }

    fateExecutePassive() {
        if (this.turnState !== "fate" || !this.activeFate) return { error: "無作用卡牌" };
        const activePlayer = this.getActivePlayer();
        const card = this.activeFate.card;
        
        // Execute JS logic based on Card ID / Title
        const cNum = card.n || card.id;
        
        if (this.activeFate.isChance) {
            this.applyChanceCard(cNum, activePlayer);
        } else {
            this.applyFateCard(cNum, activePlayer);
        }

        this.activeFate = null;
        this.turnState = "action";
        return this.getStateDict();
    }

    applyChanceCard(n, player) {
        if (n === 1) {
            player.coins += 8;
            this.addLog(`💰 機會：${player.name} 獲得 $8 金幣。`, "system");
        } else if (n === 2) {
            player.tempMoveBonus = 3;
            this.addLog(`🏃 機會：順風而行，下回合移動加 3 格。`, "system");
        } else if (n === 3) {
            player.doubleChestReward = true; // custom flag for double chest reward
            this.addLog(`🎁 機會：獲得藏寶圖碎片，下次過寶藏格獎勵加倍！`, "system");
        } else if (n === 4) {
            const items = GAME_CONFIG.shopItems.filter(it => it.price === 5);
            const choice = randInt(0, items.length - 1);
            player.inventory.push({ name: items[choice].name, desc: items[choice].effect, effect: items[choice].effectKey });
            this.addLog(`🛒 機會：獲得一件免費的 $5 道具【${items[choice].name}】！`, "system");
        } else if (n === 5) {
            player.skipTurns = 1;
            this.addLog(`🚫 機會：武器保養，下回合跳過行動。`, "system");
        } else if (n === 6) {
            // Find next shop position
            let nextShop = player.position;
            for (let i = player.position + 1; i < this.board.length; i++) {
                if (this.board[i].type === "shop") {
                    nextShop = i;
                    break;
                }
            }
            player.position = nextShop;
            this.addLog(`🏃 機會：抄近路！直接抵達下一個商店格 (第 ${nextShop} 格)。`, "system");
        } else if (n === 7) {
            // Trade card
            if (player.inventory.length > 0) {
                player.inventory.pop();
                player.coins += 12;
                this.addLog(`🛒 機會：與商隊交易，賣出一件道具換取 $12 金幣。`, "system");
            } else {
                this.addLog(`🛒 機會：沒有任何道具可以跟商隊交易。`, "system");
            }
        } else if (n === 8) {
            player.coins += 6;
            const items = GAME_CONFIG.shopItems.filter(it => it.price === 5);
            const it = choice(items);
            player.inventory.push({ name: it.name, desc: it.effect, effect: it.effectKey });
            this.addLog(`🏹 機會：狩獵成功，獲得 $6 金幣及【${it.name}】！`, "system");
        } else if (n === 9) {
            const roll = randInt(1, 6);
            if (roll <= 3) {
                player.hp = Math.min(player.maxHp, player.hp + 5);
                this.addLog(`💧 機會：泉水甘甜，回復 5 HP。`, "system");
            } else {
                player.skipTurns = 1;
                this.addLog(`🤢 機會：泉水有毒！跳過下一回合。`, "system");
            }
        } else if (n === 10) {
            // teleport to any visited cell
            player.position = Math.max(0, player.position - 5);
            this.addLog(`🌀 機會：傳送陣發光，回溯傳送至第 ${player.position} 格。`, "system");
        } else if (n === 11) {
            // Attack right player
            const right = this.players[(this.activePlayerIndex + 1) % this.players.length];
            if (!right.isDead) {
                right.coins = Math.max(0, right.coins - 5);
                player.coins += 5;
                this.addLog(`⚔️ 機會：背後偷襲！搶走 ${right.name} $5 金幣。`, "system");
            }
        } else if (n === 15) {
            const gold = randInt(1, 4) * 2;
            player.coins += gold;
            this.addLog(`💰 機會：幸運降臨，獲得 $${gold} 金幣！`, "system");
        } else if (n === 17) {
            const backtrack = randInt(1, 6);
            player.position = Math.max(0, player.position - backtrack);
            this.addLog(`迷路了！退後了 ${backtrack} 格。`, "system");
        } else if (n === 20) {
            player.coins += 10;
            this.addLog(`💰 機會：拾獲錢包，得到 $10 金幣。`, "system");
        } else if (n === 23) {
            this.players.forEach(p => {
                if (!p.isDead) p.hp = Math.min(p.maxHp, p.hp + 3);
            });
            this.addLog(`🥖 機會：乾糧分享，全體玩家各回復 3 HP。`, "system");
        } else if (n === 31) {
            // shadow thread
            player.inventory.push({ name: "影子絲線陷阱", desc: "無法在商店購買的陷阱", effect: "trap", isTrap: true });
        } else if (n === 32) {
            player.inventory.push({ name: "命運封印陣陷阱", desc: "命運封印陷阱", effect: "trap", isTrap: true });
        } else if (n === 33) {
            player.inventory.push({ name: "逆流時沙陷阱", desc: "時間逆流陷阱", effect: "trap", isTrap: true });
        } else if (n === 34) {
            player.inventory.push({ name: "幽靈鎖鏈陷阱", desc: "幽靈鎖鍊陷阱", effect: "trap", isTrap: true });
        } else if (n === 35) {
            player.inventory.push({ name: "神明之眼印記陷阱", desc: "透明化行動陷阱", effect: "trap", isTrap: true });
        } else if (n === 39) {
            this.isDay = false;
            this.roundInDay = 2;
            this.addLog(`🌅 機會：日蝕之令！天空瞬間入夜！`, "system");
        } else if (n === 40) {
            this.isDay = true;
            this.roundInDay = 1;
            this.addLog(`🌅 機會：黎明令！太陽破曉！`, "system");
        } else if (n === 42) {
            this.boss.hp = Math.max(0, this.boss.hp - 15);
            this.addLog(`👑 機會：先鋒斥候回報！對最終 BOSS 預先累積造成了 15 點傷害！`, "system");
        } else if (n === 44) {
            this.boss.hp = Math.max(0, this.boss.hp - 25);
            this.addLog(`👑 機會：古代封印碎裂！對最終 BOSS 預先累積造成了 25 點傷害！`, "system");
        } else if (n === 46) {
            this.mysteriousShopActive = true;
            this.addLog(`🛒 召喚神秘商人！可在商店介面使用不受 SL 限制的超級商店！`, "system");
        } else {
            // General chance card fallback
            player.coins += 5;
            this.addLog(`💰 機會：得到 $5 金幣。`, "system");
        }
    }

    applyFateCard(n, player) {
        if (n === 1) {
            this.addLog(`💀 命運：上古詛咒降臨，最強道具失效。`, "system");
        } else if (n === 2) {
            const items = GAME_CONFIG.shopItems.filter(it => it.price <= 15);
            const it = choice(items);
            player.inventory.push({ name: it.name, desc: it.effect, effect: it.effectKey });
            this.addLog(`🎁 命運：免費抽取獲得道具【${it.name}】！`, "system");
        } else if (n === 3) {
            const steps = randInt(1, 4);
            this.players.forEach(p => {
                if (!p.isDead) p.position = Math.max(0, p.position - steps);
            });
            this.addLog(`🌋 命運：地震爆發！全體玩家退後 ${steps} 格！`, "system");
        } else if (n === 4) {
            player.coins += 15;
            this.addLog(`🌀 命運：時間逆流！獲得 $15 金幣。`, "system");
        } else if (n === 7) {
            this.players.forEach(p => {
                if (!p.isDead) p.coins = Math.max(0, p.coins - 3);
            });
            this.addLog(`🤮 命運：瘟疫蔓延，所有存活玩家失去 $3 金幣治療費用！`, "system");
        } else if (n === 8) {
            const targets = this.players.filter(p => !p.isDead && p.id !== player.id);
            if (targets.length) {
                const t = choice(targets);
                const oldPos = player.position;
                player.position = t.position;
                t.position = oldPos;
                this.addLog(`🔄 命運之輪轉動！${player.name} 與 ${t.name} 強制交換了地圖位置！`, "system");
            }
        } else if (n === 10) {
            this.addLog(`🐉 命運：惡龍陰影籠罩，下回合全體禁止使用道具！`, "system");
        } else if (n === 15) {
            player.hp = player.maxHp;
            this.addLog(`💖 命運：天使降臨！生命值完全補滿。`, "system");
        } else if (n === 17) {
            // Extra turn logic
            this.activePlayerIndex = (this.activePlayerIndex - 1 + this.players.length) % this.players.length;
            if (this.activePlayerIndex === this.players.length - 1) this.turnCount--;
            this.addLog(`⏳ 命運：時間靜止！額外獲得一個回合！`, "system");
        } else if (n === 41) {
            this.isDay = false;
            this.roundInDay = 2;
            this.addLog(`🌅 命運：強制夜幕降臨！`, "system");
        } else if (n === 42) {
            this.isDay = true;
            this.roundInDay = 1;
            this.addLog(`🌅 命運：黎明聖光！強制白天！`, "system");
        } else if (n === 45) {
            this.boss.hp = Math.max(0, this.boss.hp - 30);
            player.coins = Math.max(0, player.coins - 10);
            this.addLog(`👑 命運：世界的裂縫！以 $10 金幣為代價，對最終 BOSS 預先累積造成了 30 點傷害！`, "system");
        } else {
            player.coins += 5;
            this.addLog(`💰 命運：獲得 $5 金幣。`, "system");
        }
    }

    fateRollChallenge() {
        if (this.turnState !== "fate" || !this.activeFate) return { error: "目前無命運挑戰" };
        const activePlayer = this.getActivePlayer();
        const card = this.activeFate.card;
        const rollVal = randInt(1, 20);
        let success = false;
        let resultMsg = "";

        if (card.title === "陷阱升級挑戰" || card.title === "命運的淬鍊") {
            success = rollVal >= 12;
            if (success) {
                const myTraps = this.traps.filter(t => t.ownerIndex === this.activePlayerIndex);
                if (myTraps.length) {
                    const t = myTraps[0];
                    t.damage = Math.floor(t.damage * 1.5);
                    t.goldTransfer = Math.floor(t.goldTransfer * 1.5);
                    t.level++;
                    resultMsg = `淬鍊成功！${activePlayer.name} 的 ${t.type} 升級為等級 ${t.level}。`;
                } else {
                    resultMsg = `成功！但您目前無已設置陷阱。`;
                }
            } else {
                resultMsg = `失敗！已設置的陷阱能量消散消失！`;
                this.traps = this.traps.filter(t => t.ownerIndex !== this.activePlayerIndex);
            }
        } else if (card.title === "命運的腐蝕") {
            success = rollVal >= 10;
            if (success) {
                const targets = this.traps.filter(t => t.ownerIndex !== this.activePlayerIndex);
                if (targets.length) {
                    const t = targets[0];
                    t.damage = Math.max(1, Math.floor(t.damage / 1.5));
                    t.goldTransfer = Math.max(1, Math.floor(t.goldTransfer / 1.5));
                    t.level = Math.max(1, t.level - 1);
                    resultMsg = `成功腐蝕！${this.players[t.ownerIndex].name} 的陷阱降為等級 ${t.level}。`;
                } else {
                    resultMsg = `成功！但目前場上無敵方陷阱。`;
                }
            } else {
                resultMsg = `失敗！腐蝕效果反彈！您自己的陷阱降級！`;
            }
        } else if (card.title === "命運終極挑戰" || card.title === "終極試煉") {
            success = rollVal >= 14;
            if (success) {
                activePlayer.victoryPoints += 2;
                resultMsg = `挑戰成功！獲得 +2 勝利點數！`;
            } else {
                activePlayer.hp = Math.max(0, activePlayer.hp - 5);
                resultMsg = `挑戰失敗！扣除 5 HP。`;
                if (activePlayer.hp <= 0) {
                    this.activeFate = null;
                    this.handlePlayerDeath();
                    return this.getStateDict();
                }
            }
        } else {
            success = rollVal >= 11;
            resultMsg = success ? "判定成功！" : "判定失敗。";
        }

        this.activeFate.challenge_rolled = true;
        this.activeFate.challenge_success = success;
        this.activeFate.result_msg = resultMsg;
        
        this.addLog(`【命運判定】D20 擲出 ${rollVal}：${resultMsg}`, "system");
        return this.getStateDict();
    }

    closeFateCard() {
        this.activeFate = null;
        this.turnState = "action";
        return this.getStateDict();
    }

    endTurn() {
        if (this.turnState !== "action") return { error: "無法在此狀態結束回合" };

        // Handle cooldowns & temporary states at turn end
        const activePlayer = this.getActivePlayer();
        activePlayer.defenseStance = false; // reset stance
        this.currentShop = null; // reset current shop
        this.mysteriousShopActive = false; // reset mysterious shop summon

        while (true) {
            this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
            if (this.activePlayerIndex === 0) {
                this.turnCount++;
                // Flip day/night
                this.isDay = !this.isDay;
                this.roundInDay = this.isDay ? 1 : 2;
                
                if (this.isDay) {
                    this.day++;
                    this.addLog(`🌅 第 ${this.day} 天白天來臨了，光明普照！`, "system");
                    
                    // Run pocket checks for all alive players
                    this.players.forEach(p => {
                        if (!p.isDead) {
                            const hasPocket = p.inventory.some(i => i.name === "次元口袋" || i.effect === "bag_infinite");
                            if (hasPocket) {
                                if (!p.pocketAcquiredDay) {
                                    p.pocketAcquiredDay = this.day - 1; // backdate if not set
                                }
                                const daysHeld = this.day - p.pocketAcquiredDay;
                                if (daysHeld >= 5) {
                                    this.runPocketDisappearCheck(p, daysHeld);
                                }
                            } else {
                                p.pocketAcquiredDay = null;
                            }
                        }
                    });
                } else {
                    this.addLog(`🌃 第 ${this.day} 天黑夜來臨，怪物被虛空喚醒！`, "system");
                }
            }
            if (!this.players[this.activePlayerIndex].isDead) break;
        }

        // Apply bleeding for next player if they start turn in dying state
        const nextPlayer = this.getActivePlayer();
        if (nextPlayer.isDying && !nextPlayer.bleedingStopped) {
            const bleed = Math.max(1, Math.floor(nextPlayer.maxHp * 0.05));
            // Bleeding doesn't drop them below 0, but check revival
            this.addLog(`🩹 瀕死流血：${nextPlayer.name} 回合開始流血失去 ${bleed} HP。`, "system");
        }

        this.turnState = "roll";
        this.addLog(`輪到 ${nextPlayer.name} 的回合。請擲骰移動！`, "system");
        return this.getStateDict();
    }

    runPocketDisappearCheck(player, daysHeld) {
        if (!player.inventory.length) return;
        
        // 1. Roll D20
        const d20 = randInt(1, 20);
        let rollVal = d20;
        
        // 2. Roll additional dice if inventory length > 20 and D20 is 20
        if (player.inventory.length > 20 && d20 === 20) {
            if (player.inventory.length <= 24) {
                rollVal += randInt(1, 4); // D4
            } else if (player.inventory.length <= 26) {
                rollVal += randInt(1, 6); // D6
            } else {
                rollVal += randInt(1, 8); // D8
            }
        }
        
        // Find maximum pocketId in inventory
        const maxPocketId = Math.max(...player.inventory.map(i => i.pocketId || 0));
        
        let removedIdx = -1;
        
        if (rollVal > maxPocketId) {
            // Find the item with maximum pocketId and remove it
            removedIdx = player.inventory.findIndex(i => i.pocketId === maxPocketId);
        } else {
            // Find the item with exact pocketId
            removedIdx = player.inventory.findIndex(i => i.pocketId === rollVal);
        }
        
        if (removedIdx !== -1) {
            const item = player.inventory[removedIdx];
            player.inventory.splice(removedIdx, 1);
            this.addLog(`🎒 次元口袋不穩定！${player.name} 已持有口袋 ${daysHeld} 天。擲骰判定結果為：編號 ${rollVal}。道具【${item.name}】掉入虛空消失了！`, "system");
        } else {
            this.addLog(`🎒 次元口袋不穩定！${player.name} 已持有口袋 ${daysHeld} 天。擲骰判定結果為：編號 ${rollVal} (該編號已空)，無道具消失。`, "system");
        }
    }

    enterShop() {
        const activePlayer = this.getActivePlayer();
        const tile = this.board[activePlayer.position];
        if (tile.type !== "shop" && !this.mysteriousShopActive) {
            return { error: "不在商店格上" };
        }
        
        // If shop is already initialized for this position and turn, don't re-initialize
        if (this.currentShop && this.currentShop.tileIndex === activePlayer.position && this.currentShop.turn === this.turnCount && !this.mysteriousShopActive) {
            return this.getStateDict();
        }
        
        // Generate shop inventory
        const sl = this.mysteriousShopActive ? 6 : this.rollShopLevel(tile.terrain);
        const shopInventory = this.generateShopInventory(sl, tile.terrain);
        
        this.currentShop = {
            tileIndex: activePlayer.position,
            turn: this.turnCount,
            sl: sl,
            items: shopInventory.items,
            specialType: shopInventory.specialType || "normal", // "normal", "snow_volcano_discount", "fortress_primary_blind", "fortress_legendary_discount"
            freePicksRemaining: shopInventory.freePicksRemaining || 0,
            hasPickedFree: false
        };
        
        return this.getStateDict();
    }

    rollShopLevel(terrain) {
        const roll = randInt(1, 100);
        if (terrain === "新手村周邊") {
            return roll <= 85 ? 1 : 2;
        } else if (terrain === "森林" || terrain === "沼澤") {
            return roll <= 20 ? 1 : (roll <= 80 ? 2 : 3);
        } else if (terrain === "雪山" || terrain === "火山") {
            return roll <= 5 ? 1 : (roll <= 25 ? 2 : (roll <= 90 ? 3 : 4));
        } else {
            // fortress
            return roll <= 2 ? 1 : (roll <= 10 ? 2 : (roll <= 40 ? 5 : 6));
        }
    }

    generateShopInventory(sl, terrain) {
        const itemsPool = GAME_CONFIG.shopItems;
        const items = [];
        
        const getItems = (price, count) => {
            const sub = itemsPool.filter(i => i.price === price);
            for (let i = 0; i < count && sub.length; i++) {
                const idx = randInt(0, sub.length - 1);
                items.push({
                    ...sub[idx],
                    isFree: false,
                    isBlind: false,
                    originalPrice: sub[idx].price
                });
                sub.splice(idx, 1);
            }
        };

        // Populate items based on SL level
        if (sl === 1) {
            getItems(5, 4); getItems(8, 1);
        } else if (sl === 2) {
            getItems(5, 3); getItems(8, 1); getItems(10, 1);
        } else if (sl === 3) {
            getItems(5, 4); getItems(8, 2); getItems(10, 1); getItems(15, 1);
        } else if (sl === 4) {
            getItems(5, 3); getItems(8, 3); getItems(10, 2); getItems(15, 2);
        } else if (sl === 5) {
            getItems(5, 4); getItems(8, 3); getItems(10, 3); getItems(15, 1); getItems(25, 1);
        } else if (sl === 6) {
            getItems(5, 3); getItems(8, 3); getItems(10, 3); getItems(15, 3); getItems(25, 1); getItems(40, 1);
        }
        
        let specialType = "normal";
        let freePicksRemaining = 0;
        
        // 1. 雪山/火山出現初級商店 (SL1) - 5%機率
        if ((terrain === "雪山" || terrain === "火山") && sl === 1) {
            specialType = "snow_volcano_discount";
            const roll = randInt(1, 6);
            if (roll === 4 || roll === 5) {
                // 1 random item free
                const idx = randInt(0, items.length - 1);
                items[idx].isFree = true;
                items[idx].price = 0;
                freePicksRemaining = 1;
            } else if (roll === 6) {
                // 2 random items free
                const idxs = [];
                while (idxs.length < 2) {
                    const idx = randInt(0, items.length - 1);
                    if (!idxs.includes(idx)) idxs.push(idx);
                }
                idxs.forEach(idx => {
                    items[idx].isFree = true;
                    items[idx].price = 0;
                });
                freePicksRemaining = 2;
            }
        }
        
        // 2. 最終要塞出現初級商店 (SL1) - 2%機率
        else if (terrain === "最終要塞" && sl === 1) {
            specialType = "fortress_primary_blind";
            freePicksRemaining = 2;
            // All items become free, but they are BLIND (hidden quality/identity)
            items.forEach((item, idx) => {
                item.isFree = true;
                item.price = 0;
                item.isBlind = true;
                item.blindLabel = `神秘道具 ${String.fromCharCode(65 + idx)}`; // 神秘道具 A, B, C...
            });
        }
        
        // 3. 最終要塞出現傳說商店 (SL6) - 60%機率
        else if (terrain === "最終要塞" && sl === 6) {
            specialType = "fortress_legendary_discount";
            const roll = randInt(1, 6);
            let freeCount = 0;
            if (roll === 3 || roll === 4) freeCount = 1;
            else if (roll === 5 || roll === 6) freeCount = 2;
            
            if (freeCount > 0) {
                // Roll price tiers for free items
                const slotsToReplace = [];
                while (slotsToReplace.length < freeCount) {
                    const idx = randInt(0, items.length - 1);
                    if (!slotsToReplace.includes(idx)) slotsToReplace.push(idx);
                }
                
                slotsToReplace.forEach(idx => {
                    const tierRoll = randInt(1, 6);
                    let tierPrice = 15;
                    if (tierRoll === 3 || tierRoll === 4) tierPrice = 25;
                    else if (tierRoll === 5 || tierRoll === 6) tierPrice = 40;
                    
                    const pool = itemsPool.filter(i => i.price === tierPrice);
                    if (pool.length) {
                        const randomItem = choice(pool);
                        items[idx] = {
                            ...randomItem,
                            isFree: true,
                            price: 0,
                            isFreeOption: true,
                            originalPrice: tierPrice
                        };
                    }
                });
                freePicksRemaining = 1; // can only take 1 for free, other reverts to original
            }
        }
        
        return { items, specialType, freePicksRemaining };
    }

    buyItem(itemName) {
        const activePlayer = this.getActivePlayer();
        
        if (!this.currentShop) {
            return { error: "尚未進入商店" };
        }
        
        // Find the item in current shop
        const itemIdx = this.currentShop.items.findIndex(it => (it.isBlind ? it.blindLabel : it.name) === itemName);
        if (itemIdx === -1) {
            return { error: "商店中無此商品" };
        }
        
        const shopItem = this.currentShop.items[itemIdx];
        let finalPrice = shopItem.price;
        
        if (activePlayer.coins < finalPrice) {
            return { error: "金幣不足" };
        }
        
        const hasPocket = activePlayer.inventory.some(i => i.name === "次元口袋" || i.effect === "bag_infinite");
        const bagLimit = hasPocket ? 999 : 10;
        if (activePlayer.inventory.length >= bagLimit) {
            return { error: `揹包容量已滿 (上限 ${bagLimit} 格)！` };
        }
        
        // Deduct coins
        activePlayer.coins -= finalPrice;
        
        let acquiredItem = {
            name: shopItem.name,
            desc: shopItem.effect || shopItem.desc,
            effect: shopItem.effectKey || "passive",
            isTrap: !!shopItem.isTrap || shopItem.effectKey === "trap"
        };
        
        // Handle special fortress blind quality rolling
        if (shopItem.isBlind) {
            const roll = randInt(1, 6);
            const baseName = shopItem.name;
            const baseDesc = shopItem.effect || shopItem.desc;
            
            if (roll <= 2) {
                // Cursed
                acquiredItem.cursed = true;
                acquiredItem.name = "【詛咒】" + baseName;
                acquiredItem.desc = "[詛咒削弱] " + baseDesc;
            } else if (roll <= 4) {
                // Normal
                acquiredItem.name = baseName;
                acquiredItem.desc = baseDesc;
            } else if (roll === 5) {
                // Awakened
                acquiredItem.awakened = true;
                acquiredItem.name = "【覺醒】" + baseName;
                acquiredItem.desc = "[覺醒強化] " + baseDesc;
            } else {
                // Legendary
                const legendaries = GAME_CONFIG.shopItems.filter(i => i.price === 40);
                if (legendaries.length) {
                    const leg = choice(legendaries);
                    acquiredItem.name = leg.name;
                    acquiredItem.desc = leg.effect;
                    acquiredItem.effect = leg.effectKey;
                    acquiredItem.isTrap = !!leg.isTrap || leg.effectKey === "trap";
                }
            }
            this.addLog(`🎁 探索神秘道具！揭曉為：【${acquiredItem.name}】！`, "system");
        }
        
        // Add to inventory
        this.inventory = this.inventory || [];
        activePlayer.inventory.push(acquiredItem);
        this.addLog(`${activePlayer.name} 購買了【${acquiredItem.name}】。`, "system");
        
        // Handle free picks and discount structures
        if (shopItem.isFree) {
            this.currentShop.freePicksRemaining--;
            
            // For fortress primary blind: after 2 picks, clear the rest
            if (this.currentShop.specialType === "fortress_primary_blind") {
                if (this.currentShop.freePicksRemaining <= 0) {
                    this.currentShop.items = [];
                }
            }
            
            // For fortress legendary discount: restore other free options to original price
            else if (this.currentShop.specialType === "fortress_legendary_discount") {
                this.currentShop.items.forEach(it => {
                    if (it.isFreeOption) {
                        it.isFree = false;
                        it.price = it.originalPrice;
                    }
                });
            }
        }
        
        // Remove item from shelf if shop isn't completely cleared
        if (this.currentShop.items.length) {
            this.currentShop.items.splice(itemIdx, 1);
        }
        
        return this.getStateDict();
    }

    buyDeathShopItem(idx) {
        const activePlayer = this.getActivePlayer();
        if (idx < 0 || idx >= this.deathShopItems.length) return { error: "無效的商品索引" };
        const item = this.deathShopItems[idx];
        if (activePlayer.coins < item.price) return { error: "金幣不足" };
        
        const hasPocket = activePlayer.inventory.some(i => i.name === "次元口袋" || i.effect === "bag_infinite");
        const bagLimit = hasPocket ? 999 : 10;
        if (!item.isGoldBag && !item.isCard && activePlayer.inventory.length >= bagLimit) {
            return { error: `揹包容量已滿 (上限 ${bagLimit} 格)！` };
        }
        
        activePlayer.coins -= item.price;
        if (item.isCard) {
            activePlayer.heldCards.push(item.cardData);
        } else if (item.isGoldBag) {
            activePlayer.coins += item.goldAmount;
        } else {
            activePlayer.inventory.push({
                ...item,
                price: undefined // clear temporary shop price
            });
        }
        this.deathShopItems.splice(idx, 1);
        this.addLog(`${activePlayer.name} 從死亡商店購買了遺物【${item.name}】！`, "shop");
        return this.getStateDict();
    }

    sellMaterial(materialName) {
        const activePlayer = this.getActivePlayer();
        if ((activePlayer.materials[materialName] || 0) <= 0) return { error: "素材不足" };

        const price = GAME_CONFIG.materials[materialName].price;
        activePlayer.materials[materialName]--;
        activePlayer.coins += price;
        
        this.addLog(`${activePlayer.name} 出售了 1 個【${materialName}】，獲得 $${price} 金幣。`, "system");
        return this.getStateDict();
    }

    craftItem(recipeName, recipeLevel) {
        const activePlayer = this.getActivePlayer();
        const recipes = GAME_CONFIG.recipes[recipeLevel] || [];
        const recipe = recipes.find(r => r.name === recipeName);
        if (!recipe) return { error: "找不到該配方" };

        for (const [ing, qty] of Object.entries(recipe.ingredients)) {
            if ((activePlayer.materials[ing] || 0) < qty) {
                return { error: `素材【${ing}】不足` };
            }
        }

        // Consume mats
        for (const [ing, qty] of Object.entries(recipe.ingredients)) {
            activePlayer.materials[ing] -= qty;
        }

        if (recipe.resultType === "item") {
            activePlayer.inventory.push({
                name: recipe.resultVal.name,
                desc: recipe.resultVal.desc,
                effect: recipe.resultVal.effect
            });
            this.addLog(`【合成】${activePlayer.name} 成功合成了【${recipe.resultVal.name}】！`, "craft");
        } else if (recipe.resultType === "trap") {
            activePlayer.inventory.push({
                name: recipe.name,
                desc: recipe.resultVal.desc,
                effect: "trap",
                isTrap: true
            });
            this.addLog(`【合成】${activePlayer.name} 成功合成了陷阱【${recipe.name}】！`, "craft");
        } else if (recipe.resultType === "random_low") {
            const lowItems = GAME_CONFIG.shopItems.filter(i => i.price === 5);
            const it = choice(lowItems);
            activePlayer.inventory.push({ name: it.name, desc: it.effect, effect: it.effectKey });
            this.addLog(`【合成】${activePlayer.name} 合成了隨機初級道具【${it.name}】！`, "craft");
        }
        return this.getStateDict();
    }

    placeTrap(trapName) {
        const activePlayer = this.getActivePlayer();
        if (activePlayer.activeTrapsCount >= 2) return { error: "您同時最多放置 2 個陷阱" };

        const idx = activePlayer.inventory.findIndex(it => it.name === trapName);
        if (idx === -1) return { error: "揹包中無此陷阱道具" };

        // Determine trap stats
        let damage = 3;
        let goldTransfer = 8;
        if (trapName.includes("爆炸")) { damage = 6; goldTransfer = 18; }
        else if (trapName.includes("詛咒")) { damage = 10; goldTransfer = 15; }
        else if (trapName.includes("黏液")) { damage = 2; goldTransfer = 8; }
        else if (trapName.includes("毒刺")) { damage = 5; goldTransfer = 12; }
        else if (trapName.includes("幻象")) { damage = 3; goldTransfer = 12; }
        else if (trapName.includes("流沙")) { damage = 4; goldTransfer = 18; }
        else if (trapName.includes("靈魂枷鎖")) { damage = 6; goldTransfer = 25; }
        else if (trapName.includes("捕獸")) { damage = 2; goldTransfer = 5; }

        this.traps.push({
            tileIndex: this.currentOccupiedTrapTile,
            ownerIndex: this.activePlayerIndex,
            type: trapName,
            damage: damage,
            goldTransfer: goldTransfer,
            level: 1
        });

        activePlayer.inventory.splice(idx, 1);
        activePlayer.activeTrapsCount++;
        
        this.addLog(`【設伏】${activePlayer.name} 在當前格子秘密設下了陷阱。`, "system");
        this.turnState = "action";
        return this.getStateDict();
    }

    useItem(itemIndex) {
        const activePlayer = this.getActivePlayer();
        if (itemIndex < 0 || itemIndex >= activePlayer.inventory.length) return { error: "無效道具索引" };

        const item = activePlayer.inventory[itemIndex];
        const effect = item.effect || "";

        if (effect.startsWith("heal")) {
            const amount = calcHealAmount(effect, this, activePlayer);
            activePlayer.hp = Math.min(activePlayer.maxHp, activePlayer.hp + amount);
            activePlayer.inventory.splice(itemIndex, 1);
            this.addLog(`${activePlayer.name} 使用了【${item.name}】，回復 ${amount} HP。`, "system");
        } else if (effect === "revive" || effect === "time_hourglass") {
            activePlayer.hp = Math.min(activePlayer.maxHp, activePlayer.hp + 10);
            activePlayer.inventory.splice(itemIndex, 1);
            this.addLog(`${activePlayer.name} 使用了【${item.name}】免死，HP 恢復 10。`, "system");
        } else if (effect === "eclipse") {
            this.isDay = false;
            this.roundInDay = 2;
            activePlayer.inventory.splice(itemIndex, 1);
            this.addLog(`🌑 ${activePlayer.name} 捏碎日蝕石！天空轉為黑夜！`, "system");
        } else if (effect === "dawn") {
            this.isDay = true;
            this.roundInDay = 1;
            activePlayer.inventory.splice(itemIndex, 1);
            this.addLog(`🌅 ${activePlayer.name} 捏碎黎明石！白夜重現！`, "system");
        } else if (effect === "stone_curse") {
            // Wait, applying curse requires targeting, handled via applyCurse
            return { error: "詛咒之銘刻需要指定目標" };
        } else if (effect === "stone_awake") {
            return { error: "覺醒之石需要指定道具" };
        } else {
            return { error: "此道具被動生效，無須直接使用" };
        }
        return this.getStateDict();
    }

    triggerGameOver(reason) {
        this.turnState = "gameover";
        this.addLog(`🏁 冒險結束：${reason}`, "system");

        const living = this.players.filter(p => !p.isDead);
        if (!living.length) return;

        // Rich settle +2 VP
        const maxCoins = Math.max(...living.map(p => p.coins));
        living.filter(p => p.coins === maxCoins).forEach(p => {
            p.victoryPoints += 2;
            this.addLog(`💰 結算加分：${p.name} 持有最多金幣 ($${p.coins})，獲得 +2 勝利點數！`, "system");
        });

        // Bag settle +1 VP
        const maxItems = Math.max(...living.map(p => p.inventory.length));
        living.filter(p => p.inventory.length === maxItems).forEach(p => {
            p.victoryPoints += 1;
            this.addLog(`🎒 結算加分：${p.name} 持有最多道具 (${p.inventory.length} 個)，獲得 +1 勝利點數！`, "system");
        });
    }

    useDetectItem() {
        const activePlayer = this.getActivePlayer();
        const itemIdx = activePlayer.inventory.findIndex(it => it.effect === "detect");
        if (itemIdx === -1) return { error: "沒有探測礦石棒" };

        activePlayer.inventory.splice(itemIdx, 1);
        const curPos = activePlayer.position;
        const scanTiles = [];
        for (let i = curPos + 1; i <= Math.min(curPos + 3, this.board.length - 1); i++) {
            scanTiles.push(i);
        }

        const trappedTiles = [];
        this.traps.forEach(t => {
            if (scanTiles.includes(t.tileIndex) && t.ownerIndex !== this.activePlayerIndex) {
                trappedTiles.push(t.tileIndex);
            }
        });

        if (trappedTiles.length) {
            this.addLog(`🔍 ${activePlayer.name} 使用探測礦石棒，偵測到前方 ${sorted(trappedTiles)} 格有陷阱！`, "system");
        } else {
            this.addLog(`🔍 ${activePlayer.name} 使用探測礦石棒，前方 3 格內無陷阱。`, "system");
        }

        const result = this.getStateDict();
        result.detectResult = { scannedTiles: scanTiles, trappedTiles };
        return result;
    }

    toggleGmMode() {
        this.gmMode = !this.gmMode;
        return this.getStateDict();
    }

    rollCustomDice(diceList) {
        const results = [];
        let total = 0;
        for (const die of diceList) {
            let sides = parseInt(die.type, 10) || 6;
            let count = Math.min(Math.max(parseInt(die.count, 10) || 1, 1), 100);
            if (![4, 6, 8, 10, 12, 20].includes(sides)) sides = 6;
            const rolls = Array.from({ length: count }, () => randInt(1, sides));
            const subtotal = rolls.reduce((a, b) => a + b, 0);
            results.push({ type: `D${sides}`, rolls, subtotal });
            total += subtotal;
        }
        return { results, total };
    }

    getStateDict() {
        // Run syncInventory on all players to dynamically allocate pocketIds
        if (this.players) {
            this.players.forEach(p => this.syncInventory(p));
        }

        const visibleTraps = this.traps.map(trap => ({
            tileIndex: trap.tileIndex,
            ownerIndex: trap.ownerIndex,
            type: trap.type,
            level: trap.level,
            damage: trap.damage,
            goldTransfer: trap.goldTransfer
        }));

        const leaderboard = this.players.map(p => ({
            id: p.id, name: p.name, class: p.class || "戰士", color: p.color,
            hp: p.hp, maxHp: p.maxHp, mp: p.mp || 0, maxMp: p.maxMp || 0,
            coins: p.coins, victoryPoints: p.victoryPoints,
            inventoryCount: p.inventory.length, isDead: p.isDead, isDying: p.isDying
        }));

        return {
            players: this.players,
            activePlayerIndex: this.activePlayerIndex,
            turnCount: this.turnCount,
            day: this.day,
            isDay: this.isDay,
            roundInDay: this.roundInDay,
            traps: visibleTraps,
            boss: {
                name: this.boss.name,
                hp: this.boss.hp,
                maxHp: this.boss.maxHp,
                atk: this.boss.atk,
                def: this.boss.def || 0,
                phases: this.boss.phases,
                dealtDamagePlayers: this.boss.dealtDamagePlayers
            },
            turnState: this.turnState,
            activeCombat: this.activeCombat,
            activeFate: this.activeFate,
            logMessages: this.logMessages,
            gmMode: this.gmMode,
            currentOccupiedTrapTile: this.currentOccupiedTrapTile,
            leaderboard,
            board: this.board,
            mapSettings: this.mapSettings,
            deathShopItems: this.deathShopItems,
            activeAuction: this.activeAuction,
            mysteriousShopActive: this.mysteriousShopActive,
            teleportBet: this.teleportBet,
            currentShop: this.currentShop
        };
    }

    saveToDict() {
        return {
            players: this.players,
            activePlayerIndex: this.activePlayerIndex,
            turnCount: this.turnCount,
            day: this.day,
            isDay: this.isDay,
            roundInDay: this.roundInDay,
            traps: this.traps,
            boss: this.boss,
            turnState: this.turnState,
            activeCombat: this.activeCombat,
            activeFate: this.activeFate,
            logMessages: this.logMessages,
            gmMode: this.gmMode,
            currentOccupiedTrapTile: this.currentOccupiedTrapTile,
            board: this.board,
            mapSettings: this.mapSettings,
            deathShopItems: this.deathShopItems,
            activeAuction: this.activeAuction,
            mysteriousShopActive: this.mysteriousShopActive,
            teleportBet: this.teleportBet,
            currentShop: this.currentShop
        };
    }

    loadFromDict(d) {
        this.players = d.players;
        this.activePlayerIndex = d.activePlayerIndex;
        this.turnCount = d.turnCount;
        this.day = d.day || 1;
        this.isDay = d.isDay !== false;
        this.roundInDay = d.roundInDay || 0;
        this.traps = d.traps;
        this.boss = d.boss;
        this.turnState = d.turnState;
        this.activeCombat = d.activeCombat;
        this.activeFate = d.activeFate;
        this.logMessages = d.logMessages;
        this.gmMode = d.gmMode || false;
        this.currentOccupiedTrapTile = d.currentOccupiedTrapTile ?? null;
        this.board = d.board || [];
        this.mapSettings = d.mapSettings || null;
        this.deathShopItems = d.deathShopItems || [];
        this.activeAuction = d.activeAuction || null;
        this.mysteriousShopActive = d.mysteriousShopActive || false;
        this.teleportBet = d.teleportBet || null;
        this.currentShop = d.currentShop || null;
        return this.getStateDict();
    }
}

const SAVE_KEY = "ttrpg_save";

function saveGame(engine) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(engine.saveToDict()));
    return { success: true, message: "Game saved successfully" };
}

function loadGame(engine) {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { error: "No save file found" };
    try {
        return engine.loadFromDict(JSON.parse(raw));
    } catch (e) {
        return { error: `Error loading game: ${e.message}` };
    }
}
