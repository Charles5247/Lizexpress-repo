import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Package2, Heart, MessageCircle, Bell, ChevronLeft, Search, Filter, Trash2, Edit, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Item, Notification, Chat } from '../lib/supabase';

function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    // Set active tab based on URL
    const path = location.pathname.split('/').pop();
    if (path && ['items', 'favorites', 'messages', 'notifications'].includes(path)) {
      setActiveTab(path);
    }

    fetchData();
  }, [user, navigate, location.pathname]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);

      // Fetch user's items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select(`
          *,
          items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favoritesError) throw favoritesError;
      setFavorites(favoritesData || []);

      // Fetch chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          items (*),
          sender:sender_id (id, full_name, avatar_url),
          receiver:receiver_id (id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;
      setChats(chatsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif =>
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (notif.content && notif.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFavorites = favorites.filter(fav =>
    fav.items?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.sender_id === user?.id ? chat.receiver : chat.sender;
    return otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           chat.items?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Profile Section */}
      <div className="bg-[#F7941D] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#e68a1c] rounded-full">
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-white overflow-hidden">
                  <img
                    src={profile?.avatar_url || "https://via.placeholder.com/80"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{profile?.full_name || 'User'}</h1>
                  <p className="opacity-90">{user?.email}</p>
                  <p className="text-sm opacity-75">
                    {items.length} items listed • {favorites.length} favorites
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/dashboard/items"
            className={`p-6 rounded-lg shadow transition-all ${
              activeTab === 'items' ? 'bg-[#4A0E67] text-white' : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('items')}
          >
            <Package2 className={`w-8 h-8 mb-2 ${activeTab === 'items' ? 'text-white' : 'text-[#4A0E67]'}`} />
            <h2 className="text-lg font-semibold">My Items</h2>
            <p className="text-sm opacity-75">{items.length} items</p>
          </Link>
          
          <Link
            to="/dashboard/favorites"
            className={`p-6 rounded-lg shadow transition-all ${
              activeTab === 'favorites' ? 'bg-[#4A0E67] text-white' : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart className={`w-8 h-8 mb-2 ${activeTab === 'favorites' ? 'text-white' : 'text-[#F7941D]'}`} />
            <h2 className="text-lg font-semibold">Favorites</h2>
            <p className="text-sm opacity-75">{favorites.length} items</p>
          </Link>
          
          <Link
            to="/dashboard/messages"
            className={`p-6 rounded-lg shadow transition-all ${
              activeTab === 'messages' ? 'bg-[#4A0E67] text-white' : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageCircle className={`w-8 h-8 mb-2 ${activeTab === 'messages' ? 'text-white' : 'text-[#4A0E67]'}`} />
            <h2 className="text-lg font-semibold">Messages</h2>
            <p className="text-sm opacity-75">{chats.length} chats</p>
          </Link>
          
          <Link
            to="/dashboard/notifications"
            className={`p-6 rounded-lg shadow transition-all ${
              activeTab === 'notifications' ? 'bg-[#4A0E67] text-white' : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className={`w-8 h-8 mb-2 ${activeTab === 'notifications' ? 'text-white' : 'text-[#F7941D]'}`} />
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm opacity-75">
              {notifications.filter(n => !n.is_read).length} unread
            </p>
          </Link>
        </div>

        {/* Content Area */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          {/* Search Bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#4A0E67] capitalize">{activeTab}</h2>
            <div className="flex space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:border-[#4A0E67]"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Filter size={20} className="text-[#4A0E67]" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A0E67] border-t-transparent"></div>
            </div>
          ) : (
            <div>
              {/* My Items */}
              {activeTab === 'items' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">Condition: {item.condition}</p>
                        <p className="text-sm text-gray-600 mb-2">Swap for: {item.swap_for}</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Listed: {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/items/${item.id}`)}
                            className="flex-1 bg-[#4A0E67] text-white py-2 px-3 rounded text-sm hover:bg-[#3a0b50] transition-colors"
                          >
                            <Eye size={16} className="inline mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Package2 size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No items found</p>
                      <button
                        onClick={() => navigate('/list-item')}
                        className="mt-4 bg-[#F7941D] text-white px-6 py-2 rounded hover:bg-[#e68a1c] transition-colors"
                      >
                        List Your First Item
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Favorites */}
              {activeTab === 'favorites' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFavorites.map((favorite) => (
                    <div key={favorite.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={favorite.items?.images[0]}
                        alt={favorite.items?.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{favorite.items?.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">Condition: {favorite.items?.condition}</p>
                        <p className="text-sm text-gray-600 mb-4">Swap for: {favorite.items?.swap_for}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/items/${favorite.items?.id}`)}
                            className="flex-1 bg-[#4A0E67] text-white py-2 px-3 rounded text-sm hover:bg-[#3a0b50] transition-colors"
                          >
                            View Item
                          </button>
                          <button
                            onClick={() => removeFavorite(favorite.id)}
                            className="bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 transition-colors"
                          >
                            <Heart size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredFavorites.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No favorites yet</p>
                      <button
                        onClick={() => navigate('/browse')}
                        className="mt-4 bg-[#F7941D] text-white px-6 py-2 rounded hover:bg-[#e68a1c] transition-colors"
                      >
                        Browse Items
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  {filteredChats.map((chat) => {
                    const otherUser = chat.sender_id === user?.id ? chat.receiver : chat.sender;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => navigate(`/chat/${chat.id}`)}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                            <img
                              src={otherUser?.avatar_url || "https://via.placeholder.com/48"}
                              alt={otherUser?.full_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{otherUser?.full_name}</h3>
                            <p className="text-sm text-gray-600">Item: {chat.items?.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(chat.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <MessageCircle size={20} className="text-[#4A0E67]" />
                        </div>
                      </div>
                    );
                  })}
                  {filteredChats.length === 0 && (
                    <div className="text-center py-12">
                      <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markNotificationAsRead(notification.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{notification.title}</h3>
                          <p className="text-gray-600">{notification.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-12">
                      <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No notifications</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Routes>
            <Route path="items" element={<div />} />
            <Route path="favorites" element={<div />} />
            <Route path="messages" element={<div />} />
            <Route path="notifications" element={<div />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;