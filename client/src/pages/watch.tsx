import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, useSearch } from "wouter";
import { ArrowLeft, Star, Clock, Loader2, Play, Film, Tv, ChevronDown, AlertTriangle, RefreshCw, Monitor, Layers, ExternalLink } from "lucide-react";
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

interface ShowBoxLink {
  provider: string;
  url: string;
  quality: string;
}

interface ShowBoxResolveResponse {
  success: boolean;
  showboxId?: number;
  title?: string;
  links: ShowBoxLink[];
  imdbId?: string;
  error?: string;
}

interface RichDetailEpisode {
  episodeId: string;
  episodeNumber: number;
  title: string;
  releaseDate?: string;
}

interface RichDetailSeason {
  seasonNumber: number;
  episodes: RichDetailEpisode[];
}

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
    seasons?: RichDetailSeason[];
    episodeList?: RichDetailEpisode[];
    subjectType?: number;
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

type StreamSource = "showbox" | "native" | "none";

export default function Watch() {
  const [, params] = useRoute("/watch/:type/:id");
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const queryParams = useMemo(() => {
    const raw = searchString || window.location.search.replace(/^\?/, "");
    return new URLSearchParams(raw);
  }, [searchString]);
  const type = params?.type || "movie";
  const subjectId = params?.id || "";

  const titleFromUrl = queryParams.get("title") || "";
  const detailPathFromUrl = queryParams.get("detailPath") || "";

  const [selectedStreamIdx, setSelectedStreamIdx] = useState(0);
  const [selectedProviderIdx, setSelectedProviderIdx] = useState(0);
  const [activeSource, setActiveSource] = useState<StreamSource>("showbox");
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [showProviders, setShowProviders] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: richDetail, isLoading: detailLoading } = useQuery<RichDetailResponse>({
    queryKey: ["/api/wolflix/rich-detail", detailPathFromUrl],
    enabled: !!detailPathFromUrl,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/rich-detail?detailPath=${encodeURIComponent(detailPathFromUrl)}`);
      if (!res.ok) return { code: 200, success: false, data: {} };
      return res.json();
    },
  });

  const { data: showboxData, isLoading: showboxLoading, error: showboxError, isFetched: showboxFetched } = useQuery<ShowBoxResolveResponse>({
    queryKey: ["/api/wolflix/showbox/resolve", titleFromUrl, type, selectedSeason, selectedEpisode],
    enabled: !!titleFromUrl,
    queryFn: async () => {
      let url = `/api/wolflix/showbox/resolve?title=${encodeURIComponent(titleFromUrl)}&type=${type}`;
      if (type === "tv") {
        url += `&season=${selectedSeason}&episode=${selectedEpisode}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "ShowBox lookup failed");
      }
      return res.json();
    },
    retry: 1,
    retryDelay: 2000,
  });

  const playUrl = useMemo(() => {
    let url = `/api/wolflix/play?subjectId=${subjectId}`;
    if (detailPathFromUrl) url += `&detailPath=${encodeURIComponent(detailPathFromUrl)}`;
    if (titleFromUrl) url += `&title=${encodeURIComponent(titleFromUrl)}`;
    if (type === "tv") {
      url += `&season=${selectedSeason}&ep=${selectedEpisode}`;
    }
    return url;
  }, [subjectId, detailPathFromUrl, titleFromUrl, type, selectedSeason, selectedEpisode]);

  const { data: playData, isLoading: playLoading, error: playError } = useQuery<PlayResponse>({
    queryKey: ["/api/wolflix/play", subjectId, detailPathFromUrl, titleFromUrl, selectedSeason, selectedEpisode],
    enabled: !!subjectId && activeSource === "native",
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

  const showboxLinks = showboxData?.links || [];
  const streams = playData?.data?.streams || [];
  const subtitles = playData?.data?.subtitles || [];
  const recommendedItems = recommendations?.data?.items || [];

  const detail = richDetail?.data;
  const title = titleFromUrl || detail?.title || playData?.data?.title || "";
  const coverUrl = detail?.cover?.url || playData?.data?.cover || "";
  const rating = detail?.imdbRatingValue || playData?.data?.imdbRating || "";
  const genres = (detail?.genre || playData?.data?.genre || "").split(",").map(g => g.trim()).filter(Boolean);
  const description = detail?.description || "";
  const cast = detail?.staffList || [];
  const seasons = detail?.seasons || [];
  const episodeList = detail?.episodeList || [];

  const sortedStreams = useMemo(() => {
    return [...streams].sort((a, b) => parseInt(b.resolutions) - parseInt(a.resolutions));
  }, [streams]);

  const selectedStream = sortedStreams[selectedStreamIdx];
  const selectedProvider = showboxLinks[selectedProviderIdx];

  useEffect(() => {
    setSelectedStreamIdx(0);
    setSelectedProviderIdx(0);
    setActiveSource("showbox");
  }, [subjectId]);

  useEffect(() => {
    if (showboxFetched && !showboxLoading && showboxLinks.length === 0) {
      setActiveSource("native");
    }
  }, [showboxFetched, showboxLoading, showboxLinks.length]);

  const switchToNative = useCallback(() => {
    setActiveSource("native");
  }, []);

  const switchToShowbox = useCallback(() => {
    if (showboxLinks.length > 0) {
      setActiveSource("showbox");
    }
  }, [showboxLinks.length]);

  const isTV = type === "tv";
  const availableSeasons = seasons.length > 0
    ? seasons.map(s => s.seasonNumber)
    : episodeList.length > 0
      ? [1]
      : Array.from({ length: 10 }, (_, i) => i + 1);

  const currentSeasonEpisodes = seasons.find(s => s.seasonNumber === selectedSeason)?.episodes
    || (selectedSeason === 1 ? episodeList : []);

  const isLoading = activeSource === "showbox" ? showboxLoading : playLoading;
  const hasError = activeSource === "showbox" ? !!showboxError : !!playError;

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
              {title || (isLoading ? "Loading..." : "Untitled")}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {showboxLinks.length > 0 && (
              <div className="flex rounded-lg overflow-hidden border border-green-500/20">
                <button
                  onClick={switchToShowbox}
                  className={`px-3 py-1.5 text-xs font-mono transition-colors ${activeSource === "showbox" ? "bg-green-500/20 text-green-400" : "text-gray-500"}`}
                  data-testid="button-source-showbox"
                >
                  <Monitor className="w-3 h-3 inline mr-1" />
                  Embed
                </button>
                <button
                  onClick={switchToNative}
                  className={`px-3 py-1.5 text-xs font-mono transition-colors ${activeSource === "native" ? "bg-green-500/20 text-green-400" : "text-gray-500"}`}
                  data-testid="button-source-native"
                >
                  <Layers className="w-3 h-3 inline mr-1" />
                  Direct
                </button>
              </div>
            )}
            <Badge variant="outline" className="text-green-400 border-green-500/20 font-mono text-xs">
              {isTV ? <Tv className="w-3 h-3 mr-1" /> : <Film className="w-3 h-3 mr-1" />}
              {isTV ? "TV Show" : "Movie"}
            </Badge>
          </div>
        </div>

        {isTV && (
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative">
              <select
                value={selectedSeason}
                onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); }}
                className="appearance-none rounded-xl border border-green-500/20 bg-black/40 px-4 py-2 pr-8 font-mono text-sm text-white focus:outline-none focus:border-green-500/40"
                data-testid="select-season"
              >
                {availableSeasons.map((s) => (
                  <option key={s} value={s}>Season {s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/50 pointer-events-none" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {currentSeasonEpisodes.length > 0
                ? currentSeasonEpisodes.map((ep) => (
                    <button
                      key={ep.episodeNumber}
                      onClick={() => setSelectedEpisode(ep.episodeNumber)}
                      className={`flex-shrink-0 rounded-xl px-4 py-2 font-mono text-sm transition-colors ${selectedEpisode === ep.episodeNumber ? "bg-green-500/20 text-green-400 border border-green-500/30" : "border border-green-500/10 text-gray-400"}`}
                      data-testid={`button-episode-${ep.episodeNumber}`}
                    >
                      Ep {ep.episodeNumber}
                    </button>
                  ))
                : Array.from({ length: 20 }, (_, i) => i + 1).map((ep) => (
                    <button
                      key={ep}
                      onClick={() => setSelectedEpisode(ep)}
                      className={`flex-shrink-0 rounded-xl px-4 py-2 font-mono text-sm transition-colors ${selectedEpisode === ep ? "bg-green-500/20 text-green-400 border border-green-500/30" : "border border-green-500/10 text-gray-400"}`}
                      data-testid={`button-episode-${ep}`}
                    >
                      Ep {ep}
                    </button>
                  ))
              }
            </div>
          </div>
        )}

        <GlassPanel className="mb-4 p-0 overflow-hidden">
          {isLoading ? (
            <div className="w-full aspect-video bg-black flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-mono text-gray-400">
                  {activeSource === "showbox" ? "Finding stream sources..." : "Loading stream..."}
                </p>
              </div>
            </div>
          ) : activeSource === "showbox" && selectedProvider ? (
            <div className="relative w-full aspect-video bg-black group">
              <iframe
                key={selectedProvider.url}
                src={selectedProvider.url}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope"
                referrerPolicy="origin"
                data-testid="iframe-player"
              />
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <a
                  href={selectedProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm text-green-400 text-xs font-mono px-3 py-1.5 rounded-lg border border-green-500/30"
                  data-testid="link-open-new-tab"
                >
                  <ExternalLink className="w-3 h-3" /> Open Player
                </a>
              </div>
            </div>
          ) : activeSource === "native" && selectedStream ? (
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
              <div className="text-center max-w-md px-6">
                {hasError ? (
                  <>
                    <AlertTriangle className="w-10 h-10 text-red-500/40 mx-auto mb-3" />
                    <p className="text-sm font-mono text-red-400 mb-1" data-testid="text-stream-error">
                      Stream temporarily unavailable
                    </p>
                    <p className="text-xs font-mono text-gray-500 mb-4">
                      The streaming source could not be reached. Try switching sources or refreshing.
                    </p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="text-green-400 font-mono"
                        data-testid="button-retry"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Retry
                      </Button>
                      {activeSource === "showbox" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={switchToNative}
                          className="text-green-400 font-mono"
                          data-testid="button-try-native"
                        >
                          Try Direct Player
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Play className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
                    <p className="text-sm font-mono text-gray-500 mb-4" data-testid="text-no-source">
                      No streaming source available for this title
                    </p>
                    {activeSource !== "native" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={switchToNative}
                        className="text-green-400 font-mono"
                        data-testid="button-try-native-fallback"
                      >
                        Try Direct Player
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </GlassPanel>

        {activeSource === "showbox" && showboxLinks.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowProviders(!showProviders)}
                className="flex items-center gap-2 text-xs font-mono text-gray-500"
                data-testid="button-toggle-providers"
              >
                <Monitor className="w-3 h-3" />
                {showProviders ? "Hide" : "Show"} providers ({showboxLinks.length})
                <ChevronDown className={`w-3 h-3 transition-transform ${showProviders ? "rotate-180" : ""}`} />
              </button>
              {selectedProvider && (
                <a
                  href={selectedProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-mono text-green-400 hover:text-green-300"
                  data-testid="link-open-current-provider"
                >
                  <ExternalLink className="w-3 h-3" /> Open in New Tab
                </a>
              )}
            </div>
            {showProviders && (
              <div className="flex flex-wrap gap-2">
                {showboxLinks.map((link, idx) => (
                  <div key={link.provider + idx} className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={selectedProviderIdx === idx ? "default" : "ghost"}
                      onClick={() => setSelectedProviderIdx(idx)}
                      className={`font-mono text-xs ${selectedProviderIdx === idx ? "bg-green-600 text-white" : "text-gray-400"}`}
                      data-testid={`button-provider-${link.provider}`}
                    >
                      {link.provider}
                      {link.quality && link.quality !== "Auto" && ` (${link.quality})`}
                    </Button>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-green-400 p-1"
                      title={`Open ${link.provider} in new tab`}
                      data-testid={`link-provider-newtab-${link.provider}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSource === "native" && sortedStreams.length > 1 && (
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
              {detail?.duration && detail.duration > 0 && (
                <span className="flex items-center gap-1 text-sm font-mono text-gray-400" data-testid="text-runtime">
                  <Clock className="w-4 h-4" />
                  {formatDuration(detail.duration)}
                </span>
              )}
              {detail?.countryName && (
                <span className="text-sm font-mono text-gray-500" data-testid="text-country">
                  {detail.countryName}
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

            {description && (
              <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-4" data-testid="text-description">
                {description}
              </p>
            )}

            {cast.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-mono text-gray-500 mb-2">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {cast.slice(0, 8).map((person) => (
                    <Badge key={person.name} variant="outline" className="text-gray-400 border-green-500/10 font-mono text-xs">
                      {person.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {activeSource === "native" && sortedStreams.length > 0 && (
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

            {subtitles.length > 0 && activeSource === "native" && (
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
