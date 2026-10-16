import React, { useState } from 'react';
import { AirQualityData, RegionId } from '../types/airQuality';
import { SINGAPORE_REGIONS } from '../services/api';
import { Clock } from 'lucide-react';

interface TrendChartProps {
  data: AirQualityData;
  selectedRegion: RegionId;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, selectedRegion }) => {
  const [metric, setMetric] = useState<'psi' | 'pm25'>('psi');
  const [activeRegion, setActiveRegion] = useState<RegionId>(selectedRegion);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const history = data.hourlyHistory;
  if (!history || history.length === 0) return null;

  // Extract values
  const values = history.map((pt) => {
    if (metric === 'psi') {
      if (activeRegion === 'national') return pt.nationalPSI;
      return pt[activeRegion as 'north' | 'south' | 'east' | 'west' | 'central'] ?? pt.nationalPSI;
    } else {
      // For PM2.5: scale regional factor
      const ratio =
        data.regions[activeRegion].pm25OneHourly / Math.max(1, data.regions.national.pm25OneHourly);
      return Math.round(pt.nationalPM25 * ratio);
    }
  });

  const maxValue = Math.max(...values, metric === 'psi' ? 120 : 70);
  const chartHeight = 240;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 30;

  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  const getX = (idx: number) => paddingX + (idx / (history.length - 1)) * innerW;
  const getY = (val: number) => paddingY + innerH - (val / maxValue) * innerH;

  // Path generator
  const points = values.map((val, idx) => ({ x: getX(idx), y: getY(val), val }));
  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${paddingY + innerH} L ${points[0].x},${
    paddingY + innerH
  } Z`;

  // Threshold lines
  const unhealthyThreshold = metric === 'psi' ? 100 : 55;
  const unhealthyY = getY(unhealthyThreshold);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              24-Hour Trend &amp; Historical Trajectory
            </h2>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hourly progression showing threshold crossings across Singapore
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Region selector */}
          <select
            value={activeRegion}
            onChange={(e) => setActiveRegion(e.target.value as RegionId)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="national">Island-wide (National)</option>
            <option value="north">North (Woodlands)</option>
            <option value="south">South (Marina Bay)</option>
            <option value="east">East (Tampines)</option>
            <option value="west">West (Jurong)</option>
            <option value="central">Central (Bishan)</option>
          </select>

          {/* Metric switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMetric('psi')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                metric === 'psi'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              24-Hour PSI
            </button>
            <button
              onClick={() => setMetric('pm25')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                metric === 'pm25'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              1-Hour PM2.5
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[600px] select-none"
        >
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const val = Math.round(pct * maxValue);
            const y = paddingY + innerH - pct * innerH;
            return (
              <g key={idx} className="text-slate-400">
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] font-mono tabular-nums fill-slate-400"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Unhealthy threshold guideline */}
          {unhealthyY >= paddingY && unhealthyY <= paddingY + innerH && (
            <g>
              <line
                x1={paddingX}
                y1={unhealthyY}
                x2={chartWidth - paddingX}
                y2={unhealthyY}
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text
                x={chartWidth - paddingX}
                y={unhealthyY - 5}
                textAnchor="end"
                className="text-[10px] font-mono font-semibold fill-amber-500"
              >
                {metric === 'psi' ? 'PSI 100 (Unhealthy Threshold)' : '55 µg/m³ (High PM2.5)'}
              </text>
            </g>
          )}

          {/* Area under curve */}
          <path d={areaD} fill="url(#area-gradient)" />

          {/* Primary Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive points & hover listener */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 6 : 3.5}
                fill={hoveredIndex === idx ? '#06B6D4' : '#0F172A'}
                stroke="#06B6D4"
                strokeWidth={hoveredIndex === idx ? 3 : 2}
                className="transition-all"
              />
              {/* Invisible larger hit target */}
              <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
            </g>
          ))}

          {/* X-axis labels (every 3 hours) */}
          {history.map((pt, idx) => {
            if (idx % 3 !== 0 && idx !== history.length - 1) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={chartHeight - 8}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-400"
              >
                {pt.hour}
              </text>
            );
          })}
        </svg>

        {/* Hovered Tooltip HUD */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-md text-xs font-mono"
            style={{
              left: `${Math.min(80, Math.max(10, (hoveredIndex / (history.length - 1)) * 90))}%`,
            }}
          >
            <div className="text-slate-400 text-[10px]">Time: {history[hoveredIndex].hour}</div>
            <div className="font-bold text-cyan-400 text-sm">
              {metric.toUpperCase()}: {values[hoveredIndex]}{' '}
              {metric === 'pm25' && <span className="text-[10px] text-slate-400">µg/m³</span>}
            </div>
            <div className="text-[10px] text-slate-300">
              Region: {SINGAPORE_REGIONS[activeRegion].name}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500 rounded" />
            <span>Recorded 24h trajectory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 border-t border-dashed" />
            <span>Unhealthy trigger threshold</span>
          </div>
        </div>
        <div className="font-mono text-[11px]">
          Current: <span className="font-bold text-slate-900 dark:text-white">{values[values.length - 1]}</span> {metric === 'pm25' ? 'µg/m³' : 'PSI'}
        </div>
      </div>
    </div>
  );
};
