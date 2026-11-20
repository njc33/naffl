import json
from collections import defaultdict
from pathlib import Path

import pandas as pd


EXCEL_FILE = Path(
    r"C:\Users\njcer\Downloads\NAFFL_History_v3.xlsx"
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent

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


def clean_optional_number(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def clean_integer(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def clean_keeper(value):
    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return value != 0

    return normalize_text(value) in {
        "yes",
        "y",
        "true",
        "keeper",
        "kept",
        "1",
    }


# Load the canonical owner identities.
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


# Load Player x Owner career totals.
player_owner_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Player x Owner",
)

player_owner_df.columns = [
    clean_text(column)
    for column in player_owner_df.columns
]


# Store every season associated with each player-owner pair.
player_owner_years = defaultdict(set)


# End-of-season roster points provide a fallback for seasons
# without detailed weekly ownership records.
roster_points_by_player_owner_year = {}


season_rosters_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Season_Rosters",
)

season_rosters_df.columns = [
    clean_text(column)
    for column in season_rosters_df.columns
]


for _, row in season_rosters_df.iterrows():
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    owner_id = owner_id_by_last_name.get(
        normalize_text(
            row["Owner Last"]
        )
    )

    if not owner_id:
        continue

    season = int(
        row["Season"]
    )

    lookup_key = (
        normalize_text(player),
        owner_id,
        season,
    )

    player_owner_years[
        (
            normalize_text(player),
            owner_id,
        )
    ].add(season)

    roster_points_by_player_owner_year[
        lookup_key
    ] = clean_optional_number(
        row["Total Points"]
    )


# Weekly ownership records are more precise when a player
# scored for multiple fantasy owners in the same season.
weekly_points_by_player_owner_year = defaultdict(float)
weekly_record_count = defaultdict(int)


player_weeks_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Player_Weeks_Export",
)

player_weeks_df.columns = [
    clean_text(column)
    for column in player_weeks_df.columns
]


for _, row in player_weeks_df.iterrows():
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    owner_id = owner_id_by_last_name.get(
        normalize_text(
            row["Owner Last"]
        )
    )

    if not owner_id:
        continue

    season = int(
        row["Season"]
    )

    lookup_key = (
        normalize_text(player),
        owner_id,
        season,
    )

    weekly_points_by_player_owner_year[
        lookup_key
    ] += clean_number(
        row["Points"]
    )

    weekly_record_count[
        lookup_key
    ] += 1


for (
    player_key,
    owner_id,
    season,
), count in weekly_record_count.items():
    if count > 0:
        player_owner_years[
            (
                player_key,
                owner_id,
            )
        ].add(season)


# Draft details and Net vs Avg R.
cda_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="CDA_All",
)

cda_df.columns = [
    clean_text(column)
    for column in cda_df.columns
]


draft_details_by_player_owner_year = defaultdict(list)
sum_net_points_by_player_owner = defaultdict(float)
net_value_count_by_player_owner = defaultdict(int)


for _, row in cda_df.iterrows():
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    owner_id = owner_id_by_last_name.get(
        normalize_text(
            row["Owner Last"]
        )
    )

    if not owner_id:
        continue

    season = clean_integer(
        row["Season"]
    )

    if season is None:
        continue

    player_key = normalize_text(
        player
    )

    round_number = clean_integer(
        row["Round"]
    )

    pick = clean_integer(
        row["Pick"]
    )

    points = clean_optional_number(
        row["Points"]
    )

    net_points = clean_optional_number(
        row["Net vs Avg R"]
    )

    keeper = clean_keeper(
        row["Keeper"]
    )

    detail = {
        "season": season,
        "round": round_number,
        "pick": pick,
        "points": points,
        "netPoints": net_points,
        "keeper": keeper,
    }

    detail_lookup_key = (
        player_key,
        owner_id,
        season,
    )

    draft_details_by_player_owner_year[
        detail_lookup_key
    ].append(detail)

    player_owner_years[
        (
            player_key,
            owner_id,
        )
    ].add(season)

    if net_points is not None:
        sum_net_points_by_player_owner[
            (
                player_key,
                owner_id,
            )
        ] += net_points

        net_value_count_by_player_owner[
            (
                player_key,
                owner_id,
            )
        ] += 1


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
        if (
            worksheet_column
            not in player_owner_df.columns
        ):
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

        season_details = []

        for year in years:
            detail_lookup_key = (
                player_key,
                owner_id,
                year,
            )

            draft_details = (
                draft_details_by_player_owner_year.get(
                    detail_lookup_key,
                    [],
                )
            )

            weekly_points = None

            if (
                weekly_record_count.get(
                    detail_lookup_key,
                    0,
                ) > 0
            ):
                weekly_points = round(
                    weekly_points_by_player_owner_year[
                        detail_lookup_key
                    ],
                    2,
                )

            roster_points = (
                roster_points_by_player_owner_year.get(
                    detail_lookup_key
                )
            )

            if draft_details:
                for draft_detail in draft_details:
                    detail_points = (
                        weekly_points
                        if weekly_points is not None
                        else roster_points
                    )

                    if detail_points is None:
                        detail_points = (
                            draft_detail["points"]
                        )

                    season_details.append(
                        {
                            "season": year,
                            "round":
                                draft_detail["round"],
                            "pick":
                                draft_detail["pick"],
                            "points":
                                detail_points,
                            "netPoints":
                                draft_detail["netPoints"],
                            "keeper":
                                draft_detail["keeper"],
                            "drafted": True,
                        }
                    )

            else:
                detail_points = (
                    weekly_points
                    if weekly_points is not None
                    else roster_points
                )

                season_details.append(
                    {
                        "season": year,
                        "round": None,
                        "pick": None,
                        "points":
                            detail_points,
                        "netPoints": None,
                        "keeper": False,
                        "drafted": False,
                    }
                )

        season_details.sort(
            key=lambda detail: (
                detail["season"],
                detail["round"]
                if detail["round"] is not None
                else 999,
                detail["pick"]
                if detail["pick"] is not None
                else 9999,
            )
        )

        net_lookup_key = (
            player_key,
            owner_id,
        )

        net_record_count = (
            net_value_count_by_player_owner.get(
                net_lookup_key,
                0,
            )
        )

        sum_net_points = (
            round(
                sum_net_points_by_player_owner.get(
                    net_lookup_key,
                    0.0,
                ),
                2,
            )
            if net_record_count > 0
            else None
        )

        records.append(
            {
                "ownerId": owner_id,
                "ownerName":
                    owner_names.get(
                        owner_id,
                        owner_id,
                    ),
                "player": player,
                "points": points,
                "sumNetPoints":
                    sum_net_points,
                "netDraftRecordCount":
                    net_record_count,
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
                "seasonDetails":
                    season_details,
            }
        )


# Franchise ranks.
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

        record["ownerRank"] = current_rank
        previous_points = record["points"]


# All-time player-owner ranks.
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

    record["allTimeRank"] = current_rank
    previous_points = record["points"]


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


detail_count = sum(
    len(record["seasonDetails"])
    for record in records
)


print(
    f"Exported {len(records)} "
    f"player-owner records"
)

print(
    f"Exported {detail_count} "
    f"player season-detail records"
)

print(
    f"Owners represented: "
    f"{len(records_by_owner)}"
)

print(
    f"Output file: {OUTPUT_FILE}"
)