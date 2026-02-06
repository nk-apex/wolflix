import type { Express } from "express";
import { createServer, type Server } from "http";

const TMDB_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE = "https://api.themoviedb.org/3";

async function tmdbFetch(path: string): Promise<any> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE}${path}${separator}api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/tmdb/trending", async (_req, res) => {
    try {
      const data = await tmdbFetch("/trending/all/day");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/movies/trending", async (_req, res) => {
    try {
      const data = await tmdbFetch("/trending/movie/day");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/movies/popular", async (_req, res) => {
    try {
      const data = await tmdbFetch("/movie/popular");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/movies/top_rated", async (_req, res) => {
    try {
      const data = await tmdbFetch("/movie/top_rated");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/movies/genre/:genreId", async (req, res) => {
    try {
      const data = await tmdbFetch(`/discover/movie?with_genres=${req.params.genreId}&sort_by=popularity.desc`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/tv/trending", async (_req, res) => {
    try {
      const data = await tmdbFetch("/trending/tv/day");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/tv/popular", async (_req, res) => {
    try {
      const data = await tmdbFetch("/tv/popular");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/tv/top_rated", async (_req, res) => {
    try {
      const data = await tmdbFetch("/tv/top_rated");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/tv/airing_today", async (_req, res) => {
    try {
      const data = await tmdbFetch("/tv/airing_today");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/tv/genre/:genreId", async (req, res) => {
    try {
      const data = await tmdbFetch(`/discover/tv?with_genres=${req.params.genreId}&sort_by=popularity.desc`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/animation/movies", async (_req, res) => {
    try {
      const data = await tmdbFetch("/discover/movie?with_genres=16&sort_by=popularity.desc");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/animation/anime", async (_req, res) => {
    try {
      const data = await tmdbFetch("/discover/tv?with_genres=16&with_origin_country=JP&sort_by=popularity.desc");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/animation/tv", async (_req, res) => {
    try {
      const data = await tmdbFetch("/discover/tv?with_genres=16&sort_by=popularity.desc");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/animation/family", async (_req, res) => {
    try {
      const data = await tmdbFetch("/discover/movie?with_genres=16,10751&sort_by=popularity.desc");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/novel/adaptations", async (_req, res) => {
    try {
      const data = await tmdbFetch("/discover/movie?with_keywords=818&sort_by=popularity.desc");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/novel/classics", async (_req, res) => {
    try {
      const data = await tmdbFetch("/discover/movie?with_keywords=9672&sort_by=vote_average.desc&vote_count.gte=100");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/novel/fantasy", async (_req, res) => {
    try {
      const data = await tmdbFetch("/discover/movie?with_genres=14&sort_by=popularity.desc");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/novel/series", async (_req, res) => {
    try {
      const data = await tmdbFetch("/discover/tv?with_genres=18&sort_by=popularity.desc");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/search/:query", async (req, res) => {
    try {
      const data = await tmdbFetch(`/search/multi?query=${encodeURIComponent(req.params.query)}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
