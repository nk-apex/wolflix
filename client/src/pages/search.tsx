import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search as SearchIcon, X, Film, Tv } from "lucide-react";
import { ContentCard } from "@/components/content-card";
import { type TMDBMovie } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";

interface TMDBRes { results: TMDBMovie[] }

interface IMDBTitle {
  id: string;
  type: string;
  primaryTitle: string;
  originalTitle: string;
  primaryImage?: { url: string; width: number; height: number };
  startYear: number;
  genres: string[];
}

interface IMDBRes { titles: IMDBTitle[] }

interface UnifiedResult {
  id: string;
  title: string;
  year: string;
  posterUrl: string | null;
  mediaType: "movie" | "tv";
  source: "tmdb" | "imdb";
  tmdbItem?: TMDBMovie;
  imdbItem?: IMDBTitle;
}

function deduplicateResults(tmdbResults: TMDBMovie[], imdbResults: IMDBTitle[]): UnifiedResult[] {
  const results: UnifiedResult[] = [];
  const seenTitles = new Set<string>();

  for (const item of imdbResults) {
    if (!item.primaryImage?.url) continue;
    const key = `${item.primaryTitle.toLowerCase()}-${item.startYear}`;
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    results.push({
      id: item.id,
      title: item.primaryTitle,
      year: String(item.startYear || ""),
      posterUrl: item.primaryImage.url,
      mediaType: item.type === "tvSeries" || item.type === "tvMiniSeries" ? "tv" : "movie",
      source: "imdb",
      imdbItem: item,
    });
  }

  for (const item of tmdbResults) {
    if (!item.poster_path) continue;
    const title = item.title || item.name || "";
    const year = (item.release_date || item.first_air_date || "").split("-")[0];
    const key = `${title.toLowerCase()}-${year}`;
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    results.push({
      id: String(item.id),
      title,
      year,
      posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
      mediaType: item.media_type === "tv" ? "tv" : "movie",
      source: "tmdb",
      tmdbItem: item,
    });
  }

  return results;
}

export default function SearchPage() {
  const [location] = useLocation();
  const urlQ = new URLSearchParams(window.location.search).get("q") || "";
  const [query, setQuery] = useState(urlQ);
  const [searchTerm, setSearchTerm] = useState(urlQ);
  const [, navigate] = useLocation();

  useEffect(() => {
    const currentQ = new URLSearchParams(window.location.search).get("q") || "";
    if (currentQ && currentQ !== searchTerm) {
      setQuery(currentQ);
      setSearchTerm(currentQ);
    }
  }, [location]);

  const { data: tmdbData, isLoading: tmdbLoading } = useQuery<TMDBRes>({
    queryKey: ["/api/tmdb/search", searchTerm],
    enabled: searchTerm.length > 1,
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/search/${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const { data: imdbData, isLoading: imdbLoading } = useQuery<IMDBRes>({
    queryKey: ["/api/imdb/search", searchTerm],
    enabled: searchTerm.length > 1,
    queryFn: async () => {
      const res = await fetch(`/api/imdb/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("IMDB search failed");
      return res.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query.trim());
  };

  const tmdbResults = tmdbData?.results || [];
  const imdbResults = imdbData?.titles || [];
  const isLoading = tmdbLoading || imdbLoading;

  const unified = deduplicateResults(tmdbResults, imdbResults);

  const handleResultClick = (item: UnifiedResult) => {
    if (item.source === "imdb") {
      navigate(`/watch/${item.mediaType}/${item.id}?source=zone&title=${encodeURIComponent(item.title)}`);
    } else if (item.tmdbItem) {
      navigate(`/watch/${item.mediaType}/${item.tmdbItem.id}`);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Discover</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-search-heading">Search</h1>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500/50" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, series..."
            className="w-full rounded-2xl border border-green-500/20 bg-black/30 backdrop-blur-sm py-3.5 pl-12 pr-12 font-mono text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 focus:shadow-[0_0_30px_rgba(0,255,0,0.1)] transition-all"
            data-testid="input-search"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setSearchTerm(""); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {searchTerm && !isLoading && unified.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-mono text-gray-500">
            Wolflix Results ({unified.length})
          </p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="w-full aspect-[2/3] rounded-2xl bg-green-900/10" />
              <Skeleton className="w-3/4 h-4 mt-3 rounded bg-green-900/10" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && searchTerm && unified.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {unified.map((item) => {
            if (item.source === "tmdb" && item.tmdbItem) {
              return (
                <ContentCard
                  key={`tmdb-${item.id}`}
                  item={item.tmdbItem}
                  type={item.mediaType}
                />
              );
            }
            return (
              <div
                key={`imdb-${item.id}`}
                onClick={() => handleResultClick(item)}
                className="cursor-pointer group"
                data-testid={`card-result-${item.id}`}
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-green-500/10 bg-black/40">
                  <img
                    src={item.posterUrl!}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-green-400">
                      {item.imdbItem?.genres?.slice(0, 2).join(" / ")}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-mono text-white mt-2 line-clamp-1">{item.title}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-mono text-gray-500">{item.year} {item.mediaType === "tv" ? <Tv className="inline w-3 h-3" /> : <Film className="inline w-3 h-3" />}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && searchTerm && unified.length === 0 && (
        <div className="text-center py-20">
          <SearchIcon className="w-12 h-12 text-green-500/20 mx-auto mb-4" />
          <p className="text-gray-500 font-mono text-sm">No results found for "{searchTerm}"</p>
        </div>
      )}

      {!searchTerm && (
        <div className="text-center py-20">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Film className="w-8 h-8 text-green-500/20" />
            <Tv className="w-8 h-8 text-green-500/20" />
          </div>
          <p className="text-gray-500 font-mono text-sm">Search for movies, TV shows, and more</p>
          <p className="text-gray-600 font-mono text-xs mt-1">Wolflix combines multiple sources for the best results</p>
        </div>
      )}
    </div>
  );
}
