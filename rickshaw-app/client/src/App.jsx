import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Rider Pages
import RiderDashboard from './pages/rider/RiderDashboard';
import RequestTrip    from './pages/rider/RequestTrip';
import NegotiatePage  from './pages/rider/NegotiatePage';
import TripStatusPage from './pages/rider/TripStatusPage';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import TripDetail      from './pages/driver/TripDetail';
import DriverTripControls from './pages/driver/DriverTripControls';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import TripsManagement from './pages/admin/TripsManagement';

// Not Found
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rider routes */}
          <Route
            path="/rider/*"
            element={
              <ProtectedRoute allowedRoles={['RIDER']}>
                <Routes>
                  <Route path="dashboard"           element={<RiderDashboard />} />
                  <Route path="request-trip"         element={<RequestTrip />} />
                  <Route path="trip/:id/negotiate"   element={<NegotiatePage />} />
                  <Route path="trip-status/:id"      element={<TripStatusPage />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Driver routes */}
          <Route
            path="/driver/*"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <Routes>
                  <Route path="dashboard"           element={<DriverDashboard />} />
                  <Route path="trip/:id"             element={<TripDetail />} />
                  <Route path="trip-controls/:id"   element={<DriverTripControls />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users"     element={<UsersManagement />} />
                  <Route path="trips"     element={<TripsManagement />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
