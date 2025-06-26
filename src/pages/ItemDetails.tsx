import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, MapPin, Calendar, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Item } from '../lib/supabase';

const ItemDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select(`
          *,
          users!inner(id, full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (itemError) throw itemError;
      
      setItem(itemData);
      setOwner(itemData.users);

      // Check if item is in user's favorites
      if (user) {
        const { data: favoriteData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_id', id)
          .single();

        setIsFavorite(!!favoriteData);
      }

    } catch (err) {
      console.error('Error fetching item:', err);
      setError('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_id: id
          });

        if (error) throw error;
        setIsFavorite(true);

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'favorite_added',
            title: 'Item Added to Favorites',
            content: `You've added "${item?.name}" to your favorites list.`
          });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!item || user.id === item.user_id) {
      alert("You can't chat about your own item!");
      return;
    }

    try {
      // Check if chat already exists
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('item_id', item.id)
        .eq('sender_id', user.id)
        .eq('receiver_id', item.user_id)
        .single();

      if (chatError && chatError.code !== 'PGRST116') {
        throw chatError;
      }

      if (existingChat) {
        navigate(`/chat/${existingChat.id}`);
        return;
      }

      // Create new chat
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          item_id: item.id,
          sender_id: user.id,
          receiver_id: item.user_id
        })
        .select()
        .single();

      if (error) throw error;

      // Create notifications
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            type: 'chat_started',
            title: 'Chat Started',
            content: `You started a chat about "${item.name}".`
          },
          {
            user_id: item.user_id,
            type: 'new_chat',
            title: 'New Chat Request',
            content: `Someone is interested in your item "${item.name}".`
          }
        ]);

      navigate(`/chat/${newChat.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      setError('Failed to start chat');
    }
  };

  const nextImage = () => {
    if (item && item.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item && item.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A0E67] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-red-600">{error || 'Item not found'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 bg-[#4A0E67] text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Image Gallery */}
            <div className="md:w-1/2 relative">
              <div className="aspect-w-4 aspect-h-3 relative">
                <img
                  src={item.images[currentImageIndex]}
                  alt={item.name}
                  className="w-full h-[400px] object-cover"
                />
                {item.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
                <button
                  onClick={toggleFavorite}
                  className={`absolute top-4 right-4 p-2 rounded-full ${
                    isFavorite 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
              {item.images.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {item.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-[#F7941D]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="md:w-1/2 p-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-[#4A0E67]">{item.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  item.condition === 'Brand New' ? 'bg-green-100 text-green-800' :
                  item.condition === 'Fairly Used' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {item.condition}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Description:</h2>
                  <p className="text-gray-600">{item.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center">
                      <Package size={16} className="mr-1" />
                      Category:
                    </h2>
                    <p className="text-gray-600">{item.category}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Estimated Value:</h2>
                    <p className="text-gray-600">₦{item.estimated_cost?.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Looking to swap for:</h2>
                  <p className="text-gray-600 font-medium">{item.swap_for}</p>
                </div>

                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar size={16} className="mr-1" />
                  Listed on {new Date(item.created_at).toLocaleDateString()}
                </div>

                {/* Owner Info */}
                <div className="border-t pt-4">
                  <h2 className="text-lg font-semibold mb-2">Listed by:</h2>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      <img
                        src={owner?.avatar_url || "https://via.placeholder.com/48"}
                        alt={owner?.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{owner?.full_name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-500">Verified User</p>
                    </div>
                  </div>
                </div>
              </div>

              {user?.id !== item.user_id && (
                <div className="mt-8 space-y-3">
                  <button 
                    onClick={handleStartChat}
                    className="w-full bg-[#F7941D] text-white py-3 rounded-lg font-bold hover:bg-[#e68a1c] transition-colors flex items-center justify-center"
                  >
                    <MessageCircle size={20} className="mr-2" />
                    START A CHAT
                  </button>
                  <button
                    onClick={toggleFavorite}
                    className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center ${
                      isFavorite
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart size={20} className="mr-2" fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? 'REMOVE FROM FAVORITES' : 'ADD TO FAVORITES'}
                  </button>
                </div>
              )}

              {user?.id === item.user_id && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-semibold">This is your item</p>
                  <p className="text-blue-600 text-sm">You can manage this item from your dashboard</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;