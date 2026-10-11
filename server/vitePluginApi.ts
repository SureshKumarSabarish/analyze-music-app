import type { Plugin } from 'vite';
import express from 'express';
import { handleSearch, handleAnalyze, handleArtworkProxy, handleCuratedIndex } from './apiHandler.ts';

export function viteApiPlugin(): Plugin {
  const app = express();
  app.use(express.json());

  app.get('/api/curated-index', async (req, res) => {
    try {
      const count = parseInt((req.query.count as string) || '12', 10);
      const data = await handleCuratedIndex(isNaN(count) ? 12 : count);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch curated index' });
    }
  });

  app.get('/api/search', async (req, res) => {
    try {
      const query = (req.query.query as string) || '';
      const type = (req.query.type as string) || 'song';
      const genre = (req.query.genre as string) || '';
      const limitParam = parseInt((req.query.limit as string) || '30', 10);
      const limit = isNaN(limitParam) ? 30 : limitParam;
      const data = await handleSearch(query, type, genre, limit);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'iTunes search failed' });
    }
  });

  app.get('/api/artwork-proxy', async (req, res) => {
    try {
      const imageUrl = (req.query.url as string) || '';
      const result = await handleArtworkProxy(imageUrl);
      if (!result) {
        res.status(404).send('Image not found');
        return;
      }
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.send(result.buffer);
    } catch (error: any) {
      res.status(500).send('Failed to proxy artwork');
    }
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const data = await handleAnalyze(req.body);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Music analysis failed' });
    }
  });

  return {
    name: 'vite-api-plugin',
    configureServer(server) {
      server.middlewares.use(app);
    },
  };
}
