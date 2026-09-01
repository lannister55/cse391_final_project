const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Calculate the great-circle distance between two coordinates using
 * the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point A
 * @param {number} lng1 - Longitude of point A
 * @param {number} lat2 - Latitude of point B
 * @param {number} lng2 - Longitude of point B
 * @returns {number} Distance in kilometres, rounded to 2 decimal places
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKM = EARTH_RADIUS_KM * c;

  return Math.round(distanceKM * 100) / 100;
};

/**
 * Calculate actual road distance & route geometry using OpenStreetMap (OSRM API).
 * Falls back to Haversine straight-line distance if OSRM service is unreachable.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {Promise<{ distanceKM: number, routeGeometry: Array<[number, number]> }>}
 */
export const calculateOSRMRoute = async (lat1, lng1, lat2, lng2) => {
  try {
    // Note: OSRM expects coordinates in lng,lat format
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('OSRM API request failed');

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKM = Math.round((route.distance / 1000) * 100) / 100;
      
      // GeoJSON coordinates are [lng, lat], convert to Leaflet [lat, lng]
      const routeGeometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

      return { distanceKM, routeGeometry };
    }
  } catch (err) {
    console.warn('OSRM routing failed, falling back to Haversine:', err.message);
  }

  // Fallback if OSRM fails
  const distanceKM = calculateDistance(lat1, lng1, lat2, lng2);
  return { distanceKM, routeGeometry: [[lat1, lng1], [lat2, lng2]] };
};

/**
 * Estimate the fare for a trip.
 *
 * Base fare : 30 BDT
 * Rate      : 15 BDT per KM
 *
 * @param {number} distanceKM
 * @returns {number} Fare in BDT, rounded to the nearest integer
 */
export const estimateFare = (distanceKM) => {
  const fare = 30 + distanceKM * 15;
  return Math.round(fare);
};

