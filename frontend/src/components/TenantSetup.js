import { useState } from 'react';
import api from '../lib/api';

export default function TenantSetup({ tenants, onTenantSelect }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shopifyDomain: '',
    shopifyToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/tenant', formData);
      setSuccess('Store created successfully!');
      setFormData({ name: '', shopifyDomain: '', shopifyToken: '' });
      setShowForm(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error creating tenant:', err);
      setError(err.response?.data?.error || 'Error creating store');
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = (tenant) => {
    localStorage.setItem('tenantId', tenant.id);
    onTenantSelect();
  };

  return (
    <div>
      <h2>Select or Create Store</h2>

      {error && (
        <div style={{ 
          color: '#721c24', 
          backgroundColor: '#f8d7da', 
          padding: '10px', 
          marginBottom: '15px',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          color: '#155724', 
          backgroundColor: '#d4edda', 
          padding: '10px', 
          marginBottom: '15px',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          {success}
        </div>
      )}

      {tenants.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Existing Stores:</h3>
          {tenants.map(tenant => (
            <div key={tenant.id} style={{
              padding: '10px',
              border: '1px solid #ccc',
              marginBottom: '10px',
              cursor: 'pointer',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }} onClick={() => selectTenant(tenant)}>
              <strong>{tenant.name}</strong>
              <br />
              <small>{tenant.shopifyDomain}</small>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Add New Store
        </button>
      ) : (
        <form onSubmit={handleCreateTenant}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Store Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Shopify Domain (e.g., mystore.myshopify.com)"
              value={formData.shopifyDomain}
              onChange={(e) => setFormData({...formData, shopifyDomain: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Shopify Access Token (optional)"
              value={formData.shopifyToken}
              onChange={(e) => setFormData({...formData, shopifyToken: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              {loading ? 'Creating...' : 'Create Store'}
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}