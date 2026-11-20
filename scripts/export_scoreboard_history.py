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
    / "scoreboard-history.json"
)


def clean_text(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def normalize_text(value):
    return clean_text(value).casefold()


def clean_integer(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def clean_number(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def clean_boolean(value):
    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return value != 0

    return normalize_text(value) in {
        "true",
        "t",
        "yes",
        "y",
        "1",
        "playoff",
    }


def make_owner_id(
    first_name,
    last_name,
):
    full_name = (
        f"{clean_text(first_name)} "
        f"{clean_text(last_name)}"
    ).strip()

    return (
        full_name
        .casefold()
        .replace(" ", "-")
    )


# Load canonical owner identities.
with TEAM_SEASONS_FILE.open(
    "r",
    encoding="utf-8",
) as team_seasons_file:
    team_seasons = json.load(
        team_seasons_file
    )


owner_by_last_name = {}
owner_by_display = {}
owner_by_season_team = {}


for team in team_seasons:
    canonical_owner = {
        "ownerId":
            team["ownerId"],

        "ownerName":
            team["ownerName"],
    }

    owner_by_last_name[
        normalize_text(
            team["ownerLast"]
        )
    ] = canonical_owner

    owner_display = normalize_text(
        team.get(
            "ownerDisplay",
            "",
        )
    )

    if owner_display:
        owner_by_display[
            owner_display
        ] = canonical_owner

    owner_by_season_team[
        (
            int(team["season"]),
            normalize_text(
                team["teamName"]
            ),
        )
    ] = canonical_owner


def get_canonical_owner(
    season,
    team_name,
    owner_first,
    owner_last,
    owner_display,
):
    season_team_match = (
        owner_by_season_team.get(
            (
                season,
                normalize_text(
                    team_name
                ),
            )
        )
    )

    if season_team_match:
        return season_team_match

    display_match = (
        owner_by_display.get(
            normalize_text(
                owner_display
            )
        )
    )

    if display_match:
        return display_match

    last_name_match = (
        owner_by_last_name.get(
            normalize_text(
                owner_last
            )
        )
    )

    if last_name_match:
        return last_name_match

    owner_name = (
        f"{clean_text(owner_first)} "
        f"{clean_text(owner_last)}"
    ).strip()

    return {
        "ownerId":
            make_owner_id(
                owner_first,
                owner_last,
            ),

        "ownerName":
            owner_name,
    }


# Load weekly player data.
player_weeks_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Player_Weeks_Export",
)

player_weeks_df.columns = [
    clean_text(column)
    for column
    in player_weeks_df.columns
]


lineups_by_team_week = defaultdict(list)


for _, row in player_weeks_df.iterrows():
    season = clean_integer(
        row["Season"]
    )

    week = clean_integer(
        row["Week"]
    )

    team_name = clean_text(
        row["Team"]
    )

    if (
        season is None
        or week is None
        or not team_name
    ):
        continue

    canonical_owner = (
        get_canonical_owner(
            season=season,
            team_name=team_name,
            owner_first=row[
                "Owner First"
            ],
            owner_last=row[
                "Owner Last"
            ],
            owner_display=row[
                "Owner Display"
            ],
        )
    )

    player = {
        "player":
            clean_text(
                row["Player"]
            ),

        "playerId":
            clean_text(
                row["Player ID"]
            ),

        "position":
            clean_text(
                row["Position"]
            ),

        "nflTeam":
            clean_text(
                row["NFL Team"]
            ),

        "nflOpponent":
            clean_text(
                row["NFL Opponent"]
            ),

        "lineupSlot":
            clean_text(
                row["Lineup Slot"]
            ),

        "points":
            clean_number(
                row["Points"]
            ),

        "projectedPoints":
            clean_number(
                row[
                    "Projected Points"
                ]
            ),

        "vsProjection":
            clean_number(
                row["Vs Proj"]
            ),
    }

    lineup_key = (
        season,
        week,
        canonical_owner[
            "ownerId"
        ],
    )

    lineups_by_team_week[
        lineup_key
    ].append(player)


def player_sort_key(player):
    lineup_slot_order = {
        "QB": 1,
        "RB": 2,
        "WR": 3,
        "TE": 4,
        "RB/WR/TE": 5,
        "FLEX": 5,
        "D/ST": 6,
        "K": 7,
        "BE": 20,
        "IR": 21,
    }

    return (
        lineup_slot_order.get(
            player["lineupSlot"],
            15,
        ),
        player["lineupSlot"],
        player["position"],
        player["player"],
    )


for lineup in (
    lineups_by_team_week.values()
):
    lineup.sort(
        key=player_sort_key
    )


# Load matchup history.
matchups_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Matchups",
)

matchups_df.columns = [
    clean_text(column)
    for column
    in matchups_df.columns
]


records = []

matchup_counter_by_week = defaultdict(
    int
)


for _, row in matchups_df.iterrows():
    season = clean_integer(
        row["Season"]
    )

    week = clean_integer(
        row["Week"]
    )

    if (
        season is None
        or week is None
    ):
        continue

    home_team = clean_text(
        row["Home Team"]
    )

    away_team = clean_text(
        row["Away Team"]
    )

    home_owner = get_canonical_owner(
        season=season,
        team_name=home_team,
        owner_first=row[
            "Home Owner First"
        ],
        owner_last=row[
            "Home Owner Last"
        ],
        owner_display=row[
            "Home Owner Display"
        ],
    )

    away_owner = get_canonical_owner(
        season=season,
        team_name=away_team,
        owner_first=row[
            "Away Owner First"
        ],
        owner_last=row[
            "Away Owner Last"
        ],
        owner_display=row[
            "Away Owner Display"
        ],
    )

    home_score = clean_number(
        row["Home Score"]
    )

    away_score = clean_number(
        row["Away Score"]
    )

    winner_name = clean_text(
        row["Winner"]
    )

    matchup_counter_by_week[
        (
            season,
            week,
        )
    ] += 1

    matchup_number = (
        matchup_counter_by_week[
            (
                season,
                week,
            )
        ]
    )

    home_lineup = (
        lineups_by_team_week.get(
            (
                season,
                week,
                home_owner[
                    "ownerId"
                ],
            ),
            [],
        )
    )

    away_lineup = (
        lineups_by_team_week.get(
            (
                season,
                week,
                away_owner[
                    "ownerId"
                ],
            ),
            [],
        )
    )

    if (
        home_score is not None
        and away_score is not None
    ):
        if home_score > away_score:
            winner_side = "home"
        elif away_score > home_score:
            winner_side = "away"
        else:
            winner_side = "tie"
    else:
        winner_side = ""

    record = {
        "matchupId":
            (
                f"{season}-"
                f"{week}-"
                f"{matchup_number}"
            ),

        "season":
            season,

        "week":
            week,

        "playoff":
            clean_boolean(
                row["Playoff"]
            ),

        "winnerName":
            winner_name,

        "winnerSide":
            winner_side,

        "margin":
            clean_number(
                row["Margin"]
            ),

        "source":
            clean_text(
                row.get(
                    "Source",
                    "",
                )
            ),

        "home": {
            "teamName":
                home_team,

            "ownerId":
                home_owner[
                    "ownerId"
                ],

            "ownerName":
                home_owner[
                    "ownerName"
                ],

            "score":
                home_score,

            "lineup":
                home_lineup,

            "lineupAvailable":
                len(home_lineup) > 0,
        },

        "away": {
            "teamName":
                away_team,

            "ownerId":
                away_owner[
                    "ownerId"
                ],

            "ownerName":
                away_owner[
                    "ownerName"
                ],

            "score":
                away_score,

            "lineup":
                away_lineup,

            "lineupAvailable":
                len(away_lineup) > 0,
        },
    }

    records.append(record)


records.sort(
    key=lambda record: (
        record["season"],
        record["week"],
        record["matchupId"],
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


seasons = sorted(
    {
        record["season"]
        for record in records
    }
)

weeks_with_lineups = sorted(
    {
        (
            record["season"],
            record["week"],
        )
        for record in records
        if (
            record["home"][
                "lineupAvailable"
            ]
            or record["away"][
                "lineupAvailable"
            ]
        )
    }
)


print(
    f"Exported {len(records)} "
    f"matchup records"
)

print(
    f"Seasons: "
    f"{seasons[0]}-"
    f"{seasons[-1]}"
)

print(
    f"Season/week combinations "
    f"with lineup data: "
    f"{len(weeks_with_lineups)}"
)

if weeks_with_lineups:
    print(
        "First detailed lineup week: "
        f"{weeks_with_lineups[0][0]} "
        f"Week "
        f"{weeks_with_lineups[0][1]}"
    )

    print(
        "Latest detailed lineup week: "
        f"{weeks_with_lineups[-1][0]} "
        f"Week "
        f"{weeks_with_lineups[-1][1]}"
    )

print(
    f"Output file: {OUTPUT_FILE}"
)