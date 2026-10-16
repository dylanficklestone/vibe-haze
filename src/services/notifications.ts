import { AlertLogItem, AlertRuleConfig, RegionalReading, RegionId } from '../types/airQuality';
import { soundService } from './sound';

export type BrowserNotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

const ALERT_STORAGE_KEY = 'sg_airwatch_alert_history_v1';
const CONFIG_STORAGE_KEY = 'sg_airwatch_alert_config_v1';

export const DEFAULT_CONFIG: AlertRuleConfig = {
  enabled: true,
  psiThreshold: 100, // NEA Unhealthy boundary
  pm25Threshold: 55, // NEA Band III High boundary
  targetRegion: 'all',
  soundEnabled: true,
  vibrateEnabled: true,
  notifyOnRecovery: true,
};

export class NotificationManager {
  private lastAlertTimestamp: Record<string, number> = {};
  private minIntervalBetweenAlertsMs = 30000; // 30 seconds debounce per region

  /**
   * Get current browser notification permission status
   */
  public getPermissionStatus(): BrowserNotificationStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as BrowserNotificationStatus;
  }

  /**
   * Request browser permission for system notifications
   */
  public async requestPermission(): Promise<BrowserNotificationStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as BrowserNotificationStatus;
    } catch {
      return 'denied';
    }
  }

  /**
   * Get saved alert configuration from localStorage
   */
  public getConfig(): AlertRuleConfig {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_CONFIG;
  }

  /**
   * Save alert configuration
   */
  public saveConfig(config: AlertRuleConfig) {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore
    }
  }

  /**
   * Get historical alert logs
   */
  public getAlertHistory(): AlertLogItem[] {
    try {
      const saved = localStorage.getItem(ALERT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  /**
   * Save alert item to history
   */
  public saveAlertItem(item: AlertLogItem): AlertLogItem[] {
    try {
      const current = this.getAlertHistory();
      const updated = [item, ...current].slice(0, 100); // Keep last 100
      localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [item];
    }
  }

  /**
   * Clear alert history
   */
  public clearAlertHistory() {
    try {
      localStorage.removeItem(ALERT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Dispatch system notification and audio chime
   */
  public dispatchNotification(
    title: string,
    body: string,
    options: {
      tag?: string;
      sound?: boolean;
      requireInteraction?: boolean;
    } = {}
  ): boolean {
    // 1. Play audio chime if requested
    if (options.sound !== false) {
      soundService.playAlertChime();
    }

    // 2. Fire browser notification if granted
    if (this.getPermissionStatus() === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: options.tag || 'sg-air-quality-alert',
          requireInteraction: options.requireInteraction ?? false,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        return true;
      } catch (e) {
        console.warn('Could not launch system notification:', e);
      }
    }

    return false;
  }

  /**
   * Evaluate regional readings against configured thresholds
   */
  public evaluateThresholds(
    regions: Record<RegionId, RegionalReading>,
    config: AlertRuleConfig,
    onAlertTriggered: (alert: AlertLogItem) => void
  ) {
    if (!config.enabled) return;

    const targetList: RegionId[] =
      config.targetRegion === 'all'
        ? ['north', 'south', 'east', 'west', 'central']
        : [config.targetRegion];

    const now = Date.now();

    for (const regionId of targetList) {
      const reading = regions[regionId];
      if (!reading) continue;

      // Check PSI threshold
      if (reading.psi24Hourly >= config.psiThreshold) {
        const alertKey = `psi-${regionId}-${reading.status}`;
        const lastTime = this.lastAlertTimestamp[alertKey] || 0;

        if (now - lastTime > this.minIntervalBetweenAlertsMs) {
          this.lastAlertTimestamp[alertKey] = now;

          const regionLabel = regionId.toUpperCase();
          const title = `⚠️ Unhealthy Air Quality: ${regionLabel} (PSI ${reading.psi24Hourly})`;
          const body = `24-Hour PSI is ${reading.psi24Hourly} (${reading.status.toUpperCase()}). Reduce strenuous outdoor exertion.`;

          const alertItem: AlertLogItem = {
            id: `alert-psi-${regionId}-${now}`,
            timestamp: new Date().toISOString(),
            region: regionId,
            metric: 'PSI',
            value: reading.psi24Hourly,
            threshold: config.psiThreshold,
            band: reading.status,
            title,
            message: body,
            healthAdvice: getHealthAdvisoryText(reading.psi24Hourly),
            read: false,
          };

          this.saveAlertItem(alertItem);
          this.dispatchNotification(title, body, {
            sound: config.soundEnabled,
            tag: `psi-${regionId}`,
          });
          onAlertTriggered(alertItem);
        }
      }

      // Check 1-hr PM2.5 threshold
      if (reading.pm25OneHourly >= config.pm25Threshold) {
        const alertKey = `pm25-${regionId}-${reading.pm25Status}`;
        const lastTime = this.lastAlertTimestamp[alertKey] || 0;

        if (now - lastTime > this.minIntervalBetweenAlertsMs) {
          this.lastAlertTimestamp[alertKey] = now;

          const regionLabel = regionId.toUpperCase();
          const title = `⚠️ Elevated PM2.5: ${regionLabel} (${reading.pm25OneHourly} µg/m³)`;
          const body = `1-Hour PM2.5 is ${reading.pm25OneHourly} µg/m³ (${reading.pm25Status.toUpperCase()}). High particulate level detected.`;

          const alertItem: AlertLogItem = {
            id: `alert-pm25-${regionId}-${now}`,
            timestamp: new Date().toISOString(),
            region: regionId,
            metric: 'PM2.5',
            value: reading.pm25OneHourly,
            threshold: config.pm25Threshold,
            band: reading.pm25Status,
            title,
            message: body,
            healthAdvice: 'Vulnerable persons (elderly, pregnant, children, respiratory conditions) should avoid outdoor activities.',
            read: false,
          };

          this.saveAlertItem(alertItem);
          this.dispatchNotification(title, body, {
            sound: config.soundEnabled,
            tag: `pm25-${regionId}`,
          });
          onAlertTriggered(alertItem);
        }
      }
    }
  }
}

export function getHealthAdvisoryText(psi: number): string {
  if (psi <= 50) {
    return 'Air quality is Good. Normal outdoor activities can continue for all population groups.';
  } else if (psi <= 100) {
    return 'Air quality is Moderate. Normal activities can continue. Unusually sensitive people should monitor their symptoms.';
  } else if (psi <= 200) {
    return 'Air quality is Unhealthy. Healthy people should reduce prolonged outdoor exertion. Vulnerable groups (elderly, children, respiratory issues) should avoid outdoor exertion.';
  } else if (psi <= 300) {
    return 'Air quality is Very Unhealthy. Healthy persons should minimize outdoor exertion. Vulnerable groups should remain indoors with doors and windows closed.';
  } else {
    return 'Air quality is Hazardous. All outdoor activities should be avoided. Stay indoors and use air purifiers (HEPA).';
  }
}

export const notificationManager = new NotificationManager();
