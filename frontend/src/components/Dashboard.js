import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter
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

  // Helper function to get customer status badge
  const getCustomerStatusBadge = (customer) => {
    const totalSpent = customer.totalSpent;
    if (totalSpent > 1000) return { label: 'VIP', color: '#gold', bgColor: '#fff3cd' };
    if (totalSpent > 500) return { label: 'Premium', color: '#6f42c1', bgColor: '#e2d9f3' };
    if (totalSpent > 100) return { label: 'Regular', color: '#28a745', bgColor: '#d4edda' };
    return { label: 'New', color: '#6c757d', bgColor: '#e9ecef' };
  };

  // Helper function to calculate days since last order
  const getDaysSinceLastOrder = (lastOrderDate) => {
    if (!lastOrderDate) return 'Never';
    const today = new Date();
    const lastOrder = new Date(lastOrderDate);
    const diffTime = Math.abs(today - lastOrder);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

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
          {/* Customer Analytics Header */}
          <div className="customers-header">
            <h2>Customer Analytics</h2>
            <div className="customer-summary-stats">
              <div className="mini-stat">
                <span className="mini-stat-number">{stats?.customerSegments?.vip || 0}</span>
                <span className="mini-stat-label">VIP Customers</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-number">${(stats?.avgOrderValue || 0).toFixed(2)}</span>
                <span className="mini-stat-label">Avg Order Value</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-number">{(stats?.repeatCustomerRate || 0).toFixed(1)}%</span>
                <span className="mini-stat-label">Repeat Rate</span>
              </div>
            </div>
          </div>

          {/* Customer Lifetime Value Chart */}
          <div className="chart-container">
            <h3>Customer Lifetime Value Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats?.clvDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Customers']} />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Segmentation */}
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Customer Segments</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'VIP ($1000+)', value: stats?.customerSegments?.vip || 0 },
                      { name: 'Premium ($500-999)', value: stats?.customerSegments?.premium || 0 },
                      { name: 'Regular ($100-499)', value: stats?.customerSegments?.regular || 0 },
                      { name: 'New (<$100)', value: stats?.customerSegments?.new || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`segment-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>Customer Acquisition Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats?.customerAcquisition || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="newCustomers" stroke="#00C49F" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Customer List */}
          <h3>Top Customers</h3>
          <div className="customers-grid-enhanced">
            {stats?.topCustomers?.map((customer, index) => {
              const status = getCustomerStatusBadge(customer);
              const daysSince = getDaysSinceLastOrder(customer.lastOrderDate);
              
              return (
                <div key={index} className="customer-card-enhanced">
                  <div className="customer-header">
                    <div className="customer-avatar">
                      {customer.firstName?.[0]}{customer.lastName?.[0]}
                    </div>
                    <div className="customer-info">
                      <h4>{customer.firstName} {customer.lastName}</h4>
                      <p className="customer-email">{customer.email}</p>
                      <span 
                        className="customer-status-badge"
                        style={{ 
                          backgroundColor: status.bgColor, 
                          color: status.color,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="customer-stats">
                    <div className="stat-row">
                      <span className="stat-label">Total Orders:</span>
                      <span className="stat-value">{customer.ordersCount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Total Spent:</span>
                      <span className="stat-value">${customer.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Avg Order Value:</span>
                      <span className="stat-value">${(customer.totalSpent / customer.ordersCount).toFixed(2)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Last Order:</span>
                      <span className="stat-value">{daysSince}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Location:</span>
                      <span className="stat-value">{customer.city || 'N/A'}, {customer.country || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {customer.favoriteCategory && (
                    <div className="customer-insights">
                      <small>💝 Loves: {customer.favoriteCategory}</small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="products-tab">
          {/* Product Analytics Header */}
          <div className="products-header">
            <h2>Product Analytics</h2>
            <div className="product-summary-stats">
              <div className="mini-stat">
                <span className="mini-stat-number">{stats?.totalProducts || 0}</span>
                <span className="mini-stat-label">Total Products</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-number">{stats?.outOfStock || 0}</span>
                <span className="mini-stat-label">Out of Stock</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-number">{(stats?.conversionRate || 0).toFixed(1)}%</span>
                <span className="mini-stat-label">Conversion Rate</span>
              </div>
            </div>
          </div>

          {/* Product Performance Charts */}
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Revenue by Product Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.revenueByProduct || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
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

            <div className="chart-container">
              <h3>Product Performance Matrix</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={stats?.productPerformance || []}>
                  <CartesianGrid />
                  <XAxis dataKey="units_sold" name="Units Sold" />
                  <YAxis dataKey="profit_margin" name="Profit Margin %" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      name === 'profit_margin' ? `${value}%` : value,
                      name === 'profit_margin' ? 'Profit Margin' : 'Units Sold'
                    ]}
                    labelFormatter={(label) => `Product: ${label}`}
                  />
                  <Scatter name="Products" dataKey="profit_margin" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products with Enhanced Details */}
          <h3>Top Performing Products</h3>
          <div className="products-grid-enhanced">
            {stats?.topProducts?.map((product, index) => (
              <div key={index} className="product-card-enhanced">
                <div className="product-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="product-placeholder">📦</div>
                  )}
                  {product.badge && (
                    <span className="product-badge">{product.badge}</span>
                  )}
                </div>
                
                <div className="product-details">
                  <h4 className="product-name">{product.name}</h4>
                  <p className="product-sku">SKU: {product.sku || 'N/A'}</p>
                  
                  <div className="product-metrics">
                    <div className="metric">
                      <span className="metric-label">Revenue</span>
                      <span className="metric-value">${product.revenue?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Units Sold</span>
                      <span className="metric-value">{product.units_sold || 0}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Profit Margin</span>
                      <span className="metric-value">{product.profit_margin?.toFixed(1) || '0'}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Stock Level</span>
                      <span className={`metric-value ${product.stock_level < 10 ? 'low-stock' : ''}`}>
                        {product.stock_level || 0}
                      </span>
                    </div>
                  </div>

                  <div className="product-insights">
                    <div className="insight-item">
                      <span className="insight-icon">📈</span>
                      <span className="insight-text">
                        Trending {product.trend_direction || 'stable'} 
                        ({product.trend_percentage || 0}%)
                      </span>
                    </div>
                    {product.return_rate && (
                      <div className="insight-item">
                        <span className="insight-icon">🔄</span>
                        <span className="insight-text">
                          Return Rate: {product.return_rate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {product.avg_rating && (
                      <div className="insight-item">
                        <span className="insight-icon">⭐</span>
                        <span className="insight-text">
                          Rating: {product.avg_rating.toFixed(1)}/5 
                          ({product.review_count || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Category Performance */}
          <div className="chart-container">
            <h3>Category Performance Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.categoryTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="current_month" fill="#00C49F" name="This Month" />
                <Bar dataKey="previous_month" fill="#FFBB28" name="Last Month" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <style jsx>{`
        .customers-header, .products-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }

        .customer-summary-stats, .product-summary-stats {
          display: flex;
          gap: 24px;
        }

        .mini-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          min-width: 80px;
        }

        .mini-stat-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #007bff;
        }

        .mini-stat-label {
          font-size: 0.75rem;
          color: #6c757d;
          text-align: center;
        }

        .customers-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-top: 16px;
        }

        .customer-card-enhanced {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e9ecef;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .customer-card-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .customer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .customer-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #007bff, #0056b3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .customer-info h4 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
        }

        .customer-email {
          margin: 0 0 8px 0;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .customer-stats {
          margin-bottom: 12px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .stat-value {
          font-weight: 600;
          color: #333;
        }

        .customer-insights {
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          color: #495057;
        }

        .products-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 16px;
        }

        .product-card-enhanced {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }

        .product-card-enhanced:hover {
          transform: translateY(-4px);
        }

        .product-image {
          position: relative;
          height: 160px;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-placeholder {
          font-size: 3rem;
          color: #dee2e6;
        }

        .product-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ff6b6b;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: bold;
        }

        .product-details {
          padding: 16px;
        }

        .product-name {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .product-sku {
          margin: 0 0 12px 0;
          color: #6c757d;
          font-size: 0.8rem;
        }

        .product-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          text-align: center;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .metric-label {
          font-size: 0.75rem;
          color: #6c757d;
          margin-bottom: 4px;
        }

        .metric-value {
          font-weight: bold;
          color: #333;
        }

        .metric-value.low-stock {
          color: #dc3545;
        }

        .product-insights {
          border-top: 1px solid #e9ecef;
          padding-top: 12px;
        }

        .insight-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 0.85rem;
        }

        .insight-icon {
          font-size: 1rem;
        }

        .insight-text {
          color: #495057;
        }
      `}</style>
    </div>
  );
}