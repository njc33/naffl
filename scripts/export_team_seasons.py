import json
from pathlib import Path

import pandas as pd


EXCEL_FILE = Path(
    r"C:\Users\njcer\Downloads\NAFFL_History_v3.xlsx"
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent

OUTPUT_FILE = (
    PROJECT_ROOT
    / "public"
    / "data"
    / "team-seasons.json"
)


# Canonical owner information.
#
# The dictionary key is a lowercase version of the
# Owner Last field from Excel.
#
# This allows differently capitalized versions such as
# "falaras" and "Falaras" to resolve to the same owner.
OWNER_MAP = {
    "boudreau": {
        "ownerId": "john-boudreau",
        "ownerFirst": "John",
        "ownerLast": "Boudreau",
        "ownerName": "John Boudreau",
    },
    "burckhardt": {
        "ownerId": "jake-burckhardt",
        "ownerFirst": "Jake",
        "ownerLast": "Burckhardt",
        "ownerName": "Jake Burckhardt",
    },
    "ceraso": {
        "ownerId": "nick-ceraso",
        "ownerFirst": "Nick",
        "ownerLast": "Ceraso",
        "ownerName": "Nick Ceraso",
    },
    "chaff": {
        "ownerId": "jake-chaff",
        "ownerFirst": "Jake",
        "ownerLast": "Chaff",
        "ownerName": "Jake Chaff",
    },
    "diduca": {
        "ownerId": "nick-diduca",
        "ownerFirst": "Nick",
        "ownerLast": "DiDuca",
        "ownerName": "Nick DiDuca",
    },
    "falaras": {
        "ownerId": "yanni-falaras",
        "ownerFirst": "Yanni",
        "ownerLast": "Falaras",
        "ownerName": "Yanni Falaras",
    },
    "hitchcock": {
        "ownerId": "luke-hitchcock",
        "ownerFirst": "Luke",
        "ownerLast": "Hitchcock",
        "ownerName": "Luke Hitchcock",
    },
    "iacoviello": {
        "ownerId": "matt-iacoviello",
        "ownerFirst": "Matt",
        "ownerLast": "Iacoviello",
        "ownerName": "Matt Iacoviello",
    },
    "jordan": {
        "ownerId": "owen-jordan",
        "ownerFirst": "Owen",
        "ownerLast": "Jordan",
        "ownerName": "Owen Jordan",
    },
    "marcotte": {
        "ownerId": "billy-marcotte",
        "ownerFirst": "Billy",
        "ownerLast": "Marcotte",
        "ownerName": "Billy Marcotte",
    },

    # John Severin and Andrew Severin are intentionally
    # treated as one historical owner/franchise.
    "severin": {
        "ownerId": "andrew-severin",
        "ownerFirst": "Andrew",
        "ownerLast": "Severin",
        "ownerName": "Andrew Severin",
    },

    # Matt and Matthew Wolfenden are intentionally
    # treated as one historical owner.
    "wolfenden": {
        "ownerId": "matt-wolfenden",
        "ownerFirst": "Matt",
        "ownerLast": "Wolfenden",
        "ownerName": "Matt Wolfenden",
    },
    "wolfgang": {
        "ownerId": "patrick-wolfgang",
        "ownerFirst": "Patrick",
        "ownerLast": "Wolfgang",
        "ownerName": "Patrick Wolfgang",
    },
}


def clean_text(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def create_owner_id(first_name, last_name):
    clean_first = (
        clean_text(first_name)
        .casefold()
        .replace(" ", "-")
    )

    clean_last = (
        clean_text(last_name)
        .casefold()
        .replace(" ", "-")
    )

    return f"{clean_first}-{clean_last}"


def get_owner_data(row):
    original_first = clean_text(
        row["Owner First"]
    )

    original_last = clean_text(
        row["Owner Last"]
    )

    owner_key = original_last.casefold()

    if owner_key in OWNER_MAP:
        return OWNER_MAP[owner_key]

    # Safe fallback for an owner who may be added
    # to the workbook in the future.
    fallback_first = original_first.title()
    fallback_last = original_last.title()

    return {
        "ownerId": create_owner_id(
            fallback_first,
            fallback_last,
        ),
        "ownerFirst": fallback_first,
        "ownerLast": fallback_last,
        "ownerName": (
            f"{fallback_first} {fallback_last}"
        ).strip(),
    }


df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Team_Seasons_Export",
)

records = []

for _, row in df.iterrows():
    owner = get_owner_data(row)

    record = {
        "season": int(row["Season"]),
        "teamId": int(row["Team ID"]),
        "teamName": clean_text(
            row["Team Name"]
        ),

        "ownerId": owner["ownerId"],
        "ownerName": owner["ownerName"],
        "ownerFirst": owner["ownerFirst"],
        "ownerLast": owner["ownerLast"],

        "ownerDisplay": clean_text(
            row["Owner Display"]
        ),

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
    f"Exported {len(records)} team seasons"
)

print(
    f"Output file: {OUTPUT_FILE}"
)

print(
    f"Canonical owners: {len(unique_owners)}"
)

for owner_id, owner_name in unique_owners:
    owner_seasons = sum(
        1
        for record in records
        if record["ownerId"] == owner_id
    )

    print(
        f"- {owner_name}: "
        f"{owner_seasons} seasons"
    )