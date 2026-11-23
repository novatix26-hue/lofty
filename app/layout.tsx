import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito, Baloo_Bhaijaan_2 } from 'next/font/google';
import './globals.css';
import { PwaRegister } from '@/components/common/PwaRegister';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

const balooBhaijaan2 = Baloo_Bhaijaan_2({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lofty Online Educational LMS',
  description: 'Fast, interactive LMS for Kids (5–12) and Adults with Drip Learning and Audio/Visual Quizzes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lofty LMS',
  },
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fredoka.variable} ${nunito.variable} ${balooBhaijaan2.variable}`}
    >
      <body
        className="antialiased font-sans selection:bg-amber-400 selection:text-slate-900 bg-[#FFFDF7] text-slate-800"
        suppressHydrationWarning
      >
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
