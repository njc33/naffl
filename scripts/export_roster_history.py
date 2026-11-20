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
    / "roster-history.json"
)


def clean_text(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def clean_number(value):
    if pd.isna(value):
        return 0

    return round(float(value), 2)


# Use the cleaned, canonical owner identities that
# already exist in team-seasons.json.
with TEAM_SEASONS_FILE.open(
    "r",
    encoding="utf-8",
) as team_seasons_file:
    team_seasons = json.load(
        team_seasons_file
    )


team_lookup = {}

for team in team_seasons:
    lookup_key = (
        int(team["season"]),
        int(team["teamId"]),
    )

    team_lookup[lookup_key] = {
        "ownerId": team["ownerId"],
        "ownerName": team["ownerName"],
        "ownerFirst": team["ownerFirst"],
        "ownerLast": team["ownerLast"],
        "teamName": team["teamName"],
    }


df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Season_Rosters",
)

records = []

missing_team_matches = []

for _, row in df.iterrows():
    season = int(row["Season"])
    team_id = int(row["Team ID"])

    lookup_key = (
        season,
        team_id,
    )

    canonical_team = team_lookup.get(
        lookup_key
    )

    if canonical_team is None:
        missing_team_matches.append(
            lookup_key
        )

        owner_first = clean_text(
            row["Owner First"]
        )

        owner_last = clean_text(
            row["Owner Last"]
        )

        owner_name = (
            f"{owner_first} {owner_last}"
        ).strip()

        owner_id = (
            owner_name
            .casefold()
            .replace(" ", "-")
        )

        team_name = clean_text(
            row["Team Name"]
        )
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

    record = {
        "season": season,
        "teamId": team_id,
        "teamName": team_name,

        "ownerId": owner_id,
        "ownerName": owner_name,
        "ownerFirst": owner_first,
        "ownerLast": owner_last,

        "player": clean_text(
            row["Player"]
        ),

        "playerId": clean_text(
            row["Player ID"]
        ),

        "position": clean_text(
            row["Position"]
        ),

        "nflTeam": clean_text(
            row["NFL Team"]
        ),

        "totalPoints": clean_number(
            row["Total Points"]
        ),

        "averagePoints": clean_number(
            row["Average Points"]
        ),

        "projectedTotalPoints":
            clean_number(
                row[
                    "Projected Total Points"
                ]
            ),
    }

    records.append(record)


records.sort(
    key=lambda record: (
        record["season"],
        record["ownerName"],
        record["position"],
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


unique_seasons = sorted(
    {
        record["season"]
        for record in records
    }
)

unique_owners = sorted(
    {
        (
            record["ownerId"],
            record["ownerName"],
        )
        for record in records
    },
    key=lambda owner: owner[1],
)


print(
    f"Exported {len(records)} roster records"
)

print(
    f"Seasons: "
    f"{unique_seasons[0]}-"
    f"{unique_seasons[-1]}"
)

print(
    f"Canonical owners: "
    f"{len(unique_owners)}"
)

print(
    f"Output file: {OUTPUT_FILE}"
)

print(
    f"Missing team matches: "
    f"{len(set(missing_team_matches))}"
)

if missing_team_matches:
    for season, team_id in sorted(
        set(missing_team_matches)
    ):
        print(
            f"- Season {season}, "
            f"Team ID {team_id}"
        )