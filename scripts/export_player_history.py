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
    / "player-history.json"
)


def clean_text(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def normalize_text(value):
    return clean_text(value).casefold()


def clean_optional_number(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return round(
            float(value),
            2,
        )
    except (TypeError, ValueError):
        return None


def clean_integer(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return int(
            float(value)
        )
    except (TypeError, ValueError):
        return None


def clean_keeper(value):
    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    if isinstance(
        value,
        (int, float),
    ):
        return value != 0

    return normalize_text(value) in {
        "yes",
        "y",
        "true",
        "keeper",
        "kept",
        "1",
    }


# Load canonical owner names and finishes.
with TEAM_SEASONS_FILE.open(
    "r",
    encoding="utf-8",
) as team_seasons_file:
    team_seasons = json.load(
        team_seasons_file
    )


owner_id_by_last_name = {}
owner_names = {}

team_season_lookup = {}


for team in team_seasons:
    owner_id = team["ownerId"]

    owner_names[
        owner_id
    ] = team["ownerName"]

    owner_id_by_last_name[
        normalize_text(
            team["ownerLast"]
        )
    ] = owner_id

    team_season_lookup[
        (
            int(team["season"]),
            owner_id,
        )
    ] = {
        "teamName":
            team["teamName"],

        "finalStanding":
            int(
                team[
                    "finalStanding"
                ]
            ),
    }


# Weekly records provide owner-specific points.
player_weeks_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Player_Weeks_Export",
)

player_weeks_df.columns = [
    clean_text(column)
    for column
    in player_weeks_df.columns
]


weekly_points = defaultdict(float)
weekly_record_counts = defaultdict(int)
player_names = {}


for _, row in (
    player_weeks_df.iterrows()
):
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    player_key = normalize_text(
        player
    )

    owner_id = (
        owner_id_by_last_name.get(
            normalize_text(
                row["Owner Last"]
            )
        )
    )

    if not owner_id:
        continue

    season = clean_integer(
        row["Season"]
    )

    if season is None:
        continue

    points = (
        clean_optional_number(
            row["Points"]
        )
    )

    lookup_key = (
        player_key,
        season,
        owner_id,
    )

    weekly_points[
        lookup_key
    ] += points or 0.0

    weekly_record_counts[
        lookup_key
    ] += 1

    player_names[
        player_key
    ] = player


# Season rosters provide fallback season points and
# ensure end-of-season players are represented.
season_rosters_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Season_Rosters",
)

season_rosters_df.columns = [
    clean_text(column)
    for column
    in season_rosters_df.columns
]


roster_points = {}
all_player_owner_seasons = set()


for _, row in (
    season_rosters_df.iterrows()
):
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    player_key = normalize_text(
        player
    )

    owner_id = (
        owner_id_by_last_name.get(
            normalize_text(
                row["Owner Last"]
            )
        )
    )

    if not owner_id:
        continue

    season = clean_integer(
        row["Season"]
    )

    if season is None:
        continue

    lookup_key = (
        player_key,
        season,
        owner_id,
    )

    roster_points[
        lookup_key
    ] = clean_optional_number(
        row["Total Points"]
    )

    all_player_owner_seasons.add(
        lookup_key
    )

    player_names[
        player_key
    ] = player


# Add all weekly ownership combinations.
all_player_owner_seasons.update(
    weekly_record_counts.keys()
)


# Draft and value details.
cda_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="CDA_All",
)

cda_df.columns = [
    clean_text(column)
    for column
    in cda_df.columns
]


draft_details = defaultdict(list)


for _, row in cda_df.iterrows():
    player = clean_text(
        row["Player"]
    )

    if not player:
        continue

    player_key = normalize_text(
        player
    )

    owner_id = (
        owner_id_by_last_name.get(
            normalize_text(
                row["Owner Last"]
            )
        )
    )

    if not owner_id:
        continue

    season = clean_integer(
        row["Season"]
    )

    if season is None:
        continue

    lookup_key = (
        player_key,
        season,
        owner_id,
    )

    draft_details[
        lookup_key
    ].append(
        {
            "round":
                clean_integer(
                    row["Round"]
                ),

            "pick":
                clean_integer(
                    row["Pick"]
                ),

            "netPoints":
                clean_optional_number(
                    row[
                        "Net vs Avg R"
                    ]
                ),

            "draftPoints":
                clean_optional_number(
                    row["Points"]
                ),

            "keeper":
                clean_keeper(
                    row["Keeper"]
                ),
        }
    )

    all_player_owner_seasons.add(
        lookup_key
    )

    player_names[
        player_key
    ] = player


records = []


for (
    player_key,
    season,
    owner_id,
) in sorted(
    all_player_owner_seasons,
    key=lambda item: (
        player_names.get(
            item[0],
            item[0],
        ),
        item[1],
        owner_names.get(
            item[2],
            item[2],
        ),
    ),
):
    team_season = (
        team_season_lookup.get(
            (
                season,
                owner_id,
            ),
            {},
        )
    )

    points = None
    points_source = ""

    lookup_key = (
        player_key,
        season,
        owner_id,
    )

    if (
        weekly_record_counts.get(
            lookup_key,
            0,
        ) > 0
    ):
        points = round(
            weekly_points[
                lookup_key
            ],
            2,
        )

        points_source = (
            "weekly"
        )

    elif (
        lookup_key
        in roster_points
    ):
        points = roster_points[
            lookup_key
        ]

        points_source = (
            "seasonRoster"
        )

    season_draft_details = (
        draft_details.get(
            lookup_key,
            [],
        )
    )

    if season_draft_details:
        for draft_detail in (
            season_draft_details
        ):
            record_points = points

            if record_points is None:
                record_points = (
                    draft_detail[
                        "draftPoints"
                    ]
                )

            records.append(
                {
                    "player":
                        player_names.get(
                            player_key,
                            player_key,
                        ),

                    "playerKey":
                        player_key,

                    "season":
                        season,

                    "ownerId":
                        owner_id,

                    "ownerName":
                        owner_names.get(
                            owner_id,
                            owner_id,
                        ),

                    "teamName":
                        team_season.get(
                            "teamName",
                            "",
                        ),

                    "draftRound":
                        draft_detail[
                            "round"
                        ],

                    "draftPick":
                        draft_detail[
                            "pick"
                        ],

                    "keeper":
                        draft_detail[
                            "keeper"
                        ],

                    "points":
                        record_points,

                    "pointsSource":
                        points_source,

                    "netPoints":
                        draft_detail[
                            "netPoints"
                        ],

                    "teamFinish":
                        team_season.get(
                            "finalStanding"
                        ),
                }
            )

    else:
        records.append(
            {
                "player":
                    player_names.get(
                        player_key,
                        player_key,
                    ),

                "playerKey":
                    player_key,

                "season":
                    season,

                "ownerId":
                    owner_id,

                "ownerName":
                    owner_names.get(
                        owner_id,
                        owner_id,
                    ),

                "teamName":
                    team_season.get(
                        "teamName",
                        "",
                    ),

                "draftRound":
                    None,

                "draftPick":
                    None,

                "keeper":
                    False,

                "points":
                    points,

                "pointsSource":
                    points_source,

                "netPoints":
                    None,

                "teamFinish":
                    team_season.get(
                        "finalStanding"
                    ),
            }
        )


records.sort(
    key=lambda record: (
        record["player"],
        record["season"],
        record["ownerName"],
        record["draftRound"]
        if record[
            "draftRound"
        ] is not None
        else 999,
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


unique_players = sorted(
    {
        record["player"]
        for record in records
    }
)


print(
    f"Exported {len(records)} "
    f"player-history records"
)

print(
    f"Players represented: "
    f"{len(unique_players)}"
)

print(
    f"Output file: {OUTPUT_FILE}"
)