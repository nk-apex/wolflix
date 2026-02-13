import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type BWMResponse } from "@/lib/tmdb";
import { Flame, Star, Trophy, Clock } from "lucide-react";

const categories = [
  { title: "Trending Series", key: "series-trending", icon: <Flame className="w-5 h-5" /> },
  { title: "Top Rated Series", key: "series-top", icon: <Star className="w-5 h-5" /> },
  { title: "Popular Series", key: "series-popular", icon: <Trophy className="w-5 h-5" /> },
  { title: "New Series", key: "series-new", icon: <Clock className="w-5 h-5" /> },
];

export default function Series() {
  const queries = categories.map((cat) => {
    return useQuery<BWMResponse>({
      queryKey: ["/api/bwm/category", cat.key],
    });
  });

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Collections</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-series-heading">Series</h1>
        <p className="text-gray-500 font-mono text-sm mt-1">Complete series collections and episode guides</p>
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
