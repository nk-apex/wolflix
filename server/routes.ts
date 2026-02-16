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
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

async function apiFetch(path: string, timeout = 25000): Promise<any> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Referer": "https://movieapi.xcasper.space/",
      "Origin": "https://movieapi.xcasper.space",
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

  const detailPathCache = new Map<string, string>();

  async function resolveDetailPath(subjectId: string, title?: string): Promise<string | null> {
    const cached = detailPathCache.get(subjectId);
    if (cached) return cached;

    try {
      const [trending, hot] = await Promise.allSettled([
        apiFetch("/trending"),
        apiFetch("/hot"),
      ]);

      const allItems: any[] = [];
      if (trending.status === "fulfilled") {
        allItems.push(...(trending.value?.data?.subjectList || []));
      }
      if (hot.status === "fulfilled") {
        allItems.push(...(hot.value?.data?.movie || []));
        allItems.push(...(hot.value?.data?.tv || []));
      }

      const found = allItems.find((item: any) => item.subjectId === subjectId);
      if (found?.detailPath) {
        detailPathCache.set(subjectId, found.detailPath);
        return found.detailPath;
      }

      if (title) {
        const searchData = await apiFetch(`/search?keyword=${encodeURIComponent(title)}`);
        const searchItems = searchData?.data?.items || [];
        const match = searchItems.find((item: any) => item.subjectId === subjectId) || searchItems[0];
        if (match?.detailPath) {
          detailPathCache.set(subjectId, match.detailPath);
          return match.detailPath;
        }
      }
    } catch {}

    return null;
  }

  app.get("/api/wolflix/play", async (req, res) => {
    try {
      const subjectId = req.query.subjectId as string;
      let detailPath = req.query.detailPath as string;
      if (!subjectId) return res.status(400).json({ success: false, error: "subjectId required" });

      if (!detailPath) {
        const title = req.query.title as string || "";
        const resolved = await resolveDetailPath(subjectId, title);
        if (!resolved) return res.status(404).json({ success: false, error: "Could not resolve content path" });
        detailPath = resolved;
      }

      if (detailPath) {
        detailPathCache.set(subjectId, detailPath);
      }

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

  app.get("/api/wolflix/showbox/search", async (req, res) => {
    try {
      const keyword = req.query.keyword as string;
      const type = req.query.type as string || "movie";
      if (!keyword) return res.status(400).json({ success: false, error: "keyword required" });
      const cacheKey = `showbox-search:${keyword}:${type}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch(`/showbox/search?keyword=${encodeURIComponent(keyword)}&type=${type}`);
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/showbox/stream", async (req, res) => {
    try {
      const id = req.query.id as string;
      const type = req.query.type as string || "movie";
      if (!id) return res.status(400).json({ success: false, error: "id required" });
      let path = `/stream?id=${id}&type=${type}`;
      const season = req.query.season as string;
      const episode = req.query.episode as string;
      if (season) path += `&season=${season}`;
      if (episode) path += `&episode=${episode}`;
      const cacheKey = `showbox-stream:${id}:${type}:${season || ""}:${episode || ""}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch(path, 30000);
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/showbox/resolve", async (req, res) => {
    try {
      const title = req.query.title as string;
      const type = req.query.type as string || "movie";
      const season = req.query.season as string;
      const episode = req.query.episode as string;
      if (!title) return res.status(400).json({ success: false, error: "title required" });

      const cleanTitle = title.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim();
      const searchData = await apiFetch(`/showbox/search?keyword=${encodeURIComponent(cleanTitle)}&type=${type}`);
      const list = searchData?.list || searchData?.data || [];
      if (!list.length) {
        return res.json({ success: false, error: "No ShowBox results found", links: [] });
      }

      const exactMatch = list.find((item: any) =>
        item.title?.toLowerCase() === cleanTitle.toLowerCase()
      ) || list.find((item: any) =>
        item.title?.toLowerCase().includes(cleanTitle.toLowerCase())
      ) || list[0];

      const showboxId = exactMatch.id;
      let streamPath = `/stream?id=${showboxId}&type=${type}`;
      if (type === "tv" && season && episode) {
        streamPath += `&season=${season}&episode=${episode}`;
      }

      const streamData = await apiFetch(streamPath, 30000);
      const links = streamData?.data?.links || [];

      res.json({
        success: true,
        showboxId,
        title: exactMatch.title,
        links,
        imdbId: streamData?.data?.imdbId || "",
      });
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message, links: [] });
    }
  });

  app.get("/api/wolflix/newtoxic/search", async (req, res) => {
    try {
      const keyword = req.query.keyword as string;
      if (!keyword) return res.status(400).json({ success: false, error: "keyword required" });
      const cacheKey = `newtoxic-search:${keyword}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch(`/newtoxic/search?keyword=${encodeURIComponent(keyword)}`);
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/newtoxic/detail", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "url required" });
      const cacheKey = `newtoxic-detail:${url}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const data = await apiFetch(`/newtoxic/detail?url=${encodeURIComponent(url)}`);
      setCache(cacheKey, data);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  app.get("/api/wolflix/newtoxic/resolve", async (req, res) => {
    try {
      const file_url = req.query.file_url as string;
      if (!file_url) return res.status(400).json({ success: false, error: "file_url required" });
      const data = await apiFetch(`/newtoxic/resolve?file_url=${encodeURIComponent(file_url)}`, 30000);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  return httpServer;
}
