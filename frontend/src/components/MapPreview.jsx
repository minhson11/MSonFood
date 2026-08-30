import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STORE_LOCATION = {
  name: 'MSon Food - Chi nhánh Hà Nội',
  lat: 21.0285,
  lng: 105.8542,
  address: 'Số 1 Tràng Tiền, Hoàn Kiếm, Hà Nội',
};

const MapPreview = ({ coords, locationStatus, distanceKm }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not yet created
    if (!mapInstanceRef.current) {
      const defaultCenter = coords?.lat && coords?.lng
        ? [coords.lat, coords.lng]
        : [STORE_LOCATION.lat, STORE_LOCATION.lng];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Zoom Control top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // TileLayer: CartoDB Voyager (clean, fast, beautiful maps without watermark)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Group for dynamic markers & lines
      markersGroupRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // 1. Store Marker (MSon Food Hà Nội)
    const storeIcon = L.divIcon({
      className: 'custom-store-pin',
      html: `
        <div style="background-color: #ea580c; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: 900; font-size: 14px;">
          🍔
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const storeMarker = L.marker([STORE_LOCATION.lat, STORE_LOCATION.lng], { icon: storeIcon })
      .bindPopup(`<b>${STORE_LOCATION.name}</b><br/><span style="font-size:12px; color:#666;">${STORE_LOCATION.address}</span>`);
    markersGroup.addLayer(storeMarker);

    // 2. User Delivery Marker (if coords present)
    if (coords?.lat && coords?.lng) {
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div style="position: relative;">
            <div style="background-color: #a83210; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 12px rgba(168,50,16,0.5);">
              <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
            </div>
            <div style="position: absolute; bottom: -8px; left: 8px; width: 16px; height: 6px; background: rgba(0,0,0,0.25); border-radius: 50%; filter: blur(1px);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const userMarker = L.marker([coords.lat, coords.lng], { icon: userIcon })
        .bindPopup(`<b>Vị trí nhận hàng</b><br/><span style="font-size:12px;">${locationStatus || 'Địa chỉ của bạn'}</span>`)
        .openPopup();
      markersGroup.addLayer(userMarker);

      // 3. Connect line with delivery distance
      const routeLine = L.polyline(
        [
          [STORE_LOCATION.lat, STORE_LOCATION.lng],
          [coords.lat, coords.lng],
        ],
        {
          color: '#a83210',
          weight: 3.5,
          dashArray: '6, 8',
          opacity: 0.85,
        }
      );
      markersGroup.addLayer(routeLine);

      // Fit map bounds to show both Store and Destination
      map.fitBounds(markersGroup.getBounds(), {
        padding: [45, 45],
        maxZoom: 15,
        animate: true,
      });
    } else {
      map.setView([STORE_LOCATION.lat, STORE_LOCATION.lng], 13);
    }

    // Trigger resize to prevent grey tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [coords, locationStatus, distanceKm]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xs h-56 sm:h-64 bg-slate-100">
      {/* Real Interactive Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Status Pill */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-xs font-bold text-gray-800 flex items-center gap-2 border border-gray-100 z-10 max-w-[90%] pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#a83210] animate-ping flex-shrink-0" />
        <span className="truncate">{locationStatus || 'Đang chọn vị trí nhận hàng...'}</span>
      </div>
    </div>
  );
};

export default MapPreview;
