import React, { useEffect, useState } from "react";
import "./DashboardTeamLeadCharts.css";
import { subscribeAgentDurations, subscribeTodayAgentDurations } from "../api/durationsAPI";

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
          // Ensure minimum bar height of 8px for any count > 0
          const minBarHeight = 8;
          const calculatedHeight = (item.count / maxCount) * maxHeight;
          const barHeight = item.count > 0 ? Math.max(calculatedHeight, minBarHeight) : 0;
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

// ========================================
// Duration Charts
// ========================================

/**
 * Line Chart Component for Duration Per Day
 * Displays time spent per day for the last 7 days from durations collection
 */
export function DurationPerDayChart({ durationData }) {
  // Generate last 7 days
  const dataPoints = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dateStr = formatDateToYYYYMMDD(date);
    const displayDate = formatDateForChart(date);
    
    // Find matching duration data if it exists
    const durationRecord = durationData?.find(d => d.date === dateStr);
    const totalSeconds = durationRecord?.totalSeconds || 0;
    
    dataPoints.push({
      date: dateStr,
      duration: totalSeconds, // Duration in seconds
      totalSeconds: totalSeconds, // Keep seconds for info display
      displayDate: displayDate,
    });
  }

  // Find min and max for scaling
  const maxDuration = Math.max(...dataPoints.map(d => d.duration), 1);
  const minDuration = Math.min(...dataPoints.map(d => d.duration), 0);
  
  // Add some padding to the scale
  const padding = (maxDuration - minDuration) * 0.2 || maxDuration * 0.2 || 100;
  const scaleMax = maxDuration + padding;
  const scaleMin = Math.max(0, minDuration - padding);
  const scaleRange = scaleMax - scaleMin;

  // Chart dimensions
  const chartWidth = 470;
  const chartHeight = 200;
  const marginLeft = 50;
  const marginRight = 30;
  const marginTop = 30;
  const marginBottom = 50;
  const plotWidth = chartWidth - marginLeft - marginRight;
  const plotHeight = chartHeight - marginTop - marginBottom;

  // Calculate positions for data points
  const points = dataPoints.map((point, index) => {
    const x = marginLeft + (index / (dataPoints.length - 1 || 1)) * plotWidth;
    const y = marginTop + plotHeight - ((point.duration - scaleMin) / scaleRange) * plotHeight;
    return { ...point, x, y };
  });

  // Create path for line chart
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Generate Y-axis labels
  const yAxisLabels = [];
  const labelCount = 5;
  for (let i = 0; i < labelCount; i++) {
    const value = scaleMin + (scaleRange * i / (labelCount - 1));
    const y = marginTop + plotHeight - (i / (labelCount - 1)) * plotHeight;
    yAxisLabels.push({ value: Math.round(value), y });
  }

  return (
    <div className="duration-chart-container">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="duration-chart-svg"
        aria-label="Duration per day line chart"
      >
        {/* Grid lines */}
        {yAxisLabels.map((label, index) => (
          <line
            key={index}
            x1={marginLeft}
            y1={label.y}
            x2={chartWidth - marginRight}
            y2={label.y}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray={index === 0 ? "0" : "2,2"}
          />
        ))}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => (
          <text
            key={index}
            x={marginLeft - 10}
            y={label.y}
            textAnchor="end"
            dominantBaseline="middle"
            className="duration-axis-label"
            fill="#9ca3af"
            fontSize="11"
          >
            {label.value}
          </text>
        ))}

        {/* Line path */}
        <path
          d={linePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points and labels */}
        {points.map((point, index) => (
          <g key={index}>
            {/* Circle marker */}
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            >
              <title>{point.displayDate}: {point.duration} seconds</title>
            </circle>
            
            {/* Value label above point */}
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              className="duration-value-label"
              fill="#374151"
              fontWeight="600"
              fontSize="12"
            >
              {point.duration}s
            </text>

            {/* X-axis date label */}
            <text
              x={point.x}
              y={chartHeight - marginBottom + 15}
              textAnchor="middle"
              className="duration-date-label"
              fill="#6b7280"
              fontSize="10"
            >
              {point.displayDate}
            </text>
          </g>
        ))}

        {/* Axis lines */}
        <line
          x1={marginLeft}
          y1={marginTop}
          x2={marginLeft}
          y2={chartHeight - marginBottom}
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
        <line
          x1={marginLeft}
          y1={chartHeight - marginBottom}
          x2={chartWidth - marginRight}
          y2={chartHeight - marginBottom}
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
        
        {/* Y-axis label */}
        <text
          x={15}
          y={marginTop - 10}
          textAnchor="start"
          className="duration-axis-unit-label"
          fill="#6b7280"
          fontSize="10"
          fontWeight="500"
        >
          Seconds
        </text>
      </svg>

      {/* Legend/Info */}
      <div className="duration-chart-info">
        <div className="duration-info-item">
          <span className="duration-info-label">Total Duration:</span>
          <span className="duration-info-value">
            {formatDurationWithSeconds(dataPoints.reduce((sum, p) => sum + p.totalSeconds, 0))}
          </span>
        </div>
        <div className="duration-info-item">
          <span className="duration-info-label">Average per Day:</span>
          <span className="duration-info-value">
            {formatDurationWithSeconds(Math.round(dataPoints.reduce((sum, p) => sum + p.totalSeconds, 0) / dataPoints.length))}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Bar Chart Component for Duration Per Agent
 * Uses real-time agent duration data from agentDurations collection
 * Filters to only show agents in the users collection
 */
export function DurationPerAgentChart({ users = [] }) {
  const [timeFilter, setTimeFilter] = useState("week"); // "today" or "week"
  const [agentDurations, setAgentDurations] = useState([]);

  // Subscribe to real-time agent duration data based on time filter
  useEffect(() => {
    let unsub;
    
    if (timeFilter === "today") {
      unsub = subscribeTodayAgentDurations((data) => {
        console.log('Today agent durations:', data);
        setAgentDurations(data);
      });
    } else {
      unsub = subscribeAgentDurations(7, (data) => {
        console.log('Week agent durations (7 days):', data);
        setAgentDurations(data);
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [timeFilter]);

  // Create a set of valid agent names from users collection
  const validAgentNames = new Set(users.map(user => user.name));

  // Filter agent durations to only include agents that exist in users collection
  let agentData = agentDurations
    .filter(item => validAgentNames.has(item.agent))
    .map(item => ({
      ...item,
      displayValue: item.totalSeconds // Use seconds instead of minutes
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);

  // Limit to top 10 agents
  if (agentData.length > 10) {
    agentData = agentData.slice(0, 10);
  }

  // Empty state
  if (agentData.length === 0) {
    return (
      <div className="agent-duration-container">
        <div className="agent-duration-header">
          <h3 className="agent-duration-title">Duration</h3>
          <div className="agent-duration-filter">
            <button
              className={`filter-btn ${timeFilter === "today" ? "active" : ""}`}
              onClick={() => setTimeFilter("today")}
            >
              Today
            </button>
            <button
              className={`filter-btn ${timeFilter === "week" ? "active" : ""}`}
              onClick={() => setTimeFilter("week")}
            >
              Per Week
            </button>
          </div>
        </div>
        <div className="duration-chart-empty">
          <p style={{ fontStyle: "italic", color: "#999" }}>No Available Data</p>
        </div>
      </div>
    );
  }

  // Find max value for scaling
  const maxSeconds = Math.max(...agentData.map(a => a.totalSeconds), 1);
  
  // Round up to nearest nice number for scale
  const niceMax = Math.ceil(maxSeconds / 100) * 100 || 100;

  // Chart dimensions
  const chartWidth = 500;
  const rowHeight = 40;
  const chartHeight = agentData.length * rowHeight + 80;
  const marginLeft = 120; // Increased from 80 to accommodate longer names
  const marginRight = 60;
  const marginTop = 50;
  const marginBottom = 35;
  const barHeight = 24;
  const maxBarWidth = chartWidth - marginLeft - marginRight;

  // Bar color
  const barColor = "#4a9eff";
  
  // Generate x-axis labels (scale marks)
  const xAxisSteps = 5;
  const xAxisLabels = [];
  for (let i = 0; i <= xAxisSteps; i++) {
    const value = Math.round((niceMax / xAxisSteps) * i);
    const x = marginLeft + (i / xAxisSteps) * maxBarWidth;
    xAxisLabels.push({ value, x });
  }

  // Helper function to truncate long names
  const truncateName = (name, maxLength = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="agent-duration-container">
      {/* Filter Toggle - moved to header */}
      <div className="agent-duration-header">
        <h3 className="agent-duration-title">Duration</h3>
        <div className="agent-duration-filter">
          <button
            className={`filter-btn ${timeFilter === "today" ? "active" : ""}`}
            onClick={() => setTimeFilter("today")}
          >
            Today
          </button>
          <button
            className={`filter-btn ${timeFilter === "week" ? "active" : ""}`}
            onClick={() => setTimeFilter("week")}
          >
            Per Week
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="agent-duration-svg"
        aria-label="Duration per agent bar chart"
      >
        {/* Render each agent row */}
        {agentData.map((item, index) => {
          const y = marginTop + index * rowHeight;
          const barWidth = (item.totalSeconds / niceMax) * maxBarWidth;
          const displayName = truncateName(item.agent, 15);

          return (
            <g key={item.agent}>
              {/* Agent name */}
              <text
                x={marginLeft - 10}
                y={y + barHeight / 2 + 1}
                textAnchor="end"
                className="agent-name-label"
                fill="#374151"
                fontSize="12"
                fontWeight="400"
                dominantBaseline="middle"
              >
                <title>{item.agent}</title>
                {displayName}
              </text>

              {/* Bar */}
              <rect
                x={marginLeft}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                rx="2"
                className="agent-bar"
              >
                <title>{item.agent}: {formatDurationWithSeconds(item.totalSeconds)}</title>
              </rect>
              
              {/* Value at the end of bar */}
              <text
                x={marginLeft + barWidth + 8}
                y={y + barHeight / 2 + 1}
                className="agent-bar-value"
                fill="#374151"
                fontSize="12"
                fontWeight="600"
                dominantBaseline="middle"
              >
                {item.totalSeconds}s
              </text>
            </g>
          );
        })}
        
        {/* X-axis baseline */}
        <line
          x1={marginLeft}
          y1={chartHeight - marginBottom}
          x2={chartWidth - marginRight}
          y2={chartHeight - marginBottom}
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
        
        {/* X-axis tick marks and labels */}
        {xAxisLabels.map((label, index) => (
          <g key={index}>
            {/* Tick mark */}
            <line
              x1={label.x}
              y1={chartHeight - marginBottom}
              x2={label.x}
              y2={chartHeight - marginBottom + 5}
              stroke="#9ca3af"
              strokeWidth="1"
            />
            {/* Label */}
            <text
              x={label.x}
              y={chartHeight - marginBottom + 18}
              textAnchor="middle"
              className="agent-axis-label"
              fill="#6b7280"
              fontSize="11"
              fontWeight="400"
            >
              {label.value}
            </text>
          </g>
        ))}
        
        {/* Vertical grid lines */}
        {xAxisLabels.slice(1).map((label, index) => (
          <line
            key={index}
            x1={label.x}
            y1={marginTop}
            x2={label.x}
            y2={chartHeight - marginBottom}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />
        ))}
        
        {/* X-axis unit label */}
        <text
          x={(marginLeft + (chartWidth - marginRight)) / 2}
          y={chartHeight - 2}
          textAnchor="middle"
          className="agent-axis-unit-label"
          fill="#6b7280"
          fontSize="11"
          fontWeight="500"
        >
          Duration (seconds)
        </text>
      </svg>
    </div>
  );
}

// ========================================
// Helper Functions
// ========================================

// Helper function to format Date object to YYYY-MM-DD
function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to format Date object for chart display (MM/DD)
function formatDateForChart(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

// Helper function to format duration in seconds to HH:MM:SS format
function formatDurationWithSeconds(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Default export (for backward compatibility)
function DashboardTeamLeadCharts({ data, type = "pie" }) {
  if (type === "column") {
    return <StatusSuccessRateChart data={data} />;
  }
  return <PieChart data={data} />;
}

export default DashboardTeamLeadCharts;
