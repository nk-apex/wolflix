import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { type TMDBMovie, getImageUrl, getRating } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { ContentRow } from "@/components/content-row";
import { TrendingUp, Star, Play, Crown, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TMDBRes { results: TMDBMovie[] }

export default function MostViewed() {
  const [, navigate] = useLocation();
  const { data: top10, isLoading: l1 } = useQuery<TMDBRes>({ queryKey: ["/api/tmdb/movies/trending"] });
  const { data: popular, isLoading: l2 } = useQuery<TMDBRes>({ queryKey: ["/api/tmdb/movies/popular"] });
  const { data: topRated, isLoading: l3 } = useQuery<TMDBRes>({ queryKey: ["/api/tmdb/movies/top_rated"] });
  const { data: tvPopular, isLoading: l4 } = useQuery<TMDBRes>({ queryKey: ["/api/tmdb/tv/popular"] });

  const topItems = top10?.results?.slice(0, 10) || [];

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Charts</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-mostviewed-heading">Most Viewed</h1>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-display font-bold text-white">Top 10 Trending</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {l1
            ? Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl bg-green-900/10" />
              ))
            : topItems.map((item, index) => (
                <GlassCard key={item.id} className="flex items-center gap-4 p-3 pr-5" onClick={() => navigate(`/watch/${item.media_type === "tv" ? "tv" : "movie"}/${item.id}`)}>
                  <div className="flex-shrink-0 w-10 text-center">
                    <span className={`text-2xl font-display font-bold ${index < 3 ? "text-green-400" : "text-gray-600"}`} data-testid={`text-rank-${item.id}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden">
                    {item.poster_path && (
                      <img src={getImageUrl(item.poster_path, "w185")} alt="" className="w-full h-full object-cover" data-testid={`img-top-${item.id}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-white text-sm truncate" data-testid={`text-top-title-${item.id}`}>{item.title || item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-3 h-3 text-green-400 fill-green-400" />
                      <span className="text-xs font-mono text-green-400" data-testid={`text-top-rating-${item.id}`}>{getRating(item.vote_average)}</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); navigate(`/watch/${item.media_type === "tv" ? "tv" : "movie"}/${item.id}`); }}
                    className="flex-shrink-0 bg-green-500/10 border border-green-500/20 text-green-400"
                    data-testid={`button-play-top-${item.id}`}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </GlassCard>
              ))}
        </div>
      </div>

      <ContentRow
        title="Popular This Week"
        icon={<TrendingUp className="w-5 h-5" />}
        items={popular?.results || []}
        type="movie"
        isLoading={l2}
      />
      <ContentRow
        title="All-Time Favorites"
        icon={<Heart className="w-5 h-5" />}
        items={topRated?.results || []}
        type="movie"
        isLoading={l3}
      />
      <ContentRow
        title="Popular TV Shows"
        icon={<Star className="w-5 h-5" />}
        items={tvPopular?.results || []}
        type="tv"
        isLoading={l4}
      />
    </div>
  );
}
