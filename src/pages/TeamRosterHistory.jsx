import {
  useEffect,
  useMemo,
  useState,
} from "react";


function TeamRosterHistory() {
  const [rosters, setRosters] =
    useState([]);

  const [ownerId, setOwnerId] =
    useState("nick-ceraso");

  const [season, setSeason] =
    useState("");

  const [sortField, setSortField] =
    useState("totalPoints");

  const [
    sortDirection,
    setSortDirection,
  ] = useState("desc");


  useEffect(() => {
    fetch(
      "/data/roster-history.json"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load roster history."
          );
        }

        return response.json();
      })
      .then((data) => {
        setRosters(data);

        const defaultOwnerExists =
          data.some(
            (record) =>
              record.ownerId ===
              "nick-ceraso"
          );

        const initialOwnerId =
          defaultOwnerExists
            ? "nick-ceraso"
            : data[0]?.ownerId ??
              "";

        setOwnerId(initialOwnerId);

        const ownerSeasons =
          data
            .filter(
              (record) =>
                record.ownerId ===
                initialOwnerId
            )
            .map(
              (record) =>
                Number(
                  record.season
                )
            );

        if (
          ownerSeasons.length > 0
        ) {
          setSeason(
            String(
              Math.max(
                ...ownerSeasons
              )
            )
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);


  const owners = useMemo(() => {
    const ownerMap =
      new Map();

    rosters.forEach((record) => {
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
          ownerId:
            mappedOwnerId,

          ownerName,
        })
      )
      .sort(
        (
          ownerA,
          ownerB,
        ) =>
          ownerA.ownerName.localeCompare(
            ownerB.ownerName
          )
      );
  }, [rosters]);


  const availableSeasons =
    useMemo(() => {
      return [
        ...new Set(
          rosters
            .filter(
              (record) =>
                record.ownerId ===
                ownerId
            )
            .map(
              (record) =>
                Number(
                  record.season
                )
            )
        ),
      ].sort(
        (seasonA, seasonB) =>
          seasonB - seasonA
      );
    }, [
      rosters,
      ownerId,
    ]);


  const selectedRoster =
    useMemo(() => {
      return rosters.filter(
        (record) =>
          record.ownerId ===
            ownerId &&
          Number(
            record.season
          ) === Number(season)
      );
    }, [
      rosters,
      ownerId,
      season,
    ]);


  const selectedOwner =
    owners.find(
      (owner) =>
        owner.ownerId === ownerId
    );


  const selectedTeamName =
    selectedRoster[0]
      ?.teamName ?? "";


  const handleOwnerChange = (
    event
  ) => {
    const newOwnerId =
      event.target.value;

    setOwnerId(newOwnerId);

    const newOwnerSeasons =
      rosters
        .filter(
          (record) =>
            record.ownerId ===
            newOwnerId
        )
        .map(
          (record) =>
            Number(
              record.season
            )
        );

    if (
      newOwnerSeasons.length > 0
    ) {
      setSeason(
        String(
          Math.max(
            ...newOwnerSeasons
          )
        )
      );
    } else {
      setSeason("");
    }

    setSortField(
      "totalPoints"
    );

    setSortDirection("desc");
  };


  const handleSort = (
    field
  ) => {
    if (field === sortField) {
      setSortDirection(
        (
          currentDirection
        ) =>
          currentDirection ===
          "asc"
            ? "desc"
            : "asc"
      );

      return;
    }

    setSortField(field);

    const descendingFields = [
      "totalPoints",
      "netPointsVsRoundAverage",
      "pointsAboveProjected",
    ];

    setSortDirection(
      descendingFields.includes(
        field
      )
        ? "desc"
        : "asc"
    );
  };


  const compareValues = (
    valueA,
    valueB
  ) => {
    if (
      typeof valueA ===
        "string" ||
      typeof valueB ===
        "string"
    ) {
      return String(
        valueA ?? ""
      ).localeCompare(
        String(
          valueB ?? ""
        ),
        undefined,
        {
          sensitivity: "base",
        }
      );
    }

    return (
      Number(valueA) -
      Number(valueB)
    );
  };


  const sortedRoster = [
    ...selectedRoster,
  ].sort(
    (
      playerA,
      playerB,
    ) => {
      const valueA =
        playerA[sortField];

      const valueB =
        playerB[sortField];

      const valueAIsMissing =
        valueA === null ||
        valueA === undefined;

      const valueBIsMissing =
        valueB === null ||
        valueB === undefined;

      /*
        Missing values remain at
        the bottom regardless of
        sorting direction.
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

      return (
        sortDirection ===
        "asc"
          ? comparison
          : -comparison
      );
    }
  );


  const sortIndicator = (
    field
  ) => {
    if (sortField !== field) {
      return "";
    }

    return (
      sortDirection === "asc"
        ? " ▲"
        : " ▼"
    );
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


  const formatSignedPoints = (
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


  const getSignedColor = (
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


  const selectedSummary = {
    drafted:
      selectedRoster.filter(
        (record) =>
          record.acquisitionType ===
          "draft"
      ).length,

    keepers:
      selectedRoster.filter(
        (record) =>
          record.acquisitionType ===
          "keeper"
      ).length,

    differentOwner:
      selectedRoster.filter(
        (record) =>
          record.acquisitionType ===
          "differentDraftOwner"
      ).length,

    inSeason:
      selectedRoster.filter(
        (record) =>
          record.acquisitionType ===
          "inSeasonAcquisition"
      ).length,
  };


  const totalPoints =
    selectedRoster.reduce(
      (sum, record) =>
        sum +
        Number(
          record.totalPoints ??
          0
        ),
      0
    );


  const totalNetValue =
    selectedRoster.reduce(
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


  const totalAboveProjected =
    selectedRoster.reduce(
      (summary, record) => {
        const value =
          record
            .pointsAboveProjected;

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


  const sortableHeaderStyle = {
    cursor: "pointer",
    userSelect: "none",
    padding: "7px 8px",
    fontSize: "0.76rem",
    lineHeight: 1.2,
    textAlign: "left",
    whiteSpace: "nowrap",
  };


  const cellStyle = {
    padding: "7px 8px",
    fontSize: "0.78rem",
    lineHeight: 1.25,
    whiteSpace: "nowrap",
  };


  const numericCellStyle = {
    ...cellStyle,

    textAlign: "right",

    fontVariantNumeric:
      "tabular-nums",
  };


  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
      }}
    >
      <h2>
        Team Roster History
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
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
            {owners.map(
              (owner) => (
                <option
                  key={
                    owner.ownerId
                  }
                  value={
                    owner.ownerId
                  }
                >
                  {owner.ownerName}
                </option>
              )
            )}
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

              setSortField(
                "totalPoints"
              );

              setSortDirection(
                "desc"
              );
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
      </div>

      <h3>
        {selectedOwner
          ?.ownerName ??
          "Owner"}
      </h3>

      {selectedTeamName && (
        <p>
          <strong>
            Team:
          </strong>{" "}
          {selectedTeamName}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 20px",
          alignItems: "center",
        }}
      >
        <p>
          <strong>
            Rostered Players:
          </strong>{" "}
          {
            selectedRoster.length
          }
        </p>

        <p>
          <strong>
            Total Points:
          </strong>{" "}
          {formatPoints(
            totalPoints
          )}
        </p>

        <p>
          <strong>
            Sum Net Pts vs Avg Rd:
          </strong>{" "}

          <span
            style={{
              color:
                getSignedColor(
                  totalNetValue.count >
                    0
                    ? totalNetValue.total
                    : null
                ),

              fontWeight: 700,
            }}
          >
            {formatSignedPoints(
              totalNetValue.count >
                0
                ? totalNetValue.total
                : null
            )}
          </span>
        </p>

        <p>
          <strong>
            Total Pts Above Proj:
          </strong>{" "}

          <span
            style={{
              color:
                getSignedColor(
                  totalAboveProjected
                    .count > 0
                    ? totalAboveProjected
                        .total
                    : null
                ),

              fontWeight: 700,
            }}
          >
            {formatSignedPoints(
              totalAboveProjected
                .count > 0
                ? totalAboveProjected
                    .total
                : null
            )}
          </span>
        </p>
      </div>

      <p
        style={{
          color: "#64748b",
          fontSize: "0.78rem",
        }}
      >
        Drafted:{" "}
        {selectedSummary.drafted}
        {" · "}
        Keepers:{" "}
        {selectedSummary.keepers}
        {" · "}
        Drafted by Another Owner:{" "}
        {
          selectedSummary
            .differentOwner
        }
        {" · "}
        Undrafted/In-Season:{" "}
        {selectedSummary.inSeason}
      </p>

      <div
        style={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling:
            "touch",
        }}
      >
        <table
          style={{
            width: "max-content",
            minWidth: "100%",
            marginTop: "17px",
            borderCollapse:
              "collapse",
          }}
        >
          <thead>
            <tr>

              <th
                onClick={() =>
                  handleSort(
                    "position"
                  )
                }
                style={
                  sortableHeaderStyle
                }
              >
                Pos
                {sortIndicator(
                  "position"
                )}
              </th>
              <th
                onClick={() =>
                  handleSort(
                    "player"
                  )
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
                    "nflTeam"
                  )
                }
                style={
                  sortableHeaderStyle
                }
              >
                NFL Team
                {sortIndicator(
                  "nflTeam"
                )}
              </th>

              <th
                onClick={() =>
                  handleSort(
                    "totalPoints"
                  )
                }
                style={
                  sortableHeaderStyle
                }
              >
                Total Points
                {sortIndicator(
                  "totalPoints"
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
                  "Player points minus the average points for the player's original draft round"
                }
              >
                Net Pts vs Avg Rd
                {sortIndicator(
                  "netPointsVsRoundAverage"
                )}
              </th>

              <th
                onClick={() =>
                  handleSort(
                    "pointsAboveProjected"
                  )
                }
                style={
                  sortableHeaderStyle
                }
                title={
                  "Sum of the player's weekly actual points minus projected points for this owner and season"
                }
              >
                Pts Above Projected
                {sortIndicator(
                  "pointsAboveProjected"
                )}
              </th>

              <th
                onClick={() =>
                  handleSort(
                    "howAcquired"
                  )
                }
                style={
                  sortableHeaderStyle
                }
              >
                How Acquired
                {sortIndicator(
                  "howAcquired"
                )}
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedRoster.map(
              (
                player,
                index,
              ) => (
                <tr
                  key={`${player.season}-${player.ownerId}-${player.playerId}-${player.player}-${index}`}
                >

                  <td
                    style={
                      cellStyle
                    }
                  >
                    {
                      player.position
                    }
                  </td>
                  <td
                    style={
                      cellStyle
                    }
                  >
                    {player.player}
                  </td>

                  <td
                    style={
                      cellStyle
                    }
                  >
                    {player.nflTeam}
                  </td>

                  <td
                    style={
                      numericCellStyle
                    }
                  >
                    {formatPoints(
                      player.totalPoints
                    )}
                  </td>

                  <td
                    style={{
                      ...numericCellStyle,

                      color:
                        getSignedColor(
                          player
                            .netPointsVsRoundAverage
                        ),

                      fontWeight:
                        player
                          .netPointsVsRoundAverage !==
                          null &&
                        player
                          .netPointsVsRoundAverage !==
                          undefined
                          ? 700
                          : undefined,
                    }}
                  >
                    {formatSignedPoints(
                      player
                        .netPointsVsRoundAverage
                    )}
                  </td>

                  <td
                    style={{
                      ...numericCellStyle,

                      color:
                        getSignedColor(
                          player
                            .pointsAboveProjected
                        ),

                      fontWeight:
                        player
                          .pointsAboveProjected !==
                          null &&
                        player
                          .pointsAboveProjected !==
                          undefined
                          ? 700
                          : undefined,
                    }}
                  >
                    {formatSignedPoints(
                      player
                        .pointsAboveProjected
                    )}
                  </td>

                  <td
                    style={
                      cellStyle
                    }
                  >
                    {
                      player.howAcquired
                    }
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {selectedRoster.length ===
        0 && (
        <p>
          No roster records were
          found for this owner and
          season.
        </p>
      )}

      <p
        style={{
          marginTop: "14px",
          color: "#64748b",
          fontSize: "0.76rem",
          lineHeight: 1.45,
        }}
      >
        Net Pts vs Avg Rd uses the
        player’s original draft round,
        even when another owner
        drafted the player. Pts Above
        Projected sums weekly actual
        points minus projected points
        for the player while associated
        with the selected owner during
        that season.
      </p>
    </div>
  );
}

export default TeamRosterHistory;