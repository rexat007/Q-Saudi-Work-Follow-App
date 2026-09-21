import fs from 'fs';
import path from 'path';
import assert from 'assert';

export function runVercelRoutingContractAssertions() {
  const rootDir = process.cwd();
  const vercelJsonPath = path.join(rootDir, 'vercel.json');
  const adapterPath = path.join(rootDir, 'api/[...path].ts');
  const serverAppPath = path.join(rootDir, 'server/app.ts');

  // 1 & 2 & 3 & 4. vercel.json verification
  assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  assert.ok(Array.isArray(vercelConfig.routes), 'vercel.json must contain routes array');
  const routes = vercelConfig.routes;

  assert.ok(routes.length >= 3, 'routes must contain at least 3 rules');

  // 1. API route precedence
  const apiRoute = routes[0];
  assert.strictEqual(apiRoute.src, '/api(/.*)?', 'API route must match /api and /api/*');
  assert.strictEqual(apiRoute.dest, '/api/[...path].ts', 'API route destination must be /api/[...path].ts');

  // 2. Filesystem handle
  const fsHandle = routes[1];
  assert.strictEqual(fsHandle.handle, 'filesystem', 'Filesystem handler must be positioned second');

  // 3. SPA Fallback
  const spaRoute = routes[routes.length - 1];
  assert.strictEqual(spaRoute.dest, '/index.html', 'SPA fallback must route to /index.html');
  assert.strictEqual(spaRoute.src, '/(.*)', 'SPA fallback must capture remaining non-API paths');

  // 4. Precedence order
  const apiIdx = routes.findIndex((r: any) => r.dest === '/api/[...path].ts');
  const fsIdx = routes.findIndex((r: any) => r.handle === 'filesystem');
  const spaIdx = routes.findIndex((r: any) => r.dest === '/index.html');
  assert.strictEqual(apiIdx, 0, 'API route must be index 0');
  assert.strictEqual(fsIdx, 1, 'Filesystem handle must be index 1');
  assert.strictEqual(spaIdx, 2, 'SPA fallback must be index 2');
  assert.ok(apiIdx < fsIdx, 'API route must precede filesystem');
  assert.ok(fsIdx < spaIdx, 'Filesystem must precede SPA fallback');

  // 10. Regex matching verification
  const apiRegex = new RegExp(`^${apiRoute.src}$`);
  assert.ok(apiRegex.test('/api'), '/api must match');
  assert.ok(apiRegex.test('/api/'), '/api/ must match');
  assert.ok(apiRegex.test('/api/health'), '/api/health must match');
  assert.ok(apiRegex.test('/api/projects'), '/api/projects must match');
  assert.ok(apiRegex.test('/api/intake/canonical'), '/api/intake/canonical must match');
  assert.ok(apiRegex.test('/api/projects/PRJ-001/fleet-read-model'), '/api/projects/... must match');
  assert.ok(apiRegex.test('/api/workspace/sync/trips'), '/api/workspace/sync/trips must match');

  assert.strictEqual(apiRegex.test('/'), false, '/ must not match API');
  assert.strictEqual(apiRegex.test('/projects'), false, '/projects must not match API');
  assert.strictEqual(apiRegex.test('/assets/index.js'), false, '/assets/index.js must not match API');
  assert.strictEqual(apiRegex.test('/favicon.ico'), false, '/favicon.ico must not match API');

  // 5 & 6 & 7 & 8 & 9. Adapter verification
  assert.ok(fs.existsSync(adapterPath), 'api/[...path].ts adapter must exist');
  const adapterContent = fs.readFileSync(adapterPath, 'utf-8');

  assert.ok(
    /import\s*\{\s*app\s*\}\s*from\s*['"]\.\.\/server\/app['"]/.test(adapterContent),
    'Adapter must import canonical server/app'
  );
  assert.ok(/export\s+default/.test(adapterContent), 'Adapter must export default handler');
  assert.ok(!/app\.listen\s*\(/.test(adapterContent), 'Adapter must NOT call app.listen()');
  assert.ok(!/\.listen\s*\(/.test(adapterContent), 'Adapter must NOT call .listen()');
  assert.ok(!/app\.(get|post|put|patch|delete)\s*\(/.test(adapterContent), 'Adapter must not define business routes');

  // Check URL preservation logic
  assert.ok(adapterContent.includes("req.url.startsWith('/api')"), 'Adapter must enforce /api prefix preservation');
  assert.ok(adapterContent.includes('return app(req, res)'), 'Adapter must invoke canonical Express app');

  // Verify server/app.ts
  assert.ok(fs.existsSync(serverAppPath), 'server/app.ts must exist');
  const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8');
  assert.ok(/export\s*\{\s*app\s*\}/.test(serverAppContent), 'server/app.ts must export app');
  assert.ok(serverAppContent.includes("app.get('/api/health'"), 'server/app.ts must declare /api/health');

  console.log('✅ All Vercel Routing Contract assertions passed successfully!');
}

runVercelRoutingContractAssertions();

