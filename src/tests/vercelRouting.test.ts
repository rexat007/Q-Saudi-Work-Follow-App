import fs from 'fs';
import path from 'path';
import assert from 'assert';

export function runVercelRoutingContractAssertions() {
  const rootDir = process.cwd();
  const vercelJsonPath = path.join(rootDir, 'vercel.json');
  const serverAppPath = path.join(rootDir, 'server/app.ts');
  const apiIndexPath = path.join(rootDir, 'api/index.ts');

  // Invariant 1: Canonical Express app exists and is exported from server/app.ts
  assert.ok(fs.existsSync(serverAppPath), 'server/app.ts must exist as canonical Express authority');
  const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8');
  assert.ok(/export\s*\{\s*app\s*\}/.test(serverAppContent), 'server/app.ts must export canonical Express app');

  // Invariant 2: Canonical API routes remain in server/app.ts
  assert.ok(serverAppContent.includes("app.get('/api/health'"), 'server/app.ts must declare /api/health');
  assert.ok(serverAppContent.includes("app.post('/api/projects'"), 'server/app.ts must declare /api/projects');
  assert.ok(serverAppContent.includes("app.post('/api/intake/canonical'"), 'server/app.ts must declare /api/intake/canonical');
  assert.ok(serverAppContent.includes("app.use('/api', authenticateUser)"), 'server/app.ts must maintain global API auth');

  // Invariant 3: Vercel adapter entry boundary exists and preserves canonical isolation
  assert.ok(fs.existsSync(apiIndexPath), 'api/index.ts must exist as Vercel deployment adapter');
  const adapterContent = fs.readFileSync(apiIndexPath, 'utf-8');

  assert.ok(
    /import\s*\{\s*app\s*\}\s*from\s*['"]\.\.\/server\/app['"]/.test(adapterContent),
    'Adapter must import canonical app from server/app'
  );
  assert.ok(/export\s+default\s+function\s+handler/.test(adapterContent), 'Adapter must export default handler');
  assert.ok(!/app\.listen\s*\(/.test(adapterContent), 'Adapter must NOT call app.listen()');
  assert.ok(!/\.listen\s*\(/.test(adapterContent), 'Adapter must NOT call .listen()');
  assert.ok(!/express\(\)/.test(adapterContent), 'Adapter must NOT instantiate another Express app');
  assert.ok(!/app\.(get|post|put|patch|delete)\s*\(/.test(adapterContent), 'Adapter must not duplicate business routes');

  // Invariant 4: vercel.json configuration and rewrite structure
  assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  assert.ok(Array.isArray(vercelConfig.rewrites), 'vercel.json must declare rewrites array');
  const rewrites = vercelConfig.rewrites;

  // 4a. API rewrite rule precedes SPA fallback
  const apiRewriteIdx = rewrites.findIndex((r: any) => r.source === '/api/:path*');
  const spaFallbackIdx = rewrites.findIndex((r: any) => r.destination === '/index.html');
  assert.ok(apiRewriteIdx !== -1, 'vercel.json must declare rewrite for /api/:path*');
  assert.ok(spaFallbackIdx !== -1, 'vercel.json must declare SPA fallback');
  assert.ok(apiRewriteIdx < spaFallbackIdx, 'API rewrite rule MUST precede SPA fallback');

  const apiRewrite = rewrites[apiRewriteIdx];
  assert.strictEqual(apiRewrite.destination, '/api/index?path=:path*', 'API rewrite must map to /api/index?path=:path*');

  // 4b. Simulate Vercel rewrite destination mapping
  function simulateVercelRewrite(publicUrl: string): string | null {
    const urlObj = new URL(publicUrl, 'http://localhost');
    const pathname = urlObj.pathname;
    
    // Check if pathname matches /api or /api/:path*
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      const pathParam = pathname === '/api' || pathname === '/api/' ? '' : pathname.replace(/^\/api\//, '');
      const search = urlObj.search ? `&${urlObj.search.slice(1)}` : '';
      return `/api/index?path=${pathParam}${search}`;
    }
    return null;
  }

  // 4c. Simulate Adapter URL transformation
  function simulateAdapterTransformation(vercelUrl: string): { url: string; query: Record<string, string> } {
    const parsed = new URL(vercelUrl, 'http://localhost');
    let routePath = parsed.searchParams.get('path');
    parsed.searchParams.delete('path');

    let canonicalPath = '/api';
    if (routePath) {
      const cleanRoutePath = routePath.startsWith('/') ? routePath.slice(1) : routePath;
      canonicalPath = cleanRoutePath ? `/api/${cleanRoutePath}` : '/api';
    }

    const query: Record<string, string> = {};
    parsed.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    const search = parsed.searchParams.toString();
    const finalUrl = search ? `${canonicalPath}?${search}` : canonicalPath;
    return { url: finalUrl, query };
  }

  // Test Case 1: /api/health
  const destHealth = simulateVercelRewrite('/api/health');
  assert.strictEqual(destHealth, '/api/index?path=health', 'Vercel rewrite for /api/health must map to /api/index?path=health');
  const transformedHealth = simulateAdapterTransformation(destHealth!);
  assert.strictEqual(transformedHealth.url, '/api/health', 'Express must receive /api/health');
  assert.strictEqual('path' in transformedHealth.query, false, 'Routing path must not leak into query');

  // Test Case 2: /api/projects
  const destProjects = simulateVercelRewrite('/api/projects');
  assert.strictEqual(destProjects, '/api/index?path=projects', 'Vercel rewrite for /api/projects must map to /api/index?path=projects');
  const transformedProjects = simulateAdapterTransformation(destProjects!);
  assert.strictEqual(transformedProjects.url, '/api/projects', 'Express must receive /api/projects');
  assert.strictEqual('path' in transformedProjects.query, false, 'Routing path must not leak into query');

  // Test Case 3: /api/projects/PRJ-001/readiness
  const destReadiness = simulateVercelRewrite('/api/projects/PRJ-001/readiness');
  assert.strictEqual(
    destReadiness,
    '/api/index?path=projects/PRJ-001/readiness',
    'Vercel rewrite for /api/projects/PRJ-001/readiness must map to /api/index?path=projects/PRJ-001/readiness'
  );
  const transformedReadiness = simulateAdapterTransformation(destReadiness!);
  assert.strictEqual(transformedReadiness.url, '/api/projects/PRJ-001/readiness', 'Express must receive /api/projects/PRJ-001/readiness');
  assert.strictEqual('path' in transformedReadiness.query, false, 'Routing path must not leak into query');

  // Test Case 4: /api/workspace/sync/trips
  const destSyncTrips = simulateVercelRewrite('/api/workspace/sync/trips');
  assert.strictEqual(
    destSyncTrips,
    '/api/index?path=workspace/sync/trips',
    'Vercel rewrite for /api/workspace/sync/trips must map to /api/index?path=workspace/sync/trips'
  );
  const transformedSyncTrips = simulateAdapterTransformation(destSyncTrips!);
  assert.strictEqual(transformedSyncTrips.url, '/api/workspace/sync/trips', 'Express must receive /api/workspace/sync/trips');
  assert.strictEqual('path' in transformedSyncTrips.query, false, 'Routing path must not leak into query');

  // Test Case 5: /api/workspace/trips?status=ACTIVE&page=2
  const destQueryTrips = simulateVercelRewrite('/api/workspace/trips?status=ACTIVE&page=2');
  assert.strictEqual(
    destQueryTrips,
    '/api/index?path=workspace/trips&status=ACTIVE&page=2',
    'Vercel rewrite must preserve search parameters'
  );
  const transformedQueryTrips = simulateAdapterTransformation(destQueryTrips!);
  assert.strictEqual(
    transformedQueryTrips.url,
    '/api/workspace/trips?status=ACTIVE&page=2',
    'Express must receive /api/workspace/trips?status=ACTIVE&page=2'
  );
  assert.strictEqual(transformedQueryTrips.query.status, 'ACTIVE', 'Business query param "status" must be preserved');
  assert.strictEqual(transformedQueryTrips.query.page, '2', 'Business query param "page" must be preserved');
  assert.strictEqual('path' in transformedQueryTrips.query, false, 'Routing path param must be stripped from query');

  // Invariant 5: SPA fallback isolation & client coverage
  const spaFallback = rewrites[spaFallbackIdx];
  const spaSourceRegex = new RegExp(`^${spaFallback.source}$`);

  // Exclusions:
  assert.strictEqual(spaSourceRegex.test('/api'), false, '/api must NOT match SPA fallback');
  assert.strictEqual(spaSourceRegex.test('/api/'), false, '/api/ must NOT match SPA fallback');
  assert.strictEqual(spaSourceRegex.test('/api/health'), false, '/api/health must NOT match SPA fallback');
  assert.strictEqual(spaSourceRegex.test('/api/projects'), false, '/api/projects must NOT match SPA fallback');
  assert.strictEqual(spaSourceRegex.test('/api/intake/canonical'), false, '/api/intake/canonical must NOT match SPA fallback');
  assert.strictEqual(spaSourceRegex.test('/api/projects/PRJ-001/readiness'), false, '/api/projects/PRJ-001/readiness must NOT match SPA fallback');
  assert.strictEqual(spaSourceRegex.test('/api/workspace/sync/trips'), false, '/api/workspace/sync/trips must NOT match SPA fallback');

  // Inclusions:
  assert.ok(spaSourceRegex.test('/'), 'Root / must match SPA fallback');
  assert.ok(spaSourceRegex.test('/projects'), '/projects must match SPA fallback');
  assert.ok(spaSourceRegex.test('/projects/PRJ-001'), '/projects/PRJ-001 must match SPA fallback');
  assert.ok(spaSourceRegex.test('/trips/new'), '/trips/new must match SPA fallback');
  assert.ok(spaSourceRegex.test('/admin/console'), '/admin/console must match SPA fallback');

  console.log('✅ All Vercel Routing Contract assertions passed successfully!');
}

runVercelRoutingContractAssertions();
