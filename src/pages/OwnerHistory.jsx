import { useEffect, useState } from "react";

function OwnerHistory() {
  const [teams, setTeams] = useState([]);
  const [ownerId, setOwnerId] = useState(
    "nick-ceraso"
  );
  const [sortField, setSortField] =
    useState("season");
  const [sortDirection, setSortDirection] =
    useState("asc");

  useEffect(() => {
    fetch("/data/team-seasons.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load team season data."
          );
        }

        return response.json();
      })
      .then((data) => {
        setTeams(data);

        const ownerExists = data.some(
          (team) =>
            team.ownerId ===
            "nick-ceraso"
        );

        if (
          !ownerExists &&
          data.length > 0
        ) {
          setOwnerId(
            data[0].ownerId
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const ownerMap = new Map();

  teams.forEach((team) => {
    if (
      !ownerMap.has(team.ownerId)
    ) {
      ownerMap.set(team.ownerId, {
        ownerId: team.ownerId,
        ownerName: team.ownerName,
      });
    }
  });

  const owners = Array.from(
    ownerMap.values()
  ).sort((ownerA, ownerB) =>
    ownerA.ownerName.localeCompare(
      ownerB.ownerName
    )
  );

  const ownerTeams = teams.filter(
    (team) =>
      team.ownerId === ownerId
  );

  const selectedOwner =
    ownerMap.get(ownerId);

  const ownerName =
    selectedOwner?.ownerName ??
    "Owner";

  const totalWins = ownerTeams.reduce(
    (sum, team) =>
      sum + Number(team.wins || 0),
    0
  );

  const totalLosses =
    ownerTeams.reduce(
      (sum, team) =>
        sum +
        Number(team.losses || 0),
      0
    );

  const totalTies = ownerTeams.reduce(
    (sum, team) =>
      sum + Number(team.ties || 0),
    0
  );

  const totalPoints =
    ownerTeams.reduce(
      (sum, team) =>
        sum +
        Number(
          team.pointsFor || 0
        ),
      0
    );

  const seasonsPlayed =
    ownerTeams.length;

  const averagePointsPerSeason =
    seasonsPlayed > 0
      ? totalPoints /
        seasonsPlayed
      : 0;

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

  const runnerUpFinishes =
    validFinishes.filter(
      (finish) => finish === 2
    ).length;

  const bestFinish =
    validFinishes.length > 0
      ? Math.min(
          ...validFinishes
        )
      : null;

  const averageFinish =
    validFinishes.length > 0
      ? validFinishes.reduce(
          (sum, finish) =>
            sum + finish,
          0
        ) /
        validFinishes.length
      : null;

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
        "pointsAgainst",
      ];

      setSortDirection(
        descendingFields.includes(field)
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

  const formatPoints = (points) =>
    Number(points || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  const formatWinPct = (value) =>
    value.toFixed(3).replace(
      /^0/,
      ""
    );

  const formatFinish = (finish) => {
    const numericFinish =
      Number(finish);

    if (numericFinish === 0) {
      return "In Progress";
    }

    const lastTwoDigits =
      numericFinish % 100;

    if (
      lastTwoDigits >= 11 &&
      lastTwoDigits <= 13
    ) {
      return `${numericFinish}th`;
    }

    const lastDigit =
      numericFinish % 10;

    if (lastDigit === 1) {
      return `${numericFinish}st`;
    }

    if (lastDigit === 2) {
      return `${numericFinish}nd`;
    }

    if (lastDigit === 3) {
      return `${numericFinish}rd`;
    }

    return `${numericFinish}th`;
  };

  const sortableHeaderStyle = {
    cursor: "pointer",
    userSelect: "none",
    textAlign: "left",
    paddingRight: "16px",
    paddingBottom: "8px",
  };

  const cellStyle = {
    paddingRight: "16px",
    paddingBottom: "6px",
  };

  return (
    <div>
      <h2>Owner History</h2>

      <label>
        Owner:{" "}
        <select
          value={ownerId}
          onChange={(event) => {
            setOwnerId(
              event.target.value
            );

            setSortField("season");
            setSortDirection("asc");
          }}
        >
          {owners.map((owner) => (
            <option
              key={owner.ownerId}
              value={owner.ownerId}
            >
              {owner.ownerName}
            </option>
          ))}
        </select>
      </label>

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
        Winning Percentage:{" "}
        {formatWinPct(winPct)}
      </p>

      <p>
        Championships:{" "}
        {championships}
      </p>

      <p>
        Runner-Up Finishes:{" "}
        {runnerUpFinishes}
      </p>

      <p>
        Best Finish:{" "}
        {bestFinish === null
          ? "N/A"
          : formatFinish(
              bestFinish
            )}
      </p>

      <p>
        Average Finish:{" "}
        {averageFinish === null
          ? "N/A"
          : averageFinish.toFixed(
              1
            )}
      </p>

      <p>
        Career Points:{" "}
        {formatPoints(totalPoints)}
      </p>

      <p>
        Average Points/Season:{" "}
        {formatPoints(
          averagePointsPerSeason
        )}
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
              {sortIndicator("wins")}
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
                handleSort("ties")
              }
              style={
                sortableHeaderStyle
              }
            >
              T
              {sortIndicator("ties")}
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
                  "pointsAgainst"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              PA
              {sortIndicator(
                "pointsAgainst"
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
            (team) => (
              <tr
                key={`${team.ownerId}-${team.season}`}
              >
                <td style={cellStyle}>
                  {team.season}
                </td>

                <td style={cellStyle}>
                  {team.teamName}
                </td>

                <td style={cellStyle}>
                  {team.wins}
                </td>

                <td style={cellStyle}>
                  {team.losses}
                </td>

                <td style={cellStyle}>
                  {team.ties}
                </td>

                <td style={cellStyle}>
                  {formatPoints(
                    team.pointsFor
                  )}
                </td>

                <td style={cellStyle}>
                  {formatPoints(
                    team.pointsAgainst
                  )}
                </td>

                <td style={cellStyle}>
                  {formatFinish(
                    team.finalStanding
                  )}
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