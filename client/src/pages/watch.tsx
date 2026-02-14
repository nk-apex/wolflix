import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Play, Download, ArrowLeft, Star, Calendar, Clock, ExternalLink, Loader2, Search, Maximize, Minimize, ChevronDown, ChevronLeft, ChevronRight, Tv2, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { type BWMDetail, getRating, getPosterUrl } from "@/lib/tmdb";
import wolflixLogo from "@assets/wolflix-logo.png";

function buildPlayerUrl(contentId: string, contentType: string, season: number, episode: number): string {
  if (!contentId) return "";
  if (contentType === "tv") {
    return `https://player.autoembed.cc/embed/tv/${contentId}/${season}/${episode}`;
  }
  return `https://player.autoembed.cc/embed/movie/${contentId}`;
}

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
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevIdRef = useRef(id);

  if (prevIdRef.current !== id) {
    prevIdRef.current = id;
    setSeason(1);
    setEpisode(1);
    setRenderCount(0);
    setShowDownloads(false);
    setPlayerLoaded(false);
    setSplashDone(false);
    if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
  }

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

  useEffect(() => {
    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    };
  }, []);

  const { data: bwmDetail, isLoading: detailLoading } = useQuery<BWMDetail>({
    queryKey: ["/api/bwm/title", id],
    enabled: !!id && id.startsWith("tt"),
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

  const playerUrl = buildPlayerUrl(id, type, season, episode);

  const isFirstEpisode = season <= 1 && episode <= 1;
  const isLastEpisode = season >= seasonCount && episode >= episodeCount;

  const goTo = useCallback((newSeason: number, newEpisode: number) => {
    setSeason(newSeason);
    setEpisode(newEpisode);
    setRenderCount(c => c + 1);
    setPlayerLoaded(false);
    setSplashDone(false);
    if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
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

  if (detailLoading && id.startsWith("tt")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="relative mb-6">
          <div className="absolute rounded-full border-[3px] border-transparent border-t-green-500 animate-spin" style={{ width: "6rem", height: "6rem", top: "-0.5rem", left: "-0.5rem" }} />
          <div className="absolute rounded-full border-[2px] border-transparent border-b-green-400/60 animate-spin" style={{ width: "7.5rem", height: "7.5rem", top: "-1.25rem", left: "-1.25rem", animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute rounded-full border-[2px] border-transparent border-l-green-300/30 animate-spin" style={{ width: "9rem", height: "9rem", top: "-2rem", left: "-2rem", animationDuration: "2.5s" }} />
          <img src={wolflixLogo} alt="WOLFLIX" className="w-20 h-20 rounded-2xl object-cover relative z-10" />
        </div>
        <p className="text-xl font-display font-bold text-white mb-1">
          WOLF<span className="text-green-400">LIX</span>
        </p>
        <p className="text-xs font-mono text-gray-500 animate-pulse mt-2">Preparing your stream...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        {posterUrl && (
          <div className="absolute inset-0 h-[500px]">
            <img src={posterUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
          </div>
        )}

        <div className="relative z-10 px-6 py-6 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-6 text-gray-400 font-mono"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {posterUrl && (
              <div className="flex-shrink-0">
                <GlassCard hover={false} className="overflow-hidden w-[250px]">
                  <img src={posterUrl} alt={title} className="w-full rounded-[1rem]" data-testid="img-poster" />
                </GlassCard>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-3" data-testid="text-watch-title">{title || `Content #${id}`}</h1>

              <div className="flex flex-wrap items-center gap-3 mb-4">
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
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres.map((g) => (
                    <Badge key={g} variant="outline" className="text-green-300 border-green-500/15 bg-green-500/10 font-mono" data-testid={`badge-genre-${g}`}>
                      {g}
                    </Badge>
                  ))}
                </div>
              )}

              {description && (
                <p className="text-sm text-gray-300 leading-relaxed mb-6 max-w-2xl" data-testid="text-watch-overview">
                  {description}
                </p>
              )}

              {seasonCount > 0 && (
                <p className="text-xs font-mono text-gray-500 mb-4" data-testid="text-seasons">
                  {seasonCount} Seasons {totalEpisodes > 0 ? `/ ${totalEpisodes} Episodes` : ""}
                </p>
              )}
            </div>
          </div>

          <div ref={playerSectionRef}>
            {type === "tv" && (
              <div className="flex items-center justify-between gap-3 mb-3 px-1 flex-wrap">
                <div className="flex items-center gap-3">
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
                  <div className="text-center" data-testid="text-current-playing">
                    <span className="text-white font-display font-bold text-base">
                      S{season} E{episode}
                    </span>
                  </div>
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
            )}

            <GlassPanel className="mb-4 p-0 overflow-hidden">
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
                  {!splashDone && (
                    <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${playerLoaded && splashDone ? "opacity-0 pointer-events-none" : "opacity-100"}`} data-testid="player-splash">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 -m-4 rounded-full border-[3px] border-transparent border-t-green-500 animate-spin" style={{ width: "calc(100% + 2rem)", height: "calc(100% + 2rem)", top: "-1rem", left: "-1rem" }} />
                        <div className="absolute inset-0 -m-7 rounded-full border-[2px] border-transparent border-b-green-400/60 animate-spin" style={{ width: "calc(100% + 3.5rem)", height: "calc(100% + 3.5rem)", top: "-1.75rem", left: "-1.75rem", animationDirection: "reverse", animationDuration: "1.5s" }} />
                        <div className="absolute inset-0 -m-10 rounded-full border-[2px] border-transparent border-l-green-300/30 animate-spin" style={{ width: "calc(100% + 5rem)", height: "calc(100% + 5rem)", top: "-2.5rem", left: "-2.5rem", animationDuration: "2.5s" }} />
                        <img src={wolflixLogo} alt="WOLFLIX" className="w-16 h-16 rounded-2xl object-cover relative z-10" />
                      </div>
                      <p className="text-lg font-display font-bold text-white mb-1">
                        WOLF<span className="text-green-400">LIX</span>
                      </p>
                      <p className="text-xs font-mono text-gray-500 animate-pulse">Loading stream...</p>
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    key={`player-${season}-${episode}-${renderCount}`}
                    src={playerUrl}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${splashDone ? "opacity-100" : "opacity-0"}`}
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media"
                    referrerPolicy="origin"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                    onLoad={() => {
                      setPlayerLoaded(true);
                      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
                      splashTimerRef.current = setTimeout(() => {
                        setSplashDone(true);
                      }, 8000);
                    }}
                    data-testid="iframe-player"
                  />
                </div>
              )}
            </GlassPanel>

            {type !== "tv" && (
              <div className="flex items-center justify-end gap-2 mb-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDownloads(!showDownloads)}
                  className="text-green-400 font-mono text-xs"
                  data-testid="button-toggle-downloads-movie"
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
                  data-testid="button-fullscreen-movie"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>

          {showDownloads && (
            <GlassPanel className="mb-8">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-4" data-testid="text-download-heading">
                <Download className="w-5 h-5 text-green-400" />
                Downloads
              </h2>
              <DownloadSection title={title} />
            </GlassPanel>
          )}

          {type === "tv" && seasonCount > 0 && (
            <GlassPanel className="mb-8">
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
                  <div className="flex items-center justify-between mb-2">
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
    queryKey: ["/api/arslan/search", title],
    queryFn: async () => {
      const res = await fetch(`/api/arslan/search?text=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!title && title.length > 1,
  });

  const firstResult = arslanSearch?.results?.[0];

  const { data: arslanMovie, isLoading: arslanMovieLoading } = useQuery<{ title?: string; links?: { quality: string; size: string; url: string }[] }>({
    queryKey: ["/api/arslan/movie", firstResult?.url],
    queryFn: async () => {
      const res = await fetch(`/api/arslan/movie?url=${encodeURIComponent(firstResult!.url)}`);
      if (!res.ok) throw new Error("Movie details failed");
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
            <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 font-mono text-xs gap-1">
              <ExternalLink className="w-3 h-3" />
              Download
            </Button>
          </a>
        );
      })}
    </div>
  );
}
