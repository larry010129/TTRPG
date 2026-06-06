"""One-time helper: export map_manager data to game-config.js"""
import json
import map_manager as m

cfg = {
    "materials": m.MATERIALS,
    "recipes": {
        level: [
            {
                "name": r["name"],
                "ingredients": r["ingredients"],
                "resultType": r["resultType"],
                "resultLabel": (
                    r["resultVal"]["name"]
                    if r["resultVal"] and "name" in r["resultVal"]
                    else r["name"]
                ),
                "resultVal": r["resultVal"],
            }
            for r in recipes_list
        ]
        for level, recipes_list in m.RECIPES.items()
    },
    "shopItems": [
        {**item, "price": tier, "effectKey": item.get("effectKey") or m.SHOP_ITEM_EFFECTS.get(item["name"], "passive")}
        for tier, items in m.SHOP_ITEMS_BY_TIER.items()
        for item in items
    ],
    "classes": m.CLASSES,
    "enemies": m.ENEMIES,
    "finalBoss": m.FINAL_BOSS,
    "fateCards": m.FATE_CARDS,
    "chanceCards": m.CHANCE_CARDS,
    "statusEffects": m.STATUS_EFFECTS,
    "dayNightRules": m.DAY_NIGHT_RULES,
    "board": m.PATH_COORDINATES,
    "playerColors": ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"],
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
        "anchor": "fa-link",
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
        "craft-log": "fa-anvil",
    },
    "diceSides": [4, 6, 8, 10, 12, 20],
}

with open("game-config.js", "w", encoding="utf-8") as f:
    f.write("const GAME_CONFIG = ")
    json.dump(cfg, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print(f"Exported game-config.js ({len(cfg['shopItems'])} shop items)")
