import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AirQualityData,
  AlertLogItem,
  AlertRuleConfig,
  NotificationToast,
  RegionId,
} from './types/airQuality';
import {
  fetchSingaporeAirQuality,
  getRealisticFallbackData,
  SINGAPORE_REGIONS,
  getBandColor,
} from './services/api';
import {
  notificationManager,
  BrowserNotificationStatus,
} from './services/notifications';
import { soundService } from './services/sound';

import { Navbar } from './components/Navbar';
import { SingaporeMap } from './components/SingaporeMap';
import { MetricCards } from './components/MetricCards';
import { RegionalTable } from './components/RegionalTable';
import { TrendChart } from './components/TrendChart';
import { HealthAdvisory } from './components/HealthAdvisory';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { AlertHistoryDrawer } from './components/AlertHistoryDrawer';
import { ToastContainer } from './components/ToastContainer';
import { HazeSpikeSimulator } from './components/HazeSpikeSimulator';
import { ServerlessGuide } from './components/ServerlessGuide';

import {
  AlertTriangle,
  RefreshCw,
  Info,
  Radio,
  Sliders,
  Bell,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState<AirQualityData>(getRealisticFallbackData());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('central');
  const [activeMetric, setActiveMetric] = useState<'psi' | 'pm25'>('psi');
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [alertConfig, setAlertConfig] = useState<AlertRuleConfig>(() =>
    notificationManager.getConfig()
  );
  const [alertHistory, setAlertHistory] = useState<AlertLogItem[]>(() =>
    notificationManager.getAlertHistory()
  );
  const [notificationStatus, setNotificationStatus] = useState<BrowserNotificationStatus>(() =>
    notificationManager.getPermissionStatus()
  );

  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState<boolean>(false);
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [isSimulatedActive, setIsSimulatedActive] = useState<boolean>(false);

  const configRef = useRef(alertConfig);
  configRef.current = alertConfig;

  // Add toast helper
  const addToast = useCallback((toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: NotificationToast = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handler when threshold is breached
  const handleAlertTriggered = useCallback(
    (alert: AlertLogItem) => {
      setAlertHistory((prev) => [alert, ...prev]);
      addToast({
        title: alert.title,
        message: alert.message,
        type: 'alert',
        region: alert.region,
        value: alert.value,
      });
    },
    [addToast]
  );

  // Load live data from Data.gov.sg
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const liveData = await fetchSingaporeAirQuality();
      setData(liveData);
      setIsSimulatedActive(false);

      // Check thresholds
      notificationManager.evaluateThresholds(
        liveData.regions,
        configRef.current,
        handleAlertTriggered
      );
    } catch {
      // Keep baseline
    } finally {
      setIsRefreshing(false);
    }
  }, [handleAlertTriggered]);

  // Initial load & 3-minute poll interval
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 180000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Request browser permission
  const handleRequestPermission = async () => {
    const perm = await notificationManager.requestPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      soundService.playConfirmChime();
      addToast({
        title: 'Push Alerts Enabled',
        message: 'You will receive instant alerts when air quality crosses your thresholds.',
        type: 'success',
      });
    }
  };

  // Test notification button
  const handleTriggerTestAlert = () => {
    const testTitle = '⚠️ Test Air Quality Alert: West Singapore';
    const testBody = 'Simulated 24-hr PSI has reached 145 (Unhealthy). High haze concentration detected.';

    const testAlert: AlertLogItem = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      region: 'west',
      metric: 'PSI',
      value: 145,
      threshold: alertConfig.psiThreshold,
      band: 'unhealthy',
      title: testTitle,
      message: testBody,
      healthAdvice: 'Healthy individuals should reduce outdoor physical exertion.',
      read: false,
      simulated: true,
    };

    notificationManager.saveAlertItem(testAlert);
    setAlertHistory((prev) => [testAlert, ...prev]);

    notificationManager.dispatchNotification(testTitle, testBody, {
      sound: alertConfig.soundEnabled,
      tag: 'test-alert',
    });

    addToast({
      title: testTitle,
      message: testBody,
      type: 'alert',
      region: 'west',
      value: 145,
    });
  };

  // Simulate spike in a region
  const handleSimulateSpike = (region: RegionId, psiValue: number, pm25Value: number) => {
    setIsSimulatedActive(true);

    const updatedRegions = { ...data.regions };
    const psiBand =
      psiValue <= 50
        ? 'good'
        : psiValue <= 100
        ? 'moderate'
        : psiValue <= 200
        ? 'unhealthy'
        : psiValue <= 300
        ? 'very_unhealthy'
        : 'hazardous';

    const pm25Band =
      pm25Value <= 12
        ? 'normal'
        : pm25Value <= 55
        ? 'elevated'
        : pm25Value <= 150
        ? 'high'
        : 'very_high';

    if (region === 'national') {
      // Spike all regions
      (Object.keys(updatedRegions) as RegionId[]).forEach((key) => {
        updatedRegions[key] = {
          ...updatedRegions[key],
          psi24Hourly: psiValue,
          pm25OneHourly: pm25Value,
          status: psiBand,
          pm25Status: pm25Band,
        };
      });
    } else {
      updatedRegions[region] = {
        ...updatedRegions[region],
        psi24Hourly: psiValue,
        pm25OneHourly: pm25Value,
        status: psiBand,
        pm25Status: pm25Band,
      };
    }

    setData((prev) => ({
      ...prev,
      nationalPSI: Math.max(prev.nationalPSI, Math.round(psiValue * 0.9)),
      nationalPM25: Math.max(prev.nationalPM25, Math.round(pm25Value * 0.9)),
      regions: updatedRegions,
      statusMessage: `Simulated Haze Event: ${SINGAPORE_REGIONS[region].name} at PSI ${psiValue}`,
    }));

    // Trigger threshold evaluation immediately
    notificationManager.evaluateThresholds(
      updatedRegions,
      configRef.current,
      handleAlertTriggered
    );
  };

  // Reset to live
  const handleResetToLive = () => {
    loadData();
    soundService.playConfirmChime();
    addToast({
      title: 'Restored Live Data',
      message: 'Air quality data has been synchronized with official NEA Singapore feeds.',
      type: 'info',
    });
  };

  // Alert history helpers
  const handleClearHistory = () => {
    notificationManager.clearAlertHistory();
    setAlertHistory([]);
  };

  const handleMarkAllRead = () => {
    const updated = alertHistory.map((item) => ({ ...item, read: true }));
    setAlertHistory(updated);
    try {
      localStorage.setItem('sg_airwatch_alert_history_v1', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const unreadAlertCount = alertHistory.filter((item) => !item.read).length;

  // Determine if any sector is in an unhealthy state
  const unhealthySectors = Object.entries(data.regions).filter(
    ([id, r]) => id !== 'national' && (r.psi24Hourly > 100 || r.pm25OneHourly > 55)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadAlertCount={unreadAlertCount}
        onOpenAlertHistory={() => setIsAlertHistoryOpen(true)}
        onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
        notificationStatus={notificationStatus}
        isRefreshing={isRefreshing}
        onRefresh={loadData}
      />

      {/* Emergency Alert Banner (visible when any sector crosses unhealthy limits) */}
      {unhealthySectors.length > 0 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Air Quality Alert:{' '}
                {unhealthySectors.map(([id, r]) => `${SINGAPORE_REGIONS[id as RegionId].name} (PSI ${r.psi24Hourly})`).join(' · ')}{' '}
                exceeds healthy thresholds.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('health')}
              className="underline text-slate-950 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              View Health Guidelines &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="border-b border-slate-850 bg-slate-900/60 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulatedActive ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulatedActive ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </span>
            <span className="font-mono">{data.statusMessage}</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Last Updated: <span className="text-slate-200">{data.updateTimestamp}</span></span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <button
              onClick={() => setIsAlertSettingsOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-sans"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Threshold Rules (PSI {alertConfig.psiThreshold} / PM2.5 {alertConfig.pm25Threshold})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards Ribbon */}
        <MetricCards
          data={data}
          onSelectRegion={(reg) => {
            setSelectedRegion(reg);
            setActiveTab('map');
          }}
          onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
        />

        {/* Tab 1: Overview & Interactive Map */}
        {(activeTab === 'overview' || activeTab === 'map') && (
          <div className="space-y-6">
            {/* Interactive Singapore Map Component */}
            <SingaporeMap
              data={data}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              activeMetric={activeMetric}
              onChangeMetric={setActiveMetric}
            />

            {/* Haze Spike Simulator for immediate threshold testing */}
            <HazeSpikeSimulator
              onSimulateSpike={handleSimulateSpike}
              onResetToLive={handleResetToLive}
              isSimulatedActive={isSimulatedActive}
            />

            {/* Quick Regional Table preview */}
            <RegionalTable
              data={data}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />
          </div>
        )}

        {/* Tab 2: Regional Stations Detailed View */}
        {activeTab === 'regional' && (
          <div className="space-y-6">
            <RegionalTable
              data={data}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />

            <HazeSpikeSimulator
              onSimulateSpike={handleSimulateSpike}
              onResetToLive={handleResetToLive}
              isSimulatedActive={isSimulatedActive}
            />
          </div>
        )}

        {/* Tab 3: Health Advisory & Activity Safety Checker */}
        {activeTab === 'health' && (
          <HealthAdvisory data={data} selectedRegion={selectedRegion} />
        )}

        {/* Tab 4: 24-Hour Trend & Trajectory */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <TrendChart data={data} selectedRegion={selectedRegion} />
            <RegionalTable
              data={data}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />
          </div>
        )}

        {/* Tab 5: Serverless Backend Connector Guide */}
        {activeTab === 'serverless' && <ServerlessGuide />}
      </main>

      {/* Bottom Footer adhering to clean anti-slop guidelines */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">SG AirWatch</span>
            <span>·</span>
            <span>Data Source: National Environment Agency (NEA) via Data.gov.sg</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('serverless')}
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Serverless Backend Connector</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsAlertSettingsOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Push Notification Config
            </button>
          </div>
        </div>
      </footer>

      {/* Modals, Drawers & Toast Containers */}
      <AlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        config={alertConfig}
        onSaveConfig={(newConfig) => {
          setAlertConfig(newConfig);
          notificationManager.saveConfig(newConfig);
        }}
        notificationStatus={notificationStatus}
        onRequestPermission={handleRequestPermission}
        onTriggerTestAlert={handleTriggerTestAlert}
      />

      <AlertHistoryDrawer
        isOpen={isAlertHistoryOpen}
        onClose={() => setIsAlertHistoryOpen(false)}
        alerts={alertHistory}
        onClearHistory={handleClearHistory}
        onMarkAllRead={handleMarkAllRead}
        onSelectRegion={(reg) => {
          setSelectedRegion(reg);
          setActiveTab('map');
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
