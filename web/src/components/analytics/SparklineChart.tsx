'use client';

import { useMemo, useRef, useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SparklineChartProps {
  data: DataPoint[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  /** Show full line chart with axes, labels, tooltip */
  variant?: 'line' | 'area' | 'bar';
  className?: string;
  showAxes?: boolean;
  showTooltip?: boolean;
  yLabel?: string;
}

function smoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev[0] + curr[0]) / 2;
    path += ` C ${cpX} ${prev[1]}, ${cpX} ${curr[1]}, ${curr[0]} ${curr[1]}`;
  }
  return path;
}

export function SparklineChart({
  data,
  height = 180,
  strokeColor = '#1ECEFA',
  fillColor = 'rgba(30,206,250,0.1)',
  variant = 'area',
  className = '',
  showAxes = true,
  showTooltip = true,
  yLabel,
}: SparklineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const PAD_LEFT = showAxes ? 44 : 8;
  const PAD_RIGHT = 12;
  const PAD_TOP = 12;
  const PAD_BOTTOM = showAxes ? 28 : 8;

  const { points, areaPath, linePath, yTicks, xLabels, maxVal } = useMemo(() => {
    if (data.length === 0) return { points: [], areaPath: '', linePath: '', yTicks: [], xLabels: [], maxVal: 0 };

    const values = data.map((d) => d.value);
    const maxVal = Math.max(...values, 1);
    const minVal = 0;
    const range = maxVal - minVal || 1;

    const innerW = 800 - PAD_LEFT - PAD_RIGHT; // use fixed 800 viewBox width
    const innerH = height - PAD_TOP - PAD_BOTTOM;

    const points: Array<[number, number]> = data.map((d, i) => [
      PAD_LEFT + (i / Math.max(data.length - 1, 1)) * innerW,
      PAD_TOP + innerH - ((d.value - minVal) / range) * innerH,
    ]);

    const linePath = smoothPath(points);
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1][0]} ${PAD_TOP + innerH} L ${points[0][0]} ${PAD_TOP + innerH} Z`
        : '';

    // Y axis ticks
    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const val = (maxVal / tickCount) * i;
      const y = PAD_TOP + innerH - (i / tickCount) * innerH;
      return { val: Math.round(val), y };
    });

    // X labels — only show up to 7 evenly spaced
    const xStep = Math.max(1, Math.floor(data.length / 7));
    const xLabels = data
      .map((d, i) => ({ i, label: d.label, x: points[i][0] }))
      .filter((_, i) => i % xStep === 0 || i === data.length - 1);

    return { points, areaPath, linePath, yTicks, xLabels, maxVal };
  }, [data, height, PAD_LEFT, PAD_BOTTOM, PAD_TOP, PAD_RIGHT]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip || points.length === 0) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgW = rect.width;
    const mouseX = e.clientX - rect.left;
    // Map mouseX from pixel space to viewBox space
    const vbX = (mouseX / svgW) * 800;

    // Find nearest point
    let nearest = 0;
    let minDist = Infinity;
    points.forEach(([px], i) => {
      const dist = Math.abs(px - vbX);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });

    const [px, py] = points[nearest];
    const screenX = (px / 800) * svgW + rect.left - rect.left;
    const screenY = (py / height) * rect.height;

    setTooltip({
      x: screenX,
      y: screenY,
      label: data[nearest].label,
      value: data[nearest].value,
    });
  };

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-xs text-slate-500 ${className}`} style={{ height }}>
        No data for this period
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 800 ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        aria-label="Chart"
        role="img"
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showAxes && yTicks.map((tick) => (
          <line
            key={tick.y}
            x1={PAD_LEFT}
            y1={tick.y}
            x2={800 - PAD_RIGHT}
            y2={tick.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}

        {/* Y axis labels */}
        {showAxes && yTicks.map((tick) => (
          <text
            key={`y-${tick.val}`}
            x={PAD_LEFT - 6}
            y={tick.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="rgba(148,163,184,0.7)"
          >
            {tick.val >= 1000 ? `${(tick.val / 1000).toFixed(1)}k` : tick.val}
          </text>
        ))}

        {/* X axis labels */}
        {showAxes && xLabels.map(({ label, x, i }) => (
          <text
            key={`x-${i}`}
            x={x}
            y={height - 4}
            textAnchor="middle"
            fontSize="9"
            fill="rgba(148,163,184,0.55)"
          >
            {label.length > 5 ? label.slice(5) : label}
          </text>
        ))}

        {/* Y axis line */}
        {showAxes && (
          <line
            x1={PAD_LEFT}
            y1={PAD_TOP}
            x2={PAD_LEFT}
            y2={height - PAD_BOTTOM}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        )}

        {/* Area fill */}
        {variant === 'area' && areaPath && (
          <path d={areaPath} fill="url(#chartFill)" />
        )}

        {/* Bar chart */}
        {variant === 'bar' && points.map(([px, py], i) => {
          const innerH = height - PAD_TOP - PAD_BOTTOM;
          const barW = Math.max(4, (800 - PAD_LEFT - PAD_RIGHT) / (data.length * 1.5));
          const barH = height - PAD_BOTTOM - py;
          return (
            <rect
              key={i}
              x={px - barW / 2}
              y={py}
              width={barW}
              height={Math.max(barH, 2)}
              rx="2"
              fill={strokeColor}
              opacity="0.7"
            />
          );
        })}

        {/* Line */}
        {variant !== 'bar' && linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots at data points */}
        {variant !== 'bar' && points.map(([px, py], i) => (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={tooltip?.label === data[i].label ? 4 : 2.5}
            fill={strokeColor}
            opacity={tooltip?.label === data[i].label ? 1 : 0.6}
          />
        ))}

        {/* Tooltip vertical line */}
        {tooltip && showTooltip && (() => {
          const idx = data.findIndex((d) => d.label === tooltip.label);
          if (idx < 0 || !points[idx]) return null;
          const [px, py] = points[idx];
          return (
            <line
              x1={px} y1={PAD_TOP}
              x2={px} y2={height - PAD_BOTTOM}
              stroke={strokeColor}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
          );
        })()}
      </svg>

      {/* Tooltip bubble */}
      {tooltip && showTooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/15 bg-[#0D1520] px-2.5 py-1.5 text-xs shadow-xl"
          style={{
            left: Math.min(tooltip.x, 160),
            top: Math.max(tooltip.y - 40, 4),
            transform: 'translateX(-50%)',
          }}
        >
          <p className="font-semibold text-white">{tooltip.value.toLocaleString()}</p>
          <p className="text-slate-400">{tooltip.label}</p>
        </div>
      )}
    </div>
  );
}
