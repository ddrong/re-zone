import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nodeRequire = createRequire(import.meta.url);
function load(path, aliases = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const record = { exports: {} };
  vm.runInThisContext('(function(require,module,exports){' + source + '\n})', {
    filename: path,
  })(
    (id) => (Object.hasOwn(aliases, id) ? aliases[id] : nodeRequire(id)),
    record,
    record.exports,
  );
  return record.exports;
}
const originalFixtureKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'synthetic-public-key';
const originalFixtureUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://auth-test.example';
const nav = load('src/lib/auth-navigation.ts');
const authCookies = load('src/lib/auth-cookies.ts');
for (const attack of [
  'https://evil.example',
  '//evil.example',
  '/\\evil.example',
  '/%2f%2fevil.example',
  '/%255c%255cevil.example',
  '/%0aevil',
  '/auth/callback',
  '/%61uth/callback',
  '/login',
  '/signup',
  'javascript:alert(1)',
]) {
  assert.equal(nav.safeReturnTo(attack), '/areas', 'Unsafe redirect accepted');
}
const returnPath = '/areas?q=busan&district=26350&type=SALE&page=2';
assert.equal(nav.safeReturnTo(returnPath), returnPath);
assert.equal(
  nav.safeReturnTo('/areas?code=example&access_token=example&q=busan'),
  '/areas?q=busan',
);
assert.equal(nav.safeReturnTo('/areas#access_token=example'), '/areas');
assert.equal(
  nav.callbackReturnTo(
    nav.PRODUCTION_ORIGIN +
      '/auth/callback?next=' +
      encodeURIComponent(returnPath),
  ),
  returnPath,
);
assert.notEqual(
  nav.authErrorMessage('email_not_confirmed'),
  nav.authErrorMessage('invalid_credentials'),
);
assert.notEqual(
  nav.authErrorMessage('session_not_found'),
  nav.authErrorMessage('invalid_credentials'),
);
const store = new Map();
const cookieStore = {
  getAll: () => [...store].map(([name, value]) => ({ name, value })),
  get: (key) => (store.has(key) ? { value: store.get(key) } : undefined),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
};
let failure = null;
let signupRequest = null;
let configured = true;
let oauthRequest = null;
let oauthDestination =
  'https://auth-test.example/auth/v1/authorize?provider=kakao';
const client = {
  auth: {
    signInWithPassword: async () => ({ error: failure }),
    signUp: async (data) => {
      signupRequest = data;
      return { data: { session: null }, error: failure };
    },
    signInWithOAuth: async (request) => {
      oauthRequest = request;
      return { data: { url: oauthDestination }, error: failure };
    },
    signOut: async () => ({ error: failure }),
    exchangeCodeForSession: async () => ({ error: failure }),
    verifyOtp: async () => ({ error: failure }),
  },
};
const aliases = {
  'next/headers': { cookies: async () => cookieStore },
  'next/navigation': {
    redirect: (destination) => {
      throw Object.assign(new Error('redirect'), { destination });
    },
  },
  '@/lib/supabase': {
    createAuthClient: async () => (configured ? client : null),
  },
  '@/lib/auth-navigation': nav,
  '@/lib/auth-cookies': authCookies,
  'next/cache': { revalidatePath: () => {} },
};
const actions = load('src/app/auth/actions.ts', aliases);
const form = new FormData();
form.set('email', 'demo@example.com');
form.set('password', 'example-only-password-123');
form.set('next', returnPath);
failure = { code: 'email_not_confirmed' };
let result = await actions.authenticate(
  'login',
  { message: '', success: false },
  form,
);
assert.ok(!result.success && result.message.includes('이메일 인증'));
failure = { code: 'invalid_credentials' };
result = await actions.authenticate(
  'login',
  { message: '', success: false },
  form,
);
assert.ok(result.message.includes('비밀번호'));
failure = null;
await assert.rejects(
  () => actions.authenticate('login', { message: '', success: false }, form),
  (error) => {
    const u = new URL(error.destination, nav.PRODUCTION_ORIGIN);
    return (
      u.pathname === '/areas' &&
      u.searchParams.get('auth_success') === '1' &&
      u.searchParams.get('district') === '26350'
    );
  },
);
result = await actions.authenticate(
  'signup',
  { message: '', success: false },
  form,
);
assert.ok(result.success);
assert.ok(
  signupRequest.options.emailRedirectTo.startsWith(
    nav.PRODUCTION_ORIGIN + '/auth/callback?next=',
  ),
);
assert.equal(
  nav.callbackReturnTo(signupRequest.options.emailRedirectTo),
  returnPath,
);
configured = false;
result = await actions.authenticate(
  'login',
  { message: '', success: false },
  form,
);
assert.ok(!result.success && result.message.includes('설정'));
configured = true;
await assert.rejects(
  () => actions.signOut(),
  (error) => error.destination === '/?signed_out=1',
);
for (const route of ['callback', 'confirm']) {
  const handler = load('src/app/auth/' + route + '/route.ts', aliases);
  const url = new URL(nav.PRODUCTION_ORIGIN + '/auth/' + route);
  if (route === 'callback') url.searchParams.set('code', 'example-code');
  else {
    url.searchParams.set('token_hash', 'example-hash');
    url.searchParams.set('type', 'email');
  }
  url.searchParams.set('next', returnPath);
  failure = null;
  const response = await handler.GET({ nextUrl: url, url: url.href });
  const location = new URL(response.headers.get('location'));
  assert.equal(location.origin, nav.PRODUCTION_ORIGIN);
  assert.equal(location.pathname, '/areas');
  assert.equal(location.searchParams.get('district'), '26350');
  assert.equal(location.searchParams.get('auth_success'), '1');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.ok(
    !location.href.includes('example-code') &&
      !location.href.includes('example-hash'),
  );
  failure = { code: 'otp_expired' };
  const failed = await handler.GET({ nextUrl: url, url: url.href });
  assert.equal(new URL(failed.headers.get('location')).pathname, '/auth/error');
}
const maps = load('src/lib/map-location.ts');
assert.equal(
  maps.verifiedMapAddress({
    demo: true,
    address: '부산 해운대구 우동 1',
    district: '해운대구',
  }),
  null,
);
assert.equal(
  maps.verifiedMapAddress({ demo: false, address: '', district: '해운대구' }),
  null,
);
assert.equal(
  maps.verifiedMapAddress({
    demo: false,
    address: '위치 확인 중',
    district: '해운대구',
  }),
  null,
);
assert.ok(
  maps
    .verifiedMapAddress({
      demo: false,
      address: '가야동 410번지 일원',
      district: '부산진구',
    })
    .startsWith('부산광역시 부산진구'),
);
assert.ok(
  maps
    .kakaoSearchLink('부산 해운대구')
    .startsWith('https://map.kakao.com/link/search/'),
);
console.log(
  'PASS safe return paths, mocked login/signup/logout, production callbacks, error separation, token-free redirects and address-only map inputs',
);
console.log('No real account, email, database write or live map key was used.');

const savedAuthUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://auth-test.example';
failure = null;
await assert.rejects(
  () => actions.startKakao({ message: '', success: false }, form),
  (e) => e.destination === oauthDestination,
);
assert.equal(oauthRequest.provider, 'kakao');
assert.equal(nav.callbackReturnTo(oauthRequest.options.redirectTo), returnPath);
assert.equal(oauthRequest.options.skipBrowserRedirect, true);
assert.equal(store.get('jeongbi_auth_return'), returnPath);
oauthDestination = 'https://evil.example/auth/v1/authorize';
assert.equal(
  (await actions.startKakao({ message: '', success: false }, form)).success,
  false,
);
configured = false;
assert.equal(
  (await actions.startKakao({ message: '', success: false }, form)).success,
  false,
);
configured = true;
failure = null;
const cancelledUrl = new URL(
  nav.PRODUCTION_ORIGIN +
    '/auth/callback?error=access_denied&next=%2Ffavorites',
);
const cancelled = await load('src/app/auth/callback/route.ts', aliases).GET({
  nextUrl: cancelledUrl,
});
assert.equal(
  new URL(cancelled.headers.get('location')).searchParams.get('reason'),
  'cancelled',
);
if (savedAuthUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
else process.env.NEXT_PUBLIC_SUPABASE_URL = savedAuthUrl;
const calculator = load('src/lib/calculator.ts');
const blank = calculator.emptyAmounts();
assert.ok(Object.values(blank).every((v) => v === ''));
assert.equal(calculator.calculateAmounts(blank, '기준').profit, null);
const amounts = {
  purchase: '38000',
  contribution: '12000',
  expenses: '3000',
  future: '65000',
};
assert.equal(calculator.calculateAmounts(amounts, '기준').invested, 53000);
assert.equal(calculator.calculateAmounts(amounts, '기준').profit, 12000);
assert.equal(
  calculator.calculateAmounts(amounts, '보수적').projectedValue,
  52000,
);
assert.equal(
  calculator.calculateAmounts(amounts, '낙관적').projectedValue,
  74750,
);
for (const invalid of [
  '',
  '-1',
  'NaN',
  'Infinity',
  '1e5',
  '1.234',
  '1000000001',
])
  assert.equal(
    calculator.calculateAmounts({ ...amounts, purchase: invalid }, '기준')
      .profit,
    null,
  );
assert.equal(
  calculator.calculateAmounts(
    { ...amounts, purchase: '0', contribution: '0', expenses: '0' },
    '기준',
  ).returnRate,
  null,
);
assert.equal(
  calculator.calculateAmounts(calculator.emptyAmounts(), '낙관적')
    .projectedValue,
  null,
);
console.log(
  'PASS mocked Kakao OAuth, cancellation, unsafe provider redirect rejection; calculator blank/reset, invalid amounts and manwon units',
);

const testCookies = load('src/lib/auth-cookies.ts');
const activeKey = testCookies.authStorageKey();
store.set(activeKey + '.0', 'synthetic-session-A');
store.set(activeKey + '-code-verifier', 'synthetic-verifier');
store.set('unrelated-cookie', 'keep');
failure = null;
await assert.rejects(
  () => actions.signOut(),
  (e) => e.destination === '/?signed_out=1',
);
assert.equal(store.get(testCookies.LOGOUT_COOKIE), '1');
assert.equal(store.get(activeKey + '.0'), '');
assert.equal(store.get(activeKey + '-code-verifier'), '');
assert.equal(store.get('unrelated-cookie'), 'keep');
assert.equal(
  nav.safeReturnTo('/areas?q=busan&signed_out=1&notice=logout-local-only'),
  '/areas?q=busan',
);
let verifiedActor = { id: 'synthetic-member-A' };
let sdkReads = 0,
  denyWrites = false;
const actualStoreSet = cookieStore.set;
cookieStore.set = (...args) => {
  if (denyWrites) throw new Error('synthetic readonly store');
  return actualStoreSet(...args);
};
const ssr = load('src/lib/supabase.ts', {
  'server-only': {},
  './auth-cookies': testCookies,
  'next/headers': { cookies: async () => cookieStore },
  '@supabase/ssr': {
    createServerClient: (_url, _key, options) => ({
      auth: {
        getUser: async () => {
          sdkReads++;
          return { data: { user: verifiedActor }, error: null };
        },
        signInWithPassword: async () => {
          options.cookies.setAll(
            [
              {
                name: activeKey + '.0',
                value: 'synthetic-new-session',
                options: { path: '/' },
              },
            ],
            {},
          );
          return { error: null };
        },
      },
    }),
  },
});
assert.equal(await ssr.getAuthUser(), null);
assert.equal(sdkReads, 0);
store.set(activeKey + '.0', 'synthetic-late-refresh');
assert.equal(await ssr.getAuthUser(), null);
const statusRoute = load('src/app/api/auth/status/route.ts', {
  '@/lib/supabase': ssr,
  '@/lib/auth-cookies': testCookies,
  'next/server': { ...nodeRequire('next/server'), connection: async () => {} },
});
assert.equal((await (await statusRoute.GET()).json()).authenticated, false);
assert.equal((await (await statusRoute.GET()).json()).authenticated, false);
store.delete(testCookies.LOGOUT_COOKIE);
verifiedActor = { id: 'synthetic-member-B' };
assert.equal((await ssr.getAuthUser()).id, 'synthetic-member-B');
denyWrites = true;
const strict = await ssr.createAuthClient();
await assert.rejects(
  () => strict.auth.signInWithPassword(),
  /AUTH_COOKIE_WRITE_FAILED/,
);
const readonly = await ssr.createAuthClient({ writable: false });
await readonly.auth.signInWithPassword();
denyWrites = false;
assert.equal(testCookies.authCookieOptions().path, '/');
assert.equal(testCookies.authCookieOptions().sameSite, 'lax');
assert.equal(testCookies.authCookieOptions().domain, undefined);
assert.ok(
  testCookies.duplicateSessionNames([
    { name: activeKey + '.0', value: 'A' },
    { name: activeKey + '.0', value: 'B' },
  ]),
);
if (originalFixtureUrl === undefined)
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
else process.env.NEXT_PUBLIC_SUPABASE_URL = originalFixtureUrl;
console.log(
  'PASS mocked logout cookie cleanup, late-refresh guard, repeated authenticated=false, member switch, strict cookie-write failure and canonical cookie attributes',
);

if (originalFixtureKey === undefined)
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalFixtureKey;
