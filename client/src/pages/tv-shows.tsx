import { useQuery } from "@tanstack/react-query";
import { ContentGrid } from "@/components/content-grid";
import { type HotResponse, type TrendingResponse, type SubjectItem } from "@/lib/tmdb";
import { Flame, Tv, TrendingUp } from "lucide-react";

export default function TVShows() {
  const { data: hot, isLoading: hotLoading } = useQuery<HotResponse>({
    queryKey: ["/api/wolflix/hot"],
  });

  const { data: trending, isLoading: trendingLoading } = useQuery<TrendingResponse>({
    queryKey: ["/api/wolflix/trending"],
  });

  const hotTV = hot?.data?.tv || [];
  const allTrending = trending?.data?.subjectList || [];
  const trendingTV = allTrending.filter(item => item.subjectType === 2);

  const genreGroups: Record<string, SubjectItem[]> = {};
  [...hotTV, ...trendingTV].forEach(item => {
    if (!item.genre) return;
    const genres = item.genre.split(",").map(g => g.trim());
    genres.forEach(g => {
      if (!genreGroups[g]) genreGroups[g] = [];
      if (!genreGroups[g].find(existing => existing.subjectId === item.subjectId)) {
        genreGroups[g].push(item);
      }
    });
  });

  const topGenres = Object.entries(genreGroups)
    .filter(([, items]) => items.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Browse</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-tvshows-heading">TV Shows</h1>
      </div>

      <ContentGrid
        title="Hot TV Shows"
        icon={<Flame className="w-5 h-5" />}
        items={hotTV}
        type="tv"
        isLoading={hotLoading}
      />

      {trendingTV.length > 0 && (
        <ContentGrid
          title="Trending TV Shows"
          icon={<TrendingUp className="w-5 h-5" />}
          items={trendingTV}
          type="tv"
          isLoading={trendingLoading}
        />
      )}

      {topGenres.map(([genre, items]) => (
        <ContentGrid
          key={genre}
          title={genre}
          icon={<Tv className="w-5 h-5" />}
          items={items}
          type="tv"
        />
      ))}
    </div>
  );
}
