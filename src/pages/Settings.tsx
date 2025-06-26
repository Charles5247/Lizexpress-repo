import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, ArrowLeft, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    residential_address: profile?.residential_address || '',
    date_of_birth: profile?.date_of_birth || '',
    language: profile?.language || '',
    gender: profile?.gender || '',
    country: profile?.country || '',
    state: profile?.state || '',
    zip_code: profile?.zip_code || '',
    nationality: profile?.nationality || ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      await updateProfile({ avatar_url: publicUrl });
      setSuccess('Profile picture updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={24} className="text-[#4A0E67]" />
              </button>
              <h1 className="text-3xl font-bold text-[#4A0E67]">Settings</h1>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="mb-8 text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mx-auto mb-4">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#4A0E67] flex items-center justify-center">
                    <Camera size={48} className="text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-4 right-4 bg-[#F7941D] text-white p-2 rounded-full hover:bg-[#e68a1c] transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload size={20} />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-sm text-gray-600">Click the upload button to change your profile picture</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-3 rounded border bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                />
              </div>

              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                >
                  <option value="">Select Language</option>
                  <option value="english">English</option>
                  <option value="yoruba">Yoruba</option>
                  <option value="hausa">Hausa</option>
                  <option value="igbo">Igbo</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                >
                  <option value="">Select Country</option>
                  <option value="nigeria">Nigeria</option>
                  <option value="ghana">Ghana</option>
                  <option value="kenya">Kenya</option>
                  <option value="south_africa">South Africa</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                >
                  <option value="">Select State</option>
                  <option value="lagos">Lagos</option>
                  <option value="abuja">Abuja</option>
                  <option value="kano">Kano</option>
                  <option value="rivers">Rivers</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">Zip Code</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                  placeholder="Enter zip code"
                />
              </div>

              <div>
                <label className="block text-[#4A0E67] font-semibold mb-2">Nationality</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                >
                  <option value="">Select Nationality</option>
                  <option value="nigerian">Nigerian</option>
                  <option value="ghanaian">Ghanaian</option>
                  <option value="kenyan">Kenyan</option>
                  <option value="south_african">South African</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#4A0E67] font-semibold mb-2">Residential Address</label>
                <textarea
                  value={formData.residential_address}
                  onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67] h-24"
                  placeholder="Enter your full address"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#4A0E67] text-white rounded-lg hover:bg-[#3a0b50] transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save size={20} className="mr-2" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;