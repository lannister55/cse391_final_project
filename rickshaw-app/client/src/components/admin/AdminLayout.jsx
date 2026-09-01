import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AdminLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: '📊' },
    { label: 'User Directory', path: '/admin/users', icon: '👥' },
    { label: 'Trip Audits', path: '/admin/trips', icon: '🚖' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight text-slate-900 dark:text-slate-100 relative overflow-hidden flex flex-col transition-colors duration-300">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary-600/15 rounded-full filter blur-3xl pointer-events-none animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl pointer-events-none animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[30%] w-96 h-96 bg-accent/10 rounded-full filter blur-3xl pointer-events-none animate-blob animation-delay-4000"></div>

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-6 py-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary flex items-center justify-center text-xl shadow-glow-primary">
              🚖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-primary-600 dark:from-white dark:via-slate-200 dark:to-primary-300 bg-clip-text text-transparent">
                  RideNego
                </span>
                <span className="bg-primary-500/20 text-primary-600 dark:text-primary-300 border border-primary-500/30 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dhaka Commute Management Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-secondary text-white shadow-glow-primary scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin User Profile & Sign Out */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all text-xs font-bold flex items-center justify-center"
              title="Toggle Theme"
            >
              {isDark ? '🌙' : '☀️'}
            </button>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name || 'Administrator'}</span>
              <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 hover:bg-red-500 hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all flex items-center gap-1.5 shadow-sm"
              title="Sign Out"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>}
            {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 text-center py-4 text-xs text-slate-500">
        RideNego Administration & Monitoring Subsystem • CSE391 Project
      </footer>
    </div>
  );
};

export default AdminLayout;
