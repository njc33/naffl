import { useEffect, useState } from "react";

function Records() {
  const [teams, setTeams] = useState([]);

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
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const ownerStatsMap = new Map();

  teams.forEach((team) => {
    if (
      !ownerStatsMap.has(
        team.ownerId
      )
    ) {
      ownerStatsMap.set(
        team.ownerId,
        {
          ownerId: team.ownerId,
          ownerName:
            team.ownerName,
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          championships: 0,
          runnerUpFinishes: 0,
          seasons: 0,
          completedSeasons: 0,
          acquisitions: 0,
          drops: 0,
          trades: 0,
        }
      );
    }

    const owner =
      ownerStatsMap.get(
        team.ownerId
      );

    owner.wins += Number(
      team.wins || 0
    );

    owner.losses += Number(
      team.losses || 0
    );

    owner.ties += Number(
      team.ties || 0
    );

    owner.pointsFor += Number(
      team.pointsFor || 0
    );

    owner.pointsAgainst +=
      Number(
        team.pointsAgainst || 0
      );

    owner.acquisitions += Number(
      team.acquisitions || 0
    );

    owner.drops += Number(
      team.drops || 0
    );

    owner.trades += Number(
      team.trades || 0
    );

    owner.seasons += 1;

    if (
      Number(
        team.finalStanding
      ) > 0
    ) {
      owner.completedSeasons += 1;
    }

    if (
      Number(
        team.finalStanding
      ) === 1
    ) {
      owner.championships += 1;
    }

    if (
      Number(
        team.finalStanding
      ) === 2
    ) {
      owner.runnerUpFinishes += 1;
    }
  });

  const ownerStats = Array.from(
    ownerStatsMap.values()
  ).map((owner) => {
    const gamesPlayed =
      owner.wins +
      owner.losses +
      owner.ties;

    const winningPercentage =
      gamesPlayed > 0
        ? (
            owner.wins +
            owner.ties * 0.5
          ) / gamesPlayed
        : 0;

    const averagePointsPerSeason =
      owner.seasons > 0
        ? owner.pointsFor /
          owner.seasons
        : 0;

    const pointDifferential =
      owner.pointsFor -
      owner.pointsAgainst;

    return {
      ...owner,
      winningPercentage,
      averagePointsPerSeason,
      pointDifferential,
    };
  });

  const completedSeasons = teams.filter(
    (team) =>
      Number(
        team.finalStanding
      ) > 0
  );

  const topOwners = (
    field,
    limit = 10
  ) =>
    [...ownerStats]
      .sort(
        (ownerA, ownerB) =>
          ownerB[field] -
            ownerA[field] ||
          ownerA.ownerName.localeCompare(
            ownerB.ownerName
          )
      )
      .slice(0, limit);

  const bestWinningPercentage =
    [...ownerStats]
      .filter(
        (owner) =>
          owner.seasons >= 3
      )
      .sort(
        (ownerA, ownerB) =>
          ownerB.winningPercentage -
            ownerA.winningPercentage ||
          ownerB.wins -
            ownerA.wins
      )
      .slice(0, 10);

  const highestScoringSeasons =
    [...teams]
      .sort(
        (teamA, teamB) =>
          teamB.pointsFor -
          teamA.pointsFor
      )
      .slice(0, 10);

  const bestFinishes = [
    ...completedSeasons,
  ];

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

  const leaderboardStyle = {
    marginBottom: "32px",
  };

  return (
    <div>
      <h1>League Records</h1>

      <section style={leaderboardStyle}>
        <h2>Most Career Wins</h2>

        <ol>
          {topOwners("wins").map(
            (owner) => (
              <li key={owner.ownerId}>
                {owner.ownerName}:{" "}
                {owner.wins}
              </li>
            )
          )}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>
          Best Career Winning Percentage
        </h2>

        <p>
          Minimum three seasons.
        </p>

        <ol>
          {bestWinningPercentage.map(
            (owner) => (
              <li key={owner.ownerId}>
                {owner.ownerName}:{" "}
                {formatWinPct(
                  owner.winningPercentage
                )}
              </li>
            )
          )}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>
          Most Career Points
        </h2>

        <ol>
          {topOwners(
            "pointsFor"
          ).map((owner) => (
            <li key={owner.ownerId}>
              {owner.ownerName}:{" "}
              {formatPoints(
                owner.pointsFor
              )}
            </li>
          ))}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>Most Championships</h2>

        <ol>
          {topOwners(
            "championships"
          ).map((owner) => (
            <li key={owner.ownerId}>
              {owner.ownerName}:{" "}
              {owner.championships}
            </li>
          ))}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>
          Most Runner-Up Finishes
        </h2>

        <ol>
          {topOwners(
            "runnerUpFinishes"
          ).map((owner) => (
            <li key={owner.ownerId}>
              {owner.ownerName}:{" "}
              {owner.runnerUpFinishes}
            </li>
          ))}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>Most Seasons</h2>

        <ol>
          {topOwners(
            "seasons"
          ).map((owner) => (
            <li key={owner.ownerId}>
              {owner.ownerName}:{" "}
              {owner.seasons}
            </li>
          ))}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>
          Highest Average Points/Season
        </h2>

        <ol>
          {topOwners(
            "averagePointsPerSeason"
          ).map((owner) => (
            <li key={owner.ownerId}>
              {owner.ownerName}:{" "}
              {formatPoints(
                owner.averagePointsPerSeason
              )}
            </li>
          ))}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>
          Best Career Point Differential
        </h2>

        <ol>
          {topOwners(
            "pointDifferential"
          ).map((owner) => (
            <li key={owner.ownerId}>
              {owner.ownerName}:{" "}
              {formatPoints(
                owner.pointDifferential
              )}
            </li>
          ))}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>Most Career Trades</h2>

        <ol>
          {topOwners(
            "trades"
          ).map((owner) => (
            <li key={owner.ownerId}>
              {owner.ownerName}:{" "}
              {owner.trades}
            </li>
          ))}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>
          Most Career Acquisitions
        </h2>

        <ol>
          {topOwners(
            "acquisitions"
          ).map((owner) => (
            <li key={owner.ownerId}>
              {owner.ownerName}:{" "}
              {owner.acquisitions}
            </li>
          ))}
        </ol>
      </section>

      <section style={leaderboardStyle}>
        <h2>
          Highest-Scoring Seasons
        </h2>

        <ol>
          {highestScoringSeasons.map(
            (team) => (
              <li
                key={`${team.ownerId}-${team.season}`}
              >
                {team.ownerName},{" "}
                {team.season}:{" "}
                {formatPoints(
                  team.pointsFor
                )}
              </li>
            )
          )}
        </ol>
      </section>
    </div>
  );
}

export default Records;