import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Download, ArrowLeft, Star, Calendar, Clock, Search, Maximize, Minimize, ChevronDown, SkipBack, SkipForward, Tv2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { type BWMDetail, getRating, getPosterUrl } from "@/lib/tmdb";

const EMBED_SOURCES = [
  { name: "Server 1 (Fast)", buildUrl: (id: string, type: string, s: number, e: number) => type === "tv" ? `https://multiembed.mov/?video_id=${id}&s=${s}&e=${e}` : `https://multiembed.mov/?video_id=${id}` },
  { name: "Server 2 (HLS)", buildUrl: (id: string, type: string, s: number, e: number) => type === "tv" ? `https://multiembed.mov/directstream.php?video_id=${id}&s=${s}&e=${e}` : `https://multiembed.mov/directstream.php?video_id=${id}` },
  { name: "Server 3", buildUrl: (id: string, type: string, s: number, e: number) => type === "tv" ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` : `https://player.autoembed.cc/embed/movie/${id}` },
  { name: "Server 4", buildUrl: (id: string, type: string, s: number, e: number) => type === "tv" ? `https://vidsrc.cc/v3/embed/tv/${id}/${s}/${e}` : `https://vidsrc.cc/v3/embed/movie/${id}` },
];

export default function Watch() {
  const [, params] = useRoute("/watch/:type/:id");
  const [, navigate] = useLocation();
  const type = params?.type || "movie";
  const id = params?.id || "";

  const urlParams = new URLSearchParams(window.location.search);
  const zoneTitle = urlParams.get("title") || "";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  const prevIdRef = useRef(id);

  useEffect(() => {
    if (prevIdRef.current !== id) {
      prevIdRef.current = id;
      setSeason(1);
      setEpisode(1);
      setRenderCount(0);
      setShowDownloads(false);
    }
  }, [id]);

  const playerUrl = useMemo(() => {
    if (!id) return "";
    return EMBED_SOURCES[sourceIndex].buildUrl(id, type, season, episode);
  }, [id, type, season, episode, sourceIndex]);

  const scrollToPlayer = useCallback(() => {
    setTimeout(() => {
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const { data: bwmDetail, isLoading: detailLoading } = useQuery<BWMDetail>({
    queryKey: ["/api/silentwolf/title", id],
    enabled: !!id && id.startsWith("tt"),
    retry: 1,
    retryDelay: 1000,
    staleTime: 10 * 60 * 1000,
  });

  const title = zoneTitle || bwmDetail?.primaryTitle || id;
  const posterUrl = bwmDetail?.primaryImage?.url || "";
  const rating = bwmDetail?.rating?.aggregateRating || 0;
  const year = bwmDetail?.startYear ? String(bwmDetail.startYear) : "";
  const description = bwmDetail?.plot || "";
  const duration = bwmDetail?.runtime || 0;
  const genres = bwmDetail?.genres || [];
  const seasonCount = bwmDetail?.totalSeasons || 0;
  const totalEpisodes = bwmDetail?.totalEpisodes || 0;
  const seasons = bwmDetail?.seasons || [];

  const currentSeasonData = seasons.find(s => s.seasonNumber === season);
  const episodeCount = currentSeasonData?.episodeCount || 0;

  useEffect(() => {
    if (episodeCount > 0 && episode > episodeCount) {
      setEpisode(episodeCount);
    }
  }, [episodeCount, episode]);

  const isFirstEpisode = season <= 1 && episode <= 1;
  const isLastEpisode = season >= seasonCount && episode >= episodeCount;

  const goTo = useCallback((newSeason: number, newEpisode: number) => {
    setSeason(newSeason);
    setEpisode(newEpisode);
    setRenderCount(c => c + 1);
    scrollToPlayer();
  }, [scrollToPlayer]);

  const goPrev = useCallback(() => {
    if (episode > 1) {
      goTo(season, episode - 1);
    } else if (season > 1) {
      const prevSeasonData = seasons.find(s => s.seasonNumber === season - 1);
      const prevEpCount = prevSeasonData?.episodeCount || 1;
      goTo(season - 1, prevEpCount);
    }
  }, [episode, season, goTo, seasons]);

  const goNext = useCallback(() => {
    if (episodeCount > 0 && episode < episodeCount) {
      goTo(season, episode + 1);
    } else if (season < seasonCount) {
      goTo(season + 1, 1);
    }
  }, [episode, episodeCount, season, seasonCount, goTo]);

  useEffect(() => {
    if (type !== "tv") return;
    const onMessage = (event: MessageEvent) => {
      try {
        const d = event.data;
        if (d === "ended" || d?.type === "ended" || d?.event === "ended" || d?.event === "video_end" || d?.event === "complete") {
          goNext();
        }
      } catch {}
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [type, goNext]);

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
              {zoneTitle || bwmDetail?.primaryTitle || "Loading..."}
            </h1>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {type === "tv" && (
              <span className="text-sm font-mono text-green-400 mr-2" data-testid="text-current-playing">
                S{season}E{episode}
              </span>
            )}
          </div>
        </div>

        <div ref={playerSectionRef}>
          <div className="flex items-center justify-between gap-3 mb-2 px-1 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {type === "tv" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goPrev}
                    disabled={isFirstEpisode}
                    className="border-green-500/30 text-green-400 font-mono gap-1"
                    data-testid="button-prev-episode"
                  >
                    <SkipBack className="w-4 h-4" />
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goNext}
                    disabled={isLastEpisode}
                    className="border-green-500/30 text-green-400 font-mono gap-1"
                    data-testid="button-next-episode"
                  >
                    Next
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDownloads(!showDownloads)}
                className="text-green-400 font-mono text-xs"
                data-testid="button-toggle-downloads"
              >
                <Download className="w-4 h-4 mr-1" />
                Downloads
                <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showDownloads ? "rotate-180" : ""}`} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleFullscreen}
                className="text-white"
                data-testid="button-fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <GlassPanel className="mb-2 p-0 overflow-hidden">
            {!playerUrl ? (
              <div className="w-full aspect-video bg-black flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
                  <p className="text-sm font-mono text-gray-500" data-testid="text-no-source">
                    No streaming source found for this title
                  </p>
                </div>
              </div>
            ) : (
              <div ref={playerContainerRef} className="relative w-full aspect-video bg-black">
                <iframe
                  key={`player-${sourceIndex}-${season}-${episode}-${renderCount}`}
                  src={playerUrl}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  data-testid="iframe-player"
                />
              </div>
            )}
          </GlassPanel>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-mono text-gray-500 mr-1">Source:</span>
            {EMBED_SOURCES.map((source, idx) => (
              <Button
                key={idx}
                size="sm"
                variant={idx === sourceIndex ? "default" : "outline"}
                onClick={() => { setSourceIndex(idx); setRenderCount(c => c + 1); }}
                className={idx === sourceIndex ? "bg-green-600 text-black font-mono text-xs" : "border-green-500/30 text-green-400 font-mono text-xs"}
                data-testid={`button-source-${idx}`}
              >
                {source.name}
              </Button>
            ))}
          </div>
        </div>

        {showDownloads && (
          <GlassPanel className="mb-4">
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-4" data-testid="text-download-heading">
              <Download className="w-5 h-5 text-green-400" />
              Downloads
            </h2>
            <DownloadSection title={title} />
          </GlassPanel>
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
            {detailLoading && id.startsWith("tt") ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                <span className="text-xs font-mono text-gray-400">Loading details...</span>
              </div>
            ) : bwmDetail ? (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {rating > 0 && (
                    <span className="flex items-center gap-1 text-sm font-mono text-green-400" data-testid="text-rating">
                      <Star className="w-4 h-4 fill-green-400" />
                      {rating.toFixed(1)}
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
                      {duration} min
                    </span>
                  )}
                  {seasonCount > 0 && (
                    <span className="text-xs font-mono text-gray-500" data-testid="text-seasons">
                      {seasonCount}S / {totalEpisodes}E
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
                  <p className="text-sm text-gray-300 leading-relaxed max-w-2xl" data-testid="text-watch-overview">
                    {description}
                  </p>
                )}
              </>
            ) : null}
          </div>
        </div>

        {type === "tv" && seasonCount > 0 && (
          <GlassPanel className="mt-6 mb-8">
            <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2" data-testid="text-season-selector">
              <Tv2 className="w-5 h-5 text-green-400" />
              Seasons & Episodes
            </h3>

            <div className="mb-4">
              <div className="flex gap-2 flex-wrap">
                {seasons.map((s) => (
                  <Button
                    key={s.seasonNumber}
                    size="sm"
                    variant={season === s.seasonNumber ? "default" : "ghost"}
                    onClick={() => goTo(s.seasonNumber, 1)}
                    className={`font-mono text-xs ${season === s.seasonNumber ? "bg-green-600 text-white" : "text-gray-400"}`}
                    data-testid={`button-season-${s.seasonNumber}`}
                  >
                    Season {s.seasonNumber} ({s.episodeCount} ep)
                  </Button>
                ))}
              </div>
            </div>

            {episodeCount > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-xs font-mono text-gray-400">
                    {episodeCount} Episodes
                  </span>
                  <span className="text-xs font-mono text-green-400">
                    Playing: S{season}E{episode}
                  </span>
                </div>
                <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map((epNum) => {
                    const isActive = episode === epNum;
                    return (
                      <button
                        key={`s${season}-e${epNum}`}
                        onClick={() => goTo(season, epNum)}
                        className={`flex items-center gap-3 p-3 rounded-md text-left transition-all ${
                          isActive
                            ? "bg-green-500/20 border border-green-500/40 shadow-lg shadow-green-500/10"
                            : "bg-black/30 border border-green-500/5 hover:border-green-500/20 hover:bg-green-500/5"
                        }`}
                        data-testid={`button-episode-${epNum}`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center font-mono text-sm font-bold ${
                          isActive
                            ? "bg-green-500 text-black"
                            : "bg-green-500/10 text-green-400"
                        }`}>
                          {epNum}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-mono font-medium ${
                            isActive ? "text-green-300" : "text-white"
                          }`}>
                            Episode {epNum}
                          </p>
                        </div>
                        {isActive && (
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[10px] font-mono text-green-400">PLAYING</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </GlassPanel>
        )}
      </div>
    </div>
  );
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function DownloadSection({ title }: { title: string }) {
  const { data: arslanSearch, isLoading: arslanLoading } = useQuery<{ results?: { title: string; url: string }[] }>({
    queryKey: ["/api/silentwolf/download/search", title],
    queryFn: async () => {
      const res = await fetch(`/api/silentwolf/download/search?text=${encodeURIComponent(title)}`);
      if (!res.ok) return { results: [] };
      return res.json();
    },
    enabled: !!title && title.length > 1,
  });

  const firstResult = arslanSearch?.results?.[0];

  const { data: arslanMovie, isLoading: arslanMovieLoading } = useQuery<{ title?: string; links?: { quality: string; size: string; url: string }[] }>({
    queryKey: ["/api/silentwolf/download/movie", firstResult?.url],
    queryFn: async () => {
      const res = await fetch(`/api/silentwolf/download/movie?url=${encodeURIComponent(firstResult!.url)}`);
      if (!res.ok) return { links: [] };
      return res.json();
    },
    enabled: !!firstResult?.url,
  });

  const downloadLinks = arslanMovie?.links || [];
  const isLoading = arslanLoading || arslanMovieLoading;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
        <span className="text-sm font-mono text-gray-400" data-testid="text-searching-downloads">Searching for download links...</span>
      </div>
    );
  }

  if (downloadLinks.length === 0) {
    return (
      <div className="text-center py-8">
        <Download className="w-8 h-8 text-green-500/20 mx-auto mb-3" />
        <p className="text-sm font-mono text-gray-500" data-testid="text-no-downloads">No download links found</p>
        <p className="text-xs font-mono text-gray-600 mt-1">Downloads may not be available for this title</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {downloadLinks.map((dl, i) => {
        const decodedUrl = decodeHtmlEntities(dl.url);
        return (
          <a
            key={i}
            href={decodedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-green-500/10 hover-elevate transition-colors"
            data-testid={`link-download-${i}`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Download className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-mono text-white font-medium">{dl.quality}</p>
                <p className="text-xs font-mono text-gray-500">{dl.size}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-green-400 flex-shrink-0" />
          </a>
        );
      })}
    </div>
  );
}
