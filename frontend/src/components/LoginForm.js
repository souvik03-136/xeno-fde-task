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
        const result = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password
        });

        if (result?.error) {
          setError('Invalid credentials');
          return;
        }

        if (result?.ok) {
          try {
            const tenantsResponse = await api.get('/tenant');
            onLogin({ email: formData.email }, tenantsResponse.data);
          } catch (apiError) {
            console.error('Error fetching tenants:', apiError);
            onLogin({ email: formData.email }, []);
          }
        }
      } else {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed');
          }

          const data = await response.json();
          
          const loginResult = await signIn('credentials', {
            redirect: false,
            email: formData.email,
            password: formData.password
          });

          if (loginResult?.ok) {
            const tenantsResponse = await api.get('/tenant');
            onLogin(data.user, tenantsResponse.data);
          }
        } catch (registerError) {
          setError(registerError.message || 'Registration failed');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An error occurred during authentication');
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