'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import {
  saveOfficialZone,
  removeOfficialZone,
  type FavoriteState,
} from '@/app/account/actions';
import { LoginLink } from './login-link';

type Account = {
  authenticated: boolean;
  ready: boolean;
  message?: string;
  favoriteZones: { id: string; zone: { externalId: string } }[];
};
type Context = {
  account: Account | null;
  failed: boolean;
  pending: boolean;
  messages: Record<string, FavoriteState>;
  toggle: (id: string) => Promise<void>;
  reload: () => Promise<Account | null>;
};
const FavoritesContext = createContext<Context | null>(null);

export function OfficialZoneFavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [account, setAccount] = useState<Account | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Record<string, FavoriteState>>({});
  const locked = useRef(false);
  const generation = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const reload = useCallback(async () => {
    const version = ++generation.current;
    try {
      const response = await fetch('/api/account', { cache: 'no-store' });
      if (!response.ok) throw new Error('ACCOUNT');
      const data: Account = await response.json();
      if (version !== generation.current) return null;
      setAccount(data);
      setFailed(false);
      return data;
    } catch {
      if (version === generation.current) {
        setAccount(null);
        setFailed(true);
      }
      return null;
    }
  }, []);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    const refresh = () => {
      if (!locked.current) {
        setAccount(null);
        setMessages({});
        void reload();
      }
    };
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener('jeongbi-account-changed', refresh);
    window.addEventListener('jeongbi-auth-state', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.clearTimeout(timer);
      invalidate();
      window.removeEventListener('jeongbi-account-changed', refresh);
      window.removeEventListener('jeongbi-auth-state', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [pathname, reload, invalidate]);
  const toggle = async (externalId: string) => {
    if (locked.current) return;
    if (!account?.authenticated) {
      router.push(
        '/login?next=' +
          encodeURIComponent(window.location.pathname + window.location.search),
      );
      return;
    }
    if (!account.ready) return;
    locked.current = true;
    setPending(true);
    try {
      const saved = account.favoriteZones.find(
        (f) => f.zone.externalId === externalId,
      );
      const form = new FormData();
      form.set(saved ? 'id' : 'externalId', saved?.id ?? externalId);
      const result = await (saved ? removeOfficialZone : saveOfficialZone)(
        { success: false, message: '' },
        form,
      );
      setMessages((current) => ({ ...current, [externalId]: result }));
      if (result.code === 'AUTH_REQUIRED') {
        setAccount(null);
        await reload();
      }
      if (result.success) {
        const restored = await reload();
        if (!restored?.ready)
          setMessages((current) => ({
            ...current,
            [externalId]: {
              success: false,
              message: result.message + ' 저장 상태를 다시 조회해 주세요.',
            },
          }));
        window.dispatchEvent(new Event('jeongbi-account-changed'));
      }
    } catch {
      setMessages((current) => ({
        ...current,
        [externalId]: {
          success: false,
          message: '요청을 완료하지 못했습니다. 다시 조회한 뒤 시도해 주세요.',
        },
      }));
      await reload();
    } finally {
      locked.current = false;
      setPending(false);
    }
  };
  return (
    <FavoritesContext.Provider
      value={{ account, failed, pending, messages, toggle, reload }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function OfficialZoneFavorite({
  externalId,
  compact = false,
}: {
  externalId: string;
  compact?: boolean;
}) {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('Official zone favorites provider missing');
  const saved = Boolean(
    ctx.account?.favoriteZones.some((f) => f.zone.externalId === externalId),
  );
  const result = ctx.messages[externalId];
  const blocked = ctx.account?.authenticated && !ctx.account.ready;
  return (
    <div className={'official-favorite-control' + (compact ? ' compact' : '')}>
      <button
        type="button"
        className={saved ? 'button-secondary is-saved' : 'button-primary'}
        aria-label={saved ? '관심 해제' : '관심 구역 추가'}
        aria-pressed={saved}
        disabled={
          ctx.pending ||
          (!ctx.account && !ctx.failed) ||
          !!blocked ||
          ctx.failed
        }
        onClick={() => void ctx.toggle(externalId)}
      >
        <Heart
          size={18}
          fill={saved ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {ctx.pending
          ? '처리 중…'
          : !ctx.account && !ctx.failed
            ? '확인 중…'
            : saved
              ? '♥ 관심 등록됨 · 해제'
              : '관심 구역 추가'}
      </button>
      {result?.message && (
        <p
          role={result.success ? 'status' : 'alert'}
          className={result.success ? 'success' : 'form-error'}
        >
          {result.message}
        </p>
      )}
      {result?.code === 'AUTH_REQUIRED' && (
        <LoginLink className="button-secondary">로그인하기 →</LoginLink>
      )}
      {(ctx.failed || blocked) && (
        <div role="alert">
          <p>
            {ctx.failed
              ? '저장 상태를 불러오지 못했습니다.'
              : ctx.account?.message}
          </p>
          <button
            type="button"
            className="button-secondary"
            onClick={() => void ctx.reload()}
          >
            다시 조회 →
          </button>
        </div>
      )}
    </div>
  );
}
