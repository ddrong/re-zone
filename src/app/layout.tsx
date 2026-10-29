import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Noto_Sans_KR } from 'next/font/google';
import { PrototypeShell } from '@/components/prototype-shell';
import './globals.css';
const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto-kr',
  preload: false,
});
export const metadata: Metadata = {
  metadataBase: new URL('https://jeongbi-on.vercel.app'),
  title: { default: '정비ON AI | 부산 정비사업', template: '%s | 정비ON AI' },
  description:
    '부산 정비사업 공식 공개자료와 관심지역을 확인하세요. 시연용 매물과 계산 정보는 별도로 표시합니다.',
  icons: {
    icon: '/assets/jeongbion-app-icon.png',
    apple: '/assets/jeongbion-app-icon.png',
    shortcut: '/assets/jeongbion-app-icon.png',
  },
  referrer: 'no-referrer',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={noto.variable}>
      <body>
        <a className="skip-link" href="#main">
          본문 바로가기
        </a>
        <Suspense
          fallback={
            <div className="app-shell" role="status">
              정비ON AI를 불러오는 중입니다…
            </div>
          }
        >
          <PrototypeShell>{children}</PrototypeShell>
        </Suspense>
      </body>
    </html>
  );
}
