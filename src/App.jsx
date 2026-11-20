import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

import Home from "./pages/Home";
import LeagueHistory from "./pages/LeagueHistory";
import OwnerHistory from "./pages/OwnerHistory";
import Records from "./pages/Records";

import "./App.css";

function App() {
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
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link"
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link"
              }
            >
              League History
            </NavLink>

            <NavLink
              to="/owners"
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link"
              }
            >
              Owner History
            </NavLink>

            <NavLink
              to="/records"
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link"
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
              element={<LeagueHistory />}
            />

            <Route
              path="/owners"
              element={<OwnerHistory />}
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