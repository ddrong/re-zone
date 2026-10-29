'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bell, ChevronLeft, Search } from 'lucide-react';
import { BrandLink } from './brand-link';
import { SessionControls } from './session-controls';
function SearchForm({ query }: { query: string }) {
  return (
    <form className="header-search" action="/areas" role="search">
      <label htmlFor="header-query" className="sr-only">
        부산 정비구역 검색
      </label>
      <Search size={18} />
      <input
        id="header-query"
        name="q"
        defaultValue={query}
        key={query}
        maxLength={80}
        placeholder="부산 정비구역 검색"
      />
      <button type="submit">검색</button>
    </form>
  );
}
function HeaderSearch() {
  return <SearchForm query={useSearchParams().get('q') ?? ''} />;
}
export function AppHeader({
  page,
  title,
  onBack,
  onNavigate,
  unread,
}: {
  page: string;
  title: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
  unread: number;
}) {
  return (
    <header className="topbar">
      <div className="header-brand-group">
        {page !== 'home' && (
          <button
            className="icon-button back-button"
            onClick={onBack}
            aria-label="이전 화면"
          >
            <ChevronLeft />
          </button>
        )}
        <BrandLink className={page === 'home' ? '' : 'brand-inner-page'} />
        {page !== 'home' && <h1 className="page-title">{title}</h1>}
      </div>
      <Suspense fallback={<SearchForm query="" />}>
        <HeaderSearch />
      </Suspense>
      <div className="top-actions">
        {page === 'home' && (
          <button
            className="icon-button mobile-search"
            onClick={() => onNavigate('areas')}
            aria-label="지역 검색"
          >
            <Search />
          </button>
        )}
        <button
          className="icon-button notice-button"
          onClick={() => onNavigate('alerts')}
          aria-label="데모 알림"
        >
          <Bell />
          {unread > 0 && <span className="unread-badge">{unread}</span>}
        </button>
        <Suspense
          fallback={
            <Link className="login-entry" href="/login?next=%2Fareas">
              로그인
            </Link>
          }
        >
          <SessionControls />
        </Suspense>
      </div>
    </header>
  );
}
