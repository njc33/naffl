import {
  useEffect,
  useMemo,
  useState,
} from "react";

function DraftHistory() {
  const [draftPicks, setDraftPicks] =
    useState([]);

  const [ownerId, setOwnerId] =
    useState("all");

  const [season, setSeason] =
    useState("all");

  const [sortField, setSortField] =
    useState("pick");

  const [sortDirection, setSortDirection] =
    useState("asc");

  useEffect(() => {
    fetch("/data/draft-history.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load draft history."
          );
        }

        return response.json();
      })
      .then((data) => {
        setDraftPicks(data);

        const seasons = data.map(
          (record) =>
            Number(record.season)
        );

        if (seasons.length > 0) {
          setSeason(
            String(
              Math.max(...seasons)
            )
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const owners = useMemo(() => {
    const ownerMap = new Map();

    draftPicks.forEach((record) => {
      if (
        !ownerMap.has(
          record.ownerId
        )
      ) {
        ownerMap.set(
          record.ownerId,
          record.ownerName
        );
      }
    });

    return Array.from(
      ownerMap.entries()
    )
      .map(
        ([
          mappedOwnerId,
          ownerName,
        ]) => ({
          ownerId: mappedOwnerId,
          ownerName,
        })
      )
      .sort((ownerA, ownerB) =>
        ownerA.ownerName.localeCompare(
          ownerB.ownerName
        )
      );
  }, [draftPicks]);

  const availableSeasons =
    useMemo(() => {
      const relevantRecords =
        ownerId === "all"
          ? draftPicks
          : draftPicks.filter(
              (record) =>
                record.ownerId ===
                ownerId
            );

      return [
        ...new Set(
          relevantRecords.map(
            (record) =>
              Number(record.season)
          )
        ),
      ].sort((a, b) => b - a);
    }, [draftPicks, ownerId]);

  const filteredDraftPicks =
    useMemo(() => {
      return draftPicks.filter(
        (record) => {
          const ownerMatches =
            ownerId === "all" ||
            record.ownerId ===
              ownerId;

          const seasonMatches =
            season === "all" ||
            Number(record.season) ===
              Number(season);

          return (
            ownerMatches &&
            seasonMatches
          );
        }
      );
    }, [
      draftPicks,
      ownerId,
      season,
    ]);

  const handleOwnerChange = (
    event
  ) => {
    const newOwnerId =
      event.target.value;

    setOwnerId(newOwnerId);

    const relevantRecords =
      newOwnerId === "all"
        ? draftPicks
        : draftPicks.filter(
            (record) =>
              record.ownerId ===
              newOwnerId
          );

    const relevantSeasons =
      relevantRecords.map(
        (record) =>
          Number(record.season)
      );

    if (
      relevantSeasons.length > 0
    ) {
      setSeason(
        String(
          Math.max(
            ...relevantSeasons
          )
        )
      );
    } else {
      setSeason("all");
    }

    setSortField("pick");
    setSortDirection("asc");
  };

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
      "points",
      "netPointsVsRoundAverage",
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

  const sortedDraftPicks = [
    ...filteredDraftPicks,
  ].sort((pickA, pickB) => {
    const valueA =
      pickA[sortField];

    const valueB =
      pickB[sortField];

    const valueAIsMissing =
      valueA === null ||
      valueA === undefined;

    const valueBIsMissing =
      valueB === null ||
      valueB === undefined;

    /*
      Missing values remain at the
      bottom in either direction.
    */
    if (
      valueAIsMissing &&
      valueBIsMissing
    ) {
      return 0;
    }

    if (valueAIsMissing) {
      return 1;
    }

    if (valueBIsMissing) {
      return -1;
    }

    const comparison =
      compareValues(
        valueA,
        valueB
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

  const formatPoints = (points) => {
    if (
      points === null ||
      points === undefined
    ) {
      return "N/A";
    }

    return Number(
      points
    ).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  const formatNetPoints = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "N/A";
    }

    const numericValue =
      Number(value);

    const formattedValue =
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
      return `+${formattedValue}`;
    }

    if (numericValue < 0) {
      return `-${formattedValue}`;
    }

    return "0.00";
  };

  const selectedOwner =
    owners.find(
      (owner) =>
        owner.ownerId === ownerId
    );

  const selectedTeamNames = [
    ...new Set(
      filteredDraftPicks
        .map(
          (record) =>
            record.teamName
        )
        .filter(Boolean)
    ),
  ];

  const keeperCount =
    filteredDraftPicks.filter(
      (record) =>
        record.keeper === true
    ).length;

  const averageNetPoints =
    filteredDraftPicks.reduce(
      (summary, record) => {
        const value =
          record
            .netPointsVsRoundAverage;

        if (
          value === null ||
          value === undefined
        ) {
          return summary;
        }

        return {
          total:
            summary.total +
            Number(value),

          count:
            summary.count + 1,
        };
      },
      {
        total: 0,
        count: 0,
      }
    );

  const selectedAverageNetPoints =
    averageNetPoints.count > 0
      ? averageNetPoints.total /
        averageNetPoints.count
      : null;

  const getNetPointsColor = (
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return undefined;
    }

    const numericValue =
      Number(value);

    if (numericValue > 0) {
      return "#15803d";
    }

    if (numericValue < 0) {
      return "#b91c1c";
    }

    return undefined;
  };

  const sortableHeaderStyle = {
    cursor: "pointer",
    userSelect: "none",
    textAlign: "left",
    padding: "7px 7px",
    fontSize: "0.76rem",
    lineHeight: 1.15,
    whiteSpace: "nowrap",
  };

  const cellStyle = {
    padding: "6px 7px",
    fontSize: "0.78rem",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };

  const numericCellStyle = {
    ...cellStyle,
    textAlign: "right",
    fontVariantNumeric:
      "tabular-nums",
  };

  const compactTableStyle = {
    marginTop: "16px",
    borderCollapse: "collapse",
    width: "max-content",
    minWidth: "100%",
  };

  return (
    <div>
      <h2>Draft History</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <label>
          Owner:{" "}
          <select
            value={ownerId}
            onChange={
              handleOwnerChange
            }
          >
            <option value="all">
              All Owners
            </option>

            {owners.map((owner) => (
              <option
                key={owner.ownerId}
                value={owner.ownerId}
              >
                {owner.ownerName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Season:{" "}
          <select
            value={season}
            onChange={(event) => {
              setSeason(
                event.target.value
              );

              setSortField("pick");
              setSortDirection("asc");
            }}
          >
            <option value="all">
              All Seasons
            </option>

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
      </div>

      <h3>
        {selectedOwner?.ownerName ??
          "All Owners"}
      </h3>

      {selectedTeamNames.length ===
        1 && (
        <p>
          <strong>Team:</strong>{" "}
          {selectedTeamNames[0]}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: "18px",
          rowGap: "2px",
          marginBottom: "4px",
        }}
      >
        <p>
          <strong>
            Draft Records:
          </strong>{" "}
          {filteredDraftPicks.length}
        </p>

        <p>
          <strong>Keepers:</strong>{" "}
          {keeperCount}
        </p>

        <p>
          <strong>
            Avg. Net vs Rd:
          </strong>{" "}
          {formatNetPoints(
            selectedAverageNetPoints
          )}
        </p>
      </div>

      <table
        style={compactTableStyle}
      >
        <thead>
          <tr>
            <th
              onClick={() =>
                handleSort("season")
              }
              style={
                sortableHeaderStyle
              }
              title="Season"
            >
              Yr
              {sortIndicator(
                "season"
              )}
            </th>

            <th
              onClick={() =>
                handleSort("round")
              }
              style={
                sortableHeaderStyle
              }
              title="Draft Round"
            >
              Rd
              {sortIndicator(
                "round"
              )}
            </th>

            <th
              onClick={() =>
                handleSort("pick")
              }
              style={
                sortableHeaderStyle
              }
              title="Overall Pick"
            >
              Pick
              {sortIndicator("pick")}
            </th>

            <th
              onClick={() =>
                handleSort("points")
              }
              style={
                sortableHeaderStyle
              }
              title="Season Points"
            >
              Pts
              {sortIndicator(
                "points"
              )}
            </th>

            <th
              onClick={() =>
                handleSort(
                  "netPointsVsRoundAverage"
                )
              }
              style={
                sortableHeaderStyle
              }
              title={
                "Net Points Versus Draft Round Average"
              }
            >
              Net vs Rd Avg
              {sortIndicator(
                "netPointsVsRoundAverage"
              )}
            </th>

            <th
              onClick={() =>
                handleSort("player")
              }
              style={
                sortableHeaderStyle
              }
            >
              Player
              {sortIndicator(
                "player"
              )}
            </th>

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
                handleSort("teamName")
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
                handleSort("keeper")
              }
              style={
                sortableHeaderStyle
              }
            >
              Kpr
              {sortIndicator(
                "keeper"
              )}
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedDraftPicks.map(
            (record, index) => (
              <tr
                key={`${record.season}-${record.ownerId}-${record.round}-${record.pick}-${record.playerId}-${index}`}
              >
                <td
                  style={
                    numericCellStyle
                  }
                >
                  {record.season}
                </td>

                <td
                  style={
                    numericCellStyle
                  }
                >
                  {record.round}
                </td>

                <td
                  style={
                    numericCellStyle
                  }
                >
                  {record.pick}
                </td>

                <td
                  style={
                    numericCellStyle
                  }
                >
                  {formatPoints(
                    record.points
                  )}
                </td>

                <td
                  style={{
                    ...numericCellStyle,

                    color:
                      getNetPointsColor(
                        record
                          .netPointsVsRoundAverage
                      ),

                    fontWeight:
                      record
                        .netPointsVsRoundAverage !==
                        null &&
                      record
                        .netPointsVsRoundAverage !==
                        undefined
                        ? 600
                        : undefined,
                  }}
                >
                  {formatNetPoints(
                    record
                      .netPointsVsRoundAverage
                  )}
                </td>

                <td style={cellStyle}>
                  {record.player}
                </td>

                <td style={cellStyle}>
                  {record.ownerName}
                </td>

                <td
                  style={{
                    ...cellStyle,
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                  }}
                  title={
                    record.teamName
                  }
                >
                  {record.teamName}
                </td>

                <td
                  style={{
                    ...cellStyle,
                    textAlign: "center",
                  }}
                >
                  {record.keeper
                    ? "Y"
                    : ""}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {filteredDraftPicks.length ===
        0 && (
        <p>
          No draft records were found
          for these filters.
        </p>
      )}

      <p
        style={{
          marginTop: "10px",
          color: "#64748b",
          fontSize: "0.75rem",
        }}
      >
        Hover over a shortened team
        name to view the complete name.
        Kpr indicates a keeper.
      </p>
    </div>
  );
}

export default DraftHistory;