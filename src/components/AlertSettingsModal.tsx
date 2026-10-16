import React, { useState } from 'react';
import { AlertRuleConfig, RegionId } from '../types/airQuality';
import {
  notificationManager,
  BrowserNotificationStatus,
} from '../services/notifications';
import { soundService } from '../services/sound';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Sliders,
  Check,
  X,
  ShieldAlert,
  Send,
  HelpCircle,
} from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AlertRuleConfig;
  onSaveConfig: (config: AlertRuleConfig) => void;
  notificationStatus: BrowserNotificationStatus;
  onRequestPermission: () => Promise<void>;
  onTriggerTestAlert: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  notificationStatus,
  onRequestPermission,
  onTriggerTestAlert,
}) => {
  const [localConfig, setLocalConfig] = useState<AlertRuleConfig>(config);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    soundService.playConfirmChime();
    onClose();
  };

  const handleTestNotification = () => {
    setTestSent(true);
    onTriggerTestAlert();
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Air Quality Alert &amp; Push Notification Rules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get alerted the moment Singapore air quality degrades
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Browser Push Permission Status Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Browser Push Permission
              </span>
              <span
                className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  notificationStatus === 'granted'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : notificationStatus === 'denied'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                }`}
              >
                {notificationStatus === 'granted'
                  ? 'Active / Granted'
                  : notificationStatus === 'denied'
                  ? 'Blocked by Browser'
                  : 'Pending Permission'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              {notificationStatus === 'granted'
                ? 'Desktop & mobile push alerts are active. You will receive system notifications when PSI or PM2.5 crosses your defined thresholds.'
                : notificationStatus === 'denied'
                ? 'Push notifications are currently blocked in your browser settings. To enable, click the lock icon in your address bar and toggle Notifications to "Allow".'
                : 'Click below to allow Singapore air quality alerts to be pushed directly to your system tray even when this tab is in the background.'}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {notificationStatus !== 'granted' && (
                <button
                  onClick={onRequestPermission}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-xs"
                >
                  Request Browser Permission
                </button>
              )}

              <button
                onClick={handleTestNotification}
                disabled={testSent}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testSent ? 'Alert Dispatched!' : 'Send Test Notification'}</span>
              </button>
            </div>
          </div>

          {/* Master Enable Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Active Threshold Monitoring
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Trigger alerts when readings exceed selected limits
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.enabled}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* PSI Threshold Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  24-Hour PSI Alert Level
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Alert when 24-hr PSI reaches or exceeds this value
                </span>
              </div>
              <span className="font-mono text-xl font-bold tabular-nums text-cyan-600 dark:text-cyan-400">
                {localConfig.psiThreshold}
              </span>
            </div>

            <input
              type="range"
              min="50"
              max="250"
              step="5"
              value={localConfig.psiThreshold}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  psiThreshold: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            {/* Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, psiThreshold: 80 })}
                className={`px-2 py-0.5 text-[11px] rounded border ${
                  localConfig.psiThreshold === 80
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                80 (Early Notice)
              </button>
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, psiThreshold: 100 })}
                className={`px-2 py-0.5 text-[11px] rounded border ${
                  localConfig.psiThreshold === 100
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                100 (NEA Unhealthy)
              </button>
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, psiThreshold: 200 })}
                className={`px-2 py-0.5 text-[11px] rounded border ${
                  localConfig.psiThreshold === 200
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                200 (Very Unhealthy)
              </button>
            </div>
          </div>

          {/* PM2.5 Threshold Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  1-Hour PM2.5 Alert Level (µg/m³)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Alert when fine particulate level reaches or exceeds
                </span>
              </div>
              <span className="font-mono text-xl font-bold tabular-nums text-cyan-600 dark:text-cyan-400">
                {localConfig.pm25Threshold}{' '}
                <span className="text-xs font-normal text-slate-400">µg/m³</span>
              </span>
            </div>

            <input
              type="range"
              min="20"
              max="160"
              step="5"
              value={localConfig.pm25Threshold}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  pm25Threshold: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            {/* Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, pm25Threshold: 35 })}
                className={`px-2 py-0.5 text-[11px] rounded border ${
                  localConfig.pm25Threshold === 35
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                35 µg/m³ (Elevated)
              </button>
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, pm25Threshold: 55 })}
                className={`px-2 py-0.5 text-[11px] rounded border ${
                  localConfig.pm25Threshold === 55
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                55 µg/m³ (NEA Band III High)
              </button>
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, pm25Threshold: 100 })}
                className={`px-2 py-0.5 text-[11px] rounded border ${
                  localConfig.pm25Threshold === 100
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                100 µg/m³ (Severe)
              </button>
            </div>
          </div>

          {/* Target Region Scope */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Target Alert Region
            </label>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Only notify for air degradation in this specific sector
            </div>
            <select
              value={localConfig.targetRegion}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  targetRegion: e.target.value as RegionId | 'all',
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Singapore (Any region crossing threshold)</option>
              <option value="north">North Region Only (Woodlands, Yishun)</option>
              <option value="south">South Region Only (Marina Bay, Sentosa)</option>
              <option value="east">East Region Only (Tampines, Bedok, Changi)</option>
              <option value="west">West Region Only (Jurong, Clementi, Tuas)</option>
              <option value="central">Central Region Only (Bishan, Ang Mo Kio)</option>
            </select>
          </div>

          {/* Sound alert option */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {localConfig.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Audio Chime on Alert
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Play Web Audio synthetic chime on alert arrival
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localConfig.soundEnabled}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, soundEnabled: e.target.checked })
              }
              className="w-4 h-4 text-cyan-600 rounded border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Save Rules</span>
          </button>
        </div>
      </div>
    </div>
  );
};
