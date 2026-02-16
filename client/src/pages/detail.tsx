import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, useSearch } from "wouter";
import { ArrowLeft, Star, Clock, Loader2, Play, Film, Tv, Globe, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { ContentCard } from "@/components/content-card";
import { type RecommendResponse, getMediaType } from "@/lib/tmdb";

interface RichDetailResponse {
  code: number;
  success: boolean;
  data: {
    title?: string;
    description?: string;
    genre?: string;
    releaseDate?: string;
    imdbRatingValue?: string;
    cover?: { url: string };
    duration?: number;
    countryName?: string;
    staffList?: { name: string; roleName: string }[];
    subjectType?: number;
    subjectId?: string;
  };
}

interface DetailResponse {
  code: number;
  success: boolean;
  data: {
    title?: string;
    description?: string;
    genre?: string;
    releaseDate?: string;
    imdbRatingValue?: string;
    cover?: { url: string };
    duration?: number;
    countryName?: string;
    subjectType?: number;
    subjectId?: string;
  };
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Detail() {
  const [, params] = useRoute("/detail/:type/:id");
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const queryParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const type = params?.type || "movie";
  const subjectId = params?.id || "";

  const titleFromUrl = queryParams.get("title") || "";
  const detailPathFromUrl = queryParams.get("detailPath") || "";

  const { data: richDetail, isLoading: detailLoading } = useQuery<RichDetailResponse>({
    queryKey: ["/api/wolflix/rich-detail", detailPathFromUrl],
    enabled: !!detailPathFromUrl,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/rich-detail?detailPath=${encodeURIComponent(detailPathFromUrl)}`);
      if (!res.ok) return { code: 200, success: false, data: {} };
      return res.json();
    },
  });

  const { data: basicDetail } = useQuery<DetailResponse>({
    queryKey: ["/api/wolflix/detail", subjectId],
    enabled: !!subjectId && !detailPathFromUrl,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/detail?subjectId=${subjectId}`);
      if (!res.ok) return { code: 200, success: false, data: {} };
      return res.json();
    },
  });

  const { data: recommendations } = useQuery<RecommendResponse>({
    queryKey: ["/api/wolflix/recommend", subjectId],
    enabled: !!subjectId,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/recommend?subjectId=${subjectId}`);
      if (!res.ok) return { code: 200, success: true, data: { items: [] } };
      return res.json();
    },
  });

  const detail = richDetail?.data || basicDetail?.data;
  const title = detail?.title || titleFromUrl;
  const coverUrl = detail?.cover?.url || "";
  const rating = detail?.imdbRatingValue || "";
  const genres = (detail?.genre || "").split(",").map(g => g.trim()).filter(Boolean);
  const description = detail?.description || "";
  const cast = (detail as any)?.staffList || [];
  const recommendedItems = recommendations?.data?.items || [];
  const isTV = type === "tv";

  const goToWatch = () => {
    let url = `/watch/${type}/${subjectId}?title=${encodeURIComponent(title)}`;
    if (detailPathFromUrl) url += `&detailPath=${encodeURIComponent(detailPathFromUrl)}`;
    navigate(url);
  };

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-mono text-gray-400">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {coverUrl && (
        <div className="relative h-[350px] overflow-hidden">
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        </div>
      )}

      <div className={`relative z-10 px-4 lg:px-6 max-w-7xl mx-auto ${coverUrl ? "-mt-40" : "pt-6"}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-gray-400"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {coverUrl && (
            <div className="flex-shrink-0">
              <GlassCard hover={false} className="overflow-hidden w-[220px]">
                <img src={coverUrl} alt={title} className="w-full rounded-[1rem]" data-testid="img-poster" />
              </GlassCard>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-3" data-testid="text-detail-title">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="outline" className="text-green-400 border-green-500/20 font-mono text-xs">
                {isTV ? <Tv className="w-3 h-3 mr-1" /> : <Film className="w-3 h-3 mr-1" />}
                {isTV ? "TV Show" : "Movie"}
              </Badge>
              {rating && (
                <span className="flex items-center gap-1 text-sm font-mono text-green-400" data-testid="text-rating">
                  <Star className="w-4 h-4 fill-green-400" />
                  {rating}
                </span>
              )}
              {detail?.duration && detail.duration > 0 && (
                <span className="flex items-center gap-1 text-sm font-mono text-gray-400" data-testid="text-runtime">
                  <Clock className="w-4 h-4" />
                  {formatDuration(detail.duration)}
                </span>
              )}
              {detail?.releaseDate && (
                <span className="flex items-center gap-1 text-sm font-mono text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {detail.releaseDate.substring(0, 4)}
                </span>
              )}
              {detail?.countryName && (
                <span className="flex items-center gap-1 text-sm font-mono text-gray-500">
                  <Globe className="w-4 h-4" />
                  {detail.countryName}
                </span>
              )}
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {genres.map((g) => (
                  <Badge key={g} variant="outline" className="text-green-300 border-green-500/15 bg-green-500/10 font-mono">
                    {g}
                  </Badge>
                ))}
              </div>
            )}

            <Button
              onClick={goToWatch}
              className="bg-green-500 text-black font-mono font-bold mb-4"
              data-testid="button-watch-now"
            >
              <Play className="w-4 h-4 mr-2" /> Watch Now
            </Button>

            {description && (
              <GlassPanel className="mb-4">
                <p className="text-sm text-gray-300 leading-relaxed" data-testid="text-description">
                  {description}
                </p>
              </GlassPanel>
            )}

            {cast.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-mono text-gray-500 mb-2">Cast & Crew</h3>
                <div className="flex flex-wrap gap-2">
                  {cast.slice(0, 12).map((person: any) => (
                    <Badge key={person.name} variant="outline" className="text-gray-400 border-green-500/10 font-mono text-xs">
                      {person.name}
                      {person.roleName && <span className="text-gray-600 ml-1">({person.roleName})</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {recommendedItems.length > 0 && (
          <div className="mt-8 mb-8">
            <h3 className="text-lg font-display font-bold text-white mb-4">You Might Also Like</h3>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {recommendedItems.slice(0, 12).map((item) => (
                <ContentCard key={item.subjectId} item={item} type={getMediaType(item.subjectType)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
