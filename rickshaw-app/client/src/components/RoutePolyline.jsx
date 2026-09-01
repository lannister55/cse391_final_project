import { Polyline } from 'react-leaflet';
import { useEffect, useState } from 'react';

const RoutePolyline = ({ pickup, destination }) => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!pickup || !destination) return;

      setLoading(true);
      setError(null);

      try {
        // OSRM API - free routing service
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch route');
        }

        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map(coord => [
            coord[1], // latitude
            coord[0]  // longitude
          ]);
          setRouteCoordinates(coordinates);
        } else {
          setError('No route found');
        }
      } catch (err) {
        console.error('Error fetching route:', err);
        setError('Failed to load route');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [pickup, destination]);

  if (loading) return null;
  if (error || routeCoordinates.length === 0) return null;

  return (
    <>
      {/* Background glowing outline for the route */}
      <Polyline
        positions={routeCoordinates}
        color="#60a5fa"
        weight={8}
        opacity={0.4}
        lineCap="round"
        lineJoin="round"
      />
      {/* Foreground main route line */}
      <Polyline
        positions={routeCoordinates}
        color="#1d4ed8"
        weight={4}
        opacity={1}
        dashArray="10, 10"
        lineCap="round"
        lineJoin="round"
        className="route-line-anim"
      />
    </>
  );
};

export default RoutePolyline;