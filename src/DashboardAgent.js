import "./DashboardAgent.css";

function DashboardAgent({ username, onLogout }) {
  return (
    <main className="dashboard">
      <section className="dashboard-card">
        <h1 className="dashboard-title">Agent Dashboard</h1>
        <p className="dashboard-subtitle">Welcome, {username}.</p>
        <button className="dashboard-button" type="button" onClick={onLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}

export default DashboardAgent;
