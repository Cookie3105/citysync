// Versione Web della mappa: react-native-maps non gira nel browser, quindi sul
// web usiamo Leaflet + OpenStreetMap (mappa reale, in linea con IMapProvider/OSM).
// Su Android/iOS (Expo Go) viene invece usato AppMap.tsx con react-native-maps.
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { colors } from '../theme/theme';
import type { Mezzo, AreaLimitata } from '../models/types';

export interface AppMapHandle {
  animateTo: (lat: number, lon: number) => void;
}

type LatLon = { lat: number; lon: number };

interface Props {
  region: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
  mezzi: Mezzo[];
  selectedId?: string | null;
  onSelectMezzo?: (m: Mezzo) => void;
  userLocation?: LatLon | null;
  aree?: AreaLimitata[];
  markerColor?: (m: Mezzo) => string | undefined;
  polyline?: LatLon[];
  stazioni?: LatLon[];
  puntoArrivo?: LatLon | null;
  onMapPress?: (lat: number, lon: number) => void;
}

const areaColor = (tipo: string) =>
  tipo === 'consentita_parcheggio' ? colors.success : colors.danger;

const EMOJI: Record<string, string> = { bici: '🚲', escooter: '🛴', auto: '🚗' };

function dotIcon(bg: string, emoji: string) {
  const html = `<div style="width:30px;height:30px;border-radius:15px;background:${bg};border:2px solid #fff;` +
    `display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:15px;">${emoji}</div>`;
  return L.divIcon({ html, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
}

function MapEvents({ onPress }: { onPress?: (lat: number, lon: number) => void }) {
  useMapEvents({ click: (e) => onPress?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

function vehIcon(tipo: string, active: boolean, color?: string) {
  const size = active ? 44 : 34;
  const bg = active ? colors.accent : colors.white;
  const border = active ? colors.white : (color || colors.primary);
  const html =
    `<div style="width:${size}px;height:${size}px;border-radius:${size / 2}px;` +
    `background:${bg};border:2px solid ${border};display:flex;align-items:center;` +
    `justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:${active ? 20 : 16}px;">` +
    `${EMOJI[tipo] || '📍'}</div>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function userIcon() {
  const html =
    `<div style="width:18px;height:18px;border-radius:9px;background:#2B7BE4;` +
    `border:3px solid #fff;box-shadow:0 0 0 4px rgba(43,123,228,.25);"></div>`;
  return L.divIcon({ html, className: '', iconSize: [18, 18], iconAnchor: [9, 9] });
}

const AppMap = forwardRef<AppMapHandle, Props>(function AppMapWeb(
  { region, mezzi, selectedId, onSelectMezzo, userLocation, aree = [], markerColor,
    polyline, stazioni = [], puntoArrivo, onMapPress }, ref
) {
  const mapRef = useRef<L.Map | null>(null);

  useImperativeHandle(ref, () => ({
    animateTo: (lat, lon) => mapRef.current?.setView([lat, lon], 15, { animate: true }),
  }));

  // Carica il CSS di Leaflet a runtime (evita problemi di bundling del CSS).
  useEffect(() => {
    const id = 'leaflet-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.onload = () => mapRef.current?.invalidateSize();
      document.head.appendChild(link);
    }
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapContainer
        center={[region.latitude, region.longitude]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        ref={(m) => { mapRef.current = m || null; }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <MapEvents onPress={onMapPress} />

        {polyline && polyline.length > 1 && (
          <Polyline positions={polyline.map((p) => [p.lat, p.lon])} pathOptions={{ color: colors.accent, weight: 5, opacity: 0.85 }} />
        )}
        {stazioni.map((s, i) => (
          <Marker key={`stz-${i}`} position={[s.lat, s.lon]} icon={dotIcon(colors.success, '⚡')} />
        ))}
        {puntoArrivo && <Marker position={[puntoArrivo.lat, puntoArrivo.lon]} icon={dotIcon(colors.danger, '🏁')} />}

        {aree.map((a) =>
          a.centro ? (
            <Circle
              key={a.idArea}
              center={[a.centro.lat, a.centro.lon]}
              radius={a.raggioMetri}
              pathOptions={{ color: areaColor(a.tipoLimitazione), fillColor: areaColor(a.tipoLimitazione), fillOpacity: 0.12, weight: 1.5 }}
            />
          ) : null
        )}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon()} />
        )}

        {mezzi.map((m) =>
          m.posizione ? (
            <Marker
              key={m.idMezzo}
              position={[m.posizione.lat, m.posizione.lon]}
              icon={vehIcon(m.tipoMezzo, selectedId === m.idMezzo, markerColor?.(m))}
              eventHandlers={{ click: () => onSelectMezzo?.(m) }}
            />
          ) : null
        )}
      </MapContainer>
    </View>
  );
});

export default AppMap;
