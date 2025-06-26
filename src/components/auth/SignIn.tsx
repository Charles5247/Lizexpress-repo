import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaValue) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      
      // Check for specific error messages
      if (err.message && err.message.includes('Email not confirmed')) {
        setError('Your email is not confirmed. Please check your inbox for a verification link.');
      } else if (err.message && err.message.includes('email_not_confirmed')) {
        setError('Your email is not confirmed. Please check your inbox for a verification link.');
      } else {
        setError('Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4A0E67] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl flex overflow-hidden">
        <div className="w-full md:w-1/2 p-8 bg-[#FFF5E6]">
          <div className="flex justify-between mb-8">
            <button className="text-[#4A0E67] font-bold border-b-2 border-[#4A0E67]">SIGN IN</button>
            <Link to="/signup" className="text-gray-500 hover:text-[#4A0E67]">SIGN UP</Link>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#4A0E67] mb-2">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                required
              />
            </div>
            
            <div>
              <label className="block text-[#4A0E67] mb-2">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                required
              />
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key - replace with your actual key
                onChange={setCaptchaValue}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !captchaValue}
              className="w-full bg-[#4A0E67] text-white py-3 rounded font-bold hover:bg-[#3a0b50] transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'LOGIN'}
            </button>
            
            <div className="text-center space-y-4">
              <Link to="/forgot-password" className="text-[#4A0E67] hover:underline block">
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>
        
        <div className="hidden md:block md:w-1/2 bg-center bg-cover p-12 text-right"
             style={{ backgroundImage: 'url(https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)' }}>
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-[#F7941D] text-4xl font-bold mb-4">Already have an account?</h2>
            <h3 className="text-[#4A0E67] text-6xl font-bold">Log in!</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;