import json
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
    / "draft-history.json"
)


def clean_text(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def normalize_text(value):
    return clean_text(value).casefold()


def clean_integer(value):
    if pd.isna(value) or value == "":
        return 0

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def clean_number(value):
    if pd.isna(value) or value == "":
        return 0.0

    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0.0


def clean_points(value):
    """
    Convert numeric point values to decimals.

    Text values such as "Not on End of Season Roster"
    become None so the website can display N/A.
    """

    if pd.isna(value) or value == "":
        return None

    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def clean_keeper(value):
    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return value != 0

    text_value = normalize_text(value)

    return text_value in {
        "yes",
        "y",
        "true",
        "keeper",
        "kept",
        "1",
    }


# Load canonical team and owner information.
with TEAM_SEASONS_FILE.open(
    "r",
    encoding="utf-8",
) as team_seasons_file:
    team_seasons = json.load(
        team_seasons_file
    )


team_lookup = {}

for team in team_seasons:
    season = int(team["season"])

    team_name_key = normalize_text(
        team["teamName"]
    )

    owner_display_key = normalize_text(
        team.get(
            "ownerDisplay",
            "",
        )
    )

    team_lookup[
        (
            season,
            "team",
            team_name_key,
        )
    ] = team

    if owner_display_key:
        team_lookup[
            (
                season,
                "display",
                owner_display_key,
            )
        ] = team


# These two workbook sheets already contain the
# points associated with each draft record.
draft_points_frames = []

for sheet_name in [
    "Draft 13-18",
    "Draft 19-26",
]:
    sheet_df = pd.read_excel(
        EXCEL_FILE,
        sheet_name=sheet_name,
    )

    # Removes the trailing space from "Points ".
    sheet_df.columns = [
        clean_text(column)
        for column in sheet_df.columns
    ]

    draft_points_frames.append(
        sheet_df
    )


draft_points_df = pd.concat(
    draft_points_frames,
    ignore_index=True,
)


# Primary lookup:
# Season + Player ID
points_by_player_id = {}

# Fallback lookup:
# Season + normalized Player name
points_by_player_name = {}

numeric_point_records = 0
unavailable_point_records = 0


for _, row in draft_points_df.iterrows():
    season = clean_integer(
        row["Season"]
    )

    player_id = clean_text(
        row["Player ID"]
    )

    player_name_key = normalize_text(
        row["Player"]
    )

    points = clean_points(
        row["Points"]
    )

    if points is None:
        unavailable_point_records += 1
    else:
        numeric_point_records += 1

    if player_id:
        points_by_player_id[
            (
                season,
                player_id,
            )
        ] = points

    if player_name_key:
        points_by_player_name[
            (
                season,
                player_name_key,
            )
        ] = points


# Load the authoritative draft export.
df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Draft_Export",
)

df.columns = [
    clean_text(column)
    for column in df.columns
]


records = []

unmatched_team_records = []
unmatched_point_records = []

points_matched_by_id = 0
points_matched_by_name = 0


for _, row in df.iterrows():
    season = clean_integer(
        row["Season"]
    )

    player = clean_text(
        row["Player"]
    )

    player_id = clean_text(
        row["Player ID"]
    )

    player_name_key = normalize_text(
        player
    )

    excel_team_name = clean_text(
        row["Team Name"]
    )

    excel_owner_display = clean_text(
        row["Owner Display"]
    )

    canonical_team = team_lookup.get(
        (
            season,
            "team",
            normalize_text(
                excel_team_name
            ),
        )
    )

    if canonical_team is None:
        canonical_team = team_lookup.get(
            (
                season,
                "display",
                normalize_text(
                    excel_owner_display
                ),
            )
        )

    if canonical_team is None:
        unmatched_team_records.append(
            {
                "season": season,
                "teamName":
                    excel_team_name,
                "ownerDisplay":
                    excel_owner_display,
            }
        )

        owner_first = clean_text(
            row["Owner First"]
        )

        owner_last = clean_text(
            row["Owner Last"]
        )

        owner_name = (
            f"{owner_first} "
            f"{owner_last}"
        ).strip()

        owner_id = (
            owner_name
            .casefold()
            .replace(" ", "-")
        )

        team_name = excel_team_name

    else:
        owner_id = canonical_team[
            "ownerId"
        ]

        owner_name = canonical_team[
            "ownerName"
        ]

        owner_first = canonical_team[
            "ownerFirst"
        ]

        owner_last = canonical_team[
            "ownerLast"
        ]

        team_name = canonical_team[
            "teamName"
        ]

    points = None
    points_match_method = ""

    player_id_key = (
        season,
        player_id,
    )

    player_name_lookup_key = (
        season,
        player_name_key,
    )

    if (
        player_id and
        player_id_key
        in points_by_player_id
    ):
        points = points_by_player_id[
            player_id_key
        ]

        points_match_method = (
            "playerId"
        )

        points_matched_by_id += 1

    elif (
        player_name_key and
        player_name_lookup_key
        in points_by_player_name
    ):
        points = points_by_player_name[
            player_name_lookup_key
        ]

        points_match_method = (
            "playerName"
        )

        points_matched_by_name += 1

    else:
        unmatched_point_records.append(
            {
                "season": season,
                "player": player,
                "playerId": player_id,
            }
        )

    record = {
        "season": season,

        "round": clean_integer(
            row["Round"]
        ),

        "pick": clean_integer(
            row["Pick"]
        ),

        "points": points,

        "pointsMatchMethod":
            points_match_method,

        "player": player,

        "playerId": player_id,

        "teamName": team_name,

        "ownerId": owner_id,
        "ownerName": owner_name,
        "ownerFirst": owner_first,
        "ownerLast": owner_last,

        "ownerDisplay":
            excel_owner_display,

        "keeper": clean_keeper(
            row["Keeper"]
        ),

        "bidAmount": clean_number(
            row["Bid Amount"]
        ),
    }

    records.append(record)


records.sort(
    key=lambda record: (
        record["season"],
        record["round"],
        record["pick"],
        record["ownerName"],
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


exported_numeric_points = sum(
    1
    for record in records
    if record["points"] is not None
)

exported_unavailable_points = sum(
    1
    for record in records
    if record["points"] is None
)


print(
    f"Exported {len(records)} "
    f"draft records"
)

print(
    f"Output file: {OUTPUT_FILE}"
)

print(
    f"Source numeric point records: "
    f"{numeric_point_records}"
)

print(
    f"Source unavailable point records: "
    f"{unavailable_point_records}"
)

print(
    f"Points matched by Player ID: "
    f"{points_matched_by_id}"
)

print(
    f"Points matched by player name: "
    f"{points_matched_by_name}"
)

print(
    f"Exported records with points: "
    f"{exported_numeric_points}"
)

print(
    f"Exported records displaying N/A: "
    f"{exported_unavailable_points}"
)

print(
    f"Unmatched point records: "
    f"{len(unmatched_point_records)}"
)

print(
    f"Unmatched team records: "
    f"{len(unmatched_team_records)}"
)


if unmatched_point_records:
    print(
        "Draft records with no "
        "matching point record:"
    )

    for unmatched in (
        unmatched_point_records[:25]
    ):
        print(
            "- "
            f"{unmatched['season']}: "
            f"{unmatched['player']} "
            f"({unmatched['playerId']})"
        )


if unmatched_team_records:
    print(
        "Draft records missing "
        "canonical teams:"
    )

    unique_unmatched_teams = {
        (
            record["season"],
            record["teamName"],
            record["ownerDisplay"],
        )
        for record
        in unmatched_team_records
    }

    for (
        unmatched_season,
        unmatched_team_name,
        unmatched_owner_display,
    ) in sorted(
        unique_unmatched_teams
    ):
        print(
            "- "
            f"{unmatched_season}: "
            f"{unmatched_team_name} / "
            f"{unmatched_owner_display}"
        )