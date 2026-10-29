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
  title: {
    default: '정비ON AI | 부산 재개발·재건축 정보',
    template: '%s | 정비ON AI',
  },
  description:
    '부산 정비사업 정보를 한눈에! 재개발·재건축 검색부터 관심지역 관리와 투자 수익 분석까지.',
  openGraph: {
    title: '정비ON AI | 부산 재개발·재건축 정보',
    description:
      '부산 정비사업 정보를 한눈에! 재개발·재건축 검색부터 관심지역 관리와 투자 수익 분석까지.',
    url: 'https://jeongbi-on.vercel.app',
    siteName: '정비ON AI',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '정비ON AI 부산 정비사업 서비스',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '정비ON AI | 부산 재개발·재건축 정보',
    description:
      '부산 정비사업 정보를 한눈에! 재개발·재건축 검색부터 관심지역 관리와 투자 수익 분석까지.',
    images: ['/og-image.png'],
  },
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
