import {
  useEffect,
  useMemo,
  useState,
} from "react";


function PlayerHistory() {
  const [records, setRecords] =
    useState([]);

  const [searchText, setSearchText] =
    useState("");

  const [
    selectedPlayer,
    setSelectedPlayer,
  ] = useState("");

  const [
    suggestionsVisible,
    setSuggestionsVisible,
  ] = useState(false);

  const [sortField, setSortField] =
    useState("season");

  const [sortDirection, setSortDirection] =
    useState("asc");


  useEffect(() => {
    fetch(
      "/data/player-history.json"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load player history."
          );
        }

        return response.json();
      })
      .then((data) => {
        setRecords(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);


  const players = useMemo(() => {
    return [
      ...new Set(
        records.map(
          (record) =>
            record.player
        )
      ),
    ].sort((playerA, playerB) =>
      playerA.localeCompare(
        playerB,
        undefined,
        {
          sensitivity: "base",
        }
      )
    );
  }, [records]);


  const suggestions = useMemo(() => {
    const normalizedSearch =
      searchText
        .trim()
        .toLocaleLowerCase();

    if (!normalizedSearch) {
      return players.slice(
        0,
        20
      );
    }

    const startsWithMatches =
      players.filter((player) =>
        player
          .toLocaleLowerCase()
          .startsWith(
            normalizedSearch
          )
      );

    const containsMatches =
      players.filter(
        (player) =>
          !player
            .toLocaleLowerCase()
            .startsWith(
              normalizedSearch
            ) &&
          player
            .toLocaleLowerCase()
            .includes(
              normalizedSearch
            )
      );

    return [
      ...startsWithMatches,
      ...containsMatches,
    ].slice(0, 20);
  }, [
    players,
    searchText,
  ]);


  const playerRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.player ===
          selectedPlayer
      ),
    [
      records,
      selectedPlayer,
    ]
  );


  const selectPlayer = (
    player
  ) => {
    setSelectedPlayer(player);
    setSearchText(player);
    setSuggestionsVisible(
      false
    );
    setSortField("season");
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
      "netPoints",
    ];

    setSortDirection(
      descendingFields.includes(field)
        ? "desc"
        : "asc"
    );
  };


  const sortedRecords = [
    ...playerRecords,
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

    let comparison = 0;

    if (
      typeof valueA ===
        "string" ||
      typeof valueB ===
        "string"
    ) {
      comparison = String(
        valueA
      ).localeCompare(
        String(valueB),
        undefined,
        {
          sensitivity: "base",
        }
      );
    } else {
      comparison =
        Number(valueA) -
        Number(valueB);
    }

    return sortDirection === "asc"
      ? comparison
      : -comparison;
  });


  const sortIndicator = (
    field
  ) => {
    if (sortField !== field) {
      return "";
    }

    return sortDirection === "asc"
      ? " ▲"
      : " ▼";
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


  const formatDraft = (
    record
  ) => {
    if (
      record.draftRound ===
        null ||
      record.draftRound ===
        undefined
    ) {
      return "N/A";
    }

    const keeperLabel =
      record.keeper
        ? " (K)"
        : "";

    return (
      `Rd ${record.draftRound}, ` +
      `Pick ${record.draftPick}` +
      keeperLabel
    );
  };


  const getOrdinal = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      Number(value) === 0
    ) {
      return "In Progress";
    }

    const number =
      Number(value);

    const lastTwo =
      number % 100;

    if (
      lastTwo >= 11 &&
      lastTwo <= 13
    ) {
      return `${number}th`;
    }

    const lastDigit =
      number % 10;

    if (lastDigit === 1) {
      return `${number}st`;
    }

    if (lastDigit === 2) {
      return `${number}nd`;
    }

    if (lastDigit === 3) {
      return `${number}rd`;
    }

    return `${number}th`;
  };


  const netColor = (
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


  const totalPoints =
    playerRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.points || 0
        ),
      0
    );


  const ownerCount =
    new Set(
      playerRecords.map(
        (record) =>
          record.ownerId
      )
    ).size;


  const headerStyle = {
    cursor: "pointer",
    userSelect: "none",
    textAlign: "left",
    paddingRight: "14px",
    paddingBottom: "8px",
    whiteSpace: "nowrap",
  };


  const cellStyle = {
    paddingRight: "14px",
    paddingBottom: "7px",
    whiteSpace: "nowrap",
  };


  return (
    <div>
      <h2>Player History</h2>

      <div
        style={{
          position: "relative",
          width:
            "min(100%, 460px)",
        }}
      >
        <label
          htmlFor="player-search"
          style={{
            display: "block",
            marginBottom: "6px",
          }}
        >
          Search player
        </label>

        <input
          id="player-search"
          type="search"
          value={searchText}
          autoComplete="off"
          placeholder="Start typing a player name..."
          onFocus={() =>
            setSuggestionsVisible(
              true
            )
          }
          onChange={(event) => {
            setSearchText(
              event.target.value
            );

            setSelectedPlayer(
              ""
            );

            setSuggestionsVisible(
              true
            );
          }}
          onKeyDown={(event) => {
            if (
              event.key ===
                "Enter" &&
              suggestions.length > 0
            ) {
              event.preventDefault();

              selectPlayer(
                suggestions[0]
              );
            }

            if (
              event.key ===
              "Escape"
            ) {
              setSuggestionsVisible(
                false
              );
            }
          }}
          style={{
            width: "100%",
            minHeight: "42px",
            padding: "9px 11px",
            border:
              "1px solid #aeb8c4",
            borderRadius: "6px",
            backgroundColor:
              "#ffffff",
            color: "#172b43",
            font: "inherit",
          }}
        />

        {suggestionsVisible &&
          suggestions.length > 0 && (
          <div
            role="listbox"
            style={{
              position:
                "absolute",
              zIndex: 20,
              top: "100%",
              right: 0,
              left: 0,
              maxHeight:
                "280px",
              overflowY: "auto",
              marginTop: "4px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "6px",
              backgroundColor:
                "#ffffff",
              boxShadow:
                "0 8px 20px rgba(15, 23, 42, 0.14)",
            }}
          >
            {suggestions.map(
              (player) => (
                <button
                  key={player}
                  type="button"
                  role="option"
                  onMouseDown={(
                    event
                  ) => {
                    event.preventDefault();

                    selectPlayer(
                      player
                    );
                  }}
                  style={{
                    display:
                      "block",
                    width: "100%",
                    padding:
                      "9px 11px",
                    border: "none",
                    borderBottom:
                      "1px solid #eef2f6",
                    backgroundColor:
                      "#ffffff",
                    color:
                      "#253c56",
                    font: "inherit",
                    fontSize:
                      "0.88rem",
                    textAlign:
                      "left",
                    cursor:
                      "pointer",
                  }}
                >
                  {player}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {selectedPlayer ? (
        <>
          <h3>
            {selectedPlayer}
          </h3>

          <p>
            <strong>
              Seasons/Owner Records:
            </strong>{" "}
            {playerRecords.length}
          </p>

          <p>
            <strong>
              Owners:
            </strong>{" "}
            {ownerCount}
          </p>

          <p>
            <strong>
              Total Points:
            </strong>{" "}
            {formatPoints(
              totalPoints
            )}
          </p>

          <table
            style={{
              marginTop: "18px",
              borderCollapse:
                "collapse",
            }}
          >
            <thead>
              <tr>
                <th
                  onClick={() =>
                    handleSort(
                      "season"
                    )
                  }
                  style={
                    headerStyle
                  }
                >
                  Year
                  {sortIndicator(
                    "season"
                  )}
                </th>

                <th
                  onClick={() =>
                    handleSort(
                      "ownerName"
                    )
                  }
                  style={
                    headerStyle
                  }
                >
                  Team Owner
                  {sortIndicator(
                    "ownerName"
                  )}
                </th>

                <th
                  style={{
                    ...headerStyle,
                    cursor:
                      "default",
                  }}
                >
                  Draft Rd/Pick
                </th>

                <th
                  onClick={() =>
                    handleSort(
                      "points"
                    )
                  }
                  style={
                    headerStyle
                  }
                >
                  Pts
                  {sortIndicator(
                    "points"
                  )}
                </th>

                <th
                  onClick={() =>
                    handleSort(
                      "netPoints"
                    )
                  }
                  style={
                    headerStyle
                  }
                >
                  Net Pts
                  {sortIndicator(
                    "netPoints"
                  )}
                </th>

                <th
                  onClick={() =>
                    handleSort(
                      "teamFinish"
                    )
                  }
                  style={
                    headerStyle
                  }
                >
                  Team Finish
                  {sortIndicator(
                    "teamFinish"
                  )}
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedRecords.map(
                (
                  record,
                  index
                ) => (
                  <tr
                    key={`${record.playerKey}-${record.season}-${record.ownerId}-${record.draftRound}-${record.draftPick}-${index}`}
                  >
                    <td
                      style={
                        cellStyle
                      }
                    >
                      {
                        record.season
                      }
                    </td>

                    <td
                      style={
                        cellStyle
                      }
                      title={
                        record.teamName
                      }
                    >
                      {
                        record.ownerName
                      }
                    </td>

                    <td
                      style={
                        cellStyle
                      }
                    >
                      {formatDraft(
                        record
                      )}
                    </td>

                    <td
                      style={
                        cellStyle
                      }
                    >
                      {formatPoints(
                        record.points
                      )}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        color:
                          netColor(
                            record.netPoints
                          ),
                        fontWeight:
                          record.netPoints !==
                            null &&
                          record.netPoints !==
                            undefined
                            ? 700
                            : undefined,
                      }}
                    >
                      {formatNetPoints(
                        record.netPoints
                      )}
                    </td>

                    <td
                      style={
                        cellStyle
                      }
                    >
                      {getOrdinal(
                        record.teamFinish
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </>
      ) : (
        <div
          style={{
            marginTop: "24px",
            padding: "22px",
            border:
              "1px dashed #aeb8c4",
            borderRadius: "8px",
            backgroundColor:
              "#f8fafc",
            color: "#536273",
          }}
        >
          Search for and select a
          player to view the player’s
          NAFFL history.
        </div>
      )}

      <p
        style={{
          marginTop: "14px",
          color: "#64748b",
          fontSize: "0.8rem",
        }}
      >
        “K” identifies a keeper.
        Seasons without an
        owner-specific draft record
        display N/A for Draft and Net
        Pts. Hover over an owner to see
        that season’s team name.
      </p>
    </div>
  );
}

export default PlayerHistory;