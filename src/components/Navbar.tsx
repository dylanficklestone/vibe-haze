import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { BrowserNotificationStatus } from '../services/notifications';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadAlertCount: number;
  onOpenAlertHistory: () => void;
  onOpenAlertSettings: () => void;
  notificationStatus: BrowserNotificationStatus;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  unreadAlertCount,
  onOpenAlertHistory,
  onOpenAlertSettings,
  notificationStatus,
  isRefreshing,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('overview')}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="font-mono text-cyan-400">SG</span>
          <span>AirWatch</span>
        </button>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectTab('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'map'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Interactive Map
          </button>
          <button
            onClick={() => onSelectTab('regional')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'regional'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Regional Stations
          </button>
          <button
            onClick={() => onSelectTab('health')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'health'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Health Advisory
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'analytics'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            24h Trends
          </button>
        </nav>

        {/* Zone 3: 1 primary action & utility actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Refresh data */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Live NEA Data"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Alert Bell / Inbox Drawer Trigger */}
          <button
            onClick={onOpenAlertHistory}
            title="View Alert History"
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900" />
            )}
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenAlertSettings}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 shadow-sm ${
              notificationStatus === 'granted'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {notificationStatus === 'granted' ? 'Alert Settings' : 'Enable Push Alerts'}
          </button>
        </div>
      </div>
    </header>
  );
};
