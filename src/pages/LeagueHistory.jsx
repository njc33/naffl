import { useEffect, useState } from "react";

function LeagueHistory() {
  const [teams, setTeams] = useState([]);
  const [season, setSeason] = useState(2025);

  const [sortField, setSortField] =
    useState("finalStanding");

  const [sortDirection, setSortDirection] =
    useState("asc");

  useEffect(() => {
    fetch("/data/team-seasons.json")
      .then((response) => response.json())
      .then((data) => {
        setTeams(data);
      });
  }, []);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const seasonTeams = [...teams]
    .filter(
      (team) => team.season === season
    )
    .sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1;
      }

      return valueA < valueB ? 1 : -1;
    });

  return (
    <div>
      <h2>League History</h2>

      <select
        value={season}
        onChange={(e) =>
          setSeason(
            Number(e.target.value)
          )
        }
      >
        {[...Array(14)].map((_, i) => {
          const year = 2013 + i;

          return (
            <option
              key={year}
              value={year}
            >
              {year}
            </option>
          );
        })}
      </select>

      <table
        style={{
          marginTop: "20px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th
              onClick={() =>
                handleSort("ownerLast")
              }
              style={{
                cursor: "pointer",
              }}
            >
              Owner
            </th>

            <th
              onClick={() =>
                handleSort("wins")
              }
              style={{
                cursor: "pointer",
              }}
            >
              W
            </th>

            <th
              onClick={() =>
                handleSort("losses")
              }
              style={{
                cursor: "pointer",
              }}
            >
              L
            </th>

            <th
              onClick={() =>
                handleSort("pointsFor")
              }
              style={{
                cursor: "pointer",
              }}
            >
              PF
            </th>

            <th
              onClick={() =>
                handleSort(
                  "finalStanding"
                )
              }
              style={{
                cursor: "pointer",
              }}
            >
              Finish
            </th>
          </tr>
        </thead>

        <tbody>
          {seasonTeams.map((team) => (
            <tr
              key={`${team.season}-${team.teamId}`}
            >
              <td>
                {team.ownerLast}
              </td>

              <td>{team.wins}</td>

              <td>{team.losses}</td>

              <td>
                {Math.round(
                  team.pointsFor
                )}
              </td>

              <td>
                {team.finalStanding === 0
                  ? "In Progress"
                  : team.finalStanding}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeagueHistory;