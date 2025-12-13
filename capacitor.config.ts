import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spends.app',
  appName: 'Spends',
  webDir: 'mobile-assets',
  server: {
    url: 'https://dailyspends.netlify.app/', // 👈 REPLACE THIS WITH YOUR VERCEL/DEPLOYMENT URL
    cleartext: true
  },
};

export default config;
