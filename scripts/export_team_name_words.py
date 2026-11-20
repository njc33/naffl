import json
import re
from collections import defaultdict
from pathlib import Path

import pandas as pd


EXCEL_FILE = Path(
    r"C:\Users\njcer\Downloads\NAFFL_History_v3.xlsx"
)

PROJECT_ROOT = (
    Path(__file__).resolve().parent.parent
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "public"
    / "data"
    / "team-name-words.json"
)


# These words remain in the exported data, but the
# webpage hides them by default. The user can choose
# to show them.
COMMON_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "at",
    "for",
    "from",
    "in",
    "is",
    "it",
    "my",
    "of",
    "on",
    "the",
    "this",
    "to",
    "with",
    "your",
    "team",
}


def clean_text(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def normalize_word(value):
    normalized = (
        clean_text(value)
        .casefold()
        .replace("’", "'")
        .replace("‘", "'")
    )

    # Treat a possessive ending as the base word.
    if normalized.endswith("'s"):
        normalized = normalized[:-2]

    normalized = re.sub(
        r"[^a-z0-9]+",
        "",
        normalized,
    )

    return normalized


def tokenize_team_name(team_name):
    team_name = (
        clean_text(team_name)
        .replace("’", "'")
        .replace("‘", "'")
    )

    raw_words = re.findall(
        r"[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?",
        team_name,
    )

    tokens = []

    for raw_word in raw_words:
        normalized_word = normalize_word(
            raw_word
        )

        if not normalized_word:
            continue

        tokens.append(
            {
                "word": normalized_word,
                "displayWord":
                    normalized_word.title(),
            }
        )

    return tokens


df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Team_Seasons_Export",
)

df.columns = [
    clean_text(column)
    for column in df.columns
]


team_name_records = []
word_occurrences = defaultdict(list)


for _, row in df.iterrows():
    season = int(
        float(
            row["Season"]
        )
    )

    team_name = clean_text(
        row["Team Name"]
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

    owner_display = clean_text(
        row["Owner Display"]
    )

    team_record = {
        "season": season,
        "teamName": team_name,
        "ownerId": owner_id,
        "ownerName": owner_name,
        "ownerDisplay": owner_display,
    }

    team_name_records.append(
        team_record
    )

    # Count a word only once within the same team name.
    # For example, "Team Team Team" is one team-name use.
    unique_words_in_name = {}

    for token in tokenize_team_name(
        team_name
    ):
        unique_words_in_name[
            token["word"]
        ] = token["displayWord"]

    for (
        normalized_word,
        display_word,
    ) in unique_words_in_name.items():
        word_occurrences[
            normalized_word
        ].append(
            {
                "season": season,
                "teamName": team_name,
                "ownerId": owner_id,
                "ownerName": owner_name,
                "ownerDisplay":
                    owner_display,
                "displayWord":
                    display_word,
            }
        )


word_records = []


for (
    normalized_word,
    occurrences,
) in word_occurrences.items():
    occurrences.sort(
        key=lambda record: (
            record["season"],
            record["ownerName"],
            record["teamName"],
        )
    )

    display_word_counts = defaultdict(int)

    for occurrence in occurrences:
        display_word_counts[
            occurrence["displayWord"]
        ] += 1

    preferred_display_word = max(
        display_word_counts,
        key=lambda display_word: (
            display_word_counts[
                display_word
            ],
            len(display_word),
        ),
    )

    distinct_team_names = {
        occurrence["teamName"]
        for occurrence in occurrences
    }

    distinct_owners = {
        occurrence["ownerId"]
        for occurrence in occurrences
    }

    word_records.append(
        {
            "word": normalized_word,

            "displayWord":
                preferred_display_word,

            "count":
                len(occurrences),

            "distinctTeamNameCount":
                len(
                    distinct_team_names
                ),

            "ownerCount":
                len(distinct_owners),

            "isCommon":
                normalized_word
                in COMMON_WORDS,

            "occurrences":
                occurrences,
        }
    )


word_records.sort(
    key=lambda record: (
        -record["count"],
        record["displayWord"],
    )
)


output = {
    "summary": {
        "teamSeasonRecords":
            len(team_name_records),

        "distinctTeamNames":
            len(
                {
                    record["teamName"]
                    for record
                    in team_name_records
                }
            ),

        "distinctWords":
            len(word_records),
    },

    "words": word_records,
}


OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True,
)

with OUTPUT_FILE.open(
    "w",
    encoding="utf-8",
) as outfile:
    json.dump(
        output,
        outfile,
        indent=2,
        ensure_ascii=False,
    )


print(
    f"Exported {len(word_records)} "
    f"distinct team-name words"
)

print(
    "Distinct team names: "
    f"{output['summary']['distinctTeamNames']}"
)

print(
    "Team-season records: "
    f"{output['summary']['teamSeasonRecords']}"
)

print(
    f"Output file: {OUTPUT_FILE}"
)

print("Most common words:")

for record in word_records[:20]:
    print(
        "- "
        f"{record['displayWord']}: "
        f"{record['count']}"
    )