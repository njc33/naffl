import { useEffect, useMemo, useState } from "react";

function PlayerHistory() {
  const [records, setRecords] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [sortField, setSortField] = useState("season");
  const [sortDirection, setSortDirection] = useState("asc");
  const [leaderCategory, setLeaderCategory] = useState("");
  const [showFullLeaderList, setShowFullLeaderList] = useState(false);
  const [selectedFromRingsLeaderboard, setSelectedFromRingsLeaderboard] = useState(false);

  useEffect(() => {
    fetch("/data/player-history.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load player history.");
        }
        return response.json();
      })
      .then(setRecords)
      .catch(console.error);
  }, []);

  const players = useMemo(
    () =>
      [...new Set(records.map((record) => record.player))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      ),
    [records]
  );

  const suggestions = useMemo(() => {
    const search = searchText.trim().toLocaleLowerCase();
    if (!search) return players.slice(0, 20);

    const startsWith = players.filter((player) =>
      player.toLocaleLowerCase().startsWith(search)
    );
    const contains = players.filter(
      (player) =>
        !player.toLocaleLowerCase().startsWith(search) &&
        player.toLocaleLowerCase().includes(search)
    );

    return [...startsWith, ...contains].slice(0, 20);
  }, [players, searchText]);

  const playerRecords = useMemo(
    () => records.filter((record) => record.player === selectedPlayer),
    [records, selectedPlayer]
  );

  const playerSummaries = useMemo(() => {
    const summaries = new Map();

    records.forEach((record) => {
      if (!summaries.has(record.player)) {
        summaries.set(record.player, {
          player: record.player,
          playerKey: record.playerKey,
          position: record.careerPosition || record.position || "N/A",
          careerPoints: Number(record.careerPoints ?? 0),
          overallCareerRank: record.overallCareerRank ?? null,
          positionCareerRank: record.positionCareerRank ?? null,
          ownerIds: new Set(),
          championshipTeamSeasons: new Set(),
        });
      }

      const summary = summaries.get(record.player);
      summary.ownerIds.add(record.ownerId);

      if (Number(record.teamFinish) === 1) {
        summary.championshipTeamSeasons.add(
          `${record.season}-${record.ownerId}`
        );
      }
    });

    return [...summaries.values()].map((summary) => ({
      ...summary,
      ownerCount: summary.ownerIds.size,
      ringCount: summary.championshipTeamSeasons.size,
    }));
  }, [records]);

  const leaderCategories = [
    { value: "overall", label: "Top Players of All Time" },
    { value: "QB", label: "Top QBs of All Time" },
    { value: "RB", label: "Top RBs of All Time" },
    { value: "WR", label: "Top WRs of All Time" },
    { value: "TE", label: "Top TEs of All Time" },
    { value: "K", label: "Top Kickers of All Time" },
    { value: "D/ST", label: "Top D/STs of All Time" },
    { value: "mostOwners", label: "Players with the Most NAFFL Owners" },
    { value: "mostRings", label: "Players with the Most Rings" },
  ];

  const selectedLeaderCategory = leaderCategories.find(
    (category) => category.value === leaderCategory
  );

  const leaderRecords = useMemo(() => {
    if (!leaderCategory) return [];

    const filtered =
      ["overall", "mostOwners", "mostRings"].includes(leaderCategory)
        ? playerSummaries
        : playerSummaries.filter(
            (summary) => summary.position === leaderCategory
          );

    return [...filtered].sort((playerA, playerB) => {
      if (leaderCategory === "mostOwners") {
        return (
          playerB.ownerCount - playerA.ownerCount ||
          playerB.careerPoints - playerA.careerPoints ||
          playerA.player.localeCompare(playerB.player)
        );
      }

      if (leaderCategory === "mostRings") {
        return (
          playerB.ringCount - playerA.ringCount ||
          playerB.careerPoints - playerA.careerPoints ||
          playerA.player.localeCompare(playerB.player)
        );
      }

      return (
        playerB.careerPoints - playerA.careerPoints ||
        playerA.player.localeCompare(playerB.player)
      );
    });
  }, [leaderCategory, playerSummaries]);

  const visibleLeaderRecords = showFullLeaderList
    ? leaderRecords
    : leaderRecords.slice(0, 10);

  const playerSummary = playerRecords[0] ?? null;
  const position = playerSummary?.careerPosition || "N/A";
  const careerPoints = playerSummary?.careerPoints ?? null;
  const overallRank = playerSummary?.overallCareerRank ?? null;
  const positionRank = playerSummary?.positionCareerRank ?? null;

  const selectPlayer = (player, fromRingsLeaderboard = false) => {
    setSelectedPlayer(player);
    setSearchText(player);
    setSelectedFromRingsLeaderboard(fromRingsLeaderboard);
    setSuggestionsVisible(false);
    setSortField("season");
    setSortDirection("asc");
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(
      ["points", "netPoints"].includes(field) ? "desc" : "asc"
    );
  };

  const sortedRecords = useMemo(
    () =>
      [...playerRecords].sort((recordA, recordB) => {
        const valueA = recordA[sortField];
        const valueB = recordB[sortField];
        const missingA = valueA === null || valueA === undefined;
        const missingB = valueB === null || valueB === undefined;

        if (missingA && missingB) return 0;
        if (missingA) return 1;
        if (missingB) return -1;

        const comparison =
          typeof valueA === "string" || typeof valueB === "string"
            ? String(valueA).localeCompare(String(valueB), undefined, {
                sensitivity: "base",
              })
            : Number(valueA) - Number(valueB);

        return sortDirection === "asc" ? comparison : -comparison;
      }),
    [playerRecords, sortDirection, sortField]
  );

  const sortIndicator = (field) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const formatPoints = (value) => {
    if (value === null || value === undefined) return "N/A";
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNetPoints = (value) => {
    if (value === null || value === undefined) return "N/A";
    const number = Number(value);
    const formatted = Math.abs(number).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (number > 0) return `+${formatted}`;
    if (number < 0) return `-${formatted}`;
    return "0.00";
  };

  const formatRank = (rank) => (rank ? `#${rank}` : "N/A");

  const formatDraft = (record) => {
    if (record.draftRound === null || record.draftRound === undefined) {
      return "N/A";
    }
    const pick =
      record.draftPick === null || record.draftPick === undefined
        ? ""
        : `, Pick ${record.draftPick}`;
    return `Rd ${record.draftRound}${pick}${record.keeper ? " (K)" : ""}`;
  };

  const getOrdinal = (value) => {
    if (value === null || value === undefined || Number(value) === 0) {
      return "In Progress";
    }
    const number = Number(value);
    const lastTwo = number % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return `${number}th`;
    if (number % 10 === 1) return `${number}st`;
    if (number % 10 === 2) return `${number}nd`;
    if (number % 10 === 3) return `${number}rd`;
    return `${number}th`;
  };

  const netColor = (value) => {
    if (value === null || value === undefined) return undefined;
    if (Number(value) > 0) return "#15803d";
    if (Number(value) < 0) return "#b91c1c";
    return undefined;
  };

  const ownerCount = new Set(playerRecords.map((record) => record.ownerId)).size;

  const headerStyle = {
    cursor: "pointer",
    userSelect: "none",
    textAlign: "left",
    padding: "8px 14px 8px 0",
    whiteSpace: "nowrap",
  };

  const cellStyle = {
    padding: "7px 14px 7px 0",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      <h2>Player History</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "16px",
          alignItems: "start",
          maxWidth: "900px",
        }}
      >
        <div style={{ position: "relative", width: "100%" }}>
          <label
            htmlFor="player-search"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Search player
          </label>

        <input
          id="player-search"
          type="search"
          value={searchText}
          autoComplete="off"
          placeholder="Start typing a player name..."
          onFocus={() => setSuggestionsVisible(true)}
          onChange={(event) => {
            setSearchText(event.target.value);
            setSelectedPlayer("");
            setSelectedFromRingsLeaderboard(false);
            setSuggestionsVisible(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && suggestions.length > 0) {
              event.preventDefault();
              selectPlayer(suggestions[0], false);
            }
            if (event.key === "Escape") setSuggestionsVisible(false);
          }}
          style={{
            width: "100%",
            minHeight: "42px",
            padding: "9px 11px",
            border: "1px solid #aeb8c4",
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            color: "#172b43",
            font: "inherit",
          }}
        />

        {suggestionsVisible && suggestions.length > 0 && (
          <div
            role="listbox"
            style={{
              position: "absolute",
              zIndex: 20,
              top: "100%",
              right: 0,
              left: 0,
              maxHeight: "280px",
              overflowY: "auto",
              marginTop: "4px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.14)",
            }}
          >
            {suggestions.map((player) => (
              <button
                key={player}
                type="button"
                role="option"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectPlayer(player, false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "9px 11px",
                  border: "none",
                  borderBottom: "1px solid #eef2f6",
                  backgroundColor: "#ffffff",
                  color: "#253c56",
                  font: "inherit",
                  fontSize: "0.88rem",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {player}
              </button>
            ))}
          </div>
        )}
        </div>

        <div>
          <label
            htmlFor="leader-category"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Browse career leaders
          </label>

          <select
            id="leader-category"
            value={leaderCategory}
            onChange={(event) => {
              setLeaderCategory(event.target.value);
              setShowFullLeaderList(false);
            }}
            style={{
              width: "100%",
              minHeight: "42px",
              padding: "9px 11px",
              border: "1px solid #aeb8c4",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              color: "#172b43",
              font: "inherit",
            }}
          >
            <option value="">Select a leaderboard...</option>
            {leaderCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
            <option disabled>Players Traded the Most — coming with trade data</option>
            <option disabled>Players Most Added — coming with waiver data</option>
            <option disabled>Players Most Acquired — coming with transaction data</option>
          </select>
        </div>
      </div>

      {leaderCategory && (
        <section
          style={{
            maxWidth: "900px",
            marginTop: "18px",
            padding: "16px",
            border: "1px solid #d7dce3",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: "#17365d" }}>
                {selectedLeaderCategory?.label}
              </h3>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.78rem" }}>
                Select a player to open the full Player History record.
              </p>
            </div>

            {leaderRecords.length > 10 && (
              <button
                type="button"
                onClick={() => setShowFullLeaderList((current) => !current)}
                style={{
                  padding: "7px 10px",
                  border: "1px solid #aeb8c4",
                  borderRadius: "6px",
                  backgroundColor: "#f8fafc",
                  color: "#334155",
                  font: "inherit",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                {showFullLeaderList ? "Show Top 10" : "View Full List"}
              </button>
            )}
          </div>

          <div style={{ display: "grid", gap: "6px" }}>
            {visibleLeaderRecords.map((leader, index) => (
              <button
                key={leader.playerKey || leader.player}
                type="button"
                onClick={() =>
                  selectPlayer(leader.player, leaderCategory === "mostRings")
                }
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px minmax(0, 1fr) auto",
                  gap: "10px",
                  alignItems: "center",
                  width: "100%",
                  padding: "9px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "7px",
                  backgroundColor:
                    selectedPlayer === leader.player ? "#eef4fa" : "#f8fafc",
                  color: "#253c56",
                  font: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <strong style={{ color: "#64748b", textAlign: "center" }}>
                  {index + 1}
                </strong>
                <span style={{ minWidth: 0 }}>
                  <strong>{leader.player}</strong>
                  <span
                    style={{
                      display: "block",
                      marginTop: "2px",
                      color: "#64748b",
                      fontSize: "0.7rem",
                    }}
                  >
                    {leader.position}
                  </span>
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {leaderCategory === "mostOwners"
                    ? `${leader.ownerCount} owners`
                    : leaderCategory === "mostRings"
                      ? `${leader.ringCount} ${leader.ringCount === 1 ? "ring" : "rings"}`
                      : formatPoints(leader.careerPoints)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedPlayer ? (
        <>
          <section
            style={{
              marginTop: "24px",
              padding: "18px",
              border: "1px solid #d7dce3",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
            }}
          >
            <h3 style={{ margin: 0, color: "#17365d" }}>
              {selectedPlayer}
              {selectedFromRingsLeaderboard &&
                Number(playerSummary?.teamFinish) !== 0 &&
                playerRecords.some((record) => Number(record.teamFinish) === 1)
                ? " 🏆"
                : ""}
            </h3>
            <p style={{ margin: "5px 0 0", color: "#536273" }}>
              <strong>Position:</strong> {position}
            </p>
            <p style={{ margin: "9px 0 0", color: "#253c56" }}>
              <strong>Career Points:</strong> {formatPoints(careerPoints)} (
              {formatRank(overallRank)} overall, {formatRank(positionRank)} {position})
            </p>
            <p style={{ margin: "9px 0 0", color: "#64748b", fontSize: "0.8rem" }}>
              Seasons/Owner Records: {playerRecords.length} · Owners: {ownerCount}
            </p>
            {selectedFromRingsLeaderboard && (
              <p
                style={{
                  margin: "9px 0 0",
                  color: "#8a5a00",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                Championship seasons are highlighted in gold below.
              </p>
            )}
          </section>

          <div style={{ width: "100%", overflowX: "auto" }}>
            <table
              style={{
                width: "max-content",
                minWidth: "100%",
                marginTop: "18px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th onClick={() => handleSort("season")} style={headerStyle}>
                    Year{sortIndicator("season")}
                  </th>
                  <th onClick={() => handleSort("ownerName")} style={headerStyle}>
                    Team Owner{sortIndicator("ownerName")}
                  </th>
                  <th style={{ ...headerStyle, cursor: "default" }}>Draft Rd/Pick</th>
                  <th onClick={() => handleSort("points")} style={headerStyle}>
                    Pts{sortIndicator("points")}
                  </th>
                  <th onClick={() => handleSort("netPoints")} style={headerStyle}>
                    Net vs Avg Rd{sortIndicator("netPoints")}
                  </th>
                  <th onClick={() => handleSort("teamFinish")} style={headerStyle}>
                    Team Finish{sortIndicator("teamFinish")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedRecords.map((record, index) => (
                  <tr
                    key={`${record.playerKey}-${record.season}-${record.ownerId}-${record.draftRound}-${record.draftPick}-${index}`}
                    style={
                      selectedFromRingsLeaderboard && Number(record.teamFinish) === 1
                        ? {
                            backgroundColor: "#fff7d6",
                            boxShadow: "inset 4px 0 0 #d4a017",
                          }
                        : undefined
                    }
                  >
                    <td style={cellStyle}>{record.season}</td>
                    <td style={cellStyle} title={record.teamName}>
                      {record.ownerName}
                    </td>
                    <td style={cellStyle}>{formatDraft(record)}</td>
                    <td style={cellStyle}>{formatPoints(record.points)}</td>
                    <td
                      style={{
                        ...cellStyle,
                        color: netColor(record.netPoints),
                        fontWeight:
                          record.netPoints !== null && record.netPoints !== undefined
                            ? 700
                            : undefined,
                      }}
                    >
                      {formatNetPoints(record.netPoints)}
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        color:
                          selectedFromRingsLeaderboard && Number(record.teamFinish) === 1
                            ? "#8a5a00"
                            : undefined,
                        fontWeight:
                          selectedFromRingsLeaderboard && Number(record.teamFinish) === 1
                            ? 800
                            : undefined,
                      }}
                    >
                      {selectedFromRingsLeaderboard && Number(record.teamFinish) === 1
                        ? `🏆 ${getOrdinal(record.teamFinish)}`
                        : getOrdinal(record.teamFinish)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div
          style={{
            marginTop: "24px",
            padding: "22px",
            border: "1px dashed #aeb8c4",
            borderRadius: "8px",
            backgroundColor: "#f8fafc",
            color: "#536273",
          }}
        >
          Search for a player or choose a career leaderboard to explore NAFFL player history.
        </div>
      )}

      <p style={{ marginTop: "14px", color: "#64748b", fontSize: "0.8rem" }}>
        Career rankings use competition ranking, so ties produce ranks such as
        1, 2, 2, 4. “K” identifies a keeper. Seasons without an owner-specific
        draft record display N/A for Draft and Net vs Avg Rd. Hover over an
        owner to see that season’s team name. Trade, add/drop, and all-acquisition leaderboards will be enabled after transaction-history collection.
      </p>
    </div>
  );
}

export default PlayerHistory;
