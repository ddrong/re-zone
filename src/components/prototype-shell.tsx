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
import { AnalysisPage, MyPage } from './prototype-views';
import { PersonalRegions } from './personal-regions';
import { DashboardHome } from './dashboard-home';
import { calculateAmounts, emptyAmounts } from '@/lib/calculator';
import { AppHeader } from './app-header';
import { ListingResources } from './listing-resources';
import { OfficialZoneFavoritesProvider } from './official-zone-favorite';
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
  const [favorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [scenario, setScenario] = useState('기준');
  const [inputs, setInputs] = useState(emptyAmounts);
  const navigate = (nextPage: string) => router.push(routes[nextPage] ?? '/');
  const openZone = (id: string) => {
    setRecent((items) =>
      [id, ...items.filter((item) => item !== id)].slice(0, 3),
    );
    router.push('/zones/' + encodeURIComponent(id));
  };
  const toggleFavorite = () => router.push('/account');
  const { invested, projectedValue, profit, returnRate } = calculateAmounts(
    inputs,
    scenario,
  );
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
    <OfficialZoneFavoritesProvider>
      <PrototypeContext.Provider
        value={{ favorites, recent, toggleFavorite, openZone, navigate }}
      >
        <div className="app-shell">
          <AppHeader
            page={page}
            title={pageTitles[page] ?? '정비ON AI'}
            onBack={() => navigate(page === 'detail' ? 'areas' : 'home')}
            onNavigate={navigate}
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
                <DashboardHome />
                <ListingResources />
              </>
            )}
            {page === 'favorites' && <PersonalRegions variant="favorites" />}
            {page === 'alerts' && <PersonalRegions variant="alerts" />}
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
                onOpenZone={() => navigate('areas')}
                onReset={() => {
                  setInputs(emptyAmounts());
                  setScenario('기준');
                }}
              />
            )}
            {page === 'my' && (
              <MyPage
                onNavigate={navigate}
                accountPanel={children}
                preferencesPanel={<PersonalRegions variant="settings" />}
                favoritesPanel={<PersonalRegions variant="favorites" />}
              />
            )}
            {!['home', 'favorites', 'alerts', 'analysis', 'my'].includes(
              page,
            ) && children}
          </main>
          <footer className="app-footer">
            <p>copyright@jeongbion product by.동의과학대학교 Re.</p>
          </footer>
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
    </OfficialZoneFavoritesProvider>
  );
}
