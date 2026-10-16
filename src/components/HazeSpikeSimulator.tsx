import React, { useState } from 'react';
import { RegionId } from '../types/airQuality';
import { SINGAPORE_REGIONS } from '../services/api';
import { Flame, RotateCcw, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface HazeSpikeSimulatorProps {
  onSimulateSpike: (region: RegionId, psiValue: number, pm25Value: number) => void;
  onResetToLive: () => void;
  isSimulatedActive: boolean;
}

export const HazeSpikeSimulator: React.FC<HazeSpikeSimulatorProps> = ({
  onSimulateSpike,
  onResetToLive,
  isSimulatedActive,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('west');
  const [psiSpike, setPsiSpike] = useState<number>(145);
  const [pm25Spike, setPm25Spike] = useState<number>(68);

  const handleApplyPreset = (preset: 'moderate' | 'unhealthy' | 'very_unhealthy') => {
    if (preset === 'moderate') {
      setPsiSpike(85);
      setPm25Spike(42);
      onSimulateSpike(selectedRegion, 85, 42);
    } else if (preset === 'unhealthy') {
      setPsiSpike(145);
      setPm25Spike(68);
      onSimulateSpike(selectedRegion, 145, 68);
    } else {
      setPsiSpike(215);
      setPm25Spike(115);
      onSimulateSpike(selectedRegion, 215, 115);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 text-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Threshold Test &amp; Haze Simulator
          </h3>
        </div>

        {isSimulatedActive ? (
          <button
            onClick={onResetToLive}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Live NEA Feed</span>
          </button>
        ) : (
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live NEA Ambient Feed
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Test push notifications and alert triggers immediately by simulating a transboundary haze surge or industrial particulate spike in any Singapore sector.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
            Target Sector
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as RegionId)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white"
          >
            <option value="west">West (Jurong / Tuas)</option>
            <option value="north">North (Woodlands / Yishun)</option>
            <option value="central">Central (Bishan / AMK)</option>
            <option value="south">South (Marina / Sentosa)</option>
            <option value="east">East (Tampines / Bedok)</option>
            <option value="national">National (Island-wide)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
            Spike PSI: <span className="text-amber-400 font-bold font-mono">{psiSpike}</span>
          </label>
          <input
            type="range"
            min="60"
            max="280"
            value={psiSpike}
            onChange={(e) => setPsiSpike(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
            Spike PM2.5: <span className="text-amber-400 font-bold font-mono">{pm25Spike} µg/m³</span>
          </label>
          <input
            type="range"
            min="20"
            max="180"
            value={pm25Spike}
            onChange={(e) => setPm25Spike(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
          />
        </div>
      </div>

      {/* Preset simulation buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
        <span className="text-[11px] text-slate-500 font-mono mr-1">Quick Scenarios:</span>
        <button
          onClick={() => handleApplyPreset('unhealthy')}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-950/70 border border-amber-700/80 text-amber-300 hover:bg-amber-900 transition-colors"
        >
          Transboundary Haze (PSI 145 - Unhealthy)
        </button>
        <button
          onClick={() => handleApplyPreset('very_unhealthy')}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-950/70 border border-rose-700/80 text-rose-300 hover:bg-rose-900 transition-colors"
        >
          Severe Surge (PSI 215 - Very Unhealthy)
        </button>
        <button
          onClick={() => onSimulateSpike(selectedRegion, psiSpike, pm25Spike)}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white ml-auto transition-colors"
        >
          Apply Custom Spike
        </button>
      </div>
    </div>
  );
};
