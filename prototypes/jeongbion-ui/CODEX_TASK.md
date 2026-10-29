# Codex 개발 작업 지시서

이 프로젝트는 `design-references/` 에 있는 이미지 시안을 바탕으로 작성한 React/Vite 모바일 우선 웹앱이다. 파일을 분석하고 기존 구현을 유지하면서 아래 순서로 개선한다.

1. `design-references/home-reference.jpg`와 앱 홈 화면의 시각적 차이를 비교해 간격, 서체 크기, 색상, 그림자, 온이 캐릭터를 정밀 조정한다.
2. area/detail/favorites/analysis/my 참고 이미지를 보고 각 화면의 UI 완성도를 높인다. 특정 가상 구역명·가격·수익률이 실제로 검증된 수치처럼 보이지 않도록 반드시 '시연용' 표시를 유지한다.
3. 모바일 너비 360px, 390px, 430px, 태블릿에서 버튼/글자가 겹치지 않도록 확인한다. 너무 작은 글자와 한 화면에 너무 많은 카드가 나오지 않도록 한다.
4. Supabase Auth의 이메일 회원가입/로그인 및 Google/Kakao OAuth를 구현한다. Naver는 공식 지원 방식 검토 후 구현한다. 기존 로그인 계정에 SNS를 연결할 때 내부 사용자 ID가 바뀌지 않아야 한다.
5. Supabase PostgreSQL 테이블 및 RLS 설계: districts, favorite_districts, sale_listings, auction_listings, alert_preferences, notifications, stage_events, listing_price_events. 관리자 승인 없는 외부 카카오 발송을 금지한다.
6. 알림 설정 기본값은 sale=true, auction=true, price_change=true, stage_change=true, app=true, kakao_requested=true, frequency='instant'. `kakao_requested`는 수신 희망일 뿐 실제 발송 승인이 아니며 UI에 연동 전 상태를 표시한다.
7. 신규 매매·경매 및 가격·공식 단계 변경 감지에서 구역 ID 매칭, 출처/갱신일, 중복 방지를 구현한다. 허가된 데이터 소스 없이 외부 부동산 사이트를 임의 크롤링하지 않는다.
8. PWA 웹 푸시/배지는 지원기기 및 사용자 동의에 한해 구현한다.
9. 수익 분석은 시나리오 가정·누락비용·권리관계 불확실성을 명확히 드러낸다. 투자 추천 또는 확정 수익을 주장하지 않는다.
10. `npm run build`, 화면별 기능 테스트, GitHub 업로드용 README, Vercel 배포 구성을 완료한다.

중요: 이미지를 화면 배경으로 붙이는 방식이 아니라 **클릭 가능한 HTML/CSS/React UI**로 구현한다. 기존 시안의 색상, 구성, 분위기를 유지하되 콘텐츠 가독성과 접근성을 우선한다.
