import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import LoginForm from '../components/LoginForm';
import TenantSetup from '../components/TenantSetup';
import api from '../lib/api';

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      const tenantId = localStorage.getItem('tenantId');

      if (tenantId) {
        router.push('/dashboard');
      } else {
        setLoading(true);
        fetchTenants();
      }
    }
  }, [session, status]);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenant');
      const userTenants = response.data;

      if (userTenants.length === 1) {
        localStorage.setItem('tenantId', userTenants[0].id);
        router.push('/dashboard');
      } else {
        setUser({ email: session.user.email });
        setTenants(userTenants);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setUser({ email: session.user.email });
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div>Loading...</div>;
  }

  if (session && localStorage.getItem('tenantId')) {
    return <div>Redirecting to dashboard...</div>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Xeno FDE Dashboard</h1>
      {!user ? (
        <LoginForm onLogin={(userData, userTenants) => {
          setUser(userData);
          setTenants(userTenants);
        }} />
      ) : (
        <TenantSetup
          user={user}
          tenants={tenants}
          onTenantSelect={() => router.push('/dashboard')}
        />
      )}
    </div>
  );
}