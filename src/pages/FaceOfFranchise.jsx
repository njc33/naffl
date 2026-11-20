import {
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
          !defaultOwnerExists
          && data.length > 0
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


  const ownerRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.ownerId === ownerId
      ),
    [records, ownerId]
  );


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
    if (
      valueA === null
      || valueA === undefined
    ) {
      return 1;
    }

    if (
      valueB === null
      || valueB === undefined
    ) {
      return -1;
    }

    if (
      typeof valueA === "string"
      || typeof valueB === "string"
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
      Number(valueA)
      - Number(valueB)
    );
  };


  const sortedRecords = [
    ...ownerRecords,
  ].sort((recordA, recordB) => {
    const comparison =
      compareValues(
        recordA[sortField],
        recordB[sortField]
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


  const getOrdinal = (number) => {
    const numericValue =
      Number(number);

    const lastTwoDigits =
      numericValue % 100;

    if (
      lastTwoDigits >= 11
      && lastTwoDigits <= 13
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
      !years
      || years.length === 0
    ) {
      return "N/A";
    }

    return years.join(", ");
  };


  const totalOwnerPoints =
    ownerRecords.reduce(
      (sum, record) =>
        sum
        + Number(
          record.points || 0
        ),
      0
    );


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
          }}
        >
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
        {selectedOwner?.ownerName
          ?? "Owner"}
      </h3>

      <p>
        <strong>
          Players with Points:
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
              style={{
                textAlign: "left",
                paddingRight: "16px",
                paddingBottom: "8px",
              }}
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
            (record) => (
              <tr
                key={`${record.ownerId}-${record.player}`}
              >
                <td style={cellStyle}>
                  {getOrdinal(
                    record.ownerRank
                  )}
                </td>

                <td style={cellStyle}>
                  {record.player}
                </td>

                <td style={cellStyle}>
                  {formatPoints(
                    record.points
                  )}
                </td>

                <td style={cellStyle}>
                  {formatYears(
                    record.years
                  )}
                </td>

                <td style={cellStyle}>
                  {record.yearCount}
                </td>

                <td style={cellStyle}>
                  {getOrdinal(
                    record.allTimeRank
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {ownerRecords.length === 0 && (
        <p>
          No player point records
          were found for this owner.
        </p>
      )}

      <p
        style={{
          marginTop: "14px",
          color: "#64748b",
          fontSize: "0.8rem",
        }}
      >
        All-Time Rank compares every
        player-owner points combination
        in league history. A player may
        therefore appear more than once
        in the all-time rankings if he
        scored points for multiple
        owners.
      </p>
    </div>
  );
}

export default FaceOfFranchise;