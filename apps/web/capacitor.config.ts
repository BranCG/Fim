import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fim.app',
  appName: 'Fim',
  webDir: 'out',
  server: {
    androidScheme: 'http'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '974516739677-bvnm3kh8fn6qv6u59rqga6scbpdqtl4a.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
