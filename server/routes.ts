import type { Express } from "express";
import { createServer, type Server } from "http";

const IMDB_API_BASE = "https://api.imdbapi.dev";
const DOWNLOAD_API_BASE = "https://arslan-apis.vercel.app/movie";

const titleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

async function searchTitles(query: string): Promise<any> {
  const url = `${IMDB_API_BASE}/search/titles?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function listTitles(params: Record<string, string | string[]>): Promise<any> {
  const url = new URL(`${IMDB_API_BASE}/titles`);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url.toString(), {
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

interface CategoryConfig {
  method: "search" | "list";
  searches?: string[];
  listParams?: Record<string, string | string[]>;
}

const categoryConfig: Record<string, CategoryConfig> = {
  "trending": { method: "search", searches: ["2025 movie", "2024 movie", "new release"] },
  "action": { method: "list", listParams: { genres: "Action", types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "10000" } },
  "scifi": { method: "list", listParams: { genres: ["Sci-Fi", "Science Fiction"], types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },
  "horror": { method: "list", listParams: { genres: "Horror", types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },
  "drama": { method: "list", listParams: { genres: "Drama", types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "10000" } },
  "comedy": { method: "list", listParams: { genres: "Comedy", types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "10000" } },

  "tv-trending": { method: "search", searches: ["tv series 2025", "tv series 2024"] },
  "tv-action": { method: "list", listParams: { genres: "Action", types: "TV_SERIES", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },
  "tv-scifi": { method: "list", listParams: { genres: ["Sci-Fi", "Science Fiction"], types: "TV_SERIES", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },
  "tv-animation": { method: "list", listParams: { genres: "Animation", types: "TV_SERIES", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },
  "tv-drama": { method: "list", listParams: { genres: "Drama", types: "TV_SERIES", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "10000" } },
  "tv-documentary": { method: "list", listParams: { genres: "Documentary", types: "TV_SERIES", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },

  "series-trending": { method: "search", searches: ["popular tv series", "best series"] },
  "series-top": { method: "list", listParams: { types: "TV_SERIES", sortBy: "SORT_BY_USER_RATING", sortOrder: "DESC", minVoteCount: "50000" } },
  "series-popular": { method: "list", listParams: { types: "TV_SERIES", sortBy: "SORT_BY_USER_RATING_COUNT", sortOrder: "DESC", minVoteCount: "100000" } },
  "series-new": { method: "list", listParams: { types: "TV_SERIES", sortBy: "SORT_BY_RELEASE_DATE", sortOrder: "DESC", minVoteCount: "1000", startYear: "2024" } },

  "animation-movies": { method: "list", listParams: { genres: "Animation", types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "10000" } },
  "animation-anime": { method: "search", searches: ["anime", "anime series"] },
  "animation-tv": { method: "list", listParams: { genres: "Animation", types: "TV_SERIES", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },
  "animation-family": { method: "list", listParams: { genres: ["Animation", "Family"], types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },

  "music-documentary": { method: "list", listParams: { genres: ["Music", "Documentary"], sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "1000" } },
  "music-biopic": { method: "list", listParams: { genres: ["Music", "Biography"], sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "1000" } },
  "music-concert": { method: "list", listParams: { genres: "Music", types: "TV_SPECIAL", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "500" } },
  "music-musical": { method: "list", listParams: { genres: "Musical", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },

  "sport-general": { method: "list", listParams: { genres: "Sport", types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "5000" } },
  "sport-boxing": { method: "search", searches: ["boxing movie", "boxing film"] },
  "sport-racing": { method: "search", searches: ["racing movie", "motorsport film"] },
  "sport-football": { method: "search", searches: ["football movie", "soccer film"] },
  "sport-basketball": { method: "search", searches: ["basketball movie", "basketball film"] },
  "sport-documentary": { method: "list", listParams: { genres: ["Sport", "Documentary"], sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "1000" } },

  "novel-adaptations": { method: "search", searches: ["book adaptation movie", "novel movie"] },
  "novel-classics": { method: "search", searches: ["classic literature film", "classic movie"] },
  "novel-fantasy": { method: "list", listParams: { genres: "Fantasy", types: "MOVIE", sortBy: "SORT_BY_POPULARITY", sortOrder: "DESC", minVoteCount: "10000" } },
  "novel-series": { method: "search", searches: ["book series tv", "novel tv adaptation"] },

  "most-trending": { method: "search", searches: ["blockbuster movie", "box office hit"] },
  "most-popular": { method: "list", listParams: { types: "MOVIE", sortBy: "SORT_BY_USER_RATING_COUNT", sortOrder: "DESC", minVoteCount: "500000" } },
  "most-top-rated": { method: "list", listParams: { types: "MOVIE", sortBy: "SORT_BY_USER_RATING", sortOrder: "DESC", minVoteCount: "100000" } },
  "most-tv-popular": { method: "list", listParams: { types: "TV_SERIES", sortBy: "SORT_BY_USER_RATING_COUNT", sortOrder: "DESC", minVoteCount: "100000" } },
};

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
      const config = categoryConfig[category];
      if (!config) return res.status(400).json({ error: "Unknown category" });

      const allResults: any[] = [];
      const seenIds = new Set<string>();

      if (config.method === "list" && config.listParams) {
        const data = await listTitles(config.listParams);
        const titles = data?.titles || [];
        for (const t of titles) {
          if (!seenIds.has(t.id) && t.primaryImage?.url) {
            seenIds.add(t.id);
            allResults.push(t);
          }
        }
      } else if (config.method === "search" && config.searches) {
        const searchPromises = config.searches.map(async (kw) => {
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
      }

      res.json({ titles: allResults });
    } catch (e: any) {
      res.status(502).json({ error: "Content temporarily unavailable. Please try again.", titles: [] });
    }
  });

  app.get("/api/silentwolf/title/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const cached = titleCache.get(id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      const titleUrl = `${IMDB_API_BASE}/titles/${id}`;
      const seasonsUrl = `${IMDB_API_BASE}/titles/${id}/seasons`;

      const [titleRes, seasonsRes] = await Promise.all([
        fetch(titleUrl, {
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
        }),
        fetch(seasonsUrl, {
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
        }).catch(() => null),
      ]);

      if (!titleRes.ok) throw new Error(`API error: ${titleRes.status}`);
      const data = await titleRes.json();

      let seasons: { seasonNumber: number; episodeCount: number }[] = [];
      let totalSeasons = 0;
      let totalEpisodes = 0;

      if (seasonsRes && seasonsRes.ok && (data.type === "tvSeries" || data.type === "tvMiniSeries")) {
        try {
          const sData = await seasonsRes.json();
          if (sData.seasons && Array.isArray(sData.seasons)) {
            seasons = sData.seasons.map((s: any) => ({
              seasonNumber: parseInt(s.season, 10),
              episodeCount: s.episodeCount || 0,
            }));
            totalSeasons = seasons.length;
            totalEpisodes = seasons.reduce((sum, s) => sum + s.episodeCount, 0);
          }
        } catch {}
      }

      const runtime = data.runtimeSeconds ? Math.round(data.runtimeSeconds / 60) : 0;

      const result = {
        ...data,
        runtime,
        totalSeasons,
        totalEpisodes,
        seasons,
      };

      titleCache.set(id, { data: result, timestamp: Date.now() });
      if (titleCache.size > 200) {
        const oldest = titleCache.keys().next().value;
        if (oldest) titleCache.delete(oldest);
      }

      res.json(result);
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
