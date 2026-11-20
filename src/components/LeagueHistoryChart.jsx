import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


const METRICS = {
  wins: {
    label: "Wins",
    field: "wins",
    decimals: 0,
  },

  losses: {
    label: "Losses",
    field: "losses",
    decimals: 0,
  },

  pointsFor: {
    label: "Points For",
    field: "pointsFor",
    decimals: 2,
  },

  pointsAgainst: {
    label: "Points Against",
    field: "pointsAgainst",
    decimals: 2,
  },

  finalStanding: {
    label: "Finish",
    field: "finalStanding",
    decimals: 0,
  },
};


const OWNER_COLORS = [
  "#17365d",
  "#15803d",
  "#b91c1c",
  "#9333ea",
  "#c2410c",
  "#0369a1",
  "#be185d",
  "#4d7c0f",
  "#7c3aed",
  "#0f766e",
  "#a16207",
  "#475569",
  "#dc2626",
  "#2563eb",
  "#16a34a",
];


function formatNumber(
  value,
  decimals = 0
) {
  return Number(value || 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  );
}


function getOrdinal(number) {
  const numericValue =
    Math.round(Number(number));

  const lastTwoDigits =
    numericValue % 100;

  if (
    lastTwoDigits >= 11 &&
    lastTwoDigits <= 13
  ) {
    return `${numericValue}th`;
  }

  const lastDigit =
    numericValue % 10;

  if (lastDigit === 1) {
    return `${numericValue}st`;
  }

  if (lastDigit === 2) {
    return `${numericValue}nd`;
  }

  if (lastDigit === 3) {
    return `${numericValue}rd`;
  }

  return `${numericValue}th`;
}


function LeagueHistoryTooltip({
  active,
  payload,
  label,
  metric,
  ownerMap,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const validEntries = payload
    .filter(
      (entry) =>
        entry.value !== null &&
        entry.value !== undefined
    )
    .sort(
      (entryA, entryB) => {
        if (
          metric.field ===
          "finalStanding"
        ) {
          return (
            Number(entryA.value) -
            Number(entryB.value)
          );
        }

        return (
          Number(entryB.value) -
          Number(entryA.value)
        );
      }
    );

  const formatValue = (
    value,
    dataKey
  ) => {
    if (
      metric.field ===
      "finalStanding"
    ) {
      if (
        dataKey ===
        "leagueAverage"
      ) {
        return Number(
          value
        ).toFixed(2);
      }

      return getOrdinal(value);
    }

    const decimals =
      dataKey === "leagueAverage"
        ? 2
        : metric.decimals;

    return formatNumber(
      value,
      decimals
    );
  };

  return (
    <div
      style={{
        maxHeight: "320px",
        overflowY: "auto",
        padding: "10px 12px",
        border:
          "1px solid #cbd5e1",
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        boxShadow:
          "0 4px 12px rgba(15, 23, 42, 0.12)",
      }}
    >
      <div
        style={{
          marginBottom: "7px",
          color: "#334155",
          fontSize: "0.82rem",
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      {validEntries.map(
        (entry) => {
          const labelText =
            entry.dataKey ===
            "leagueAverage"
              ? "League Average"
              : ownerMap.get(
                  entry.dataKey
                )?.ownerName ??
                entry.name;

          return (
            <div
              key={entry.dataKey}
              style={{
                marginBottom: "4px",
                color:
                  entry.color ??
                  "#475569",
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              {labelText}:{" "}
              {formatValue(
                entry.value,
                entry.dataKey
              )}
            </div>
          );
        }
      )}
    </div>
  );
}


function LeagueHistoryChart({
  teams,
}) {
  const [
    selectedOwnerIds,
    setSelectedOwnerIds,
  ] = useState([]);

  const [metricKey, setMetricKey] =
    useState("pointsFor");

  const metric =
    METRICS[metricKey];


  const owners = useMemo(() => {
    const ownerMap = new Map();

    teams.forEach((team) => {
      if (
        !ownerMap.has(
          team.ownerId
        )
      ) {
        ownerMap.set(
          team.ownerId,
          {
            ownerId: team.ownerId,
            ownerName:
              team.ownerName,
          }
        );
      }
    });

    return Array.from(
      ownerMap.values()
    ).sort((ownerA, ownerB) =>
      ownerA.ownerName.localeCompare(
        ownerB.ownerName
      )
    );
  }, [teams]);


  /*
    Select every owner automatically
    once the owner list has loaded.
  */
  useEffect(() => {
    if (
      owners.length > 0 &&
      selectedOwnerIds.length === 0
    ) {
      setSelectedOwnerIds(
        owners.map(
          (owner) =>
            owner.ownerId
        )
      );
    }
  }, [
    owners,
    selectedOwnerIds.length,
  ]);


  const ownerMap = useMemo(() => {
    return new Map(
      owners.map((owner, index) => [
        owner.ownerId,
        {
          ...owner,

          color:
            OWNER_COLORS[
              index %
              OWNER_COLORS.length
            ],
        },
      ])
    );
  }, [owners]);


  const seasons = useMemo(() => {
    return [
      ...new Set(
        teams.map(
          (team) =>
            Number(team.season)
        )
      ),
    ].sort((a, b) => a - b);
  }, [teams]);


  const chartData = useMemo(() => {
    return seasons.map((season) => {
      const seasonTeams =
        teams.filter(
          (team) =>
            Number(
              team.season
            ) === season
        );

      const row = {
        season,
      };

      const validValues = [];

      seasonTeams.forEach((team) => {
        const value = Number(
          team[metric.field]
        );

        const valueIsValid =
          Number.isFinite(value) &&
          (
            metric.field !==
              "finalStanding" ||
            value > 0
          );

        if (!valueIsValid) {
          return;
        }

        row[team.ownerId] =
          value;

        validValues.push(value);
      });

      row.leagueAverage =
        validValues.length > 0
          ? validValues.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
            validValues.length
          : null;

      return row;
    });
  }, [
    seasons,
    teams,
    metric.field,
  ]);


  const displayedOwners =
    owners.filter(
      (owner) =>
        selectedOwnerIds.includes(
          owner.ownerId
        )
    );


  const allOwnersSelected =
    owners.length > 0 &&
    selectedOwnerIds.length ===
      owners.length;


  const someOwnersSelected =
    selectedOwnerIds.length > 0 &&
    !allOwnersSelected;


  const handleSelectAll = () => {
    if (allOwnersSelected) {
      setSelectedOwnerIds([]);
      return;
    }

    setSelectedOwnerIds(
      owners.map(
        (owner) =>
          owner.ownerId
      )
    );
  };


  const handleOwnerToggle = (
    toggledOwnerId
  ) => {
    setSelectedOwnerIds(
      (currentOwnerIds) => {
        if (
          currentOwnerIds.includes(
            toggledOwnerId
          )
        ) {
          return currentOwnerIds.filter(
            (currentOwnerId) =>
              currentOwnerId !==
              toggledOwnerId
          );
        }

        return [
          ...currentOwnerIds,
          toggledOwnerId,
        ];
      }
    );
  };


  const allChartValues =
    chartData
      .flatMap((record) => {
        const ownerValues =
          displayedOwners.map(
            (owner) =>
              record[
                owner.ownerId
              ]
          );

        return [
          ...ownerValues,
          record.leagueAverage,
        ];
      })
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          Number.isFinite(
            Number(value)
          )
      )
      .map(Number);


  const finishMaximum =
    allChartValues.length > 0
      ? Math.ceil(
          Math.max(
            ...allChartValues
          )
        )
      : 10;


  const yAxisDomain =
    metric.field ===
    "finalStanding"
      ? [1, finishMaximum]
      : [0, "auto"];


  const yAxisFormatter = (
    value
  ) => {
    if (
      metric.field ===
      "finalStanding"
    ) {
      return getOrdinal(value);
    }

    if (
      metric.field ===
        "pointsFor" ||
      metric.field ===
        "pointsAgainst"
    ) {
      return Number(
        value
      ).toLocaleString(
        undefined,
        {
          maximumFractionDigits: 0,
        }
      );
    }

    return Number(value).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 1,
      }
    );
  };


  const chartHeading = () => {
    if (allOwnersSelected) {
      return "All Owners";
    }

    if (
      selectedOwnerIds.length === 0
    ) {
      return "No Owners Selected";
    }

    if (
      selectedOwnerIds.length === 1
    ) {
      return (
        ownerMap.get(
          selectedOwnerIds[0]
        )?.ownerName ??
        "Selected Owner"
      );
    }

    return (
      `${selectedOwnerIds.length} ` +
      "Owners Selected"
    );
  };


  if (teams.length === 0) {
    return null;
  }


  return (
    <section
      style={{
        marginTop: "38px",
        paddingTop: "24px",
        borderTop:
          "1px solid #d7dce3",
      }}
    >
      <h3>
        League History Graph
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <details
          style={{
            width: "min(100%, 420px)",
            border:
              "1px solid #cbd5e1",
            borderRadius: "6px",
            backgroundColor:
              "#ffffff",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              padding: "9px 12px",
              color: "#172b43",
              fontSize: "0.9rem",
              fontWeight: 700,
              userSelect: "none",
            }}
          >
            Owners:{" "}
            {allOwnersSelected
              ? "All"
              : `${selectedOwnerIds.length} selected`}
          </summary>

          <div
            style={{
              padding:
                "4px 12px 12px",
              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "9px 0",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    allOwnersSelected
                  }
                  ref={(checkbox) => {
                    if (checkbox) {
                      checkbox.indeterminate =
                        someOwnersSelected;
                    }
                  }}
                  onChange={
                    handleSelectAll
                  }
                />

                <strong>
                  Select All
                </strong>
              </label>

              <button
                type="button"
                onClick={() =>
                  setSelectedOwnerIds(
                    []
                  )
                }
                style={{
                  padding:
                    "5px 9px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "5px",
                  backgroundColor:
                    "#f8fafc",
                  color: "#334155",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Clear All
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(165px, 1fr))",
                gap: "7px 12px",
                maxHeight: "240px",
                overflowY: "auto",
                paddingTop: "4px",
              }}
            >
              {owners.map((owner) => {
                const ownerDetails =
                  ownerMap.get(
                    owner.ownerId
                  );

                return (
                  <label
                    key={owner.ownerId}
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "7px",
                      cursor: "pointer",
                      fontSize:
                        "0.82rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedOwnerIds.includes(
                          owner.ownerId
                        )
                      }
                      onChange={() =>
                        handleOwnerToggle(
                          owner.ownerId
                        )
                      }
                    />

                    <span
                      aria-hidden="true"
                      style={{
                        display:
                          "inline-block",
                        width: "10px",
                        height: "10px",
                        flexShrink: 0,
                        borderRadius:
                          "50%",
                        backgroundColor:
                          ownerDetails
                            ?.color ??
                          "#64748b",
                      }}
                    />

                    <span>
                      {owner.ownerName}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </details>

        <label>
          Graph Metric:{" "}
          <select
            value={metricKey}
            onChange={(event) =>
              setMetricKey(
                event.target.value
              )
            }
          >
            {Object.entries(
              METRICS
            ).map(
              ([
                key,
                metricOption,
              ]) => (
                <option
                  key={key}
                  value={key}
                >
                  {
                    metricOption.label
                  }
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <p
        style={{
          marginBottom: "12px",
          color: "#536273",
          fontSize: "0.9rem",
        }}
      >
        {chartHeading()}:{" "}
        {metric.label} by season
      </p>

      {selectedOwnerIds.length > 0 ? (
        <div
          style={{
            width: "100%",
            height:
              selectedOwnerIds.length >
              5
                ? "500px"
                : "410px",
            minHeight: "320px",
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 12,
                right: 24,
                bottom: 12,
                left: 8,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#d7dce3"
              />

              <XAxis
                dataKey="season"
                type="category"
                allowDuplicatedCategory={
                  false
                }
                tick={{
                  fill: "#536273",
                  fontSize: 12,
                }}
                tickLine={false}
                axisLine={{
                  stroke: "#94a3b8",
                }}
              />

              <YAxis
                domain={yAxisDomain}
                reversed={
                  metric.field ===
                  "finalStanding"
                }
                allowDecimals={
                  metric.field !==
                  "finalStanding"
                }
                tickFormatter={
                  yAxisFormatter
                }
                tick={{
                  fill: "#536273",
                  fontSize: 12,
                }}
                tickLine={false}
                axisLine={{
                  stroke: "#94a3b8",
                }}
                width={
                  metric.field ===
                  "finalStanding"
                    ? 50
                    : 72
                }
              />

              <Tooltip
                content={
                  <LeagueHistoryTooltip
                    metric={metric}
                    ownerMap={
                      ownerMap
                    }
                  />
                }
              />

              <Legend
                verticalAlign="top"
                height={
                  selectedOwnerIds
                    .length > 5
                    ? 72
                    : 42
                }
                iconType="line"
                wrapperStyle={{
                  fontSize:
                    "0.75rem",
                  lineHeight: 1.4,
                }}
                formatter={(
                  value,
                  entry
                ) => {
                  if (
                    entry.dataKey ===
                    "leagueAverage"
                  ) {
                    return (
                      "League Average"
                    );
                  }

                  return (
                    ownerMap.get(
                      entry.dataKey
                    )?.ownerName ??
                    value
                  );
                }}
              />

              {displayedOwners.map(
                (owner) => {
                  const ownerDetails =
                    ownerMap.get(
                      owner.ownerId
                    );

                  return (
                    <Line
                      key={
                        owner.ownerId
                      }
                      type="monotone"
                      dataKey={
                        owner.ownerId
                      }
                      name={
                        owner.ownerName
                      }
                      stroke={
                        ownerDetails
                          ?.color ??
                        "#17365d"
                      }
                      strokeWidth={
                        selectedOwnerIds
                          .length > 5
                          ? 2
                          : 3
                      }
                      dot={
                        selectedOwnerIds
                          .length > 5
                          ? false
                          : {
                              r: 4,
                              fill:
                                ownerDetails
                                  ?.color ??
                                "#17365d",
                              stroke:
                                "#ffffff",
                              strokeWidth: 2,
                            }
                      }
                      activeDot={{
                        r: 5,
                      }}
                      connectNulls={
                        false
                      }
                    />
                  );
                }
              )}

              <Line
                type="monotone"
                dataKey="leagueAverage"
                name="League Average"
                stroke="#111827"
                strokeWidth={2}
                strokeDasharray="7 5"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#111827",
                }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          style={{
            padding: "32px 18px",
            border:
              "1px dashed #94a3b8",
            borderRadius: "8px",
            backgroundColor:
              "#f8fafc",
            color: "#475569",
            textAlign: "center",
          }}
        >
          Select at least one owner
          to display the graph.
        </div>
      )}

      <p
        style={{
          marginTop: "8px",
          color: "#64748b",
          fontSize: "0.8rem",
        }}
      >
        The dashed line represents the
        league average for each season.
        Use the owner checkboxes to
        compare any combination of
        rivals.
      </p>

      {metric.field ===
        "finalStanding" && (
        <p
          style={{
            marginTop: "5px",
            color: "#64748b",
            fontSize: "0.8rem",
          }}
        >
          Unfinished seasons are
          excluded from Finish. A
          higher position on the graph
          represents a better finish.
        </p>
      )}
    </section>
  );
}

export default LeagueHistoryChart;