import Link from 'next/link';
export default function AuthError() {
  return (
    <section id="main" className="container empty-state">
      <h1>인증 링크를 확인해 주세요.</h1>
      <p>링크가 만료되었거나 이미 사용되었을 수 있습니다.</p>
      <Link className="button primary" href="/login">
        로그인으로 돌아가기
      </Link>
    </section>
  );
}
