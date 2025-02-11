import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5175;
const base = process.env.BASE || '/';

// Cached production assets
const templateHtml = isProduction ? await fs.readFile('./dist/client/index.html', 'utf-8') : '';

// Create http server
const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;

if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    configFile: path.join(__dirname, 'vite-email.config.ts'),
    server: { middlewareMode: true },
    appType: 'custom',
    base
  });
  app.use(vite.middlewares);
}
else {
  // TODO, though this will not be used for production
  const compression = (await import('compression')).default;
  const sirv = (await import('sirv')).default;
  app.use(compression());
  app.use(base, sirv('./dist/client', { extensions: [] }));
}

// Serve HTML
app.all('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '');

    /** @type {string} */
    let template;
    /** @type {import('./src/entry-server.js').render} */
    let render;

    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile(path.join(vite.config.root, './index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule('/render.ts')).render;
    }
    else {
      // TODO, though this will not be used for production
      template = templateHtml;
      render = (await import('./dist/server/entry-server.js')).render;
    }

    const rendered = await render(url);

    console.log(rendered);
    const html = template
      .replace(`<!--app-head-->`, rendered.head || '')
      .replace(`<!--app-css-->`, rendered.css || '')
      .replace(`<!--app-html-->`, rendered.html || '');

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  }
  catch (e) {
    vite?.ssrFixStacktrace(e);
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
