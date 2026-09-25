import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Password',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Ambil password aman
        const appPassword = (process.env.APP_PASSWORD || 'couplegoals').trim();
        const submittedPassword = (credentials?.password || '').trim();
        
        console.log('DEBUG AUTH:', {
          submitted: submittedPassword,
          expected: appPassword,
          match: submittedPassword === appPassword
        });
        
        if (submittedPassword === appPassword) {
          return { id: '1', name: 'Couple' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login', // Custom login route
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 hari sesi
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-couple-saver-12345',
};
