import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/content-row";
import { type BWMResponse } from "@/lib/tmdb";
import { Music2, Mic, Film, Theater } from "lucide-react";

const categories = [
  { title: "Music Documentaries", key: "music-documentary", icon: <Film className="w-5 h-5" /> },
  { title: "Music Biopics", key: "music-biopic", icon: <Mic className="w-5 h-5" /> },
  { title: "Concert Films", key: "music-concert", icon: <Music2 className="w-5 h-5" /> },
  { title: "Musicals", key: "music-musical", icon: <Theater className="w-5 h-5" /> },
];

export default function MusicPage() {
  const queries = categories.map((cat) => {
    return useQuery<BWMResponse>({
      queryKey: ["/api/silentwolf/category", cat.key],
    });
  });

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Browse</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-music-heading">Music</h1>
        <p className="text-sm font-mono text-gray-500 mt-1">Music documentaries, biopics, concerts & musicals</p>
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
