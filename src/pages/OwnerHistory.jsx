import { useEffect, useState } from "react";

function OwnerHistory() {
  const [teams, setTeams] = useState([]);
  const [owner, setOwner] = useState("Ceraso");

  useEffect(() => {
    fetch("/data/team-seasons.json")
      .then((response) => response.json())
      .then((data) => {
        setTeams(data);
      });
  }, []);

  const owners = [...new Set(
    teams.map((team) => team.ownerLast)
  )].sort();

  const ownerTeams = teams.filter(
    (team) => team.ownerLast === owner
  );

  const totalWins = ownerTeams.reduce(
    (sum, season) => sum + season.wins,
    0
  );

  const totalLosses = ownerTeams.reduce(
    (sum, season) => sum + season.losses,
    0
  );

  const totalPoints = ownerTeams.reduce(
    (sum, season) => sum + season.pointsFor,
    0
  );

  const seasonsPlayed = ownerTeams.length;

  const winPct =
    totalWins + totalLosses > 0
      ? totalWins / (totalWins + totalLosses)
      : 0;

  const validFinishes = ownerTeams
    .filter((team) => team.finalStanding > 0)
    .map((team) => Number(team.finalStanding));

  const championships =
    validFinishes.filter(
      (finish) => finish === 1
    ).length;

  const bestFinish =
    validFinishes.length > 0
      ? Math.min(...validFinishes)
      : "N/A";

  const averageFinish =
    validFinishes.length > 0
      ? validFinishes.reduce(
          (sum, finish) => sum + finish,
          0
        ) / validFinishes.length
      : 0;

  return (
    <div>
      <h2>Owner History</h2>

      <select
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
      >
        {owners.map((ownerName) => (
          <option
            key={ownerName}
            value={ownerName}
          >
            {ownerName}
          </option>
        ))}
      </select>

      <h3>{owner}</h3>

      <p>
        Seasons Played: {seasonsPlayed}
      </p>

      <p>
        Career Record: {totalWins}-{totalLosses}
      </p>

      <p>
        Win Percentage: {winPct.toFixed(3)}
      </p>

      <p>
        Championships: {championships}
      </p>

      <p>
        Best Finish: {bestFinish}
      </p>

      <p>
        Average Finish: {averageFinish.toFixed(1)}
      </p>

      <p>
        Career Points: {Math.round(totalPoints)}
      </p>

      <table>
        <thead>
          <tr>
            <th>Season</th>
            <th>W</th>
            <th>L</th>
            <th>Finish</th>
          </tr>
        </thead>

        <tbody>
          {ownerTeams
            .sort((a, b) => a.season - b.season)
            .map((season) => (
              <tr
                key={`${season.ownerLast}-${season.season}`}
              >
                <td>{season.season}</td>
                <td>{season.wins}</td>
                <td>{season.losses}</td>
                <td>
                  {season.finalStanding === 0
                    ? "In Progress"
                    : season.finalStanding}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default OwnerHistory;