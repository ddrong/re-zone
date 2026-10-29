# 정비ON AI 7대 기능 검사 결과

2026-10-30 KST · 기준 커밋 bb7321a · 현재 수정본은 미커밋·미배포.

## 현재 상태

| 기능               | 구현/검사 결과                                                                                                                                                              | 남은 작업                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 카카오 가입·로그인 | 기존 서버 Supabase 클라이언트로 signInWithOAuth(kakao), PKCE 교환·쿠키·내부 복귀 검증 재사용. 두 버튼은 제출 중 함께 비활성화. 취소·실패·재시도 안내. 모의 검사 통과        | 로컬 인증 공개 변수 없음. 실제 제공업체 설정·실계정 로그인·세션 새로고침·로그아웃은 미검증                                                   |
| 카카오맵           | 새 JS 키 이름과 기존 이름 지원. SDK 중복 방지, 로딩 완료 콜백에서 지도 생성, 부산 중심·확인된 주소만 지오코딩, 마커·상세 링크·필터 갱신. 실패·15초 초과 시 링크             | 두 지도 키 모두 로컬 미등록. 실제 지도·터치·마커 클릭 미검증. SDK를 사용한 것으로 가장하지 않음                                              |
| 부산 공식 검색     | 전체 공개 목록 페이지 순회·정규화·중복 제거. 부분 구역명/주소/구군/유형/단계 복합 검색. 제출 버튼·Enter, 현재 결과 기반 제안. 카드 클릭 상세 이동                           | 공식 HTML 구조 의존. 단계는 원문을 0~8 안내 그룹으로 대응. 제안은 현재 결과 기준이며 별도 전체 자동완성 아님                                 |
| 홈·개인화          | 가상 개인 소식/기본 관심/알림 수 제거. 소유자별 DB 조회, 신규 빈 상태·오류·카카오 CTA. 기존 관심지역 추가/해제와 알림 수신 설정 수정 연결                                   | 필수 public 테이블 없음. 실저장/복원/권한 테스트 미실행. 기존 모델은 관심 구역 저장 모델이 없고 User.email 필수이므로 별도 DB 설계 승인 필요 |
| 수익 계산기        | 모든 초기 금액·초기화 빈칸. 네 금액이 유효할 때만 계산. 빈칸·음수·지수·비정상·한도 초과 무효, 결과 —. 시나리오 유지 및 초기화 시 기준으로 복귀                              | 실제 브라우저 조작은 미검증                                                                                                                  |
| PC 디자인          | 제공된 로고/온이/Noto/색상 유지. 상단 탐색·통합 검색·통계·구군·TOP3·분석 카드, 다열 홈 구현. TOP3는 공식 목록 순 첫 3개이며 투자 추천 아님. AI 자동 분석은 준비 중으로 표시 | 별도 마지막 PC 이미지는 첨부되지 않아 일치 확인 불가. 부산 배경은 코드 장식이며 실제 부산 사진 자산은 추가하지 않음                          |
| 반응형             | 모바일 세로/하단 메뉴, 태블릿 2열, PC 대시보드, 1920 최대 폭. 검색 버튼 원형 CSS 충돌, 모바일 금액 폭, 로그인 헤더 겹침 보완                                                | 사용자 요청으로 이번 브라우저 검사 생략. 375/430/768/1024/1440/1920px 실제 가로 스크롤·스크린샷·클릭 미검증                                  |

## 실제 수행한 검사

- Codex CLI 로그인 상태 확인 성공. 현재 도구/명령 실행 정상. Pro 구독 반영·잔여 사용량을 직접 조회한 것은 아님.
- TypeScript: npm run typecheck 성공, 마지막 npm run build의 TypeScript 성공.
- ESLint: npm run lint 성공.
- 프로덕션: npm run build 성공.
- npm run check: 타입/린트 성공 후 기존 파일 35개의 format:check 경고로 실패. 이번 작업과 무관한 .agent/ 지침 및 설정을 일괄 수정하지 않음. 변경 파일은 별도 서식 검사.
- node scripts/check-auth-flows.mjs 성공: 이메일/카카오 모의 인증, PKCE/토큰 없는 복귀, 취소, 외부 주소 차단, 계산기 빈칸/초기화/금액 단위/무효 입력.
- node scripts/check-core-data.mjs 성공: 모의 공식 페이지 순회·중복 제거·복합 필터·캐시·오류 시 가상 대체 금지, 회원 소유권 조건, 비회원 거절. 실제 DB 쓰기나 RLS 테스트가 아님.
- node scripts/check-design-parity.mjs 성공: 원본 5개 뷰의 구조와 원본 CSS·온이 바이트 비교. 새 대시보드 픽셀 비교가 아님.
- 로컬 HTTP: 홈·계산기·로그인·관심 화면 200, 비회원 /api/account 개인정보 없이 private/no-store.
- 실제 공식 검색: 가야1 재개발(부산진구, 관리처분계획) 1건 / 가야3 재개발(부산진구, 준공) 1건. 구군+유형+단계+부분명 조합 통과, stage=99는 400. 실제 상세 화면과 지도 키 누락 링크 응답 확인.

## DB와 개인정보

실행한 명령: npm exec -- tsx scripts/audit-db-readonly.ts

DIRECT_URL로 BEGIN READ ONLY, 테이블·RLS 메타데이터 SELECT, ROLLBACK만 수행했다. 확인 대상 users/regions/favorite_regions/notifications/redevelopment_zones는 모두 없었다. 다른 스키마 데이터가 비어 있다는 뜻은 아니다. 연결 역할은 BYPASSRLS=true이므로 Prisma 접근이 사용자 RLS를 자동 적용하지 않는다. 앱 API/Actions에 Supabase 검증 사용자 ID와 소유권 조건을 넣었으며 모의 검사로 확인했다.

실제 사용자별 DB 접근·저장·삭제·알림 설정 수정은 테스트하지 않았다. 실제 테이블/RLS 정책 적용과 업무 쓰기 테스트는 별도 승인 후 진행한다. 스키마·마이그레이션·데이터·.env.local 값은 수정하지 않았다.

이메일 미제공 카카오 사용자의 세션은 이메일 입력 없이 유지하도록 구현했다. 그러나 현재 User.email은 필수다. 임의 이메일이나 다른 회원 프로필을 만들거나 연결하지 않고, 저장 기능의 제한을 표시한다. 이를 해소하려면 nullable 이메일 등 별도 모델 변경안 승인이 필요하다. 구역 찜을 관심지역 테이블에 억지로 저장하지 않는다.

## 사용자가 설정할 항목

로컬 .env.local 및 Vercel Production에 값은 직접 입력한다. 비밀값은 채팅/커밋에 포함하지 않는다.

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (기존 호환: NEXT_PUBLIC_SUPABASE_ANON_KEY)
- NEXT_PUBLIC_KAKAO_MAP_JS_KEY (기존 NEXT_PUBLIC_KAKAO_MAP_KEY도 지원, 새 이름 우선)
- DATABASE_URL: 기존 앱 DB 연결 유지
- DIRECT_URL: 기존 읽기 전용 검사·별도 승인 마이그레이션 용도 유지

Kakao REST API 키/Client Secret은 Supabase Kakao 제공업체 설정에만 등록한다. 프런트엔드 환경변수나 지도 키에 혼용하지 않는다. 로그인 공급자 자격 증명을 코드에 추가하지 않았다.

1. Supabase Authentication → Providers → Kakao 활성화와 REST 키/Client Secret 확인.
2. Kakao 로그인 Redirect URI는 해당 Supabase 프로젝트의 /auth/v1/callback. Supabase 화면이 제시하는 정확한 주소를 사용.
3. Supabase Site URL은 https://jeongbi-on.vercel.app, Redirect URLs에는 https://jeongbi-on.vercel.app/auth/callback 및 /auth/confirm 등록.
4. 이메일 제공을 요청할 수 없는 앱은 Supabase의 이메일 미제공 허용 설정과 Kakao 동의 항목을 확인. KOE205 등 공급자 설정 오류가 있으면 앱 유형/동의 항목을 먼저 확인하며 코드만으로 해결됐다고 보장하지 않는다.
5. 지도용 JavaScript 키, Kakao Maps 사용 설정과 Web SDK 허용 도메인에 운영 주소 및 사용할 localhost 포트를 등록.
6. NEXT_PUBLIC 값 변경 후 새 빌드 필요. 이번 배포는 사용자 승인 전 미실행.
7. 테이블·RLS·마이그레이션은 기존 SQL 검토 및 별도 적용 승인을 받은 뒤 준비.

공식 설정 참고:

- https://supabase.com/docs/guides/auth/social-sign-in/auth-kakao
- https://supabase.com/docs/guides/auth/redirect-urls
- https://apis.map.kakao.com/web/guide/

## 공식자료 갱신과 출처

- 재개발: https://dynamice.busan.go.kr/view.do?no=273
- 재건축: https://dynamice.busan.go.kr/view.do?no=274

인증키 OpenAPI로 부르지 않는다. 고정 공식 호스트만 요청, 요청당 10초/본문 크기 검사. 유형별 최대 40페이지, 페이지 20건 단위 앱 응답. 전체 수집 결과 1시간 메모리 캐시 및 Next fetch 캐시를 사용한다. 부분 실패는 1분 뒤 재시도할 수 있게 하며 부분 집계로 표시한다. 서버 인스턴스마다 캐시·최종 성공 시각이 다르고 영구 수집 이력이 아니다. 원본 갱신일과 앱 조회 시각을 구분하며 주소가 없는 구역에 임의 마커·폴리곤을 생성하지 않는다.

지역별 건수는 검색어/유형/단계를 적용한 같은 목록 기준이며 구군 필터를 바꿀 수 있는 집계다. 주소에서 지역을 확인할 수 없는 기록은 지역별 집계에서 제외된다. 오류 시 실제 결과를 가상 자료로 대체하지 않는다.

## 수정 파일

- 인증: src/app/auth/actions.ts, src/app/auth/callback/route.ts, src/app/auth/error/page.tsx, src/components/auth-form.tsx, src/components/kakao-login.tsx, src/app/my/page.tsx
- 회원별 조회·관심지역: src/app/api/account/route.ts, src/app/account/actions.ts, src/components/personal-regions.tsx, src/components/favorite-form.tsx, src/components/app-header.tsx
- 공식자료: src/lib/public-zones.ts, src/app/api/public-zones/route.ts, src/app/areas/page.tsx, src/components/public-explorer.tsx
- 화면·계산기·지도: src/components/dashboard-home.tsx, src/components/prototype-shell.tsx, src/components/prototype-views.jsx, src/lib/calculator.ts, src/components/kakao-map.tsx, src/app/integration.css
- 검사: scripts/audit-db-readonly.ts, scripts/check-auth-flows.mjs, scripts/check-core-data.mjs
- 안내: .env.example, docs/DESIGN_INTEGRATION.md, 이 문서, plans/20261030-063513-ddrong-core-seven.md
- README.md는 재개 시점에 이미 변경·스테이징되어 있던 사용자 작업이며 이번 재개 작업에서 덮어쓰지 않음.

Git 커밋/푸시·Vercel 배포·DB 초기화·마이그레이션·데이터 변경 없음. 현재 스테이징 상태를 임의 변경하지 않았다.

## 후속 배포 승인

사용자가 README 제출 내용 보존·main 일반 푸시·Vercel 자동 배포 확인을 승인했다. DB 변경은 승인하지 않았다. demo-backup과 main은 bb7321a 공통 기반으로 확인됐으며 작업 파일을 보존해 main으로 전환했다. vercel.json에 npm run typecheck && npm run lint && npm run build를 지정해 기존 서식 경고와 배포를 분리했다. 타입·린트·빌드가 다시 통과했고 README SHA-256 보존과 비밀정보/생성물 제외 검사를 통과했다. 실제 푸시·운영 확인 결과는 배포 후 채팅 보고로 구분한다.
