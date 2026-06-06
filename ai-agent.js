class AIAgent {
    static playTurn(engine, gs) {
        if (!gs || gs.turnState === "gameover") return;

        let activeIndex = gs.activePlayerIndex;
        if (gs.activeAuction) {
            activeIndex = gs.activeAuction.currentBidderIndex;
        }

        const p = gs.players[activeIndex];
        if (!p || !p.isAI) return;

        const ts = gs.turnState;
        console.log(`[AI] ${p.name} is making a move in state: ${ts}`);

        // Add a visual indicator
        showToast(`${p.name} (AI) 正在思考...`);

        setTimeout(() => {
            hideToast();
            try {
                if (p.isDying) {
                    let itemIdx = -1;
                    p.inventory.forEach((item, idx) => {
                        if (item.name.includes("急救繃帶") || item.name.includes("生命之泉水") || item.name.includes("死亡抗拒符")) {
                            itemIdx = idx;
                        }
                    });
                    if (itemIdx !== -1) {
                        doAction(() => engine.useDyingItem(itemIdx));
                    } else {
                        doAction(() => engine.rollRevival());
                    }
                    return;
                }

                if (gs.activeAuction) {
                    const currentBid = gs.activeAuction.highestBid;
                    const maxWillPay = p.coins > 15 ? 10 : 5; 
                    // 50% chance to bid if they have enough money and it's under max
                    if (p.coins > currentBid + 1 && currentBid < maxWillPay && Math.random() > 0.5) {
                        doAction(() => engine.bidAuction(false, currentBid + 1));
                    } else {
                        doAction(() => engine.bidAuction(true));
                    }
                    return;
                }

                switch (ts) {
                    case "roll":
                        // Heal if HP is low
                        if (p.hp < p.maxHp * 0.5) {
                            const healIdx = p.inventory.findIndex(i => i.effect && i.effect.startsWith("heal"));
                            if (healIdx !== -1) {
                                engine.useItem(healIdx);
                            }
                        }
                        doRollMove();
                        break;

                    case "combat":
                        // Defensive abilities if low HP
                        if (p.hp < p.maxHp * 0.4 && p.class === "戰士" && !p.defenseStance) {
                            try { engine.toggleDefenseStance(); } catch(e){}
                        }
                        if (p.class === "白魔法師" && p.hp < p.maxHp * 0.6) {
                            try { engine.holyCure(activeIndex); } catch(e){}
                        }
                        
                        // Flee if hp is very low and not boss
                        const isBoss = gs.activeCombat && gs.activeCombat.monsters[0].name === gs.boss.name;
                        if (!isBoss && p.hp < p.maxHp * 0.25 && Math.random() > 0.3) {
                            doAction(() => engine.combatFlee());
                        } else {
                            doAction(() => engine.combatAttack(0));
                        }
                        break;

                    case "fate":
                        if (gs.activeFate.challenge_rolled) {
                            doAction(() => engine.closeFateCard());
                        } else if (gs.activeFate.has_challenge) {
                            doAction(() => engine.fateRollChallenge());
                        } else if (!cardFlipped) {
                            const fateCardDraw = document.querySelector("#fate-card-draw");
                            if (fateCardDraw) {
                                fateCardDraw.click();
                                // Card flips visually without updating GS, so we must manually trigger the next AI step
                                if (typeof runAI === 'function') setTimeout(runAI, 800);
                            }
                        } else {
                            doAction(() => engine.fateExecutePassive());
                        }
                        break;

                    case "teleport":
                        // 30% chance to place a bet
                        if (p.coins >= 5 && Math.random() > 0.7) {
                            try { engine.placeTeleportBet(6, Math.floor(Math.random() * 6) + 1); } catch(e){}
                        }
                        doAction(() => engine.rollTeleport());
                        break;

                    case "action":
                        // Auto-place trap if holding one
                        if (gs.currentOccupiedTrapTile !== null && p.activeTrapsCount < 2) {
                            const trapItems = p.inventory.filter(i => 
                                i.isTrap || i.effect === "trap" || i.name.includes("陷阱") || i.name.includes("響鈴")
                            );
                            if (trapItems.length > 0) {
                                try { engine.placeTrap(trapItems[0].name); } catch(e) {}
                            }
                        }

                        // Auto-buy if at shop
                        const tile = gs.board[p.position] || { type: "normal" };
                        if (tile.type === "shop" && p.coins >= 10 && p.hp < p.maxHp * 0.8) {
                            try { engine.buyItem("初級治癒藥水"); } catch(e){}
                        }

                        doAction(() => engine.endTurn());
                        break;
                }
            } catch (e) {
                console.error("AI execution error:", e);
                // Fallback to avoid getting stuck
                if (gs.turnState === "action") {
                    doAction(() => engine.endTurn());
                }
            }
        }, 1500); // AI thinking delay
    }
}
