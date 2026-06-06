/* ==========================================================================
   TTRPG THIN CLIENT — game.js
   All logic runs in the browser via game-engine.js (no server/API)
   ========================================================================== */

const engine = new TTRPGEngine();
let CFG = GAME_CONFIG;
let GS = null;
let clientPos = {};
let animating = false;
let cardFlipped = false;
let dicePool = [];
let recipeTab = "low";

function applyState(result) {
    if (result && result.error) throw new Error(result.error);
    GS = result;
    return result;
}

window.addEventListener("DOMContentLoaded", () => {
    buildSetupScreen();
    bindGlobalEvents();
    const saved = loadGame(engine);
    if (!saved.error && saved.players && saved.players.length > 0) {
        GS = saved;
        GS.players.forEach(p => clientPos[p.id] = p.position);
        enterGame();
    }
});

function buildSetupScreen() {
    renderPlayerConfigs(2);
    document.querySelectorAll(".btn-count").forEach(btn =>
        btn.addEventListener("click", e => {
            document.querySelectorAll(".btn-count").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            renderPlayerConfigs(+e.currentTarget.dataset.count);
        })
    );

    // Bind setup map version selection (§1.8)
    document.querySelectorAll(".btn-map-version").forEach(btn => {
        btn.addEventListener("click", e => {
            document.querySelectorAll(".btn-map-version").forEach(b => {
                b.classList.remove("active");
                b.style.color = "var(--color-text-muted)";
            });
            e.currentTarget.classList.add("active");
            e.currentTarget.style.color = "white";
        });
    });

    // Bind setup difficulty selection (§1.8)
    document.querySelectorAll(".btn-difficulty").forEach(btn => {
        btn.addEventListener("click", e => {
            document.querySelectorAll(".btn-difficulty").forEach(b => {
                b.classList.remove("active");
                b.style.color = "var(--color-text-muted)";
            });
            e.currentTarget.classList.add("active");
            e.currentTarget.style.color = "white";
        });
    });
}

function renderPlayerConfigs(count) {
    const list = document.getElementById("player-config-list");
    list.innerHTML = "";
    const classOptions = Object.keys(CFG.classes || {}).map(c => `<option value="${c}">${c}</option>`).join("");

    for (let i = 0; i < count; i++) {
        const color = CFG.playerColors[i];
        const row = document.createElement("div");
        row.className = "player-config-row";
        row.innerHTML = `
            <span class="config-label" style="color:${color}">玩家 ${i + 1}</span>
            <input class="player-input-name" data-index="${i}" value="冒險者 ${i + 1}">
            <select class="player-input-class" data-index="${i}">${classOptions}</select>
            <select class="player-input-type" data-index="${i}">
                <option value="human">玩家</option>
                <option value="ai">電腦 (AI)</option>
            </select>
            <div class="color-picker-wrapper">
                <div class="color-dot-select" style="background:${color};border-color:white;box-shadow:0 0 5px ${color}"></div>
            </div>`;
        list.appendChild(row);
    }
}

function startGame() {
    const classSelects = document.querySelectorAll(".player-input-class");
    const typeSelects = document.querySelectorAll(".player-input-type");
    const players = [...document.querySelectorAll(".player-input-name")].map((inp, i) => ({
        name: inp.value.trim() || `冒險者 ${i + 1}`,
        color: CFG.playerColors[i % CFG.playerColors.length],
        class: classSelects[i] ? classSelects[i].value : "戰士",
        isAI: typeSelects[i] && typeSelects[i].value === "ai"
    }));

    // Read map options from UI (§1.8)
    const mapVersion = document.querySelector(".btn-map-version.active").dataset.version;
    const mapStyle = document.getElementById("map-style-select").value;
    const difficulty = document.querySelector(".btn-difficulty.active").dataset.diff;
    const endType = document.getElementById("end-type-select").value;

    const checkedTerrains = [...document.querySelectorAll(".terrain-checkbox:checked")].map(cb => cb.value);

    const mapSettings = {
        version: mapVersion,
        style: mapStyle,
        difficulty: difficulty,
        terrains: checkedTerrains,
        endType: endType
    };

    GS = engine.startGame(players, mapSettings);
    GS.players.forEach(p => clientPos[p.id] = 0);
    enterGame();
}

function enterGame() {
    document.getElementById("setup-screen").classList.remove("active");
    document.getElementById("game-screen").classList.add("active");

    // Apply map style class (§1.8)
    document.body.className = "skin-" + (GS.mapSettings.style || "parchment");

    buildBoard();
    updateUI();
}

function buildBoard() {
    const grid = document.getElementById("game-board");
    grid.innerHTML = "";
    if (!GS || !GS.board) return;

    const maxRow = Math.max(...GS.board.map(cell => cell.r));
    grid.style.gridTemplateRows = `repeat(${maxRow + 1}, 1fr)`;
    grid.style.gridTemplateColumns = `repeat(10, 1fr)`;

    GS.board.forEach((cell, idx) => {
        const el = document.createElement("div");
        el.className = `board-cell is-path cell-${cell.type}`;

        let terrainClass = "terrain-novice";
        if (cell.terrain === "最終要塞") terrainClass = "terrain-fortress";
        else if (cell.terrain === "火山") terrainClass = "terrain-volcano";
        else if (cell.terrain === "雪山") terrainClass = "terrain-snow";
        else if (cell.terrain === "沼澤") terrainClass = "terrain-swamp";
        else if (cell.terrain === "森林") terrainClass = "terrain-forest";
        el.classList.add(terrainClass);

        el.id = `cell-${idx}`;
        el.style.gridRow = cell.r + 1;
        el.style.gridColumn = cell.c + 1;

        const iconClass = CFG.tileIcons[cell.type] || "fa-tree";

        el.innerHTML = `
            <i class="fa-solid ${iconClass} cell-icon"></i>
            <span class="cell-label" style="font-size: 0.62rem;">${cell.label}</span>
            <div class="cell-tokens-container" id="tokens-${idx}"></div>`;

        grid.appendChild(el);
    });
}

function renderTokens() {
    if (!GS || !GS.board) return;
    GS.board.forEach((_, i) => {
        const tc = document.getElementById(`tokens-${i}`);
        if (tc) tc.innerHTML = "";
        const c = document.getElementById(`cell-${i}`);
        if (c) c.classList.remove("has-active-player");
    });

    GS.players.forEach((p, idx) => {
        if (p.isDead) return;
        const pos = clientPos[p.id] ?? p.position;
        const tc = document.getElementById(`tokens-${pos}`);
        if (tc) {
            const t = document.createElement("div");
            t.className = "player-token";
            t.style.backgroundColor = p.color;
            t.title = p.name;

            // If player is dying, give them a pulsing skull badge or styling
            if (p.isDying) {
                t.style.border = "2px dashed red";
                t.innerHTML = `<i class="fa-solid fa-skull" style="font-size:8px; color:white; display:block; text-align:center;"></i>`;
            }
            tc.appendChild(t);
        }
        if (idx === GS.activePlayerIndex) {
            const c = document.getElementById(`cell-${pos}`);
            if (c) c.classList.add("has-active-player");
        }
    });
}

function renderTraps() {
    document.querySelectorAll(".trap-indicator").forEach(e => e.remove());
    if (!GS || !GS.gmMode) return;
    GS.traps.forEach(t => {
        const c = document.getElementById(`cell-${t.tileIndex}`);
        if (c) {
            const d = document.createElement("div");
            d.className = "trap-indicator";
            d.innerHTML = `<i class="fa-solid fa-skull"></i> P${t.ownerIndex + 1}`;
            d.title = `${GS.players[t.ownerIndex].name} 的 ${t.type} (Lv.${t.level})`;
            c.appendChild(d);
        }
    });
}

function updateUI() {
    if (!GS) return;
    const p = GS.players[GS.activePlayerIndex];

    qs("#turn-counter").innerText = GS.turnCount;
    set("#active-player-banner", p.name, p.color);

    const timeIcon = GS.isDay ? '<i class="fa-solid fa-sun" style="color:var(--color-gold)"></i>' : '<i class="fa-solid fa-moon" style="color:#a855f7"></i>';
    const timeText = GS.isDay ? '白天' : '夜晚';
    const phaseRound = GS.roundInDay || (GS.isDay ? 1 : 2);
    qs("#day-night-indicator").innerHTML = `${timeIcon} 第 ${GS.day || 1} 天 ${timeText} <span style="opacity:0.7;font-size:0.85em">(回合 ${GS.turnCount} · 晝夜 ${phaseRound}/2)</span>`;

    const av = qs("#player-avatar-indicator");
    av.style.borderColor = p.color;
    av.style.boxShadow = `0 0 10px ${p.color}99`;
    av.querySelector(".avatar-char").innerText = p.name.slice(0, 2);

    // If active player is dying, update status visually
    if (p.isDying) {
        qs("#player-name-display").innerHTML = `${p.name} <span class="red-text">[瀕死掙扎]</span>`;
    } else {
        qs("#player-name-display").innerText = `${p.name} [${p.class || '戰士'}]`;
    }

    qs("#player-vp-display").innerText = `勝利點數: ${p.victoryPoints} VP`;
    qs("#player-hp-text").innerText = `${p.hp} / ${p.maxHp}`;
    qs("#player-hp-fill").style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;

    const maxMp = p.maxMp || 0;
    qs("#player-mp-text").innerText = `${p.mp || 0} / ${maxMp}`;
    qs("#player-mp-fill").style.width = maxMp > 0 ? `${Math.max(0, ((p.mp || 0) / maxMp) * 100)}%` : '0%';

    qs("#player-coins-display").innerText = `$${p.coins}`;
    qs("#player-buff-display").innerText = p.damageBuff ? "+25%" : "無";
    qs("#player-traps-count-display").innerText = `${p.activeTrapsCount}/2`;

    qs("#btn-gm-mode").innerHTML = GS.gmMode
        ? `<i class="fa-solid fa-eye"></i> 隱藏陷阱`
        : `<i class="fa-solid fa-eye-slash"></i> 顯示陷阱`;

    const ts = GS.turnState;
    qs("#btn-roll-move").disabled = (ts !== "roll" || p.isDying);
    qs("#btn-end-turn").disabled = (ts !== "action");

    const tile = GS.board[p.position] || { type: "normal" };
    const hasPortable = p.inventory.some(i => i.name === "可攜式合成台");
    qs("#btn-action-shop").disabled = !((tile.type === "shop" || GS.mysteriousShopActive) && ts === "action");
    qs("#btn-action-craft").disabled = !((tile.type === "synthesis" || hasPortable) && ts === "action");

    // Dynamic Class Skills Rendering (§4)
    renderClassSkills(p);

    renderInventory(p);
    renderMaterials(p);
    renderLogs(GS.logMessages);
    renderTokens();
    renderTraps();
    handleModals();

    let actingPlayer = p;
    if (GS.activeAuction) {
        actingPlayer = GS.players[GS.activeAuction.currentBidderIndex];
    }

    if (actingPlayer.isAI && !animating && GS.turnState !== "gameover") {
        setTimeout(runAI, 1000);
    }
}

function renderClassSkills(p) {
    const container = qs("#skills-buttons-container");
    container.innerHTML = "";

    if (p.isDying || p.isDead) {
        container.innerHTML = `<span style="grid-column: span 2; text-align:center; font-size:0.75rem; color:var(--color-crimson);">無法使用技能</span>`;
        return;
    }

    const skills = CFG.classes[p.class]?.skills || [];
    skills.forEach(skill => {
        const btn = document.createElement("button");
        btn.className = "btn-skill";
        btn.innerText = skill.name;
        btn.title = skill.desc;

        // Stance/toggle statuses checks
        if (skill.name === "防禦姿態" && p.defenseStance) btn.classList.add("active");
        if (skill.name === "魔法爆發" && p.magicBurst) btn.classList.add("active");
        if (skill.name === "連射" && p.doubleShot) btn.classList.add("active");
        if (skill.name === "精準瞄準" && p.aiming) btn.classList.add("active");
        if (skill.name === "雙管齊發" && p.doubleBarrel) btn.classList.add("active");

        btn.onclick = () => {
            if (skill.name === "防禦姿態") {
                doAction(() => engine.toggleDefenseStance());
            } else if (skill.name === "魔法爆發") {
                doAction(() => engine.toggleMagicBurst());
            } else if (skill.name === "聖光治癒") {
                // select target
                const allyOptions = GS.players.map((x, idx) =>
                    `<button class="btn-primary" onclick="triggerHolyCure(${idx})" style="padding:6px; margin:2px;">${x.name}</button>`
                ).join("");
                showToastHtml(`選擇施放對象：<div style='margin-top:6px;'>${allyOptions}</div>`);
            } else if (skill.name === "神神庇護" || skill.name === "神聖庇護") {
                doAction(() => engine.divineShield());
            } else if (skill.name === "連射") {
                doAction(() => engine.toggleDoubleShot());
            } else if (skill.name === "精準瞄準") {
                doAction(() => engine.toggleAiming());
            } else if (skill.name === "雙管齊發") {
                doAction(() => engine.toggleDoubleBarrel());
            } else if (skill.name === "範圍爆破") {
                doAction(() => engine.pirateBlast());
            }
        };

        container.appendChild(btn);
    });
}

function triggerHolyCure(idx) {
    try {
        applyState(engine.holyCure(idx));
        updateUI();
        hideToast();
    } catch (e) { alert(e.message); }
}

function renderInventory(p) {
    const ul = qs("#player-inventory-list");
    ul.innerHTML = "";
    if (!p.inventory.length) {
        ul.innerHTML = `<li class="empty-list-msg">空空如也</li>`; return;
    }
    p.inventory.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "item-row";
        let btnHtml = "";
        const eff = item.effect || "";

        if (eff === "detect") {
            btnHtml = `<button class="btn-use-item btn-detect" data-idx="${idx}">偵測</button>`;
        } else if (eff.startsWith("heal") || eff === "revive" || eff === "time_hourglass" || eff === "eclipse" || eff === "dawn") {
            btnHtml = `<button class="btn-use-item" data-idx="${idx}">使用</button>`;
        } else if (item.isTrap || eff === "trap") {
            btnHtml = `<span class="item-tag-trap">陷阱道具</span>`;
        } else if (eff.startsWith("atk_") || eff.startsWith("def_")) {
            btnHtml = `<span class="item-tag-passive">${item.name.startsWith("【覺醒】") ? "覺醒裝備" : "裝備中"}</span>`;
        } else if (eff === "stone_curse") {
            btnHtml = `<button class="btn-use-item btn-curse-stone" data-idx="${idx}">詛咒</button>`;
        } else if (eff === "stone_awake") {
            btnHtml = `<button class="btn-use-item btn-awake-stone" data-idx="${idx}">覺醒</button>`;
        }

        li.innerHTML = `
            <div class="item-info">
                <span class="item-name" style="${item.cursed ? 'color:var(--color-crimson);' : (item.awakened ? 'color:var(--color-gold);' : '')}">${item.name}</span>
                <p style="font-size:.7rem;color:var(--color-text-muted);margin:0">${item.desc || ""}</p>
            </div>
            <div class="item-action-btns">${btnHtml}</div>`;

        const bDetect = li.querySelector(".btn-detect");
        if (bDetect) bDetect.addEventListener("click", useDetectItem);

        const bCurse = li.querySelector(".btn-curse-stone");
        if (bCurse) {
            bCurse.onclick = () => {
                const targets = GS.players.map((py, pidx) => {
                    const items = py.inventory.map((it, iidx) =>
                        `<button class="btn-primary" style="padding:4px; margin:2px;" onclick="triggerCurseStone(${pidx}, ${iidx}, ${idx})">${py.name}的${it.name}</button>`
                    ).join("");
                    return `<div>${items}</div>`;
                }).join("");
                showToastHtml(`選擇施加詛咒對象：<div style='margin-top:6px;'>${targets}</div>`);
            };
        }

        const bAwake = li.querySelector(".btn-awake-stone");
        if (bAwake) {
            bAwake.onclick = () => {
                const items = p.inventory.map((it, iidx) =>
                    `<button class="btn-primary" style="padding:4px; margin:2px;" onclick="triggerAwakeStone(${iidx}, ${idx})">${it.name}</button>`
                ).join("");
                showToastHtml(`選擇施加覺醒道具：<div style='margin-top:6px;'>${items}</div>`);
            };
        }

        const bUse = li.querySelector(".btn-use-item:not(.btn-detect):not(.btn-curse-stone):not(.btn-awake-stone)");
        if (bUse) bUse.addEventListener("click", () => doAction(() => engine.useItem(idx)));
        ul.appendChild(li);
    });
}

function triggerCurseStone(targetIdx, itemIdx, stoneIdx) {
    doAction(() => engine.applyCurse(targetIdx, itemIdx, stoneIdx));
    hideToast();
}

function triggerAwakeStone(itemIdx, stoneIdx) {
    doAction(() => engine.applyAwakening(itemIdx, stoneIdx));
    hideToast();
}

function useDetectItem() {
    try {
        const result = applyState(engine.useDetectItem());
        updateUI();
        if (result.detectResult) {
            const { scannedTiles, trappedTiles } = result.detectResult;
            scannedTiles.forEach(idx => {
                const c = document.getElementById(`cell-${idx}`);
                if (!c) return;
                c.classList.add(trappedTiles.includes(idx) ? "detect-trap" : "detect-safe");
                setTimeout(() => c.classList.remove("detect-trap", "detect-safe"), 4000);
            });
            showToast(trappedTiles.length
                ? `🔍 前方格 ${trappedTiles.join(", ")} 偵測到陷阱！`
                : `🔍 前方 3 格內安全，無陷阱。`);
        }
    } catch (e) { alert(e.message); }
}

function showToast(msg) {
    let t = document.getElementById("detect-toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "detect-toast";
        t.style.cssText = "position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#1e293b;border:2px solid #6366f1;color:#f8fafc;padding:12px 24px;border-radius:8px;font-size:1rem;font-weight:700;z-index:2000;box-shadow:0 8px 20px rgba(0,0,0,0.6);transition:opacity 0.3s";
        document.body.appendChild(t);
    }
    t.innerText = msg;
    t.style.opacity = "1";
    t.style.display = "block";
    clearTimeout(t._hide);
    t._hide = setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.style.display = "none", 300); }, 4000);
}

function showToastHtml(html) {
    let t = document.getElementById("detect-toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "detect-toast";
        t.style.cssText = "position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#1e293b;border:2px solid #6366f1;color:#f8fafc;padding:12px 24px;border-radius:8px;font-size:1rem;font-weight:700;z-index:2000;box-shadow:0 8px 20px rgba(0,0,0,0.6);transition:opacity 0.3s;max-width:90vw;";
        document.body.appendChild(t);
    }
    t.innerHTML = html;
    t.style.opacity = "1";
    t.style.display = "block";
    clearTimeout(t._hide);
}

function hideToast() {
    let t = document.getElementById("detect-toast");
    if (t) {
        t.style.opacity = "0";
        setTimeout(() => t.style.display = "none", 300);
    }
}

function renderMaterials(p) {
    const grid = qs("#player-materials-grid");
    grid.innerHTML = "";
    Object.entries(CFG.materials).forEach(([name, info]) => {
        const count = p.materials[name] || 0;
        const chip = document.createElement("div");
        chip.className = `material-chip ${info.grade}-grade`;
        chip.innerHTML = `<span class="mat-name" title="${name}">${name}</span><span class="mat-count">${count}</span>`;
        grid.appendChild(chip);
    });
}

function renderLogs(logs) {
    const c = qs("#log-messages-container");
    c.innerHTML = "";
    logs.forEach(e => {
        const d = document.createElement("div");
        d.className = `log-entry ${e.type || "system"}`;
        const icon = CFG.logIcons[e.type] || "fa-circle-info";
        d.innerHTML = `<i class="fa-solid ${icon}"></i> [T${e.turn}] ${e.text}`;
        c.appendChild(d);
    });
    c.scrollTop = c.scrollHeight;
}

async function doRollMove() {
    if (animating) return;
    try {
        const pid = GS.players[GS.activePlayerIndex].id;
        const from = clientPos[pid] ?? GS.players[GS.activePlayerIndex].position;
        const state = applyState(engine.rollMove());
        const to = state.players[GS.activePlayerIndex].position;
        animating = true;
        setActionBtns(true);

        if (to <= from) {
            clientPos[pid] = to; renderTokens();
            animating = false; GS = state; updateUI(); return;
        }
        let cur = from;
        const iv = setInterval(() => {
            if (cur < to) { clientPos[pid] = ++cur; renderTokens(); }
            else { clearInterval(iv); animating = false; GS = state; updateUI(); }
        }, 150);
    } catch (e) { alert(e.message); }
}

function setActionBtns(disabled) {
    ["#btn-roll-move", "#btn-end-turn", "#btn-action-craft", "#btn-action-shop"]
        .forEach(s => { if (qs(s)) qs(s).disabled = disabled; });
}

function doAction(fn) {
    try {
        applyState(fn());
        updateUI();
    } catch (e) { alert(e.message); }
}

function handleModals() {
    if (animating) return;
    const ts = GS.turnState;
    const p = GS.players[GS.activePlayerIndex];

    // Dying struggle overlay trigger (§3.6)
    if (p.isDying) {
        showModal("modal-dying");
        qs("#dying-stats-fail").innerText = `連續失敗次數: ${p.reviveFailCount} / 3`;
        qs("#dying-stats-threshold").innerText = `復活判定要求: D20 >= ${11 - (p.reviveThresholdModifier || 0)}`;

        // dying items options
        const itemSelect = qs("#dying-item-select");
        itemSelect.innerHTML = "";
        let count = 0;
        p.inventory.forEach((item, idx) => {
            if (item.name.includes("急救繃帶") || item.name.includes("生命之泉水") || item.name.includes("死亡抗拒符")) {
                itemSelect.innerHTML += `<option value="${idx}">${item.name}</option>`;
                count++;
            }
        });
        if (count === 0) {
            itemSelect.innerHTML = `<option value="-1">無可用瀕死道具</option>`;
            qs("#btn-use-dying-item").disabled = true;
        } else {
            qs("#btn-use-dying-item").disabled = false;
        }

        qs("#btn-dying-struggle-roll").onclick = () => {
            doAction(() => engine.rollRevival());
            hideModal("modal-dying");
        };
        qs("#btn-use-dying-item").onclick = () => {
            const idx = parseInt(itemSelect.value);
            if (idx !== -1) doAction(() => engine.useDyingItem(idx));
        };
    } else {
        hideModal("modal-dying");
    }

    // Teleport bet overlay trigger (§1.6)
    if (ts === "teleport") {
        showModal("modal-teleport");
        const dist = GS.board[p.position]?.teleportDist || 10;
        qs("#teleport-prompt-text").innerText = `您已踏上傳送格！目的地為：${dist > 0 ? "前進" : "後退"} ${Math.abs(dist)} 格。`;

        if (GS.teleportBet) {
            qs("#teleport-bet-status").style.display = "block";
            qs("#btn-place-teleport-bet").disabled = true;
        } else {
            qs("#teleport-bet-status").style.display = "none";
            qs("#btn-place-teleport-bet").disabled = false;
        }

        qs("#btn-place-teleport-bet").onclick = () => {
            const dice = parseInt(qs("#teleport-bet-dice").value);
            const num = parseInt(qs("#teleport-bet-num").value);
            doAction(() => engine.placeTeleportBet(dice, num));
        };

        qs("#btn-trigger-teleport-roll").onclick = () => {
            doAction(() => engine.rollTeleport());
            hideModal("modal-teleport");
        };
    } else {
        hideModal("modal-teleport");
    }

    // Card auction overlay trigger (§2.4)
    if (GS.activeAuction) {
        showModal("modal-auction");
        const card = GS.activeAuction.card;
        qs("#auction-card-title").innerText = card.title || "機會/命運卡";
        qs("#auction-card-desc").innerText = card.desc || card.text;
        qs("#auction-current-bid").innerText = `當前最高標價: $${GS.activeAuction.highestBid}`;

        const bidder = GS.players[GS.activeAuction.currentBidderIndex];
        qs("#auction-next-bidder").innerText = `競標出價順位: ${bidder.name} (持有金幣: $${bidder.coins})`;

        qs("#btn-auction-pass").onclick = () => {
            doAction(() => engine.bidAuction(true));
        };
        qs("#btn-auction-bid").onclick = () => {
            const amt = parseInt(qs("#auction-bid-amount").value);
            doAction(() => engine.bidAuction(false, amt));
        };
    } else {
        hideModal("modal-auction");
    }

    if (ts === "combat" && GS.activeCombat) {
        showModal("modal-combat");
        renderCombat();
    } else hideModal("modal-combat");

    if (ts === "fate" && GS.activeFate) {
        if (!qs("#modal-fate").classList.contains("active")) {
            showModal("modal-fate");
            cardFlipped = false;
            qs("#fate-card-draw").classList.remove("flipped");
        }
        bindFateCard();
    } else hideModal("modal-fate");

    if (ts === "action" && GS.currentOccupiedTrapTile !== null) {
        const trapItems = p.inventory.filter(i =>
            i.isTrap || i.effect === "trap" ||
            i.name.includes("響鈴") || i.name.includes("爆炸") || i.name.includes("詛咒") ||
            i.name.includes("陷阱") || i.name.includes("地板") || i.name.includes("機關") ||
            i.name.includes("夾") || i.name.includes("枷鎖") || i.name.includes("路牌")
        );
        if (trapItems.length && p.activeTrapsCount < 2) {
            if (!qs("#modal-trap").classList.contains("active")) {
                showModal("modal-trap"); renderTrapOptions(p, trapItems);
            }
        } else hideModal("modal-trap");
    } else hideModal("modal-trap");

    if (ts === "gameover") {
        if (!qs("#modal-gameover").classList.contains("active")) {
            showModal("modal-gameover"); renderGameOver();
        }
    }
}

function renderCombat() {
    const p = GS.players[GS.activePlayerIndex];

    // Support multiple monsters HPs
    const combat = GS.activeCombat;
    const livingMonsters = combat.monsters.filter(m => m.hp > 0);
    const m = livingMonsters[0] || { name: "怪物", hp: 0, maxHp: 10, rank: "怪物" };

    const isBoss = m.name === GS.boss.name || combat.rank === "最終首領";

    qs("#combat-monster-name").innerText = combat.monsterTemplate.name;

    // Draw multiple health tags if wolves
    if (combat.monsters.length > 1) {
        const hpDetails = combat.monsters.map(mon =>
            `<div style="font-size:0.8rem; margin:2px 0; color:${mon.hp > 0 ? 'white' : 'gray'}">${mon.name}: ${mon.hp}/${mon.maxHp} HP</div>`
        ).join("");
        qs("#combat-monster-hp-text").innerHTML = hpDetails;
        const totalHp = combat.monsters.reduce((acc, curr) => acc + curr.hp, 0);
        const maxHp = combat.monsters.reduce((acc, curr) => acc + curr.maxHp, 0);
        qs("#combat-monster-hp-fill").style.width = `${(totalHp / maxHp) * 100}%`;
    } else {
        qs("#combat-monster-hp-text").innerText = `${m.hp} / ${m.maxHp} HP`;
        qs("#combat-monster-hp-fill").style.width = `${(m.hp / m.maxHp) * 100}%`;
    }

    qs("#combat-monster-level").innerText = m.rank || combat.rank || "怪物";
    qs("#combat-monster-atk").innerHTML = `<i class="fa-solid fa-hand-fist"></i> ATK: ${m.atk || '1d6'}`;
    qs("#combat-monster-def").innerHTML = `<i class="fa-solid fa-shield-halved"></i> DEF: ${m.def || 0}`;

    qs("#combat-player-name").innerText = `${p.name} [${p.class || '戰士'}]`;
    const av = qs("#combat-player-avatar");
    av.style.borderColor = p.color; av.innerText = p.name.slice(0, 2);
    qs("#combat-player-hp-text").innerText = `${p.hp} / ${p.maxHp} HP`;
    qs("#combat-player-hp-fill").style.width = `${(p.hp / p.maxHp) * 100}%`;

    let extraAtk = 0, extraDef = 0;
    p.inventory.forEach(i => {
        if (i.effect && i.effect.startsWith('atk_')) {
            if (i.effect === 'atk_moon' && !GS.isDay) extraAtk += 4;
            else extraAtk += parseInt(i.effect.split('_')[1]);
        }
        if (i.effect && i.effect.startsWith('def_')) {
            if (i.effect === 'def_3_atk_1') { extraDef += 3; extraAtk += 1; }
            else extraDef += parseInt(i.effect.split('_')[1]);
        }
    });

    // Warrior stance AC buff
    if (p.defenseStance) extraDef += 99; // visual representation of half dmg

    qs("#combat-player-atk").innerHTML = `<i class="fa-solid fa-hand-fist"></i> ATK: ${p.atk || '2d6'} ${extraAtk ? '+' + extraAtk : ''}`;
    qs("#combat-player-def").innerHTML = `<i class="fa-solid fa-shield-halved"></i> DEF: ${(p.def || 0) + (p.defenseStance ? '(減半姿態)' : extraDef)}`;

    // Draw active skills inside combat console
    const skillsContainer = qs("#combat-active-skills");
    skillsContainer.innerHTML = "";

    const skills = CFG.classes[p.class]?.skills || [];
    skills.forEach(skill => {
        const btn = document.createElement("button");
        btn.className = "btn-skill";
        btn.innerText = skill.name;

        if (skill.name === "防禦姿態" && p.defenseStance) btn.classList.add("active");
        if (skill.name === "魔法爆發" && p.magicBurst) btn.classList.add("active");
        if (skill.name === "連射" && p.doubleShot) btn.classList.add("active");
        if (skill.name === "精準瞄準" && p.aiming) btn.classList.add("active");
        if (skill.name === "雙管齊發" && p.doubleBarrel) btn.classList.add("active");

        btn.onclick = () => {
            if (skill.name === "防禦姿態") doAction(() => engine.toggleDefenseStance());
            else if (skill.name === "魔法爆發") doAction(() => engine.toggleMagicBurst());
            else if (skill.name === "連射") doAction(() => engine.toggleDoubleShot());
            else if (skill.name === "精準瞄準") doAction(() => engine.toggleAiming());
            else if (skill.name === "雙管齊發") doAction(() => engine.toggleDoubleBarrel());
            else if (skill.name === "範圍爆破") doAction(() => engine.pirateBlast());
            else if (skill.name === "聖光治癒") {
                const allyOptions = GS.players.map((x, idx) =>
                    `<button class="btn-primary" onclick="triggerHolyCure(${idx})" style="padding:6px; margin:2px;">${x.name}</button>`
                ).join("");
                showToastHtml(`選擇施放對象：<div style='margin-top:6px;'>${allyOptions}</div>`);
            } else if (skill.name === "神聖庇護") {
                doAction(() => engine.divineShield());
            }
        };
        skillsContainer.appendChild(btn);
    });

    // Boss Allied Assist Panels (§3.3)
    const allyPanel = qs("#combat-ally-panel");
    if (isBoss) {
        allyPanel.style.display = "block";
        const selectAlly = qs("#combat-select-ally");
        selectAlly.innerHTML = "";

        GS.players.forEach((player, idx) => {
            if (idx !== GS.activePlayerIndex && !player.isDead && !player.isDying) {
                // Check if already assisted in this round
                const assisted = combat.invitedAllies.some(a => a.playerIndex === idx);
                if (!assisted) {
                    selectAlly.innerHTML += `<option value="${idx}">${player.name} (${player.class})</option>`;
                }
            }
        });

        if (selectAlly.innerHTML === "") {
            selectAlly.innerHTML = `<option value="-1">無可邀盟友</option>`;
            qs("#btn-combat-invite-ally").disabled = true;
        } else {
            qs("#btn-combat-invite-ally").disabled = false;
        }

        qs("#btn-combat-invite-ally").onclick = () => {
            const allyIdx = parseInt(selectAlly.value);
            const actionType = qs("#combat-select-ally-action").value;
            if (allyIdx !== -1) {
                doAction(() => engine.inviteAlly(allyIdx, actionType));
            }
        };
    } else {
        allyPanel.style.display = "none";
    }

    const log = qs("#combat-log-container");
    log.innerHTML = combat.combat_logs.map(l => `<div>${l}</div>`).join("");
    log.scrollTop = log.scrollHeight;

    const flee = qs("#btn-combat-flee");
    flee.style.display = isBoss ? "none" : "";
    qs("#btn-combat-attack").onclick = () => doAction(() => engine.combatAttack(0));
    flee.onclick = () => doAction(() => engine.combatFlee());
}

function bindFateCard() {
    const fate = GS.activeFate;
    const card = fate.card;
    qs("#fate-card-title").innerText = card.title || "機會/命運卡";
    qs("#fate-card-desc").innerText = card.desc || card.text;

    const cardEl = qs("#fate-card-draw");
    const footer = qs("#fate-modal-footer");
    const panel = qs("#fate-challenge-panel");
    const result = qs("#fate-challenge-result");

    if (fate.challenge_rolled) {
        cardEl.classList.add("flipped"); cardFlipped = true;
        panel.style.display = "block";
        result.innerText = fate.result_msg;
        result.className = `challenge-result ${fate.challenge_success ? "success" : "failure"}`;
        qs("#btn-fate-challenge-roll").disabled = true;
        footer.style.display = "flex";
        qs("#btn-close-fate").onclick = () => doAction(() => engine.closeFateCard());
        return;
    }

    cardEl.onclick = () => {
        if (cardFlipped) return;
        cardEl.classList.add("flipped"); cardFlipped = true;
        setTimeout(() => {
            if (fate.has_challenge) {
                panel.style.display = "block"; footer.style.display = "none";
                result.innerText = ""; result.className = "challenge-result";
                const rb = qs("#btn-fate-challenge-roll");
                rb.disabled = false;
                rb.onclick = () => doAction(() => engine.fateRollChallenge());
            } else {
                panel.style.display = "none"; footer.style.display = "flex";
                qs("#btn-close-fate").onclick = () => doAction(() => engine.fateExecutePassive());
            }
        }, 450);
    };
}

function renderTrapOptions(p, trapItems) {
    const list = qs("#trap-options-list");
    list.innerHTML = "";
    trapItems.forEach(item => {
        const d = document.createElement("div");
        d.className = "trap-option-card";
        d.innerHTML = `
            <div class="trap-info">
                <span class="trap-title">${item.name}</span>
                <span class="trap-desc">${item.desc || ""}</span>
            </div>
            <button class="btn-place-trap" data-name="${item.name}">放置</button>`;
        d.querySelector(".btn-place-trap").onclick = () => {
            doAction(() => engine.placeTrap(item.name));
            hideModal("modal-trap");
        };
        list.appendChild(d);
    });
}

function renderGameOver() {
    qs("#gameover-reason").innerText = "虛空之主已被完全擊敗！或所有玩家不幸出局！";
    const sorted = [...GS.leaderboard].sort((a, b) => b.victoryPoints - a.victoryPoints);
    qs("#leaderboard-body").innerHTML = sorted.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td style="color:${p.color};font-weight:700">${p.name} <span style="font-size:0.8rem;opacity:0.8">[${p.class || '戰士'}]</span></td>
            <td>${p.victoryPoints} VP</td>
            <td>$${p.coins}</td>
            <td>${p.isDead ? "永久死亡" : (p.isDying ? "瀕死" : "存活")}</td>
        </tr>`).join("");
    qs("#winner-announcement-text").innerText = `🥇 ${sorted[0].name} 獲得最終勝利！`;
    qs("#winner-announcement-text").style.color = sorted[0].color;
}

function openShop() {
    const p = GS.players[GS.activePlayerIndex];
    qs("#shop-player-coins").innerText = `$${p.coins}`;

    const buyList = qs("#shop-buy-list");
    buyList.innerHTML = "";

    const shop = GS.currentShop;
    if (!shop) {
        buyList.innerHTML = `<div class="empty-list-msg">尚未進入商店</div>`;
        return;
    }

    if (GS.mysteriousShopActive) {
        qs("#shop-buy-list").parentElement.querySelector("h3").innerText = "購買道具 (神秘商店召喚 - 全品陳列)";
    } else {
        qs("#shop-buy-list").parentElement.querySelector("h3").innerText = `購買道具 (SL${shop.sl} 層級商店)`;
    }

    shop.items.forEach(item => {
        const label = item.isBlind ? (item.blindLabel || "神秘道具") : item.name;
        const desc = item.isBlind ? (item.blindDesc || "盲選未知品質/效果道具") : (item.effect || item.desc || "");

        const has = p.inventory.some(i => i.name === label);
        const card = document.createElement("div");
        card.className = "shop-item-card";

        let priceText = "$" + item.price;
        card.innerHTML = `
            <div class="shop-item-info">
                <span class="shop-item-title">${label}</span>
                <span class="shop-item-desc">${desc}</span>
            </div>
            <button class="btn-shop-buy" ${has || p.coins < item.price ? "disabled" : ""}>
                ${has ? "已持有" : priceText}
            </button>`;
        card.querySelector(".btn-shop-buy").onclick = () => {
            doAction(() => engine.buyItem(label));
            openShop();
        };
        buyList.appendChild(card);
    });

    // Populate Death Shop items at the bottom if any (§2.4)
    if (GS.deathShopItems && GS.deathShopItems.length > 0) {
        const title = document.createElement("h3");
        title.innerText = "購買道具 (死亡出局者遺物)";
        title.style.marginTop = "20px";
        title.style.color = "var(--color-crimson)";
        buyList.appendChild(title);

        GS.deathShopItems.forEach((item, idx) => {
            const card = document.createElement("div");
            card.className = "shop-item-card";
            card.style.borderColor = "var(--color-crimson)";
            card.innerHTML = `
                <div class="shop-item-info">
                    <span class="shop-item-title" style="color:var(--color-crimson);">${item.name}</span>
                    <span class="shop-item-desc">${item.desc}</span>
                </div>
                <button class="btn-shop-buy-death" ${p.coins < item.price ? "disabled" : ""}>
                    $${item.price} (溢價)
                </button>`;

            card.querySelector(".btn-shop-buy-death").onclick = () => {
                doAction(() => engine.buyDeathShopItem(idx));
                openShop();
            };
            buyList.appendChild(card);
        });
    }

    const sellList = qs("#shop-sell-list");
    sellList.innerHTML = "";
    let hasMats = false;
    Object.entries(p.materials).forEach(([name, count]) => {
        if (!count) return;
        hasMats = true;
        const info = CFG.materials[name];
        const card = document.createElement("div");
        card.className = "shop-item-card";
        card.innerHTML = `
            <div class="shop-item-info">
                <span class="shop-item-title">${name} ×${count}</span>
                <span class="shop-item-desc">${info.grade} 素材</span>
            </div>
            <button class="btn-shop-sell">售出 +$${info.price}</button>`;
        card.querySelector(".btn-shop-sell").onclick = () => {
            doAction(() => engine.sellMaterial(name));
            openShop();
        };
        sellList.appendChild(card);
    });
    if (!hasMats) sellList.innerHTML = `<div class="empty-list-msg">無素材可售</div>`;
    showModal("modal-shop");
}

function openSynthesis() {
    const tabs = document.querySelectorAll(".recipe-tab");
    tabs.forEach(t => t.onclick = e => {
        tabs.forEach(x => x.classList.remove("active"));
        e.currentTarget.classList.add("active");
        recipeTab = e.currentTarget.dataset.level;
        renderRecipes();
    });
    renderRecipes();
    showModal("modal-synthesis");
}

function renderRecipes() {
    const p = GS.players[GS.activePlayerIndex];
    const container = qs("#recipes-list-container");
    container.innerHTML = "";
    (CFG.recipes[recipeTab] || []).forEach(recipe => {
        let met = true;
        const ings = Object.entries(recipe.ingredients).map(([mat, qty]) => {
            const own = p.materials[mat] || 0;
            if (own < qty) met = false;
            return `<span class="mat-item-check ${own >= qty ? "met" : "unmet"}">${mat}×${qty}(${own})</span>`;
        }).join(" ");
        const card = document.createElement("div");
        card.className = "recipe-card";
        card.innerHTML = `
            <div class="recipe-details">
                <span class="recipe-result-title">${recipe.resultLabel || recipe.name}</span>
                <div class="recipe-mats-needed">${ings}</div>
            </div>
            <button class="btn-craft" ${met ? "" : "disabled"}>合成</button>`;
        card.querySelector(".btn-craft").onclick = () => {
            doAction(() => engine.craftItem(recipe.name, recipeTab));
            renderRecipes();
        };
        container.appendChild(card);
    });
}

function buildDiceButtons() {
    const row = qs(".dice-buttons");
    row.innerHTML = "";
    CFG.diceSides.forEach(s => {
        const b = document.createElement("button");
        b.className = "btn-die"; b.textContent = `D${s}`;
        b.onclick = () => { if (dicePool.length < 10) { dicePool.push(s); renderPool(); } };
        row.appendChild(b);
    });
}

function renderPool() {
    const pool = qs("#selected-dice-pool");
    pool.innerHTML = "";
    if (!dicePool.length) {
        pool.innerHTML = `<span class="pool-empty">請點選上方骰子</span>`;
        qs("#btn-trigger-roll").disabled = true; return;
    }
    dicePool.forEach((s, i) => {
        const t = document.createElement("span");
        t.className = "die-token"; t.textContent = `D${s}`;
        t.onclick = () => { dicePool.splice(i, 1); renderPool(); };
        pool.appendChild(t);
    });
    qs("#btn-trigger-roll").disabled = false;
}

function rollDiceTray() {
    if (!dicePool.length) return;
    qs("#btn-trigger-roll").disabled = true;
    const grouped = {};
    dicePool.forEach(s => grouped[s] = (grouped[s] || 0) + 1);
    const payload = Object.entries(grouped).map(([s, c]) => ({ type: +s, count: c }));
    const res = engine.rollCustomDice(payload);
    qs("#dice-total-display").innerText = res.total;
    qs("#dice-breakdown-display").innerText = res.results.map(r =>
        `${r.type}:[${r.rolls.join(",")}]=${r.subtotal}`).join("  ");
    qs("#btn-trigger-roll").disabled = false;
}

function bindGlobalEvents() {
    qs("#btn-start-game").onclick = startGame;
    qs("#btn-roll-move").onclick = doRollMove;
    qs("#btn-end-turn").onclick = () => {
        doAction(() => engine.endTurn());
        hideToast(); // hide target select toasts if any
    };
    qs("#btn-gm-mode").onclick = () => doAction(() => engine.toggleGmMode());
    qs("#btn-save-game").onclick = () => {
        saveGame(engine);
        showToast("✅ 遊戲已儲存！");
    };
    qs("#btn-load-game").onclick = () => {
        try {
            const result = loadGame(engine);
            applyState(result);
            GS.players.forEach(p => clientPos[p.id] = p.position);
            buildBoard();
            updateUI();
            showToast("✅ 讀檔成功！");
        } catch (e) { alert(e.message); }
    };
    qs("#btn-action-shop").onclick = () => {
        doAction(() => engine.enterShop());
        openShop();
    };
    qs("#btn-action-craft").onclick = openSynthesis;
    qs("#btn-clear-log").onclick = () => { qs("#log-messages-container").innerHTML = ""; };
    qs("#btn-clear-pool").onclick = () => { dicePool = []; renderPool(); };
    qs("#btn-trigger-roll").onclick = rollDiceTray;
    qs("#btn-restart-game").onclick = () => location.reload();

    document.querySelectorAll(".btn-close-modal").forEach(b =>
        b.addEventListener("click", closeAllModals)
    );

    document.querySelectorAll(".tab-btn").forEach(b =>
        b.addEventListener("click", e => {
            document.querySelectorAll(".tab-btn").forEach(x => x.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(x => x.classList.remove("active"));
            e.currentTarget.classList.add("active");
            qs(`#${e.currentTarget.dataset.tab}`).classList.add("active");
        })
    );

    buildDiceButtons();
    renderPool();
}

function showModal(id) { qs(`#${id}`).classList.add("active"); }
function hideModal(id) { qs(`#${id}`).classList.remove("active"); }
function closeAllModals() {
    ["modal-combat", "modal-shop", "modal-synthesis", "modal-fate", "modal-trap", "modal-teleport", "modal-auction", "modal-dying"]
        .forEach(hideModal);
}

function qs(sel) { return document.querySelector(sel); }
function set(sel, text, color) {
    const el = qs(sel); if (!el) return;
    el.innerText = text; if (color) el.style.color = color;
}

function runAI() {
    if (typeof AIAgent !== 'undefined') {
        AIAgent.playTurn(engine, GS);
    }
}
