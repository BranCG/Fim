import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CookieBanner } from '@/components/CookieBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Fim — La red de conductores más rentable de Chile',
  description: 'La app de transporte más económica de Santiago. Sin comisiones para conductores. Más barata que Uber para pasajeros.',
  keywords: ['transporte', 'taxi', 'Santiago', 'Chile', 'rides', 'Fim'],
  authors: [{ name: 'Fim' }],
  manifest: '/manifest.json',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#00E5A0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <ThemeProvider>
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
