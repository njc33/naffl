import { useMemo, useState } from "react";

import {
  CartesianGrid,
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
  const numericValue = Number(number);

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


function CustomTooltip({
  active,
  payload,
  label,
  metric,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const value =
    payload[0]?.value;

  const formattedValue =
    metric.field === "finalStanding"
      ? getOrdinal(value)
      : formatNumber(
          value,
          metric.decimals
        );

  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        boxShadow:
          "0 4px 12px rgba(15, 23, 42, 0.12)",
      }}
    >
      <div
        style={{
          marginBottom: "4px",
          color: "#475569",
          fontSize: "0.8rem",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: metric.color,
          fontSize: "0.9rem",
          fontWeight: 700,
        }}
      >
        {metric.label}:{" "}
        {formattedValue}
      </div>
    </div>
  );
}


function OwnerHistoryChart({
  ownerTeams,
  ownerName,
}) {
  const [metricKey, setMetricKey] =
    useState("pointsFor");

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
      .map((team) => ({
        season: Number(
          team.season
        ),

        value: Number(
          team[metric.field] || 0
        ),

        teamName:
          team.teamName,
      }));
  }, [
    ownerTeams,
    metric.field,
  ]);

  const finishValues =
    chartData.map(
      (record) =>
        Number(record.value)
    );

  const finishMaximum =
    finishValues.length > 0
      ? Math.max(
          ...finishValues
        )
      : 10;

  const finishDomain =
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

    return value;
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
          height: "360px",
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
                metric.decimals > 0
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
                />
              }
            />

            <Line
              type="monotone"
              dataKey="value"
              name={metric.label}
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
          the graph represents a
          better finish.
        </p>
      )}
    </section>
  );
}

export default OwnerHistoryChart;