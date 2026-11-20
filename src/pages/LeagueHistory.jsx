import { useEffect, useState } from "react";

function LeagueHistory() {
  const [teams, setTeams] = useState([]);
  const [season, setSeason] = useState(2025);

  useEffect(() => {
    fetch("/data/team-seasons.json")
      .then((response) => response.json())
      .then((data) => {
        setTeams(data);
      });
  }, []);

  const seasonTeams = teams
    .filter((team) => team.season === season)
    .sort((a, b) => a.finalStanding - b.finalStanding);

  return (
    <div>
      <h2>League History</h2>

      <select
        value={season}
        onChange={(e) => setSeason(Number(e.target.value))}
      >
        {[...Array(14)].map((_, i) => {
          const year = 2013 + i;

          return (
            <option key={year} value={year}>
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
            <th>Owner</th>
            <th>W</th>
            <th>L</th>
            <th>PF</th>
            <th>Finish</th>
          </tr>
        </thead>

        <tbody>
          {seasonTeams.map((team) => (
            <tr key={`${team.season}-${team.teamId}`}>
              <td>{team.ownerLast}</td>
              <td>{team.wins}</td>
              <td>{team.losses}</td>
              <td>{team.pointsFor}</td>
              <td>{team.finalStanding}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeagueHistory;