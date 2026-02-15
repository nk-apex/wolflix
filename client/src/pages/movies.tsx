import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type HotResponse, type TrendingResponse, type SubjectItem } from "@/lib/tmdb";
import { Flame, Film } from "lucide-react";

export default function Movies() {
  const { data: hot, isLoading: hotLoading } = useQuery<HotResponse>({
    queryKey: ["/api/wolflix/hot"],
  });

  const { data: trending, isLoading: trendingLoading } = useQuery<TrendingResponse>({
    queryKey: ["/api/wolflix/trending"],
  });

  const hotMovies = hot?.data?.movie || [];
  const allTrending = trending?.data?.subjectList || [];
  const trendingMovies = allTrending.filter(item => item.subjectType === 1);
  const trendingAll = allTrending.filter(item => item.cover?.url);

  const genreGroups: Record<string, SubjectItem[]> = {};
  [...hotMovies, ...trendingAll].forEach(item => {
    if (!item.genre || item.subjectType !== 1) return;
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
    .slice(0, 5);

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Browse</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-movies-heading">Movies</h1>
      </div>

      <ContentRow
        title="Hot Movies"
        icon={<Flame className="w-5 h-5" />}
        items={hotMovies}
        type="movie"
        isLoading={hotLoading}
      />

      {trendingMovies.length > 0 && (
        <ContentRow
          title="Trending Movies"
          icon={<Film className="w-5 h-5" />}
          items={trendingMovies}
          type="movie"
          isLoading={trendingLoading}
        />
      )}

      {topGenres.map(([genre, items]) => (
        <ContentRow
          key={genre}
          title={genre}
          items={items}
          type="movie"
        />
      ))}
    </div>
  );
}
