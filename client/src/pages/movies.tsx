import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type BWMResponse } from "@/lib/tmdb";
import { Flame, Sword, Rocket, Ghost, Theater, Laugh } from "lucide-react";

const categories = [
  { title: "Trending Movies", key: "trending", icon: <Flame className="w-5 h-5" /> },
  { title: "Action Movies", key: "action", icon: <Sword className="w-5 h-5" /> },
  { title: "Sci-Fi Movies", key: "scifi", icon: <Rocket className="w-5 h-5" /> },
  { title: "Horror Movies", key: "horror", icon: <Ghost className="w-5 h-5" /> },
  { title: "Drama Movies", key: "drama", icon: <Theater className="w-5 h-5" /> },
  { title: "Comedy Movies", key: "comedy", icon: <Laugh className="w-5 h-5" /> },
];

export default function Movies() {
  const queries = categories.map((cat) => {
    return useQuery<BWMResponse>({
      queryKey: ["/api/bwm/category", cat.key],
    });
  });

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Browse</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-movies-heading">Movies</h1>
      </div>
      {categories.map((cat, i) => (
        <ContentRow
          key={cat.key}
          title={cat.title}
          icon={cat.icon}
          items={queries[i].data?.titles || []}
          type="movie"
          isLoading={queries[i].isLoading}
        />
      ))}
    </div>
  );
}
