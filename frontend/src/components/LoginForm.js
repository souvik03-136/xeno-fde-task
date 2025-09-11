import { useState } from 'react';
import { signIn } from 'next-auth/react';
import api from '../lib/api';

export default function LoginForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Use NextAuth signIn for login
        const result = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password
        });
        
        if (result.error) {
          setError(result.error);
          return;
        }
        
        // Fetch tenants after successful login
        const tenantsResponse = await api.get('/tenant');
        onLogin({ email: formData.email }, tenantsResponse.data);
      } else {
        // Handle registration (not using NextAuth)
        const response = await api.post('/auth/register', formData);
        
        localStorage.setItem('token', response.data.token);
        
        const tenantsResponse = await api.get('/tenant');
        onLogin(response.data.user, tenantsResponse.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#007bff', 
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
      </button>
      
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
        >
          {isLogin ? 'Register' : 'Login'}
        </button>
      </p>
    </form>
  );
}