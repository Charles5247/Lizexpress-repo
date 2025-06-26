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
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
  const [filterDate, setFilterDate] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const usersPerPage = 10;

  useEffect(() => {
    // Check if user is admin (you can implement your own admin check logic)
    if (!user || user.email !== 'admin@lizexpress.com') {
      navigate('/');
      return;
    }

    fetchAdminData();
    
    // Set up real-time subscriptions
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
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch users with their activity data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          items:items(count),
          chats_sent:chats!chats_sender_id_fkey(count),
          chats_received:chats!chats_receiver_id_fkey(count)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Transform users data
      const transformedUsers: AdminUser[] = usersData?.map(user => ({
        id: user.id,
        full_name: user.full_name || 'Anonymous',
        email: user.email || 'No email',
        avatar_url: user.avatar_url || '',
        location: `${user.state || 'Unknown'}, ${user.country || 'Unknown'}`,
        created_at: user.created_at,
        last_active: user.updated_at,
        status: Math.random() > 0.3 ? 'online' : 'offline', // Simulate online status
        items_count: user.items?.[0]?.count || 0,
        chats_count: (user.chats_sent?.[0]?.count || 0) + (user.chats_received?.[0]?.count || 0)
      })) || [];

      setUsers(transformedUsers);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      
      const { data: itemsData } = await supabase
        .from('items')
        .select('created_at');

      const { data: chatsData } = await supabase
        .from('chats')
        .select('id');

      const newUsersToday = transformedUsers.filter(user => 
        user.created_at.startsWith(today)
      ).length;

      const newItemsToday = itemsData?.filter(item => 
        item.created_at.startsWith(today)
      ).length || 0;

      setStats({
        totalUsers: transformedUsers.length,
        activeUsers: transformedUsers.filter(user => user.status === 'online').length,
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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'notifications', icon: Bell, label: 'Notifications' }
  ];

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
                Nigeria - {stats.totalUsers.toLocaleString()}
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
                  <span className="text-white text-sm font-bold">E</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="p-6">
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

          {/* Filters and Search */}
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
        </div>
      </div>
    </div>
  );
};

export default Admin;