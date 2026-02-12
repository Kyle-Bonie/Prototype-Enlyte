import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import LoginPage from "./LoginPage";
import DashboardAgent from "./DashboardAgent";
import DashboardTeamLead from "./DashboardTeamLead";
import { authAPI } from "./api/apiClient";

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <AppRoutes user={user} setUser={setUser} />
    </BrowserRouter>
  );
}

function AppRoutes({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call backend logout (optional, since JWT is stateless)
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage and user state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
    }
  };

  const requireRole = (role, element) =>
    user && user.role === role ? element : <Navigate to="/" replace />;

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LoginPage onLoginSuccess={setUser} />} />
        <Route
          path="/team-lead"
          element={requireRole(
            "teamLead",
            <DashboardTeamLead
              username={user?.username}
              onLogout={handleLogout}
            />,
          )}
        />
        <Route
          path="/agent"
          element={requireRole(
            "agent",
            <DashboardAgent
              username={user?.username}
              onLogout={handleLogout}
            />,
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
