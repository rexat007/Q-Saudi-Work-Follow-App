import { app } from '../server/app.js';

export default function handler(req: any, res: any) {
  const rawUrl = req.url || '/';
  const parsed = new URL(rawUrl, 'http://localhost');

  // Extract explicit routing path parameter produced by Vercel rewrite
  let routePath = parsed.searchParams.get('path');
  if (routePath === null && req.query && typeof req.query.path === 'string') {
    routePath = req.query.path;
  }

  // Remove the routing-only 'path' parameter so it does NOT leak into Express business query
  parsed.searchParams.delete('path');
  if (req.query && 'path' in req.query) {
    delete req.query.path;
  }

  // Construct canonical Express pathname
  let canonicalPath = '/api';
  if (routePath) {
    const cleanRoutePath = routePath.startsWith('/') ? routePath.slice(1) : routePath;
    canonicalPath = cleanRoutePath ? `/api/${cleanRoutePath}` : '/api';
  }

  // Preserve non-routing query parameters
  const search = parsed.searchParams.toString();
  req.url = search ? `${canonicalPath}?${search}` : canonicalPath;

  return app(req, res);
}
