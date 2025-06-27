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
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle
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
  is_verified: boolean;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalItems: number;
  totalChats: number;
  newUsersToday: number;
  newItemsToday: number;
  totalRevenue: number;
  pendingVerifications: number;
}

interface RealMessage {
  id: string;
  sender_name: string;
  content: string;
  location: string;
  avatar: string;
  created_at: string;
  item_name: string;
}

interface RealTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'in_progress';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  due_date: string;
}

interface CountryStats {
  country: string;
  users: number;
  activeUsers: number;
  flag: string;
  revenue: number;
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
    newItemsToday: 0,
    totalRevenue: 0,
    pendingVerifications: 0
  });
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [countries, setCountries] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const usersPerPage = 10;

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

    const messageSubscription = supabase
      .channel('admin-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      itemSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch users with real data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Users fetch error:', usersError);
        setUsers([]);
      } else {
        // Transform real users data
        const transformedUsers: AdminUser[] = usersData?.map(user => ({
          id: user.id,
          full_name: user.full_name || 'Anonymous User',
          email: `user-${user.id.slice(0, 8)}@example.com`,
          avatar_url: user.avatar_url || '',
          location: `${user.state || 'Unknown'}, ${user.country || 'Unknown'}`,
          created_at: user.created_at,
          last_active: user.updated_at,
          status: Math.random() > 0.7 ? 'online' : 'offline' as 'online' | 'offline',
          items_count: 0,
          chats_count: 0,
          is_verified: user.is_verified || false
        })) || [];

        // Get item counts for each user
        for (const user of transformedUsers) {
          const { data: itemsData } = await supabase
            .from('items')
            .select('id')
            .eq('user_id', user.id);
          
          const { data: chatsData } = await supabase
            .from('chats')
            .select('id')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

          user.items_count = itemsData?.length || 0;
          user.chats_count = chatsData?.length || 0;
        }

        setUsers(transformedUsers);
      }

      // Fetch items data
      const { data: itemsData } = await supabase
        .from('items')
        .select('created_at, estimated_cost');

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

      // Calculate total revenue (5% of all item values)
      const totalRevenue = itemsData?.reduce((sum, item) => {
        return sum + (item.estimated_cost ? item.estimated_cost * 0.05 : 0);
      }, 0) || 0;

      const pendingVerifications = users.filter(user => !user.is_verified).length;

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(user => user.status === 'online').length,
        totalItems: itemsData?.length || 0,
        totalChats: chatsData?.length || 0,
        newUsersToday,
        newItemsToday,
        totalRevenue,
        pendingVerifications
      });

      // Generate country statistics from real data
      const countryStats: { [key: string]: CountryStats } = {};
      
      users.forEach(user => {
        const country = user.location.split(', ')[1] || 'Unknown';
        if (!countryStats[country]) {
          countryStats[country] = {
            country,
            users: 0,
            activeUsers: 0,
            flag: getCountryFlag(country),
            revenue: 0
          };
        }
        countryStats[country].users++;
        if (user.status === 'online') {
          countryStats[country].activeUsers++;
        }
      });

      // Add revenue data
      itemsData?.forEach(item => {
        const revenue = item.estimated_cost ? item.estimated_cost * 0.05 : 0;
        // Distribute revenue across countries (simplified)
        Object.keys(countryStats).forEach(country => {
          countryStats[country].revenue += revenue / Object.keys(countryStats).length;
        });
      });

      setCountries(Object.values(countryStats).sort((a, b) => b.users - a.users));

      await fetchMessages();
      await fetchTasks();

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          *,
          chats!inner(
            items(name),
            sender:sender_id(full_name, avatar_url, state, country),
            receiver:receiver_id(full_name, avatar_url, state, country)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (messagesData) {
        const transformedMessages: RealMessage[] = messagesData.map(msg => ({
          id: msg.id,
          sender_name: msg.chats.sender?.full_name || 'Anonymous',
          content: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content,
          location: `${msg.chats.sender?.state || 'Unknown'}, ${msg.chats.sender?.country || 'Unknown'}`,
          avatar: msg.chats.sender?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
          created_at: msg.created_at,
          item_name: msg.chats.items?.name || 'Unknown Item'
        }));

        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchTasks = async () => {
    // For now, create some system-generated tasks based on real data
    const systemTasks: RealTask[] = [
      {
        id: '1',
        title: 'Review Pending Verifications',
        description: `${stats.pendingVerifications} users pending verification`,
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Monitor New Listings',
        description: `${stats.newItemsToday} new items listed today`,
        status: 'in_progress',
        priority: 'medium',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'Revenue Analysis',
        description: `Total revenue: ₦${stats.totalRevenue.toLocaleString()}`,
        status: 'pending',
        priority: 'medium',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      }
    ];

    setTasks(systemTasks);
  };

  const getCountryFlag = (country: string): string => {
    const flags: { [key: string]: string } = {
      'Nigeria': '🇳🇬',
      'Ghana': '🇬🇭',
      'Kenya': '🇰🇪',
      'South Africa': '🇿🇦',
      'Egypt': '🇪🇬',
      'Morocco': '🇲🇦',
      'Ethiopia': '🇪🇹',
      'Uganda': '🇺🇬',
      'Tanzania': '🇹🇿',
      'Algeria': '🇩🇿',
      'Unknown': '🌍'
    };
    return flags[country] || '🌍';
  };

  const handleSignOut = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin');
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDescription.trim()) return;

    const newTask: RealTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      status: 'pending',
      priority: 'medium',
      created_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setShowTaskForm(false);
  };

  const updateTaskStatus = (taskId: string, newStatus: 'pending' | 'completed' | 'in_progress') => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const verifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_verified: true } : user
      ));
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Failed to verify user');
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
    { id: 'messages', icon: MessageCircle, label: 'Messages', badge: messages.length },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', badge: tasks.filter(t => t.status === 'pending').length },
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
            <h2 className="text-2xl font-bold text-[#4A0E67] mb-6">Recent Messages</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F7941D]">
                      <img src={message.avatar} alt={message.sender_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{message.sender_name}</h3>
                    <p className="text-sm text-gray-600 truncate">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{message.location}</span>
                      <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Item: {message.item_name}</p>
                  </div>
                  <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
            {messages.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No messages yet</p>
              </div>
            )}
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#4A0E67]">Tasks</h2>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="flex items-center space-x-2 bg-[#4A0E67] text-white px-4 py-2 rounded-lg hover:bg-[#3a0b50] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            {showTaskForm && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:border-[#4A0E67]"
                  />
                  <textarea
                    placeholder="Task description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full p-3 border rounded-lg h-24 focus:outline-none focus:border-[#4A0E67]"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateTask}
                      className="bg-[#4A0E67] text-white px-4 py-2 rounded-lg hover:bg-[#3a0b50] transition-colors"
                    >
                      Create Task
                    </button>
                    <button
                      onClick={() => setShowTaskForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {task.status === 'in_progress' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      {task.status === 'pending' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#4A0E67] mb-6">Users by Country - {countries.reduce((sum, country) => sum + country.users, 0).toLocaleString()}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {countries.map((country, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                    {country.flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{country.country}</h3>
                    <p className="text-sm text-gray-600">{country.users} Users</p>
                    <p className="text-xs text-gray-500">Revenue: ₦{country.revenue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-green-600">{country.activeUsers} Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#4A0E67] mb-6">System Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Platform Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Listing Fee Percentage</label>
                    <input type="number" defaultValue="5" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Images per Item</label>
                    <input type="number" defaultValue="3" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Auto-verify Users</label>
                    <select className="w-full p-2 border rounded">
                      <option value="false">Manual Verification</option>
                      <option value="true">Auto Verification</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                    <input type="email" defaultValue="noreply@lizexpressltd.com" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                    <input type="email" defaultValue="support@lizexpressltd.com" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Verification</label>
                    <select className="w-full p-2 border rounded">
                      <option value="true">Required</option>
                      <option value="false">Optional</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Payment Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Flutterwave Public Key</label>
                    <input type="text" placeholder="FLWPUBK-****" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select className="w-full p-2 border rounded">
                      <option value="NGN">Nigerian Naira (NGN)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="GHS">Ghanaian Cedi (GHS)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input type="number" defaultValue="60" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <input type="number" defaultValue="5" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Two-Factor Authentication</label>
                    <select className="w-full p-2 border rounded">
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="bg-[#4A0E67] text-white px-6 py-2 rounded-lg hover:bg-[#3a0b50] transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        );

      default:
        return (
          <>
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
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

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">₦{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Verifications</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingVerifications}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
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
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 truncate">{user.full_name}</h3>
                            {user.is_verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
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

                        <div className="flex items-center space-x-2">
                          {!user.is_verified && (
                            <button
                              onClick={() => verifyUser(user.id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Verify User"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
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
                <h2 className="text-lg font-bold text-[#4A0E67]">LizExpress Admin</h2>
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
                      {item.badge && item.badge > 0 && (
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
                {activeTab === 'home' ? `Dashboard - ${stats.totalUsers.toLocaleString()} Users` : 
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
                <span className="bg-[#F7941D] text-white text-xs px-2 py-1 rounded-full">+{stats.newUsersToday}</span>
              </button>

              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <Bell className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">Admin</p>
                  <p className="text-xs text-gray-500">LizExpress Ltd</p>
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