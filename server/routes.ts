import type { Express } from "express";
import { createServer, type Server } from "http";

const TMDB_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE = "https://api.themoviedb.org/3";
const ARSLAN_BASE = "https://arslan-apis.vercel.app/movie";

const MOVIEBOX_API = "https://h5-api.aoneroom.com/wefeed-h5api-bff";

const UA = "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0";

let movieboxToken: string | null = null;
let tokenExpiry = 0;

async function getMovieboxToken(): Promise<string> {
  if (movieboxToken && Date.now() < tokenExpiry) return movieboxToken;
  const res = await fetch(
    `${MOVIEBOX_API}/web/get-page-tdk?page_key=home&site_key=moviebox`,
    { headers: { "User-Agent": UA } }
  );
  const xUser = res.headers.get("x-user");
  if (xUser) {
    const parsed = JSON.parse(xUser);
    movieboxToken = parsed.token;
    tokenExpiry = Date.now() + 3600000;
    return movieboxToken!;
  }
  throw new Error("Failed to obtain MovieBox token");
}

async function movieboxGet(path: string): Promise<any> {
  const token = await getMovieboxToken();
  const url = `${MOVIEBOX_API}${path}`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": UA,
      "X-Client-Token": token,
      "X-Request-Lang": "en",
    },
  });
  if (!res.ok) throw new Error(`MovieBox API error: ${res.status}`);
  return res.json();
}

async function movieboxPost(path: string, body: any): Promise<any> {
  const token = await getMovieboxToken();
  const url = `${MOVIEBOX_API}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": UA,
      "X-Client-Token": token,
      "X-Request-Lang": "en",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`MovieBox API error: ${res.status}`);
  return res.json();
}

async function tmdbFetch(path: string): Promise<any> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE}${path}${separator}api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
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

  // =============================================
  // WolfMovieAPI - MovieBox Powered Endpoints
  // =============================================

  app.get("/api/wolfmovieapi/home", async (_req, res) => {
    try {
      const data = await movieboxGet("/home");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/wolfmovieapi/search", async (req, res) => {
    try {
      const keyword = req.query.keyword as string;
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const subjectType = req.query.type as string || "";
      if (!keyword) return res.status(400).json({ error: "keyword query required" });
      const data = await movieboxPost("/subject/search", {
        keyword,
        page,
        perPage,
        subjectType: subjectType ? parseInt(subjectType) : undefined,
      });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/wolfmovieapi/search-suggest", async (req, res) => {
    try {
      const keyword = req.query.keyword as string;
      if (!keyword) return res.status(400).json({ error: "keyword query required" });
      const data = await movieboxPost("/subject/search-suggest", {
        keyword,
        perPage: 10,
      });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/wolfmovieapi/trending", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const tabId = req.query.tabId as string || "";
      const data = await movieboxGet(`/subject/trending?tabId=${tabId}&page=${page}&perPage=${perPage}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/wolfmovieapi/filter", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const type = parseInt(req.query.type as string) || 1;
      const genre = req.query.genre as string || "";
      const country = req.query.country as string || "";
      const year = req.query.year as string || "";
      const sort = req.query.sort as string || "";
      const body: any = { type, page, perPage };
      if (genre) body.genre = genre;
      if (country) body.country = country;
      if (year) body.year = year;
      if (sort) body.sort = sort;
      const data = await movieboxPost("/subject/filter", body);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/wolfmovieapi/detail/:subjectId", async (req, res) => {
    try {
      const { subjectId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const data = await movieboxGet(`/subject/detail-rec?subjectId=${subjectId}&page=${page}&perPage=12`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  app.get("/api/wolfmovieapi/stream-domain", async (_req, res) => {
    try {
      const data = await movieboxGet("/media-player/get-domain");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/wolfmovieapi/everyone-search", async (req, res) => {
    try {
      const data = await movieboxGet("/subject/everyone-search");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // =============================================
  // TMDB Endpoints (kept for compatibility)
  // =============================================

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

  app.get("/api/tmdb/movie/:id", async (req, res) => {
    try {
      const data = await tmdbFetch(`/movie/${req.params.id}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/tv/:id", async (req, res) => {
    try {
      const data = await tmdbFetch(`/tv/${req.params.id}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/movie/:id/external_ids", async (req, res) => {
    try {
      const data = await tmdbFetch(`/movie/${req.params.id}/external_ids`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/tv/:id/external_ids", async (req, res) => {
    try {
      const data = await tmdbFetch(`/tv/${req.params.id}/external_ids`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tmdb/tv/:id/season/:season", async (req, res) => {
    try {
      const data = await tmdbFetch(`/tv/${req.params.id}/season/${req.params.season}`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // =============================================
  // IMDB API Endpoints (via imdbapi.dev)
  // =============================================

  app.get("/api/imdb/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "q query required" });
      const response = await fetch(`https://api.imdbapi.dev/search/titles?query=${encodeURIComponent(query)}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`IMDB API error: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // =============================================
  // Arslan API Endpoints (kept for compatibility)
  // =============================================

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
