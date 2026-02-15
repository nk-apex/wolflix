import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Star, Calendar, Clock, Loader2, Play, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { ContentCard } from "@/components/content-card";
import { type SubjectItem, type RecommendResponse, getRating, getYear, getPosterUrl, getGenres, getMediaType } from "@/lib/tmdb";

interface PlayStream {
  format: string;
  id: string;
  url: string;
  resolutions: string;
  size: string;
  duration: number;
  codecName: string;
}

interface PlaySubtitle {
  language: string;
  languageCode: string;
  url: string;
}

interface PlayResponse {
  code: number;
  success: boolean;
  data: {
    streams: PlayStream[];
    subtitles: PlaySubtitle[];
    hasResource: boolean;
  };
}

function formatFileSize(bytes: string): string {
  const b = parseInt(bytes, 10);
  if (isNaN(b)) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(0)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Watch() {
  const [, params] = useRoute("/watch/:type/:id");
  const [, navigate] = useLocation();
  const type = params?.type || "movie";
  const subjectId = params?.id || "";

  const urlParams = new URLSearchParams(window.location.search);
  const titleFromUrl = urlParams.get("title") || "";
  const detailPathFromUrl = urlParams.get("detailPath") || "";

  const [selectedStreamIdx, setSelectedStreamIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: searchResult } = useQuery<any>({
    queryKey: ["/api/wolflix/search", titleFromUrl],
    enabled: !!titleFromUrl && !detailPathFromUrl,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/search?keyword=${encodeURIComponent(titleFromUrl)}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const matchedItem: SubjectItem | null = useMemo(() => {
    if (!searchResult?.data?.items) return null;
    return searchResult.data.items.find((item: SubjectItem) => item.subjectId === subjectId) || searchResult.data.items[0] || null;
  }, [searchResult, subjectId]);

  const detailPath = detailPathFromUrl || matchedItem?.detailPath || "";
  const itemData = matchedItem;
  const title = titleFromUrl || itemData?.title || "";
  const posterUrl = itemData ? getPosterUrl(itemData) : "";
  const ratingStr = itemData ? getRating(itemData) : "";
  const year = itemData ? getYear(itemData) : "";
  const genres = itemData ? getGenres(itemData) : [];
  const duration = itemData?.duration || 0;
  const country = itemData?.countryName || "";

  const { data: playData, isLoading: playLoading } = useQuery<PlayResponse>({
    queryKey: ["/api/wolflix/play", subjectId, detailPath],
    enabled: !!subjectId && !!detailPath,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/play?subjectId=${subjectId}&detailPath=${encodeURIComponent(detailPath)}`);
      if (!res.ok) throw new Error("Failed to load streams");
      return res.json();
    },
    retry: 1,
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

  const streams = playData?.data?.streams || [];
  const subtitles = playData?.data?.subtitles || [];
  const recommendedItems = recommendations?.data?.items || [];

  const sortedStreams = useMemo(() => {
    return [...streams].sort((a, b) => parseInt(b.resolutions) - parseInt(a.resolutions));
  }, [streams]);

  const selectedStream = sortedStreams[selectedStreamIdx];

  useEffect(() => {
    setSelectedStreamIdx(0);
  }, [subjectId]);

  return (
    <div className="min-h-screen bg-black">
      <div className="relative z-10 px-4 lg:px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-gray-400 flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg lg:text-xl font-display font-bold text-white truncate" data-testid="text-watch-title">
              {title || "Loading..."}
            </h1>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-500/20 font-mono text-xs flex-shrink-0">
            {type === "tv" ? <Tv className="w-3 h-3 mr-1" /> : <Film className="w-3 h-3 mr-1" />}
            {type === "tv" ? "TV Show" : "Movie"}
          </Badge>
        </div>

        <GlassPanel className="mb-4 p-0 overflow-hidden">
          {playLoading ? (
            <div className="w-full aspect-video bg-black flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-mono text-gray-400">Loading stream...</p>
              </div>
            </div>
          ) : selectedStream ? (
            <div className="relative w-full aspect-video bg-black">
              <video
                ref={videoRef}
                key={selectedStream.id}
                src={selectedStream.url}
                controls
                autoPlay
                className="absolute inset-0 w-full h-full"
                data-testid="video-player"
              >
                {subtitles.map((sub) => (
                  <track
                    key={sub.languageCode}
                    kind="subtitles"
                    src={sub.url}
                    srcLang={sub.languageCode}
                    label={sub.language}
                  />
                ))}
              </video>
            </div>
          ) : (
            <div className="w-full aspect-video bg-black flex items-center justify-center">
              <div className="text-center">
                <Play className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
                <p className="text-sm font-mono text-gray-500" data-testid="text-no-source">
                  {detailPath ? "No streaming source available" : "Loading content info..."}
                </p>
              </div>
            </div>
          )}
        </GlassPanel>

        {sortedStreams.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-mono text-gray-500 self-center mr-1">Quality:</span>
            {sortedStreams.map((stream, idx) => (
              <Button
                key={stream.id}
                size="sm"
                variant={selectedStreamIdx === idx ? "default" : "ghost"}
                onClick={() => setSelectedStreamIdx(idx)}
                className={`font-mono text-xs ${selectedStreamIdx === idx ? "bg-green-600 text-white" : "text-gray-400"}`}
                data-testid={`button-quality-${stream.resolutions}`}
              >
                {stream.resolutions}p
                {stream.size && ` (${formatFileSize(stream.size)})`}
              </Button>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 mt-4">
          {posterUrl && (
            <div className="flex-shrink-0 hidden lg:block">
              <GlassCard hover={false} className="overflow-hidden w-[200px]">
                <img src={posterUrl} alt={title} className="w-full rounded-[1rem]" data-testid="img-poster" />
              </GlassCard>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {ratingStr && (
                <span className="flex items-center gap-1 text-sm font-mono text-green-400" data-testid="text-rating">
                  <Star className="w-4 h-4 fill-green-400" />
                  {ratingStr}
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1 text-sm font-mono text-gray-400" data-testid="text-year">
                  <Calendar className="w-4 h-4" />
                  {year}
                </span>
              )}
              {duration > 0 && (
                <span className="flex items-center gap-1 text-sm font-mono text-gray-400" data-testid="text-runtime">
                  <Clock className="w-4 h-4" />
                  {formatDuration(duration)}
                </span>
              )}
              {country && (
                <span className="text-xs font-mono text-gray-500" data-testid="text-country">
                  {country}
                </span>
              )}
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {genres.map((g) => (
                  <Badge key={g} variant="outline" className="text-green-300 border-green-500/15 bg-green-500/10 font-mono" data-testid={`badge-genre-${g}`}>
                    {g}
                  </Badge>
                ))}
              </div>
            )}

            {itemData?.description && (
              <p className="text-sm text-gray-300 leading-relaxed max-w-2xl" data-testid="text-watch-overview">
                {itemData.description}
              </p>
            )}

            {sortedStreams.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-mono text-gray-500 mb-2">Direct Downloads</h3>
                <div className="space-y-2">
                  {sortedStreams.map((stream) => (
                    <a
                      key={stream.id}
                      href={stream.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-4 p-3 rounded-xl bg-black/40 border border-green-500/10 hover-elevate transition-colors"
                      data-testid={`link-download-${stream.resolutions}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-500/10 p-2">
                          <Play className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-mono text-white font-medium">{stream.resolutions}p {stream.format}</p>
                          <p className="text-xs font-mono text-gray-500">
                            {formatFileSize(stream.size)}
                            {stream.duration > 0 && ` / ${formatDuration(stream.duration)}`}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {recommendedItems.length > 0 && (
          <div className="mt-8 mb-8">
            <h3 className="text-lg font-display font-bold text-white mb-4">Recommended</h3>
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
