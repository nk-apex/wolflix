import { useState, useEffect, useCallback } from "react";
import { Film, Play, TrendingUp, Tv, Clock, Zap, ArrowRight, Activity, Search, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { useQuery } from "@tanstack/react-query";
import { type TMDBMovie, getImageUrl, getRating, getYear } from "@/lib/tmdb";
import { ContentCard } from "@/components/content-card";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total Movies", value: "500K+", icon: Film, color: "text-green-400" },
  { label: "Active Streams", value: "12.4K", icon: Activity, color: "text-emerald-400" },
  { label: "New Releases", value: "847", icon: Zap, color: "text-lime-400" },
  { label: "System Uptime", value: "99.9%", icon: Clock, color: "text-green-300" },
];

const quickActions = [
  { label: "Browse Now", icon: Play, href: "/movies" },
  { label: "Top Picks", icon: TrendingUp, href: "/most-viewed" },
  { label: "TV Shows", icon: Tv, href: "/tv-shows" },
];

export default function Welcome() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  const { data: trending, isLoading } = useQuery<{ results: TMDBMovie[] }>({
    queryKey: ["/api/tmdb/trending"],
  });

  const heroItems = trending?.results?.slice(0, 8) || [];
  const trendingItems = trending?.results?.slice(0, 12) || [];
  const featured = heroItems[heroIndex];

  const nextHero = useCallback(() => {
    if (heroItems.length === 0) return;
    setHeroIndex(prev => (prev + 1) % heroItems.length);
  }, [heroItems.length]);

  const prevHero = useCallback(() => {
    if (heroItems.length === 0) return;
    setHeroIndex(prev => (prev - 1 + heroItems.length) % heroItems.length);
  }, [heroItems.length]);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const timer = setInterval(nextHero, 6000);
    return () => clearInterval(timer);
  }, [heroItems.length, nextHero]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden min-h-[520px]">
        {heroItems.map((item, idx) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === heroIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {item.backdrop_path && (
              <>
                <img
                  src={getImageUrl(item.backdrop_path, "w1280")}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
              </>
            )}
          </div>
        ))}

        <div className="relative z-10 px-6 pt-12 pb-16 max-w-6xl mx-auto">
          <div className="mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-green-400">Welcome to</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-display font-bold text-white mb-2">
            WOLF<span className="text-green-400">LIX</span>
          </h1>
          <p className="text-lg text-gray-400 font-mono max-w-xl mb-6">
            Your premium streaming platform. Discover movies, TV shows, and exclusive content all in one place.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-lg mb-8">
            <div className="flex items-center rounded-xl border border-green-500/30 bg-black/50 backdrop-blur-sm overflow-hidden focus-within:border-green-500/60 transition-colors">
              <Search className="w-5 h-5 text-green-500/60 ml-4 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, TV shows..."
                className="flex-1 bg-transparent px-3 py-3 text-sm font-mono text-white placeholder:text-gray-500 outline-none"
                data-testid="input-search-welcome"
              />
              <Button
                type="submit"
                size="sm"
                className="mr-1 bg-green-500 text-black font-mono font-bold text-xs"
                data-testid="button-search-welcome"
              >
                Search
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3 mb-8">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <button
                  className="group flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-2.5 font-mono text-sm text-green-400 transition-all hover:bg-green-500/20 hover:border-green-500/50"
                  data-testid={`button-${action.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </Link>
            ))}
          </div>

          {featured && (
            <div className="flex items-end gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-green-400 uppercase tracking-wider">Featured</span>
                  {featured.vote_average > 0 && (
                    <span className="flex items-center gap-1 text-xs font-mono text-green-400">
                      <Star className="w-3 h-3 fill-green-400" />
                      {getRating(featured.vote_average)}
                    </span>
                  )}
                  {getYear(featured.release_date || featured.first_air_date) && (
                    <span className="text-xs font-mono text-gray-500">
                      {getYear(featured.release_date || featured.first_air_date)}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2" data-testid="text-hero-title">
                  {featured.title || featured.name}
                </h2>
                <p className="text-sm text-gray-400 font-mono line-clamp-2 max-w-lg mb-4">
                  {featured.overview}
                </p>
                <Link href={`/watch/${featured.media_type === "tv" ? "tv" : "movie"}/${featured.id}`}>
                  <button
                    className="flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2 font-mono text-sm font-bold text-black transition-all hover:bg-green-400"
                    data-testid="button-stream-featured"
                  >
                    <Play className="w-4 h-4" /> Stream Now
                  </button>
                </Link>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={prevHero}
                  className="text-gray-400 bg-black/40 backdrop-blur-sm"
                  data-testid="button-hero-prev"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex gap-1.5 px-2">
                  {heroItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === heroIndex ? "bg-green-400 w-6" : "bg-gray-600"}`}
                      data-testid={`button-hero-dot-${idx}`}
                    />
                  ))}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={nextHero}
                  className="text-gray-400 bg-black/40 backdrop-blur-sm"
                  data-testid="button-hero-next"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 max-w-6xl mx-auto -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <GlassCard key={stat.label} hover={false} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-white" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                {stat.value}
              </p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-1">{stat.label}</p>
            </GlassCard>
          ))}
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-display font-bold text-white">Trending Now</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[180px]">
                    <Skeleton className="w-full aspect-[2/3] rounded-2xl bg-green-900/10" />
                    <Skeleton className="w-3/4 h-4 mt-3 rounded bg-green-900/10" />
                  </div>
                ))
              : trendingItems.map((item) => (
                  <ContentCard key={item.id} item={item} type={item.media_type === "tv" ? "tv" : "movie"} />
                ))}
          </div>
        </div>

      </div>
    </div>
  );
}
