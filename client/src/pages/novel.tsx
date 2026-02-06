import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type TMDBMovie } from "@/lib/tmdb";
import { BookOpen, Library, Crown, Scroll } from "lucide-react";

interface TMDBRes { results: TMDBMovie[] }

const categories = [
  { title: "Book Adaptations", key: "adaptations", icon: <BookOpen className="w-5 h-5" />, type: "movie" as const },
  { title: "Literary Classics", key: "classics", icon: <Library className="w-5 h-5" />, type: "movie" as const },
  { title: "Fantasy Epics", key: "fantasy", icon: <Crown className="w-5 h-5" />, type: "movie" as const },
  { title: "Story-Based Series", key: "series", icon: <Scroll className="w-5 h-5" />, type: "tv" as const },
];

export default function Novel() {
  const queries = categories.map((cat) => {
    const url = `/api/tmdb/novel/${cat.key}`;
    return useQuery<TMDBRes>({ queryKey: [url] });
  });

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Library</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-novel-heading">Novel</h1>
        <p className="text-gray-500 font-mono text-sm mt-1">Book adaptations and story-based content</p>
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
