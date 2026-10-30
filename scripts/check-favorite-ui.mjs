import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const slots = [];
let cursor = 0,
  context,
  saves = 0,
  removes = 0,
  failRead = false,
  rejectSave = false;
let record = null;
let authenticated = true;
const redirects = [];
const hooks = {
  ...React,
  createContext: () => ({ Provider: 'provider' }),
  useContext: () => context,
  useState(initial) {
    const index = cursor++;
    if (!(index in slots))
      slots[index] = typeof initial === 'function' ? initial() : initial;
    return [
      slots[index],
      (value) => {
        slots[index] =
          typeof value === 'function' ? value(slots[index]) : value;
      },
    ];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
  useCallback: (fn) => fn,
  useEffect: () => {},
};
const aliases = {
  react: hooks,
  'next/navigation': {
    usePathname: () => '/areas',
    useRouter: () => ({ push: (url) => redirects.push(url) }),
  },
  './login-link': { LoginLink: 'login-link' },
  '@/app/account/actions': {
    saveOfficialZone: async (_state, form) => {
      saves++;
      await Promise.resolve();
      if (rejectSave) return { success: false, message: 'Source unavailable' };
      assert.equal(form.get('externalId'), 'BARA_0000000000056');
      record = {
        id: 'saved-row',
        zone: { externalId: form.get('externalId') },
      };
      return { success: true, message: 'Saved' };
    },
    removeOfficialZone: async (_state, form) => {
      removes++;
      assert.equal(form.get('id'), 'saved-row');
      record = null;
      return { success: true, message: 'Removed' };
    },
  },
};
const source = fs.readFileSync(
  'src/components/official-zone-favorite.tsx',
  'utf8',
);
const js = ts.transpileModule(source, {
  fileName: 'favorite.tsx',
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;
const recordModule = { exports: {} };
vm.runInThisContext('(function(require,module,exports){' + js + '\n})')(
  (id) => aliases[id] ?? require(id),
  recordModule,
  recordModule.exports,
);
const originalFetch = globalThis.fetch,
  originalWindow = globalThis.window;
globalThis.fetch = async () => {
  if (failRead) throw Error('fixture');
  return {
    ok: true,
    json: async () => ({
      authenticated,
      ready: authenticated,
      favoriteZones: record ? [record] : [],
    }),
  };
};
globalThis.window = {
  location: { pathname: '/areas', search: '?q=test' },
  dispatchEvent() {},
};
const render = () => {
  cursor = 0;
  context = recordModule.exports.OfficialZoneFavoritesProvider({
    children: null,
  }).props.value;
  return context;
};
const button = () =>
  recordModule.exports.OfficialZoneFavorite({
    externalId: 'BARA_0000000000056',
  }).props.children[0];
try {
  await render().reload();
  render();
  assert.equal(button().props['aria-pressed'], false);
  const saving = context.toggle('BARA_0000000000056');
  await context.toggle('BARA_0000000000056');
  assert.equal(saves, 1, 'Duplicate clicks must be locked');
  render();
  assert.equal(button().props.disabled, true);
  await saving;
  render();
  assert.equal(button().props['aria-pressed'], true);
  assert.equal(
    button().props['aria-pressed'],
    true,
    'All copies read the same provider state',
  );
  await context.reload();
  render();
  assert.equal(
    button().props['aria-pressed'],
    true,
    'Restores from server state',
  );
  await context.toggle('BARA_0000000000056');
  render();
  assert.equal(button().props['aria-pressed'], false);
  assert.equal(removes, 1);
  rejectSave = true;
  await context.toggle('BARA_0000000000056');
  render();
  assert.equal(context.messages.BARA_0000000000056.success, false);
  assert.equal(
    button().props['aria-pressed'],
    false,
    'Failed save must not become saved',
  );
  authenticated = false;
  await context.reload();
  render();
  await context.toggle('BARA_0000000000056');
  assert.ok(redirects[0].startsWith('/login?next='));
  failRead = true;
  await context.reload();
  render();
  assert.equal(context.failed, true);
  assert.equal(
    button().props.disabled,
    true,
    'Read failure must block an unsafe toggle',
  );
  console.log(
    'PASS mocked shared favorite buttons: save/remove/restore, duplicate lock, login return path, failed write/read and no optimistic success',
  );
  console.log(
    'Hook harness only; real DOM, browser clicks and authenticated DB writes were not tested.',
  );
} finally {
  globalThis.fetch = originalFetch;
  globalThis.window = originalWindow;
}
