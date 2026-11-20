import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";


function FaceOfFranchise() {
  const [records, setRecords] =
    useState([]);

  const [ownerId, setOwnerId] =
    useState("nick-ceraso");

  const [sortField, setSortField] =
    useState("points");

  const [sortDirection, setSortDirection] =
    useState("desc");

  const [
    hoveredRecordKey,
    setHoveredRecordKey,
  ] = useState(null);

  const [
    expandedRecordKey,
    setExpandedRecordKey,
  ] = useState(null);


  useEffect(() => {
    fetch(
      "/data/face-of-franchise.json"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load Face of the Franchise data."
          );
        }

        return response.json();
      })
      .then((data) => {
        setRecords(data);

        const defaultOwnerExists =
          data.some(
            (record) =>
              record.ownerId ===
              "nick-ceraso"
          );

        if (
          !defaultOwnerExists &&
          data.length > 0
        ) {
          setOwnerId(
            data[0].ownerId
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);


  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (event.key === "Escape") {
        setExpandedRecordKey(
          null
        );

        setHoveredRecordKey(
          null
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);


  const owners = useMemo(() => {
    const ownerMap = new Map();

    records.forEach((record) => {
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
  }, [records]);


  const ownerRecords = useMemo(() => {
    if (ownerId === "all") {
      return records;
    }

    return records.filter(
      (record) =>
        record.ownerId === ownerId
    );
  }, [records, ownerId]);


  const latestSeason = useMemo(() => {
    const allYears = records.flatMap(
      (record) =>
        Array.isArray(record.years)
          ? record.years.map(Number)
          : []
    );

    return allYears.length > 0
      ? Math.max(...allYears)
      : null;
  }, [records]);


  const selectedOwner =
    owners.find(
      (owner) =>
        owner.ownerId === ownerId
    );


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
      "sumNetPoints",
      "yearCount",
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
    const valueAIsMissing =
      valueA === null ||
      valueA === undefined;

    const valueBIsMissing =
      valueB === null ||
      valueB === undefined;

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

    if (
      typeof valueA === "string" ||
      typeof valueB === "string"
    ) {
      return String(
        valueA
      ).localeCompare(
        String(valueB),
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


  const sortedRecords = [
    ...ownerRecords,
  ].sort((recordA, recordB) => {
    const valueA =
      recordA[sortField];

    const valueB =
      recordB[sortField];

    const valueAIsMissing =
      valueA === null ||
      valueA === undefined;

    const valueBIsMissing =
      valueB === null ||
      valueB === undefined;

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


  const formatNetPoints = (
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


  const getOrdinal = (number) => {
    const numericValue =
      Number(number);

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
  };


  const formatYears = (years) => {
    if (
      !years ||
      years.length === 0
    ) {
      return "N/A";
    }

    const sortedYears = [
      ...new Set(
        years.map(Number)
      ),
    ].sort((a, b) => a - b);

    const ranges = [];

    let rangeStart =
      sortedYears[0];

    let previousYear =
      sortedYears[0];

    for (
      let index = 1;
      index < sortedYears.length;
      index += 1
    ) {
      const currentYear =
        sortedYears[index];

      if (
        currentYear ===
        previousYear + 1
      ) {
        previousYear =
          currentYear;

        continue;
      }

      ranges.push(
        rangeStart === previousYear
          ? `${rangeStart}`
          : `${rangeStart}-${previousYear}`
      );

      rangeStart = currentYear;
      previousYear = currentYear;
    }

    ranges.push(
      rangeStart === previousYear
        ? `${rangeStart}`
        : `${rangeStart}-${previousYear}`
    );

    return ranges.join(", ");
  };


  const totalOwnerPoints =
    ownerRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.points || 0
        ),
      0
    );


  const activePlayerCount =
    ownerRecords.filter(
      (record) =>
        latestSeason !== null &&
        Array.isArray(
          record.years
        ) &&
        record.years
          .map(Number)
          .includes(latestSeason)
    ).length;


  const sortableHeaderStyle = {
    cursor: "pointer",
    userSelect: "none",
    textAlign: "left",
    paddingRight: "16px",
    paddingBottom: "8px",
  };


  const standardHeaderStyle = {
    textAlign: "left",
    paddingRight: "16px",
    paddingBottom: "8px",
  };


  const cellStyle = {
    paddingRight: "16px",
    paddingBottom: "6px",
  };


  const visibleColumnCount =
    ownerId === "all"
      ? 8
      : 7;


  return (
    <div>
      <h2>
        Face of the Franchise
      </h2>

      <label>
        Owner:{" "}
        <select
          value={ownerId}
          onChange={(event) => {
            setOwnerId(
              event.target.value
            );

            setSortField("points");
            setSortDirection("desc");
            setExpandedRecordKey(
              null
            );
            setHoveredRecordKey(
              null
            );
          }}
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

      <h3>
        {ownerId === "all"
          ? "All Owners"
          : selectedOwner?.ownerName ??
            "Owner"}
      </h3>

      <p>
        <strong>
          Player-Owner Records:
        </strong>{" "}
        {ownerRecords.length}
      </p>

      <p>
        <strong>
          Total Player Points:
        </strong>{" "}
        {formatPoints(
          totalOwnerPoints
        )}
      </p>

      <p>
        <strong>
          Active Players:
        </strong>{" "}
        {activePlayerCount}
      </p>

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
                  "ownerRank"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Franchise Rank
              {sortIndicator(
                "ownerRank"
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

            {ownerId === "all" && (
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
            )}

            <th
              onClick={() =>
                handleSort("points")
              }
              style={
                sortableHeaderStyle
              }
            >
              Points
              {sortIndicator(
                "points"
              )}
            </th>

            <th
              onClick={() =>
                handleSort(
                  "sumNetPoints"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Sum Net Pts
              {sortIndicator(
                "sumNetPoints"
              )}
            </th>

            <th
              style={
                standardHeaderStyle
              }
            >
              Seasons
            </th>

            <th
              onClick={() =>
                handleSort(
                  "yearCount"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Season Count
              {sortIndicator(
                "yearCount"
              )}
            </th>

            <th
              onClick={() =>
                handleSort(
                  "allTimeRank"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              All-Time Rank
              {sortIndicator(
                "allTimeRank"
              )}
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedRecords.map(
            (record) => {
              const recordKey =
                `${record.ownerId}-${record.player}`;

              const isActive =
                latestSeason !== null &&
                Array.isArray(
                  record.years
                ) &&
                record.years
                  .map(Number)
                  .includes(
                    latestSeason
                  );

              const isExpanded =
                expandedRecordKey ===
                  recordKey ||
                (
                  expandedRecordKey ===
                    null &&
                  hoveredRecordKey ===
                    recordKey
                );

              const seasonDetails =
                Array.isArray(
                  record.seasonDetails
                )
                  ? record.seasonDetails
                  : [];

              return (
                <Fragment
                  key={recordKey}
                >
                  <tr
                    onMouseEnter={() =>
                      setHoveredRecordKey(
                        recordKey
                      )
                    }
                    onMouseLeave={() =>
                      setHoveredRecordKey(
                        null
                      )
                    }
                    style={
                      isActive
                        ? {
                            backgroundColor:
                              "#f4f5f7",
                            fontWeight:
                              700,
                          }
                        : undefined
                    }
                  >
                    <td
                      style={cellStyle}
                    >
                      {getOrdinal(
                        record.ownerRank
                      )}
                    </td>

                    <td
                      style={cellStyle}
                    >
                      <button
                        type="button"
                        aria-expanded={
                          isExpanded
                        }
                        aria-controls={
                          `history-${recordKey}`
                        }
                        onFocus={() =>
                          setHoveredRecordKey(
                            recordKey
                          )
                        }
                        onBlur={() =>
                          setHoveredRecordKey(
                            null
                          )
                        }
                        onClick={() =>
                          setExpandedRecordKey(
                            (
                              currentKey
                            ) =>
                              currentKey ===
                              recordKey
                                ? null
                                : recordKey
                          )
                        }
                        style={{
                          padding: 0,
                          border: "none",
                          borderBottom:
                            "1px dotted currentColor",
                          background:
                            "transparent",
                          color: "#17365d",
                          font: "inherit",
                          fontWeight:
                            "inherit",
                          textAlign:
                            "left",
                          cursor:
                            "pointer",
                        }}
                      >
                        {record.player}
                      </button>
                    </td>

                    {ownerId ===
                      "all" && (
                      <td
                        style={cellStyle}
                      >
                        {
                          record.ownerName
                        }
                      </td>
                    )}

                    <td
                      style={cellStyle}
                    >
                      {formatPoints(
                        record.points
                      )}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        color:
                          getNetPointsColor(
                            record
                              .sumNetPoints
                          ),
                        fontWeight:
                          record
                            .sumNetPoints !==
                            null &&
                          record
                            .sumNetPoints !==
                            undefined
                            ? 700
                            : undefined,
                      }}
                    >
                      {formatNetPoints(
                        record
                          .sumNetPoints
                      )}
                    </td>

                    <td
                      style={cellStyle}
                    >
                      {formatYears(
                        record.years
                      )}
                    </td>

                    <td
                      style={cellStyle}
                    >
                      {record.yearCount}
                    </td>

                    <td
                      style={cellStyle}
                    >
                      {getOrdinal(
                        record.allTimeRank
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr
                      id={
                        `history-${recordKey}`
                      }
                    >
                      <td
                        colSpan={
                          visibleColumnCount
                        }
                        style={{
                          padding:
                            "10px 14px 14px",
                          borderBottom:
                            "1px solid #cbd5e1",
                          backgroundColor:
                            "#f8fafc",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "12px",
                            marginBottom:
                              "8px",
                          }}
                        >
                          <strong
                            style={{
                              color:
                                "#172b43",
                              fontSize:
                                "0.88rem",
                            }}
                          >
                            {
                              record.player
                            }{" "}
                            season history
                          </strong>

                          {expandedRecordKey ===
                            recordKey && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRecordKey(
                                  null
                                )
                              }
                              style={{
                                padding:
                                  "4px 8px",
                                border:
                                  "1px solid #cbd5e1",
                                borderRadius:
                                  "5px",
                                backgroundColor:
                                  "#ffffff",
                                color:
                                  "#334155",
                                fontSize:
                                  "0.72rem",
                                cursor:
                                  "pointer",
                              }}
                            >
                              Close
                            </button>
                          )}
                        </div>

                        {seasonDetails.length >
                        0 ? (
                          <div
                            style={{
                              overflowX:
                                "auto",
                              WebkitOverflowScrolling:
                                "touch",
                            }}
                          >
                            <table
                              style={{
                                width:
                                  "max-content",
                                minWidth:
                                  "100%",
                                borderCollapse:
                                  "collapse",
                              }}
                            >
                              <thead>
                                <tr>
                                  <th>
                                    Year
                                  </th>

                                  <th>
                                    Rd
                                  </th>

                                  <th>
                                    Pick
                                  </th>

                                  <th>
                                    Pts
                                  </th>

                                  <th>
                                    Net Pts
                                  </th>

                                  <th>
                                    Kpr
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {seasonDetails.map(
                                  (
                                    detail,
                                    index
                                  ) => (
                                    <tr
                                      key={`${recordKey}-${detail.season}-${detail.round}-${detail.pick}-${index}`}
                                    >
                                      <td>
                                        {
                                          detail.season
                                        }
                                      </td>

                                      <td>
                                        {detail.round ??
                                          "N/A"}
                                      </td>

                                      <td>
                                        {detail.pick ??
                                          "N/A"}
                                      </td>

                                      <td>
                                        {formatPoints(
                                          detail.points
                                        )}
                                      </td>

                                      <td
                                        style={{
                                          color:
                                            getNetPointsColor(
                                              detail.netPoints
                                            ),
                                          fontWeight:
                                            detail.netPoints !==
                                              null &&
                                            detail.netPoints !==
                                              undefined
                                              ? 700
                                              : undefined,
                                        }}
                                      >
                                        {formatNetPoints(
                                          detail.netPoints
                                        )}
                                      </td>

                                      <td>
                                        {detail.keeper
                                          ? "Y"
                                          : ""}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              color:
                                "#64748b",
                              fontSize:
                                "0.8rem",
                            }}
                          >
                            No
                            season-level
                            details were
                            found.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            }
          )}
        </tbody>
      </table>

      <p
        style={{
          marginTop: "14px",
          color: "#64748b",
          fontSize: "0.8rem",
        }}
      >
        Hover over a player on desktop
        or tap a player on mobile to
        view season-level draft and
        point details. Tap again, use
        Close, or press Escape to
        dismiss a pinned panel.
      </p>
    </div>
  );
}

export default FaceOfFranchise;