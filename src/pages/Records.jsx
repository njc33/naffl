import { useEffect, useState } from "react";

function Records() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetch("/data/team-seasons.json")
      .then((response) => response.json())
      .then((data) => {
        setTeams(data);
      });
  }, []);

  const ownerStats = {};

  teams.forEach((team) => {
    const owner = team.ownerLast;

    if (!ownerStats[owner]) {
      ownerStats[owner] = {
        owner,
        wins: 0,
        losses: 0,
        points: 0,
        championships: 0,
        seasons: 0,
      };
    }

    ownerStats[owner].wins += team.wins;
    ownerStats[owner].losses += team.losses;
    ownerStats[owner].points += team.pointsFor;
    ownerStats[owner].seasons += 1;

    if (team.finalStanding === 1) {
      ownerStats[owner].championships += 1;
    }
  });

  const records = Object.values(ownerStats);

  const mostWins = [...records]
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  const mostPoints = [...records]
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const mostTitles = [...records]
    .sort((a, b) => b.championships - a.championships)
    .slice(0, 10);

  return (
    <div>
      <h1>League Records</h1>

      <h2>Most Wins</h2>

      <ol>
        {mostWins.map((owner) => (
          <li key={owner.owner}>
            {owner.owner} ({owner.wins})
          </li>
        ))}
      </ol>

      <h2>Most Points</h2>

      <ol>
        {mostPoints.map((owner) => (
          <li key={owner.owner}>
            {owner.owner} ({Math.round(owner.points)})
          </li>
        ))}
      </ol>

      <h2>Most Championships</h2>

      <ol>
        {mostTitles.map((owner) => (
          <li key={owner.owner}>
            {owner.owner} ({owner.championships})
          </li>
        ))}
      </ol>
    </div>
  );
}

export default Records;