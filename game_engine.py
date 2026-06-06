# game_engine.py
import random
from map_manager import MATERIALS, RECIPES, SHOP_ITEMS_BY_TIER, PATH_COORDINATES, FATE_CARDS, CHANCE_CARDS, CLASSES, ENEMIES, FINAL_BOSS, DAY_NIGHT_RULES

class TTRPGEngine:
    def __init__(self):
        self.players = []
        self.active_player_index = 0
        self.turn_count = 1
        self.traps = [] # list of dicts: {"tileIndex": idx, "ownerIndex": idx, "type": name, "damage": dmg, "goldTransfer": val, "level": lvl}
        self.boss = {
            "name": FINAL_BOSS["name"],
            "hp": FINAL_BOSS["maxHp"],
            "maxHp": FINAL_BOSS["maxHp"],
            "atk": FINAL_BOSS["atk"],
            "def": FINAL_BOSS.get("def", 0),
            "phases": FINAL_BOSS["phases"],
            "dealtDamagePlayers": []
        }
        self.turn_state = "setup" # "setup" | "roll" | "action" | "combat" | "fate" | "gameover"
        self.active_combat = None # dict
        self.active_fate = None # dict
        self.log_messages = []
        self.gm_mode = False
        self.gm_mode = False
        self.current_occupied_trap_tile = None
        self.day = 1
        self.is_day = True
        self.round_in_day = 0

    def add_log(self, text, log_type="system"):
        self.log_messages.append({
            "text": text,
            "type": log_type,
            "turn": self.turn_count
        })

    def start_game(self, players_config):
        """
        players_config: list of dicts: [{"name": "Name", "color": "color", "class": "Class Name"}]
        """
        self.players = []
        for i, config in enumerate(players_config):
            p_class_name = config.get("class", "戰士")
            if p_class_name not in CLASSES:
                p_class_name = "戰士"
            p_class = CLASSES[p_class_name]

            self.players.append({
                "id": i + 1,
                "name": config.get("name", f"冒險者 {i+1}"),
                "color": config.get("color", "#ff5555"),
                "class": p_class_name,
                "hp": p_class["maxHp"],
                "maxHp": p_class["maxHp"],
                "mp": p_class.get("maxMp", 0),
                "maxMp": p_class.get("maxMp", 0),
                "atk": p_class["atk"],
                "def": p_class["def"],
                "spd": p_class["spd"],
                "coins": 20,
                "victoryPoints": 0,
                "inventory": [],
                "materials": { mat: 0 for mat in MATERIALS.keys() },
                "position": 0,
                "isDead": False,
                "isDying": False,
                "statusEffects": [],
                "skipTurns": 0,
                "reviveFailCount": 0,
                "activeTrapsCount": 0,
                "damageBuff": False
            })
        
        self.active_player_index = 0
        self.turn_count = 1
        self.day = 1
        self.is_day = True
        self.round_in_day = 0
        self.traps = []
        self.boss = {
            "name": FINAL_BOSS["name"],
            "hp": FINAL_BOSS["maxHp"],
            "maxHp": FINAL_BOSS["maxHp"],
            "atk": FINAL_BOSS["atk"],
            "def": FINAL_BOSS.get("def", 0),
            "phases": FINAL_BOSS["phases"],
            "dealtDamagePlayers": []
        }
        self.turn_state = "roll"
        self.active_combat = None
        self.active_fate = None
        self.log_messages = []
        self.add_log(f"冒險開始！輪到 {self.get_active_player()['name']} 的回合。請擲骰移動！", "system")

    def get_active_player(self):
        return self.players[self.active_player_index]

    def roll_move(self):
        if self.turn_state != "roll":
            return {"error": "Invalid turn state for movement"}

        active_player = self.get_active_player()
        steps = random.randint(1, 6)
        start_pos = active_player["position"]
        new_pos = start_pos + steps

        # Cap at last tile (Boss Arena)
        if new_pos >= len(PATH_COORDINATES) - 1:
            new_pos = len(PATH_COORDINATES) - 1

        active_player["position"] = new_pos
        self.add_log(f"{active_player['name']} 擲出了 D6 = {steps}，移動至第 {new_pos} 格。【{PATH_COORDINATES[new_pos]['label']}】", "roll-log")

        # Check Trap trigger first (on landing tile)
        trap_index = -1
        for idx, trap in enumerate(self.traps):
            if trap["tileIndex"] == new_pos and trap["ownerIndex"] != self.active_player_index:
                trap_index = idx
                break

        if trap_index != -1:
            self.trigger_trap(trap_index)
        else:
            self.resolve_tile_action(new_pos)

        return self.get_state_dict()

    def trigger_trap(self, trap_index):
        active_player = self.get_active_player()
        trap = self.traps[trap_index]
        owner = self.players[trap["ownerIndex"]]

        self.add_log(f"【陷阱觸發】{active_player['name']} 踩中了 {owner['name']} 的 {trap['type']}！", "trap-log")

        # Damage target
        active_player["hp"] -= trap["damage"]
        self.add_log(f"{active_player['name']} 扣除 {trap['damage']} HP (剩餘 HP: {active_player['hp']})。", "trap-log")

        # Transfer coins
        coins_to_pay = min(active_player["coins"], trap["goldTransfer"])
        active_player["coins"] -= coins_to_pay
        owner["coins"] += coins_to_pay
        self.add_log(f"{active_player['name']} 支付 ${coins_to_pay} 給 {owner['name']}。", "trap-log")

        # Award VP to owner
        owner["victoryPoints"] += 1
        self.add_log(f"{owner['name']} 成功觸發陷阱，獲得 +1 勝利點數！", "trap-log")

        # Remove trap
        self.traps.pop(trap_index)
        owner["activeTrapsCount"] = max(0, owner["activeTrapsCount"] - 1)

    def _roll_dice(self, dice_str):
        # Parses "2d8" or "1d4" or "3d6"
        parts = dice_str.lower().split("d")
        if len(parts) != 2:
            return 0
        try:
            count = int(parts[0])
            sides = int(parts[1])
            return sum(random.randint(1, sides) for _ in range(count))
        except:
            return 0

        # Health check
        if active_player["hp"] <= 0:
            self.handle_player_death()
        else:
            self.turn_state = "action"

    def resolve_tile_action(self, tile_index):
        active_player = self.get_active_player()
        tile = PATH_COORDINATES[tile_index]

        if tile["type"] == "start":
            active_player["coins"] += 5
            self.add_log(f"安全區：{active_player['name']} 回到起點，獲得 $5 金幣。", "system")
            self.turn_state = "action"

        elif tile["type"] == "normal":
            self.current_occupied_trap_tile = tile_index
            self.turn_state = "action"

        elif tile["type"] == "battle":
            # Determine monster tier depending on map progress
            if tile_index >= 36:
                pool = ENEMIES.get("boss2", [])
                rank = "高級怪物"
            elif tile_index >= 16:
                pool = ENEMIES.get("boss1", [])
                rank = "中級怪物"
            else:
                pool = ENEMIES.get("basic", [])
                rank = "初級怪物"

            if not pool: pool = ENEMIES.get("basic", [{"name":"小怪", "hp":1, "maxHp":1, "atk":"1d4", "def":0, "drop":1}])

            template = random.choice(pool)
            self.active_combat = {
                "monster": {
                    "name": template["name"],
                    "hp": template["hp"],
                    "maxHp": template["maxHp"],
                    "atk": template["atk"],
                    "def": template["def"],
                    "drop": template.get("drop", 5),
                    "tag": template.get("tag", ""),
                    "special": template.get("special", ""),
                    "rank": rank
                },
                "combat_logs": [f"戰鬥開始！{active_player['name']} 面對 {template['name']}。"]
            }
            self.turn_state = "combat"
            self.add_log(f"【遭遇遭遇戰】{active_player['name']} 面對 {template['name']} ({rank})！", "combat-log")

        elif tile["type"] == "chest":
            self.resolve_chest_encounter()
            self.turn_state = "action"

        elif tile["type"] == "shop":
            self.add_log(f"來到深淵商店！可以進行購買或售出素材。", "system")
            self.turn_state = "action"

        elif tile["type"] == "synthesis":
            self.add_log(f"來到合成台格子！可以進行道具合成。", "system")
            self.turn_state = "action"

        elif tile["type"] == "fate":
            self.resolve_fate_draw()

        elif tile["type"] == "boss":
            self.resolve_boss_encounter()

    def resolve_chest_encounter(self):
        active_player = self.get_active_player()
        roll_val = random.randint(1, 20)

        # Filters by grade
        low_mats = [k for k, v in MATERIALS.items() if v["grade"] == "low"]
        mid_mats = [k for k, v in MATERIALS.items() if v["grade"] == "mid"]
        high_mats = [k for k, v in MATERIALS.items() if v["grade"] == "high"]

        grade = "低級寶箱"
        reward_gold = 2
        reward_mats = []

        if roll_val <= 5:
            grade = "初級寶箱"
            reward_gold = 2
            reward_mats.append(random.choice(low_mats))
            if random.random() > 0.5:
                reward_mats.append(random.choice(low_mats))
        elif roll_val <= 15:
            grade = "中級寶箱"
            reward_gold = 5
            reward_mats.append(random.choice(mid_mats))
            reward_mats.append(random.choice(low_mats))
        else:
            grade = "神聖寶箱"
            reward_gold = 10
            reward_mats.append(random.choice(high_mats))
            reward_mats.append(random.choice(mid_mats))

        active_player["coins"] += reward_gold
        for mat in reward_mats:
            active_player["materials"][mat] += 1

        self.add_log(f"【開箱結果】D20 擲出 {roll_val}！打開了【{grade}】，獲得 ${reward_gold} 金幣和素材: {reward_mats}。", "roll-log")

    def resolve_fate_draw(self):
        active_player = self.get_active_player()
        card = random.choice(FATE_CARDS)
        self.active_fate = {
            "card": card,
            "has_challenge": card["type"] in ["trap_upgrade", "trap_downgrade", "ultimate_trial"],
            "challenge_rolled": False,
            "challenge_success": False,
            "result_msg": ""
        }
        self.turn_state = "fate"
        self.add_log(f"【抽取命運】{active_player['name']} 抽取了命運卡【{card['title']}】", "system")

    def resolve_boss_encounter(self):
        active_player = self.get_active_player()
        
        # Check first reach
        is_first = True
        for p in self.players:
            if p["damageBuff"]:
                is_first = False
                break

        if is_first:
            active_player["damageBuff"] = True
            active_player["victoryPoints"] += 3
            self.add_log(f"👑 {active_player['name']} 首位抵達 BOSS 巢穴！獲得對 BOSS 的全面傷害提升 (+25%)，並獲得 +3 勝利點數！", "system")

        self.active_combat = {
            "monster": {
                "name": self.boss["name"],
                "hp": self.boss["hp"],
                "maxHp": self.boss["maxHp"],
                "atk": self.boss["atk"],
                "def": self.boss.get("def", 0),
                "rank": "最終首領",
                "xp": 3
            },
            "combat_logs": [f"決戰開始！{active_player['name']} 面對 【{self.boss['name']}】！"]
        }
        self.turn_state = "combat"

    def handle_player_death(self):
        active_player = self.get_active_player()
        self.add_log(f"💀 {active_player['name']} 倒下了！", "trap-log")

        # Hourglass check
        hourglass_idx = -1
        for idx, item in enumerate(active_player["inventory"]):
            if item.get("effect") == "revive":
                hourglass_idx = idx
                break

        if hourglass_idx != -1:
            active_player["hp"] = 10
            active_player["inventory"].pop(hourglass_idx)
            self.add_log(f"⏳ {active_player['name']} 消耗了【時之沙漏】，奇蹟般地原地復活！生命值恢復至 10 HP。", "system")
            self.turn_state = "action"
            return

        # Penalties
        lost_coins = active_player["coins"] // 2
        active_player["coins"] -= lost_coins

        dropped_mats = 0
        owned_mats = [k for k, v in active_player["materials"].items() if v > 0]
        if owned_mats:
            for _ in range(2):
                if not owned_mats:
                    break
                selected_mat = random.choice(owned_mats)
                active_player["materials"][selected_mat] -= 1
                dropped_mats += 1
                if active_player["materials"][selected_mat] == 0:
                    owned_mats.remove(selected_mat)

        self.add_log(f"懲罰：失去 ${lost_coins} 金幣，掉落了 {dropped_mats} 個素材，並遣送回起點！", "trap-log")
        active_player["hp"] = active_player["maxHp"]
        active_player["position"] = 0
        active_player["isDead"] = False  # respawned

        # Check last-survivor win condition (design spec §遊戲結束條件 2)
        living = [p for p in self.players if not p["isDead"]]
        if len(living) == 1:
            survivor = living[0]
            self.add_log(f"所有其他玩家已全部倒下！{survivor['name']} 是最後的倖存者！", "system")
            self.trigger_game_over(f"{survivor['name']} 為最後的倖存者！")
        else:
            self.turn_state = "action"

    def combat_attack(self):
        if self.turn_state != "combat" or not self.active_combat:
            return {"error": "No active combat"}

        active_player = self.get_active_player()
        monster = self.active_combat["monster"]

        # Equipment buffs
        extra_atk = 0
        damage_reduction = 0

        for item in active_player["inventory"]:
            eff = item.get("effect", "")
            if eff.startswith("atk_"):
                extra_atk += int(eff.split("_")[1])
            elif eff.startswith("def_"):
                if eff == "def_3_atk_1":
                    damage_reduction += 3
                    extra_atk += 1
                else:
                    damage_reduction += int(eff.split("_")[1])

        # Boss damage buff
        dmg_multiplier = 1.25 if (active_player["damageBuff"] and monster["name"] == self.boss["name"]) else 1.0

        # Player attacks
        raw_dmg = self._roll_dice(active_player.get("atk", "2d6"))
        final_dmg = int((raw_dmg + extra_atk) * dmg_multiplier)

        monster["hp"] = max(0, monster["hp"] - final_dmg)
        
        # Log to local combat
        roll_text = f"你擲出了 {active_player.get('atk', '2d6')} = {raw_dmg}"
        if extra_atk > 0:
            roll_text += f" + {extra_atk} (道具) "
        if dmg_multiplier > 1.0:
            roll_text += " × 1.25 (Boss增傷) "
            
        self.active_combat["combat_logs"].append(f"⚔️ {roll_text}，對 {monster['name']} 造成了 {final_dmg} 點傷害！")

        if monster["name"] == self.boss["name"]:
            self.boss["hp"] = monster["hp"]
            # Tag player
            if active_player["id"] not in self.boss["dealtDamagePlayers"]:
                self.boss["dealtDamagePlayers"].append(active_player["id"])

        # Check death
        if monster["hp"] <= 0:
            self.resolve_combat_win()
            return self.get_state_dict()

        # Monster attacks back
        monster_roll = self._roll_dice(monster.get("atk", "1d6"))
        
        # Day / Night buffs
        monster_dmg_mult = 1.0
        tag = monster.get("tag", "")
        if tag in DAY_NIGHT_RULES:
            if self.is_day:
                monster_dmg_mult = DAY_NIGHT_RULES[tag]["dayBonus"]
            else:
                monster_dmg_mult = DAY_NIGHT_RULES[tag]["nightBonus"]
                
        base_monster_dmg = int(monster_roll * monster_dmg_mult)
        final_monster_dmg = max(1, base_monster_dmg - damage_reduction)

        active_player["hp"] = max(0, active_player["hp"] - final_monster_dmg)
        
        monster_text = f"{monster['name']} 擲出 {monster.get('atk', '1d6')} = {monster_roll}"
        if monster_dmg_mult != 1.0:
            monster_text += f" × {monster_dmg_mult} (環境加成)"
        if damage_reduction > 0:
            monster_text += f" - {damage_reduction} (護甲防禦)"
        
        self.active_combat["combat_logs"].append(f"💥 {monster_text}，對你造成了 {final_monster_dmg} 點傷害！")

        if active_player["hp"] <= 0:
            self.active_combat = None
            self.handle_player_death()

        return self.get_state_dict()

    def resolve_combat_win(self):
        active_player = self.get_active_player()
        monster = self.active_combat["monster"]

        self.add_log(f"【戰鬥獲勝】{active_player['name']} 擊敗了 {monster['name']}！", "combat-log")

        if monster["name"] == self.boss["name"]:
            # Final Boss win
            active_player["victoryPoints"] += 3
            self.add_log(f"{active_player['name']} 獲得最後一擊加成，+3 勝利點數！", "combat-log")
            
            # Participation
            for p in self.players:
                if p["id"] in self.boss["dealtDamagePlayers"] and p["id"] != active_player["id"]:
                    p["victoryPoints"] += 1
                    self.add_log(f"{p['name']} 曾參與擊殺最終 Boss，獲得 +1 勝利點數！", "combat-log")

            self.active_combat = None
            self.trigger_game_over("最終首領已被擊敗！")
        else:
            # Standard monster drops
            mat_grade = "low"
            if monster.get("rank") == "中級怪物":
                mat_grade = "mid"
            elif monster.get("rank") == "高級怪物":
                mat_grade = "high"

            mats_pool = [k for k, v in MATERIALS.items() if v["grade"] == mat_grade]
            drop_mat = None
            if mats_pool:
                drop_mat = random.choice(mats_pool)
                active_player["materials"][drop_mat] += 1

            gold_reward = monster.get("drop", 5)
            # Night bonus logic for "夜強"
            if not self.is_day and monster.get("tag") == "夜強":
                gold_reward = int(gold_reward * 1.5)

            active_player["coins"] += gold_reward
            vp_reward = 2 if mat_grade == "high" else 1
            active_player["victoryPoints"] += vp_reward

            self.add_log(f"獎勵發放：獲得 ${gold_reward} 金幣，素材 【{drop_mat if drop_mat else '無'}】 和 +{vp_reward} 點勝利點數！", "combat-log")
            self.active_combat = None
            self.turn_state = "action"

    def combat_flee(self):
        if self.turn_state != "combat" or not self.active_combat:
            return {"error": "No active combat"}

        active_player = self.get_active_player()
        monster = self.active_combat["monster"]

        roll_val = random.randint(1, 6)
        if roll_val >= 4:
            self.add_log(f"{active_player['name']} 擲出了 D6 = {roll_val}，逃跑成功！回到上一個安全格。", "system")
            active_player["position"] = max(0, active_player["position"] - 1)
            self.active_combat = None
            self.turn_state = "action"
        else:
            self.active_combat["combat_logs"].append(f"🏃 逃跑判定失敗！(擲出 D6 = {roll_val}，小於 4) 失去本輪行動。")
            
            # Monster attacks free
            monster_roll = self._roll_dice(monster.get("atk", "1d6"))
            active_player["hp"] = max(0, active_player["hp"] - monster_roll)
            self.active_combat["combat_logs"].append(f"💥 {monster['name']} 趁機攻擊你，造成 {monster_roll} 點傷害！")

            if active_player["hp"] <= 0:
                self.active_combat = None
                self.handle_player_death()

        return self.get_state_dict()

    def fate_execute_passive(self):
        if self.turn_state != "fate" or not self.active_fate:
            return {"error": "No active fate card"}

        active_player = self.get_active_player()
        card = self.active_fate["card"]

        if card["type"] == "curse_mats":
            count = 0
            for p in self.players:
                if p["id"] != active_player["id"] and not p["isDead"]:
                    owned_mats = [k for k, v in p["materials"].items() if v > 0]
                    if owned_mats:
                        p["materials"][random.choice(owned_mats)] -= 1
                        count += 1
            active_player["victoryPoints"] += 1
            self.add_log(f"【詛咒卡】{active_player['name']} 吸取了其他玩家共計 {count} 個素材，並獲得 +1 勝利點數！", "system")

        elif card["type"] == "elf_gift":
            active_player["coins"] += 5
            mid_mats = [k for k, v in MATERIALS.items() if v["grade"] == "mid"]
            gift_mat = random.choice(mid_mats)
            active_player["materials"][gift_mat] += 1
            self.add_log(f"【餽贈卡】{active_player['name']} 獲得 $5 金幣與中級素材【{gift_mat}】。", "system")

        elif card["type"] == "extra_turn":
            # Set indices back 1
            self.active_player_index = (self.active_player_index - 1 + len(self.players)) % len(self.players)
            if self.active_player_index == len(self.players) - 1:
                self.turn_count -= 1
            self.add_log(f"【時空亂流】{active_player['name']} 獲得 1 個額外回合！", "system")

        self.active_fate = None
        self.turn_state = "action"
        return self.get_state_dict()

    def fate_roll_challenge(self):
        if self.turn_state != "fate" or not self.active_fate:
            return {"error": "No active fate card"}

        active_player = self.get_active_player()
        card = self.active_fate["card"]
        roll_val = random.randint(1, 20)
        success = False
        result_msg = ""

        if card["type"] == "trap_upgrade":
            success = (roll_val >= 10)
            if success:
                my_traps = [t for t in self.traps if t["ownerIndex"] == self.active_player_index]
                if my_traps:
                    t = my_traps[0]
                    t["damage"] = int(t["damage"] * 1.5)
                    t["goldTransfer"] = int(t["goldTransfer"] * 1.5)
                    t["level"] += 1
                    result_msg = f"成功！{active_player['name']} 的 {t['type']} 升級至等級 {t['level']}！"
                else:
                    result_msg = f"成功！但 {active_player['name']} 目前沒有設置任何陷阱。"
            else:
                result_msg = f"失敗！陷阱未升級。"

        elif card["type"] == "trap_downgrade":
            success = (roll_val >= 12)
            if success:
                result_msg = f"規避成功！無陷阱降級處罰。"
            else:
                my_traps = [t for t in self.traps if t["ownerIndex"] == self.active_player_index]
                if my_traps:
                    t = my_traps[0]
                    t["damage"] = max(1, int(t["damage"] / 1.5))
                    t["goldTransfer"] = max(1, int(t["goldTransfer"] / 1.5))
                    t["level"] = max(1, t["level"] - 1)
                    result_msg = f"失敗！{active_player['name']} 的 {t['type']} 降級至等級 {t['level']}。"
                else:
                    active_player["coins"] = max(0, active_player["coins"] - 5)
                    result_msg = f"失敗！因無設置陷阱，被扣除 $5 金幣。"

        elif card["type"] == "ultimate_trial":
            success = (roll_val >= 14)
            if success:
                active_player["victoryPoints"] += 2
                result_msg = f"挑戰成功！{active_player['name']} 獲得 +2 勝利點數！"
            else:
                active_player["hp"] = max(0, active_player["hp"] - 5)
                result_msg = f"挑戰失敗！{active_player['name']} 扣除 5 HP。"
                if active_player["hp"] <= 0:
                    self.active_fate = None
                    self.handle_player_death()
                    return self.get_state_dict()

        self.active_fate["challenge_rolled"] = True
        self.active_fate["challenge_success"] = success
        self.active_fate["result_msg"] = result_msg
        self.add_log(f"【命運挑戰】D20 擲出 {roll_val}：{result_msg}", "system")
        return self.get_state_dict()

    def close_fate_card(self):
        self.active_fate = None
        self.turn_state = "action"
        return self.get_state_dict()

    def end_turn(self):
        if self.turn_state != "action":
            return {"error": "Cannot end turn now"}

        # Loop to next living player
        while True:
            self.active_player_index = (self.active_player_index + 1) % len(self.players)
            if self.active_player_index == 0:
                self.turn_count += 1
                # 1 full round (all players) = flip day/night once
                self.is_day = not self.is_day
                self.round_in_day = 1 if self.is_day else 2
                if self.is_day:
                    self.day += 1
                    self.add_log(f"🌅 第 {self.day} 天來臨了，白天降臨！（回合 {self.turn_count}）", "system")
                else:
                    self.add_log(f"🌃 第 {self.day} 天入夜，夜晚降臨，部分怪物變強了！（回合 {self.turn_count}）", "system")

            if not self.players[self.active_player_index]["isDead"]:
                break

        self.turn_state = "roll"
        self.add_log(f"輪到 {self.get_active_player()['name']} 的回合。請擲骰移動！", "system")
        return self.get_state_dict()

    def buy_item(self, item_name):
        active_player = self.get_active_player()
        
        # Check shop config in tiers
        shop_item = None
        for tier, items in SHOP_ITEMS_BY_TIER.items():
            for x in items:
                if x["name"] == item_name:
                    shop_item = x
                    break
            if shop_item: break
            
        if not shop_item:
            return {"error": "Item not found in shop"}

        if active_player["coins"] < shop_item["price"]:
            return {"error": "Insufficient gold"}

        # Check duplicate
        if any(i["name"] == item_name for i in active_player["inventory"]):
            return {"error": "Already hold this item"}

        active_player["coins"] -= shop_item["price"]
        
        effect = shop_item.get("effectKey", "portable_bench")
        active_player["inventory"].append({
            "name": shop_item["name"],
            "desc": shop_item.get("effect", ""),
            "effect": effect
        })
        self.add_log(f"{active_player['name']} 購買了 【{item_name}】。", "system")
        return self.get_state_dict()

    def sell_material(self, material_name):
        active_player = self.get_active_player()
        if active_player["materials"].get(material_name, 0) <= 0:
            return {"error": "No such material in bag"}

        price = MATERIALS[material_name]["price"]
        active_player["materials"][material_name] -= 1
        active_player["coins"] += price
        self.add_log(f"{active_player['name']} 出售了 1 個 【{material_name}】，獲得 ${price}。", "system")
        return self.get_state_dict()

    def craft_item(self, recipe_name, recipe_level):
        active_player = self.get_active_player()
        recipes_pool = RECIPES.get(recipe_level, [])
        recipe = next((x for x in recipes_pool if x["name"] == recipe_name), None)

        if not recipe:
            return {"error": "Recipe not found"}

        # Validate materials
        for ing, qty in recipe["ingredients"].items():
            if active_player["materials"].get(ing, 0) < qty:
                return {"error": f"Insufficient material: {ing}"}

        # Consume ingredients
        for ing, qty in recipe["ingredients"].items():
            active_player["materials"][ing] -= qty

        # Craft results
        if recipe["resultType"] == "item":
            active_player["inventory"].append({
                "name": recipe["resultVal"]["name"],
                "desc": recipe["resultVal"]["desc"],
                "effect": recipe["resultVal"]["effect"]
            })
            self.add_log(f"【合成成功】{active_player['name']} 合成了 【{recipe['resultVal']['name']}】！", "craft-log")
        
        elif recipe["resultType"] == "trap":
            active_player["inventory"].append({
                "name": recipe["name"],
                "desc": recipe["resultVal"]["desc"]
            })
            self.add_log(f"【合成成功】{active_player['name']} 合成了陷阱道具 【{recipe['name']}】！", "craft-log")
        
        elif recipe["resultType"] == "random_low":
            options = [
                { "name": "初級治癒藥水", "desc": "回復 8 HP", "effect": "heal_8" },
                { "name": "探測礦石棒", "desc": "偵測前方 3 格陷阱", "effect": "detect" }
            ]
            chosen = random.choice(options)
            active_player["inventory"].append(chosen)
            self.add_log(f"【合成成功】{active_player['name']} 合成了隨機初級道具 【{chosen['name']}】！", "craft-log")

        return self.get_state_dict()

    def place_trap(self, trap_name):
        active_player = self.get_active_player()
        if active_player["activeTrapsCount"] >= 2:
            return {"error": "Cannot place more than 2 traps simultaneously"}

        item_idx = -1
        for idx, item in enumerate(active_player["inventory"]):
            if trap_name.split(" ")[0] in item["name"]:
                item_idx = idx
                break

        if item_idx == -1:
            return {"error": "Trap item not found in inventory"}

        # Determine trap parameters
        trap_type = "響鈴絆線"
        damage = 3
        gold_transfer = 4

        if "爆炸" in trap_name:
            trap_type = "爆炸符紙"
            damage = 6
            gold_transfer = 8
        elif "詛咒" in trap_name:
            trap_type = "終極詛咒石"
            damage = 10
            gold_transfer = 15

        # Record trap secrets
        self.traps.append({
            "tileIndex": self.current_occupied_trap_tile,
            "ownerIndex": self.active_player_index,
            "type": trap_type,
            "damage": damage,
            "goldTransfer": gold_transfer,
            "level": 1
        })

        active_player["inventory"].pop(item_idx)
        active_player["activeTrapsCount"] += 1
        self.add_log(f"【秘密埋設】{active_player['name']} 在當前格子秘密設下了陷阱。", "system")

        self.turn_state = "action"
        return self.get_state_dict()

    def use_item(self, item_index):
        active_player = self.get_active_player()
        if item_index < 0 or item_index >= len(active_player["inventory"]):
            return {"error": "Invalid item index"}

        item = active_player["inventory"][item_index]
        effect = item.get("effect", "")

        if effect == "heal_8":
            active_player["hp"] = min(active_player["maxHp"], active_player["hp"] + 8)
            active_player["inventory"].pop(item_index)
            self.add_log(f"{active_player['name']} 使用了【{item['name']}】，回復 8 HP。", "system")
        elif effect == "heal_15":
            active_player["hp"] = min(active_player["maxHp"], active_player["hp"] + 15)
            active_player["inventory"].pop(item_index)
            self.add_log(f"{active_player['name']} 使用了【{item['name']}】，回復 15 HP。", "system")
        else:
            return {"error": "This item cannot be used directly"}

        return self.get_state_dict()

    def trigger_game_over(self, reason):
        self.turn_state = "gameover"
        self.add_log(f"🏁 冒險結束：{reason}", "system")

        # Design spec §勝利點數系統: settlement bonuses
        living = [p for p in self.players if not p["isDead"]]
        if not living:
            return

        # +2 VP to richest player
        max_coins = max(p["coins"] for p in living)
        richest = [p for p in living if p["coins"] == max_coins]
        for p in richest:
            p["victoryPoints"] += 2
            self.add_log(f"💰 結算加分：{p['name']} 持有最多金幣 (${p['coins']})，獲得 +2 勝利點數！", "system")

        # +1 VP to player with most items
        max_items = max(len(p["inventory"]) for p in living)
        most_items = [p for p in living if len(p["inventory"]) == max_items]
        for p in most_items:
            p["victoryPoints"] += 1
            self.add_log(f"🎒 結算加分：{p['name']} 持有最多道具 ({len(p['inventory'])} 個)，獲得 +1 勝利點數！", "system")

    def use_detect_item(self):
        """探測礦石棒: reveal if any trap exists in the next 3 tiles ahead of the active player."""
        active_player = self.get_active_player()

        # Find and consume the detect item
        item_idx = next((i for i, it in enumerate(active_player["inventory"]) if it.get("effect") == "detect"), -1)
        if item_idx == -1:
            return {"error": "沒有探測礦石棒"}

        active_player["inventory"].pop(item_idx)

        cur_pos = active_player["position"]
        max_pos = len(PATH_COORDINATES) - 1
        scan_tiles = list(range(cur_pos + 1, min(cur_pos + 4, max_pos + 1)))

        trapped_tiles = []
        for t in self.traps:
            if t["tileIndex"] in scan_tiles and t["ownerIndex"] != self.active_player_index:
                trapped_tiles.append(t["tileIndex"])

        if trapped_tiles:
            self.add_log(f"🔍 {active_player['name']} 使用探測礦石棒，偵測到前方 {sorted(trapped_tiles)} 格有陷阱！", "system")
        else:
            self.add_log(f"🔍 {active_player['name']} 使用探測礦石棒，前方 3 格內無陷阱。", "system")

        result = self.get_state_dict()
        result["detectResult"] = {"scannedTiles": scan_tiles, "trappedTiles": trapped_tiles}
        return result

    def toggle_gm_mode(self):
        self.gm_mode = not self.gm_mode
        return self.get_state_dict()

    def get_state_dict(self):
        """
        Build JSON serializable state dict.
        Note: We strip secret traps positions if GM mode is off to prevent front-end inspect cheats!
        """
        # Clean traps list depending on view
        visible_traps = []
        for trap in self.traps:
            visible_traps.append({
                "tileIndex": trap["tileIndex"],
                "ownerIndex": trap["ownerIndex"],
                "type": trap["type"],
                "level": trap["level"],
                "damage": trap["damage"],
                "goldTransfer": trap["goldTransfer"]
            })

        # Calculate rankings for leaderboard on the fly
        leaderboard = []
        for p in self.players:
            leaderboard.append({
                "id": p["id"],
                "name": p["name"],
                "class": p.get("class", "戰士"),
                "color": p["color"],
                "hp": p["hp"],
                "maxHp": p["maxHp"],
                "mp": p.get("mp", 0),
                "maxMp": p.get("maxMp", 0),
                "coins": p["coins"],
                "victoryPoints": p["victoryPoints"],
                "inventoryCount": len(p["inventory"]),
                "isDead": p["isDead"]
            })

        return {
            "players": self.players,
            "activePlayerIndex": self.active_player_index,
            "turnCount": self.turn_count,
            "day": self.day,
            "isDay": self.is_day,
            "roundInDay": self.round_in_day,
            "traps": visible_traps,
            "boss": {
                "name": self.boss["name"],
                "hp": self.boss["hp"],
                "maxHp": self.boss["maxHp"],
                "atk": self.boss.get("atk", "4d12"),
                "def": self.boss.get("def", 0),
                "phases": self.boss.get("phases", []),
                "dealtDamagePlayers": self.boss["dealtDamagePlayers"]
            },
            "turnState": self.turn_state,
            "activeCombat": self.active_combat,
            "activeFate": self.active_fate,
            "logMessages": self.log_messages,
            "gmMode": self.gm_mode,
            "currentOccupiedTrapTile": self.current_occupied_trap_tile,
            "leaderboard": leaderboard
        }

    def save_to_dict(self):
        return {
            "players": self.players,
            "activePlayerIndex": self.active_player_index,
            "turnCount": self.turn_count,
            "day": self.day,
            "isDay": self.is_day,
            "roundInDay": self.round_in_day,
            "traps": self.traps,
            "boss": self.boss,
            "turnState": self.turn_state,
            "activeCombat": self.active_combat,
            "activeFate": self.active_fate,
            "logMessages": self.log_messages,
            "gmMode": self.gm_mode,
            "currentOccupiedTrapTile": self.current_occupied_trap_tile
        }

    def load_from_dict(self, d):
        self.players = d["players"]
        self.active_player_index = d["activePlayerIndex"]
        self.turn_count = d["turnCount"]
        self.day = d.get("day", 1)
        self.is_day = d.get("isDay", True)
        self.round_in_day = d.get("roundInDay", 0)
        self.traps = d["traps"]
        self.boss = d["boss"]
        self.turn_state = d["turnState"]
        self.active_combat = d["activeCombat"]
        self.active_fate = d["activeFate"]
        self.log_messages = d["logMessages"]
        self.gm_mode = d.get("gmMode", False)
        self.current_occupied_trap_tile = d.get("currentOccupiedTrapTile", None)
