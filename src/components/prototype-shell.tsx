'use client';
import Link from 'next/link';
import { createContext, useContext, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  House,
  MapPin,
  ChartNoAxesCombined,
  Heart,
  UserRound,
} from 'lucide-react';
import {
  HomePage,
  FavoritesPage,
  AlertsPage,
  AnalysisPage,
  MyPage,
} from './prototype-views';
import { initialNotices } from '@/lib/prototype-data';
import { AppHeader } from './app-header';
import { ListingResources } from './listing-resources';
type Page =
  | 'home'
  | 'areas'
  | 'detail'
  | 'favorites'
  | 'alerts'
  | 'analysis'
  | 'my'
  | 'account'
  | 'login'
  | 'signup'
  | 'other';
const routes: Record<string, string> = {
  home: '/',
  areas: '/areas',
  favorites: '/favorites',
  alerts: '/alerts',
  analysis: '/analysis',
  my: '/my',
  account: '/account',
  login: '/login',
  signup: '/signup',
};
type Context = {
  favorites: string[];
  recent: string[];
  toggleFavorite: (id: string) => void;
  openZone: (id: string) => void;
  navigate: (page: string) => void;
};
const PrototypeContext = createContext<Context | null>(null);
export function usePrototype() {
  const value = useContext(PrototypeContext);
  if (!value) throw new Error('Prototype context missing');
  return value;
}
export function PrototypeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const page: Page = pathname.startsWith('/zones/')
    ? 'detail'
    : ((Object.keys(routes).find((key) => routes[key] === pathname) as
        Page | undefined) ?? 'other');
  const [favorites, setFavorites] = useState(['u', 's']);
  const [recent, setRecent] = useState<string[]>([]);
  const [favoriteTab, setFavoriteTab] = useState('내 관심');
  const [notices, setNotices] = useState(
    initialNotices.map((item) => ({ ...item, read: item.id === 3 })),
  );
  const [preferences, setPreferences] = useState({
    sale: true,
    auction: true,
    price: true,
    stage: true,
    app: true,
    kakao: true,
  });
  const [frequency, setFrequency] = useState('instant');
  const [scenario, setScenario] = useState('기준');
  const [inputs, setInputs] = useState({
    purchase: '38000',
    contribution: '12000',
    expenses: '3000',
    future: '65000',
  });
  const navigate = (nextPage: string) => router.push(routes[nextPage] ?? '/');
  const openZone = (id: string) => {
    setRecent((items) =>
      [id, ...items.filter((item) => item !== id)].slice(0, 3),
    );
    router.push('/zones/' + encodeURIComponent(id));
  };
  const toggleFavorite = (id: string) =>
    setFavorites((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const markRead = (id: number) =>
    setNotices((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  const markAll = () =>
    setNotices((items) => items.map((item) => ({ ...item, read: true })));
  const pageForNotice = (id: number) => {
    const item = notices.find((n) => n.id === id);
    if (item) {
      markRead(id);
      openZone(item.zone);
    }
  };
  const safe = (value: string) =>
    Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const invested =
    safe(inputs.purchase) + safe(inputs.contribution) + safe(inputs.expenses);
  const projectedValue =
    safe(inputs.future) *
    (scenario === '보수적' ? 0.8 : scenario === '낙관적' ? 1.15 : 1);
  const profit = projectedValue - invested;
  const returnRate = invested ? (profit / invested) * 100 : 0;
  const pageTitles: Record<string, string> = {
    areas: '지역 탐색',
    detail: '구역 상세 분석',
    favorites: '관심 구역',
    analysis: '수익 분석',
    my: 'MY',
    alerts: '새 소식',
    account: '내 관심지역',
    login: '로그인',
    signup: '회원가입',
  };
  const menu = [
    { Icon: House, label: '홈', id: 'home' },
    { Icon: MapPin, label: '지역', id: 'areas' },
    { Icon: ChartNoAxesCombined, label: '분석', id: 'analysis' },
    { Icon: Heart, label: '관심', id: 'favorites' },
    { Icon: UserRound, label: 'MY', id: 'my' },
  ];
  return (
    <PrototypeContext.Provider
      value={{ favorites, recent, toggleFavorite, openZone, navigate }}
    >
      <div className="app-shell">
        <AppHeader
          page={page}
          title={pageTitles[page] ?? '정비ON AI'}
          onBack={() => navigate(page === 'detail' ? 'areas' : 'home')}
          onNavigate={navigate}
          unread={notices.filter((n) => !n.read).length}
        />
        <nav className="desktop-nav" aria-label="PC 주요 메뉴">
          {menu.map(({ Icon, label, id }) => (
            <Link
              href={routes[id]}
              key={id}
              aria-current={page === id ? 'page' : undefined}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <main id="main">
          {page === 'home' && (
            <>
              <HomePage
                favorites={favorites}
                onNavigate={navigate}
                onOpenZone={openZone}
              />
              <ListingResources />
            </>
          )}
          {page === 'favorites' && (
            <>
              <div className="live-account-link">
                <strong>회원별 관심지역 저장</strong>
                <Link href="/account">이메일 계정으로 관리하기 →</Link>
                <small>
                  아래 구역 찜·알림은 원본 디자인의 시연 상태입니다.
                </small>
              </div>
              <FavoritesPage
                tab={favoriteTab}
                setTab={setFavoriteTab}
                favorites={favorites}
                recent={recent}
                notices={notices}
                onOpenZone={openZone}
                onNavigate={navigate}
                onToggleFavorite={toggleFavorite}
                onMarkRead={markRead}
                onMarkAll={markAll}
                onOpenNotice={pageForNotice}
              />
            </>
          )}
          {page === 'alerts' && (
            <AlertsPage
              notices={notices}
              onMarkRead={markRead}
              onMarkAll={markAll}
              onOpenNotice={pageForNotice}
            />
          )}
          {page === 'analysis' && (
            <AnalysisPage
              scenario={scenario}
              setScenario={setScenario}
              inputs={inputs}
              updateInput={(key: keyof typeof inputs, value: string) =>
                setInputs((current) => ({ ...current, [key]: value }))
              }
              invested={invested}
              projectedValue={projectedValue}
              profit={profit}
              returnRate={returnRate}
              onOpenZone={() => openZone('u')}
              onReset={() =>
                setInputs({
                  purchase: '38000',
                  contribution: '12000',
                  expenses: '3000',
                  future: '65000',
                })
              }
            />
          )}
          {page === 'my' && (
            <MyPage
              preferences={preferences}
              setPreferences={setPreferences}
              frequency={frequency}
              setFrequency={setFrequency}
              favorites={favorites}
              onNavigate={navigate}
              onToggleFavorite={toggleFavorite}
              accountPanel={children}
            />
          )}
          {!['home', 'favorites', 'alerts', 'analysis', 'my'].includes(page) &&
            children}
        </main>
        <nav className="bottom-nav" aria-label="주요 메뉴">
          {menu.map(({ Icon, label, id }) => (
            <button
              key={id}
              className={
                page === id ||
                (page === 'detail' && id === 'areas') ||
                (page === 'alerts' && id === 'favorites')
                  ? 'active'
                  : ''
              }
              onClick={() => navigate(id)}
              aria-current={page === id ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={2.1} />
              <small>{label}</small>
            </button>
          ))}
        </nav>
      </div>
    </PrototypeContext.Provider>
  );
}
