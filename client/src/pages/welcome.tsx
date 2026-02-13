import { Film, Play, TrendingUp, Tv, Clock, Zap, ArrowRight, Activity } from "lucide-react";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { useQuery } from "@tanstack/react-query";
import { type TMDBMovie, getImageUrl } from "@/lib/tmdb";
import { ContentCard } from "@/components/content-card";
import { MovieBoxRow } from "@/components/moviebox-row";
import { type MovieBoxItem, type MovieBoxHomeResponse, type MovieBoxTrendingResponse } from "@/lib/moviebox";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data: trending, isLoading } = useQuery<{ results: TMDBMovie[] }>({
    queryKey: ["/api/tmdb/trending"],
  });

  const { data: mbTrending, isLoading: mbTrendingLoading } = useQuery<MovieBoxTrendingResponse>({
    queryKey: ["/api/wolfmovieapi/trending"],
  });

  const { data: mbHome, isLoading: mbHomeLoading } = useQuery<MovieBoxHomeResponse>({
    queryKey: ["/api/wolfmovieapi/home"],
  });

  const featured = trending?.results?.[0];
  const trendingItems = trending?.results?.slice(1, 9) || [];

  const mbTrendingItems = mbTrending?.data?.subjectList || [];

  const homeCategories = (mbHome?.data?.operatingList || [])
    .filter(m => m.type === "SUBJECTS_MOVIE" && m.subjects && m.subjects.length > 0)
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        {featured && featured.backdrop_path && (
          <div className="absolute inset-0">
            <img
              src={getImageUrl(featured.backdrop_path, "w1280")}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
          </div>
        )}
        <div className="relative z-10 px-6 pt-12 pb-16 max-w-6xl mx-auto">
          <div className="mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-green-400">Welcome to</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-display font-bold text-white mb-2">
            WOLF<span className="text-green-400">LIX</span>
          </h1>
          <p className="text-lg text-gray-400 font-mono max-w-xl mb-8">
            Your premium streaming platform. Discover movies, TV shows, and exclusive content all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
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

        {featured && (
          <GlassPanel className="mb-10 overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0 w-full md:w-48">
                {featured.poster_path && (
                  <img
                    src={getImageUrl(featured.poster_path, "w342")}
                    alt={featured.title || featured.name || ""}
                    className="w-full rounded-xl border border-green-500/10"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-green-400 uppercase tracking-wider">Featured Today</span>
                <h2 className="text-3xl font-display font-bold text-white mt-1 mb-3">
                  {featured.title || featured.name}
                </h2>
                <p className="text-gray-400 font-mono text-sm leading-relaxed line-clamp-4 mb-4">
                  {featured.overview}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/watch/movie/${featured.id}`}>
                    <button
                      className="flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2 font-mono text-sm font-bold text-black transition-all hover:bg-green-400"
                      data-testid="button-stream-featured"
                    >
                      <Play className="w-4 h-4" /> Stream Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </GlassPanel>
        )}

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

        <MovieBoxRow
          title="MovieBox Trending"
          icon={<Zap className="w-5 h-5" />}
          items={mbTrendingItems}
          isLoading={mbTrendingLoading}
        />

        {homeCategories.map((cat) => (
          <MovieBoxRow
            key={cat.title}
            title={cat.title}
            icon={<Film className="w-5 h-5" />}
            items={cat.subjects}
            isLoading={mbHomeLoading}
          />
        ))}
      </div>
    </div>
  );
}
