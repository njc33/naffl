import json
from pathlib import Path

import pandas as pd


# Locate the Excel workbook.
EXCEL_FILE = Path(
    r"C:\Users\njcer\Downloads\NAFFL_History_v3.xlsx"
)

# Locate the project folder based on this script's location.
# export_team_seasons.py is inside:
# C:\Projects\naffl-history\scripts
PROJECT_ROOT = Path(__file__).resolve().parent.parent

OUTPUT_FILE = (
    PROJECT_ROOT
    / "public"
    / "data"
    / "team-seasons.json"
)


def normalize_owner_last(value):
    """
    Convert known variations of an owner's last name
    into one consistent value.
    """

    owner_last = str(value).strip()

    # casefold() is a stronger case-insensitive comparison
    # than lower().
    normalized_key = owner_last.casefold()

    owner_name_fixes = {
        "falaras": "Falaras",
    }

    return owner_name_fixes.get(
        normalized_key,
        owner_last,
    )


df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Team_Seasons_Export",
)

records = []

for _, row in df.iterrows():
    owner_last = normalize_owner_last(
        row["Owner Last"]
    )

    record = {
        "season": int(row["Season"]),
        "teamId": int(row["Team ID"]),
        "teamName": str(
            row["Team Name"]
        ).strip(),
        "ownerFirst": str(
            row["Owner First"]
        ).strip(),
        "ownerLast": owner_last,
        "ownerDisplay": str(
            row["Owner Display"]
        ).strip(),
        "wins": int(row["Wins"]),
        "losses": int(row["Losses"]),
        "ties": int(row["Ties"]),
        "pointsFor": round(
            float(row["Points For"]),
            2,
        ),
        "pointsAgainst": round(
            float(row["Points Against"]),
            2,
        ),
        "regularSeasonStanding": int(
            row["Standing"]
        ),
        "finalStanding": int(
            row["Final Standing"]
        ),
        "acquisitions": int(
            row["Acquisitions"]
        ),
        "drops": int(
            row["Drops"]
        ),
        "trades": int(
            row["Trades"]
        ),
    }

    records.append(record)


# Make sure the output folder exists.
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


# Confirm that all casing variations were consolidated.
falaras_records = [
    record
    for record in records
    if record["ownerLast"] == "Falaras"
]

lowercase_falaras_records = [
    record
    for record in records
    if record["ownerLast"] == "falaras"
]


print(
    f"Exported {len(records)} team seasons"
)

print(
    f"Output file: {OUTPUT_FILE}"
)

print(
    f"Falaras records after cleanup: "
    f"{len(falaras_records)}"
)

print(
    f"Lowercase falaras records remaining: "
    f"{len(lowercase_falaras_records)}"
)