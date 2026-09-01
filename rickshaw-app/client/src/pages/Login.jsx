import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      const { user, token } = res.data;

      // Persist auth state via context
      login(user, token);

      // Navigate to role-specific dashboard
      if (user.role === 'DRIVER')      navigate('/driver/dashboard');
      else if (user.role === 'ADMIN')  navigate('/admin/dashboard');
      else                             navigate('/rider/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-secondary rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-accent rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-5xl mx-auto flex flex-col md:flex-row bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] shadow-premium overflow-hidden border border-slate-800/60 z-10 m-4 min-h-[600px]">
        
        {/* Corner HUD Brackets */}
        <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl-lg opacity-40 pointer-events-none"></div>
        <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr-lg opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl-lg opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-accent rounded-br-lg opacity-40 pointer-events-none"></div>

        {/* Left Side - Brand & Graphics */}
        <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-primary-800 to-indigo-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
              <span className="text-5xl">🚖</span> RideNego
            </h1>
            <p className="text-primary-200 font-medium text-lg">
              The smartest way to negotiate CNG and Rickshaw fares in Dhaka.
            </p>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
              <p className="italic text-sm text-primary-100 leading-relaxed">
                "Finally, a fair ride-sharing app where the rider and driver have equal power to agree on a fare."
              </p>
            </div>

            {/* Animated Road and Vehicle */}
            <div className="relative w-full h-16 overflow-hidden border-t border-dashed border-white/20 pt-4">
              <div className="absolute bottom-2 left-0 right-0 h-1 bg-white/20 rounded-full"></div>
              <div className="absolute bottom-2.5 animate-drive">
                <div className="animate-bob text-4xl leading-none">🛺</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-slate-900/60">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome Back</h2>
              <p className="text-slate-400 font-semibold">Please enter your details to sign in.</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 bg-red-950/80 backdrop-blur-sm border border-red-800/50 text-red-300 text-sm rounded-xl px-4 py-3 shadow-sm flex items-center gap-2">
                <span className="text-red-400">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-1.5 transition-colors group-focus-within:text-primary-400">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100
                               focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                               placeholder-slate-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-1.5 transition-colors group-focus-within:text-primary-400">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100
                             focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                             placeholder-slate-500 transition-all shadow-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary hover:from-primary-700 hover:to-secondary/95 
                           text-white font-bold rounded-xl py-3.5 text-sm transition-all transform hover:-translate-y-0.5 hover:shadow-glow-primary
                           disabled:opacity-70 disabled:transform-none disabled:shadow-none mt-4 shadow-primary-500/30 shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="mt-8 text-center text-sm font-medium text-slate-400">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 transition-colors border-b-2 border-transparent hover:border-primary-400 pb-0.5">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
