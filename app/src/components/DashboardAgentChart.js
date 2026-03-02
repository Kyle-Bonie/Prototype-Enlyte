import { TATColumnChart } from "./DashboardTeamLeadCharts";

/**
 * DashboardAgentChart
 * Displays the TAT Performance column chart for the agent's assigned cases.
 * @param {{ data: Array }} props - data: the agent's cases (with .status field)
 */
function DashboardAgentChart({ data }) {
  return (
    <div className="tl-tiles">
      <section className="tl-tile">
        <div className="tl-tile-header">
          <h2 className="tl-tile-title">TAT Performance</h2>
        </div>
        <TATColumnChart data={data} />
      </section>
    </div>
  );
}

export default DashboardAgentChart;
