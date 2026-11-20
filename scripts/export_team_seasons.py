import pandas as pd
import json

excel_file = r"C:\Users\njcer\Downloads\NAFFL_History_v3.xlsx"

df = pd.read_excel(
    excel_file,
    sheet_name="Team_Seasons_Export"
)

records = []

for _, row in df.iterrows():

    record = {
        "season": int(row["Season"]),
        "teamId": int(row["Team ID"]),
        "teamName": str(row["Team Name"]),
        "ownerFirst": str(row["Owner First"]),
        "ownerLast": str(row["Owner Last"]),
        "ownerDisplay": str(row["Owner Display"]),

        "wins": int(row["Wins"]),
        "losses": int(row["Losses"]),
        "ties": int(row["Ties"]),

        "pointsFor": round(float(row["Points For"]), 2),
        "pointsAgainst": round(float(row["Points Against"]), 2),

        "regularSeasonStanding": int(row["Standing"]),
        "finalStanding": int(row["Final Standing"]),

        "acquisitions": int(row["Acquisitions"]),
        "drops": int(row["Drops"]),
        "trades": int(row["Trades"])
    }

    records.append(record)

with open(
    "public/data/team-seasons.json",
    "w",
    encoding="utf-8"
) as outfile:

    json.dump(
        records,
        outfile,
        indent=2
    )

print(f"Exported {len(records)} team seasons")