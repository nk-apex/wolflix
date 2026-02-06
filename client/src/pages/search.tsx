import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X, Film, Tv } from "lucide-react";
import { ContentCard } from "@/components/content-card";
import { type TMDBMovie } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";

interface TMDBRes { results: TMDBMovie[] }

export default function Search() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<TMDBRes>({
    queryKey: ["/api/tmdb/search", searchTerm],
    enabled: searchTerm.length > 1,
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/search/${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query.trim());
  };

  const results = data?.results || [];

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Discover</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-search-heading">Search</h1>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
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

      {!isLoading && results.length > 0 && (
        <div>
          <p className="text-xs font-mono text-gray-500 mb-4">{results.length} results found</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.filter(r => r.poster_path).map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                type={item.media_type === "tv" ? "tv" : "movie"}
              />
            ))}
          </div>
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
        </div>
      )}
    </div>
  );
}
