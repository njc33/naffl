import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./TeamNameWordCloud.css";


const WORD_COLORS = [
  "#17365d",
  "#1d4f75",
  "#0f766e",
  "#15803d",
  "#7c3aed",
  "#a16207",
  "#be185d",
  "#b45309",
  "#475569",
];


function TeamNameWordCloud() {
  const [data, setData] =
    useState({
      summary: {},
      words: [],
    });

  const [
    selectedWord,
    setSelectedWord,
  ] = useState(null);

  const [searchText, setSearchText] =
    useState("");

  const [
    showCommonWords,
    setShowCommonWords,
  ] = useState(false);

  const [minimumCount, setMinimumCount] =
    useState(1);


  useEffect(() => {
    fetch(
      "/data/team-name-words.json"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load team-name word data."
          );
        }

        return response.json();
      })
      .then((result) => {
        setData(result);

        const firstVisibleWord =
          result.words.find(
            (record) =>
              !record.isCommon
          );

        setSelectedWord(
          firstVisibleWord ?? null
        );
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);


  const maximumCount = useMemo(() => {
    if (data.words.length === 0) {
      return 1;
    }

    return Math.max(
      ...data.words.map(
        (record) =>
          Number(record.count)
      )
    );
  }, [data.words]);


  const visibleWords = useMemo(() => {
    const normalizedSearch =
      searchText
        .trim()
        .toLocaleLowerCase();

    return data.words.filter(
      (record) => {
        const commonWordMatches =
          showCommonWords ||
          !record.isCommon;

        const countMatches =
          Number(record.count) >=
          Number(minimumCount);

        const searchMatches =
          !normalizedSearch ||
          record.word.includes(
            normalizedSearch
          );

        return (
          commonWordMatches &&
          countMatches &&
          searchMatches
        );
      }
    );
  }, [
    data.words,
    searchText,
    showCommonWords,
    minimumCount,
  ]);


  const getWordSize = (
    count
  ) => {
    const minimumSize = 15;
    const maximumSize = 54;

    if (maximumCount <= 1) {
      return minimumSize;
    }

    const normalizedValue =
      (
        Math.sqrt(count) - 1
      ) /
      (
        Math.sqrt(
          maximumCount
        ) - 1
      );

    return (
      minimumSize +
      normalizedValue *
        (
          maximumSize -
          minimumSize
        )
    );
  };


  const selectWord = (
    record
  ) => {
    setSelectedWord(record);

    window.requestAnimationFrame(
      () => {
        document
          .getElementById(
            "team-word-details"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
      }
    );
  };


  const selectedOccurrences =
    selectedWord?.occurrences ?? [];


  return (
    <div className="word-cloud-page">
      <h2>
        Team Name Word Cloud
      </h2>

      <p className="word-cloud-intro">
        Every word comes from a
        historical NAFFL team name.
        Larger words appeared in more
        team-season records. Select any
        word to explore the teams,
        owners, and seasons behind it.
      </p>

      <div className="word-cloud-summary">
        <div>
          <strong>
            {
              data.summary
                .distinctTeamNames ??
              0
            }
          </strong>

          <span>
            Distinct Team Names
          </span>
        </div>

        <div>
          <strong>
            {
              data.summary
                .teamSeasonRecords ??
              0
            }
          </strong>

          <span>
            Team-Seasons
          </span>
        </div>

        <div>
          <strong>
            {
              data.summary
                .distinctWords ??
              0
            }
          </strong>

          <span>
            Distinct Words
          </span>
        </div>
      </div>

      <section
        className="word-cloud-controls"
        aria-label="Word cloud controls"
      >
        <label>
          Search word

          <input
            type="search"
            value={searchText}
            placeholder="Type a word..."
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
          />
        </label>

        <label>
          Minimum uses

          <select
            value={minimumCount}
            onChange={(event) =>
              setMinimumCount(
                Number(
                  event.target.value
                )
              )
            }
          >
            <option value={1}>
              1 or more
            </option>

            <option value={2}>
              2 or more
            </option>

            <option value={3}>
              3 or more
            </option>

            <option value={5}>
              5 or more
            </option>

            <option value={10}>
              10 or more
            </option>
          </select>
        </label>

        <label className="word-cloud-checkbox">
          <input
            type="checkbox"
            checked={showCommonWords}
            onChange={(event) =>
              setShowCommonWords(
                event.target.checked
              )
            }
          />

          Show common words
        </label>
      </section>

      <section
        className="word-cloud-canvas"
        aria-label="Interactive team name word cloud"
      >
        {visibleWords.map(
          (record, index) => {
            const isSelected =
              selectedWord?.word ===
              record.word;

            return (
              <button
                key={record.word}
                type="button"
                className={
                  isSelected
                    ? "word-cloud-word word-cloud-word-selected"
                    : "word-cloud-word"
                }
                onClick={() =>
                  selectWord(record)
                }
                title={
                  `${record.displayWord}: ` +
                  `${record.count} team-season uses`
                }
                style={{
                  "--word-size":
                    `${getWordSize(
                      record.count
                    )}px`,

                  "--word-color":
                    WORD_COLORS[
                      index %
                      WORD_COLORS.length
                    ],
                }}
              >
                {record.displayWord}

                <span className="word-cloud-count">
                  {record.count}
                </span>
              </button>
            );
          }
        )}

        {visibleWords.length === 0 && (
          <div className="word-cloud-empty">
            No words match the current
            filters.
          </div>
        )}
      </section>

      <section
        id="team-word-details"
        className="word-cloud-details"
      >
        {selectedWord ? (
          <>
            <div className="word-cloud-details-heading">
              <div>
                <div className="word-cloud-details-kicker">
                  Selected Word
                </div>

                <h3>
                  {
                    selectedWord
                      .displayWord
                  }
                </h3>

                <p>
                  {selectedWord.count}{" "}
                  team-season uses across{" "}
                  {
                    selectedWord
                      .distinctTeamNameCount
                  }{" "}
                  distinct team names and{" "}
                  {
                    selectedWord
                      .ownerCount
                  }{" "}
                  owners.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedWord(null)
                }
              >
                Clear
              </button>
            </div>

            <div className="word-cloud-table-wrap">
              <table className="word-cloud-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Owner</th>
                    <th>Team Name</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedOccurrences.map(
                    (
                      occurrence,
                      index
                    ) => (
                      <tr
                        key={`${occurrence.season}-${occurrence.ownerId}-${occurrence.teamName}-${index}`}
                      >
                        <td>
                          {
                            occurrence.season
                          }
                        </td>

                        <td>
                          {
                            occurrence.ownerName
                          }
                        </td>

                        <td>
                          {
                            occurrence.teamName
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="word-cloud-empty">
            Select a word to see the
            team names, owners, and
            seasons associated with it.
          </div>
        )}
      </section>
    </div>
  );
}

export default TeamNameWordCloud;