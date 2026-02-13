import type { Express } from "express";
import { createServer, type Server } from "http";

const BWM_BASE = "https://api.imdbapi.dev";
const ARSLAN_BASE = "https://arslan-apis.vercel.app/movie";

async function bwmSearch(query: string): Promise<any> {
  const url = `${BWM_BASE}/search/titles?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`BWM API error: ${res.status}`);
  return res.json();
}

async function arslanFetch(path: string): Promise<any> {
  const url = `${ARSLAN_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Arslan API error: ${res.status}`);
  return res.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/bwm/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ error: "q query required" });
      const data = await bwmSearch(q);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bwm/category/:category", async (req, res) => {
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
      };

      const keywords = keywordMap[category];
      if (!keywords) return res.status(400).json({ error: "Unknown category" });

      const allResults: any[] = [];
      const seenIds = new Set<string>();

      for (const kw of keywords) {
        try {
          const data = await bwmSearch(kw);
          if (data?.titles) {
            for (const t of data.titles) {
              if (!seenIds.has(t.id) && t.primaryImage?.url) {
                seenIds.add(t.id);
                allResults.push(t);
              }
            }
          }
        } catch {}
      }

      res.json({ titles: allResults });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bwm/title/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const url = `${BWM_BASE}/v2/title/${id}`;
      const r = await fetch(url, {
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(`BWM API error: ${r.status}`);
      const data = await r.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/arslan/search", async (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ error: "text query required" });
      const data = await arslanFetch(`/pirate/search?text=${encodeURIComponent(text)}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/arslan/movie", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "url query required" });
      const data = await arslanFetch(`/pirate/movie?url=${encodeURIComponent(url)}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/arslan/sinhalasub/search", async (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ error: "text query required" });
      const data = await arslanFetch(`/sinhalasub/search?text=${encodeURIComponent(text)}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/arslan/sinhalasub/movie", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "url query required" });
      const data = await arslanFetch(`/sinhalasub/movie?url=${encodeURIComponent(url)}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/arslan/sinhalasub/tvshow", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "url query required" });
      const data = await arslanFetch(`/sinhalasub/tvshow?url=${encodeURIComponent(url)}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/arslan/sinhalasub/episode", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "url query required" });
      const data = await arslanFetch(`/sinhalasub/episode?url=${encodeURIComponent(url)}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
