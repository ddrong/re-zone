# 운영 인증·브랜드·지도 수정 안내

## 적용 범위

- 운영 인증 주소는 https://jeongbi-on.vercel.app 기준이다.
- 로그인·이메일 확인 후 내부 복귀 경로만 허용한다. 외부 URL·인증 경로 재진입·URL 토큰 전달을 차단한다.
- 원래 검색 조건은 /areas의 검색 매개변수에 유지하고, 같은 브라우저의 스크롤 위치는 인증 후 가능한 범위에서 복원한다.
- 로그인된 세션을 서버 getUser로 확인한 뒤 헤더를 MY로 전환하고 성공 안내를 3초 표시한다.
- 기존 DB 모델과 비밀번호·환경 파일은 수정하지 않는다.
- 제공된 투명 워드마크와 앱 아이콘을 그대로 사용한다. 파비콘만 원본 앱 아이콘에서 기술적으로 변환했다.
- Google Fonts의 Noto Sans KR 400·500·600·700·800을 next/font/google로 적용한다.
- 원본 모바일 CSS와 온이는 보존하고 통합 스타일에서 320~767 / 768~1199 / 1200~1919 / 1920 이상을 구분한다.

## 사용자가 Supabase에서 확인할 설정

Authentication → URL Configuration:

- Site URL: https://jeongbi-on.vercel.app
- Redirect URLs:
  - https://jeongbi-on.vercel.app/auth/callback
  - https://jeongbi-on.vercel.app/auth/confirm
- localhost는 로컬 개발을 실제 사용할 때만 별도 허용한다. 운영 Site URL을 localhost로 두지 않는다.

Authentication → Email Templates → Confirm signup:

기본 ConfirmationURL 템플릿은 코드 교환 방식의 /auth/callback을 사용할 수 있다.
다른 브라우저에서 여는 이메일도 지원하려면 아래 token_hash 확인 방식을 권장한다.

```html
<a
  href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}"
  >이메일 인증하기</a
>
```

앱의 회원가입 요청은 emailRedirectTo에 운영 callback과 안전한 next를 지정한다.
confirm 라우트는 RedirectTo 안의 내부 next를 읽고 직접 verifyOtp를 수행한다.
기존 메일의 localhost 주소는 코드 변경으로 고쳐지지 않는다. 설정 저장·새 코드 배포 후 새 인증 메일로 테스트한다.
Site URL·허용 주소·이메일 템플릿은 이번 작업에서 실제 변경하지 않았다.

Vercel 및 로컬의 인증 변수 이름:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (기존 NEXT_PUBLIC_SUPABASE_ANON_KEY도 호환)

관리자 키는 필요하지 않다. 실제 값은 사용자가 입력하며 채팅에 보내지 않는다.
잘못된 비밀번호·이메일 미인증·세션 오류·요청 제한은 안전한 메시지로 구분한다.
잘못된 로그인 자격 증명만으로 계정 존재 여부를 단정하지 않는다.

## 실제 계정 테스트 절차

1. 재배포와 위 설정을 완료한다.
2. /areas에서 구·군·검색어·사업유형을 선택하고 아래로 스크롤한다.
3. 헤더 로그인에서 실제 본인 계정으로 로그인한다.
4. 원래 /areas 조건으로 복귀, 3초 성공 안내, MY 아이콘을 확인한다.
5. 새로고침·다른 페이지 이동 후 로그인 유지 여부를 확인한다.
6. 새 이메일 회원가입은 최신 인증 링크를 열어 동일한 복귀 흐름을 확인한다.
7. 잘못된 비밀번호·미인증 계정·만료 링크를 각각 확인한다.
8. MY 로그아웃 후 일반 방문자 헤더로 돌아오는지 확인한다.
9. 관심지역 DB 저장은 마이그레이션 상태를 확인하고 실제 쓰기 승인을 받은 뒤 테스트한다.

모의 인증 테스트와 실제 계정 성공은 다르다. 이번 작업은 실제 계정 생성·메일 발송을 실행하지 않는다.

## 카카오맵 준비

현재 키가 없어도 카카오맵 검색 링크와 공식 상세보기로 위치를 확인할 수 있다. 가짜 지도를 표시하지 않는다.

1. Kakao Developers에서 기존 서비스용 앱을 선택한다.
2. 카카오맵 사용 설정과 JavaScript SDK 키를 확인한다.
3. Web 플랫폼 허용 도메인에 https://jeongbi-on.vercel.app 을 등록한다.
4. NEXT_PUBLIC_KAKAO_MAP_KEY를 로컬·Vercel에 사용자가 직접 등록한다.
5. 공개 변수는 새 빌드·재배포 후 반영된다. REST API 키나 관리자 키를 대신 넣지 않는다.
6. 실제 SDK 로딩, 확대·축소·드래그, 구·군 이동, 마커와 상세 링크를 확인한다.

고정 부산 중심에서 시작하고 구·군 선택 시 지오코딩된 행정지역 중심으로 이동한다.
공식 목록·상세에 주소가 있고 지오코딩 결과가 부산인 경우만 마커를 만든다.
주소 없는 자료·시연 구역에는 임의 마커나 경계를 생성하지 않는다.
마커는 주소 위치 안내이며 정비구역 경계가 아니다.
키 또는 SDK 연결 실패 시 실제 카카오맵 검색 링크를 유지한다.
마커 로딩과 실제 SDK 동작은 키 등록 전에는 미검증이다.

## 매물 연계 검토

확인 기준일: 2026-10-30.

- 네이버 공식 중개사 고객센터에는 매물 제휴사·검증 절차가 안내되어 있다.
- KB부동산의 공개 검색 사이트는 확인했으나, 이번 조사에서 외부 서비스가 매물을 복제·저장·재표시할 수 있는 공개 API 및 허가를 확인하지 못했다.
- 공개 조회 가능 여부는 재사용 허가와 다르다. 정식 제휴 또는 제공기관의 조건 확인 전에는 실제 매물을 수집·저장하지 않는다.
- 현재는 시연용 가상 매물을 유지하고 개별 카드·상세에 실제 거래 불가를 표시한다.
- 네이버 관련 부산 검색·KB부동산 원문으로 이동하는 외부 링크만 제공한다.
- 실제 중개사 등록·자격 검증·매물 업로드 기능은 추가하지 않는다.

## 공식 자료와 시연 구분

부산시 공개 목록·상세 조회 모듈은 유지한다. 정식 공공데이터포털 OpenAPI라고 표현하지 않는다.
출처·원본 갱신일·앱 조회 시각을 구분하고 실패 시 가상 자료로 대체하지 않는다.
고정 상단 시연 배너를 없애고 개별 매물·데모 알림·가정 시뮬레이션에 안내한다.

## 검사와 한계

- npm run typecheck
- npm run lint
- npm run build
- node scripts/check-auth-flows.mjs
- node scripts/check-design-parity.mjs

인증 테스트는 의도적으로 Supabase를 모의 처리하며 실제 계정이나 DB를 변경하지 않는다.
디자인 비교는 안내 문구 추가를 제외한 기존 컴포넌트의 구조적 클래스와 원본 CSS·온이를 확인한다.
브라우저가 연결되지 않으면 PC·모바일 픽셀·조작 검증은 완료로 보고하지 않는다.
GitHub 반영·Vercel 재배포는 별도 승인을 받은 뒤 기존 프로젝트에만 진행한다.

## 공식 참고

- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase 이메일 인증](https://supabase.com/docs/guides/auth/passwords)
- [카카오맵 가이드](https://apis.map.kakao.com/web/guide/)
- [카카오맵 문서](https://apis.map.kakao.com/web/documentation/)
- [Noto Sans KR OFL](https://github.com/google/fonts/blob/main/ofl/notosanskr/OFL.txt)
- [네이버 공식 매물 관리 안내](https://help.pay.naver.com/faq/content.help?faqId=16950)
- [KB부동산](https://kbland.kr/)
