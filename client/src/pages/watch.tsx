import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, useSearch } from "wouter";
import { ArrowLeft, Star, Clock, Loader2, Play, Film, Tv, ChevronDown, AlertTriangle, RefreshCw, Monitor, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentCard } from "@/components/content-card";
import { type RecommendResponse, getMediaType } from "@/lib/tmdb";

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
  const type = params?.type || "movie";
  const subjectId = params?.id || "";

  const { titleFromUrl, detailPathFromUrl } = useMemo(() => {
    const raw = searchString || "";
    const fromWouter = new URLSearchParams(raw.startsWith("?") ? raw : "?" + raw);
    const fromWindow = new URLSearchParams(window.location.search);
    const title = fromWouter.get("title") || fromWindow.get("title") || "";
    const detailPath = fromWouter.get("detailPath") || fromWindow.get("detailPath") || "";
    return { titleFromUrl: title, detailPathFromUrl: detailPath };
  }, [searchString]);

  const [selectedProviderIdx, setSelectedProviderIdx] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [iframeKey, setIframeKey] = useState(0);

  const { data: richDetail } = useQuery<RichDetailResponse>({
    queryKey: ["/api/wolflix/rich-detail", detailPathFromUrl],
    enabled: !!detailPathFromUrl,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/rich-detail?detailPath=${encodeURIComponent(detailPathFromUrl)}`);
      if (!res.ok) return { code: 200, success: false, data: {} };
      return res.json();
    },
  });

  const { data: basicDetail } = useQuery<any>({
    queryKey: ["/api/wolflix/detail", subjectId],
    enabled: !!subjectId && !titleFromUrl && !detailPathFromUrl,
    queryFn: async () => {
      const res = await fetch(`/api/wolflix/detail?subjectId=${subjectId}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const basicSubject = basicDetail?.data?.subject || basicDetail?.data || {};
  const detail = richDetail?.data || basicSubject;
  const resolvedTitle = titleFromUrl || detail?.title?.replace(/\[.*?\]/g, "").trim() || "";

  const { data: showboxData, isLoading: showboxLoading, error: showboxError, isFetched: showboxFetched } = useQuery<ShowBoxResolveResponse>({
    queryKey: ["/api/wolflix/showbox/resolve", resolvedTitle, type, selectedSeason, selectedEpisode],
    enabled: !!resolvedTitle,
    queryFn: async () => {
      let url = `/api/wolflix/showbox/resolve?title=${encodeURIComponent(resolvedTitle)}&type=${type}`;
      if (type === "tv") {
        url += `&season=${selectedSeason}&episode=${selectedEpisode}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Stream lookup failed");
      }
      return res.json();
    },
    retry: 1,
    retryDelay: 2000,
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
  const recommendedItems = recommendations?.data?.items || [];

  const title = resolvedTitle;
  const coverUrl = detail?.cover?.url || "";
  const rating = detail?.imdbRatingValue || "";
  const genres = (detail?.genre || "").split(",").map((g: string) => g.trim()).filter(Boolean);
  const description = detail?.description || "";
  const cast = detail?.staffList || [];
  const seasons: RichDetailSeason[] = detail?.seasons || [];
  const episodeList: RichDetailEpisode[] = detail?.episodeList || [];

  const selectedProvider = showboxLinks[selectedProviderIdx];

  useEffect(() => {
    setSelectedProviderIdx(0);
    setIframeKey(0);
  }, [subjectId]);

  const isTV = type === "tv";
  const availableSeasons = seasons.length > 0
    ? seasons.map((s: RichDetailSeason) => s.seasonNumber)
    : episodeList.length > 0
      ? [1]
      : Array.from({ length: 10 }, (_, i) => i + 1);

  const currentSeasonEpisodes = seasons.find((s: RichDetailSeason) => s.seasonNumber === selectedSeason)?.episodes
    || (selectedSeason === 1 ? episodeList : []);

  const retryProvider = useCallback(() => {
    setIframeKey(prev => prev + 1);
  }, []);

  const tryNextProvider = useCallback(() => {
    if (showboxLinks.length > 1) {
      setSelectedProviderIdx(prev => (prev + 1) % showboxLinks.length);
      setIframeKey(prev => prev + 1);
    }
  }, [showboxLinks.length]);

  return (
    <div className="min-h-screen bg-black">
      <div className="relative w-full" style={{ height: "calc(100vh - 49px)" }}>
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/80 to-transparent gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white/80 flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-sm lg:text-base font-display font-bold text-white truncate" data-testid="text-watch-title">
              {title || ((showboxLoading || !resolvedTitle) ? "Loading..." : "Untitled")}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isTV && selectedProvider && (
              <span className="text-xs font-mono text-green-400/80">
                S{selectedSeason}:E{selectedEpisode}
              </span>
            )}
            <Badge variant="outline" className="text-green-400 border-green-500/20 font-mono text-xs">
              {isTV ? <Tv className="w-3 h-3 mr-1" /> : <Film className="w-3 h-3 mr-1" />}
              {isTV ? "TV" : "Movie"}
            </Badge>
          </div>
        </div>

        {(showboxLoading || (!resolvedTitle && !!subjectId)) ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-mono text-gray-400">
                {!resolvedTitle ? "Loading content info..." : "Finding stream sources..."}
              </p>
              <p className="text-xs font-mono text-gray-600 mt-1">
                This may take 10-15 seconds
              </p>
            </div>
          </div>
        ) : selectedProvider ? (
          <iframe
            key={`${selectedProvider.url}-${iframeKey}`}
            src={`/api/wolflix/player?url=${encodeURIComponent(selectedProvider.url)}`}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope"
            data-testid="iframe-player"
          />
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              {showboxError ? (
                <>
                  <AlertTriangle className="w-10 h-10 text-red-500/40 mx-auto mb-3" />
                  <p className="text-sm font-mono text-red-400 mb-1" data-testid="text-stream-error">
                    Could not find stream sources
                  </p>
                  <p className="text-xs font-mono text-gray-500 mb-4">
                    This title may not be available yet. Try refreshing or come back later.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-green-400 font-mono"
                    data-testid="button-retry"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </>
              ) : (
                <>
                  <Play className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
                  <p className="text-sm font-mono text-gray-500 mb-4" data-testid="text-no-source">
                    No streaming source found for this title
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-green-400 font-mono"
                    data-testid="button-retry"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {showboxLinks.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 py-3">
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {showboxLinks.map((link: ShowBoxLink, idx: number) => (
                <button
                  key={link.provider + idx}
                  onClick={() => { setSelectedProviderIdx(idx); setIframeKey(prev => prev + 1); }}
                  className={`flex-shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${selectedProviderIdx === idx ? "bg-green-500 text-black font-bold" : "bg-white/10 text-white/70 backdrop-blur-sm"}`}
                  data-testid={`button-provider-${link.provider}`}
                >
                  {link.provider}
                </button>
              ))}
              <button
                onClick={retryProvider}
                className="flex-shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs bg-white/10 text-white/70 backdrop-blur-sm flex items-center gap-1"
                data-testid="button-reload-player"
              >
                <RefreshCw className="w-3 h-3" /> Reload
              </button>
              {selectedProvider && (
                <a
                  href={selectedProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs bg-white/10 text-white/70 backdrop-blur-sm flex items-center gap-1"
                  data-testid="link-open-current-provider"
                >
                  <ExternalLink className="w-3 h-3" /> New Tab
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {isTV && (
        <div className="px-4 py-3 bg-black/95 border-t border-green-500/10">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="relative flex-shrink-0">
              <select
                value={selectedSeason}
                onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); }}
                className="appearance-none rounded-lg border border-green-500/20 bg-black/40 px-3 py-1.5 pr-7 font-mono text-xs text-white focus:outline-none focus:border-green-500/40"
                data-testid="select-season"
              >
                {availableSeasons.map((s: number) => (
                  <option key={s} value={s}>Season {s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-green-500/50 pointer-events-none" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
              {currentSeasonEpisodes.length > 0
                ? currentSeasonEpisodes.map((ep: RichDetailEpisode) => (
                    <button
                      key={ep.episodeNumber}
                      onClick={() => setSelectedEpisode(ep.episodeNumber)}
                      className={`flex-shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${selectedEpisode === ep.episodeNumber ? "bg-green-500 text-black font-bold" : "border border-green-500/15 text-gray-400"}`}
                      data-testid={`button-episode-${ep.episodeNumber}`}
                    >
                      E{ep.episodeNumber}
                    </button>
                  ))
                : Array.from({ length: 20 }, (_, i) => i + 1).map((ep: number) => (
                    <button
                      key={ep}
                      onClick={() => setSelectedEpisode(ep)}
                      className={`flex-shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${selectedEpisode === ep ? "bg-green-500 text-black font-bold" : "border border-green-500/15 text-gray-400"}`}
                      data-testid={`button-episode-${ep}`}
                    >
                      E{ep}
                    </button>
                  ))
              }
            </div>
          </div>
        </div>
      )}

      <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {coverUrl && (
            <div className="flex-shrink-0 hidden lg:block">
              <img src={coverUrl} alt={title} className="w-[180px] rounded-xl" data-testid="img-poster" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-white mb-2">{title}</h2>
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
                {genres.map((g: string) => (
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
                <span className="text-xs font-mono text-gray-500">Cast: </span>
                <span className="text-xs text-gray-400">{cast.slice(0, 6).map((c: any) => c.name).join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        {recommendedItems.length > 0 && (
          <div className="mt-8 mb-8">
            <h2 className="text-lg font-display font-bold text-white mb-4" data-testid="text-recommendations-heading">
              You might also like
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {recommendedItems.slice(0, 16).map((item: any) => (
                <ContentCard key={item.subjectId} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
