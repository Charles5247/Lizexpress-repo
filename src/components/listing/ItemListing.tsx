import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ReCAPTCHA from 'react-google-recaptcha';
import PaymentModal from '../PaymentModal';

const ItemListing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    buyingPrice: '',
    estimatedCost: '',
    condition: '',
    category: '',
    swapFor: '',
    description: '',
    receipt: null as File | null,
    images: [] as File[]
  });

  const categories = [
    'Electronics', 'Furniture', 'Computer', 'Phones', 'Clothing',
    'Cosmetics', 'Automobiles', 'Shoes', 'Jewelry', 'Real Estate', 'Others'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 3) {
        setError('Maximum 3 images allowed');
        return;
      }
      setFormData(prev => ({
        ...prev,
        images: files
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('items')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('items')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaValue) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    if (!user) {
      navigate('/signin');
      return;
    }

    if (formData.images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    if (!formData.estimatedCost) {
      setError('Please enter the estimated cost value');
      return;
    }

    // Show payment modal before proceeding
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      setError('');

      // Ensure user profile exists
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user!.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
      }

      // Get user location
      const userLocation = localStorage.getItem('userLocation');
      let location = '';
      if (userLocation) {
        const { lat, lng } = JSON.parse(userLocation);
        location = `${lat},${lng}`;
      }

      // Upload images
      const imageUrls: string[] = [];
      for (let i = 0; i < formData.images.length; i++) {
        const file = formData.images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/items/${Date.now()}_${i}.${fileExt}`;
        const url = await uploadFile(file, fileName);
        imageUrls.push(url);
      }

      // Upload receipt if provided
      let receiptUrl = null;
      if (formData.receipt) {
        const receiptExt = formData.receipt.name.split('.').pop();
        const receiptFileName = `${user!.id}/receipts/${Date.now()}_receipt.${receiptExt}`;
        receiptUrl = await uploadFile(formData.receipt, receiptFileName);
      }

      // Create item in database
      const itemData = {
        user_id: user!.id,
        name: formData.itemName,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        buying_price: formData.buyingPrice ? parseFloat(formData.buyingPrice) : null,
        estimated_cost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        swap_for: formData.swapFor,
        location: location,
        images: imageUrls,
        receipt_image: receiptUrl,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;

      // Create notification for successful listing
      await supabase
        .from('notifications')
        .insert({
          user_id: user!.id,
          type: 'item_listed',
          title: 'Item Listed Successfully',
          content: `Your item "${formData.itemName}" has been listed successfully and is now visible to other users.`
        });

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error creating item:', err);
      setError(err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#4A0E67] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-[#4A0E67]">Item Listing</h1>
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-full bg-[#4A0E67] text-white flex items-center justify-center">1</span>
                <span className="w-8 border-t-2 border-gray-300"></span>
                <span className="w-8 h-8 rounded-full bg-[#4A0E67] text-white flex items-center justify-center">2</span>
                <span className="w-8 border-t-2 border-gray-300"></span>
                <span className="w-8 h-8 rounded-full bg-[#F7941D] text-white flex items-center justify-center">3</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="bg-[#F7941D]/10 border border-[#F7941D]/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-[#4A0E67] mb-2">📋 Listing Fee Information</h3>
              <p className="text-sm text-gray-700">
                A 5% listing fee will be charged based on your item's estimated value. This helps maintain platform quality and security.
                {formData.estimatedCost && (
                  <span className="font-semibold text-[#F7941D]">
                    {' '}Fee: ₦{Math.round(parseFloat(formData.estimatedCost) * 0.05).toLocaleString()}
                  </span>
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className="block text-[#4A0E67] mb-2">Item Name *</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#4A0E67] mb-2">Buying Price (₦)</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                    value={formData.buyingPrice}
                    onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[#4A0E67] mb-2">Estimated Cost Value (₦) *</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4A0E67] mb-2">Item Condition *</label>
                <div className="flex space-x-4">
                  {['Brand New', 'Fairly Used', 'Well Used'].map((condition) => (
                    <label key={condition} className="flex items-center">
                      <input
                        type="radio"
                        name="condition"
                        value={condition}
                        checked={formData.condition === condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className="mr-2"
                        required
                      />
                      {condition}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#4A0E67] mb-2">Item Category *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={formData.category === category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="mr-2"
                        required
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#4A0E67] mb-2">Swap For *</label>
                <input
                  type="text"
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67]"
                  value={formData.swapFor}
                  onChange={(e) => setFormData({ ...formData, swapFor: e.target.value })}
                  placeholder="What would you like to swap this item for?"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4A0E67] mb-2">Item Description *</label>
                <textarea
                  className="w-full p-3 rounded border focus:outline-none focus:border-[#4A0E67] h-32"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter the details of your items here..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[#F7941D] font-semibold mb-4">Item Receipt (Optional)</h3>
                  <label className="cursor-pointer block">
                    <div className="border-2 border-[#F7941D] border-dashed rounded-lg p-8 hover:bg-gray-50">
                      <Upload className="mx-auto text-[#F7941D] mb-2" size={32} />
                      <p className="text-center text-sm text-gray-500">
                        {formData.receipt ? formData.receipt.name : 'Upload Item Receipt'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.png,.pdf"
                      onChange={(e) => setFormData({ ...formData, receipt: e.target.files?.[0] || null })}
                    />
                  </label>
                </div>

                <div>
                  <h3 className="text-[#4A0E67] font-semibold mb-4">Item Images (Required) *</h3>
                  <label className="cursor-pointer block">
                    <div className="border-2 border-[#4A0E67] border-dashed rounded-lg p-8 hover:bg-gray-50">
                      <div className="flex justify-center space-x-4">
                        <Upload className="text-[#4A0E67]" size={32} />
                        <Upload className="text-[#4A0E67]" size={32} />
                        <Upload className="text-[#4A0E67]" size={32} />
                      </div>
                      <p className="text-center text-sm text-gray-500 mt-2">
                        Upload up to 3 images from various angles
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.png,.jpeg"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </label>
                  
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* reCAPTCHA */}
              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                  onChange={setCaptchaValue}
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading || !captchaValue}
                  className="bg-[#4A0E67] text-white px-8 py-3 rounded font-bold hover:bg-[#3a0b50] transition-colors disabled:opacity-50"
                >
                  {loading ? 'PROCESSING...' : 'PROCEED TO PAYMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        itemValue={parseFloat(formData.estimatedCost) || 0}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default ItemListing;