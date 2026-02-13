import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type BWMResponse } from "@/lib/tmdb";
import { Flame, Sword, Rocket, Palette, Castle, ScrollText } from "lucide-react";

const categories = [
  { title: "Trending TV Shows", key: "tv-trending", icon: <Flame className="w-5 h-5" /> },
  { title: "Action & Adventure", key: "tv-action", icon: <Sword className="w-5 h-5" /> },
  { title: "Sci-Fi & Fantasy", key: "tv-scifi", icon: <Rocket className="w-5 h-5" /> },
  { title: "Animation", key: "tv-animation", icon: <Palette className="w-5 h-5" /> },
  { title: "Drama Series", key: "tv-drama", icon: <Castle className="w-5 h-5" /> },
  { title: "Documentary", key: "tv-documentary", icon: <ScrollText className="w-5 h-5" /> },
];

export default function TVShows() {
  const queries = categories.map((cat) => {
    return useQuery<BWMResponse>({
      queryKey: ["/api/bwm/category", cat.key],
    });
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
          items={queries[i].data?.titles || []}
          type="tv"
          isLoading={queries[i].isLoading}
        />
      ))}
    </div>
  );
}
