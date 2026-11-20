import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import Home from "./pages/Home";
import LeagueHistory from "./pages/LeagueHistory";
import OwnerHistory from "./pages/OwnerHistory";
import Records from "./pages/Records";

function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          padding: "20px",
          fontFamily: "Arial",
        }}
      >
        <nav
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          <Link to="/">Home</Link>

          <Link to="/history">
            League History
          </Link>

          <Link to="/owners">
            Owner History
          </Link>

          <Link to="/records">
            Records
          </Link>
        </nav>

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
      </div>
    </BrowserRouter>
  );
}

export default App;
