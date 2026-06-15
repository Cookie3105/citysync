import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import type { Mezzo } from '../types';
import { statoMezzoColor, statoMezzoLabel, tipoEmoji, tipoLabel } from '../labels';

const CENTRO: [number, number] = [41.1187, 16.8719]; // Bari

function icon(m: Mezzo) {
  const color = statoMezzoColor[m.statOperativo];
  const html =
    `<div style="width:30px;height:30px;border-radius:15px;background:#fff;border:3px solid ${color};` +
    `display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.3);">` +
    `${tipoEmoji[m.tipoMezzo]}</div>`;
  return L.divIcon({ html, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
}

export function FleetMap({ mezzi }: { mezzi: Mezzo[] }) {
  const conPos = mezzi.filter((m) => m.posizione);
  const center: [number, number] = conPos[0]?.posizione
    ? [conPos[0].posizione!.lat, conPos[0].posizione!.lon]
    : CENTRO;

  return (
    <div className="map-box">
      <MapContainer center={center} zoom={13} scrollWheelZoom>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {conPos.map((m) => (
          <Marker key={m.idMezzo} position={[m.posizione!.lat, m.posizione!.lon]} icon={icon(m)}>
            <Popup>
              <b>{tipoEmoji[m.tipoMezzo]} {tipoLabel[m.tipoMezzo]} · {m.codiceMezzo}</b>
              <br />
              Stato: {statoMezzoLabel[m.statOperativo]}
              <br />
              Energia: {m.livelloEnergia}%
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
