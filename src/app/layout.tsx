import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import '@/styles/tokens.css';
import '@/styles/section-themes.css';
import './globals.css';

const nunitoSans = Nunito_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

const siteUrl = 'https://moya-parta.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Моя парта — цифровий клас для учнів 1–4',
    template: '%s · Моя парта',
  },
  description:
    'Моя парта — закритий цифровий клас для учнів 1–4 класів: навчання, творчість, квести та життя класу без рейтингів між дітьми.',
  applicationName: 'Моя парта',
  keywords: [
    'Моя парта',
    'цифровий клас',
    'учні 1-4 клас',
    'код класу',
    'онлайн клас для молодшої школи',
  ],
  authors: [{ name: 'Моя парта' }],
  openGraph: {
    title: 'Моя парта',
    description:
      'Цифровий клас, де в кожного своє місце. Для учнів 1–4 класів — без рейтингів між дітьми.',
    type: 'website',
    locale: 'uk_UA',
    url: siteUrl,
    siteName: 'Моя парта',
    images: [
      {
        url: '/brand/og.png',
        width: 1200,
        height: 630,
        alt: 'Моя парта — цифровий клас',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Моя парта',
    description:
      'Цифровий клас, де в кожного своє місце. Для учнів 1–4 класів.',
    images: ['/brand/og.png'],
  },
  icons: {
    icon: [{ url: '/brand/logo.png', type: 'image/png' }],
    apple: [{ url: '/brand/logo.png' }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={nunitoSans.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
