import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import RoutePolyline from './RoutePolyline';

// Component to handle clicks on the map
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

// Fix default marker icon issue with leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for pickup and destination
const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const pickupIcon = createCustomIcon('#22c55e', 'P'); // Green for pickup
const destinationIcon = createCustomIcon('#ef4444', 'D'); // Red for destination

// Upgraded Driver/Taxi Icon with animation
const createTaxiIcon = () => {
  return L.divIcon({
    className: 'custom-taxi-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px;">
        <div style="position: absolute; inset: 0; background-color: #f59e0b; border-radius: 50%; opacity: 0.4; animation: livePulse 2s infinite;"></div>
        <div style="position: absolute; inset: 4px; background-color: #f59e0b; border: 3px solid #111827; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
          <span style="font-size: 18px; transform: scaleX(-1);">🚖</span>
        </div>
      </div>
      <style>
        @keyframes livePulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};
const driverIcon = createTaxiIcon();
const createFinishedIcon = () => {
  return L.divIcon({
    className: 'custom-finished-marker',
    html: `
      <div style="position: relative; width: 50px; height: 50px;">
        <div style="position: absolute; inset: 0; background-color: #10b981; border-radius: 50%; opacity: 0.4; animation: livePulse 1.5s infinite;"></div>
        <div style="position: absolute; inset: 4px; background-color: #059669; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
          <span style="font-size: 24px;">🏁</span>
        </div>
      </div>
      <style>
        @keyframes livePulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};
const finishedIcon = createFinishedIcon();

// Component to update map view when coordinates change
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const MapView = ({ pickup, destination, driverLocation, status, center, zoom = 13, height = '400px', onMapClick }) => {
  const defaultCenter = center || (pickup ? [pickup.lat, pickup.lng] : [23.8103, 90.4125]); // Default to Dhaka center
  const isCompleted = status === 'COMPLETED';

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
        />
        
        {/* Auto-follow driver when active; on completion centre on destination */}
        <MapUpdater
          center={
            isCompleted && destination
              ? [destination.lat, destination.lng]
              : driverLocation
              ? [driverLocation.lat, driverLocation.lng]
              : defaultCenter
          }
          zoom={zoom}
        />
        <MapClickHandler onMapClick={onMapClick} />

        {/* Route line between pickup and destination */}
        {pickup && destination && <RoutePolyline pickup={pickup} destination={destination} />}

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-sm font-semibold">
                📍 Pickup: {pickup.name || `${pickup.lat}, ${pickup.lng}`}
              </div>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={isCompleted ? finishedIcon : destinationIcon}>
            <Popup>
              <div className="text-sm font-bold text-emerald-700">
                {isCompleted ? '🏁 FINISHED! Arrived at Destination' : `🎯 Destination: ${destination.name || `${destination.lat}, ${destination.lng}`}`}
              </div>
            </Popup>
          </Marker>
        )}

        {driverLocation && !isCompleted && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-sm font-semibold">
                🚖 Driver Location
              </div>
            </Popup>
          </Marker>
        )}

        {/* On completion show taxi parked at destination */}
        {isCompleted && destination && (
          <Marker position={[destination.lat, destination.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-sm font-bold text-emerald-700">
                🏁 Arrived at Destination!
              </div>
            </Popup>
          </Marker>
        )}

        {/* Removed: duplicate taxi marker on COMPLETED (flag icon already shown above) */}
      </MapContainer>
    </div>
  );
};

export default MapView;