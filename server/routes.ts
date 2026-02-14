import type { Express } from "express";
import { createServer, type Server } from "http";

const IMDB_API_BASE = "https://api.imdbapi.dev";
const DOWNLOAD_API_BASE = "https://arslan-apis.vercel.app/movie";

async function searchTitles(query: string): Promise<any> {
  const url = `${IMDB_API_BASE}/search/titles?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchDownloadApi(path: string): Promise<any> {
  const url = `${DOWNLOAD_API_BASE}${path}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/silentwolf/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ error: "q query required" });
      const data = await searchTitles(q);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Search temporarily unavailable. Please try again.", detail: e.message });
    }
  });

  app.get("/api/silentwolf/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const keywordMap: Record<string, string[]> = {
        "trending": ["2025 movie", "2024 movie", "new release"],
        "action": ["action thriller", "action adventure movie"],
        "scifi": ["science fiction movie", "sci fi"],
        "horror": ["horror movie 2024", "horror thriller"],
        "drama": ["drama movie", "drama film"],
        "comedy": ["comedy movie", "comedy film"],
        "tv-trending": ["tv series 2025", "tv series 2024"],
        "tv-action": ["action tv series", "action adventure series"],
        "tv-scifi": ["sci fi tv series", "science fiction series"],
        "tv-animation": ["animated tv series", "animation series"],
        "tv-drama": ["drama tv series", "drama series"],
        "tv-documentary": ["documentary series", "documentary"],
        "series-trending": ["popular tv series", "best series"],
        "series-top": ["top rated series", "best tv show"],
        "series-popular": ["popular show", "hit tv series"],
        "series-new": ["new tv series 2025", "new series 2024"],
        "animation-movies": ["animated movie", "animation film"],
        "animation-anime": ["anime", "anime series"],
        "animation-tv": ["animated tv show", "cartoon series"],
        "animation-family": ["family animated movie", "family animation"],
        "novel-adaptations": ["book adaptation movie", "novel movie"],
        "novel-classics": ["classic literature film", "classic movie"],
        "novel-fantasy": ["fantasy movie", "fantasy epic film"],
        "novel-series": ["book series tv", "novel tv adaptation"],
        "most-trending": ["blockbuster movie", "box office hit"],
        "most-popular": ["popular movie 2024", "popular film"],
        "most-top-rated": ["top rated movie", "best movie all time"],
        "most-tv-popular": ["popular tv show", "best tv series"],
        "music-concert": ["concert film", "music concert movie"],
        "music-documentary": ["music documentary", "musician biography"],
        "music-biopic": ["music biopic", "singer movie biography"],
        "music-musical": ["musical movie", "musical film"],
        "sport-football": ["football movie", "soccer film"],
        "sport-boxing": ["boxing movie", "boxing film"],
        "sport-racing": ["racing movie", "motorsport film"],
        "sport-documentary": ["sports documentary", "athlete documentary"],
        "sport-basketball": ["basketball movie", "basketball film"],
        "sport-general": ["sports movie", "athletics film"],
      };

      const keywords = keywordMap[category];
      if (!keywords) return res.status(400).json({ error: "Unknown category" });

      const allResults: any[] = [];
      const seenIds = new Set<string>();

      const searchPromises = keywords.map(async (kw) => {
        try {
          const data = await searchTitles(kw);
          return data?.titles || [];
        } catch {
          return [];
        }
      });

      const results = await Promise.allSettled(searchPromises);
      for (const result of results) {
        if (result.status === "fulfilled") {
          for (const t of result.value) {
            if (!seenIds.has(t.id) && t.primaryImage?.url) {
              seenIds.add(t.id);
              allResults.push(t);
            }
          }
        }
      }

      res.json({ titles: allResults });
    } catch (e: any) {
      res.status(502).json({ error: "Content temporarily unavailable. Please try again.", titles: [] });
    }
  });

  app.get("/api/silentwolf/title/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const url = `${IMDB_API_BASE}/v2/title/${id}`;
      const r = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw new Error(`API error: ${r.status}`);
      const data = await r.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Title details temporarily unavailable.", detail: e.message });
    }
  });

  app.get("/api/silentwolf/download/search", async (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ error: "text query required" });
      const data = await fetchDownloadApi(`/pirate/search?text=${encodeURIComponent(text)}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Download search unavailable.", results: [] });
    }
  });

  app.get("/api/silentwolf/download/movie", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "url query required" });
      const data = await fetchDownloadApi(`/pirate/movie?url=${encodeURIComponent(url)}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Download details unavailable.", links: [] });
    }
  });

  app.get("/api/silentwolf/sub/search", async (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ error: "text query required" });
      const data = await fetchDownloadApi(`/sinhalasub/search?text=${encodeURIComponent(text)}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Subtitle search unavailable.", results: [] });
    }
  });

  app.get("/api/silentwolf/sub/movie", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "url query required" });
      const data = await fetchDownloadApi(`/sinhalasub/movie?url=${encodeURIComponent(url)}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Subtitle details unavailable." });
    }
  });

  app.get("/api/silentwolf/sub/tvshow", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "url query required" });
      const data = await fetchDownloadApi(`/sinhalasub/tvshow?url=${encodeURIComponent(url)}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "TV show details unavailable." });
    }
  });

  app.get("/api/silentwolf/sub/episode", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "url query required" });
      const data = await fetchDownloadApi(`/sinhalasub/episode?url=${encodeURIComponent(url)}`);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Episode details unavailable." });
    }
  });

  return httpServer;
}
