import Link from 'next/link';
export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="정비ON AI 홈">
          <span className="brand-icon">J</span>
          <span>
            정비<span className="brand-on">ON</span> <small>AI</small>
          </span>
        </Link>
        <nav aria-label="주 메뉴">
          <Link href="/">정비사업 탐색</Link>
          <Link href="/account">관심지역</Link>
        </nav>
        <Link className="login-link" href="/login">
          로그인 <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
