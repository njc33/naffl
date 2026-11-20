import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

import Home from "./pages/Home";
import LeagueHistory from "./pages/LeagueHistory";
import OwnerHistory from "./pages/OwnerHistory";
import TeamRosterHistory from "./pages/TeamRosterHistory";
import DraftHistory from "./pages/DraftHistory";
import FaceOfFranchise from "./pages/FaceOfFranchise";
import PlayerHistory from "./pages/PlayerHistory";
import Records from "./pages/Records";

import "./App.css";


function App() {
  const getNavLinkClass = ({
    isActive,
  }) =>
    isActive
      ? "nav-link nav-link-active"
      : "nav-link";

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="site-header">
          <div className="site-brand">
            <div className="site-brand-short">
              NAFFL
            </div>

            <div className="site-brand-long">
              North Andover Fantasy Football League
            </div>
          </div>

          <nav
            className="site-nav"
            aria-label="Main navigation"
          >
            <NavLink
              to="/"
              end
              className={
                getNavLinkClass
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/history"
              className={
                getNavLinkClass
              }
            >
              League History
            </NavLink>

            <NavLink
              to="/owners"
              className={
                getNavLinkClass
              }
            >
              Owner History
            </NavLink>

            <NavLink
              to="/rosters"
              className={
                getNavLinkClass
              }
            >
              Rosters
            </NavLink>

            <NavLink
              to="/drafts"
              className={
                getNavLinkClass
              }
            >
              Drafts
            </NavLink>

            <NavLink
              to="/franchise"
              className={
                getNavLinkClass
              }
            >
              Franchise
            </NavLink>

            <NavLink
              to="/players"
              className={
                getNavLinkClass
              }
            >
              Players
            </NavLink>

            <NavLink
              to="/records"
              className={
                getNavLinkClass
              }
            >
              Records
            </NavLink>
          </nav>
        </header>

        <main className="page-content">
          <Routes>
            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/history"
              element={
                <LeagueHistory />
              }
            />

            <Route
              path="/owners"
              element={
                <OwnerHistory />
              }
            />

            <Route
              path="/rosters"
              element={
                <TeamRosterHistory />
              }
            />

            <Route
              path="/drafts"
              element={
                <DraftHistory />
              }
            />

            <Route
              path="/franchise"
              element={
                <FaceOfFranchise />
              }
            />

            <Route
              path="/players"
              element={
                <PlayerHistory />
              }
            />

            <Route
              path="/records"
              element={<Records />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;