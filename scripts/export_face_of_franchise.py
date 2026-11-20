import json
from collections import defaultdict
from pathlib import Path

import pandas as pd


EXCEL_FILE = Path(
    r"C:\Users\njcer\Downloads\NAFFL_History_v3.xlsx"
)

PROJECT_ROOT = (
    Path(__file__).resolve().parent.parent
)

TEAM_SEASONS_FILE = (
    PROJECT_ROOT
    / "public"
    / "data"
    / "team-seasons.json"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "public"
    / "data"
    / "face-of-franchise.json"
)


def clean_text(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def normalize_text(value):
    return clean_text(value).casefold()


def clean_number(value):
    if pd.isna(value) or value == "":
        return 0.0

    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0.0


# These are the Player x Owner worksheet columns
# and their corresponding canonical owners.
OWNER_COLUMN_MAP = {
    "Ceraso": "nick-ceraso",
    "DiDuca": "nick-diduca",
    "Iacoviello": "matt-iacoviello",
    "Hitchcock": "luke-hitchcock",
    "Burckhardt": "jake-burckhardt",
    "Boudreau": "john-boudreau",
    "falaras": "yanni-falaras",
    "Marcotte": "billy-marcotte",
    "Severin": "andrew-severin",
    "Wolfenden": "matt-wolfenden",
    "Chaff": "jake-chaff",
    "jordan": "owen-jordan",
    "wolfgang": "patrick-wolfgang",
}


# Load canonical owner names from the already-cleaned
# team-season export.
with TEAM_SEASONS_FILE.open(
    "r",
    encoding="utf-8",
) as team_seasons_file:
    team_seasons = json.load(
        team_seasons_file
    )


owner_names = {}

owner_id_by_last_name = {}

for team in team_seasons:
    owner_names[
        team["ownerId"]
    ] = team["ownerName"]

    owner_id_by_last_name[
        normalize_text(
            team["ownerLast"]
        )
    ] = team["ownerId"]


# Read the Player x Owner matrix.
player_owner_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Player x Owner",
)

player_owner_df.columns = [
    clean_text(column)
    for column in player_owner_df.columns
]


# Build a season lookup from Season_Rosters.
#
# This captures historic seasons where a player appeared
# on an owner's end-of-season roster.
player_owner_years = defaultdict(set)


season_rosters_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Season_Rosters",
)

for _, row in season_rosters_df.iterrows():
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    owner_last_key = normalize_text(
        row["Owner Last"]
    )

    owner_id = owner_id_by_last_name.get(
        owner_last_key
    )

    if not owner_id:
        continue

    season = int(
        row["Season"]
    )

    player_owner_years[
        (
            normalize_text(player),
            owner_id,
        )
    ].add(season)


# Add seasons from Player_Weeks_Export.
#
# This is useful when a player scored points for more than
# one owner during the same season.
player_weeks_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Player_Weeks_Export",
)

weekly_points_by_player_owner_year = defaultdict(
    float
)


for _, row in player_weeks_df.iterrows():
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    owner_last_key = normalize_text(
        row["Owner Last"]
    )

    owner_id = owner_id_by_last_name.get(
        owner_last_key
    )

    if not owner_id:
        continue

    season = int(
        row["Season"]
    )

    points = clean_number(
        row["Points"]
    )

    weekly_points_by_player_owner_year[
        (
            normalize_text(player),
            owner_id,
            season,
        )
    ] += points


for (
    player_key,
    owner_id,
    season,
), points in (
    weekly_points_by_player_owner_year.items()
):
    if points != 0:
        player_owner_years[
            (
                player_key,
                owner_id,
            )
        ].add(season)


records = []


for _, row in player_owner_df.iterrows():
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    player_key = normalize_text(
        player
    )

    for (
        worksheet_column,
        owner_id,
    ) in OWNER_COLUMN_MAP.items():
        if worksheet_column not in row:
            continue

        points = clean_number(
            row[worksheet_column]
        )

        if points <= 0:
            continue

        years = sorted(
            player_owner_years.get(
                (
                    player_key,
                    owner_id,
                ),
                set(),
            )
        )

        record = {
            "ownerId": owner_id,

            "ownerName":
                owner_names.get(
                    owner_id,
                    owner_id,
                ),

            "player": player,

            "points": points,

            "years": years,

            "yearCount": len(years),

            "firstYear":
                years[0]
                if years
                else None,

            "lastYear":
                years[-1]
                if years
                else None,
        }

        records.append(record)


# Assign rank within each owner's franchise.
records_by_owner = defaultdict(list)

for record in records:
    records_by_owner[
        record["ownerId"]
    ].append(record)


for owner_records in records_by_owner.values():
    owner_records.sort(
        key=lambda record: (
            -record["points"],
            record["player"],
        )
    )

    previous_points = None
    current_rank = 0

    for index, record in enumerate(
        owner_records,
        start=1,
    ):
        if (
            previous_points is None
            or record["points"]
            != previous_points
        ):
            current_rank = index

        record["ownerRank"] = (
            current_rank
        )

        previous_points = (
            record["points"]
        )


# Assign an all-time rank among every player-owner
# point combination.
all_time_sorted = sorted(
    records,
    key=lambda record: (
        -record["points"],
        record["ownerName"],
        record["player"],
    ),
)

previous_points = None
current_rank = 0

for index, record in enumerate(
    all_time_sorted,
    start=1,
):
    if (
        previous_points is None
        or record["points"]
        != previous_points
    ):
        current_rank = index

    record["allTimeRank"] = (
        current_rank
    )

    previous_points = (
        record["points"]
    )


# Return the JSON in owner/rank order.
records.sort(
    key=lambda record: (
        record["ownerName"],
        record["ownerRank"],
        record["player"],
    )
)


OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True,
)

with OUTPUT_FILE.open(
    "w",
    encoding="utf-8",
) as outfile:
    json.dump(
        records,
        outfile,
        indent=2,
        ensure_ascii=False,
    )


print(
    f"Exported {len(records)} "
    f"player-owner records"
)

print(
    f"Owners represented: "
    f"{len(records_by_owner)}"
)

print(
    f"Output file: {OUTPUT_FILE}"
)

for owner_id in sorted(
    records_by_owner,
    key=lambda item:
        owner_names.get(
            item,
            item,
        ),
):
    owner_records = (
        records_by_owner[
            owner_id
        ]
    )

    print(
        f"- "
        f"{owner_names.get(owner_id, owner_id)}: "
        f"{len(owner_records)} players"
    )