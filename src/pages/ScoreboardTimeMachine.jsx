import {
  useEffect,
  useMemo,
  useState,
} from "react";


function ScoreboardTimeMachine() {
  const [matchups, setMatchups] =
    useState([]);

  const [season, setSeason] =
    useState("");

  const [week, setWeek] =
    useState("");

  const [
    expandedTeamKey,
    setExpandedTeamKey,
  ] = useState(null);


  useEffect(() => {
    fetch(
      "/data/scoreboard-history.json"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load scoreboard history."
          );
        }

        return response.json();
      })
      .then((data) => {
        setMatchups(data);

        const seasons = [
          ...new Set(
            data.map(
              (matchup) =>
                Number(
                  matchup.season
                )
            )
          ),
        ].sort((a, b) => b - a);

        if (
          seasons.length === 0
        ) {
          return;
        }

        const latestSeason =
          seasons[0];

        setSeason(
          String(latestSeason)
        );

        const latestSeasonWeeks = [
          ...new Set(
            data
              .filter(
                (matchup) =>
                  Number(
                    matchup.season
                  ) ===
                  latestSeason
              )
              .map(
                (matchup) =>
                  Number(
                    matchup.week
                  )
              )
          ),
        ].sort((a, b) => b - a);

        if (
          latestSeasonWeeks.length >
          0
        ) {
          setWeek(
            String(
              latestSeasonWeeks[0]
            )
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);


  const availableSeasons =
    useMemo(() => {
      return [
        ...new Set(
          matchups.map(
            (matchup) =>
              Number(
                matchup.season
              )
          )
        ),
      ].sort((a, b) => b - a);
    }, [matchups]);


  const availableWeeks =
    useMemo(() => {
      return [
        ...new Set(
          matchups
            .filter(
              (matchup) =>
                Number(
                  matchup.season
                ) ===
                Number(season)
            )
            .map(
              (matchup) =>
                Number(
                  matchup.week
                )
            )
        ),
      ].sort((a, b) => a - b);
    }, [
      matchups,
      season,
    ]);


  const selectedMatchups =
    useMemo(() => {
      return matchups.filter(
        (matchup) =>
          Number(
            matchup.season
          ) === Number(season) &&
          Number(
            matchup.week
          ) === Number(week)
      );
    }, [
      matchups,
      season,
      week,
    ]);


  const handleSeasonChange = (
    event
  ) => {
    const newSeason =
      Number(
        event.target.value
      );

    setSeason(
      String(newSeason)
    );

    const newSeasonWeeks = [
      ...new Set(
        matchups
          .filter(
            (matchup) =>
              Number(
                matchup.season
              ) === newSeason
          )
          .map(
            (matchup) =>
              Number(
                matchup.week
              )
          )
      ),
    ].sort((a, b) => a - b);

    setWeek(
      newSeasonWeeks.length > 0
        ? String(
            newSeasonWeeks[0]
          )
        : ""
    );

    setExpandedTeamKey(null);
  };


  const formatPoints = (
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "N/A";
    }

    return Number(
      value
    ).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };


  const formatVsProjection = (
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "N/A";
    }

    const numericValue =
      Number(value);

    const absoluteValue =
      Math.abs(
        numericValue
      ).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );

    if (numericValue > 0) {
      return `+${absoluteValue}`;
    }

    if (numericValue < 0) {
      return `-${absoluteValue}`;
    }

    return "0.00";
  };


  const getProjectionColor = (
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return undefined;
    }

    if (Number(value) > 0) {
      return "#15803d";
    }

    if (Number(value) < 0) {
      return "#b91c1c";
    }

    return undefined;
  };


  const isBenchSlot = (
    lineupSlot
  ) => {
    const normalizedSlot =
      String(
        lineupSlot ?? ""
      )
        .trim()
        .toUpperCase();

    return (
      normalizedSlot === "BE" ||
      normalizedSlot === "BENCH"
    );
  };


  const isReserveSlot = (
    lineupSlot
  ) => {
    const normalizedSlot =
      String(
        lineupSlot ?? ""
      )
        .trim()
        .toUpperCase();

    return (
      normalizedSlot === "IR" ||
      normalizedSlot === "RES"
    );
  };


  const LineupTable = ({
    team,
  }) => {
    if (
      !team.lineupAvailable ||
      !Array.isArray(
        team.lineup
      ) ||
      team.lineup.length === 0
    ) {
      return (
        <div
          style={{
            padding: "18px",
            border:
              "1px dashed #aeb8c4",
            borderRadius: "7px",
            backgroundColor:
              "#ffffff",
            color: "#64748b",
            fontSize: "0.82rem",
            textAlign: "center",
          }}
        >
          Detailed lineup data is not
          available for this team and
          week.
        </div>
      );
    }

    const starters =
      team.lineup.filter(
        (player) =>
          !isBenchSlot(
            player.lineupSlot
          ) &&
          !isReserveSlot(
            player.lineupSlot
          )
      );

    const bench =
      team.lineup.filter(
        (player) =>
          isBenchSlot(
            player.lineupSlot
          )
      );

    const reserve =
      team.lineup.filter(
        (player) =>
          isReserveSlot(
            player.lineupSlot
          )
      );

    const renderPlayers = (
      players,
      sectionLabel
    ) => {
      if (players.length === 0) {
        return null;
      }

      return (
        <>
          <tr>
            <td
              colSpan={5}
              style={{
                padding:
                  "9px 8px 5px",
                backgroundColor:
                  "#eef2f6",
                color: "#334155",
                fontSize:
                  "0.72rem",
                fontWeight: 800,
                letterSpacing:
                  "0.06em",
                textTransform:
                  "uppercase",
              }}
            >
              {sectionLabel}
            </td>
          </tr>

          {players.map(
            (player, index) => (
              <tr
                key={`${team.ownerId}-${player.playerId}-${player.player}-${player.lineupSlot}-${index}`}
              >
                <td
                  style={{
                    padding:
                      "7px 8px",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {
                    player.lineupSlot
                  }
                </td>

                <td
                  style={{
                    padding:
                      "7px 8px",
                  }}
                >
                  <strong>
                    {player.player}
                  </strong>

                  <div
                    style={{
                      marginTop:
                        "2px",
                      color:
                        "#64748b",
                      fontSize:
                        "0.7rem",
                    }}
                  >
                    {
                      player.position
                    }
                    {player.nflTeam
                      ? ` · ${player.nflTeam}`
                      : ""}
                    {player.nflOpponent
                      ? ` vs ${player.nflOpponent}`
                      : ""}
                  </div>
                </td>

                <td
                  style={{
                    padding:
                      "7px 8px",
                    textAlign:
                      "right",
                    whiteSpace:
                      "nowrap",
                    fontVariantNumeric:
                      "tabular-nums",
                  }}
                >
                  {formatPoints(
                    player.points
                  )}
                </td>

                <td
                  style={{
                    padding:
                      "7px 8px",
                    textAlign:
                      "right",
                    whiteSpace:
                      "nowrap",
                    fontVariantNumeric:
                      "tabular-nums",
                  }}
                >
                  {formatPoints(
                    player.projectedPoints
                  )}
                </td>

                <td
                  style={{
                    padding:
                      "7px 8px",
                    color:
                      getProjectionColor(
                        player.vsProjection
                      ),
                    fontWeight:
                      700,
                    textAlign:
                      "right",
                    whiteSpace:
                      "nowrap",
                    fontVariantNumeric:
                      "tabular-nums",
                  }}
                >
                  {formatVsProjection(
                    player.vsProjection
                  )}
                </td>
              </tr>
            )
          )}
        </>
      );
    };

    return (
      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling:
            "touch",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "510px",
            borderCollapse:
              "collapse",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding:
                    "7px 8px",
                }}
              >
                Slot
              </th>

              <th
                style={{
                  padding:
                    "7px 8px",
                }}
              >
                Player
              </th>

              <th
                style={{
                  padding:
                    "7px 8px",
                  textAlign:
                    "right",
                }}
              >
                Pts
              </th>

              <th
                style={{
                  padding:
                    "7px 8px",
                  textAlign:
                    "right",
                }}
              >
                Proj
              </th>

              <th
                style={{
                  padding:
                    "7px 8px",
                  textAlign:
                    "right",
                }}
              >
                Vs Proj
              </th>
            </tr>
          </thead>

          <tbody>
            {renderPlayers(
              starters,
              "Starting Lineup"
            )}

            {renderPlayers(
              bench,
              "Bench"
            )}

            {renderPlayers(
              reserve,
              "Reserve"
            )}
          </tbody>
        </table>
      </div>
    );
  };


  const TeamScore = ({
    matchup,
    team,
    side,
  }) => {
    const isWinner =
      matchup.winnerSide === side;

    const isTie =
      matchup.winnerSide === "tie";

    const teamKey =
      `${matchup.matchupId}-${side}`;

    const isExpanded =
      expandedTeamKey === teamKey;

    return (
      <>
        <button
          type="button"
          aria-expanded={
            isExpanded
          }
          onClick={() =>
            setExpandedTeamKey(
              (currentKey) =>
                currentKey ===
                teamKey
                  ? null
                  : teamKey
            )
          }
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) auto",
            gap: "12px",
            width: "100%",
            padding: "14px",
            border: isWinner
              ? "2px solid #17365d"
              : "1px solid #d7dce3",
            borderRadius: "8px",
            backgroundColor:
              isWinner
                ? "#eef4fa"
                : "#ffffff",
            color: "#172b43",
            font: "inherit",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              minWidth: 0,
            }}
          >
            <span
              style={{
                display: "block",
                overflow: "hidden",
                color: "#17365d",
                fontSize:
                  "0.95rem",
                fontWeight: 800,
                textOverflow:
                  "ellipsis",
                whiteSpace:
                  "nowrap",
              }}
              title={
                team.teamName
              }
            >
              {team.teamName}
            </span>

            <span
              style={{
                display: "block",
                marginTop: "3px",
                color: "#64748b",
                fontSize:
                  "0.76rem",
              }}
            >
              {team.ownerName}
              {isWinner
                ? " · Winner"
                : isTie
                  ? " · Tie"
                  : ""}
            </span>

            <span
              style={{
                display: "block",
                marginTop: "5px",
                color: "#475569",
                fontSize:
                  "0.7rem",
              }}
            >
              {team.lineupAvailable
                ? isExpanded
                  ? "Tap to hide lineup"
                  : "Tap to view lineup"
                : "Lineup unavailable"}
            </span>
          </span>

          <span
            style={{
              color: isWinner
                ? "#17365d"
                : "#334155",
              fontSize:
                "1.45rem",
              fontWeight: 900,
              fontVariantNumeric:
                "tabular-nums",
              lineHeight: 1,
            }}
          >
            {formatPoints(
              team.score
            )}
          </span>
        </button>

        {isExpanded && (
          <div
            style={{
              marginTop: "8px",
              padding: "10px",
              border:
                "1px solid #d7dce3",
              borderRadius: "8px",
              backgroundColor:
                "#f8fafc",
            }}
          >
            <div
              style={{
                marginBottom:
                  "8px",
                color: "#172b43",
                fontSize:
                  "0.84rem",
                fontWeight: 800,
              }}
            >
              {team.teamName} lineup
            </div>

            <LineupTable
              team={team}
            />
          </div>
        )}
      </>
    );
  };


  return (
    <div>
      <h2>
        Scoreboard Time Machine
      </h2>

      <p
        style={{
          maxWidth: "720px",
          color: "#536273",
        }}
      >
        Select a season and week to
        revisit the NAFFL scoreboard.
        Tap either team to view its
        lineup when detailed weekly
        data is available.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginTop: "18px",
        }}
      >
        <label>
          Season:{" "}
          <select
            value={season}
            onChange={
              handleSeasonChange
            }
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

        <label>
          Week:{" "}
          <select
            value={week}
            onChange={(event) => {
              setWeek(
                event.target.value
              );

              setExpandedTeamKey(
                null
              );
            }}
          >
            {availableWeeks.map(
              (weekNumber) => (
                <option
                  key={weekNumber}
                  value={weekNumber}
                >
                  Week {weekNumber}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <h3
        style={{
          marginTop: "25px",
        }}
      >
        {season && week
          ? `${season} · Week ${week}`
          : "Select a week"}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 390px), 1fr))",
          gap: "16px",
          marginTop: "14px",
        }}
      >
        {selectedMatchups.map(
          (matchup) => (
            <article
              key={
                matchup.matchupId
              }
              style={{
                minWidth: 0,
                padding: "14px",
                border:
                  "1px solid #cbd5e1",
                borderRadius:
                  "10px",
                backgroundColor:
                  "#ffffff",
                boxShadow:
                  "0 4px 12px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "12px",
                  marginBottom:
                    "10px",
                }}
              >
                <span
                  style={{
                    display:
                      "inline-block",
                    padding:
                      "4px 8px",
                    borderRadius:
                      "999px",
                    backgroundColor:
                      matchup.playoff
                        ? "#fef3c7"
                        : "#eef2f6",
                    color:
                      matchup.playoff
                        ? "#92400e"
                        : "#475569",
                    fontSize:
                      "0.68rem",
                    fontWeight: 800,
                    letterSpacing:
                      "0.04em",
                    textTransform:
                      "uppercase",
                  }}
                >
                  {matchup.playoff
                    ? "Playoffs"
                    : "Regular Season"}
                </span>

                <span
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "0.72rem",
                  }}
                >
                  Margin:{" "}
                  {formatPoints(
                    matchup.margin
                  )}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "10px",
                }}
              >
                <TeamScore
                  matchup={matchup}
                  team={
                    matchup.home
                  }
                  side="home"
                />

                <div
                  style={{
                    color:
                      "#94a3b8",
                    fontSize:
                      "0.68rem",
                    fontWeight: 800,
                    textAlign:
                      "center",
                    textTransform:
                      "uppercase",
                  }}
                >
                  vs
                </div>

                <TeamScore
                  matchup={matchup}
                  team={
                    matchup.away
                  }
                  side="away"
                />
              </div>
            </article>
          )
        )}
      </div>

      {selectedMatchups.length ===
        0 && (
        <div
          style={{
            marginTop: "18px",
            padding: "24px",
            border:
              "1px dashed #94a3b8",
            borderRadius: "8px",
            backgroundColor:
              "#f8fafc",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          No matchups were found for
          this season and week.
        </div>
      )}
    </div>
  );
}

export default ScoreboardTimeMachine;