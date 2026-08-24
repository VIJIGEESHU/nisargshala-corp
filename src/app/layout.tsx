import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nisargshala Corporate Gift Voucher System',
  description: 'Reward performance with experiences people will remember. Official Nisargshala Corporate Experience Gift Voucher Issuance Platform.',
  metadataBase: new URL('https://corp.nisargshala.in/'),
  alternates: {
    canonical: 'https://corp.nisargshala.in/',
  },
  openGraph: {
    title: 'Nisargshala Corporate Gift Vouchers',
    description: 'Reward performance with outdoor camping and adventure experiences.',
    url: 'https://corp.nisargshala.in/',
    siteName: 'Nisargshala Corporate Vouchers',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-sand-50 text-forest-900 antialiased selection:bg-amber-100 selection:text-amber-700">
        {children}
      </body>
    </html>
  );
}
