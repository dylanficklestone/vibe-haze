import React from 'react';
import { AirQualityData, RegionId } from '../types/airQuality';
import { SINGAPORE_REGIONS, getBandColor } from '../services/api';
import { Wind, Thermometer, Droplets, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface MetricCardsProps {
  data: AirQualityData;
  onSelectRegion: (region: RegionId) => void;
  onOpenAlertSettings: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  data,
  onSelectRegion,
  onOpenAlertSettings,
}) => {
  // Find highest reading region
  const regionalEntries = Object.entries(data.regions).filter(
    ([id]) => id !== 'national'
  ) as [RegionId, (typeof data.regions)[RegionId]][];

  const highestPSIEntry = [...regionalEntries].sort(
    (a, b) => b[1].psi24Hourly - a[1].psi24Hourly
  )[0];

  const highestPM25Entry = [...regionalEntries].sort(
    (a, b) => b[1].pm25OneHourly - a[1].pm25OneHourly
  )[0];

  const nationalPSIBandColor = getBandColor(data.regions.national.status);
  const nationalPM25BandColor = getBandColor(data.regions.national.pm25Status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. National 24-hr PSI */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider">Singapore National</span>
            <span>24-Hour Average</span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {data.nationalPSI}
            </span>
            <span
              className={`text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${nationalPSIBandColor.bg} ${nationalPSIBandColor.text} ${nationalPSIBandColor.border}`}
            >
              {data.regions.national.status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Pollutant Standards Index (PSI)
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Healthy range: 0 – 50</span>
          <span>Target: &lt; 100</span>
        </div>
      </div>

      {/* 2. National 1-hr PM2.5 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider">Fine Particulate</span>
            <span>1-Hour Concentration</span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {data.nationalPM25}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">µg/m³</span>
            <span
              className={`text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${nationalPM25BandColor.bg} ${nationalPM25BandColor.text} ${nationalPM25BandColor.border}`}
            >
              {data.regions.national.pm25Status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Microscopic particles ≤ 2.5 micrometers
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Band I (Normal): 0 – 12</span>
          <span>Band II: 13 – 55</span>
        </div>
      </div>

      {/* 3. Regional Peak / High Risk Sector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider">Island Peak Sector</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>

          <div className="my-2">
            <button
              onClick={() => onSelectRegion(highestPSIEntry[0])}
              className="group text-left flex items-center gap-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              <span className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-500">
                {SINGAPORE_REGIONS[highestPSIEntry[0]].name}
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-transform group-hover:translate-x-0.5" />
            </button>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Highest reading: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">PSI {highestPSIEntry[1].psi24Hourly}</span> · PM2.5 <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{highestPM25Entry[1].pm25OneHourly} µg/m³</span>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Automated Threshold Alert</span>
          <button
            onClick={onOpenAlertSettings}
            className="text-cyan-600 dark:text-cyan-400 font-medium hover:underline"
          >
            Configure Rules
          </button>
        </div>
      </div>

      {/* 4. Singapore Meteorological & Haze Outlook */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider">Wind &amp; Climate</span>
            <Wind className="w-4 h-4 text-cyan-500" />
          </div>

          <div className="my-2">
            <div className="text-base font-semibold text-slate-900 dark:text-white">
              {data.weather.windDirection} ({data.weather.windSpeedKmH} km/h)
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
              {data.weather.summary}
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-slate-400" />
            {data.weather.temperature}°C
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-slate-400" />
            {data.weather.humidity}% Humidity
          </span>
        </div>
      </div>
    </div>
  );
};
