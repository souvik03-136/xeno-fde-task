import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import LoginForm from '../components/LoginForm';
import TenantSetup from '../components/TenantSetup';

export default function Login() {
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  
  // Redirect if already logged in
  if (session) {
    router.push('/dashboard');
    return null;
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
          onTenantSelect={() => window.location.href = '/dashboard'}
        />
      )}
    </div>
  );
}