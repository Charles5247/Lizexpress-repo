import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check admin credentials
    if (credentials.email === 'admin@lizexpress.com' && credentials.password === 'Lizexpress@2025') {
      // Store admin session
      localStorage.setItem('adminSession', JSON.stringify({
        email: credentials.email,
        loginTime: new Date().toISOString(),
        role: 'admin'
      }));
      
      navigate('/admin/dashboard');
    } else {
      setError('Invalid admin credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A0E67] to-[#2d0a3d] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#4A0E67] rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#4A0E67] mb-2">Admin Portal</h1>
          <p className="text-gray-600">Secure access to LizExpress administration</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[#4A0E67] font-semibold mb-2">Admin Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#4A0E67] focus:ring-2 focus:ring-[#4A0E67]/20"
              placeholder="admin@lizexpress.com"
              required
            />
          </div>

          <div>
            <label className="block text-[#4A0E67] font-semibold mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#4A0E67] focus:ring-2 focus:ring-[#4A0E67]/20 pr-12"
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#4A0E67]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4A0E67] text-white py-3 rounded-lg font-bold hover:bg-[#3a0b50] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Access Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-[#F7941D]/10 rounded-lg">
          <h3 className="font-semibold text-[#4A0E67] mb-2">Default Credentials:</h3>
          <p className="text-sm text-gray-600">Email: admin@lizexpress.com</p>
          <p className="text-sm text-gray-600">Password: Lizexpress@2025</p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-[#4A0E67] hover:underline text-sm"
          >
            ← Back to Main Site
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;