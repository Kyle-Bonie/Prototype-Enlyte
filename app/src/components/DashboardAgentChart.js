import { StatusSuccessRateChart } from "./DashboardTeamLeadCharts";

/**
 * DashboardAgentChart
 * Displays the Success Rate column chart for the agent's assigned cases.
 * @param {{ data: Array }} props - data: the agent's cases (with .status field)
 */
function DashboardAgentChart({ data }) {
  return (
    <div className="tl-tiles">
      <section className="tl-tile">
        <div className="tl-tile-header">
          <h2 className="tl-tile-title">Success Rate</h2>
        </div>
        <StatusSuccessRateChart data={data} />
      </section>
    </div>
  );
}

export default DashboardAgentChart;
