import React from 'react';
import { AlertLogItem, RegionId } from '../types/airQuality';
import { SINGAPORE_REGIONS, getBandColor } from '../services/api';
import { Bell, Trash2, CheckCheck, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface AlertHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertLogItem[];
  onClearHistory: () => void;
  onMarkAllRead: () => void;
  onSelectRegion: (region: RegionId) => void;
}

export const AlertHistoryDrawer: React.FC<AlertHistoryDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearHistory,
  onMarkAllRead,
  onSelectRegion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Alert Incident History
            </h2>
            <span className="font-mono text-xs text-slate-400">({alerts.length})</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        {alerts.length > 0 && (
          <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear log</span>
            </button>
          </div>
        )}

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-1">
                No Triggered Alerts
              </div>
              <p className="max-w-[240px] text-slate-500">
                When air quality in any Singapore region crosses your configured limits, incidents will be logged here.
              </p>
            </div>
          ) : (
            alerts.map((item) => {
              const color = getBandColor(item.band);
              const regionName = SINGAPORE_REGIONS[item.region]?.name || item.region;
              const formattedTime = new Date(item.timestamp).toLocaleTimeString('en-SG', {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectRegion(item.region);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                    item.read
                      ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {formattedTime}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${color.bg} ${color.text} ${color.border}`}
                    >
                      {item.band.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                    {item.title}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Sector: {regionName}</span>
                    <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-medium">
                      Inspect Sector <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
