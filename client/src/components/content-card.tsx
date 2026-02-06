import { Play, Download, Star } from "lucide-react";
import { GlassCard } from "./glass-card";
import { getImageUrl, getRating, getYear, openStream, openDownload, type TMDBMovie } from "@/lib/tmdb";

interface ContentCardProps {
  item: TMDBMovie;
  type?: "movie" | "tv";
}

export function ContentCard({ item, type = "movie" }: ContentCardProps) {
  const title = item.title || item.name || "Untitled";
  const year = getYear(item.release_date || item.first_air_date);
  const posterUrl = getImageUrl(item.poster_path, "w342");

  return (
    <GlassCard className="group overflow-visible flex-shrink-0 w-[180px]">
      <div className="relative overflow-hidden rounded-t-[1rem] aspect-[2/3]">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-green-900/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-green-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); openStream(type, item.id); }}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-500 py-1.5 text-xs font-mono font-bold text-black transition-all hover:bg-green-400"
            data-testid={`button-stream-${item.id}`}
          >
            <Play className="w-3 h-3" />
            Stream
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openDownload(type, item.id); }}
            className="flex items-center justify-center rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-mono text-white transition-all hover:bg-white/20"
            data-testid={`button-download-${item.id}`}
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
        {item.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-xs font-mono">
            <Star className="w-3 h-3 text-green-400 fill-green-400" />
            <span className="text-green-400">{getRating(item.vote_average)}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-display font-bold text-white truncate" data-testid={`text-title-${item.id}`}>{title}</h3>
        {year && <p className="text-xs font-mono text-gray-500 mt-0.5">{year}</p>}
      </div>
    </GlassCard>
  );
}
