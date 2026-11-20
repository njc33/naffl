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
    color: "#15803d",
    decimals: 0,
  },

  losses: {
    label: "Losses",
    field: "losses",
    color: "#b91c1c",
    decimals: 0,
  },

  pointsFor: {
    label: "Points For",
    field: "pointsFor",
    color: "#17365d",
    decimals: 2,
  },

  pointsAgainst: {
    label: "Points Against",
    field: "pointsAgainst",
    color: "#9333ea",
    decimals: 2,
  },

  finalStanding: {
    label: "Finish",
    field: "finalStanding",
    color: "#c2410c",
    decimals: 0,
  },
};


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
    Number(number);

  const roundedValue =
    Math.round(numericValue);

  const lastTwoDigits =
    roundedValue % 100;

  if (
    lastTwoDigits >= 11 &&
    lastTwoDigits <= 13
  ) {
    return `${roundedValue}th`;
  }

  const lastDigit =
    roundedValue % 10;

  if (lastDigit === 1) {
    return `${roundedValue}st`;
  }

  if (lastDigit === 2) {
    return `${roundedValue}nd`;
  }

  if (lastDigit === 3) {
    return `${roundedValue}rd`;
  }

  return `${roundedValue}th`;
}


function CustomTooltip({
  active,
  payload,
  label,
  metric,
  ownerName,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const ownerEntry =
    payload.find(
      (entry) =>
        entry.dataKey ===
        "ownerValue"
    );

  const averageEntry =
    payload.find(
      (entry) =>
        entry.dataKey ===
        "leagueAverage"
    );

  const formatTooltipValue = (
    value,
    isAverage = false
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "N/A";
    }

    if (
      metric.field ===
      "finalStanding"
    ) {
      if (isAverage) {
        return Number(
          value
        ).toFixed(2);
      }

      return getOrdinal(value);
    }

    const decimals =
      isAverage
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
          marginBottom: "6px",
          color: "#475569",
          fontSize: "0.8rem",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      {ownerEntry && (
        <div
          style={{
            marginBottom: "4px",
            color: metric.color,
            fontSize: "0.9rem",
            fontWeight: 700,
          }}
        >
          {ownerName}:{" "}
          {formatTooltipValue(
            ownerEntry.value
          )}
        </div>
      )}

      {averageEntry && (
        <div
          style={{
            color: "#64748b",
            fontSize: "0.9rem",
            fontWeight: 700,
          }}
        >
          League Average:{" "}
          {formatTooltipValue(
            averageEntry.value,
            true
          )}
        </div>
      )}
    </div>
  );
}


function OwnerHistoryChart({
  ownerTeams,
  ownerName,
}) {
  const [metricKey, setMetricKey] =
    useState("pointsFor");

  const [allTeams, setAllTeams] =
    useState([]);

  useEffect(() => {
    fetch("/data/team-seasons.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load league data for graph averages."
          );
        }

        return response.json();
      })
      .then((data) => {
        setAllTeams(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const metric =
    METRICS[metricKey];

  const chartData = useMemo(() => {
    return [...ownerTeams]
      .sort(
        (teamA, teamB) =>
          Number(teamA.season) -
          Number(teamB.season)
      )
      .filter((team) => {
        if (
          metric.field !==
          "finalStanding"
        ) {
          return true;
        }

        return (
          Number(
            team.finalStanding
          ) > 0
        );
      })
      .map((team) => {
        const season =
          Number(team.season);

        const leagueTeamsForSeason =
          allTeams.filter(
            (leagueTeam) =>
              Number(
                leagueTeam.season
              ) === season
          );

        const validLeagueValues =
          leagueTeamsForSeason
            .map((leagueTeam) =>
              Number(
                leagueTeam[
                  metric.field
                ]
              )
            )
            .filter((value) => {
              if (
                !Number.isFinite(
                  value
                )
              ) {
                return false;
              }

              if (
                metric.field ===
                "finalStanding"
              ) {
                return value > 0;
              }

              return true;
            });

        const leagueAverage =
          validLeagueValues.length > 0
            ? validLeagueValues.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              validLeagueValues.length
            : null;

        return {
          season,

          ownerValue: Number(
            team[metric.field] || 0
          ),

          leagueAverage,

          teamName:
            team.teamName,
        };
      });
  }, [
    ownerTeams,
    allTeams,
    metric.field,
  ]);

  const allChartValues =
    chartData
      .flatMap((record) => [
        record.ownerValue,
        record.leagueAverage,
      ])
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
      ? Math.max(
          ...allChartValues
        )
      : 10;

  const finishDomain =
    metric.field ===
    "finalStanding"
      ? [
          1,
          Math.ceil(
            finishMaximum
          ),
        ]
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

  if (ownerTeams.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: "36px",
        paddingTop: "24px",
        borderTop:
          "1px solid #d7dce3",
      }}
    >
      <h3>
        Season-by-Season Graph
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "18px",
        }}
      >
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
          marginBottom: "14px",
          color: "#536273",
          fontSize: "0.9rem",
        }}
      >
        {ownerName}:{" "}
        {metric.label} by season
      </p>

      <div
        style={{
          width: "100%",
          height: "380px",
          minHeight: "300px",
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
              right: 20,
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
              domain={finishDomain}
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
                <CustomTooltip
                  metric={metric}
                  ownerName={
                    ownerName
                  }
                />
              }
            />

            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              formatter={(value) => {
                if (
                  value ===
                  "Owner"
                ) {
                  return ownerName;
                }

                return value;
              }}
            />

            <Line
              type="monotone"
              dataKey="ownerValue"
              name="Owner"
              stroke={metric.color}
              strokeWidth={3}
              dot={{
                r: 4,
                fill: metric.color,
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
              }}
              connectNulls={false}
            />

            <Line
              type="monotone"
              dataKey="leagueAverage"
              name="League Average"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="7 5"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#64748b",
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {metric.field ===
        "finalStanding" && (
        <p
          style={{
            marginTop: "8px",
            color: "#64748b",
            fontSize: "0.8rem",
          }}
        >
          Unfinished seasons are
          excluded. A higher point on
          the graph represents a better
          finish. The league-average
          line excludes unfinished
          teams.
        </p>
      )}
    </section>
  );
}

export default OwnerHistoryChart;