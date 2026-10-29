# 미완료 4대 기능 적용 전 검토

> 최신: 승인된 DB 마이그레이션 적용 및 제출 준비 결과는 [최종 제출 준비](FINAL_SUBMISSION.md)를 확인하세요. 아래 미적용 표시는 이전 단계 기록입니다.

기준: main 8d1f995. 사용자가 로컬 모델·연결 코드 반영만 승인했다. 승인된 12개 모델은 활성 schema.prisma에 반영했다. 실제 DB·환경변수 값·Git·운영 배포는 변경하지 않았다.

## 검토 파일

- prisma/review/four-feature.schema.prisma: 기존 10개 모델 보존, email 선택값, 2개 모델 추가. Prisma 7 문법 검사 성공.
- prisma/review/four-feature-initial.sql: 위 12개 모델의 초기 생성 SQL. 12개 테이블 RLS, 16개 소유권 정책, 기존 데이터 정합성 CHECK와 최소 권한 포함.
- 검토 SQL은 실행하지 않았다. prisma.config.ts의 경로는 유지하고 schema.prisma 내용에 승인된 모델을 반영했다. 정식 migrations 이력에는 등록하지 않았다.

## 확인된 현재 상태

- DATABASE_URL/DIRECT_URL의 프로젝트 참조와 Supabase 공개 URL은 jeongbi-on과 일치.
- 필수 앱 테이블 없음. 연결 역할 BYPASSRLS=true.
- 로컬 Supabase 공개 변수와 지도 키가 새로 등록된 것을 확인. 값은 출력하지 않았고 파일을 수정하지 않음.
- 공개 Auth 설정 응답 200, Kakao 제공업체 활성화 확인.
- 지도 SDK: 운영 도메인 Referer 요청 200. localhost:3000, localhost:3104는 도메인 거부 401/AccessDeniedError.
- 서버 HTTP 응답 확인은 브라우저에서 실제 지도 렌더링·터치 테스트가 아니다.
- 사용자가 미리보기 연결 완료를 알려 주었으나 도구는 여전히 사용 가능한 브라우저 없음으로 응답. 실제 로그인·여섯 해상도 클릭 검증 미실행.

## 모델과 변경 영향

1. User.email을 String? @unique로 변경. 기존 이메일·ID·다른 필드는 보존하고 임의 이메일을 생성하지 않는다. PostgreSQL unique는 여러 null을 허용한다. 인증 소유권 기준은 email이 아닌 supabaseAuthId.
2. FavoriteZone 추가: id, userId, zoneId, alertsEnabled, createdAt, updatedAt. User/RedevelopmentZone 관계, userId+zoneId unique, zoneId+alertsEnabled 인덱스. 공식 정비구역만 서버에서 확인 후 저장. 시연 구역 금지.
3. NotificationPreference 추가: userId 기본키, sale/auction/price/stage/app 수신 희망, kakaoRequested, frequency, updatedAt. frequency는 instant/daily/weekly만 허용. 저장이 실제 카카오톡 발송을 의미하지 않는다.
4. FavoriteRegion·Notification과 기존 10개 모델·필드는 보존. 알림 생성 및 사업 원본 수정은 클라이언트에 허용하지 않는다.
5. 기존 이메일로 다른 Auth 프로필을 자동 연결하지 않는다. 기존 미연결 회원이 있다면 별도 연결 검토 대상이다.

## RLS와 BYPASSRLS

- anon과 PUBLIC에는 검토 테이블 권한을 부여하지 않음.
- authenticated의 users 조회/이름·아바타 수정은 supabaseAuthId=auth.uid()인 행만 허용. 프로필 생성·Auth ID·이메일 변경은 서버에서 처리.
- 관심지역/관심구역/수신 설정은 연결된 users의 Auth ID가 자신의 UID인 행만 조회/추가/수정/해제 허용.
- notifications는 본인 조회, 본인 readAt 수정만 허용. 일반 회원의 알림 생성·다른 필드 수정 금지.
- 정책에 클라이언트 user_metadata의 관리자 값을 사용하지 않음. 관리자 정책이나 사용자 관리자 승격 기능을 추가하지 않음.
- 현재 Prisma 연결은 BYPASSRLS 역할이므로 위 정책의 보호 대상이 아니다. 검증된 Supabase 사용자 ID와 소유권 조건을 모든 서버 읽기/쓰기에서 강제해야 한다.
- DB에서도 Prisma 접근을 강제하려면 별도 NOBYPASSRLS 앱 역할·최소 GRANT와 각 트랜잭션 안의 검증된 JWT claim 설정이 필요하다. 이 경우 연결 자격 증명·코드 전환·정책 테스트를 함께 승인받아야 한다. 현재 비밀값이나 역할은 임의 변경하지 않았다.

## 적용 순서와 복구

현재 앱 테이블이 없으므로 검토안은 빈 앱 스키마용 최초 마이그레이션이다. 이미 테이블이 생겼다면 실행하지 않고 기존 구조와의 차이를 다시 생성해야 한다.

승인 후 계획:

1. 적용 직전 jeongbi-on 대상, 앱 테이블·타입·마이그레이션 이력, 기존 자료와 Supabase 백업 상태를 다시 확인.
2. 승인된 검토 모델을 prisma/schema.prisma에 반영하고 Prisma Client·회원 프로필/구역 저장/설정 서버와 화면 연결을 준비. 로컬 검증 우선.
3. 검토 SQL을 고유한 최초 마이그레이션 폴더에 복사. SQL과 Prisma 12개 모델의 일치, 소유권·권한 검토.
4. npm run db:migrate:deploy 실행. migrate dev/db push/reset 사용 금지.
5. 실제 DB 역할별 정책 및 A/B 소유권 테스트. 가능하면 테스트 전용 두 계정 사용. 임의의 기존 Auth 사용자를 선택하거나 삭제하지 않음.
6. 사용자 A 저장→새로고침 복원, B에서 A 데이터 접근/수정 거절, 비회원 거절, 로그아웃 후 개인 데이터 제거 확인.
7. 별도 운영 배포 승인 후 배포.

SQL은 BEGIN/COMMIT으로 묶었으며 DROP TABLE/COLUMN, TRUNCATE, DELETE FROM, RESET이나 Auth 테이블 변경이 없다. 앱 테이블이 있으면 사전 가드가 중단한다. 실패하면 트랜잭션으로 생성 작업을 롤백하고 실패한 Prisma 이력을 확인한다. 적용 성공 후에는 새 데이터가 생길 수 있으므로 자동 역삭제하지 않고 보존하는 수정 마이그레이션으로 복구한다. migrate resolve가 필요해도 별도 원인 확인 후 사용한다.

## 사용자 설정·인증 절차

- 로컬 Web SDK 도메인에 실제 사용할 주소(예: http://localhost:3000)를 추가하거나, 이미 허용한 정확한 로컬 주소/포트를 알려준다.
- Vercel Production에도 NEXT_PUBLIC_KAKAO_MAP_JS_KEY를 직접 등록해야 한다. NEXT_PUBLIC_KAKAO_MAP_KEY는 호환 유지. 새 키 반영은 재빌드·별도 배포 승인 필요.
- Kakao Developers Redirect URI: https://ecrpfufzcueiqqdsauat.supabase.co/auth/v1/callback
- Supabase 앱 복귀 허용 주소: https://jeongbi-on.vercel.app/auth/callback
- 실제 인증은 사용자가 운영 /areas 검색 상태에서 Kakao 버튼으로 직접 수행. 비밀번호·토큰은 보내지 않는다. 돌아온 경로, 새로고침 후 MY 유지, 로그아웃 결과 또는 화면의 오류 코드만 알려준다.
- 실제 카카오 Developers Client Secret 일치는 콘솔 접근 없이 직접 비교할 수 없다. 사용자 확인과 실제 인증 결과로 검증해야 한다.

필요 변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(또는 기존 ANON_KEY), NEXT_PUBLIC_KAKAO_MAP_JS_KEY(또는 기존 MAP_KEY), DATABASE_URL, DIRECT_URL. 비밀값은 채팅/로그/SQL/문서에 포함하지 않는다.

## 로컬 반영 결과

- User.email 선택값과 FavoriteZone·NotificationPreference를 활성 스키마에 반영하고 Client 생성. 검토 모델과 차이 없음. Prisma 7 문법/TypeScript/ESLint/프로덕션 빌드 통과.
- src/lib/member.ts: Supabase 검증 회원 재사용, 비회원·익명·미인증 이메일 계정 거절, 이메일 없는 카카오 프로필 생성 지원. 이메일로 기존 프로필 자동 연결 금지.
- src/app/account/actions.ts: 관심지역·공식 정비구역·프로필 이름·수신 희망 설정의 서버 검증/트랜잭션/소유권 조건. 클라이언트가 보낸 사용자 ID를 사용하지 않음.
- src/app/api/account/route.ts: 본인 Auth ID로 프로필/관심지역/구역/설정/알림 조회, private/no-store 유지.
- src/components/account-forms.tsx 및 personal-regions.tsx: 저장/해제/구역 수신 설정/프로필/전체 알림 설정 폼, 상태·오류·미로그인·DB 미준비 처리와 새로 조회 연결. MY와 구역 상세, 목록의 관심 버튼 연결.
- 실제 저장 시 공식 원문에서 사업유형·구군 확인. 확인 불가/원문 실패/시연 구역은 저장하지 않음. 가야1 원문 확인 성공.
- scripts/check-core-data.mjs: 메모리 기반 이메일 없는 A/B 회원 저장·복원, 타 회원 수정/해제 거절, 비회원/익명/미인증 계정 거절, 입력 검증·DB 미준비 검사 통과. 실제 DB/RLS/브라우저 검사가 아님.
- 원본 디자인 구조 5개 비교 통과. 기존 바이트 비교는 사용자가 수정한 oni.png 때문에 불일치. 큰 바이너리 차이를 출력하다 메모리 오류가 나던 비교를 equals 기반 안전한 판정으로 보완. 사용자 변경 이미지 4개는 작업 전후 SHA-256 보존 확인.
- 기존 public/assets의 로고/아이콘/온이 변경을 보존했다. README 및 환경변수 값은 수정하지 않았다.
- 로컬 Web SDK 허용 주소 질문에 사용자는 운영 URL을 알려 주었다. 운영 Referer SDK 200만 확인했으며 실제 로컬 SDK 렌더링은 검증하지 못했다.
- DB 적용, 실제 데이터 저장, Auth 사용자 생성/삭제, 마이그레이션 실행, Git 커밋/푸시, 운영 배포는 실행하지 않았다.

## 남은 승인과 실제 검증

실제 DB 적용은 승인하지 않았으므로 저장·복원은 준비 코드와 모의 검사 완료 상태다. 운영 코드는 계속 8d1f995이며 로컬 12개 모델 코드는 아직 배포하지 않았다. DB 적용 승인과 별도 운영 배포 승인 후 실계정 A/B 및 실제 지도·반응형 검증이 필요하다.
