import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type TMDBMovie } from "@/lib/tmdb";
import { Flame, Sword, Rocket, Ghost, Theater, Laugh } from "lucide-react";

interface TMDBRes { results: TMDBMovie[] }

const categories = [
  { title: "Trending Movies", key: "trending", icon: <Flame className="w-5 h-5" /> },
  { title: "Action Movies", key: "28", icon: <Sword className="w-5 h-5" /> },
  { title: "Sci-Fi Movies", key: "878", icon: <Rocket className="w-5 h-5" /> },
  { title: "Horror Movies", key: "27", icon: <Ghost className="w-5 h-5" /> },
  { title: "Drama Movies", key: "18", icon: <Theater className="w-5 h-5" /> },
  { title: "Comedy Movies", key: "35", icon: <Laugh className="w-5 h-5" /> },
];

export default function Movies() {
  const queries = categories.map((cat) => {
    const url = cat.key === "trending"
      ? "/api/tmdb/movies/trending"
      : `/api/tmdb/movies/genre/${cat.key}`;
    return useQuery<TMDBRes>({ queryKey: [url] });
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
          items={queries[i].data?.results || []}
          type="movie"
          isLoading={queries[i].isLoading}
        />
      ))}
    </div>
  );
}
