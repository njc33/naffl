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


def clean_integer(value):
    if pd.isna(value) or value == "":
        return 0

    return int(float(value))


def clean_number(value):
    if pd.isna(value) or value == "":
        return 0

    return round(float(value), 2)


def clean_keeper(value):
    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return value != 0

    text_value = (
        str(value)
        .strip()
        .casefold()
    )

    return text_value in {
        "yes",
        "y",
        "true",
        "keeper",
        "kept",
        "1",
    }


with TEAM_SEASONS_FILE.open(
    "r",
    encoding="utf-8",
) as team_seasons_file:
    team_seasons = json.load(
        team_seasons_file
    )


team_lookup = {}

for team in team_seasons:
    season = int(
        team["season"]
    )

    team_name_key = (
        str(
            team["teamName"]
        )
        .strip()
        .casefold()
    )

    owner_display_key = (
        str(
            team.get(
                "ownerDisplay",
                "",
            )
        )
        .strip()
        .casefold()
    )

    team_lookup[
        (
            season,
            team_name_key,
        )
    ] = team

    if owner_display_key:
        team_lookup[
            (
                season,
                owner_display_key,
            )
        ] = team


df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Draft_Export",
)

records = []

unmatched_records = []

for _, row in df.iterrows():
    season = clean_integer(
        row["Season"]
    )

    excel_team_name = clean_text(
        row["Team Name"]
    )

    excel_owner_display = clean_text(
        row["Owner Display"]
    )

    team_name_key = (
        excel_team_name.casefold()
    )

    owner_display_key = (
        excel_owner_display.casefold()
    )

    canonical_team = team_lookup.get(
        (
            season,
            team_name_key,
        )
    )

    if canonical_team is None:
        canonical_team = team_lookup.get(
            (
                season,
                owner_display_key,
            )
        )

    if canonical_team is None:
        unmatched_records.append(
            {
                "season": season,
                "teamName": excel_team_name,
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

    record = {
        "season": season,

        "round": clean_integer(
            row["Round"]
        ),

        "pick": clean_integer(
            row["Pick"]
        ),

        "player": clean_text(
            row["Player"]
        ),

        "playerId": clean_text(
            row["Player ID"]
        ),

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
    f"Exported {len(records)} "
    f"draft records"
)

print(
    f"Output file: {OUTPUT_FILE}"
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
    f"Unmatched draft records: "
    f"{len(unmatched_records)}"
)

if unmatched_records:
    unique_unmatched = {
        (
            record["season"],
            record["teamName"],
            record["ownerDisplay"],
        )
        for record in unmatched_records
    }

    for (
        unmatched_season,
        unmatched_team_name,
        unmatched_owner_display,
    ) in sorted(
        unique_unmatched
    ):
        print(
            "- "
            f"{unmatched_season}: "
            f"{unmatched_team_name} / "
            f"{unmatched_owner_display}"
        )