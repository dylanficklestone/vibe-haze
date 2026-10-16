import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AirQualityData, RegionId } from '../types/airQuality';
import { SINGAPORE_REGIONS, getBandColor } from '../services/api';
import {
  Layers,
  Search,
  RotateCcw,
  MapPin,
  Wind,
  X,
  Compass,
} from 'lucide-react';

interface SingaporeMapProps {
  data: AirQualityData;
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
  activeMetric: 'psi' | 'pm25';
  onChangeMetric: (metric: 'psi' | 'pm25') => void;
}

type OneMapStyle = 'Night' | 'Default' | 'Grey' | 'Original';

interface SearchResult {
  SEARCHVAL: string;
  ADDRESS: string;
  POSTAL: string;
  LATITUDE: string;
  LONGITUDE: string;
  BUILDING?: string;
  ROAD_NAME?: string;
  BLK_NO?: string;
}

const REGION_COORDINATES: Record<RegionId, [number, number]> = {
  national: [1.3521, 103.8198],
  north: [1.41803, 103.82],
  south: [1.29587, 103.82],
  east: [1.35735, 103.94],
  west: [1.35735, 103.7],
  central: [1.35735, 103.82],
};

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
  activeMetric,
  onChangeMetric,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  const [mapStyle, setMapStyle] = useState<OneMapStyle>('Night');
  const [showHeatCircles, setShowHeatCircles] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const activeRegionData = data.regions[selectedRegion];

  // Initialize Leaflet Map with OneMap Basemap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [1.3521, 103.8198],
        zoom: 12,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
      });

      // Zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OneMap Tile Layer
      const tileLayer = L.tileLayer(
        `https://www.onemap.gov.sg/maps/tiles/${mapStyle}/{z}/{x}/{y}.png`,
        {
          attribution:
            '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:14px;vertical-align:middle;display:inline-block;margin-right:4px;" alt="OneMap" /> <a href="https://www.onemap.gov.sg" target="_blank" rel="noopener">OneMap</a> &copy; Singapore Land Authority | NEA',
          maxZoom: 18,
          minZoom: 11,
        }
      ).addTo(map);

      tileLayerRef.current = tileLayer;
      markersLayerRef.current = L.layerGroup().addTo(map);
      circlesLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update OneMap Tile Layer style when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.setUrl(
      `https://www.onemap.gov.sg/maps/tiles/${mapStyle}/{z}/{x}/{y}.png`
    );
  }, [mapStyle]);

  // Update Stations & Dispersion Circles on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const circlesGroup = circlesLayerRef.current;

    if (!map || !markersGroup || !circlesGroup) return;

    markersGroup.clearLayers();
    circlesGroup.clearLayers();

    const stationRegions: RegionId[] = ['north', 'south', 'east', 'west', 'central'];

    stationRegions.forEach((regId) => {
      const coords = REGION_COORDINATES[regId];
      const reading = data.regions[regId];
      if (!reading) return;

      const value = activeMetric === 'psi' ? reading.psi24Hourly : reading.pm25OneHourly;
      const band = activeMetric === 'psi' ? reading.status : reading.pm25Status;
      const color = getBandColor(band);
      const isSelected = selectedRegion === regId;

      // 1. Dispersion Circle
      if (showHeatCircles) {
        const circle = L.circle(coords, {
          radius: 5200,
          color: color.hex,
          fillColor: color.hex,
          fillOpacity: isSelected ? 0.28 : 0.16,
          weight: isSelected ? 2 : 1,
          dashArray: isSelected ? '4, 4' : undefined,
        });

        circle.on('click', () => {
          onSelectRegion(regId);
        });

        circlesGroup.addLayer(circle);
      }

      // 2. Custom Station Marker Pill
      const customIcon = L.divIcon({
        className: 'custom-onemap-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            background: #0f172a;
            border: 2px solid ${color.hex};
            border-radius: 9999px;
            padding: 3px 10px;
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            cursor: pointer;
            transform: translate(-50%, -50%);
            white-space: nowrap;
            transition: transform 0.2s;
            ${isSelected ? 'transform: translate(-50%, -50%) scale(1.12); ring: 4px rgba(6, 182, 212, 0.4);' : ''}
          ">
            <span style="font-family: monospace; font-size: 13px; font-weight: 700; margin-right: 6px;">
              ${value}
            </span>
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: ${color.hex};
              display: inline-block;
              margin-right: 6px;
            "></span>
            <span style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 600;">
              ${SINGAPORE_REGIONS[regId].shortName}
            </span>
          </div>
        `,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });

      const marker = L.marker(coords, { icon: customIcon });

      marker.on('click', () => {
        onSelectRegion(regId);
      });

      // Popup
      marker.bindPopup(`
        <div style="padding: 12px; min-width: 180px;">
          <div style="font-size: 12px; font-weight: 700; color: #f8fafc; margin-bottom: 2px;">
            ${SINGAPORE_REGIONS[regId].name}
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">
            ${SINGAPORE_REGIONS[regId].description}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-family: monospace;">
            <div style="background: rgba(2,6,23,0.6); padding: 4px 6px; border-radius: 4px; border: 1px solid #1e293b;">
              <span style="font-size: 9px; color: #64748b; display: block;">24-hr PSI</span>
              <span style="font-size: 13px; font-weight: bold; color: #ffffff;">${reading.psi24Hourly}</span>
            </div>
            <div style="background: rgba(2,6,23,0.6); padding: 4px 6px; border-radius: 4px; border: 1px solid #1e293b;">
              <span style="font-size: 9px; color: #64748b; display: block;">1-hr PM2.5</span>
              <span style="font-size: 13px; font-weight: bold; color: #ffffff;">${reading.pm25OneHourly}</span>
            </div>
          </div>
        </div>
      `);

      markersGroup.addLayer(marker);
    });
  }, [data, activeMetric, selectedRegion, showHeatCircles, onSelectRegion]);

  // Handle address / postal search from OneMap
  const handleOneMapSearch = async (queryOverride?: string) => {
    const val = queryOverride || searchQuery.trim();
    if (!val) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/onemap?searchVal=${encodeURIComponent(val)}`);
      if (!res.ok) throw new Error('OneMap search failed');

      const result = await res.json();
      if (result.results && result.results.length > 0) {
        const topResult: SearchResult = result.results[0];
        setSearchResult(topResult);

        const lat = parseFloat(topResult.LATITUDE);
        const lng = parseFloat(topResult.LONGITUDE);

        if (mapInstanceRef.current && !isNaN(lat) && !isNaN(lng)) {
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });

          // Remove prior search marker
          if (searchMarkerRef.current) {
            mapInstanceRef.current.removeLayer(searchMarkerRef.current);
          }

          const pinIcon = L.divIcon({
            className: 'search-pin',
            html: `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translate(-50%, -100%);
              ">
                <div style="
                  background: #0284c7;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 600;
                  white-space: nowrap;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                  border: 1px solid #38bdf8;
                ">
                  ${topResult.BUILDING || topResult.ROAD_NAME} (${topResult.POSTAL})
                </div>
                <div style="
                  width: 0;
                  height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-top: 7px solid #0284c7;
                "></div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          });

          const newMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(
            mapInstanceRef.current
          );

          newMarker.bindPopup(`
            <div style="padding: 10px; max-width: 220px;">
              <div style="font-weight: bold; font-size: 12px; color: #ffffff;">${topResult.BUILDING || topResult.ROAD_NAME}</div>
              <div style="font-size: 11px; color: #94a3b8; margin: 4px 0;">${topResult.ADDRESS}</div>
              <div style="font-size: 10px; font-family: monospace; color: #38bdf8;">Postal Code: ${topResult.POSTAL}</div>
            </div>
          `).openPopup();

          searchMarkerRef.current = newMarker;
        }
      } else {
        setSearchError(`No Singapore locations found for "${val}"`);
      }
    } catch (err) {
      setSearchError('Error connecting to OneMap Singapore service');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([1.3521, 103.8198], 12, { duration: 0.8 });
    }
    if (searchMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }
    setSearchResult(null);
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 text-white overflow-hidden shadow-sm flex flex-col">
      {/* Map Control Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <img
            src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png"
            alt="OneMap Singapore"
            className="h-4 object-contain"
          />
          <span className="text-xs font-semibold text-white tracking-wide">
            OneMap Singapore
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-slate-400 font-mono">Live Geospatial Layer</span>
        </div>

        {/* Controls: Metric Switcher, Style, Layer */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 24-hr PSI vs 1-hr PM2.5 */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80">
            <button
              onClick={() => onChangeMetric('psi')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeMetric === 'psi'
                  ? 'bg-slate-100 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              24-Hour PSI
            </button>
            <button
              onClick={() => onChangeMetric('pm25')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeMetric === 'pm25'
                  ? 'bg-slate-100 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1-Hour PM2.5 (µg/m³)
            </button>
          </div>

          {/* OneMap Basemap Style Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700/80 text-xs">
            {(['Night', 'Default', 'Grey'] as OneMapStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setMapStyle(style)}
                className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                  mapStyle === style
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          {/* Dispersion field toggle */}
          <button
            onClick={() => setShowHeatCircles((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap ${
              showHeatCircles
                ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Air Quality Field</span>
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetMap}
            title="Reset Singapore Map View"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* OneMap Search Bar for Singapore Locations & Postal Codes */}
      <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleOneMapSearch();
          }}
          className="flex-1 max-w-md flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search Singapore postal code (e.g. 178903) or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-cyan-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors whitespace-nowrap shrink-0"
          >
            {isSearching ? 'Locating...' : 'Locate'}
          </button>
        </form>

        {/* Quick Location Pills */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="font-mono text-slate-500 hidden sm:inline">Try:</span>
          <button
            onClick={() => {
              setSearchQuery('178903');
              handleOneMapSearch('178903');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            SMU (178903)
          </button>
          <button
            onClick={() => {
              setSearchQuery('Marina Bay Sands');
              handleOneMapSearch('Marina Bay Sands');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Marina Bay Sands
          </button>
          <button
            onClick={() => {
              setSearchQuery('Changi Airport');
              handleOneMapSearch('Changi Airport');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Changi Airport
          </button>
        </div>
      </div>

      {searchError && (
        <div className="px-5 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <span>{searchError}</span>
          <button onClick={() => setSearchError(null)} className="p-0.5 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Map Canvas */}
      <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Selected Sector Floating HUD */}
        <div className="absolute bottom-4 left-4 z-10 max-w-[280px] sm:max-w-xs bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 shadow-xl text-xs pointer-events-auto">
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
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">24-hr PSI</span>
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {activeRegionData.psi24Hourly}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">1-hr PM2.5</span>
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {activeRegionData.pm25OneHourly}{' '}
                <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </span>
            </div>
          </div>
        </div>

        {/* Legend Overlay */}
        <div className="hidden sm:block absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 font-mono pointer-events-auto">
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
