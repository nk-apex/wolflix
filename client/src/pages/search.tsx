import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search as SearchIcon, X, Film, Tv, Star } from "lucide-react";
import { type BWMTitle, type BWMResponse, getMediaType, getRating, getPosterUrl } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data: bwmData, isLoading } = useQuery<BWMResponse>({
    queryKey: ["/api/silentwolf/search", searchTerm],
    enabled: searchTerm.length > 1,
    queryFn: async () => {
      const res = await fetch(`/api/silentwolf/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query.trim());
  };

  const results = (bwmData?.titles || []).filter(t => t.primaryImage?.url);

  const handleResultClick = (item: BWMTitle) => {
    const mediaType = getMediaType(item.type);
    navigate(`/watch/${mediaType}/${item.id}?source=zone&title=${encodeURIComponent(item.primaryTitle)}`);
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

      {searchTerm && !isLoading && results.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-mono text-gray-500">
            Wolflix Results ({results.length})
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

      {!isLoading && searchTerm && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((item) => {
            const posterUrl = getPosterUrl(item);
            const mediaType = getMediaType(item.type);
            const ratingStr = getRating(item.rating);
            return (
              <div
                key={item.id}
                onClick={() => handleResultClick(item)}
                className="cursor-pointer group"
                data-testid={`card-result-${item.id}`}
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-green-500/10 bg-black/40">
                  <img
                    src={posterUrl}
                    alt={item.primaryTitle}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {ratingStr && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-xs font-mono">
                      <Star className="w-3 h-3 text-green-400 fill-green-400" />
                      <span className="text-green-400">{ratingStr}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-mono text-white mt-2 line-clamp-1">{item.primaryTitle}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-mono text-gray-500">{item.startYear || ""} {mediaType === "tv" ? <Tv className="inline w-3 h-3" /> : <Film className="inline w-3 h-3" />}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && searchTerm && results.length === 0 && (
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
          <p className="text-gray-600 font-mono text-xs mt-1">Powered by SilentWolf</p>
        </div>
      )}
    </div>
  );
}
