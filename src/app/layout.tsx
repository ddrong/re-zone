import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PrototypeShell } from '@/components/prototype-shell';
import './globals.css';
export const metadata: Metadata = {
  title: { default: '정비ON AI | 부산 정비사업', template: '%s | 정비ON AI' },
  description:
    '부산 정비사업 공식 공개자료와 관심지역을 확인하세요. 시연용 매물과 계산 정보는 별도로 표시합니다.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main">
          본문 바로가기
        </a>
        <Suspense
          fallback={
            <div className="app-shell" role="status">
              Loading JeongbiON...
            </div>
          }
        >
          <PrototypeShell>{children}</PrototypeShell>
        </Suspense>
      </body>
    </html>
  );
}
