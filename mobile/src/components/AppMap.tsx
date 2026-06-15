// Mappa nativa (Android/iOS) basata su Leaflet + OpenStreetMap dentro una WebView.
// Scelta key-free (niente chiave Google Maps). Coerente con IMapProvider (OSM).
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
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
  polyline?: LatLon[];          // percorso (UT.08)
  stazioni?: LatLon[];          // stazioni di ricarica (UT.17)
  puntoArrivo?: LatLon | null;  // destinazione percorso
  onMapPress?: (lat: number, lon: number) => void; // tap su mappa
}

function buildHtml(lat: number, lon: number) {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#e9eef0}</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lon}],14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  var markerLayer = L.layerGroup().addTo(map);
  var areaLayer = L.layerGroup().addTo(map);
  var routeLayer = L.layerGroup().addTo(map);
  var EMOJI = {bici:'\\uD83D\\uDEB2',escooter:'\\uD83D\\uDEF4',auto:'\\uD83D\\uDE97'};
  function post(o){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); } }
  function vehIcon(tipo,active,color){
    var s=active?44:34, bg=active?'${colors.accent}':'#FFFFFF', bd=active?'#FFFFFF':(color||'${colors.primary}');
    var h='<div style="width:'+s+'px;height:'+s+'px;border-radius:'+(s/2)+'px;background:'+bg+';border:2px solid '+bd+';display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:'+(active?20:16)+'px;">'+(EMOJI[tipo]||'\\uD83D\\uDCCD')+'</div>';
    return L.divIcon({html:h,className:'',iconSize:[s,s],iconAnchor:[s/2,s/2]});
  }
  function dotIcon(bg,emoji){ return L.divIcon({html:'<div style="width:30px;height:30px;border-radius:15px;background:'+bg+';border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:15px;">'+emoji+'</div>',className:'',iconSize:[30,30],iconAnchor:[15,15]}); }
  function userIcon(){ return L.divIcon({html:'<div style="width:18px;height:18px;border-radius:9px;background:#2B7BE4;border:3px solid #fff;box-shadow:0 0 0 4px rgba(43,123,228,.25)"></div>',className:'',iconSize:[18,18],iconAnchor:[9,9]}); }
  window.setData=function(d){
    markerLayer.clearLayers(); areaLayer.clearLayers(); routeLayer.clearLayers();
    (d.aree||[]).forEach(function(a){ L.circle([a.lat,a.lon],{radius:a.radius,color:a.color,fillColor:a.color,fillOpacity:0.12,weight:1.5}).addTo(areaLayer); });
    if(d.polyline && d.polyline.length>1){ L.polyline(d.polyline.map(function(p){return [p.lat,p.lon];}),{color:'${colors.accent}',weight:5,opacity:0.85}).addTo(routeLayer); }
    (d.stazioni||[]).forEach(function(s){ L.marker([s.lat,s.lon],{icon:dotIcon('${colors.success}','\\u26A1')}).addTo(routeLayer); });
    if(d.arrivo){ L.marker([d.arrivo.lat,d.arrivo.lon],{icon:dotIcon('${colors.danger}','\\uD83C\\uDFC1')}).addTo(routeLayer); }
    if(d.user){ L.marker([d.user.lat,d.user.lon],{icon:userIcon()}).addTo(markerLayer); }
    (d.mezzi||[]).forEach(function(m){
      var mk=L.marker([m.lat,m.lon],{icon:vehIcon(m.tipo,m.selected,m.color)});
      mk.on('click',function(){ post({type:'select',id:m.id}); });
      mk.addTo(markerLayer);
    });
  };
  window.flyTo=function(la,lo){ map.setView([la,lo],15,{animate:true}); };
  map.on('click',function(e){ post({type:'mappress',lat:e.latlng.lat,lon:e.latlng.lng}); });
  setTimeout(function(){ map.invalidateSize(); post({type:'ready'}); },300);
</script>
</body></html>`;
}

const AppMap = forwardRef<AppMapHandle, Props>(function AppMap(
  { region, mezzi, selectedId, onSelectMezzo, userLocation, aree = [], markerColor,
    polyline, stazioni, puntoArrivo, onMapPress }, ref
) {
  const webRef = useRef<WebView>(null);
  const ready = useRef(false);
  const lastJs = useRef<string>('');
  const mezziRef = useRef<Mezzo[]>(mezzi);
  mezziRef.current = mezzi;
  const onPressRef = useRef(onMapPress);
  onPressRef.current = onMapPress;

  const htmlRef = useRef(buildHtml(region.latitude, region.longitude));

  useImperativeHandle(ref, () => ({
    animateTo: (lat, lon) => webRef.current?.injectJavaScript(`window.flyTo(${lat},${lon}); true;`),
  }));

  const pushData = useCallback(() => {
    const payload = {
      mezzi: mezzi.filter((m) => m.posizione).map((m) => ({
        id: m.idMezzo, lat: m.posizione!.lat, lon: m.posizione!.lon, tipo: m.tipoMezzo,
        selected: selectedId === m.idMezzo, color: markerColor?.(m),
      })),
      aree: aree.filter((a) => a.centro).map((a) => ({
        lat: a.centro!.lat, lon: a.centro!.lon, radius: a.raggioMetri,
        color: a.tipoLimitazione === 'consentita_parcheggio' ? colors.success : colors.danger,
      })),
      user: userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : null,
      polyline: polyline || [],
      stazioni: stazioni || [],
      arrivo: puntoArrivo || null,
    };
    const js = `window.setData(${JSON.stringify(payload)}); true;`;
    lastJs.current = js;
    if (ready.current) webRef.current?.injectJavaScript(js);
  }, [mezzi, selectedId, aree, userLocation, markerColor, polyline, stazioni, puntoArrivo]);

  useEffect(() => { pushData(); }, [pushData]);

  const onMessage = (e: WebViewMessageEvent) => {
    let data: { type?: string; id?: string; lat?: number; lon?: number };
    try { data = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (data.type === 'ready') {
      ready.current = true;
      if (lastJs.current) webRef.current?.injectJavaScript(lastJs.current);
    } else if (data.type === 'select' && data.id) {
      const m = mezziRef.current.find((x) => x.idMezzo === data.id);
      if (m) onSelectMezzo?.(m);
    } else if (data.type === 'mappress' && data.lat != null && data.lon != null) {
      onPressRef.current?.(data.lat, data.lon);
    }
  };

  return (
    <WebView
      ref={webRef}
      style={StyleSheet.absoluteFill}
      originWhitelist={['*']}
      source={{ html: htmlRef.current }}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      androidLayerType="hardware"
    />
  );
});

export default AppMap;
