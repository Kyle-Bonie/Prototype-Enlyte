import React from "react";
import "./DashboardTeamLeadCharts.css";

// Pie Chart Component for Agent Workload Distribution
export function PieChart({ data }) {
  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="pie-chart-empty">
        <p style={{ fontStyle: "italic", color: "#999" }}>No Available Data</p>
      </div>
    );
  }

  // Calculate total for percentages
  const total = data.reduce((sum, agent) => sum + agent.total, 0);

  // Generate colors for each agent
  const colors = [
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#f59e0b", // Amber
    "#10b981", // Green
    "#06b6d4", // Cyan
  ];

  // Calculate percentages and cumulative angles for pie slices
  let cumulativeAngle = 0;
  const slices = data.map((agent, index) => {
    const percentage = (agent.total / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    return {
      name: agent.name,
      value: agent.total,
      percentage: percentage.toFixed(1),
      color: colors[index % colors.length],
      startAngle,
      endAngle: cumulativeAngle,
    };
  });

  // Function to convert polar coordinates to SVG path
  const createArc = (startAngle, endAngle, radius = 100) => {
    const start = polarToCartesian(0, 0, radius, endAngle);
    const end = polarToCartesian(0, 0, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "L",
      0,
      0,
      "Z",
    ].join(" ");
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  return (
    <div className="pie-chart-container">
      <svg
        viewBox="-120 -120 240 240"
        className="pie-chart-svg"
        aria-label="Agent workload distribution pie chart"
      >
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={createArc(slice.startAngle, slice.endAngle)}
              fill={slice.color}
              className="pie-slice"
              data-name={slice.name}
              data-value={slice.value}
            >
              <title>
                {slice.name}: {slice.value} cases ({slice.percentage}%)
              </title>
            </path>
          </g>
        ))}
        {/* Center circle for donut effect */}
        <circle cx="0" cy="0" r="50" fill="white" />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          className="pie-chart-total"
        >
          {total}
        </text>
        <text
          x="0"
          y="18"
          textAnchor="middle"
          dominantBaseline="middle"
          className="pie-chart-label"
        >
          Total Cases
        </text>
      </svg>

      {/* Legend */}
      <div className="pie-chart-legend">
        {slices.map((slice, index) => (
          <div key={index} className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: slice.color }}
            />
            <span className="legend-name">{slice.name}</span>
            <span className="legend-value">
              {slice.value} ({slice.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Column Chart Component for TAT Status
export function TATColumnChart({ data }) {
  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="column-chart-empty">
        <p style={{ fontStyle: "italic", color: "#999" }}>No Available Data</p>
      </div>
    );
  }

  // Calculate Met and Not Met counts
  const metCount = data.filter((item) => item.status === "Met").length;
  const notMetCount = data.filter((item) => item.status === "Not Met").length;
  const total = data.length;

  // Calculate percentages
  const metPercentage = ((metCount / total) * 100).toFixed(1);
  const notMetPercentage = ((notMetCount / total) * 100).toFixed(1);

  // Calculate bar heights (max 100%)
  const maxHeight = 200;
  const metHeight = (metCount / total) * maxHeight;
  const notMetHeight = (notMetCount / total) * maxHeight;

  return (
    <div className="column-chart-container">
      <div className="column-chart-title">TAT Performance</div>
      <svg
        viewBox="0 0 300 280"
        className="column-chart-svg"
        aria-label="TAT Met vs Not Met column chart"
      >
        {/* Grid lines */}
        <line
          x1="50"
          y1="220"
          x2="250"
          y2="220"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        <line
          x1="50"
          y1="170"
          x2="250"
          y2="170"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1="50"
          y1="120"
          x2="250"
          y2="120"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1="50"
          y1="70"
          x2="250"
          y2="70"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1="50"
          y1="20"
          x2="250"
          y2="20"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* Met Bar */}
        <g className="column-bar">
          <rect
            x="80"
            y={220 - metHeight}
            width="60"
            height={metHeight}
            fill="#10b981"
            className="column-bar-rect"
            rx="4"
          >
            <title>
              Met: {metCount} cases ({metPercentage}%)
            </title>
          </rect>
          <text
            x="110"
            y={210 - metHeight}
            textAnchor="middle"
            className="column-value"
            fill="#374151"
            fontWeight="600"
          >
            {metCount}
          </text>
        </g>

        {/* Not Met Bar */}
        <g className="column-bar">
          <rect
            x="160"
            y={220 - notMetHeight}
            width="60"
            height={notMetHeight}
            fill="#ef4444"
            className="column-bar-rect"
            rx="4"
          >
            <title>
              Not Met: {notMetCount} cases ({notMetPercentage}%)
            </title>
          </rect>
          <text
            x="190"
            y={210 - notMetHeight}
            textAnchor="middle"
            className="column-value"
            fill="#374151"
            fontWeight="600"
          >
            {notMetCount}
          </text>
        </g>

        {/* X-axis labels */}
        <text
          x="110"
          y="245"
          textAnchor="middle"
          className="column-label"
          fill="#6b7280"
        >
          Met
        </text>
        <text
          x="190"
          y="245"
          textAnchor="middle"
          className="column-label"
          fill="#6b7280"
        >
          Not Met
        </text>

        {/* Y-axis label */}
        <text
          x="30"
          y="220"
          textAnchor="middle"
          className="column-axis-label"
          fill="#9ca3af"
          fontSize="10"
        >
          0
        </text>
        <text
          x="30"
          y="120"
          textAnchor="middle"
          className="column-axis-label"
          fill="#9ca3af"
          fontSize="10"
        >
          {Math.round(total / 2)}
        </text>
        <text
          x="30"
          y="20"
          textAnchor="middle"
          className="column-axis-label"
          fill="#9ca3af"
          fontSize="10"
        >
          {total}
        </text>
      </svg>

      {/* Statistics */}
      <div className="column-chart-stats">
        <div className="stat-item stat-met">
          <div className="stat-color" style={{ backgroundColor: "#10b981" }} />
          <span className="stat-label">Met TAT</span>
          <span className="stat-value">
            {metCount} ({metPercentage}%)
          </span>
        </div>
        <div className="stat-item stat-not-met">
          <div className="stat-color" style={{ backgroundColor: "#ef4444" }} />
          <span className="stat-label">Not Met TAT</span>
          <span className="stat-value">
            {notMetCount} ({notMetPercentage}%)
          </span>
        </div>
      </div>

      {/* Total Cases */}
      <div className="column-chart-total">
        <span className="total-label">Total Cases:</span>
        <span className="total-value">{total}</span>
      </div>
    </div>
  );
}

// Default export (for backward compatibility)
function DashboardTeamLeadCharts({ data, type = "pie" }) {
  if (type === "column") {
    return <TATColumnChart data={data} />;
  }
  return <PieChart data={data} />;
}

export default DashboardTeamLeadCharts;
