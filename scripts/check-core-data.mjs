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

let actor = {
  id: '00000000-0000-4000-8000-000000000001',
  app_metadata: { provider: 'kakao' },
};
const actorA = actor;
const actorB = {
  id: '00000000-0000-4000-8000-000000000002',
  app_metadata: { provider: 'kakao' },
};
const profiles = new Map(),
  regionRows = new Map(),
  zoneRows = new Map(),
  favorites = [],
  zoneFavorites = [],
  preferences = new Map();
let sequence = 100,
  dbReady = true,
  officialReads = 0;
const uid = () =>
  '00000000-0000-4000-8000-' + String(++sequence).padStart(12, '0');
const selectedProfile = () => profiles.get(actor?.id);
function scoped(list, query) {
  return list.filter(
    (item) =>
      item.id === query.where.id &&
      profiles.get(query.where.user?.supabaseAuthId)?.id === item.userId,
  );
}
const tx = {
  user: {
    upsert: async (q) => {
      assert.equal(q.where.supabaseAuthId, actor.id);
      assert.equal(q.create.supabaseAuthId, actor.id);
      assert.ok(!('email' in q.where));
      let p = profiles.get(actor.id);
      if (!p) {
        p = { id: uid(), name: null, email: q.create.email };
        profiles.set(actor.id, p);
      }
      return p;
    },
    updateMany: async (q) => {
      const p = profiles.get(q.where.supabaseAuthId);
      if (!p || p.id !== q.where.id) return { count: 0 };
      Object.assign(p, q.data);
      return { count: 1 };
    },
    findUnique: async (q) => {
      const p = profiles.get(q.where.supabaseAuthId);
      if (!p) return null;
      return {
        name: p.name,
        favoriteRegions: favorites
          .filter((f) => f.userId === p.id)
          .map((f) => ({
            ...f,
            region: [...regionRows.values()].find((r) => r.id === f.regionId),
          })),
        favoriteZones: zoneFavorites
          .filter((f) => f.userId === p.id)
          .map((f) => ({
            ...f,
            zone: [...zoneRows.values()].find((r) => r.id === f.zoneId),
          })),
        notificationPreference: preferences.get(p.id) || null,
        notifications: [],
        _count: { notifications: 0 },
      };
    },
  },
  region: {
    upsert: async (q) => {
      let r = regionRows.get(q.where.code);
      if (!r) {
        r = { id: uid(), ...q.create };
        regionRows.set(q.where.code, r);
      }
      return r;
    },
  },
  dataSource: {
    upsert: async (q) => {
      assert.equal(q.where.code, 'BUSAN_DYNAMICE');
      return { id: 'source-fixture' };
    },
  },
  redevelopmentZone: {
    upsert: async (q) => {
      assert.equal(q.create.externalId, 'BARA_0000000000056');
      let z = zoneRows.get(q.create.externalId);
      if (!z) {
        z = { id: uid(), ...q.create };
        zoneRows.set(q.create.externalId, z);
      } else Object.assign(z, q.update);
      return z;
    },
  },
  favoriteRegion: {
    upsert: async (q) => {
      assert.equal(q.create.userId, selectedProfile().id);
      let f = favorites.find(
        (f) => f.userId === q.create.userId && f.regionId === q.create.regionId,
      );
      if (!f) {
        f = { id: uid(), alertsEnabled: false, ...q.create };
        favorites.push(f);
      }
      return f;
    },
    updateMany: async (q) => {
      const matches = scoped(favorites, q);
      matches.forEach((f) => Object.assign(f, q.data));
      return { count: matches.length };
    },
    deleteMany: async (q) => {
      const matches = scoped(favorites, q);
      for (const f of matches) favorites.splice(favorites.indexOf(f), 1);
      return { count: matches.length };
    },
  },
  favoriteZone: {
    upsert: async (q) => {
      assert.equal(q.create.userId, selectedProfile().id);
      let f = zoneFavorites.find(
        (f) => f.userId === q.create.userId && f.zoneId === q.create.zoneId,
      );
      if (!f) {
        f = { id: uid(), alertsEnabled: false, ...q.create };
        zoneFavorites.push(f);
      }
      return f;
    },
    updateMany: async (q) => {
      const matches = scoped(zoneFavorites, q);
      matches.forEach((f) => Object.assign(f, q.data));
      return { count: matches.length };
    },
    deleteMany: async (q) => {
      const matches = scoped(zoneFavorites, q);
      for (const f of matches)
        zoneFavorites.splice(zoneFavorites.indexOf(f), 1);
      return { count: matches.length };
    },
  },
  notificationPreference: {
    upsert: async (q) => {
      assert.equal(q.where.userId, selectedProfile().id);
      const value = preferences.has(q.where.userId)
        ? { ...preferences.get(q.where.userId), ...q.update }
        : q.create;
      preferences.set(q.where.userId, value);
      return value;
    },
  },
};
const db = {
  ...tx,
  $transaction: async (callback) => {
    if (!dbReady) throw Object.assign(new Error('fixture'), { code: 'P2021' });
    return callback(tx);
  },
};
const member = load('src/lib/member.ts', {
  'server-only': {},
  './supabase': { getAuthUser: async () => actor },
});
const aliases = {
  '@/lib/member': member,
  '@/lib/db': { getDb: () => db },
  '@/lib/regions': regions,
  '@/lib/public-zones': {
    getOfficialZone: async () => {
      officialReads++;
      return {
        id: 'BARA_0000000000056',
        name: '가야1 재개발',
        district: '부산진구',
        type: '재개발',
        demo: false,
        address: '부산진구 가야동 410번지',
      };
    },
  },
  'next/cache': { revalidatePath: () => {} },
  'next/server': { ...nodeRequire('next/server'), connection: async () => {} },
};
const route = load('src/app/api/account/route.ts', aliases);
const actions = load('src/app/account/actions.ts', aliases);
const form = new FormData();
form.set('district', '26230');
form.set('externalId', 'BARA_0000000000056');
form.set('frequency', 'daily');
form.set('appEnabled', 'on');
assert.equal((await actions.saveFavorite({}, form)).success, true);
assert.equal(profiles.get(actor.id).email, null);
assert.equal((await actions.saveOfficialZone({}, form)).success, true);
form.set('name', '회원 A');
form.set('supabaseAuthId', actorB.id);
form.set('userId', actorB.id);
assert.equal((await actions.saveProfile({}, form)).success, true);
assert.equal(
  (await actions.saveNotificationPreference({}, form)).success,
  true,
);
let response = await route.GET();
assert.ok(response.headers.get('cache-control').includes('no-store'));
let body = await response.json();
assert.equal(body.favorites.length, 1);
assert.equal(body.favoriteZones.length, 1);
assert.equal(body.profileName, '회원 A');
assert.equal(body.preferences.frequency, 'daily');
assert.equal(body.canSave, true);
const regionA = body.favorites[0].id,
  zoneA = body.favoriteZones[0].id;
actor = actorB;
body = await (await route.GET()).json();
assert.equal(body.favorites.length, 0);
assert.equal(body.favoriteZones.length, 0);
assert.equal(body.preferences, null);
form.set('id', regionA);
form.set('alerts', 'on');
assert.equal((await actions.updateFavorite({}, form)).success, false);
assert.equal((await actions.removeFavorite({}, form)).success, false);
form.set('id', zoneA);
assert.equal((await actions.updateOfficialZone({}, form)).success, false);
assert.equal((await actions.removeOfficialZone({}, form)).success, false);
assert.equal((await actions.saveFavorite({}, form)).success, true);
assert.equal((await actions.saveOfficialZone({}, form)).success, true);
actor = actorA;
body = await (await route.GET()).json();
assert.equal(body.favorites.length, 1);
assert.equal(body.favorites[0].alertsEnabled, false);
assert.equal(body.favoriteZones.length, 1);
form.set('id', zoneA);
assert.equal((await actions.updateOfficialZone({}, form)).success, true);
assert.equal((await actions.removeOfficialZone({}, form)).success, true);
form.set('id', regionA);
assert.equal((await actions.updateFavorite({}, form)).success, true);
assert.equal((await actions.removeFavorite({}, form)).success, true);
const readsBefore = officialReads;
form.set('externalId', 'u');
assert.equal((await actions.saveOfficialZone({}, form)).success, false);
assert.equal(officialReads, readsBefore);
form.set('frequency', 'forged');
assert.equal(
  (await actions.saveNotificationPreference({}, form)).success,
  false,
);
form.set('name', 'x'.repeat(101));
assert.equal((await actions.saveProfile({}, form)).success, false);
actor = null;
for (const fn of [
  'saveFavorite',
  'removeFavorite',
  'updateFavorite',
  'saveOfficialZone',
  'removeOfficialZone',
  'updateOfficialZone',
  'saveProfile',
  'saveNotificationPreference',
])
  assert.equal((await actions[fn]({}, form)).code, 'AUTH_REQUIRED');
assert.equal((await (await route.GET()).json()).authenticated, false);
actor = { id: actorA.id, app_metadata: { provider: 'email' } };
assert.equal(await member.getMember(), null);
actor = { ...actorA, is_anonymous: true };
assert.equal(await member.getMember(), null);
actor = actorA;
dbReady = false;
assert.equal((await actions.saveFavorite({}, form)).code, 'DB_NOT_READY');
console.log(
  'PASS mocked email-less profile, region/official-zone/settings persistence and reload, A/B ownership isolation, anonymous/unconfirmed rejection, invalid input and DB-not-ready handling',
);
console.log(
  'Memory mocks only: no DB or Auth users were created or changed; real RLS and authenticated browser tests remain pending.',
);
