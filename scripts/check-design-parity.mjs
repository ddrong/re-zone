import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
const nodeRequire = createRequire(import.meta.url);
const base = 'prototypes/jeongbion-ui/';
function evaluate(source, filename, aliases = {}) {
  const js = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const record = { exports: {} };
  const resolve = (id) =>
    Object.hasOwn(aliases, id) ? aliases[id] : nodeRequire(id);
  vm.runInThisContext('(function(require,module,exports){' + js + '\n})', {
    filename,
  })(resolve, record, record.exports);
  return record.exports;
}
let source = fs.readFileSync(base + 'src/main.jsx', 'utf8');
source = source
  .replace(/import \{ createRoot \} from 'react-dom\/client';/, '')
  .replace("import './style.css';", '')
  .replace(/createRoot\(document[\s\S]*$/, '');
source +=
  '\nexport { HomePage, DetailPage, FavoritesPage, AlertsPage, AnalysisPage };';
const original = evaluate(source, 'original.jsx');
const data = evaluate(
  fs.readFileSync('src/lib/prototype-data.ts', 'utf8'),
  'data.ts',
);
const regions = evaluate(
  fs.readFileSync('src/lib/regions.ts', 'utf8'),
  'regions.ts',
);
const migrated = evaluate(
  fs.readFileSync('src/components/prototype-views.jsx', 'utf8'),
  'migrated.jsx',
  {
    '@/lib/prototype-data': data,
    '@/lib/regions': regions,
    'next/image': {
      __esModule: true,
      default: (props) =>
        React.createElement(
          'img',
          Object.fromEntries(
            Object.entries(props).filter(
              ([key]) => !['width', 'height'].includes(key),
            ),
          ),
        ),
    },
  },
);
const noop = () => {};
const common = {
  onNavigate: noop,
  onOpenZone: noop,
  onToggleFavorite: noop,
  onMarkRead: noop,
  onMarkAll: noop,
  onOpenNotice: noop,
};
const zone = data.zones[0];
const notices = data.initialNotices.map((item) => ({ ...item, read: false }));
const cases = [
  ['HomePage', { ...common, favorites: ['u', 's'] }],
  ['DetailPage', { ...common, zone, isFavorite: true }],
  [
    'FavoritesPage',
    {
      ...common,
      tab: '내 관심',
      setTab: noop,
      favorites: ['u', 's'],
      recent: [],
      notices,
    },
  ],
  ['AlertsPage', { ...common, notices }],
  [
    'AnalysisPage',
    {
      ...common,
      scenario: '기준',
      setScenario: noop,
      inputs: {
        purchase: '38000',
        contribution: '12000',
        expenses: '3000',
        future: '65000',
      },
      updateInput: noop,
      invested: 53000,
      projectedValue: 65000,
      profit: 12000,
      returnRate: (12000 / 53000) * 100,
      onReset: noop,
    },
  ],
];
for (const [name, props] of cases) {
  const expected = renderToStaticMarkup(
    React.createElement(original[name], props),
  );
  const actual = renderToStaticMarkup(
    React.createElement(migrated[name], props),
  );
  assert.equal(actual, expected, name + ' rendered markup differs');
  console.log('PASS original markup parity: ' + name);
}
assert.deepEqual(
  fs.readFileSync('src/app/prototype.css'),
  fs.readFileSync(base + 'src/style.css'),
);
assert.deepEqual(
  fs.readFileSync('public/assets/oni.png'),
  fs.readFileSync(base + 'public/assets/oni.png'),
);
console.log('PASS original mobile CSS and mascot binary parity');
