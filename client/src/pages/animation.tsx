import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type TMDBMovie } from "@/lib/tmdb";
import { Palette, Film, Tv, Sparkles } from "lucide-react";

interface TMDBRes { results: TMDBMovie[] }

const categories = [
  { title: "Animated Movies", key: "movies", icon: <Film className="w-5 h-5" />, type: "movie" as const },
  { title: "Anime Series", key: "anime", icon: <Sparkles className="w-5 h-5" />, type: "tv" as const },
  { title: "Animated TV Shows", key: "tv", icon: <Tv className="w-5 h-5" />, type: "tv" as const },
  { title: "Family Animation", key: "family", icon: <Palette className="w-5 h-5" />, type: "movie" as const },
];

export default function Animation() {
  const queries = categories.map((cat) => {
    const url = `/api/tmdb/animation/${cat.key}`;
    return useQuery<TMDBRes>({ queryKey: [url] });
  });

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Explore</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-animation-heading">Animation</h1>
        <p className="text-gray-500 font-mono text-sm mt-1">Animated movies, anime, and cartoon collections</p>
      </div>
      {categories.map((cat, i) => (
        <ContentRow
          key={cat.key}
          title={cat.title}
          icon={cat.icon}
          items={queries[i].data?.results || []}
          type={cat.type}
          isLoading={queries[i].isLoading}
        />
      ))}
    </div>
  );
}
