import fs from 'fs';
import path from 'path';
import assert from 'assert';

export function runVercelRoutingContractAssertions() {
  const rootDir = process.cwd();
  const vercelJsonPath = path.join(rootDir, 'vercel.json');
  const serverAppPath = path.join(rootDir, 'server/app.ts');
  const apiIndexPath = path.join(rootDir, 'api/index.ts');

  // Invariant A: Canonical Express app exists and is exported from server/app.ts
  assert.ok(fs.existsSync(serverAppPath), 'server/app.ts must exist as canonical Express authority');
  const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8');
  assert.ok(/export\s*\{\s*app\s*\}/.test(serverAppContent), 'server/app.ts must export canonical Express app');

  // Invariant B: Canonical API routes remain in server/app.ts
  assert.ok(serverAppContent.includes("app.get('/api/health'"), 'server/app.ts must declare /api/health');
  assert.ok(serverAppContent.includes("app.post('/api/projects'"), 'server/app.ts must declare /api/projects');
  assert.ok(serverAppContent.includes("app.post('/api/intake/canonical'"), 'server/app.ts must declare /api/intake/canonical');
  assert.ok(serverAppContent.includes("app.use('/api', authenticateUser)"), 'server/app.ts must maintain global API auth');

  // Invariant C: Vercel Express entrypoint references/exports that canonical app
  assert.ok(fs.existsSync(apiIndexPath), 'api/index.ts must exist as Vercel Express entrypoint');
  const adapterContent = fs.readFileSync(apiIndexPath, 'utf-8');

  assert.ok(
    /import\s*\{\s*app\s*\}\s*from\s*['"]\.\.\/server\/app['"]/.test(adapterContent),
    'Vercel entrypoint must import canonical app from server/app'
  );
  assert.ok(
    /export\s+default\s+app;?|export\s+default\s+function/.test(adapterContent),
    'Vercel entrypoint must export default canonical Express app'
  );

  // Invariant D: No Vercel entrypoint calls app.listen(), creates another Express instance, defines business routes, or mutates req.url
  assert.ok(!/app\.listen\s*\(/.test(adapterContent), 'Vercel entrypoint must NOT call app.listen()');
  assert.ok(!/\.listen\s*\(/.test(adapterContent), 'Vercel entrypoint must NOT call .listen()');
  assert.ok(!/express\(\)/.test(adapterContent), 'Vercel entrypoint must NOT instantiate another Express app');
  assert.ok(!/app\.(get|post|put|patch|delete)\s*\(/.test(adapterContent), 'Vercel entrypoint must not duplicate business routes');
  assert.ok(!/req\.url\s*=/.test(adapterContent), 'Vercel entrypoint must NOT mutate req.url');

  // Invariant E, F, G: SPA configuration explicitly excludes /api, covers client routes, and avoids artificial API rewrites
  assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  assert.ok(Array.isArray(vercelConfig.rewrites), 'vercel.json must declare rewrites array');
  const rewrites = vercelConfig.rewrites;

  // Verify there are NO artificial API rewrites collapsing or modifying API paths
  const apiRewrites = rewrites.filter((r: any) => typeof r.destination === 'string' && r.destination.startsWith('/api'));
  assert.strictEqual(apiRewrites.length, 0, 'vercel.json must NOT contain artificial API rewrites');

  // Verify SPA fallback isolation
  const spaFallback = rewrites.find((r: any) => r.destination === '/index.html');
  assert.ok(spaFallback, 'Rewrites must include SPA fallback pointing to /index.html');
  
  // Test that SPA fallback regex DOES NOT match any /api path or subpath
  const spaSourceRegex = new RegExp(`^${spaFallback.source}$`);
  assert.strictEqual(spaSourceRegex.test('/api'), false, 'SPA fallback must NOT match /api');
  assert.strictEqual(spaSourceRegex.test('/api/'), false, 'SPA fallback must NOT match /api/');
  assert.strictEqual(spaSourceRegex.test('/api/health'), false, 'SPA fallback must NOT match /api/health');
  assert.strictEqual(spaSourceRegex.test('/api/projects'), false, 'SPA fallback must NOT match /api/projects');
  assert.strictEqual(spaSourceRegex.test('/api/intake/canonical'), false, 'SPA fallback must NOT match /api/intake/canonical');
  assert.strictEqual(spaSourceRegex.test('/api/projects/PRJ-001/readiness'), false, 'SPA fallback must NOT match /api/projects/PRJ-001/readiness');
  assert.strictEqual(spaSourceRegex.test('/api/workspace/sync/trips'), false, 'SPA fallback must NOT match /api/workspace/sync/trips');

  // Test that SPA fallback DOES match valid client SPA routes
  assert.ok(spaSourceRegex.test('/'), 'SPA fallback must match root /');
  assert.ok(spaSourceRegex.test('/projects'), 'SPA fallback must match /projects');
  assert.ok(spaSourceRegex.test('/projects/PRJ-001'), 'SPA fallback must match /projects/PRJ-001');
  assert.ok(spaSourceRegex.test('/trips/new'), 'SPA fallback must match /trips/new');
  assert.ok(spaSourceRegex.test('/admin/console'), 'SPA fallback must match /admin/console');

  console.log('✅ All Vercel Routing Architectural Contract assertions passed successfully!');
}

runVercelRoutingContractAssertions();
