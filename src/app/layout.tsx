import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Leadsetu — Bridge Every Lead to Revenue',
  description:
    "India's first AI-powered CRM for Delhi-NCR SMEs. Capture, qualify, and close leads 3x faster with WhatsApp integration and smart pipelines.",
  keywords: [
    'CRM',
    'AI CRM',
    'Delhi NCR CRM',
    'WhatsApp CRM',
    'Lead Management',
    'Sales CRM India',
  ],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Leadsetu — Bridge Every Lead to Revenue',
    description: "India's first AI-powered CRM for Delhi-NCR SMEs.",
    type: 'website',
    locale: 'en_IN',
  },
};

const themeInitScript = `
(function() {
  try {
    var savedMode = localStorage.getItem('leadsetu-theme') || localStorage.getItem('leadsetu_theme');
    var isDark = savedMode === 'dark';
    var savedColor = localStorage.getItem('leadsetu-color-theme') || 'static-blue';
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    root.setAttribute('data-color-theme', savedColor);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
