import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // Fix: Use the correct backend URL and route path
          const backendUrl = process.env.BACKEND_URL || 'https://xeno-backend-u3yb.onrender.com';
          const loginUrl = `${backendUrl}/api/auth/login`;
          
          console.log('Attempting login to:', loginUrl);
          
          const res = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            }),
          });

          console.log('Login response status:', res.status);
          console.log('Login response headers:', Object.fromEntries(res.headers.entries()));

          if (!res.ok) {
            const errorText = await res.text();
            console.error('Login failed:', res.status, res.statusText);
            console.error('Response body:', errorText);
            return null;
          }

          // Check if response is JSON
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const responseText = await res.text();
            console.error('Expected JSON but got:', contentType);
            console.error('Response body:', responseText);
            return null;
          }

          const data = await res.json();
          console.log('Login response data:', data);
          
          if (data && data.token && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name || data.user.email,
              token: data.token
            };
          }
          
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.id;
      session.user.email = token.email;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Add debug mode for development
  debug: process.env.NODE_ENV === 'development',
});