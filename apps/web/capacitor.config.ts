import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fim.app',
  appName: 'Fim',
  webDir: 'out',
  server: {
    androidScheme: 'http'
  }
};

export default config;
