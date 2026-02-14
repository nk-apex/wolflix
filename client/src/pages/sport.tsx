import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type BWMResponse } from "@/lib/tmdb";
import { Trophy, Swords, Flag, ScrollText, Dribbble, Dumbbell } from "lucide-react";

const categories = [
  { title: "Sports Movies", key: "sport-general", icon: <Trophy className="w-5 h-5" /> },
  { title: "Boxing & Fighting", key: "sport-boxing", icon: <Swords className="w-5 h-5" /> },
  { title: "Racing & Motorsport", key: "sport-racing", icon: <Flag className="w-5 h-5" /> },
  { title: "Football", key: "sport-football", icon: <Dribbble className="w-5 h-5" /> },
  { title: "Basketball", key: "sport-basketball", icon: <Dumbbell className="w-5 h-5" /> },
  { title: "Sports Documentaries", key: "sport-documentary", icon: <ScrollText className="w-5 h-5" /> },
];

export default function SportPage() {
  const queries = categories.map((cat) => {
    return useQuery<BWMResponse>({
      queryKey: ["/api/silentwolf/category", cat.key],
    });
  });

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Browse</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-sport-heading">Sports</h1>
        <p className="text-sm font-mono text-gray-500 mt-1">Sports movies, documentaries & true stories</p>
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
