import React, { useState } from 'react';
import { AirQualityData, RegionId } from '../types/airQuality';
import { SINGAPORE_REGIONS } from '../services/api';
import { ShieldCheck, HeartHandshake, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';

interface HealthAdvisoryProps {
  data: AirQualityData;
  selectedRegion: RegionId;
}

type UserGroup = 'healthy' | 'vulnerable' | 'chronic';
type ActivityType = 'vigorous' | 'moderate' | 'commute' | 'indoor';

export const HealthAdvisory: React.FC<HealthAdvisoryProps> = ({
  data,
  selectedRegion,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<UserGroup>('healthy');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('vigorous');

  const reading = data.regions[selectedRegion];
  const psi = reading.psi24Hourly;
  const pm25 = reading.pm25OneHourly;

  // Compute safety assessment
  const getSafetyResult = (group: UserGroup, activity: ActivityType, currentPsi: number) => {
    if (currentPsi <= 50) {
      return {
        safe: true,
        status: 'Safe / Normal Activities',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        advice: 'Air quality is Good. No activity restrictions apply for any population group.',
        maskNeeded: false,
      };
    }

    if (currentPsi <= 100) {
      if (group === 'chronic' && activity === 'vigorous') {
        return {
          safe: true,
          status: 'Proceed with Caution',
          color: 'text-sky-700 bg-sky-50 border-sky-300 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800',
          advice: 'Moderate air quality. Individuals with asthma or heart conditions should take note of breathing symptoms during prolonged intense exertion.',
          maskNeeded: false,
        };
      }
      return {
        safe: true,
        status: 'Safe / Normal Activities',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        advice: 'Normal outdoor activities may continue as usual.',
        maskNeeded: false,
      };
    }

    if (currentPsi <= 200) {
      // Unhealthy (101 - 200)
      if (group === 'chronic' || group === 'vulnerable') {
        return {
          safe: false,
          status: 'Avoid Outdoor Exertion',
          color: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
          advice: 'Unhealthy air band! Elderly, children, and people with lung/heart disease should avoid all outdoor physical exertion.',
          maskNeeded: true,
        };
      }
      if (activity === 'vigorous') {
        return {
          safe: false,
          status: 'Reduce Outdoor Exertion',
          color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
          advice: 'Healthy individuals should reduce prolonged or strenuous outdoor physical exertion.',
          maskNeeded: false,
        };
      }
      return {
        safe: true,
        status: 'Permissible with Monitoring',
        color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        advice: 'Normal casual outdoor activities are acceptable, but take regular breaks indoors.',
        maskNeeded: false,
      };
    }

    // Very Unhealthy & Hazardous (> 200)
    return {
      safe: false,
      status: 'Stay Indoors / High Hazard',
      color: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
      advice: 'Air quality is Very Unhealthy or Hazardous! Keep doors and windows closed. Use HEPA air purifiers. Wear N95 respirator if leaving home.',
      maskNeeded: true,
    };
  };

  const assessment = getSafetyResult(selectedGroup, selectedActivity, psi);

  return (
    <div className="space-y-6">
      {/* Activity Safety Checker Tool */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-cyan-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Interactive NEA Activity Safety Checker
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Select your health profile and planned activity to evaluate current safety in{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {SINGAPORE_REGIONS[selectedRegion].name}
          </span>{' '}
          (PSI {psi} · PM2.5 {pm25} µg/m³).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* User Profile Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Your Health Profile
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setSelectedGroup('healthy')}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  selectedGroup === 'healthy'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white font-medium'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-semibold">Healthy Adult</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  General working-age population with no chronic health conditions
                </div>
              </button>

              <button
                onClick={() => setSelectedGroup('vulnerable')}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  selectedGroup === 'vulnerable'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white font-medium'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-semibold">Elderly (≥65), Pregnant Women &amp; Children</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Increased susceptibility to respiratory irritation and fine dust
                </div>
              </button>

              <button
                onClick={() => setSelectedGroup('chronic')}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  selectedGroup === 'chronic'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white font-medium'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-semibold">Chronic Lung or Heart Condition</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Asthma, COPD, bronchitis, ischemic heart disease
                </div>
              </button>
            </div>
          </div>

          {/* Activity Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              2. Planned Activity
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setSelectedActivity('vigorous')}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  selectedActivity === 'vigorous'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white font-medium'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-semibold">Strenuous Outdoor Exercise</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Running, marathon training, road cycling, football, crossfit
                </div>
              </button>

              <button
                onClick={() => setSelectedActivity('moderate')}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  selectedActivity === 'moderate'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white font-medium'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-semibold">Casual Outdoor Activities</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Walking, park strolls, outdoor dining at hawker centers, playground
                </div>
              </button>

              <button
                onClick={() => setSelectedActivity('commute')}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  selectedActivity === 'commute'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white font-medium'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-semibold">Daily Transit &amp; Commute</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Walking to MRT stations, bus stops, short errands
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Personalized Result Banner */}
        <div className={`p-4 rounded-xl border ${assessment.color} transition-all`}>
          <div className="flex items-start gap-3">
            {assessment.safe ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-sm font-bold">{assessment.status}</div>
              <div className="text-xs mt-1 leading-relaxed">{assessment.advice}</div>

              {assessment.maskNeeded && (
                <div className="mt-2 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Recommendation: Use N95 respirator mask if prolonged outdoor exposure is required.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official Singapore NEA Advisory Matrix Reference */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          Singapore National Environment Agency (NEA) PSI Advisory Table
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Ministry of Health (MOH) and NEA official health guide for haze and particulate exposure
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold font-mono">
                <th className="p-3">24-hr PSI</th>
                <th className="p-3">Air Quality Descriptor</th>
                <th className="p-3">Healthy Population</th>
                <th className="p-3">Vulnerable Groups (Elderly, Kids, Chronic Illness)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">0 – 50</td>
                <td className="p-3 font-semibold">Good</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">Normal activities</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">Normal activities</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">51 – 100</td>
                <td className="p-3 font-semibold">Moderate</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">Normal activities</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">Normal activities</td>
              </tr>
              <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">101 – 200</td>
                <td className="p-3 font-semibold text-amber-700 dark:text-amber-300">Unhealthy (Alert Threshold)</td>
                <td className="p-3 text-slate-700 dark:text-slate-200 font-medium">Reduce prolonged/strenuous outdoor physical exertion</td>
                <td className="p-3 text-rose-700 dark:text-rose-400 font-medium">Avoid prolonged/strenuous outdoor physical exertion</td>
              </tr>
              <tr className="bg-rose-50/50 dark:bg-rose-950/20">
                <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">201 – 300</td>
                <td className="p-3 font-semibold text-rose-700 dark:text-rose-300">Very Unhealthy</td>
                <td className="p-3 text-rose-700 dark:text-rose-300 font-medium">Avoid prolonged/strenuous outdoor physical exertion</td>
                <td className="p-3 text-rose-800 dark:text-rose-300 font-bold">Avoid outdoor physical exertion. Stay indoors.</td>
              </tr>
              <tr className="bg-purple-50/50 dark:bg-purple-950/20">
                <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">&gt; 300</td>
                <td className="p-3 font-semibold text-purple-700 dark:text-purple-300">Hazardous</td>
                <td className="p-3 text-purple-700 dark:text-purple-300 font-bold">Minimize outdoor activities. Stay indoors.</td>
                <td className="p-3 text-purple-800 dark:text-purple-300 font-bold">Remain indoors. Close windows. Turn on HEPA purifier.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
