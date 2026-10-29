import Link from 'next/link';
export default function NotFound() {
  return (
    <section id="main" className="container empty-state">
      <h1>찾으시는 사업이 없습니다.</h1>
      <p>주소가 변경되었거나 현재 제공되지 않는 정보입니다.</p>
      <Link className="button primary" href="/">
        정비사업 둘러보기
      </Link>
    </section>
  );
}
