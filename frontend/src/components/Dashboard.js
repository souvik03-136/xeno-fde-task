import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../lib/api';

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchStats = async () => {
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      
      const response = await api.get('/insights/dashboard', { params });
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    try {
      await api.post('/shopify/sync');
      await fetchStats();
      alert('Data synced successfully!');
    } catch (err) {
      alert('Sync failed. Please check your Shopify configuration.');
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Shopify Dashboard</h1>
        <div>
          <button 
            onClick={syncData}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Sync Data
          </button>
          <button 
            onClick={onLogout}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#dc3545', 
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Start Date:</label>
        <input 
          type="date" 
          value={dateRange.startDate}
          onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          style={{ marginRight: '20px', padding: '5px' }}
        />
        <label style={{ marginRight: '10px' }}>End Date:</label>
        <input 
          type="date" 
          value={dateRange.endDate}
          onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          style={{ padding: '5px' }}
        />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3>Total Customers</h3>
          <p style={{ fontSize: '2em', margin: '10px 0', color: '#007bff' }}>
            {stats?.totalCustomers || 0}
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3>Total Orders</h3>
          <p style={{ fontSize: '2em', margin: '10px 0', color: '#28a745' }}>
            {stats?.totalOrders || 0}
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3>Total Revenue</h3>
          <p style={{ fontSize: '2em', margin: '10px 0', color: '#ffc107' }}>
            ${(stats?.totalRevenue || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '30px'
      }}>
        <div>
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

        <div>
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

      <div style={{ marginTop: '30px' }}>
        <h3>Top 5 Customers by Spend</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          {stats?.topCustomers?.map((customer, index) => (
            <div key={index} style={{ 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6'
            }}>
              <h4>{customer.firstName} {customer.lastName}</h4>
              <p>{customer.email}</p>
              <p><strong>${customer.totalSpent.toFixed(2)}</strong></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}