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

// Column Chart Component for Status Success Rate
export function StatusSuccessRateChart({ data }) {
  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="column-chart-empty">
        <p style={{ fontStyle: "italic", color: "#999" }}>No Available Data</p>
      </div>
    );
  }

  // Status options from CaseStatusDropdown
  const statusOptions = ["Untouched", "Scheduled", "Closed", "Escalated", "Send Back", "Unassigned"];
  
  // Calculate count for each status (using caseStatus field)
  const statusCounts = statusOptions.map(status => ({
    status,
    count: data.filter((item) => item.caseStatus === status).length
  }));

  const total = data.length;
  const scheduledCount = statusCounts.find(s => s.status === "Scheduled")?.count || 0;
  
  // Calculate success rate (Scheduled cases / Total cases)
  const successRate = total > 0 ? ((scheduledCount / total) * 100).toFixed(1) : 0;

  // Find max count for scaling
  const maxCount = Math.max(...statusCounts.map(s => s.count), 1);
  const maxHeight = 200;

  // Define colors for each status
  const statusColors = {
    "Untouched": "#9ca3af",
    "Scheduled": "#3b82f6",
    "Closed": "#10b981",
    "Escalated": "#f59e0b",
    "Send Back": "#ef4444",
    "Unassigned": "#6b7280"
  };

  // Calculate bar positions
  const barWidth = 30;
  const barSpacing = 10;
  const startX = 50;

  return (
    <div className="column-chart-container">
      <svg
        viewBox="0 0 350 310"
        className="column-chart-svg"
        aria-label="Case status distribution column chart"
      >
        {/* Grid lines */}
        <line x1="30" y1="220" x2="320" y2="220" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="30" y1="170" x2="320" y2="170" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="30" y1="120" x2="320" y2="120" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="30" y1="70" x2="320" y2="70" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="30" y1="20" x2="320" y2="20" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />

        {/* Status Bars */}
        {statusCounts.map((item, index) => {
          const barHeight = (item.count / maxCount) * maxHeight;
          const x = startX + index * (barWidth + barSpacing);
          const y = 220 - barHeight;
          const percentage = ((item.count / total) * 100).toFixed(1);

          return (
            <g key={item.status} className="column-bar">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={statusColors[item.status]}
                className="column-bar-rect"
                rx="3"
              >
                <title>{item.status}: {item.count} cases ({percentage}%)</title>
              </rect>
              {item.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="column-value"
                  fill="#374151"
                  fontWeight="600"
                  fontSize="11"
                >
                  {item.count}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {statusCounts.map((item, index) => {
          const x = startX + index * (barWidth + barSpacing) + barWidth / 2;
          
          return (
            <text
              key={item.status}
              x={x}
              y="235"
              textAnchor="end"
              className="column-label"
              fill="#6b7280"
              fontSize="8"
              transform={`rotate(-45 ${x} 235)`}
            >
              {item.status}
            </text>
          );
        })}

        {/* Y-axis labels */}
        <text x="15" y="220" textAnchor="middle" className="column-axis-label" fill="#9ca3af" fontSize="10">0</text>
        <text x="15" y="120" textAnchor="middle" className="column-axis-label" fill="#9ca3af" fontSize="10">
          {Math.round(maxCount / 2)}
        </text>
        <text x="15" y="20" textAnchor="middle" className="column-axis-label" fill="#9ca3af" fontSize="10">
          {maxCount}
        </text>
      </svg>

      {/* Statistics */}
      <div className="column-chart-stats">
        {statusCounts.map((item) => {
          const percentage = ((item.count / total) * 100).toFixed(1);
          return (
            <div key={item.status} className="stat-item">
              <div className="stat-color" style={{ backgroundColor: statusColors[item.status] }} />
              <span className="stat-label">{item.status}</span>
              <span className="stat-value">{item.count} ({percentage}%)</span>
            </div>
          );
        })}
      </div>

      {/* Success Rate & Total Cases */}
      <div className="column-chart-total">
        <div className="total-section">
          <span className="total-label">Total Cases:</span>
          <span className="total-value">{total}</span>
        </div>
        <div className="success-rate-section">
          <span className="success-rate-label">Success Rate:</span>
          <span className="success-rate-value">{successRate}%</span>
        </div>
      </div>
    </div>
  );
}

// Default export (for backward compatibility)
function DashboardTeamLeadCharts({ data, type = "pie" }) {
  if (type === "column") {
    return <StatusSuccessRateChart data={data} />;
  }
  return <PieChart data={data} />;
}

export default DashboardTeamLeadCharts;
