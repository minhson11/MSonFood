import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon URLs in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STORE = { name: 'MSon Food', lat: 21.0285, lng: 105.8542 };

/**
 * Geocode a Vietnamese address string → { lat, lng } via Nominatim (OSM, free).
 * Returns null on failure.
 */
const geocodeAddress = async (address) => {
  if (!address) return null;
  try {
    const q = encodeURIComponent(address + ', Việt Nam');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=0`,
      { headers: { 'Accept-Language': 'vi', 'User-Agent': 'MSonFoodApp/1.0' } }
    );
    const data = await res.json();
    if (data?.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch {
    return null;
  }
};

const makePulseIcon = (emoji, bg) => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:40px;height:40px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${bg};opacity:0.25;animation:order-map-pulse 1.8s infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.25);font-size:18px;">
        ${emoji}
      </div>
    </div>`,
  iconSize:   [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

const OrderMap = ({ address, height = 300 }) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layersRef    = useRef(null);

  const [geocoding, setGeocoding] = useState(false);
  const [destCoords, setDestCoords] = useState(null);
  const [geoError, setGeoError]   = useState(false);

  /* ── Geocode address once ── */
  useEffect(() => {
    if (!address) return;
    setGeocoding(true);
    geocodeAddress(address).then((coords) => {
      setGeocoding(false);
      if (coords) { setDestCoords(coords); setGeoError(false); }
      else        { setGeoError(true); }
    });
  }, [address]);

  /* ── Initialize Leaflet map ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [STORE.lat, STORE.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // CartoDB Voyager tiles – clean, no watermark obstruction
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '© OpenStreetMap contributors © CARTO',
    }).addTo(map);

    layersRef.current = L.featureGroup().addTo(map);
    mapRef.current    = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ── Update markers whenever destCoords change ── */
  useEffect(() => {
    const map    = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // Store marker 🍔
    const storeIcon = makePulseIcon('🍔', '#ea580c');
    const storeMarker = L.marker([STORE.lat, STORE.lng], { icon: storeIcon })
      .bindPopup(`<b>${STORE.name}</b><br/><span style="font-size:12px;color:#666;">Điểm xuất phát</span>`);
    layers.addLayer(storeMarker);

    if (destCoords) {
      // Destination marker 📍
      const destIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:36px;height:44px;">
            <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#c0392b;border:3px solid #fff;box-shadow:0 4px 12px rgba(192,57,43,0.5);display:flex;align-items:center;justify-content:center;">
              <div style="width:10px;height:10px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div>
            </div>
          </div>`,
        iconSize:    [36, 44],
        iconAnchor:  [18, 44],
        popupAnchor: [0, -44],
      });

      const destMarker = L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
        .bindPopup(`<b>Địa chỉ giao hàng</b><br/><span style="font-size:12px;color:#666;">${address}</span>`)
        .openPopup();
      layers.addLayer(destMarker);

      // Dashed route line
      const routeLine = L.polyline(
        [[STORE.lat, STORE.lng], [destCoords.lat, destCoords.lng]],
        { color: '#c0392b', weight: 3, dashArray: '8 7', opacity: 0.8 }
      );
      layers.addLayer(routeLine);

      // Fit bounds
      map.fitBounds(layers.getBounds(), { padding: [50, 50], maxZoom: 15, animate: true });
    } else {
      map.setView([STORE.lat, STORE.lng], 13);
    }

    setTimeout(() => map.invalidateSize(), 250);
  }, [destCoords, address]);

  return (
    <div style={{ position: 'relative', height, borderRadius: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes order-map-pulse {
          0%,100% { transform:scale(1);opacity:.25; }
          50%      { transform:scale(1.6);opacity:0; }
        }
        .leaflet-control-attribution { font-size:9px !important; }
      `}</style>

      {/* Leaflet container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading overlay */}
      {geocoding && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 500,
        }}>
          <div style={{ width:32,height:32,border:'3px solid #e5e7eb',borderTop:'3px solid #c0392b',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>
          <span style={{ fontSize:12, color:'#888', fontWeight:600 }}>Đang tải bản đồ...</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Geocode error badge */}
      {geoError && !geocoding && (
        <div style={{
          position:'absolute', bottom:12, left:12, zIndex:600,
          background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)',
          borderRadius:50, padding:'5px 12px', fontSize:11, fontWeight:600, color:'#888',
          boxShadow:'0 2px 8px rgba(0,0,0,0.12)', border:'1px solid #f0f0f5',
          display:'flex', alignItems:'center', gap:6,
        }}>
          ⚠️ Không thể xác định tọa độ địa chỉ
        </div>
      )}

      {/* Animated bottom gradient to blend into page */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:80,
        background:'linear-gradient(to bottom, transparent, #f5f6fa)',
        pointerEvents:'none', zIndex:400,
      }}/>
    </div>
  );
};

export default OrderMap;
