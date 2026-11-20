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

DRAFT_HISTORY_FILE = (
    PROJECT_ROOT
    / "public"
    / "data"
    / "draft-history.json"
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


def normalize_text(value):
    return clean_text(
        value
    ).casefold()


def clean_integer(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return int(
            float(value)
        )
    except (
        TypeError,
        ValueError,
    ):
        return None


def clean_optional_number(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return round(
            float(value),
            2,
        )
    except (
        TypeError,
        ValueError,
    ):
        return None


def clean_number(value):
    cleaned_value = (
        clean_optional_number(
            value
        )
    )

    if cleaned_value is None:
        return 0.0

    return cleaned_value


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

    return normalize_text(
        value
    ) in {
        "yes",
        "y",
        "true",
        "keeper",
        "kept",
        "1",
    }


def get_existing_column(
    dataframe,
    candidates,
):
    for candidate in candidates:
        if candidate in dataframe.columns:
            return candidate

    return None


# ---------------------------------------------------------
# Canonical owner and team information
# ---------------------------------------------------------

with TEAM_SEASONS_FILE.open(
    "r",
    encoding="utf-8",
) as team_seasons_file:
    team_seasons = json.load(
        team_seasons_file
    )


team_lookup_by_id = {}

team_lookup_by_name = {}

owner_id_by_last_name = {}

owner_id_by_display = {}


for team in team_seasons:
    season = int(
        team["season"]
    )

    team_id = clean_integer(
        team.get(
            "teamId"
        )
    )

    canonical_team = {
        "ownerId":
            team["ownerId"],

        "ownerName":
            team["ownerName"],

        "ownerFirst":
            team["ownerFirst"],

        "ownerLast":
            team["ownerLast"],

        "ownerDisplay":
            team.get(
                "ownerDisplay",
                "",
            ),

        "teamName":
            team["teamName"],
    }

    if team_id is not None:
        team_lookup_by_id[
            (
                season,
                team_id,
            )
        ] = canonical_team

    team_lookup_by_name[
        (
            season,
            normalize_text(
                team["teamName"]
            ),
        )
    ] = canonical_team

    owner_id_by_last_name[
        normalize_text(
            team["ownerLast"]
        )
    ] = team["ownerId"]

    owner_display_key = (
        normalize_text(
            team.get(
                "ownerDisplay",
                "",
            )
        )
    )

    if owner_display_key:
        owner_id_by_display[
            owner_display_key
        ] = team["ownerId"]


# ---------------------------------------------------------
# Draft history
#
# The original draft record determines:
# - original draft owner
# - draft round
# - draft pick
# - keeper status
# - original Net Pts vs Avg Rd
#
# Net value follows the player, even if the player later
# appears on another owner's roster.
# ---------------------------------------------------------

with DRAFT_HISTORY_FILE.open(
    "r",
    encoding="utf-8",
) as draft_history_file:
    draft_history = json.load(
        draft_history_file
    )


draft_by_player_id = {}

draft_by_player_name = {}


for draft_record in draft_history:
    season = int(
        draft_record["season"]
    )

    player_id = clean_text(
        draft_record.get(
            "playerId",
            "",
        )
    )

    player_name_key = (
        normalize_text(
            draft_record.get(
                "player",
                "",
            )
        )
    )

    if player_id:
        draft_by_player_id[
            (
                season,
                player_id,
            )
        ] = draft_record

    if player_name_key:
        draft_by_player_name[
            (
                season,
                player_name_key,
            )
        ] = draft_record


# ---------------------------------------------------------
# Weekly actual-versus-projected totals
#
# Key:
# Season + canonical owner + player ID
#
# Fallback:
# Season + canonical owner + normalized player name
# ---------------------------------------------------------

player_weeks_df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Player_Weeks_Export",
)

player_weeks_df.columns = [
    clean_text(column)
    for column
    in player_weeks_df.columns
]


weekly_vs_projection_by_id = defaultdict(
    float
)

weekly_vs_projection_by_name = defaultdict(
    float
)

weekly_count_by_id = defaultdict(
    int
)

weekly_count_by_name = defaultdict(
    int
)


def resolve_weekly_owner_id(row):
    owner_display_key = (
        normalize_text(
            row.get(
                "Owner Display",
                "",
            )
        )
    )

    if (
        owner_display_key
        and owner_display_key
        in owner_id_by_display
    ):
        return owner_id_by_display[
            owner_display_key
        ]

    owner_last_key = (
        normalize_text(
            row.get(
                "Owner Last",
                "",
            )
        )
    )

    if (
        owner_last_key
        and owner_last_key
        in owner_id_by_last_name
    ):
        return owner_id_by_last_name[
            owner_last_key
        ]

    owner_first = clean_text(
        row.get(
            "Owner First",
            "",
        )
    )

    owner_last = clean_text(
        row.get(
            "Owner Last",
            "",
        )
    )

    fallback_owner_name = (
        f"{owner_first} "
        f"{owner_last}"
    ).strip()

    return (
        fallback_owner_name
        .casefold()
        .replace(" ", "-")
    )


for _, row in (
    player_weeks_df.iterrows()
):
    season = clean_integer(
        row.get(
            "Season"
        )
    )

    if season is None:
        continue

    owner_id = (
        resolve_weekly_owner_id(
            row
        )
    )

    player = clean_text(
        row.get(
            "Player",
            "",
        )
    )

    player_id = clean_text(
        row.get(
            "Player ID",
            "",
        )
    )

    player_name_key = (
        normalize_text(
            player
        )
    )

    if (
        not owner_id
        or not player_name_key
    ):
        continue

    vs_projection = (
        clean_optional_number(
            row.get(
                "Vs Proj"
            )
        )
    )

    if vs_projection is None:
        actual_points = (
            clean_optional_number(
                row.get(
                    "Points"
                )
            )
        )

        projected_points = (
            clean_optional_number(
                row.get(
                    "Projected Points"
                )
            )
        )

        if (
            actual_points is not None
            and projected_points
            is not None
        ):
            vs_projection = round(
                actual_points
                - projected_points,
                2,
            )

    if vs_projection is None:
        continue

    if player_id:
        player_id_key = (
            season,
            owner_id,
            player_id,
        )

        weekly_vs_projection_by_id[
            player_id_key
        ] += vs_projection

        weekly_count_by_id[
            player_id_key
        ] += 1

    player_name_lookup_key = (
        season,
        owner_id,
        player_name_key,
    )

    weekly_vs_projection_by_name[
        player_name_lookup_key
    ] += vs_projection

    weekly_count_by_name[
        player_name_lookup_key
    ] += 1


# ---------------------------------------------------------
# Load Season_Rosters
# ---------------------------------------------------------

df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Season_Rosters",
)

df.columns = [
    clean_text(column)
    for column in df.columns
]


team_id_column = (
    get_existing_column(
        df,
        [
            "Team ID",
            "TeamId",
            "Team ID ",
        ],
    )
)

team_name_column = (
    get_existing_column(
        df,
        [
            "Team Name",
            "Team",
        ],
    )
)

owner_display_column = (
    get_existing_column(
        df,
        [
            "Owner Display",
            "OwnerDisplay",
        ],
    )
)

owner_first_column = (
    get_existing_column(
        df,
        [
            "Owner First",
            "OwnerFirst",
        ],
    )
)

owner_last_column = (
    get_existing_column(
        df,
        [
            "Owner Last",
            "OwnerLast",
        ],
    )
)

player_id_column = (
    get_existing_column(
        df,
        [
            "Player ID",
            "PlayerId",
        ],
    )
)

position_column = (
    get_existing_column(
        df,
        [
            "Position",
            "Pos",
        ],
    )
)

nfl_team_column = (
    get_existing_column(
        df,
        [
            "NFL Team",
            "Pro Team",
        ],
    )
)

total_points_column = (
    get_existing_column(
        df,
        [
            "Total Points",
            "Points",
            "Season Points",
        ],
    )
)


records = []

missing_team_matches = []

draft_matches_by_id = 0
draft_matches_by_name = 0
undrafted_players = 0
different_owner_players = 0
keeper_players = 0

weekly_projection_matches_by_id = 0
weekly_projection_matches_by_name = 0
weekly_projection_unmatched = 0

net_value_records = 0
net_value_unavailable = 0


for _, row in df.iterrows():
    season = clean_integer(
        row.get(
            "Season"
        )
    )

    if season is None:
        continue

    player = clean_text(
        row.get(
            "Player",
            "",
        )
    )

    if not player:
        continue

    player_id = (
        clean_text(
            row.get(
                player_id_column,
                "",
            )
        )
        if player_id_column
        else ""
    )

    player_name_key = (
        normalize_text(
            player
        )
    )

    team_id = (
        clean_integer(
            row.get(
                team_id_column
            )
        )
        if team_id_column
        else None
    )

    excel_team_name = (
        clean_text(
            row.get(
                team_name_column,
                "",
            )
        )
        if team_name_column
        else ""
    )

    excel_owner_display = (
        clean_text(
            row.get(
                owner_display_column,
                "",
            )
        )
        if owner_display_column
        else ""
    )

    canonical_team = None

    if team_id is not None:
        canonical_team = (
            team_lookup_by_id.get(
                (
                    season,
                    team_id,
                )
            )
        )

    if (
        canonical_team is None
        and excel_team_name
    ):
        canonical_team = (
            team_lookup_by_name.get(
                (
                    season,
                    normalize_text(
                        excel_team_name
                    ),
                )
            )
        )

    if canonical_team is None:
        owner_first = (
            clean_text(
                row.get(
                    owner_first_column,
                    "",
                )
            )
            if owner_first_column
            else ""
        )

        owner_last = (
            clean_text(
                row.get(
                    owner_last_column,
                    "",
                )
            )
            if owner_last_column
            else ""
        )

        owner_name = (
            f"{owner_first} "
            f"{owner_last}"
        ).strip()

        owner_display_key = (
            normalize_text(
                excel_owner_display
            )
        )

        owner_last_key = (
            normalize_text(
                owner_last
            )
        )

        if (
            owner_display_key
            and owner_display_key
            in owner_id_by_display
        ):
            owner_id = (
                owner_id_by_display[
                    owner_display_key
                ]
            )

        elif (
            owner_last_key
            and owner_last_key
            in owner_id_by_last_name
        ):
            owner_id = (
                owner_id_by_last_name[
                    owner_last_key
                ]
            )

        else:
            owner_id = (
                owner_name
                .casefold()
                .replace(" ", "-")
            )

        team_name = (
            excel_team_name
        )

        missing_team_matches.append(
            {
                "season": season,
                "teamId": team_id,
                "teamName":
                    excel_team_name,
                "ownerDisplay":
                    excel_owner_display,
            }
        )

    else:
        owner_id = (
            canonical_team[
                "ownerId"
            ]
        )

        owner_name = (
            canonical_team[
                "ownerName"
            ]
        )

        owner_first = (
            canonical_team[
                "ownerFirst"
            ]
        )

        owner_last = (
            canonical_team[
                "ownerLast"
            ]
        )

        team_name = (
            canonical_team[
                "teamName"
            ]
        )

        if not excel_owner_display:
            excel_owner_display = (
                canonical_team.get(
                    "ownerDisplay",
                    "",
                )
            )


    # -----------------------------------------------------
    # Original draft record
    # -----------------------------------------------------

    draft_record = None
    acquisition_match_method = ""

    player_id_key = (
        season,
        player_id,
    )

    player_name_lookup_key = (
        season,
        player_name_key,
    )

    if (
        player_id
        and player_id_key
        in draft_by_player_id
    ):
        draft_record = (
            draft_by_player_id[
                player_id_key
            ]
        )

        acquisition_match_method = (
            "playerId"
        )

        draft_matches_by_id += 1

    elif (
        player_name_key
        and player_name_lookup_key
        in draft_by_player_name
    ):
        draft_record = (
            draft_by_player_name[
                player_name_lookup_key
            ]
        )

        acquisition_match_method = (
            "playerName"
        )

        draft_matches_by_name += 1


    if draft_record is None:
        acquisition_type = (
            "inSeasonAcquisition"
        )

        how_acquired = (
            "Undrafted / "
            "In-Season Acquisition"
        )

        original_draft_owner_id = None
        original_draft_owner_name = None
        draft_round = None
        draft_pick = None
        was_keeper = False
        net_points_vs_round_average = None

        undrafted_players += 1

    else:
        original_draft_owner_id = (
            draft_record.get(
                "ownerId"
            )
        )

        original_draft_owner_name = (
            draft_record.get(
                "ownerName"
            )
        )

        draft_round = (
            clean_integer(
                draft_record.get(
                    "round"
                )
            )
        )

        draft_pick = (
            clean_integer(
                draft_record.get(
                    "pick"
                )
            )
        )

        was_keeper = bool(
            draft_record.get(
                "keeper",
                False,
            )
        )

        net_points_vs_round_average = (
            clean_optional_number(
                draft_record.get(
                    "netPointsVsRoundAverage"
                )
            )
        )

        if (
            net_points_vs_round_average
            is None
        ):
            net_value_unavailable += 1
        else:
            net_value_records += 1

        if (
            original_draft_owner_id
            != owner_id
        ):
            acquisition_type = (
                "differentDraftOwner"
            )

            how_acquired = (
                "Drafted by "
                f"{original_draft_owner_name}"
            )

            different_owner_players += 1

        elif was_keeper:
            acquisition_type = (
                "keeper"
            )

            if (
                draft_round is not None
                and draft_pick
                is not None
            ):
                how_acquired = (
                    "Keeper: "
                    f"Round {draft_round}, "
                    f"Pick {draft_pick}"
                )

            elif (
                draft_round is not None
            ):
                how_acquired = (
                    "Keeper: "
                    f"Round {draft_round}"
                )

            else:
                how_acquired = (
                    "Keeper"
                )

            keeper_players += 1

        else:
            acquisition_type = (
                "draft"
            )

            if (
                draft_round is not None
                and draft_pick
                is not None
            ):
                how_acquired = (
                    f"Draft: Round "
                    f"{draft_round}, "
                    f"Pick {draft_pick}"
                )

            elif (
                draft_round is not None
            ):
                how_acquired = (
                    f"Draft: Round "
                    f"{draft_round}"
                )

            else:
                how_acquired = (
                    "Draft"
                )


    # -----------------------------------------------------
    # Pts Above Projected
    #
    # Sum weekly Vs Proj by:
    # Season + current roster owner + player
    # -----------------------------------------------------

    points_above_projected = None
    projection_match_method = ""

    weekly_player_id_key = (
        season,
        owner_id,
        player_id,
    )

    weekly_player_name_key = (
        season,
        owner_id,
        player_name_key,
    )

    if (
        player_id
        and weekly_count_by_id.get(
            weekly_player_id_key,
            0,
        ) > 0
    ):
        points_above_projected = (
            round(
                weekly_vs_projection_by_id[
                    weekly_player_id_key
                ],
                2,
            )
        )

        projection_match_method = (
            "playerId"
        )

        weekly_projection_matches_by_id += 1

    elif (
        player_name_key
        and weekly_count_by_name.get(
            weekly_player_name_key,
            0,
        ) > 0
    ):
        points_above_projected = (
            round(
                weekly_vs_projection_by_name[
                    weekly_player_name_key
                ],
                2,
            )
        )

        projection_match_method = (
            "playerName"
        )

        weekly_projection_matches_by_name += 1

    else:
        weekly_projection_unmatched += 1


    record = {
        "season": season,

        "teamId": team_id,

        "teamName":
            team_name,

        "ownerId":
            owner_id,

        "ownerName":
            owner_name,

        "ownerFirst":
            owner_first,

        "ownerLast":
            owner_last,

        "ownerDisplay":
            excel_owner_display,

        "player":
            player,

        "playerId":
            player_id,

        "position":
            clean_text(
                row.get(
                    position_column,
                    "",
                )
            )
            if position_column
            else "",

        "nflTeam":
            clean_text(
                row.get(
                    nfl_team_column,
                    "",
                )
            )
            if nfl_team_column
            else "",

        "totalPoints":
            clean_number(
                row.get(
                    total_points_column
                )
            )
            if total_points_column
            else 0.0,

        "netPointsVsRoundAverage":
            net_points_vs_round_average,

        "pointsAboveProjected":
            points_above_projected,

        "projectionMatchMethod":
            projection_match_method,

        "acquisitionType":
            acquisition_type,

        "howAcquired":
            how_acquired,

        "acquisitionMatchMethod":
            acquisition_match_method,

        "originalDraftOwnerId":
            original_draft_owner_id,

        "originalDraftOwnerName":
            original_draft_owner_name,

        "draftRound":
            draft_round,

        "draftPick":
            draft_pick,

        "wasKeeper":
            was_keeper,
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


net_values_exported = sum(
    1
    for record in records
    if record[
        "netPointsVsRoundAverage"
    ] is not None
)

projection_values_exported = sum(
    1
    for record in records
    if record[
        "pointsAboveProjected"
    ] is not None
)


print(
    f"Exported {len(records)} "
    f"roster records"
)

print(
    f"Output file: "
    f"{OUTPUT_FILE}"
)

print(
    f"Draft matches by Player ID: "
    f"{draft_matches_by_id}"
)

print(
    f"Draft matches by player name: "
    f"{draft_matches_by_name}"
)

print(
    f"Keeper records: "
    f"{keeper_players}"
)

print(
    f"Drafted by another owner: "
    f"{different_owner_players}"
)

print(
    f"Undrafted / in-season: "
    f"{undrafted_players}"
)

print(
    f"Net Pts vs Avg Rd values: "
    f"{net_values_exported}"
)

print(
    f"Net Pts vs Avg Rd displaying N/A: "
    f"{len(records) - net_values_exported}"
)

print(
    f"Pts Above Projected matched "
    f"by Player ID: "
    f"{weekly_projection_matches_by_id}"
)

print(
    f"Pts Above Projected matched "
    f"by player name: "
    f"{weekly_projection_matches_by_name}"
)

print(
    f"Pts Above Projected values: "
    f"{projection_values_exported}"
)

print(
    f"Pts Above Projected "
    f"displaying N/A: "
    f"{weekly_projection_unmatched}"
)

print(
    f"Missing canonical team matches: "
    f"{len(missing_team_matches)}"
)


if missing_team_matches:
    print(
        "Roster records missing "
        "canonical teams:"
    )

    unique_missing_teams = {
        (
            record["season"],
            record["teamId"],
            record["teamName"],
            record["ownerDisplay"],
        )
        for record
        in missing_team_matches
    }

    for (
        missing_season,
        missing_team_id,
        missing_team_name,
        missing_owner_display,
    ) in sorted(
        unique_missing_teams,
        key=lambda item: (
            item[0],
            str(item[1]),
            item[2],
        ),
    ):
        print(
            "- "
            f"{missing_season}: "
            f"Team ID "
            f"{missing_team_id}, "
            f"{missing_team_name} / "
            f"{missing_owner_display}"
        )