import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const nodeRequire = createRequire(import.meta.url);
function load(path, aliases = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const m = { exports: {} };
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', {
    filename: path,
  })(
    (id) => (Object.hasOwn(aliases, id) ? aliases[id] : nodeRequire(id)),
    m,
    m.exports,
  );
  return m.exports;
}
const regions = load('src/lib/regions.ts');
const originalFetch = globalThis.fetch;
let requests = 0;
const row = (id, name, stage) =>
  '<li><h3>' +
  name +
  '</h3><span>주소 : 부산진구 가야동 410번지</span><span>사업추진단계 : ' +
  stage +
  '</span><a onclick="getPopupData(this,\'' +
  id +
  '\')"></a></li>';
const first = row('BARA_0000000000056', '가야1 재개발', '관리처분계획');
const second = row('BARA_0000000000050', '가야3 재개발', '준공');
globalThis.fetch = async (url) => {
  requests++;
  const u = new URL(url);
  const html =
    u.searchParams.get('no') === '274'
      ? '<ul class="board-list-ul ty02"></ul>'
      : u.searchParams.get('pageIndex') === '1'
        ? '<ul class="board-list-ul ty02">' +
          first +
          '</ul><a onclick="linkPage(2)">2</a>'
        : '<ul class="board-list-ul ty02">' + first + second + '</ul>';
  return { ok: true, text: async () => html };
};
try {
  const source = load('src/lib/public-zones.ts', { './regions': regions });
  const result = await source.searchOfficialZones({
    q: '가야 재개발',
    district: '26230',
    type: '재개발',
  });
  assert.equal(result.total, 2);
  assert.equal(result.districtCounts['26230'], 2);
  assert.equal(new Set(result.zones.map((z) => z.id)).size, 2);
  assert.ok(result.zones.every((z) => z.demo === false));
  const count = requests;
  const staged = await source.searchOfficialZones({
    q: '가야',
    district: '26230',
    type: '재개발',
    stage: '6',
  });
  assert.equal(staged.total, 1);
  assert.equal(requests, count);
  assert.equal(staged.zones[0].name, '가야1 재개발');
  globalThis.fetch = async () => {
    throw new Error('fixture failure');
  };
  const failed = load('src/lib/public-zones.ts', { './regions': regions });
  await assert.rejects(() => failed.searchOfficialZones({}));
  assert.equal(failed.lastOfficialSuccess(), null);
  console.log(
    'PASS mocked official pagination, deduplication, keyword/region/type/stage filters, cache and no fake fallback',
  );
} finally {
  globalThis.fetch = originalFetch;
}
let authUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'fixture@example.com',
  app_metadata: { provider: 'kakao' },
};
let reads = 0,
  writes = 0;
const db = {
  user: {
    findUnique: async (query) => {
      reads++;
      assert.equal(query.where.supabaseAuthId, authUser.id);
      return {
        favoriteRegions: [],
        notifications: [],
        _count: { notifications: 0 },
      };
    },
  },
  favoriteRegion: {
    updateMany: async (query) => {
      writes++;
      assert.equal(query.where.user.supabaseAuthId, authUser.id);
      return { count: 1 };
    },
    deleteMany: async (query) => {
      writes++;
      assert.equal(query.where.user.supabaseAuthId, authUser.id);
      return { count: 1 };
    },
  },
};
const aliases = {
  '@/lib/supabase': { getAuthUser: async () => authUser },
  '@/lib/db': { getDb: () => db },
  '@/lib/regions': regions,
  'next/cache': { revalidatePath: () => {} },
  'next/server': { ...nodeRequire('next/server'), connection: async () => {} },
};
const route = load('src/app/api/account/route.ts', aliases);
let response = await route.GET();
assert.ok(response.headers.get('cache-control').includes('no-store'));
assert.equal((await response.json()).authenticated, true);
authUser = null;
response = await route.GET();
assert.equal((await response.json()).authenticated, false);
assert.equal(reads, 1);
const actions = load('src/app/account/actions.ts', aliases);
const form = new FormData();
form.set('id', '00000000-0000-4000-8000-000000000002');
form.set('alerts', 'on');
assert.equal((await actions.updateFavorite({}, form)).success, false);
assert.equal((await actions.removeFavorite({}, form)).success, false);
assert.equal(writes, 0);
authUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'fixture@example.com',
  app_metadata: { provider: 'kakao' },
};
assert.equal((await actions.updateFavorite({}, form)).success, true);
assert.equal((await actions.removeFavorite({}, form)).success, true);
assert.equal(writes, 2);
authUser = { ...authUser, email: undefined };
form.set('district', '26230');
assert.equal((await actions.saveFavorite({}, form)).success, false);
console.log(
  'PASS mocked owner-scoped account reads/updates/removals, anonymous rejection, email-less profile guard',
);
console.log(
  'Mocks only: no database, real account, or RLS policy was changed or exercised.',
);
