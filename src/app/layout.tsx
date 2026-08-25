import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Script from 'next/script';
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
  icons: {
    icon: [
      { url: '/images/nisargshala-logo.png?v=2', type: 'image/png' },
      { url: '/icon.png?v=2', type: 'image/png' },
    ],
    shortcut: '/images/nisargshala-logo.png?v=2',
    apple: '/images/nisargshala-logo.png?v=2',
  },
  alternates: {
    canonical: 'https://corp.nisargshala.in/',
  },
  openGraph: {
    title: 'Nisargshala Corporate Gift Vouchers',
    description: 'Reward performance with outdoor camping and adventure experiences.',
    url: 'https://corp.nisargshala.in/',
    siteName: 'Nisargshala Corporate Vouchers',
    type: 'website',
    images: [
      {
        url: '/images/nisargshala-logo.png',
        width: 800,
        height: 800,
        alt: 'Nisargshala Logo',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="icon" href="/images/nisargshala-logo.png?v=2" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/images/nisargshala-logo.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/images/nisargshala-logo.png?v=2" />
      </head>
      <body className="bg-sand-50 text-forest-900 antialiased selection:bg-amber-100 selection:text-amber-700">
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QF48HQHMRG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-QF48HQHMRG');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
