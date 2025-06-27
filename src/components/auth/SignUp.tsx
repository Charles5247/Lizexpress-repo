import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (!captchaValue) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signUp(email, password);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('check your email')) {
        setSuccess(true);
      } else {
        setError(err.message || 'Failed to create an account');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#4A0E67] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#4A0E67] mb-4">Check Your Email!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a confirmation link to <strong>{email}</strong>. 
            Please click the link in your email to activate your account and complete your registration.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> After clicking the verification link, you'll be redirected to LizExpress where you can sign in with your credentials.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/signin')}
              className="w-full bg-[#4A0E67] text-white py-2 px-4 rounded hover:bg-[#3a0b50] transition-colors"
            >
              Go to Sign In
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#4A0E67] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl flex overflow-hidden">
        <div className="w-full md:w-1/2 p-8 bg-[#FFF5E6]">
          <div className="flex justify-between mb-8">
            <Link to="/signin" className="text-gray-500 hover:text-[#4A0E67]">SIGN IN</Link>
            <button className="text-[#4A0E67] font-bold border-b-2 border-[#4A0E67]">SIGN UP</button>
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
                minLength={6}
              />
            </div>
            
            <div>
              <label className="block text-[#4A0E67] mb-2">Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mr-2"
                required
              />
              <label className="text-sm text-[#4A0E67]">
                I agree to the <Link to="/terms" className="underline">terms & policy</Link>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || !captchaValue}
              className="w-full bg-[#4A0E67] text-white py-3 rounded font-bold hover:bg-[#3a0b50] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'SIGN UP'}
            </button>
          </form>
        </div>
        
        <div className="hidden md:block md:w-1/2 bg-center bg-cover p-12 text-right"
             style={{ backgroundImage: 'url(https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)' }}>
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-[#F7941D] text-4xl font-bold mb-4">New here?</h2>
            <h3 className="text-[#4A0E67] text-6xl font-bold">Sign Up Now!!!</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;