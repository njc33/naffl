import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "public" / "data"


def clean_text(value):
    if value is None:
        return ""
    return str(value).strip()


def normalize_name(value):
    return clean_text(value).casefold()


def normalize_position(value):
    position = clean_text(value).upper().replace("DST", "D/ST")
    if position in {"DEF", "D", "D/ST"}:
        return "D/ST"
    if position in {"QB", "RB", "WR", "TE", "K"}:
        return position
    return ""


def load_json(filename):
    path = DATA_DIR / filename
    with path.open("r", encoding="utf-8") as source_file:
        return json.load(source_file)


def save_json(filename, data):
    path = DATA_DIR / filename
    with path.open("w", encoding="utf-8") as output_file:
        json.dump(data, output_file, indent=2, ensure_ascii=False)


roster_records = load_json("roster-history.json")

position_by_season_player_id = {}
position_by_season_player_name = {}
latest_position_by_player_id = {}
latest_position_by_player_name = {}
latest_season_by_player_id = {}
latest_season_by_player_name = {}

for record in roster_records:
    season = int(record["season"])
    player_id = clean_text(record.get("playerId"))
    player_name = normalize_name(record.get("player"))
    position = normalize_position(record.get("position"))

    if not position:
        continue

    if player_id:
        position_by_season_player_id[(season, player_id)] = position
        if season >= latest_season_by_player_id.get(player_id, -1):
            latest_season_by_player_id[player_id] = season
            latest_position_by_player_id[player_id] = position

    if player_name:
        position_by_season_player_name[(season, player_name)] = position
        if season >= latest_season_by_player_name.get(player_name, -1):
            latest_season_by_player_name[player_name] = season
            latest_position_by_player_name[player_name] = position


def resolve_position(season, player_id=None, player_name=None):
    season = int(season)
    player_id = clean_text(player_id)
    player_name = normalize_name(player_name)

    if player_id:
        position = position_by_season_player_id.get((season, player_id))
        if position:
            return position

    if player_name:
        position = position_by_season_player_name.get((season, player_name))
        if position:
            return position

    if player_id:
        position = latest_position_by_player_id.get(player_id)
        if position:
            return position

    if player_name:
        position = latest_position_by_player_name.get(player_name)
        if position:
            return position

    return "N/A"


summary = {}

# Draft History
records = load_json("draft-history.json")
matched = 0
for record in records:
    record["position"] = resolve_position(
        record["season"],
        record.get("playerId"),
        record.get("player"),
    )
    matched += record["position"] != "N/A"
save_json("draft-history.json", records)
summary["draft-history.json"] = (matched, len(records))

# Player History
records = load_json("player-history.json")
matched = 0
for record in records:
    record["position"] = resolve_position(
        record["season"],
        record.get("playerId"),
        record.get("player"),
    )
    matched += record["position"] != "N/A"
save_json("player-history.json", records)
summary["player-history.json"] = (matched, len(records))

# Face of the Franchise
records = load_json("face-of-franchise.json")
matched = 0
for record in records:
    player_name = record.get("player")
    details = record.get("seasonDetails", [])

    for detail in details:
        detail["position"] = resolve_position(
            detail["season"],
            None,
            player_name,
        )

    detail_positions = [
        detail["position"]
        for detail in sorted(
            details,
            key=lambda item: int(item["season"]),
            reverse=True,
        )
        if detail.get("position") not in {None, "", "N/A"}
    ]

    record["position"] = (
        detail_positions[0]
        if detail_positions
        else resolve_position(
            record.get("lastYear") or record.get("firstYear") or 0,
            None,
            player_name,
        )
    )
    matched += record["position"] != "N/A"

save_json("face-of-franchise.json", records)
summary["face-of-franchise.json"] = (matched, len(records))

print("Player-position enrichment complete")
for filename, (matched, total) in summary.items():
    print(f"{filename}: {matched}/{total} records matched")
