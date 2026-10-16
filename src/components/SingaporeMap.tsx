import React, { useState } from 'react';
import {
  AirQualityData,
  RegionId,
} from '../types/airQuality';
import { SINGAPORE_REGIONS, getBandColor } from '../services/api';
import {
  Wind,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Maximize2,
  Navigation,
} from 'lucide-react';

interface SingaporeMapProps {
  data: AirQualityData;
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
  activeMetric: 'psi' | 'pm25';
  onChangeMetric: (metric: 'psi' | 'pm25') => void;
}

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
  activeMetric,
  onChangeMetric,
}) => {
  const [showWindVectors, setShowWindVectors] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);

  const activeRegionData = data.regions[selectedRegion];

  // Colors for regions based on active metric
  const getRegionValueAndBand = (regId: RegionId) => {
    const reading = data.regions[regId];
    if (!reading) return { value: 0, band: 'good' as const };
    if (activeMetric === 'psi') {
      return { value: reading.psi24Hourly, band: reading.status };
    } else {
      return { value: reading.pm25OneHourly, band: reading.pm25Status };
    }
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.2, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.85, z - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  // Station markers placement
  const stationPins: {
    id: RegionId;
    name: string;
    sub: string;
    x: number;
    y: number;
  }[] = [
    { id: 'north', name: 'North', sub: 'Woodlands', x: 490, y: 155 },
    { id: 'central', name: 'Central', sub: 'Bishan', x: 495, y: 300 },
    { id: 'south', name: 'South', sub: 'Marina Bay', x: 510, y: 440 },
    { id: 'west', name: 'West', sub: 'Jurong East', x: 230, y: 325 },
    { id: 'east', name: 'East', sub: 'Tampines', x: 745, y: 285 },
  ];

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 text-white overflow-hidden shadow-sm flex flex-col">
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">Interactive Air Map</span>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-slate-300 font-medium">Singapore Island</span>
        </div>

        {/* Metric Selector & Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric buttons */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onChangeMetric('psi')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeMetric === 'psi'
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              24-Hour PSI
            </button>
            <button
              onClick={() => onChangeMetric('pm25')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeMetric === 'pm25'
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1-Hour PM2.5 (µg/m³)
            </button>
          </div>

          {/* Layer toggles */}
          <button
            onClick={() => setShowWindVectors((v) => !v)}
            title="Toggle Wind Stream Vectors"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap ${
              showWindVectors
                ? 'bg-cyan-950/60 border-cyan-700/70 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind ({data.weather.windDirection} {data.weather.windSpeedKmH} km/h)</span>
          </button>

          <button
            onClick={() => setShowHeatmap((v) => !v)}
            title="Toggle Particle Heatmap Dispersion"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap ${
              showHeatmap
                ? 'bg-amber-950/60 border-amber-700/70 text-amber-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dispersion Field</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Viewport */}
      <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[510px] overflow-hidden bg-slate-950 flex items-center justify-center cursor-default select-none">
        {/* Subtle Water & Strait Grid Background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Straits labels */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest text-slate-600 uppercase pointer-events-none">
          Straits of Johor / Malaysia Border
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest text-slate-600 uppercase pointer-events-none">
          Singapore Strait / Riau Archipelago
        </div>

        {/* SVG Container with Zoom */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 0 980 620"
            className="w-full h-full max-h-full max-w-full drop-shadow-xl"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.6))' }}
          >
            <defs>
              {/* Radial gradients for regional atmospheric dispersion */}
              <radialGradient id="grad-north" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={getBandColor(getRegionValueAndBand('north').band).hex} stopOpacity="0.45" />
                <stop offset="100%" stopColor={getBandColor(getRegionValueAndBand('north').band).hex} stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-south" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={getBandColor(getRegionValueAndBand('south').band).hex} stopOpacity="0.45" />
                <stop offset="100%" stopColor={getBandColor(getRegionValueAndBand('south').band).hex} stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-east" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={getBandColor(getRegionValueAndBand('east').band).hex} stopOpacity="0.45" />
                <stop offset="100%" stopColor={getBandColor(getRegionValueAndBand('east').band).hex} stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-west" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={getBandColor(getRegionValueAndBand('west').band).hex} stopOpacity="0.45" />
                <stop offset="100%" stopColor={getBandColor(getRegionValueAndBand('west').band).hex} stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-central" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={getBandColor(getRegionValueAndBand('central').band).hex} stopOpacity="0.45" />
                <stop offset="100%" stopColor={getBandColor(getRegionValueAndBand('central').band).hex} stopOpacity="0" />
              </radialGradient>

              {/* Marker pulse glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Heatmap overlay (dispersion field) */}
            {showHeatmap && (
              <g className="transition-opacity duration-500 opacity-80 pointer-events-none">
                <circle cx="490" cy="155" r="140" fill="url(#grad-north)" />
                <circle cx="230" cy="325" r="180" fill="url(#grad-west)" />
                <circle cx="495" cy="300" r="130" fill="url(#grad-central)" />
                <circle cx="510" cy="440" r="140" fill="url(#grad-south)" />
                <circle cx="745" cy="285" r="160" fill="url(#grad-east)" />
              </g>
            )}

            {/* ===================== REGION PATHS (SINGAPORE MAINLAND & ISLANDS) ===================== */}
            <g id="singapore-regions" className="cursor-pointer">
              {/* WEST REGION: Tuas, Jurong, Clementi, Bukit Batok */}
              <path
                id="region-west"
                d="M 60,370 L 105,395 L 140,430 L 175,410 L 220,400 L 290,410 L 340,380 L 360,320 L 375,250 L 335,210 L 275,185 L 210,210 L 155,265 L 115,310 Z"
                className={`transition-all duration-200 stroke-slate-700/80 stroke-2 ${
                  selectedRegion === 'west'
                    ? 'fill-cyan-950/80 stroke-cyan-400 stroke-[3px]'
                    : hoveredRegion === 'west'
                    ? 'fill-slate-800 stroke-slate-500'
                    : 'fill-slate-900/90 hover:fill-slate-800/80'
                }`}
                onClick={() => onSelectRegion('west')}
                onMouseEnter={() => setHoveredRegion('west')}
                onMouseLeave={() => setHoveredRegion(null)}
              />

              {/* NORTH REGION: Woodlands, Sembawang, Yishun, Sungei Buloh */}
              <path
                id="region-north"
                d="M 335,210 L 375,250 L 400,240 L 440,240 L 530,230 L 575,220 L 590,170 L 575,120 L 520,95 L 450,90 L 380,115 L 340,150 Z"
                className={`transition-all duration-200 stroke-slate-700/80 stroke-2 ${
                  selectedRegion === 'north'
                    ? 'fill-cyan-950/80 stroke-cyan-400 stroke-[3px]'
                    : hoveredRegion === 'north'
                    ? 'fill-slate-800 stroke-slate-500'
                    : 'fill-slate-900/90 hover:fill-slate-800/80'
                }`}
                onClick={() => onSelectRegion('north')}
                onMouseEnter={() => setHoveredRegion('north')}
                onMouseLeave={() => setHoveredRegion(null)}
              />

              {/* CENTRAL REGION: Bishan, Toa Payoh, Ang Mo Kio, Novena, Bukit Timah */}
              <path
                id="region-central"
                d="M 360,320 L 375,250 L 440,240 L 530,230 L 580,240 L 575,320 L 550,370 L 485,385 L 430,370 L 370,360 Z"
                className={`transition-all duration-200 stroke-slate-700/80 stroke-2 ${
                  selectedRegion === 'central'
                    ? 'fill-cyan-950/80 stroke-cyan-400 stroke-[3px]'
                    : hoveredRegion === 'central'
                    ? 'fill-slate-800 stroke-slate-500'
                    : 'fill-slate-900/90 hover:fill-slate-800/80'
                }`}
                onClick={() => onSelectRegion('central')}
                onMouseEnter={() => setHoveredRegion('central')}
                onMouseLeave={() => setHoveredRegion(null)}
              />

              {/* EAST REGION: Tampines, Bedok, Changi, Pasir Ris */}
              <path
                id="region-east"
                d="M 575,220 L 580,240 L 575,320 L 610,360 L 670,375 L 750,375 L 850,340 L 890,290 L 870,240 L 810,210 L 730,195 L 650,200 Z"
                className={`transition-all duration-200 stroke-slate-700/80 stroke-2 ${
                  selectedRegion === 'east'
                    ? 'fill-cyan-950/80 stroke-cyan-400 stroke-[3px]'
                    : hoveredRegion === 'east'
                    ? 'fill-slate-800 stroke-slate-500'
                    : 'fill-slate-900/90 hover:fill-slate-800/80'
                }`}
                onClick={() => onSelectRegion('east')}
                onMouseEnter={() => setHoveredRegion('east')}
                onMouseLeave={() => setHoveredRegion(null)}
              />

              {/* SOUTH REGION: Marina Bay, Tanjong Pagar, Bukit Merah, Keppel */}
              <path
                id="region-south"
                d="M 370,360 L 430,370 L 485,385 L 550,370 L 610,360 L 615,410 L 580,455 L 520,470 L 450,470 L 380,440 L 350,410 Z"
                className={`transition-all duration-200 stroke-slate-700/80 stroke-2 ${
                  selectedRegion === 'south'
                    ? 'fill-cyan-950/80 stroke-cyan-400 stroke-[3px]'
                    : hoveredRegion === 'south'
                    ? 'fill-slate-800 stroke-slate-500'
                    : 'fill-slate-900/90 hover:fill-slate-800/80'
                }`}
                onClick={() => onSelectRegion('south')}
                onMouseEnter={() => setHoveredRegion('south')}
                onMouseLeave={() => setHoveredRegion(null)}
              />

              {/* ISLANDS: Jurong Island */}
              <path
                id="jurong-island"
                d="M 180,455 C 220,445 280,455 260,505 C 230,525 180,515 170,480 Z"
                className="fill-slate-800 stroke-slate-700 hover:fill-slate-700 transition-colors"
                onClick={() => onSelectRegion('west')}
              />

              {/* ISLANDS: Sentosa */}
              <path
                id="sentosa-island"
                d="M 460,495 C 490,485 530,490 535,510 C 510,525 465,515 460,495 Z"
                className="fill-slate-800 stroke-slate-700 hover:fill-slate-700 transition-colors"
                onClick={() => onSelectRegion('south')}
              />

              {/* ISLANDS: Pulau Ubin */}
              <path
                id="pulau-ubin"
                d="M 730,165 C 770,155 810,160 800,185 C 770,195 725,185 730,165 Z"
                className="fill-slate-800 stroke-slate-700 hover:fill-slate-700 transition-colors"
                onClick={() => onSelectRegion('east')}
              />

              {/* ISLANDS: Pulau Tekong */}
              <path
                id="pulau-tekong"
                d="M 830,165 C 875,155 905,175 895,215 C 860,225 830,205 830,165 Z"
                className="fill-slate-800 stroke-slate-700 hover:fill-slate-700 transition-colors"
                onClick={() => onSelectRegion('east')}
              />
            </g>

            {/* Region name labels */}
            <g className="pointer-events-none select-none text-[13px] font-semibold tracking-wide">
              <text x="490" y="140" textAnchor="middle" fill="#94A3B8" className="uppercase font-mono text-[11px]">
                North
              </text>
              <text x="230" y="305" textAnchor="middle" fill="#94A3B8" className="uppercase font-mono text-[11px]">
                West
              </text>
              <text x="485" y="285" textAnchor="middle" fill="#94A3B8" className="uppercase font-mono text-[11px]">
                Central
              </text>
              <text x="750" y="265" textAnchor="middle" fill="#94A3B8" className="uppercase font-mono text-[11px]">
                East
              </text>
              <text x="500" y="425" textAnchor="middle" fill="#94A3B8" className="uppercase font-mono text-[11px]">
                South
              </text>
            </g>

            {/* Wind Direction Vectors (animated stream arrows) */}
            {showWindVectors && (
              <g className="pointer-events-none opacity-60">
                {[
                  { x: 180, y: 560 },
                  { x: 380, y: 550 },
                  { x: 620, y: 560 },
                  { x: 320, y: 390 },
                  { x: 520, y: 360 },
                  { x: 740, y: 360 },
                  { x: 420, y: 190 },
                  { x: 660, y: 170 },
                ].map((pos, idx) => (
                  <g
                    key={idx}
                    transform={`translate(${pos.x}, ${pos.y}) rotate(${data.weather.windAngleDeg - 180})`}
                  >
                    <line
                      x1="0"
                      y1="-20"
                      x2="0"
                      y2="20"
                      stroke="#38BDF8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="4 3"
                    />
                    <polygon points="-4,-14 0,-24 4,-14" fill="#38BDF8" />
                  </g>
                ))}
              </g>
            )}

            {/* Station Pins & Readings */}
            <g id="station-markers">
              {stationPins.map((pin) => {
                const { value, band } = getRegionValueAndBand(pin.id);
                const color = getBandColor(band);
                const isSelected = selectedRegion === pin.id;

                return (
                  <g
                    key={pin.id}
                    transform={`translate(${pin.x}, ${pin.y})`}
                    className="cursor-pointer group"
                    onClick={() => onSelectRegion(pin.id)}
                  >
                    {/* Ring highlight if selected */}
                    {isSelected && (
                      <circle
                        r="34"
                        fill="none"
                        stroke={color.hex}
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ transformOrigin: '0px 0px', animationDuration: '10s' }}
                      />
                    )}

                    {/* Background badge pill for reading */}
                    <rect
                      x="-42"
                      y="-18"
                      width="84"
                      height="36"
                      rx="18"
                      fill="#0F172A"
                      stroke={color.hex}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="transition-all duration-200 group-hover:stroke-white"
                      filter="url(#glow)"
                    />

                    {/* Numeric Value */}
                    <text
                      x="-14"
                      y="5"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      className="font-mono font-bold text-[16px] tabular-nums"
                    >
                      {value}
                    </text>

                    {/* Metric Unit / Band Icon */}
                    <circle cx="24" cy="0" r="5" fill={color.hex} />

                    {/* Station Town Name Sub-label */}
                    <text
                      x="0"
                      y="28"
                      textAnchor="middle"
                      fill="#94A3B8"
                      className="font-mono text-[10px] uppercase tracking-wider group-hover:fill-white"
                    >
                      {pin.sub}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Selected Region Quick HUD Card Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 max-w-[280px] sm:max-w-xs bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/70 shadow-lg text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div>
              <div className="font-semibold text-white text-sm">
                {SINGAPORE_REGIONS[selectedRegion].name}
              </div>
              <div className="text-[11px] text-slate-400">
                {SINGAPORE_REGIONS[selectedRegion].description}
              </div>
            </div>
            <div
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${
                getBandColor(activeRegionData.status).bg
              } ${getBandColor(activeRegionData.status).text} ${
                getBandColor(activeRegionData.status).border
              }`}
            >
              {activeRegionData.status.replace('_', ' ')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">24-hr PSI</span>
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {activeRegionData.psi24Hourly}
              </span>
            </div>
            <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">1-hr PM2.5</span>
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {activeRegionData.pm25OneHourly}{' '}
                <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </span>
            </div>
          </div>
        </div>

        {/* Legend Overlay (Bottom Right) */}
        <div className="hidden sm:block absolute bottom-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/70 text-[11px] text-slate-300 font-mono">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            {activeMetric === 'psi' ? 'NEA PSI Scale' : '1-Hr PM2.5 Scale (µg/m³)'}
          </div>
          {activeMetric === 'psi' ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>0 – 50: Good</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span>51 – 100: Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>101 – 200: Unhealthy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>201 – 300: Very Unhealthy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <span>&gt; 300: Hazardous</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>0 – 12: Normal (Band I)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span>13 – 55: Elevated (Band II)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>56 – 150: High (Band III)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>&gt; 150: Very High (Band IV)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
