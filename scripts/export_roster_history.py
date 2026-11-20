import json
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
    return clean_text(value).casefold()


def clean_number(value):
    if pd.isna(value):
        return 0.0

    try:
        return round(
            float(value),
            2,
        )
    except (TypeError, ValueError):
        return 0.0


with TEAM_SEASONS_FILE.open(
    "r",
    encoding="utf-8",
) as team_seasons_file:
    team_seasons = json.load(
        team_seasons_file
    )


with DRAFT_HISTORY_FILE.open(
    "r",
    encoding="utf-8",
) as draft_history_file:
    draft_history = json.load(
        draft_history_file
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

    player_name_key = normalize_text(
        draft_record.get(
            "player",
            "",
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


df = pd.read_excel(
    EXCEL_FILE,
    sheet_name="Season_Rosters",
)

records = []

missing_team_matches = []

draft_matches_by_id = 0
draft_matches_by_name = 0
undrafted_players = 0
different_owner_players = 0
keeper_players = 0


for _, row in df.iterrows():
    season = int(
        row["Season"]
    )

    team_id = int(
        row["Team ID"]
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
            f"{owner_first} "
            f"{owner_last}"
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
        acquisitionType = (
            "inSeasonAcquisition"
        )

        howAcquired = (
            "Undrafted / "
            "In-Season Acquisition"
        )

        originalDraftOwnerId = None
        originalDraftOwnerName = None
        draftRound = None
        draftPick = None
        draftBidAmount = None
        wasKeeper = False

        undrafted_players += 1

    else:
        originalDraftOwnerId = (
            draft_record.get(
                "ownerId"
            )
        )

        originalDraftOwnerName = (
            draft_record.get(
                "ownerName"
            )
        )

        draftRound = int(
            draft_record.get(
                "round",
                0,
            )
        )

        draftPick = int(
            draft_record.get(
                "pick",
                0,
            )
        )

        draftBidAmount = (
            draft_record.get(
                "bidAmount"
            )
        )

        wasKeeper = bool(
            draft_record.get(
                "keeper",
                False,
            )
        )

        if (
            originalDraftOwnerId
            != owner_id
        ):
            acquisitionType = (
                "differentDraftOwner"
            )

            howAcquired = (
                "Drafted by "
                f"{originalDraftOwnerName}"
            )

            different_owner_players += 1

        elif wasKeeper:
            acquisitionType = "keeper"

            if draftRound > 0:
                howAcquired = (
                    "Keeper: "
                    f"Round {draftRound}, "
                    f"Pick {draftPick}"
                )
            else:
                howAcquired = "Keeper"

            keeper_players += 1

        else:
            acquisitionType = "draft"

            howAcquired = (
                f"Draft: Round "
                f"{draftRound}, "
                f"Pick {draftPick}"
            )


    record = {
        "season": season,
        "teamId": team_id,
        "teamName": team_name,

        "ownerId": owner_id,
        "ownerName": owner_name,
        "ownerFirst": owner_first,
        "ownerLast": owner_last,

        "player": player,
        "playerId": player_id,

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

        "acquisitionType":
            acquisitionType,

        "howAcquired":
            howAcquired,

        "acquisitionMatchMethod":
            acquisition_match_method,

        "originalDraftOwnerId":
            originalDraftOwnerId,

        "originalDraftOwnerName":
            originalDraftOwnerName,

        "draftRound":
            draftRound,

        "draftPick":
            draftPick,

        "draftBidAmount":
            draftBidAmount,

        "wasKeeper":
            wasKeeper,
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


print(
    f"Exported {len(records)} "
    f"roster records"
)

print(
    f"Output file: {OUTPUT_FILE}"
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