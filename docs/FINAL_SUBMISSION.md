# 정비ON AI 최종 제출 준비

기준 브랜치: handoff-20261030 / 기존 백업 HEAD f573a25. 운영 main은 8d1f995이며 새 코드의 운영 배포는 아직 승인 대기다.

## 적용 결과

- 20261030083739_four_feature_initial 마이그레이션을 사용자 명시 승인 후 jeongbi-on에 적용했다.
- 앱 테이블 12개, RLS 활성 테이블 12개, 정책 16개를 적용 후 읽기 전용으로 확인했다.
- 적용 전후 기존 Supabase Auth 사용자 2명의 수와 ID 집계 해시가 일치했다. Auth 사용자/비밀번호/기존 데이터 삭제·초기화 없음.
- anon의 users 조회, authenticated의 프로필 생성·supabaseAuthId 변경·notifications 생성 권한이 모두 없음을 확인했다.
- 서버 연결 역할은 여전히 BYPASSRLS다. RLS가 Prisma 쿼리를 자동 제한한다고 보장하지 않는다. 검증된 Auth ID와 소유권 조건을 모든 회원 서버 진입점에 유지한다. 별도 NOBYPASSRLS 역할 전환은 추후 별도 승인 대상이다.
- 12개 모델은 현재 관계·조회 코드와 일치한다. 일부 테이블만 생성하면 회원 조회 또는 FK가 실패할 수 있어 기존 검토안을 재사용했다.

## 인증과 심사 계정

- 이메일·비밀번호 로그인과 카카오 로그인을 화면에서 구분. 이메일 기반이므로 member1/member2는 구분명이며 실제 로그인에는 서로 다른 실제 이메일을 사용한다.
- 새 심사 계정 생성/비밀번호 변경은 이 작업에서 실행하지 않았다. 사용자가 계정 검사를 나중으로 미뤘다. 심사 계정 2개 준비·활성화·실제 로그인을 성공으로 표시하지 않는다.
- Supabase 관리자 콘솔에서 기존 계정과 다른 이메일 2개와 안전한 별도 비밀번호를 준비한다. 비밀번호는 비공개로 전달하고 코드·README·채팅에 기록하지 않는다.
- 실제 검사가 필요하면 로컬 .env.local의 REVIEW_MEMBER1_EMAIL/PASSWORD 및 REVIEW_MEMBER2_EMAIL/PASSWORD에 직접 설정한다. 이 변수는 로컬 QA용이며 Vercel 공개 변수로 올리지 않는다.
- 로그아웃 수정은 현재 프로젝트 세션 쿠키 정리, HttpOnly 로그아웃 보호 표식, 성공한 로그인/PKCE 교환에서 표식 해제, 서버·클라이언트 캐시 재검증을 포함한다.
- 실제 브라우저의 로그인→로그아웃→authenticated=false, 뒤로 가기 개인정보 비노출, MY 직접 접근, 계정 전환은 미검증이다.

## 디자인·이미지·OG

- 사용자 로고와 온이는 실제 알파 채널을 확인했다. 원본 픽셀을 재생성하지 않고 실제 비율로 표시하도록 연결했다.
- 헤더 로고 2172×724, 온이 1122×1402의 원본 비율을 반영. 모바일 크기와 이미지 잘림 방지 CSS, 1024px PC 상단 메뉴, Pill 버튼/hover/focus 보완.
- OG 원본은 public/assets/og-image-original.png에 바이트 그대로 보존했다.
- 사용자 승인한 Sharp 방식으로 public/og-image.png를 1200×630 contain 변환했다. 글자·캐릭터를 자르지 않으며 최종 이미지를 직접 확인했다.
- 사용자 앱 아이콘에서 favicon.ico를 파생하고 새 PNG 아이콘을 계속 연결했다.
- 요청한 title/description/openGraph website·ko_KR·1200×630 이미지·Twitter summary_large_image를 반영했다.
- 실제 375/430/768/1024/1440/1920px 브라우저 레이아웃·터치·키보드 검사는 연결 도구가 없어 미검증이다.

## 최종 검증

코드 변경 완료 후 최종 1회:

- npm run typecheck: 성공
- npm run lint: 성공
- npm run build: 성공
- scripts/check-auth-flows.mjs: 기존 이메일/PKCE/카카오·계산기와 추가 로그아웃 쿠키·늦은 갱신·계정 전환·쿠키 쓰기 실패 모의 검사 성공
- scripts/check-core-data.mjs: 공식 자료와 회원 A/B 저장·복원·소유권 모의 검사 성공

로컬 프로덕션 HTTP:

- 홈과 요청한 OG 메타데이터 성공
- 로고/온이/앱 아이콘/OG/favicon HTTP 200
- 로그아웃 보호 표식이 있는 합성 쿠키 요청의 authenticated=false 및 MY 비회원 응답 성공. 실계정 로그아웃 검사가 아님.
- 가야1 재개발 실제 부산 공식 자료 검색 성공

실제 DB 저장·수정·삭제·A/B 분리는 계정 검사 보류로 미실행. 실제 카카오 계정 로그인·지도 렌더링·마커 클릭·모바일 터치·반응형은 미검증. 지도 SDK의 운영 도메인 응답 200은 이전 확인 사실이며 실제 렌더링 검증과 다르다.

## URL

- 운영: https://jeongbi-on.vercel.app
- 심사 로그인: https://jeongbi-on.vercel.app/login
- 공식 검색: https://jeongbi-on.vercel.app/areas
- 관심지역·구역: https://jeongbi-on.vercel.app/favorites
- 계산기: https://jeongbi-on.vercel.app/analysis
- 회원 관리: https://jeongbi-on.vercel.app/my

## 배포 계획과 복구

1. README와 사용자 원본, .env.local 제외·비밀정보 검사를 확인한다.
2. 최신 원격 main이 8d1f995인 것을 재확인했다. 현재 작업은 이 커밋의 후손인 handoff 브랜치에서 진행했다.
3. 별도 사용자 승인 후 작업 브랜치에 변경을 커밋하고 main을 fast-forward로 반영한다. 강제 푸시·기존 커밋 삭제·브랜치 강제 병합 없음.
4. git push origin main 후 Vercel 자동 배포와 운영 HTTP·메타데이터를 확인한다.
5. DB 적용은 완료했지만 운영 코드 배포는 별도 승인 전까지 실행하지 않는다.
6. 운영 코드 문제가 있으면 기존 정상 배포로 복귀할 수 있으나 DB를 자동 역삭제하지 않는다. 신규 저장 데이터 보존 후 필요한 수정 마이그레이션을 별도 승인한다.

필요 운영 변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(또는 기존 ANON_KEY), NEXT_PUBLIC_KAKAO_MAP_JS_KEY(또는 기존 MAP_KEY), DATABASE_URL. DIRECT_URL은 별도 승인 마이그레이션 용도로 유지한다. 실제 값은 코드·SQL·문서·Git에 포함하지 않는다.

## 운영 반영 승인

사용자가 main fast-forward 반영·일반 푸시·Vercel 운영 배포를 명시 승인했고 Production 지도 키 등록 완료를 확인했다. 실계정 검사는 사용자 요청으로 보류한 상태를 유지한다. 배포 결과와 최종 커밋 ID는 완료 후 채팅으로 보고한다.
