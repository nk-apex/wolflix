import { useQuery } from "@tanstack/react-query";
import { ContentGrid } from "@/components/content-grid";
import { type HotResponse, type TrendingResponse, type SearchResponse, type PopularSearchResponse, type SubjectItem } from "@/lib/tmdb";
import { Flame, Film, TrendingUp, Star, Sparkles } from "lucide-react";

export default function Movies() {
  const { data: hot, isLoading: hotLoading } = useQuery<HotResponse>({
    queryKey: ["/api/wolflix/hot"],
  });

  const { data: trending, isLoading: trendingLoading } = useQuery<TrendingResponse>({
    queryKey: ["/api/wolflix/trending"],
  });

  const { data: popularSearch } = useQuery<PopularSearchResponse>({
    queryKey: ["/api/wolflix/popular-search"],
  });

  const popularTerms = popularSearch?.data?.everyoneSearch?.map(s => s.title) || [];
  const term1 = popularTerms[0] || "";
  const term2 = popularTerms[1] || "";
  const term3 = popularTerms[2] || "";
  const term4 = popularTerms[3] || "";

  const { data: sr1, isLoading: sr1Loading } = useQuery<SearchResponse>({
    queryKey: ["/api/wolflix/search", term1],
    enabled: !!term1,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/search?keyword=${encodeURIComponent(term1)}`);
      if (!res.ok) return { code: 200, success: true, data: { pager: { hasMore: false, nextPage: "1", page: "1", totalCount: 0 }, items: [] } };
      return res.json();
    },
  });
  const { data: sr2, isLoading: sr2Loading } = useQuery<SearchResponse>({
    queryKey: ["/api/wolflix/search", term2],
    enabled: !!term2,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/search?keyword=${encodeURIComponent(term2)}`);
      if (!res.ok) return { code: 200, success: true, data: { pager: { hasMore: false, nextPage: "1", page: "1", totalCount: 0 }, items: [] } };
      return res.json();
    },
  });
  const { data: sr3, isLoading: sr3Loading } = useQuery<SearchResponse>({
    queryKey: ["/api/wolflix/search", term3],
    enabled: !!term3,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/search?keyword=${encodeURIComponent(term3)}`);
      if (!res.ok) return { code: 200, success: true, data: { pager: { hasMore: false, nextPage: "1", page: "1", totalCount: 0 }, items: [] } };
      return res.json();
    },
  });
  const { data: sr4, isLoading: sr4Loading } = useQuery<SearchResponse>({
    queryKey: ["/api/wolflix/search", term4],
    enabled: !!term4,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/search?keyword=${encodeURIComponent(term4)}`);
      if (!res.ok) return { code: 200, success: true, data: { pager: { hasMore: false, nextPage: "1", page: "1", totalCount: 0 }, items: [] } };
      return res.json();
    },
  });

  const hotMovies = hot?.data?.movie || [];
  const allTrending = trending?.data?.subjectList || [];
  const trendingMovies = allTrending.filter(item => item.subjectType === 1);
  const trendingAll = allTrending.filter(item => item.cover?.url);

  const allMovieItems = [...hotMovies, ...trendingAll.filter(i => i.subjectType === 1)];

  const topRated = [...allMovieItems]
    .filter(i => i.imdbRatingValue && parseFloat(i.imdbRatingValue) > 0)
    .sort((a, b) => parseFloat(b.imdbRatingValue || "0") - parseFloat(a.imdbRatingValue || "0"))
    .filter((item, idx, arr) => arr.findIndex(i => i.subjectId === item.subjectId) === idx)
    .slice(0, 21);

  const newReleases = [...allMovieItems]
    .filter(i => i.releaseDate)
    .sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""))
    .filter((item, idx, arr) => arr.findIndex(i => i.subjectId === item.subjectId) === idx)
    .slice(0, 21);

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
    .slice(0, 10);

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Browse</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-movies-heading">Movies</h1>
      </div>

      <ContentGrid
        title="Hot Movies"
        icon={<Flame className="w-5 h-5" />}
        items={hotMovies}
        type="movie"
        isLoading={hotLoading}
      />

      {trendingMovies.length > 0 && (
        <ContentGrid
          title="Trending Movies"
          icon={<TrendingUp className="w-5 h-5" />}
          items={trendingMovies}
          type="movie"
          isLoading={trendingLoading}
        />
      )}

      {topRated.length > 0 && (
        <ContentGrid
          title="Top Rated"
          icon={<Star className="w-5 h-5" />}
          items={topRated}
          type="movie"
        />
      )}

      {newReleases.length > 0 && (
        <ContentGrid
          title="New Releases"
          icon={<Sparkles className="w-5 h-5" />}
          items={newReleases}
          type="movie"
        />
      )}

      {topGenres.map(([genre, items]) => (
        <ContentGrid
          key={genre}
          title={genre}
          icon={<Film className="w-5 h-5" />}
          items={items}
          type="movie"
        />
      ))}

      {sr1 && (sr1.data?.items?.length || 0) > 0 && (
        <ContentGrid
          title={term1}
          icon={<Flame className="w-5 h-5" />}
          items={sr1.data.items.filter(i => i.subjectType === 1)}
          type="movie"
          isLoading={sr1Loading}
        />
      )}

      {sr2 && (sr2.data?.items?.length || 0) > 0 && (
        <ContentGrid
          title={term2}
          icon={<Flame className="w-5 h-5" />}
          items={sr2.data.items.filter(i => i.subjectType === 1)}
          type="movie"
          isLoading={sr2Loading}
        />
      )}

      {sr3 && (sr3.data?.items?.length || 0) > 0 && (
        <ContentGrid
          title={term3}
          icon={<Flame className="w-5 h-5" />}
          items={sr3.data.items.filter(i => i.subjectType === 1)}
          type="movie"
          isLoading={sr3Loading}
        />
      )}

      {sr4 && (sr4.data?.items?.length || 0) > 0 && (
        <ContentGrid
          title={term4}
          icon={<Flame className="w-5 h-5" />}
          items={sr4.data.items.filter(i => i.subjectType === 1)}
          type="movie"
          isLoading={sr4Loading}
        />
      )}
    </div>
  );
}
