import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type TMDBMovie } from "@/lib/tmdb";
import { Flame, Sword, Rocket, Palette, Castle, ScrollText } from "lucide-react";

interface TMDBRes { results: TMDBMovie[] }

const categories = [
  { title: "Trending TV Shows", key: "trending", icon: <Flame className="w-5 h-5" /> },
  { title: "Action & Adventure", key: "10759", icon: <Sword className="w-5 h-5" /> },
  { title: "Sci-Fi & Fantasy", key: "10765", icon: <Rocket className="w-5 h-5" /> },
  { title: "Animation", key: "16", icon: <Palette className="w-5 h-5" /> },
  { title: "Drama Series", key: "18", icon: <Castle className="w-5 h-5" /> },
  { title: "Documentary", key: "99", icon: <ScrollText className="w-5 h-5" /> },
];

export default function TVShows() {
  const queries = categories.map((cat) => {
    const url = cat.key === "trending"
      ? "/api/tmdb/tv/trending"
      : `/api/tmdb/tv/genre/${cat.key}`;
    return useQuery<TMDBRes>({ queryKey: [url] });
  });

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Browse</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-tvshows-heading">TV Shows</h1>
      </div>
      {categories.map((cat, i) => (
        <ContentRow
          key={cat.key}
          title={cat.title}
          icon={cat.icon}
          items={queries[i].data?.results || []}
          type="tv"
          isLoading={queries[i].isLoading}
        />
      ))}
    </div>
  );
}
