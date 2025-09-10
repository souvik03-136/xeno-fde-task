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

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/tenant', formData);
      window.location.reload();
    } catch (err) {
      console.error('Error creating tenant:', err);
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
      
      {tenants.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Existing Stores:</h3>
          {tenants.map(tenant => (
            <div key={tenant.id} style={{ 
              padding: '10px', 
              border: '1px solid #ccc', 
              marginBottom: '10px',
              cursor: 'pointer'
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
            cursor: 'pointer'
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
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Shopify Domain (e.g., mystore.myshopify.com)"
              value={formData.shopifyDomain}
              onChange={(e) => setFormData({...formData, shopifyDomain: e.target.value})}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Shopify Access Token (optional)"
              value={formData.shopifyToken}
              onChange={(e) => setFormData({...formData, shopifyToken: e.target.value})}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginRight: '10px'
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
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}