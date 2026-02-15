import type { Express } from "express";
import { createServer, type Server } from "http";

const API_BASE = "https://movieapi.xcasper.space/api";

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 300) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

async function apiFetch(path: string): Promise<any> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/wolflix/trending", async (_req, res) => {
    try {
      const cacheKey = "trending";
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch("/trending");
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/hot", async (_req, res) => {
    try {
      const cacheKey = "hot";
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch("/hot");
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/homepage", async (_req, res) => {
    try {
      const cacheKey = "homepage";
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch("/homepage");
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/popular-search", async (_req, res) => {
    try {
      const cacheKey = "popular-search";
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch("/popular-search");
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/search", async (req, res) => {
    try {
      const keyword = req.query.keyword as string;
      if (!keyword) return res.status(400).json({ success: false, error: "keyword required" });
      const page = req.query.page || "1";
      const cacheKey = `search:${keyword}:${page}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch(`/search?keyword=${encodeURIComponent(keyword)}&page=${page}`);
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/detail", async (req, res) => {
    try {
      const subjectId = req.query.subjectId as string;
      if (!subjectId) return res.status(400).json({ success: false, error: "subjectId required" });
      const cacheKey = `detail:${subjectId}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch(`/detail?subjectId=${subjectId}`);
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/rich-detail", async (req, res) => {
    try {
      const detailPath = req.query.detailPath as string;
      if (!detailPath) return res.status(400).json({ success: false, error: "detailPath required" });
      const cacheKey = `rich-detail:${detailPath}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch(`/rich-detail?detailPath=${encodeURIComponent(detailPath)}`);
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/recommend", async (req, res) => {
    try {
      const subjectId = req.query.subjectId as string;
      if (!subjectId) return res.status(400).json({ success: false, error: "subjectId required" });
      const cacheKey = `recommend:${subjectId}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch(`/recommend?subjectId=${subjectId}`);
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/play", async (req, res) => {
    try {
      const subjectId = req.query.subjectId as string;
      const detailPath = req.query.detailPath as string;
      if (!subjectId || !detailPath) return res.status(400).json({ success: false, error: "subjectId and detailPath required" });
      const ep = req.query.ep as string || "";
      const season = req.query.season as string || "";
      let path = `/play?subjectId=${subjectId}&detailPath=${encodeURIComponent(detailPath)}`;
      if (ep) path += `&ep=${ep}`;
      if (season) path += `&season=${season}`;
      const data = await apiFetch(path);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/captions", async (req, res) => {
    try {
      const subjectId = req.query.subjectId as string;
      if (!subjectId) return res.status(400).json({ success: false, error: "subjectId required" });
      const ep = req.query.ep as string || "";
      const season = req.query.season as string || "";
      let path = `/captions?subjectId=${subjectId}`;
      if (ep) path += `&ep=${ep}`;
      if (season) path += `&season=${season}`;
      const data = await apiFetch(path);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/stream", async (req, res) => {
    try {
      const subjectId = req.query.subjectId as string;
      if (!subjectId) return res.status(400).json({ success: false, error: "subjectId required" });
      const ep = req.query.ep as string || "";
      const season = req.query.season as string || "";
      let path = `/stream?subjectId=${subjectId}`;
      if (ep) path += `&ep=${ep}`;
      if (season) path += `&season=${season}`;
      const data = await apiFetch(path);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/showbox/search", async (req, res) => {
    try {
      const keyword = req.query.keyword as string;
      if (!keyword) return res.status(400).json({ success: false, error: "keyword required" });
      const data = await apiFetch(`/showbox/search?keyword=${encodeURIComponent(keyword)}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/showbox/movie", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, error: "id required" });
      const data = await apiFetch(`/showbox/movie?id=${id}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/showbox/tv", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, error: "id required" });
      const data = await apiFetch(`/showbox/tv?id=${id}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  return httpServer;
}
