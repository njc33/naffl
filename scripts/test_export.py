import json

data = {
    "league": "North Andover Fantasy Football League",
    "seasons": list(range(2013, 2027))
}

with open("league-data.json", "w") as file:
    json.dump(data, file, indent=2)

print("Export complete!")