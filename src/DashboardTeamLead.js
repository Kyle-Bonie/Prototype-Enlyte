import "./DashboardTeamLead.css";

function DashboardTeamLead({ username, onLogout }) {
  return (
    <div className="tl-dashboard">
      <header className="tl-topbar" />
      <div className="tl-body">
        <aside className="tl-sidebar sidebar">
          <div className="tl-sidebar-spacer" />
          <button className="tl-logout" type="button" onClick={onLogout}>
            Logout
          </button>
        </aside>
        <main className="tl-main">
          <div className="tl-content">
            <h1 className="tl-title">Team Lead Dashboard</h1>
            <p className="tl-subtitle">Welcome, {username}.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardTeamLead;
