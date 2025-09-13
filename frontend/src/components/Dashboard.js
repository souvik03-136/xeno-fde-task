import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import api from '../lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard({ onLogout }) {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await api.get(`/insights/dashboard?${params}`);
      setStats(response.data);
      setMessage('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setMessage('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      setMessage('Syncing data...');
      await api.post('/shopify/sync');
      await fetchStats();
      setMessage('Data synced successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Sync error:', err);
      setMessage('Sync failed. Please check your Shopify configuration.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session, dateRange]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Shopify Analytics Dashboard</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={syncData}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button className="btn btn-secondary" onClick={() => signOut()}>
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: message.includes('Error') || message.includes('failed') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') || message.includes('failed') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('Error') || message.includes('failed') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      <div className="date-filter">
        <label>Start Date:</label>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
        />
        <label>End Date:</label>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
        />
      </div>

      <div className="tab-navigation">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'customers' ? 'active' : ''}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Customers</h3>
              <p className="stat-number">{stats?.totalCustomers || 0}</p>
            </div>

            <div className="stat-card">
              <h3>Total Orders</h3>
              <p className="stat-number">{stats?.totalOrders || 0}</p>
            </div>

            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-number">${(stats?.totalRevenue || 0).toFixed(2)}</p>
            </div>

            <div className="stat-card">
              <h3>Abandoned Carts</h3>
              <p className="stat-number">{stats?.abandonedCarts || 0}</p>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Orders Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.ordersByDate || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#007bff" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>Revenue Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.ordersByDate || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#28a745" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'customers' && (
        <div className="customers-tab">
          <h2>Top Customers</h2>
          <div className="customers-grid">
            {stats?.topCustomers?.map((customer, index) => (
              <div key={index} className="customer-card">
                <h4>{customer.firstName} {customer.lastName}</h4>
                <p>{customer.email}</p>
                <p><strong>Orders:</strong> {customer.ordersCount}</p>
                <p><strong>Total Spent:</strong> ${customer.totalSpent.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="products-tab">
          <h2>Top Products by Revenue</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={stats?.revenueByProduct || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {stats?.revenueByProduct?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}