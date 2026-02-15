import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, useSearch } from "wouter";
import { ArrowLeft, Star, Clock, Loader2, Play, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { ContentCard } from "@/components/content-card";
import { type RecommendResponse, getMediaType } from "@/lib/tmdb";

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
    title?: string;
    genre?: string;
    imdbRating?: string;
    cover?: string;
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
  const searchString = useSearch();
  const queryParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const type = params?.type || "movie";
  const subjectId = params?.id || "";

  const titleFromUrl = queryParams.get("title") || "";
  const detailPathFromUrl = queryParams.get("detailPath") || "";

  const [selectedStreamIdx, setSelectedStreamIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playUrl = useMemo(() => {
    let url = `/api/wolflix/play?subjectId=${subjectId}`;
    if (detailPathFromUrl) url += `&detailPath=${encodeURIComponent(detailPathFromUrl)}`;
    if (titleFromUrl) url += `&title=${encodeURIComponent(titleFromUrl)}`;
    return url;
  }, [subjectId, detailPathFromUrl, titleFromUrl]);

  const { data: playData, isLoading: playLoading, error: playError } = useQuery<PlayResponse>({
    queryKey: ["/api/wolflix/play", subjectId, detailPathFromUrl, titleFromUrl],
    enabled: !!subjectId,
    queryFn: async () => {
      const res = await fetch(playUrl);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load streams");
      }
      return res.json();
    },
    retry: 2,
    retryDelay: 1000,
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

  const title = titleFromUrl || playData?.data?.title || "";
  const coverUrl = playData?.data?.cover || "";
  const rating = playData?.data?.imdbRating || "";
  const genres = playData?.data?.genre ? playData.data.genre.split(",").map(g => g.trim()) : [];
  const duration = streams[0]?.duration || 0;

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
              {title || (playLoading ? "Loading..." : "Untitled")}
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
                playsInline
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
                {playError ? (
                  <>
                    <Play className="w-10 h-10 text-red-500/40 mx-auto mb-3" />
                    <p className="text-sm font-mono text-red-400" data-testid="text-stream-error">
                      {(playError as Error).message || "Failed to load stream"}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="mt-3 text-green-400 font-mono"
                      data-testid="button-retry"
                    >
                      Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <Play className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
                    <p className="text-sm font-mono text-gray-500" data-testid="text-no-source">
                      No streaming source available
                    </p>
                  </>
                )}
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
          {coverUrl && (
            <div className="flex-shrink-0 hidden lg:block">
              <GlassCard hover={false} className="overflow-hidden w-[200px]">
                <img src={coverUrl} alt={title} className="w-full rounded-[1rem]" data-testid="img-poster" />
              </GlassCard>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {rating && (
                <span className="flex items-center gap-1 text-sm font-mono text-green-400" data-testid="text-rating">
                  <Star className="w-4 h-4 fill-green-400" />
                  {rating}
                </span>
              )}
              {duration > 0 && (
                <span className="flex items-center gap-1 text-sm font-mono text-gray-400" data-testid="text-runtime">
                  <Clock className="w-4 h-4" />
                  {formatDuration(duration)}
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

            {sortedStreams.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-mono text-gray-500 mb-2">Available Streams</h3>
                <div className="space-y-2">
                  {sortedStreams.map((stream, idx) => (
                    <button
                      key={stream.id}
                      onClick={() => setSelectedStreamIdx(idx)}
                      className={`flex items-center justify-between gap-4 p-3 rounded-xl w-full text-left transition-colors ${selectedStreamIdx === idx ? "bg-green-500/15 border border-green-500/30" : "bg-black/40 border border-green-500/10 hover-elevate"}`}
                      data-testid={`button-stream-${stream.resolutions}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${selectedStreamIdx === idx ? "bg-green-500/20" : "bg-green-500/10"}`}>
                          <Play className={`w-4 h-4 ${selectedStreamIdx === idx ? "text-green-400" : "text-green-500/50"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-mono text-white font-medium">{stream.resolutions}p {stream.format}</p>
                          <p className="text-xs font-mono text-gray-500">
                            {formatFileSize(stream.size)}
                            {stream.duration > 0 && ` / ${formatDuration(stream.duration)}`}
                          </p>
                        </div>
                      </div>
                      {selectedStreamIdx === idx && (
                        <Badge variant="outline" className="text-green-400 border-green-500/30 font-mono text-xs">
                          Playing
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {subtitles.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-mono text-gray-500 mb-2">Subtitles ({subtitles.length} languages)</h3>
                <div className="flex flex-wrap gap-2">
                  {subtitles.map((sub) => (
                    <Badge key={sub.languageCode} variant="outline" className="text-gray-400 border-green-500/10 font-mono text-xs">
                      {sub.language}
                    </Badge>
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
