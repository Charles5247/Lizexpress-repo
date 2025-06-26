import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, MessageCircle, Calendar, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  itemsGrowth: { date: string; count: number }[];
  chatActivity: { date: string; count: number }[];
  topLocations: { location: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    itemsGrowth: [],
    chatActivity: [],
    topLocations: [],
    categoryDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch user growth
      const { data: users } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Fetch items growth
      const { data: items } = await supabase
        .from('items')
        .select('created_at, category')
        .gte('created_at', startDate.toISOString());

      // Fetch chat activity
      const { data: chats } = await supabase
        .from('chats')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Fetch location data
      const { data: locations } = await supabase
        .from('users')
        .select('state, country');

      // Process data for charts
      const userGrowth = processTimeSeriesData(users || [], days);
      const itemsGrowth = processTimeSeriesData(items || [], days);
      const chatActivity = processTimeSeriesData(chats || [], days);
      
      const topLocations = processLocationData(locations || []);
      const categoryDistribution = processCategoryData(items || []);

      setAnalytics({
        userGrowth,
        itemsGrowth,
        chatActivity,
        topLocations,
        categoryDistribution
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTimeSeriesData = (data: any[], days: number) => {
    const result = [];
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = data.filter(item => 
        item.created_at.startsWith(dateStr)
      ).length;
      
      result.push({ date: dateStr, count });
    }
    
    return result;
  };

  const processLocationData = (data: any[]) => {
    const locationCounts: { [key: string]: number } = {};
    
    data.forEach(user => {
      const location = `${user.state || 'Unknown'}, ${user.country || 'Unknown'}`;
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    
    return Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const processCategoryData = (data: any[]) => {
    const categoryCounts: { [key: string]: number } = {};
    
    data.forEach(item => {
      const category = item.category || 'Others';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Users,Items,Chats\n" +
      analytics.userGrowth.map((item, index) => 
        `${item.date},${item.count},${analytics.itemsGrowth[index]?.count || 0},${analytics.chatActivity[index]?.count || 0}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analytics_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#4A0E67]">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#4A0E67]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 bg-[#4A0E67] text-white px-4 py-2 rounded-lg hover:bg-[#3a0b50] transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A0E67] border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">User Growth</h2>
              <Users className="w-5 h-5 text-[#4A0E67]" />
            </div>
            <div className="h-64 flex items-end space-x-2">
              {analytics.userGrowth.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-[#4A0E67] rounded-t"
                    style={{ height: `${(item.count / Math.max(...analytics.userGrowth.map(d => d.count))) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Items Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Items Listed</h2>
              <Package className="w-5 h-5 text-[#F7941D]" />
            </div>
            <div className="h-64 flex items-end space-x-2">
              {analytics.itemsGrowth.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-[#F7941D] rounded-t"
                    style={{ height: `${(item.count / Math.max(...analytics.itemsGrowth.map(d => d.count))) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h2>
            <div className="space-y-3">
              {analytics.topLocations.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{location.location}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#4A0E67] h-2 rounded-full"
                        style={{ width: `${(location.count / analytics.topLocations[0]?.count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{location.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Categories</h2>
            <div className="space-y-3">
              {analytics.categoryDistribution.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category.category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#F7941D] h-2 rounded-full"
                        style={{ width: `${(category.count / analytics.categoryDistribution[0]?.count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{category.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;