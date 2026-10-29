# 정비ON AI 웹앱 실행과 승인 대기 작업

## 구현 범위

- /: 원본 React/Vite 홈. 매물·가격·알림은 시연용.
- /areas: 부산 16개 구·군 공식 공개자료 검색과 시연 자료 탭.
- /favorites, /alerts, /analysis, /my: 원본 관심·알림·계산기·MY 화면.
- /zones/[id]: 사업 개요, 단계 이력, 출처.
- /login, /signup: Supabase 이메일 인증.
- /account: 인증된 회원별 관심지역 저장·해제.
- /auth/confirm: 이메일 token_hash 확인. /auth/callback: PKCE 코드 교환.
- 공식 공개자료 조회가 실패하면 오류를 표시하며 가상 자료로 자동 대체하지 않는다.
- 디자인·공식 자료 연계의 자세한 범위는 [통합 안내](DESIGN_INTEGRATION.md)를 따른다.
- SNS 로그인, 공공 API 자동 수집, 매물 알림 전송은 이번 범위에 없다.

## 로컬 실행

Node.js 24.x에서 npm run dev로 실행한다.
.env.local의 기존 DB 변수는 유지한다. 아래 공개 변수는 사용자가 로컬 편집기에 직접 입력한다.

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (기존 ANON_KEY도 호환)

관리자 키는 필요하지 않다. 인증 변수가 없으면 가입·로그인 제출을 막고 서비스 준비 중으로 표시한다.

## 이메일 인증 설정

1. Supabase Authentication에서 이메일 인증을 활성화하고 이메일 확인을 유지한다.
2. URL Configuration의 Site URL을 실제 앱 주소로 설정한다.
3. 로컬·배포 URL의 /auth/confirm, /auth/callback 경로를 허용 목록에 등록한다.
4. Confirm signup 이메일 템플릿의 링크는 다음 형태로 설정한다.

`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

5. 실제 공개 전 SMTP, 요청 제한, CAPTCHA와 비밀번호 복구 정책을 점검한다.
6. 이메일 인증 ID로 앱 프로필을 연결한다. 이메일만 같은 기존 회원은 자동 병합하지 않는다.

회원가입·관심지역 저장은 실제 서비스 쓰기 동작이다. 실제 DB 적용 승인 전에는 회원 생성·저장 테스트를 하지 않는다.

## DB 적용 승인 대기

읽기 전용 조사에서 public 테이블과 _prisma_migrations가 없음을 확인했다.
이는 조사 당시 접속 역할의 가시 범위이며 실행 직전에 다시 확인해야 한다.
prisma/review/initial-schema.sql은 검토용 SQL이며 자동 실행되지 않는다.
삭제·초기화는 금지한다. SQL 실행과 마이그레이션 이력 등록은 별도 승인이 필요하다.

1. 대상 프로젝트·DB 용도·접속 역할과 기존 객체를 다시 확인한다.
2. 백업·복구 방법을 확인한다.
3. SQL의 테이블·인덱스·외래키·CHECK·RLS를 검토한다.
4. 별도 테스트 DB에서 승인 후 적용·기능·권한·기존 데이터 보존을 검증한다.
5. 검토 SQL을 정식 migration으로 등록하는 방식을 확정하고 실제 적용 승인을 요청한다.

직접 SQL 실행 후 Prisma 이력을 무시하면 drift가 생긴다.
기존 객체가 있으면 reset·drop·무조건 IF NOT EXISTS로 숨기지 않는다.
Prisma는 사용자 세션을 자동 전달하지 않는다. 서버는 getUser로 사용자와 소유권을 확인한다.
Data API 접근은 RLS로 기본 차단하고 필요한 정책은 별도 검토한다.
배포 전 서버 DB 역할의 최소 권한과 RLS 우회 여부를 확인한다.

## 검증

npm run db:validate, npm run check, npm run build를 실행한다.
검색·상세·빈 결과·비회원 화면·모바일을 별도로 확인한다.
가입·로그인 성공과 회원별 저장 격리는 승인된 테스트 계정과 DB 준비 후 검증한다.
전체 포맷 검사는 기존 파일의 줄바꿈 문제로 실패할 수 있으며 범위 밖 파일을 일괄 수정하지 않는다.
