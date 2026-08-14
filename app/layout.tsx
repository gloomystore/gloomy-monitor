import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'gloomymonitor',
  description: '여러 웹 서비스의 URL을 주기적으로 확인하고, 장애가 발생했을 때만 메일로 알려주는 셀프호스팅 업타임 모니터',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
