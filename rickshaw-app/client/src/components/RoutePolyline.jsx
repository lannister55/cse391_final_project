import { Polyline } from 'react-leaflet';
import { useEffect, useState } from 'react';

const RoutePolyline = ({ pickup, destination }) => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    if (!pickup || !destination) return;

    // Build straight-line fallback immediately so the line always shows
    const straightLine = [
      [Number(pickup.lat), Number(pickup.lng)],
      [Number(destination.lat), Number(destination.lng)],
    ];
    setRouteCoordinates(straightLine);

    // Then try to upgrade to a real OSRM road route
    const controller = new AbortController();

    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`,
          { signal: controller.signal }
        );

        if (!res.ok) return; // keep fallback

        const data = await res.json();

        if (data.code === 'Ok' && data.routes?.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          if (!controller.signal.aborted) {
            setRouteCoordinates(coords);
          }
        }
      } catch {
        // OSRM unavailable — straight-line fallback already set, keep it
      }
    };

    fetchRoute();

    return () => controller.abort();
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  if (routeCoordinates.length === 0) return null;

  return (
    <>
      {/* Soft glow halo behind the route */}
      <Polyline
        positions={routeCoordinates}
        color="#86efac"
        weight={10}
        opacity={0.35}
        lineCap="round"
        lineJoin="round"
      />
      {/* Main green dotted route line */}
      <Polyline
        positions={routeCoordinates}
        color="#16a34a"
        weight={4}
        opacity={0.95}
        dashArray="10, 8"
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
};

export default RoutePolyline;