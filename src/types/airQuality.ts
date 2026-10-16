export type RegionId = 'national' | 'north' | 'south' | 'east' | 'west' | 'central';

export interface RegionMetadata {
  id: RegionId;
  name: string;
  shortName: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  svgCenter: {
    x: number;
    y: number;
  };
  majorAreas: string[];
}

export type AirQualityBand = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
export type PM25Band = 'normal' | 'elevated' | 'high' | 'very_high';

export interface RegionalReading {
  region: RegionId;
  psi24Hourly: number;
  pm25OneHourly: number;
  pm25TwentyFourHourly: number;
  pm10TwentyFourHourly: number;
  o3EightHourly: number;
  no2OneHourly: number;
  so2TwentyFourHourly: number;
  coEightHourly: number;
  status: AirQualityBand;
  pm25Status: PM25Band;
}

export interface AirQualityData {
  timestamp: string;
  updateTimestamp: string;
  isSimulated: boolean;
  statusMessage: string;
  nationalPSI: number;
  nationalPM25: number;
  regions: Record<RegionId, RegionalReading>;
  hourlyHistory: HourlyDataPoint[];
  weather: {
    temperature: number;
    humidity: number;
    windDirection: string;
    windSpeedKmH: number;
    windAngleDeg: number;
    summary: string;
  };
}

export interface HourlyDataPoint {
  hour: string; // e.g. "14:00"
  timestamp: string;
  nationalPSI: number;
  nationalPM25: number;
  north: number;
  south: number;
  east: number;
  west: number;
  central: number;
}

export interface AlertRuleConfig {
  enabled: boolean;
  psiThreshold: number; // e.g. 100
  pm25Threshold: number; // e.g. 55
  targetRegion: RegionId | 'all';
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  notifyOnRecovery: boolean;
}

export interface AlertLogItem {
  id: string;
  timestamp: string;
  region: RegionId;
  metric: 'PSI' | 'PM2.5';
  value: number;
  threshold: number;
  band: AirQualityBand | PM25Band;
  title: string;
  message: string;
  healthAdvice: string;
  read: boolean;
  simulated?: boolean;
}

export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'alert' | 'info' | 'success';
  timestamp: string;
  region?: string;
  value?: number;
}
