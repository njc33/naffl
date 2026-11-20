import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./ScoreboardTimeMachine.css";


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
        ].sort(
          (seasonA, seasonB) =>
            seasonB - seasonA
        );

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
        ].sort(
          (weekA, weekB) =>
            weekB - weekA
        );

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
      ].sort(
        (seasonA, seasonB) =>
          seasonB - seasonA
      );
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
      ].sort(
        (weekA, weekB) =>
          weekA - weekB
      );
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
    ].sort(
      (weekA, weekB) =>
        weekA - weekB
    );

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
      normalizedSlot ===
        "BENCH"
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
        <div className="scoreboard-lineup-empty">
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
          <div className="scoreboard-lineup-section">
            {sectionLabel}
          </div>

          {players.map(
            (player, index) => (
              <div
                className="scoreboard-player-row"
                key={`${team.ownerId}-${player.playerId}-${player.player}-${player.lineupSlot}-${index}`}
              >
                <div className="scoreboard-player-slot">
                  {player.lineupSlot}
                </div>

                <div className="scoreboard-player-name">
                  <strong>
                    {player.player}
                  </strong>

                  <div className="scoreboard-player-meta">
                    {player.position}

                    {player.nflTeam
                      ? ` · ${player.nflTeam}`
                      : ""}

                    {player.nflOpponent
                      ? ` vs ${player.nflOpponent}`
                      : ""}
                  </div>
                </div>

                <div className="scoreboard-player-number points">
                  {formatPoints(
                    player.points
                  )}
                </div>

                <div className="scoreboard-player-number projected">
                  {formatPoints(
                    player.projectedPoints
                  )}
                </div>

                <div
                  className="scoreboard-player-number variance"
                  style={{
                    color:
                      getProjectionColor(
                        player.vsProjection
                      ),

                    fontWeight: 700,
                  }}
                >
                  {formatVsProjection(
                    player.vsProjection
                  )}
                </div>
              </div>
            )
          )}
        </>
      );
    };

    return (
      <div className="scoreboard-lineup">
        <div className="scoreboard-lineup-header">
          <div>Slot</div>

          <div>Player</div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            Pts
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            Proj
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            Vs Proj
          </div>
        </div>

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
          aria-controls={
            `lineup-${teamKey}`
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

            alignItems: "start",

            width: "100%",

            minWidth: 0,

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
              display: "block",
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

                lineHeight: 1.25,

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

                lineHeight: 1.3,
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

                marginTop: "6px",

                color: "#475569",

                fontSize:
                  "0.7rem",

                lineHeight: 1.3,
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
                "clamp(1.15rem, 5vw, 1.45rem)",

              fontWeight: 900,

              fontVariantNumeric:
                "tabular-nums",

              lineHeight: 1,

              whiteSpace: "nowrap",
            }}
          >
            {formatPoints(
              team.score
            )}
          </span>
        </button>

        {isExpanded && (
          <div
            id={
              `lineup-${teamKey}`
            }
            style={{
              width: "100%",

              minWidth: 0,

              marginTop: "8px",

              padding: "10px",

              overflow: "hidden",

              border:
                "1px solid #d7dce3",

              borderRadius: "8px",

              backgroundColor:
                "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                alignItems: "center",

                gap: "10px",

                minWidth: 0,

                marginBottom:
                  "8px",
              }}
            >
              <div
                style={{
                  minWidth: 0,

                  overflow: "hidden",

                  color: "#172b43",

                  fontSize:
                    "0.84rem",

                  fontWeight: 800,

                  textOverflow:
                    "ellipsis",

                  whiteSpace:
                    "nowrap",
                }}
                title={
                  `${team.teamName} lineup`
                }
              >
                {team.teamName} lineup
              </div>

              <button
                type="button"
                onClick={() =>
                  setExpandedTeamKey(
                    null
                  )
                }
                style={{
                  flexShrink: 0,

                  padding:
                    "4px 8px",

                  border:
                    "1px solid #cbd5e1",

                  borderRadius:
                    "5px",

                  backgroundColor:
                    "#ffffff",

                  color: "#334155",

                  fontSize:
                    "0.7rem",

                  cursor: "pointer",
                }}
              >
                Close
              </button>
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
    <div
      style={{
        width: "100%",
        minWidth: 0,
      }}
    >
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

          width: "100%",

          minWidth: 0,

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
                width: "100%",

                minWidth: 0,

                padding: "14px",

                overflow: "hidden",

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

                  flexWrap: "wrap",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap: "8px 12px",

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

                    whiteSpace:
                      "nowrap",
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
                  minWidth: 0,
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