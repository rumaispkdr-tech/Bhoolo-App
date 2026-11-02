import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegistration } from '@/components/common/PwaRegistration';

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Bhoolo | Assessment & Examination Platform',
  description: 'Bhoolo Individual Quiz & Examination Platform managed by Dhdc.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bhoolo',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] text-[#172033] antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
        <div className="flex-1">
          {children}
        </div>

        {/* Global Minimalist Powered By Rumais Watermark / Copyright Footer */}
        <footer className="py-3 text-center border-t border-slate-100 bg-white/50 select-none">
          <p className="text-[11px] font-medium tracking-wide text-slate-400">
            &copy; {new Date().getFullYear()} Bhoolo &bull; <span className="font-semibold text-slate-500">Powered By Rumais</span>
          </p>
        </footer>

        <PwaRegistration />
      </body>
    </html>
  );
}
