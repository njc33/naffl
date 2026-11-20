import {
  useEffect,
  useState,
} from "react";

import LeagueHistoryChart from "../components/LeagueHistoryChart";


function LeagueHistory() {
  const [teams, setTeams] =
    useState([]);

  const [season, setSeason] =
    useState(2025);

  const [sortField, setSortField] =
    useState("finalStanding");

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

        const availableSeasons = [
          ...new Set(
            data.map(
              (team) =>
                Number(team.season)
            )
          ),
        ].sort((a, b) => b - a);

        if (
          availableSeasons.length > 0
        ) {
          setSeason(
            availableSeasons[0]
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);


  const availableSeasons = [
    ...new Set(
      teams.map(
        (team) =>
          Number(team.season)
      )
    ),
  ].sort((a, b) => b - a);


  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(
        (currentDirection) =>
          currentDirection === "asc"
            ? "desc"
            : "asc"
      );

      return;
    }

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


  const seasonTeams = [
    ...teams.filter(
      (team) =>
        Number(team.season) ===
        Number(season)
    ),
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
      <h2>League History</h2>

      <label>
        Season:{" "}
        <select
          value={season}
          onChange={(event) => {
            setSeason(
              Number(
                event.target.value
              )
            );

            setSortField(
              "finalStanding"
            );

            setSortDirection("asc");
          }}
        >
          {availableSeasons.map(
            (year) => (
              <option
                key={year}
                value={year}
              >
                {year}
              </option>
            )
          )}
        </select>
      </label>

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
                handleSort(
                  "ownerName"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Owner
              {sortIndicator(
                "ownerName"
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
                  "regularSeasonStanding"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Reg. Season
              {sortIndicator(
                "regularSeasonStanding"
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
              Final Finish
              {sortIndicator(
                "finalStanding"
              )}
            </th>
          </tr>
        </thead>

        <tbody>
          {seasonTeams.map(
            (team) => (
              <tr
                key={`${team.season}-${team.ownerId}`}
              >
                <td style={cellStyle}>
                  {team.ownerName}
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
                    team.regularSeasonStanding
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

      <LeagueHistoryChart
        teams={teams}
      />
    </div>
  );
}

export default LeagueHistory;