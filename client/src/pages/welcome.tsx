import { useState, useEffect, useCallback } from "react";
import { Film, Play, TrendingUp, Tv, Clock, Zap, ArrowRight, Activity, Search, ChevronLeft, ChevronRight, Star, Flame, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { useQuery } from "@tanstack/react-query";
import { type TrendingResponse, type HotResponse, type HomepageResponse, type SearchResponse, type PopularSearchResponse, type SubjectItem, getRating, getYear, getPosterUrl, getMediaType } from "@/lib/tmdb";
import { ContentCard } from "@/components/content-card";
import { ContentGrid } from "@/components/content-grid";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import wolflixLogo from "@assets/wolflix-logo.png";

const stats = [
  { label: "Total Movies", value: "500K+", icon: Film, color: "text-green-400" },
  { label: "Active Streams", value: "12.4K", icon: Activity, color: "text-emerald-400" },
  { label: "New Releases", value: "847", icon: Zap, color: "text-lime-400" },
  { label: "System Uptime", value: "99.9%", icon: Clock, color: "text-green-300" },
];

const quickActions = [
  { label: "Browse Now", icon: Play, href: "/movies" },
  { label: "Top Picks", icon: TrendingUp, href: "/movies" },
  { label: "TV Shows", icon: Tv, href: "/tv-shows" },
];

export default function Welcome() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  const { data: homepage } = useQuery<HomepageResponse>({
    queryKey: ["/api/wolflix/homepage"],
  });

  const { data: trending, isLoading: trendingLoading } = useQuery<TrendingResponse>({
    queryKey: ["/api/wolflix/trending"],
  });

  const { data: hot, isLoading: hotLoading } = useQuery<HotResponse>({
    queryKey: ["/api/wolflix/hot"],
  });

  const { data: popularSearch } = useQuery<PopularSearchResponse>({
    queryKey: ["/api/wolflix/popular-search"],
  });

  const popularTerms = popularSearch?.data?.everyoneSearch?.map(s => s.title) || [];
  const firstPopularTerm = popularTerms[0] || "";
  const secondPopularTerm = popularTerms[1] || "";
  const thirdPopularTerm = popularTerms[2] || "";

  const { data: searchResult1, isLoading: search1Loading } = useQuery<SearchResponse>({
    queryKey: ["/api/wolflix/search", firstPopularTerm],
    enabled: !!firstPopularTerm,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/search?keyword=${encodeURIComponent(firstPopularTerm)}`);
      if (!res.ok) return { code: 200, success: true, data: { pager: { hasMore: false, nextPage: "1", page: "1", totalCount: 0 }, items: [] } };
      return res.json();
    },
  });

  const { data: searchResult2, isLoading: search2Loading } = useQuery<SearchResponse>({
    queryKey: ["/api/wolflix/search", secondPopularTerm],
    enabled: !!secondPopularTerm,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/search?keyword=${encodeURIComponent(secondPopularTerm)}`);
      if (!res.ok) return { code: 200, success: true, data: { pager: { hasMore: false, nextPage: "1", page: "1", totalCount: 0 }, items: [] } };
      return res.json();
    },
  });

  const { data: searchResult3, isLoading: search3Loading } = useQuery<SearchResponse>({
    queryKey: ["/api/wolflix/search", thirdPopularTerm],
    enabled: !!thirdPopularTerm,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/search?keyword=${encodeURIComponent(thirdPopularTerm)}`);
      if (!res.ok) return { code: 200, success: true, data: { pager: { hasMore: false, nextPage: "1", page: "1", totalCount: 0 }, items: [] } };
      return res.json();
    },
  });

  const bannerItems = homepage?.data?.operatingList?.find(op => op.type === "BANNER")?.banner?.items || [];
  const trendingItems = trending?.data?.subjectList || [];
  const hotMovies = hot?.data?.movie || [];
  const hotTV = hot?.data?.tv || [];

  const allItems = [...hotMovies, ...hotTV, ...trendingItems];
  const genreGroups: Record<string, SubjectItem[]> = {};
  allItems.forEach(item => {
    if (!item.genre) return;
    item.genre.split(",").map(g => g.trim()).forEach(g => {
      if (!genreGroups[g]) genreGroups[g] = [];
      if (!genreGroups[g].find(ex => ex.subjectId === item.subjectId)) {
        genreGroups[g].push(item);
      }
    });
  });
  const topGenres = Object.entries(genreGroups)
    .filter(([, items]) => items.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6);

  const topRated = [...allItems]
    .filter(i => i.imdbRatingValue && parseFloat(i.imdbRatingValue) > 0)
    .sort((a, b) => parseFloat(b.imdbRatingValue || "0") - parseFloat(a.imdbRatingValue || "0"))
    .filter((item, idx, arr) => arr.findIndex(i => i.subjectId === item.subjectId) === idx)
    .slice(0, 21);

  const newReleases = [...allItems]
    .filter(i => i.releaseDate)
    .sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""))
    .filter((item, idx, arr) => arr.findIndex(i => i.subjectId === item.subjectId) === idx)
    .slice(0, 21);

  const heroItems = bannerItems.length > 0
    ? bannerItems.map(b => b.subject).filter(Boolean).slice(0, 8)
    : trendingItems.slice(0, 8);

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
      <div className="relative overflow-hidden min-h-[420px]">
        {heroItems.map((item, idx) => {
          const posterUrl = getPosterUrl(item);
          return (
            <div
              key={item.subjectId + idx}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === heroIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              {posterUrl && (
                <>
                  <img
                    src={posterUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
                </>
              )}
            </div>
          );
        })}

        <div className="relative z-10 px-6 pt-10 pb-12 max-w-6xl mx-auto">
          <div className="mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-green-400">Welcome to</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <img src={wolflixLogo} alt="WOLFLIX" className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover" />
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white">
              WOLF<span className="text-green-400">LIX</span>
            </h1>
          </div>
          <p className="text-base text-gray-400 font-mono max-w-xl mb-5">
            Your premium streaming platform. Discover movies, TV shows, and exclusive content all in one place.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-lg mb-6">
            <div className="flex items-center rounded-xl border border-green-500/30 bg-black/50 backdrop-blur-sm overflow-hidden focus-within:border-green-500/60 transition-colors">
              <Search className="w-5 h-5 text-green-500/60 ml-4 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, TV shows..."
                className="flex-1 bg-transparent px-3 py-2.5 text-sm font-mono text-white placeholder:text-gray-500 outline-none"
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

          <div className="flex flex-wrap gap-3 mb-6">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <button
                  className="group flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 font-mono text-sm text-green-400 transition-all hover:bg-green-500/20 hover:border-green-500/50"
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
                  {getRating(featured) && (
                    <span className="flex items-center gap-1 text-xs font-mono text-green-400">
                      <Star className="w-3 h-3 fill-green-400" />
                      {getRating(featured)}
                    </span>
                  )}
                  {getYear(featured) && (
                    <span className="text-xs font-mono text-gray-500">
                      {getYear(featured)}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2" data-testid="text-hero-title">
                  {featured.title}
                </h2>
                <Link href={`/watch/${getMediaType(featured.subjectType)}/${featured.subjectId}?title=${encodeURIComponent(featured.title)}${featured.detailPath ? `&detailPath=${encodeURIComponent(featured.detailPath)}` : ""}`}>
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

        <ContentGrid
          title="Trending Now"
          icon={<TrendingUp className="w-5 h-5" />}
          items={trendingItems}
          isLoading={trendingLoading}
        />

        <ContentGrid
          title="Hot Movies"
          icon={<Film className="w-5 h-5" />}
          items={hotMovies}
          type="movie"
          isLoading={hotLoading}
        />

        <ContentGrid
          title="Hot TV Shows"
          icon={<Tv className="w-5 h-5" />}
          items={hotTV}
          type="tv"
          isLoading={hotLoading}
        />

        {topRated.length > 0 && (
          <ContentGrid
            title="Top Rated"
            icon={<Star className="w-5 h-5" />}
            items={topRated}
          />
        )}

        {newReleases.length > 0 && (
          <ContentGrid
            title="New Releases"
            icon={<Sparkles className="w-5 h-5" />}
            items={newReleases}
          />
        )}

        {topGenres.map(([genre, items]) => (
          <ContentGrid
            key={genre}
            title={genre}
            icon={<Film className="w-5 h-5" />}
            items={items}
          />
        ))}

        {searchResult1 && (searchResult1.data?.items?.length || 0) > 0 && (
          <ContentGrid
            title={firstPopularTerm}
            icon={<Flame className="w-5 h-5" />}
            items={searchResult1.data.items}
            isLoading={search1Loading}
          />
        )}

        {searchResult2 && (searchResult2.data?.items?.length || 0) > 0 && (
          <ContentGrid
            title={secondPopularTerm}
            icon={<Flame className="w-5 h-5" />}
            items={searchResult2.data.items}
            isLoading={search2Loading}
          />
        )}

        {searchResult3 && (searchResult3.data?.items?.length || 0) > 0 && (
          <ContentGrid
            title={thirdPopularTerm}
            icon={<Flame className="w-5 h-5" />}
            items={searchResult3.data.items}
            isLoading={search3Loading}
          />
        )}
      </div>
    </div>
  );
}
