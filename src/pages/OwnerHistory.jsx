import { useEffect, useState } from "react";
import OwnerHistoryChart from "../components/OwnerHistoryChart";
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

        const defaultOwnerExists = data.some(
          (team) =>
            team.ownerId === "nick-ceraso"
        );

        if (
          !defaultOwnerExists &&
          data.length > 0
        ) {
          setOwnerId(data[0].ownerId);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const calculateOwnerStats = (ownerTeams) => {
    const totalWins = ownerTeams.reduce(
      (sum, team) =>
        sum + Number(team.wins || 0),
      0
    );

    const totalLosses = ownerTeams.reduce(
      (sum, team) =>
        sum + Number(team.losses || 0),
      0
    );

    const totalTies = ownerTeams.reduce(
      (sum, team) =>
        sum + Number(team.ties || 0),
      0
    );

    const totalPoints = ownerTeams.reduce(
      (sum, team) =>
        sum + Number(team.pointsFor || 0),
      0
    );

    const seasonsPlayed = ownerTeams.length;

    const gamesPlayed =
      totalWins +
      totalLosses +
      totalTies;

    const winningPercentage =
      gamesPlayed > 0
        ? (
            totalWins +
            totalTies * 0.5
          ) / gamesPlayed
        : 0;

    const validFinishes = ownerTeams
      .map((team) =>
        Number(team.finalStanding)
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
        ? Math.min(...validFinishes)
        : null;

    const averageFinish =
      validFinishes.length > 0
        ? validFinishes.reduce(
            (sum, finish) =>
              sum + finish,
            0
          ) / validFinishes.length
        : null;

    const averagePointsPerSeason =
      seasonsPlayed > 0
        ? totalPoints / seasonsPlayed
        : 0;

    return {
      seasonsPlayed,
      totalWins,
      totalLosses,
      totalTies,
      totalPoints,
      winningPercentage,
      championships,
      runnerUpFinishes,
      bestFinish,
      averageFinish,
      averagePointsPerSeason,
    };
  };

  const ownerGroups = new Map();

  teams.forEach((team) => {
    if (!ownerGroups.has(team.ownerId)) {
      ownerGroups.set(team.ownerId, {
        ownerId: team.ownerId,
        ownerName: team.ownerName,
        teams: [],
      });
    }

    ownerGroups
      .get(team.ownerId)
      .teams.push(team);
  });

  const allOwnerStats = Array.from(
    ownerGroups.values()
  )
    .map((owner) => ({
      ownerId: owner.ownerId,
      ownerName: owner.ownerName,
      ...calculateOwnerStats(
        owner.teams
      ),
    }))
    .sort((ownerA, ownerB) =>
      ownerA.ownerName.localeCompare(
        ownerB.ownerName
      )
    );

  const owners = allOwnerStats.map(
    (owner) => ({
      ownerId: owner.ownerId,
      ownerName: owner.ownerName,
    })
  );

  const ownerTeams = teams.filter(
    (team) => team.ownerId === ownerId
  );

  const selectedOwnerStats =
    allOwnerStats.find(
      (owner) =>
        owner.ownerId === ownerId
    );

  const ownerName =
    selectedOwnerStats?.ownerName ??
    "Owner";

  const stats =
    selectedOwnerStats ?? {
      seasonsPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      totalPoints: 0,
      winningPercentage: 0,
      championships: 0,
      runnerUpFinishes: 0,
      bestFinish: null,
      averageFinish: null,
      averagePointsPerSeason: 0,
    };

  const getRank = (
    field,
    {
      ascending = false,
      excludeNull = false,
    } = {}
  ) => {
    let rankedOwners = [...allOwnerStats];

    if (excludeNull) {
      rankedOwners =
        rankedOwners.filter(
          (owner) =>
            owner[field] !== null &&
            owner[field] !== undefined
        );
    }

    rankedOwners.sort(
      (ownerA, ownerB) => {
        const valueA =
          Number(ownerA[field]) || 0;

        const valueB =
          Number(ownerB[field]) || 0;

        if (ascending) {
          return valueA - valueB;
        }

        return valueB - valueA;
      }
    );

    const selectedValue =
      selectedOwnerStats?.[field];

    if (
      selectedValue === null ||
      selectedValue === undefined
    ) {
      return null;
    }

    const betterOwners =
      rankedOwners.filter((owner) => {
        if (ascending) {
          return (
            owner[field] <
            selectedValue
          );
        }

        return (
          owner[field] >
          selectedValue
        );
      });

    const rank =
      betterOwners.length + 1;

    const tiedOwners =
      rankedOwners.filter(
        (owner) =>
          owner[field] ===
          selectedValue
      );

    return {
      rank,
      tied: tiedOwners.length > 1,
    };
  };

  const getOrdinal = (number) => {
    const lastTwoDigits =
      number % 100;

    if (
      lastTwoDigits >= 11 &&
      lastTwoDigits <= 13
    ) {
      return `${number}th`;
    }

    const lastDigit = number % 10;

    if (lastDigit === 1) {
      return `${number}st`;
    }

    if (lastDigit === 2) {
      return `${number}nd`;
    }

    if (lastDigit === 3) {
      return `${number}rd`;
    }

    return `${number}th`;
  };

  const formatRank = (rankData) => {
    if (!rankData) {
      return "Not Ranked";
    }

    const ordinal =
      getOrdinal(rankData.rank);

    return rankData.tied
      ? `T-${ordinal}`
      : ordinal;
  };

  const ranks = {
    seasonsPlayed: getRank(
      "seasonsPlayed"
    ),

    totalWins: getRank(
      "totalWins"
    ),

    winningPercentage: getRank(
      "winningPercentage"
    ),

    championships: getRank(
      "championships"
    ),

    runnerUpFinishes: getRank(
      "runnerUpFinishes"
    ),

    bestFinish: getRank(
      "bestFinish",
      {
        ascending: true,
        excludeNull: true,
      }
    ),

    averageFinish: getRank(
      "averageFinish",
      {
        ascending: true,
        excludeNull: true,
      }
    ),

    totalPoints: getRank(
      "totalPoints"
    ),

    averagePointsPerSeason: getRank(
      "averagePointsPerSeason"
    ),
  };

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
    const comparison = compareValues(
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
    Number(value || 0)
      .toFixed(3)
      .replace(/^0/, "");

  const formatFinish = (finish) => {
    const numericFinish =
      Number(finish);

    if (numericFinish === 0) {
      return "In Progress";
    }

    return getOrdinal(numericFinish);
  };

  const formatMetricWithRank = (
    value,
    rankData
  ) => (
    <>
      {value}{" "}
      <span
        style={{
          color: "#64748b",
          fontSize: "0.9em",
          fontWeight: 600,
        }}
      >
        ({formatRank(rankData)})
      </span>
    </>
  );

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

      <div className="owner-summary">
        <p>
          <strong>
            Seasons Played:
          </strong>{" "}
          {formatMetricWithRank(
            stats.seasonsPlayed,
            ranks.seasonsPlayed
          )}
        </p>

        <p>
          <strong>
            Career Record:
          </strong>{" "}
          {formatMetricWithRank(
            `${stats.totalWins}-${stats.totalLosses}${
              stats.totalTies > 0
                ? `-${stats.totalTies}`
                : ""
            }`,
            ranks.totalWins
          )}
        </p>

        <p>
          <strong>
            Winning Percentage:
          </strong>{" "}
          {formatMetricWithRank(
            formatWinPct(
              stats.winningPercentage
            ),
            ranks.winningPercentage
          )}
        </p>

        <p>
          <strong>
            Championships:
          </strong>{" "}
          {formatMetricWithRank(
            stats.championships,
            ranks.championships
          )}
        </p>

        <p>
          <strong>
            Runner-Up Finishes:
          </strong>{" "}
          {formatMetricWithRank(
            stats.runnerUpFinishes,
            ranks.runnerUpFinishes
          )}
        </p>

        <p>
          <strong>
            Best Finish:
          </strong>{" "}
          {formatMetricWithRank(
            stats.bestFinish === null
              ? "N/A"
              : formatFinish(
                  stats.bestFinish
                ),
            ranks.bestFinish
          )}
        </p>

        <p>
          <strong>
            Average Finish:
          </strong>{" "}
          {formatMetricWithRank(
            stats.averageFinish ===
              null
              ? "N/A"
              : stats.averageFinish.toFixed(
                  1
                ),
            ranks.averageFinish
          )}
        </p>

        <p>
          <strong>
            Career Points:
          </strong>{" "}
          {formatMetricWithRank(
            formatPoints(
              stats.totalPoints
            ),
            ranks.totalPoints
          )}
        </p>

        <p>
          <strong>
            Average Points/Season:
          </strong>{" "}
          {formatMetricWithRank(
            formatPoints(
              stats.averagePointsPerSeason
            ),
            ranks.averagePointsPerSeason
          )}
        </p>
      </div>

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
              {sortIndicator("season")}
            </th>

            <th
              onClick={() =>
                handleSort("teamName")
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
                handleSort("losses")
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
      
      <OwnerHistoryChart
        ownerTeams={ownerTeams}
        ownerName={ownerName}
      />
    </div>
  );
}

export default OwnerHistory;