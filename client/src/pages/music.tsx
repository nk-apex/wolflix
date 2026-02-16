import { useState } from "react";
import { Search, Music, Play, Clock, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { useLocation } from "wouter";

interface MusicSearchItem {
  title: string;
  id: string;
  size: string;
  duration: string;
  channelTitle: string;
  source: string;
}

interface MusicSearchResponse {
  success: boolean;
  items: MusicSearchItem[];
  query: string;
}

export default function MusicPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MusicSearchItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [, navigate] = useLocation();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(`/api/wolflix/music/search?q=${encodeURIComponent(query.trim())}`);
      const data: MusicSearchResponse = await res.json();

      if (!data.success || !data.items?.length) {
        setResults([]);
        setError("No results found. Try a different search.");
        setLoading(false);
        return;
      }

      setResults(data.items);
    } catch {
      setError("Search failed. Please try again.");
    }

    setLoading(false);
  };

  const goToPlay = (item: MusicSearchItem) => {
    navigate(`/music/play/${item.id}?title=${encodeURIComponent(item.title)}&channel=${encodeURIComponent(item.channelTitle)}&duration=${encodeURIComponent(item.duration)}`);
  };

  return (
    <div className="min-h-screen px-4 lg:px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Listen</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-music-heading">Music</h1>
        <p className="text-sm font-mono text-gray-500 mt-1">Search and play music</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for songs, artists, albums..."
              className="w-full rounded-xl border border-green-500/20 bg-black/40 py-2.5 pl-10 pr-4 font-mono text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40 transition-colors"
              data-testid="input-music-search"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-green-500 text-black font-mono font-bold text-sm px-6"
            data-testid="button-music-search"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </Button>
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm font-mono text-red-400" data-testid="text-music-error">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((item) => (
            <GlassCard
              key={item.id}
              className="overflow-visible group"
              onClick={() => goToPlay(item)}
            >
              <div className="relative overflow-hidden rounded-t-[1rem] aspect-video">
                <img
                  src={`https://img.youtube.com/vi/${item.id}/hqdefault.jpg`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  data-testid={`img-music-${item.id}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); goToPlay(item); }}
                    className="flex-1 bg-green-500 text-black font-mono font-bold text-xs"
                    data-testid={`button-play-${item.id}`}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                </div>
                {item.duration && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-xs font-mono">
                    <Clock className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">{item.duration}</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-display font-bold text-white truncate" data-testid={`text-music-title-${item.id}`}>
                  {item.title}
                </h3>
                <p className="text-xs font-mono text-gray-500 mt-0.5 truncate flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.channelTitle}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-16">
          <Music className="w-16 h-16 text-green-500/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-gray-500 mb-2">No results found</h3>
          <p className="text-sm font-mono text-gray-600">Try a different search term</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16">
          <Music className="w-16 h-16 text-green-500/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-gray-500 mb-2">Search for music</h3>
          <p className="text-sm font-mono text-gray-600 max-w-md mx-auto">
            Search for any song, artist or album to start listening
          </p>
        </div>
      )}
    </div>
  );
}
