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
const nav = load('src/lib/auth-navigation.ts');
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
  get: (key) => (store.has(key) ? { value: store.get(key) } : undefined),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
};
let failure = null;
let signupRequest = null;
let configured = true;
const client = {
  auth: {
    signInWithPassword: async () => ({ error: failure }),
    signUp: async (data) => {
      signupRequest = data;
      return { data: { session: null }, error: failure };
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
