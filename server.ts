import {shellCacheHeaders} from './server/runtimeVersion';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath,{setHeaders:shellCacheHeaders}));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control','no-cache, max-age=0, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
