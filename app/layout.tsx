import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'site-monitor',
  description: 'pm2 웹 서비스 상태 감시',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
