import React, { useState } from 'react';
import { AirQualityData, RegionId } from '../types/airQuality';
import { SINGAPORE_REGIONS, getBandColor } from '../services/api';
import { ArrowUpDown, MapPin, Eye } from 'lucide-react';

interface RegionalTableProps {
  data: AirQualityData;
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
}

type SortField = 'name' | 'psi24Hourly' | 'pm25OneHourly' | 'pm10TwentyFourHourly' | 'o3EightHourly' | 'no2OneHourly';

export const RegionalTable: React.FC<RegionalTableProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
}) => {
  const [sortField, setSortField] = useState<SortField>('psi24Hourly');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [showSecondaryPollutants, setShowSecondaryPollutants] = useState<boolean>(false);

  const regionList: RegionId[] = ['north', 'south', 'east', 'west', 'central', 'national'];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedRegions = [...regionList].sort((a, b) => {
    if (sortField === 'name') {
      const nameA = SINGAPORE_REGIONS[a].name;
      const nameB = SINGAPORE_REGIONS[b].name;
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }

    const valA = data.regions[a][sortField];
    const valB = data.regions[b][sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Official NEA Regional Monitoring Stations
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Updated every hour by National Environment Agency ambient monitoring network
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSecondaryPollutants((v) => !v)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {showSecondaryPollutants ? 'Hide Minor Pollutants' : 'Show Minor Pollutants (PM10, O3, NO2)'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <th className="py-3 px-4">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Sector / Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4">
                <button
                  onClick={() => handleSort('psi24Hourly')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>24-hr PSI</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4">PSI Status</th>
              <th className="py-3 px-4">
                <button
                  onClick={() => handleSort('pm25OneHourly')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>1-hr PM2.5</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4">PM2.5 Band</th>

              {showSecondaryPollutants && (
                <>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSort('pm10TwentyFourHourly')}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>PM10 (24h)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSort('o3EightHourly')}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Ozone O3 (8h)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSort('no2OneHourly')}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>NO2 (1h)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                </>
              )}

              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
            {sortedRegions.map((regId) => {
              const info = SINGAPORE_REGIONS[regId];
              const reading = data.regions[regId];
              const isSelected = selectedRegion === regId;
              const psiColor = getBandColor(reading.status);
              const pm25Color = getBandColor(reading.pm25Status);

              return (
                <tr
                  key={regId}
                  onClick={() => onSelectRegion(regId)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-50/60 dark:bg-cyan-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {info.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {info.majorAreas.join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
                      {reading.psi24Hourly}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase border ${psiColor.bg} ${psiColor.text} ${psiColor.border}`}
                    >
                      {reading.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
                      {reading.pm25OneHourly}{' '}
                      <span className="text-xs text-slate-400 font-normal">µg/m³</span>
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase border ${pm25Color.bg} ${pm25Color.text} ${pm25Color.border}`}
                    >
                      {reading.pm25Status.replace('_', ' ')}
                    </span>
                  </td>

                  {showSecondaryPollutants && (
                    <>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {reading.pm10TwentyFourHourly} <span className="text-xs text-slate-400">µg/m³</span>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {reading.o3EightHourly} <span className="text-xs text-slate-400">µg/m³</span>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {reading.no2OneHourly} <span className="text-xs text-slate-400">µg/m³</span>
                      </td>
                    </>
                  )}

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRegion(regId);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Focus</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
