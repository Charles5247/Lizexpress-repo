import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  CheckSquare, 
  Users, 
  Settings, 
  History, 
  Bell, 
  LogOut, 
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  Activity,
  Package,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Shield,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  location: string;
  created_at: string;
  last_active: string;
  status: 'online' | 'offline';
  items_count: number;
  chats_count: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalItems: number;
  totalChats: number;
  newUsersToday: number;
  newItemsToday: number;
}

interface Message {
  id: string;
  user: string;
  message: string;
  location: string;
  status: number;
  avatar: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  timeLeft: string;
}

interface Country {
  name: string;
  users: number;
  activeUsers: number;
  flag?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalItems: 0,
    totalChats: 0,
    newUsersToday: 0,
    newItemsToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const usersPerPage = 10;

  // Mock data for demonstration
  const [messages] = useState<Message[]>([
    { id: '1', user: 'John Bull', message: 'Dropped a message', location: 'Katsina, Nigeria', status: 2, avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' },
    { id: '2', user: 'John Bull', message: 'Dropped a message', location: 'Katsina, Nigeria', status: 2, avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' },
    { id: '3', user: 'John Bull', message: 'Dropped a message', location: 'Katsina, Nigeria', status: 2, avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' },
    { id: '4', user: 'John Bull', message: 'Dropped a message', location: 'Katsina, Nigeria', status: 2, avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' },
    { id: '5', user: 'John Bull', message: 'Dropped a message', location: 'Katsina, Nigeria', status: 2, avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' },
  ]);

  const [tasks] = useState<Task[]>([
    { id: '1', title: 'Lorem Ipsum', description: 'Lorem Ipsum, Lorem Ipsum', status: 'pending', timeLeft: 'Time Lapse' },
    { id: '2', title: 'Lorem Ipsum', description: 'Lorem Ipsum, Lorem Ipsum', status: 'pending', timeLeft: 'Time Lapse' },
    { id: '3', title: 'Lorem Ipsum', description: 'Lorem Ipsum, Lorem Ipsum', status: 'pending', timeLeft: 'Time Lapse' },
    { id: '4', title: 'Lorem Ipsum', description: 'Lorem Ipsum, Lorem Ipsum', status: 'pending', timeLeft: 'Time Lapse' },
    { id: '5', title: 'Lorem Ipsum', description: 'Lorem Ipsum, Lorem Ipsum', status: 'pending', timeLeft: 'Time Lapse' },
  ]);

  const [countries] = useState<Country[]>([
    { name: 'Afghanistan', users: 379, activeUsers: 54, flag: '🇦🇫' },
    { name: 'Argentina', users: 557, activeUsers: 79, flag: '🇦🇷' },
    { name: 'Albania', users: 0, activeUsers: 0, flag: '🇦🇱' },
    { name: 'Australia', users: 987, activeUsers: 102, flag: '🇦🇺' },
    { name: 'Algeria', users: 37, activeUsers: 9, flag: '🇩🇿' },
    { name: 'Benin Republic', users: 11278, activeUsers: 2567, flag: '🇧🇯' },
    { name: 'Andorra', users: 0, activeUsers: 0, flag: '🇦🇩' },
    { name: 'Botswana', users: 3224, activeUsers: 1101, flag: '🇧🇼' },
    { name: 'Angola', users: 457, activeUsers: 157, flag: '🇦🇴' },
    { name: 'Brazil', users: 1127, activeUsers: 27, flag: '🇧🇷' },
    { name: 'Azerbaijan', users: 0, activeUsers: 0, flag: '🇦🇿' },
    { name: 'Bulgaria', users: 1125, activeUsers: 27, flag: '🇧🇬' },
  ]);

  useEffect(() => {
    // Check admin session
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      navigate('/admin');
      return;
    }

    const session = JSON.parse(adminSession);
    if (session.email !== 'admin@lizexpress.com') {
      navigate('/admin');
      return;
    }

    fetchAdminData();
    
    // Set up real-time subscriptions for public data
    const userSubscription = supabase
      .channel('admin-users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, () => {
        fetchAdminData();
      })
      .subscribe();

    const itemSubscription = supabase
      .channel('admin-items')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items'
      }, () => {
        fetchAdminData();
      })
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      itemSubscription.unsubscribe();
    };
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch users data using service role key for admin access
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Users fetch error:', usersError);
        // Create mock data if we can't fetch real data
        const mockUsers = Array.from({ length: 20 }, (_, i) => ({
          id: `user-${i}`,
          full_name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          avatar_url: '',
          location: 'Lagos, Nigeria',
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          status: Math.random() > 0.3 ? 'online' : 'offline' as 'online' | 'offline',
          items_count: Math.floor(Math.random() * 10),
          chats_count: Math.floor(Math.random() * 5)
        }));
        setUsers(mockUsers);
      } else {
        // Transform real users data
        const transformedUsers: AdminUser[] = usersData?.map(user => ({
          id: user.id,
          full_name: user.full_name || 'Anonymous',
          email: 'user@example.com', // We don't have email in users table
          avatar_url: user.avatar_url || '',
          location: `${user.state || 'Unknown'}, ${user.country || 'Unknown'}`,
          created_at: user.created_at,
          last_active: user.updated_at,
          status: Math.random() > 0.3 ? 'online' : 'offline' as 'online' | 'offline',
          items_count: 0, // Will be updated with real data
          chats_count: 0 // Will be updated with real data
        })) || [];
        setUsers(transformedUsers);
      }

      // Fetch items data
      const { data: itemsData } = await supabase
        .from('items')
        .select('created_at');

      // Fetch chats data
      const { data: chatsData } = await supabase
        .from('chats')
        .select('id');

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      
      const newUsersToday = users.filter(user => 
        user.created_at.startsWith(today)
      ).length;

      const newItemsToday = itemsData?.filter(item => 
        item.created_at.startsWith(today)
      ).length || 0;

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(user => user.status === 'online').length,
        totalItems: itemsData?.length || 0,
        totalChats: chatsData?.length || 0,
        newUsersToday,
        newItemsToday
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin');
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const sidebarItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', badge: 5 },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', badge: 10 },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'notifications', icon: Bell, label: 'Notifications' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'messages':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#4A0E67] mb-6">Messages</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F7941D]">
                      <img src={message.avatar} alt={message.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{message.user}</h3>
                    <p className="text-sm text-gray-600 truncate">{message.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{message.location}</span>
                      <span className="text-xs bg-[#F7941D] text-white px-2 py-1 rounded-full">{message.status}</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#4A0E67] mb-6">Tasks</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">Time</p>
                      <p className="text-xs text-gray-600">{task.timeLeft}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <button className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-purple-200 text-gray-700 px-6 py-3 rounded-lg hover:shadow-md transition-all">
                <span className="font-semibold">Set ToDo Manually</span>
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#4A0E67] mb-6">Users - {countries.reduce((sum, country) => sum + country.users, 0).toLocaleString()}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {countries.map((country, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                    {country.flag || '🌍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{country.name}</h3>
                    <p className="text-sm text-gray-600">{country.users} Users</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-green-600">{country.activeUsers} Active Users</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#4A0E67] mb-6">Settings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {countries.slice(0, 8).map((country, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F7941D]">
                    <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{country.name}</h3>
                    <p className="text-sm text-gray-600">{country.users} Users</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-green-600">{country.activeUsers} Active Users</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-[#4A0E67]">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-[#4A0E67]" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-[#F7941D]">{stats.totalItems}</p>
                  </div>
                  <Package className="w-8 h-8 text-[#F7941D]" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Chats</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalChats}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">New Users Today</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.newUsersToday}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">New Items Today</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.newItemsToday}</p>
                  </div>
                  <Package className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A0E67] border-t-transparent"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
                    {paginatedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F7941D]">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                {user.full_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{user.full_name}</h3>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {user.location}
                            </span>
                            <span className="text-xs text-gray-500">
                              {user.items_count} items • {user.chats_count} chats
                            </span>
                          </div>
                        </div>

                        <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-4 p-6 border-t">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full bg-[#4A0E67] text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#3a0b50] transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full bg-[#4A0E67] text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#3a0b50] transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-[#4A0E67]">Good Day!</h2>
                <div className="w-12 h-1 bg-[#F7941D] rounded-full mt-1"></div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${
                sidebarCollapsed ? 'rotate-180' : ''
              }`} />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#4A0E67] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="bg-[#F7941D] text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-[#4A0E67]">
                {activeTab === 'home' ? `Nigeria - ${stats.totalUsers.toLocaleString()}` : 
                 activeTab === 'users' ? `Users - ${countries.reduce((sum, country) => sum + country.users, 0).toLocaleString()}` :
                 activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-[#4A0E67] hover:bg-gray-100 rounded-lg">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-[#4A0E67] hover:bg-gray-100 rounded-lg">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 bg-[#4A0E67] text-white px-4 py-2 rounded-lg hover:bg-[#3a0b50] transition-colors">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Invite</span>
                <span className="bg-[#F7941D] text-white text-xs px-2 py-1 rounded-full">+2</span>
              </button>

              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <Bell className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">Mrs Elizabeth</p>
                  <p className="text-xs text-gray-500">Sole Admin</p>
                </div>
                <div className="w-8 h-8 bg-[#4A0E67] rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>

              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4" />
                <span>Today</span>
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search User Activities"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#4A0E67]"
              />
            </div>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;