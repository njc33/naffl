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
    .filter((team) => team.season === season)
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      }

      return aValue < bValue ? 1 : -1;
    });

  return (
    <div>
      <h2>League History</h2>

      <select
        value={season}
        onChange={(e) =>
          setSeason(Number(e.target.value))
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
              style={{ cursor: "pointer" }}
              onClick={() =>
                handleSort("ownerLast")
              }
            >
              Owner
            </th>

            <th
              style={{ cursor: "pointer" }}
              onClick={() =>
                handleSort("wins")
              }
            >
              W
            </th>

            <th
              style={{ cursor: "pointer" }}
              onClick={() =>
                handleSort("losses")
              }
            >
              L
            </th>

            <th
              style={{ cursor: "pointer" }}
              onClick={() =>
                handleSort("pointsFor")
              }
            >
              PF
            </th>

            <th
              style={{ cursor: "pointer" }}
              onClick={() =>
                handleSort(
                  "finalStanding"
                )
              }
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
              <td>{team.ownerLast}</td>

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