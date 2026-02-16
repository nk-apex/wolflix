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
      const rawLinks = streamData?.data?.links || [];

      const links = rawLinks.map((link: any) => ({
        ...link,
        url: link.url
          ? link.url.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
          : link.url,
      }));

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

  app.get("/api/wolflix/player", (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).send("Missing url parameter");

    const allowedDomains = [
      "vidsrc.xyz", "vidsrc.me", "vidsrc.icu", "vidsrc.pro", "vidsrc.in", "vidsrc.cc", "vidsrc.to", "vidsrc2.to",
      "multiembed.mov", "autoembed.cc", "player.autoembed.cc",
      "NontonGo.win", "www.NontonGo.win",
      "embedsu.com", "embed.su",
      "2embed.cc", "www.2embed.cc",
    ];

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(d => hostname === d.toLowerCase() || hostname.endsWith("." + d.toLowerCase()));
      if (!isAllowed) {
        return res.status(403).send("Domain not allowed");
      }
    } catch {
      return res.status(400).send("Invalid URL");
    }

    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Security-Policy", "frame-src *; media-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    res.setHeader("Cache-Control", "no-store");

    const safeUrl = url.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="origin">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{width:100%;height:100%;border:0;position:absolute;top:0;left:0}</style>
</head>
<body>
<iframe src="${safeUrl}" allowfullscreen allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope" referrerpolicy="origin"></iframe>
</body>
</html>`);
  });

  return httpServer;
}
