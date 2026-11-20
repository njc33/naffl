import { useEffect, useState } from "react";

function OwnerHistory() {
  const [teams, setTeams] = useState([]);
  const [ownerKey, setOwnerKey] = useState("ceraso");
  const [sortField, setSortField] = useState("season");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetch("/data/team-seasons.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load team-seasons.json"
          );
        }

        return response.json();
      })
      .then((data) => {
        setTeams(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const normalizeOwnerKey = (ownerLast) =>
    String(ownerLast)
      .trim()
      .toLocaleLowerCase();

  const ownerMap = new Map();

  teams.forEach((team) => {
    const key = normalizeOwnerKey(
      team.ownerLast
    );

    if (!ownerMap.has(key)) {
      ownerMap.set(key, {
        key,
        displayName:
          key === "falaras"
            ? "Falaras"
            : String(team.ownerLast).trim(),
      });
    }
  });

  const owners = Array.from(
    ownerMap.values()
  ).sort((a, b) =>
    a.displayName.localeCompare(
      b.displayName
    )
  );

  const ownerTeams = teams.filter(
    (team) =>
      normalizeOwnerKey(
        team.ownerLast
      ) === ownerKey
  );

  const selectedOwner =
    ownerMap.get(ownerKey);

  const ownerName =
    selectedOwner?.displayName ??
    ownerKey;

  const totalWins = ownerTeams.reduce(
    (sum, season) =>
      sum + Number(season.wins || 0),
    0
  );

  const totalLosses =
    ownerTeams.reduce(
      (sum, season) =>
        sum +
        Number(season.losses || 0),
      0
    );

  const totalTies = ownerTeams.reduce(
    (sum, season) =>
      sum + Number(season.ties || 0),
    0
  );

  const totalPoints =
    ownerTeams.reduce(
      (sum, season) =>
        sum +
        Number(
          season.pointsFor || 0
        ),
      0
    );

  const seasonsPlayed =
    ownerTeams.length;

  const gamesPlayed =
    totalWins +
    totalLosses +
    totalTies;

  const winPct =
    gamesPlayed > 0
      ? (
          totalWins +
          totalTies * 0.5
        ) / gamesPlayed
      : 0;

  const validFinishes =
    ownerTeams
      .map((team) =>
        Number(
          team.finalStanding
        )
      )
      .filter(
        (finish) =>
          Number.isFinite(finish) &&
          finish > 0
      );

  const championships =
    validFinishes.filter(
      (finish) => finish === 1
    ).length;

  const bestFinish =
    validFinishes.length > 0
      ? Math.min(
          ...validFinishes
        )
      : "N/A";

  const averageFinish =
    validFinishes.length > 0
      ? validFinishes.reduce(
          (sum, finish) =>
            sum + finish,
          0
        ) /
        validFinishes.length
      : 0;

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(
        (currentDirection) =>
          currentDirection === "asc"
            ? "desc"
            : "asc"
      );
    } else {
      setSortField(field);

      const descendingFields = [
        "wins",
        "losses",
        "pointsFor",
      ];

      setSortDirection(
        descendingFields.includes(
          field
        )
          ? "desc"
          : "asc"
      );
    }
  };

  const compareValues = (
    valueA,
    valueB
  ) => {
    if (
      typeof valueA === "string" ||
      typeof valueB === "string"
    ) {
      return String(
        valueA ?? ""
      ).localeCompare(
        String(valueB ?? ""),
        undefined,
        {
          sensitivity: "base",
        }
      );
    }

    return (
      Number(valueA || 0) -
      Number(valueB || 0)
    );
  };

  const sortedOwnerTeams = [
    ...ownerTeams,
  ].sort((teamA, teamB) => {
    const comparison =
      compareValues(
        teamA[sortField],
        teamB[sortField]
      );

    return sortDirection === "asc"
      ? comparison
      : -comparison;
  });

  const sortIndicator = (field) => {
    if (sortField !== field) {
      return "";
    }

    return sortDirection === "asc"
      ? " ▲"
      : " ▼";
  };

  const sortableHeaderStyle = {
    cursor: "pointer",
    userSelect: "none",
    paddingRight: "14px",
    textAlign: "left",
  };

  return (
    <div>
      <h2>Owner History</h2>

      <select
        value={ownerKey}
        onChange={(event) =>
          setOwnerKey(
            event.target.value
          )
        }
      >
        {owners.map((owner) => (
          <option
            key={owner.key}
            value={owner.key}
          >
            {owner.displayName}
          </option>
        ))}
      </select>

      <h3>{ownerName}</h3>

      <p>
        Seasons Played:{" "}
        {seasonsPlayed}
      </p>

      <p>
        Career Record:{" "}
        {totalWins}-{totalLosses}
        {totalTies > 0
          ? `-${totalTies}`
          : ""}
      </p>

      <p>
        Win Percentage:{" "}
        {winPct.toFixed(3)}
      </p>

      <p>
        Championships:{" "}
        {championships}
      </p>

      <p>
        Best Finish:{" "}
        {bestFinish}
      </p>

      <p>
        Average Finish:{" "}
        {averageFinish.toFixed(1)}
      </p>

      <p>
        Career Points:{" "}
        {Math.round(
          totalPoints
        ).toLocaleString()}
      </p>

      <table
        style={{
          marginTop: "20px",
          borderCollapse:
            "collapse",
        }}
      >
        <thead>
          <tr>
            <th
              onClick={() =>
                handleSort("season")
              }
              style={
                sortableHeaderStyle
              }
            >
              Season
              {sortIndicator(
                "season"
              )}
            </th>

            <th
              onClick={() =>
                handleSort(
                  "teamName"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Team Name
              {sortIndicator(
                "teamName"
              )}
            </th>

            <th
              onClick={() =>
                handleSort("wins")
              }
              style={
                sortableHeaderStyle
              }
            >
              W
              {sortIndicator(
                "wins"
              )}
            </th>

            <th
              onClick={() =>
                handleSort(
                  "losses"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              L
              {sortIndicator(
                "losses"
              )}
            </th>

            <th
              onClick={() =>
                handleSort(
                  "pointsFor"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              PF
              {sortIndicator(
                "pointsFor"
              )}
            </th>

            <th
              onClick={() =>
                handleSort(
                  "finalStanding"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Finish
              {sortIndicator(
                "finalStanding"
              )}
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedOwnerTeams.map(
            (season) => (
              <tr
                key={`${normalizeOwnerKey(
                  season.ownerLast
                )}-${season.season}`}
              >
                <td>
                  {season.season}
                </td>

                <td>
                  {season.teamName}
                </td>

                <td>
                  {season.wins}
                </td>

                <td>
                  {season.losses}
                </td>

                <td>
                  {Number(
                    season.pointsFor
                  ).toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>

                <td>
                  {Number(
                    season.finalStanding
                  ) === 0
                    ? "In Progress"
                    : season.finalStanding}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OwnerHistory;