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
  const [customerSort, setCustomerSort] = useState('spending'); // spending, orders, name
  const [productView, setProductView] = useState('revenue'); // revenue, performance

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

  // Helper functions for enhanced features
  const getCustomerTier = (totalSpent) => {
    if (totalSpent >= 1000) return { tier: 'VIP', icon: '👑', color: '#FFD700' };
    if (totalSpent >= 500) return { tier: 'Gold', icon: '🌟', color: '#FF8C00' };
    if (totalSpent >= 200) return { tier: 'Silver', icon: '⭐', color: '#C0C0C0' };
    return { tier: 'Bronze', icon: '🔰', color: '#CD7F32' };
  };

  const getEngagementLevel = (ordersCount) => {
    if (ordersCount >= 10) return { level: 'Highly Active', percentage: 100, color: '#22c55e' };
    if (ordersCount >= 5) return { level: 'Active', percentage: 75, color: '#3b82f6' };
    if (ordersCount >= 2) return { level: 'Regular', percentage: 50, color: '#f59e0b' };
    return { level: 'New', percentage: 25, color: '#ef4444' };
  };

  const sortCustomers = (customers, sortBy) => {
    if (!customers) return [];
    return [...customers].sort((a, b) => {
      switch (sortBy) {
        case 'spending':
          return b.totalSpent - a.totalSpent;
        case 'orders':
          return b.ordersCount - a.ordersCount;
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        default:
          return 0;
      }
    });
  };

  const getProductPerformance = (products) => {
    if (!products || products.length === 0) return [];
    
    const maxRevenue = Math.max(...products.map(p => p.revenue));
    return products.map((product, index) => ({
      ...product,
      rank: index + 1,
      performance: Math.round((product.revenue / maxRevenue) * 100),
      badge: getBadgeForPerformance((product.revenue / maxRevenue) * 100)
    }));
  };

  const getBadgeForPerformance = (percentage) => {
    if (percentage >= 80) return { text: 'Top Performer', color: '#22c55e' };
    if (percentage >= 60) return { text: 'High Performer', color: '#3b82f6' };
    if (percentage >= 40) return { text: 'Good Performer', color: '#f59e0b' };
    return { text: 'Needs Attention', color: '#ef4444' };
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const sortedCustomers = sortCustomers(stats?.topCustomers, customerSort);
  const enhancedProducts = getProductPerformance(stats?.revenueByProduct);

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
          <div className="customers-header">
            <h2>Customer Insights</h2>
            <div className="customer-controls">
              <label>Sort by:</label>
              <select 
                value={customerSort} 
                onChange={(e) => setCustomerSort(e.target.value)}
                className="sort-select"
              >
                <option value="spending">Total Spending</option>
                <option value="orders">Number of Orders</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* Customer Analytics */}
          <div className="customer-analytics">
            <div className="analytics-card">
              <div className="analytics-icon">👑</div>
              <div>
                <h4>{sortedCustomers?.filter(c => getCustomerTier(c.totalSpent).tier === 'VIP').length || 0}</h4>
                <span>VIP Customers</span>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">🔄</div>
              <div>
                <h4>{sortedCustomers?.filter(c => c.ordersCount > 1).length || 0}</h4>
                <span>Repeat Customers</span>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">💰</div>
              <div>
                <h4>${sortedCustomers?.length ? (sortedCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / sortedCustomers.length).toFixed(0) : 0}</h4>
                <span>Avg Order Value</span>
              </div>
            </div>
          </div>

          <div className="customers-grid">
            {sortedCustomers?.map((customer, index) => {
              const tier = getCustomerTier(customer.totalSpent);
              const engagement = getEngagementLevel(customer.ordersCount);
              
              return (
                <div key={index} className="customer-card enhanced">
                  <div className="customer-header">
                    <div className="customer-info">
                      <h4>{customer.firstName} {customer.lastName}</h4>
                      <p className="customer-email">{customer.email}</p>
                    </div>
                    <div className="customer-tier" style={{ color: tier.color }}>
                      <span className="tier-icon">{tier.icon}</span>
                      <span className="tier-text">{tier.tier}</span>
                    </div>
                  </div>
                  
                  <div className="customer-stats">
                    <div className="stat-item">
                      <span className="stat-label">Orders</span>
                      <span className="stat-value">{customer.ordersCount}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Spent</span>
                      <span className="stat-value">${customer.totalSpent.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="engagement-meter">
                    <div className="engagement-label">
                      <span>{engagement.level}</span>
                      <span>{engagement.percentage}%</span>
                    </div>
                    <div className="engagement-bar">
                      <div 
                        className="engagement-fill"
                        style={{ 
                          width: `${engagement.percentage}%`,
                          backgroundColor: engagement.color 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="products-tab">
          <div className="products-header">
            <h2>Product Performance</h2>
            <div className="product-controls">
              <button 
                className={productView === 'revenue' ? 'view-btn active' : 'view-btn'}
                onClick={() => setProductView('revenue')}
              >
                Revenue View
              </button>
              <button 
                className={productView === 'performance' ? 'view-btn active' : 'view-btn'}
                onClick={() => setProductView('performance')}
              >
                Performance View
              </button>
            </div>
          </div>

          {productView === 'revenue' && (
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
          )}

          {productView === 'performance' && (
            <div className="products-grid">
              {enhancedProducts?.map((product, index) => (
                <div key={index} className="product-card">
                  <div className="product-rank">#{product.rank}</div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <div className="product-revenue">${product.revenue.toFixed(2)}</div>
                  </div>
                  <div 
                    className="product-badge"
                    style={{ backgroundColor: product.badge.color }}
                  >
                    {product.badge.text}
                  </div>
                  <div className="performance-bar">
                    <div className="performance-label">
                      <span>Performance</span>
                      <span>{product.performance}%</span>
                    </div>
                    <div className="performance-track">
                      <div 
                        className="performance-fill"
                        style={{ 
                          width: `${product.performance}%`,
                          backgroundColor: product.badge.color 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}