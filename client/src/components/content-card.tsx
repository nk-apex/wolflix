import { Play, Download, Star } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./glass-card";
import { getImageUrl, getRating, getYear, type TMDBMovie } from "@/lib/tmdb";

interface ContentCardProps {
  item: TMDBMovie;
  type?: "movie" | "tv";
}

export function ContentCard({ item, type = "movie" }: ContentCardProps) {
  const [, navigate] = useLocation();
  const title = item.title || item.name || "Untitled";
  const year = getYear(item.release_date || item.first_air_date);
  const posterUrl = getImageUrl(item.poster_path, "w342");
  const mediaType = item.media_type === "tv" ? "tv" : type;

  const goToWatch = () => navigate(`/watch/${mediaType}/${item.id}`);

  return (
    <GlassCard className="group overflow-visible flex-shrink-0 w-[180px]" onClick={goToWatch}>
      <div className="relative overflow-hidden rounded-t-[1rem] aspect-[2/3]">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            data-testid={`img-poster-${item.id}`}
          />
        ) : (
          <div className="w-full h-full bg-green-900/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-green-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); goToWatch(); }}
            className="flex-1 bg-green-500 text-black font-mono font-bold text-xs"
            data-testid={`button-stream-${item.id}`}
          >
            <Play className="w-3 h-3 mr-1" />
            Watch
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); goToWatch(); }}
            className="bg-white/10 text-white"
            data-testid={`button-download-${item.id}`}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
        {item.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-xs font-mono" data-testid={`text-rating-${item.id}`}>
            <Star className="w-3 h-3 text-green-400 fill-green-400" />
            <span className="text-green-400">{getRating(item.vote_average)}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-display font-bold text-white truncate" data-testid={`text-title-${item.id}`}>{title}</h3>
        {year && <p className="text-xs font-mono text-gray-500 mt-0.5" data-testid={`text-year-${item.id}`}>{year}</p>}
      </div>
    </GlassCard>
  );
}
