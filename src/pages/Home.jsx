import { Link } from "react-router-dom";

import "./Home.css";


const PAGE_CARDS = [
  {
  path: "/scoreboard",
  icon: "🕰️",
  title: "Scoreboard Time Machine",
  description:
    "Revisit every weekly matchup and explore historical starting lineups and benches.",
  },
  {
    path: "/history",
    icon: "🏆",
    title: "League History",
    description:
      "Explore every season, standings, scoring, finishes, and league-wide trends.",
  },
  {
    path: "/owners",
    icon: "👤",
    title: "Owner History",
    description:
      "Review each owner’s full career, rankings, teams, and season-by-season graph.",
  },
  {
    path: "/rosters",
    icon: "📋",
    title: "Roster History",
    description:
      "Browse historical team rosters, player production, and acquisition sources.",
  },
  {
    path: "/drafts",
    icon: "🎯",
    title: "Draft History",
    description:
      "Search draft results, player points, keepers, and value versus round average.",
  },
  {
    path: "/franchise",
    icon: "⭐",
    title: "Face of the Franchise",
    description:
      "Discover the players who have scored the most points for every NAFFL owner.",
  },
  {
    path: "/players",
    icon: "🔎",
    title: "Player History",
    description:
      "Search any player and trace owners, draft slots, scoring, and team finishes.",
  },
  {
    path: "/records",
    icon: "📈",
    title: "League Records",
    description:
      "See the league’s career leaders, best seasons, championships, and records.",
  },
];


function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <img
          className="home-hero-image"
          src="/north-andover-welcome.jpg"
          alt="Welcome to North Andover sign"
        />

        <div className="home-hero-overlay">
          <div className="home-hero-content">
            <div className="home-kicker">
              EST. 2013
            </div>

            <h1>
              Welcome to the NAFFL
            </h1>

            <p>
              The complete history of
              the North Andover Fantasy
              Football League.
            </p>
          </div>
        </div>
      </section>

      <section className="home-intro">
        <h2>
          Explore League History
        </h2>

        <p>
          Browse seasons, owners,
          rosters, drafts, players,
          franchise legends, and
          all-time records.
        </p>
      </section>

      <section
        className="home-card-grid"
        aria-label="NAFFL sections"
      >
        {PAGE_CARDS.map(
          (page) => (
            <Link
              key={page.path}
              to={page.path}
              className="home-card"
            >
              <div
                className="home-card-icon"
                aria-hidden="true"
              >
                {page.icon}
              </div>

              <div>
                <h3>
                  {page.title}
                </h3>

                <p>
                  {
                    page.description
                  }
                </p>
              </div>

              <div
                className="home-card-arrow"
                aria-hidden="true"
              >
                →
              </div>
            </Link>
          )
        )}
      </section>
    </div>
  );
}

export default Home;