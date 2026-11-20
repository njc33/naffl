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

  const [sortDirection, setSortDirection] =
    useState("desc");

  useEffect(() => {
    fetch("/data/roster-history.json")
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
            : data[0]?.ownerId ?? "";

        setOwnerId(initialOwnerId);

        const ownerSeasons = data
          .filter(
            (record) =>
              record.ownerId ===
              initialOwnerId
          )
          .map(
            (record) =>
              Number(record.season)
          );

        if (ownerSeasons.length > 0) {
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
    const ownerMap = new Map();

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
          ownerId: mappedOwnerId,
          ownerName,
        })
      )
      .sort((ownerA, ownerB) =>
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
      ].sort((a, b) => b - a);
    }, [rosters, ownerId]);

  const selectedRoster =
    useMemo(() => {
      return rosters.filter(
        (record) =>
          record.ownerId ===
            ownerId &&
          Number(record.season) ===
            Number(season)
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
    selectedRoster[0]?.teamName ??
    "";

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
            Number(record.season)
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
    }

    setSortField("totalPoints");
    setSortDirection("desc");
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
      "totalPoints",
      "averagePoints",
      "projectedTotalPoints",
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
      valueA === null ||
      valueA === undefined
    ) {
      return 1;
    }

    if (
      valueB === null ||
      valueB === undefined
    ) {
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

  const sortedRoster = [
    ...selectedRoster,
  ].sort((playerA, playerB) => {
    const comparison =
      compareValues(
        playerA[sortField],
        playerB[sortField]
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

  const selectedSummary = {
    drafted: selectedRoster.filter(
      (record) =>
        record.acquisitionType ===
        "draft"
    ).length,

    keepers: selectedRoster.filter(
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

    inSeason: selectedRoster.filter(
      (record) =>
        record.acquisitionType ===
        "inSeasonAcquisition"
    ).length,
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
      <h2>Team Roster History</h2>

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
        {selectedOwner?.ownerName ??
          "Owner"}
      </h3>

      {selectedTeamName && (
        <p>
          <strong>Team:</strong>{" "}
          {selectedTeamName}
        </p>
      )}

      <p>
        <strong>
          Rostered Players:
        </strong>{" "}
        {selectedRoster.length}
      </p>

      <p>
        <strong>Drafted:</strong>{" "}
        {selectedSummary.drafted}
        {" | "}
        <strong>Keepers:</strong>{" "}
        {selectedSummary.keepers}
        {" | "}
        <strong>
          Drafted by Another Owner:
        </strong>{" "}
        {selectedSummary.differentOwner}
        {" | "}
        <strong>
          Undrafted/In-Season:
        </strong>{" "}
        {selectedSummary.inSeason}
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
                handleSort("player")
              }
              style={
                sortableHeaderStyle
              }
            >
              Player
              {sortIndicator("player")}
            </th>

            <th
              onClick={() =>
                handleSort("position")
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
                handleSort("nflTeam")
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
                  "averagePoints"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Avg. Points
              {sortIndicator(
                "averagePoints"
              )}
            </th>

            <th
              onClick={() =>
                handleSort(
                  "projectedTotalPoints"
                )
              }
              style={
                sortableHeaderStyle
              }
            >
              Projected Total
              {sortIndicator(
                "projectedTotalPoints"
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
            (player) => (
              <tr
                key={`${player.season}-${player.ownerId}-${player.playerId}-${player.player}`}
              >
                <td style={cellStyle}>
                  {player.player}
                </td>

                <td style={cellStyle}>
                  {player.position}
                </td>

                <td style={cellStyle}>
                  {player.nflTeam}
                </td>

                <td style={cellStyle}>
                  {formatPoints(
                    player.totalPoints
                  )}
                </td>

                <td style={cellStyle}>
                  {formatPoints(
                    player.averagePoints
                  )}
                </td>

                <td style={cellStyle}>
                  {formatPoints(
                    player.projectedTotalPoints
                  )}
                </td>

                <td style={cellStyle}>
                  {player.howAcquired}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {selectedRoster.length === 0 && (
        <p>
          No roster records were found
          for this owner and season.
        </p>
      )}

      <p
        style={{
          marginTop: "14px",
          color: "#64748b",
          fontSize: "0.8rem",
        }}
      >
        Version 1 uses draft history.
        “Drafted by another owner”
        means the player finished the
        season on this roster but was
        originally drafted by someone
        else. That could represent a
        trade, waiver claim, or another
        in-season transaction.
      </p>
    </div>
  );
}

export default TeamRosterHistory;