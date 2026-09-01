import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import MapView from '../../components/MapView';

const RequestTrip = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeSelection, setActiveSelection] = useState('pickup'); // 'pickup' | 'destination'
  const [pickup, setPickup] = useState({ name: '', lat: '', lng: '' });
  const [destination, setDestination] = useState({ name: '', lat: '', lng: '' });

  // Type-in search input & autocomplete states
  const [pickupInput, setPickupInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);

  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]); // Default Dhaka

  const [fareResult, setFareResult] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');

  // ── Option 2: Reverse Geocoding for Map Clicks ──────────────────────────────
  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    const coordSuffix = `[${lat.toFixed(3)}, ${lng.toFixed(3)}]`;
    const genericTerms = ['asia', 'bangladesh', 'dhaka division', 'chittagong division', 'rajshahi division'];

    try {
      // 1. Primary: Nominatim with detailed address structure
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          
          // Specific local features & landmarks
          const mainFeature = data.name || addr.amenity || addr.building || addr.tourism || addr.shop || addr.leisure || addr.road || addr.pedestrian || addr.highway;
          const localArea   = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.village || addr.hamlet || addr.industrial;
          const district    = addr.subdistrict || addr.county || addr.city_district || addr.town || addr.city;

          // Build clean component array
          const rawComponents = [mainFeature, localArea, district].filter(Boolean);
          const cleanComponents = rawComponents.filter(
            item => !genericTerms.includes(item.toLowerCase().trim())
          );
          const uniqueComponents = [...new Set(cleanComponents)];

          if (uniqueComponents.length >= 2) {
            return uniqueComponents.join(', ');
          } else if (uniqueComponents.length === 1) {
            return `${uniqueComponents[0]} ${coordSuffix}`;
          }

          // Fallback parsing display_name
          if (data.display_name) {
            const cleanParts = data.display_name
              .split(',')
              .map(p => p.trim())
              .filter(p => !genericTerms.includes(p.toLowerCase()));
            if (cleanParts.length > 0) {
              return `${cleanParts.slice(0, 2).join(', ')} ${coordSuffix}`;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocoding failed:', err);
    }

    try {
      // 2. Fallback: BigDataCloud Reverse Geocoding API
      const res2 = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (res2.ok) {
        const data2 = await res2.json();
        const info = data2.localityInfo?.informative || [];
        const specific = info.find(i => i.order >= 4 && i.name)?.name || data2.locality;
        const sub = data2.city || data2.principalSubdivision;
        if (specific && sub && specific !== sub) {
          return `${specific}, ${sub} ${coordSuffix}`;
        } else if (specific) {
          return `${specific} ${coordSuffix}`;
        }
      }
    } catch (err2) {
      console.warn('Fallback reverse geocoding failed:', err2);
    } finally {
      setGeocoding(false);
    }

    setGeocoding(false);
    return `Point ${coordSuffix}`;
  };

  // Handle map click
  const handleMapClick = async ({ lat, lng }) => {
    setError('');

    // Set immediate loading feedback in the target search bar
    if (activeSelection === 'pickup') {
      setPickupInput('📍 Fetching location address...');
    } else {
      setDestInput('🎯 Fetching location address...');
    }

    const placeName = await reverseGeocode(lat, lng);
    const point = { name: placeName, lat, lng };

    if (activeSelection === 'pickup') {
      setPickup(point);
      setPickupInput(placeName);
      setActiveSelection('destination');
    } else {
      setDestination(point);
      setDestInput(placeName);
    }
    setMapCenter([lat, lng]);
    setFareResult(null);
  };

  // ── Option 1: Forward Geocoding Search (Type Location) ──────────────────────
  const searchLocations = async (query, type) => {
    if (!query || query.trim().length < 2) {
      if (type === 'pickup') setPickupSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    if (type === 'pickup') setSearchingPickup(true);
    else setSearchingDest(true);

    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
      const res = await fetch(searchUrl);
      const data = await res.json();

      const formatted = data.map((item) => {
        const parts = item.display_name.split(',');
        const title = parts.slice(0, 3).join(',').trim();
        return {
          name: title,
          fullAddress: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      });

      if (type === 'pickup') setPickupSuggestions(formatted);
      else setDestSuggestions(formatted);
    } catch (err) {
      console.warn('Location search error:', err);
    } finally {
      if (type === 'pickup') setSearchingPickup(false);
      else setSearchingDest(false);
    }
  };

  const handleSelectSuggestion = (item, type) => {
    const point = { name: item.name, lat: item.lat, lng: item.lng };
    if (type === 'pickup') {
      setPickup(point);
      setPickupInput(item.name);
      setPickupSuggestions([]);
      setActiveSelection('destination');
    } else {
      setDestination(point);
      setDestInput(item.name);
      setDestSuggestions([]);
    }
    setMapCenter([item.lat, item.lng]);
    setFareResult(null);
  };

  // Estimate Fare
  const handleEstimate = async () => {
    setError('');
    if (!pickup.lat || !destination.lat) {
      setError('Please select both a Pickup and Destination point (by typing or clicking on the map).');
      return;
    }

    setEstimating(true);
    try {
      const { data } = await api.post('/fare/estimate', {
        pickup: { lat: Number(pickup.lat), lng: Number(pickup.lng) },
        destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
      });
      setFareResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to estimate fare. Please try again.');
    } finally {
      setEstimating(false);
    }
  };

  // Confirm Trip Creation
  const handleConfirm = async () => {
    if (!fareResult) return;
    setError('');
    setConfirming(true);
    try {
      await api.post('/trips', {
        pickup: { name: pickup.name || pickupInput, lat: Number(pickup.lat), lng: Number(pickup.lng) },
        destination: { name: destination.name || destInput, lat: Number(destination.lat), lng: Number(destination.lng) },
      });
      navigate('/rider/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight text-slate-900 dark:text-slate-100 p-4 md:p-8 relative overflow-hidden transition-colors duration-500">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary-600/15 rounded-full filter blur-3xl pointer-events-none animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl pointer-events-none animate-blob animation-delay-2000"></div>

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">

        {/* Header Bar */}
        <header className="glass-panel dark:bg-slate-900/60 bg-white/80 rounded-3xl p-6 flex justify-between items-center border border-slate-200 dark:border-slate-800/80 shadow-premium">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/rider/dashboard')}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-all"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Request a Ride</h1>
              <p className="text-xs text-primary-600 dark:text-primary-300 font-medium">
                Type locations below or pick directly from the map
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-lg"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Select Locations (2 Options Available)
                </h2>
              </div>

              {/* OPTION 1: TYPE IN SEARCH BAR */}
              <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                
                {/* Pickup Search Input */}
                <div className="relative space-y-1">
                  <label className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span>📍</span> Option 1A: Type Pickup Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pickupInput}
                      onChange={(e) => {
                        setPickupInput(e.target.value);
                        searchLocations(e.target.value, 'pickup');
                      }}
                      placeholder="e.g. Mirpur 10, Dhanmondi 32, Airport..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                    {searchingPickup && (
                      <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {pickupSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {pickupSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(item, 'pickup')}
                          className="p-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer transition-colors"
                        >
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.fullAddress}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination Search Input */}
                <div className="relative space-y-1">
                  <label className="text-xs font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span>🎯</span> Option 1B: Type Destination Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={destInput}
                      onChange={(e) => {
                        setDestInput(e.target.value);
                        searchLocations(e.target.value, 'destination');
                      }}
                      placeholder="e.g. Gulshan 2, Uttara Sector 3, Farmgate..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                    />
                    {searchingDest && (
                      <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {destSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {destSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(item, 'destination')}
                          className="p-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer transition-colors"
                        >
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.fullAddress}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* OPTION 2: PICK FROM MAP TARGET TOGGLE */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Option 2: Pick Target on Map Below
                </p>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveSelection('pickup')}
                    className={`py-2 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      activeSelection === 'pickup'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>📍</span> Map Target: Pickup
                  </button>

                  <button
                    onClick={() => setActiveSelection('destination')}
                    className={`py-2 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      activeSelection === 'destination'
                        ? 'bg-red-500 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>🎯</span> Map Target: Destination
                  </button>
                </div>
              </div>

              {/* Selected Pin Status Badges */}
              <div className="space-y-2 pt-1">
                <div className={`p-3 rounded-2xl border transition-all ${
                  pickup.lat 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60' 
                    : 'bg-slate-50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700'
                }`}>
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">📍 Active Pickup Pin</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                    {pickup.name || 'Not selected yet'}
                  </p>
                </div>

                <div className={`p-3 rounded-2xl border transition-all ${
                  destination.lat 
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60' 
                    : 'bg-slate-50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700'
                }`}>
                  <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">🎯 Active Destination Pin</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                    {destination.name || 'Not selected yet'}
                  </p>
                </div>
              </div>

              {geocoding && (
                <p className="text-xs text-primary-500 font-bold animate-pulse text-center">
                  🔍 Geocoding map coordinates...
                </p>
              )}

              {error && (
                <div className="bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-200 rounded-xl p-3 text-xs font-semibold">
                  ⚠️ {error}
                </div>
              )}

              {/* Calculate Fare Button */}
              <button
                onClick={handleEstimate}
                disabled={estimating || !pickup.lat || !destination.lat}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary hover:from-primary-500 hover:to-secondary text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
              >
                {estimating ? 'Calculating Road Distance...' : 'Calculate OSRM Fare'}
              </button>
            </div>

            {/* Fare Summary Card */}
            {fareResult && (
              <div className="glass-panel dark:bg-slate-900/80 bg-white/90 border border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-lg animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">OSRM Route Estimate</h3>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                    Road Navigation
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Actual Road Dist.</p>
                    <p className="text-xl font-extrabold text-primary-600 dark:text-primary-400">{fareResult.distanceKM} <span className="text-xs">km</span></p>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Est. Fare</p>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{fareResult.estimatedFare} <span className="text-xs">BDT</span></p>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md uppercase tracking-wider text-xs disabled:opacity-50"
                >
                  {confirming ? 'Broadcasting to Drivers...' : 'Confirm & Request Ride'}
                </button>
              </div>
            )}
          </div>

          {/* Interactive Map Column */}
          <div className="lg:col-span-7 space-y-3">
            <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm relative overflow-hidden">
              <div className="mb-3 flex justify-between items-center px-2">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>🗺️</span> Click map to place <span className={activeSelection === 'pickup' ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{activeSelection.toUpperCase()}</span> marker
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 font-mono">
                  Live Sync (Type or Click)
                </span>
              </div>

              <MapView
                pickup={pickup.lat ? pickup : null}
                destination={destination.lat ? destination : null}
                center={mapCenter}
                height="540px"
                onMapClick={handleMapClick}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RequestTrip;
